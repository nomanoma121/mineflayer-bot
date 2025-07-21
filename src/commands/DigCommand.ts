import { Vec3 } from "vec3";
import type { Bot } from "../core/Bot";
import type { ICommand } from "./ICommand";

/**
 * ブロック掘削コマンドクラス
 * 指定された座標またはターゲットのブロックを掘る
 */
export class DigCommand implements ICommand {
	/**
	 * コマンドを実行
	 * @param bot - 操作対象のボットインスタンス
	 * @param username - コマンドを実行したプレイヤー名
	 * @param args - コマンドの引数 [x, y, z] または空で目標ブロック
	 */
	public async execute(
		bot: Bot,
		username: string,
		args: string[],
	): Promise<void> {
		try {
			console.log(`[${bot.getName()}] Dig command executed by ${username}`);

			let targetBlock = null;

			if (args.length === 3) {
				// 座標指定の場合
				const x = parseInt(args[0]);
				const y = parseInt(args[1]);
				const z = parseInt(args[2]);

				if (Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(z)) {
					bot.sendMessage(
						"座標は数値で指定してください。使用法: @botname dig <x> <y> <z>",
					);
					return;
				}

				const targetPosition = new Vec3(x, y, z);
				targetBlock = bot.mc.blockAt(targetPosition);
			} else if (args.length === 0) {
				// ターゲットブロックを取得（見ているブロック）
				targetBlock = bot.mc.targetDigBlock;
			} else {
				bot.sendMessage(
					"使用法: @botname dig [x y z] （座標指定なしの場合は見ているブロックを掘ります）",
				);
				return;
			}

			if (!targetBlock) {
				bot.sendMessage("掘るブロックが見つかりません。");
				return;
			}

			// 掘れないブロックをチェック
			if (
				targetBlock.name === "air" ||
				targetBlock.name === "water" ||
				targetBlock.name === "lava"
			) {
				bot.sendMessage(`${targetBlock.name} は掘ることができません。`);
				return;
			}

			// 距離チェック
			const distance = bot.mc.entity.position.distanceTo(targetBlock.position);
			if (distance > 6) {
				bot.sendMessage(
					`ブロックまでの距離が遠すぎます（距離: ${distance.toFixed(1)}）。近づいてください。`,
				);
				return;
			}

			bot.sendMessage(
				`${targetBlock.name} を掘り始めます... (${targetBlock.position.x}, ${targetBlock.position.y}, ${targetBlock.position.z})`,
			);

			// 掘削開始
			await bot.mc.dig(targetBlock);

			bot.sendMessage(`${targetBlock.name} を掘り終わりました！`);
		} catch (error) {
			console.error(`[${bot.getName()}] Error in dig command:`, error);
			bot.sendMessage(
				`掘削中にエラーが発生しました: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	/**
	 * コマンド名を取得
	 * @returns コマンド名
	 */
	public getName(): string {
		return "dig";
	}

	/**
	 * コマンドの説明を取得
	 * @returns コマンドの説明
	 */
	public getDescription(): string {
		return "ブロックを掘ります。座標指定または見ているブロックを掘ります";
	}

	/**
	 * コマンドの使用法を取得
	 * @returns コマンドの使用法
	 */
	public getUsage(): string {
		return "@botname dig [x y z]";
	}
}
