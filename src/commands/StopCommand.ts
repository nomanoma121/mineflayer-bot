import type { Bot } from "../core/Bot";
import type { ICommand } from "./ICommand";

/**
 * 停止コマンドクラス
 * ボットの現在の行動をすべて停止させるコマンド
 * コマンドパターンの具体的な実装
 */
export class StopCommand implements ICommand {
	/**
	 * コマンドを実行
	 * @param bot - 操作対象のボットインスタンス
	 * @param username - コマンドを実行したプレイヤー名
	 * @param args - コマンドの引数（このコマンドでは使用しない）
	 */
	public async execute(
		bot: Bot,
		username: string,
		args: string[],
	): Promise<void> {
		try {
			console.log(
				`[${bot.getName()}] Executing stop command requested by ${username}`,
			);

			if (args.length > 0) {
				bot.sendMessage("使用法: @botname stop または @all stop");
				return;
			}

			// パスファインダーによる移動を停止
			if (bot.mc.pathfinder) {
				bot.mc.pathfinder.stop();
				console.log(`[${bot.getName()}] Pathfinding stopped`);
			}

			// その他の進行中のタスクを停止
			// TODO: 将来的に追加される他のタスクの停止処理をここに追加

			// 待機状態に遷移
			await bot.changeStateToIdle();

			// 成功メッセージを送信
			bot.sendMessage(
				`${username}さんの指示により、すべての行動を停止しました。`,
			);
		} catch (error) {
			console.error(`[${bot.getName()}] Error in stop command:`, error);
			bot.sendMessage(
				"停止処理中にエラーが発生しましたが、可能な限り停止を試みました。",
			);

			// エラーが発生してもIdleStateに遷移
			await bot.changeStateToIdle();
		}
	}

	/**
	 * コマンド名を取得
	 * @returns コマンド名
	 */
	public getName(): string {
		return "stop";
	}

	/**
	 * コマンドの説明を取得
	 * @returns コマンドの説明
	 */
	public getDescription(): string {
		return "ボットの現在の行動をすべて停止し、待機状態にします";
	}

	/**
	 * コマンドの使用法を取得
	 * @returns コマンドの使用法
	 */
	public getUsage(): string {
		return "@<botname> stop または @all stop";
	}
}
