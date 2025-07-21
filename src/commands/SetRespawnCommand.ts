import { Vec3 } from "vec3";
import type { Bot } from "../core/Bot";
import type { ICommand } from "./ICommand";

/**
 * リスポーン地点設定コマンドクラス
 * 近くのベッドを使用してリスポーン地点を設定する
 */
export class SetRespawnCommand implements ICommand {
	/**
	 * コマンドを実行
	 * @param bot - 操作対象のボットインスタンス
	 * @param username - コマンドを実行したプレイヤー名
	 * @param args - コマンドの引数（使用しない）
	 */
	public async execute(
		bot: Bot,
		username: string,
		args: string[],
	): Promise<void> {
		try {
			console.log(
				`[${bot.getName()}] SetRespawn command executed by ${username}`,
			);

			// 周辺のベッドを検索
			const beds = this.findNearbyBeds(bot);

			if (beds.length === 0) {
				bot.sendMessage(
					"近くにベッドが見つかりません。ベッドに近づいてください。",
				);
				return;
			}

			// 最も近いベッドを選択
			const closestBed = beds.reduce((closest, current) => {
				const closestDistance = bot.mc.entity.position.distanceTo(
					closest.position,
				);
				const currentDistance = bot.mc.entity.position.distanceTo(
					current.position,
				);
				return currentDistance < closestDistance ? current : closest;
			});

			const distance = bot.mc.entity.position.distanceTo(closestBed.position);

			if (distance > 4) {
				bot.sendMessage(
					`ベッドまでの距離が遠すぎます（距離: ${distance.toFixed(1)}）。近づいてください。`,
				);
				return;
			}

			bot.sendMessage(
				`ベッドを使用してリスポーン地点を設定します... (${closestBed.position.x}, ${closestBed.position.y}, ${closestBed.position.z})`,
			);

			try {
				// ベッドを見つめる
				await bot.mc.lookAt(closestBed.position.offset(0.5, 0.5, 0.5));

				// 夜の場合は寝る、昼の場合はリスポーン地点のみ設定
				const timeOfDay = bot.mc.time.timeOfDay;
				const isNight = timeOfDay > 12000 && timeOfDay < 24000;

				if (isNight) {
					// 夜の場合は寝る
					await bot.mc.sleep(closestBed);
					bot.sendMessage("ベッドで寝ました。リスポーン地点が設定されました。");

					// 少し待ってから起きる
					setTimeout(async () => {
						try {
							await bot.mc.wake();
							bot.sendMessage("起きました。");
						} catch (error) {
							console.error("Error waking up:", error);
						}
					}, 2000);
				} else {
					// 昼の場合は右クリックでリスポーン地点を設定
					await bot.mc.activateBlock(closestBed);
					bot.sendMessage("リスポーン地点を設定しました。");
				}
			} catch (error) {
				if (error instanceof Error) {
					if (error.message.includes("cannot sleep")) {
						bot.sendMessage(
							"今は寝ることができません。敵が近くにいるか、時間が適切ではありません。",
						);
					} else if (error.message.includes("bed is occupied")) {
						bot.sendMessage("このベッドは既に使用されています。");
					} else {
						bot.sendMessage(
							`ベッドの使用中にエラーが発生しました: ${error.message}`,
						);
					}
				} else {
					bot.sendMessage("ベッドの使用中に不明なエラーが発生しました。");
				}
			}
		} catch (error) {
			console.error(`[${bot.getName()}] Error in setrespawn command:`, error);
			bot.sendMessage(
				`リスポーン地点設定中にエラーが発生しました: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	/**
	 * 近くのベッドを検索
	 * @param bot - 操作対象のボットインスタンス
	 * @returns ベッドのブロックリスト
	 */
	private findNearbyBeds(bot: Bot): any[] {
		const beds: any[] = [];
		const searchRadius = 10;
		const botPosition = bot.mc.entity.position;

		for (let x = -searchRadius; x <= searchRadius; x++) {
			for (let y = -searchRadius; y <= searchRadius; y++) {
				for (let z = -searchRadius; z <= searchRadius; z++) {
					const position = new Vec3(
						Math.floor(botPosition.x) + x,
						Math.floor(botPosition.y) + y,
						Math.floor(botPosition.z) + z,
					);

					const block = bot.mc.blockAt(position);
					if (block && this.isBed(block)) {
						beds.push(block);
					}
				}
			}
		}

		return beds;
	}

	/**
	 * ブロックがベッドかどうかを判定
	 * @param block - チェックするブロック
	 * @returns ベッドの場合true
	 */
	private isBed(block: any): boolean {
		return block.name.includes("bed") || block.name.includes("Bed");
	}

	/**
	 * コマンド名を取得
	 * @returns コマンド名
	 */
	public getName(): string {
		return "setrespawn";
	}

	/**
	 * コマンドの説明を取得
	 * @returns コマンドの説明
	 */
	public getDescription(): string {
		return "近くのベッドを使用してリスポーン地点を設定します";
	}

	/**
	 * コマンドの使用法を取得
	 * @returns コマンドの使用法
	 */
	public getUsage(): string {
		return "@botname setrespawn";
	}
}
