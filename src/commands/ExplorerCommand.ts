import type { Bot } from "../core/Bot";
import { ExploringState } from "../states/ExploringState";
import type { ICommand } from "./ICommand";

/**
 * 探検コマンドクラス
 * ボットを未踏の領域を探索する探検モードに移行させる
 */
export class ExplorerCommand implements ICommand {
	/**
	 * コマンドを実行
	 * @param bot - 操作対象のボットインスタンス
	 * @param username - コマンドを実行したプレイヤーのユーザー名
	 * @param args - コマンドの引数配列
	 */
	public async execute(
		bot: Bot,
		username: string,
		args: string[],
	): Promise<void> {
		try {
			console.log(
				`[${bot.getName()}] Explorer command executed by ${username}`,
			);

			// 現在の状態をログに出力
			const currentState = bot.getCurrentState();
			const currentStateName = currentState
				? currentState.getName()
				: "Unknown";

			console.log(
				`[${bot.getName()}] Changing state from ${currentStateName} to Exploring`,
			);

			// 探検状態に遷移
			await bot.changeState(new ExploringState(bot));

			// 成功メッセージを送信
			bot.sendMessage(
				`${username}様の指示により、未踏の領域の探検を開始します。`,
			);
		} catch (error) {
			console.error(`[${bot.getName()}] Error in explorer command:`, error);
			bot.sendMessage("探検モードへの移行中にエラーが発生しました。");
		}
	}

	/**
	 * コマンド名を取得
	 * @returns コマンド名
	 */
	public getName(): string {
		return "explorer";
	}

	/**
	 * コマンドの説明を取得
	 * @returns コマンドの説明
	 */
	public getDescription(): string {
		return "未踏の領域を探索する探検モードに移行します";
	}

	/**
	 * コマンドの使用法を取得
	 * @returns コマンドの使用法
	 */
	public getUsage(): string {
		return "@bot explorer - 未踏の領域を探索開始";
	}
}
