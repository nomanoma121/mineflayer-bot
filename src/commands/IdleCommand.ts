import type { Bot } from "../core/Bot";
import type { ICommand } from "./ICommand";

/**
 * 待機状態移行コマンドクラス
 * ボットを強制的に待機状態に移行させるコマンド
 * 何らかの状態で動作している際に、手動で待機状態に戻したい場合に使用
 */
export class IdleCommand implements ICommand {
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
				`[${bot.getName()}] Executing idle command requested by ${username}`,
			);

			if (args.length > 0) {
				bot.say.say("使用法: @botname idle");
				return;
			}

			const currentStateName = bot.getCurrentState()?.getName() || "Unknown";

			// 既に待機状態の場合
			if (currentStateName === "Idle") {
				bot.say.say("既に待機状態です。");
				return;
			}

			// 待機状態に遷移
			await bot.changeStateToIdle();

			// 成功メッセージを送信
			bot.say.reportSuccess(
				`${username}さんの指示により、待機状態に移行しました。（前の状態: ${currentStateName}）`,
			);
		} catch (error) {
			console.error(`[${bot.getName()}] Error in idle command:`, error);
			bot.say.reportError("待機状態への移行中にエラーが発生しました。");

			// エラーが発生してもIdleStateに遷移を試みる
			await bot.changeStateToIdle();
		}
	}

	/**
	 * コマンド名を取得
	 * @returns コマンド名
	 */
	public getName(): string {
		return "idle";
	}

	/**
	 * コマンドの説明を取得
	 * @returns コマンドの説明
	 */
	public getDescription(): string {
		return "ボットを待機状態に移行させます";
	}

	/**
	 * コマンドの使用法を取得
	 * @returns コマンドの使用法
	 */
	public getUsage(): string {
		return "@<botname> idle";
	}
}
