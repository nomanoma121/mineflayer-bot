import { Vec3 } from "vec3";
import type { Bot } from "../core/Bot";
import type { ICommand } from "./ICommand";

/**
 * ブロック設置コマンドクラス
 * 指定されたアイテムを指定された座標に設置する
 */
export class PlaceCommand implements ICommand {
	/**
	 * コマンドを実行
	 * @param bot - 操作対象のボットインスタンス
	 * @param username - コマンドを実行したプレイヤー名
	 * @param args - コマンドの引数 [アイテム名, x, y, z] または [アイテム名]
	 */
	public async execute(
		bot: Bot,
		username: string,
		args: string[],
	): Promise<void> {
		try {
			console.log(`[${bot.getName()}] Place command executed by ${username}`);

			if (args.length === 0) {
				bot.sendMessage("使用法: @botname place <アイテム名> [x y z]");
				return;
			}

			const itemName = args[0];
			let targetPosition: Vec3;

			if (args.length === 4) {
				// 座標指定の場合
				const x = parseInt(args[1]);
				const y = parseInt(args[2]);
				const z = parseInt(args[3]);

				if (isNaN(x) || isNaN(y) || isNaN(z)) {
					bot.sendMessage(
						"座標は数値で指定してください。使用法: @botname place <アイテム名> <x> <y> <z>",
					);
					return;
				}

				targetPosition = new Vec3(x, y, z);
			} else if (args.length === 1) {
				// 現在見ているブロックの隣に設置
				const targetBlock = bot.mc.blockAtCursor();
				if (!targetBlock) {
					bot.sendMessage(
						"設置する場所が見つかりません。ブロックを見つめてください。",
					);
					return;
				}

				// 設置位置は見ているブロックの上
				targetPosition = targetBlock.position.offset(0, 1, 0);
			} else {
				bot.sendMessage("使用法: @botname place <アイテム名> [x y z]");
				return;
			}

			// アイテムをインベントリから検索
			const item = bot.mc.inventory
				.items()
				.find(
					(item) =>
						item.name.toLowerCase().includes(itemName.toLowerCase()) ||
						item.displayName.toLowerCase().includes(itemName.toLowerCase()),
				);

			if (!item) {
				bot.sendMessage(`アイテム「${itemName}」が見つかりません。`);
				return;
			}

			// 設置位置の距離チェック
			const distance = bot.mc.entity.position.distanceTo(targetPosition);
			if (distance > 6) {
				bot.sendMessage(
					`設置位置までの距離が遠すぎます（距離: ${distance.toFixed(1)}）。近づいてください。`,
				);
				return;
			}

			// 設置位置が空いているかチェック
			const blockAtPosition = bot.mc.blockAt(targetPosition);
			if (blockAtPosition && blockAtPosition.name !== "air") {
				bot.sendMessage(
					`設置位置 (${targetPosition.x}, ${targetPosition.y}, ${targetPosition.z}) には既にブロックがあります。`,
				);
				return;
			}

			// 設置する面を見つける（設置位置の下のブロック）
			const referenceBlock = bot.mc.blockAt(targetPosition.offset(0, -1, 0));
			if (!referenceBlock || referenceBlock.name === "air") {
				bot.sendMessage("設置する面が見つかりません。");
				return;
			}

			bot.sendMessage(
				`${item.displayName} を設置します... (${targetPosition.x}, ${targetPosition.y}, ${targetPosition.z})`,
			);

			// アイテムを装備
			await bot.mc.equip(item, "hand");

			// ブロックを設置
			await bot.mc.placeBlock(referenceBlock, new Vec3(0, 1, 0));

			bot.sendMessage(`${item.displayName} を設置しました！`);
		} catch (error) {
			console.error(`[${bot.getName()}] Error in place command:`, error);
			bot.sendMessage(
				`設置中にエラーが発生しました: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	/**
	 * コマンド名を取得
	 * @returns コマンド名
	 */
	public getName(): string {
		return "place";
	}

	/**
	 * コマンドの説明を取得
	 * @returns コマンドの説明
	 */
	public getDescription(): string {
		return "ブロックを設置します。座標指定または見ている場所に設置します";
	}

	/**
	 * コマンドの使用法を取得
	 * @returns コマンドの使用法
	 */
	public getUsage(): string {
		return "@botname place <アイテム名> [x y z]";
	}
}
