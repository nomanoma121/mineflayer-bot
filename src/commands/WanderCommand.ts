import type { Bot } from "../core/Bot";
import { WanderingState } from "../states/WanderingState";
import type { ICommand } from "./ICommand";

/**
 * 放浪コマンドクラス
 * ボットを指定された範囲内でランダムに移動させる放浪モードに移行させる
 */
export class WanderCommand implements ICommand {
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
			// 引数から範囲を読み取り（なければデフォルト値30）
			let range = 30;

			if (args.length > 0) {
				const parsedRange = parseInt(args[0], 10);
				if (!isNaN(parsedRange) && parsedRange > 0 && parsedRange <= 100) {
					range = parsedRange;
				} else {
					bot.sendMessage(
						`エラー: 範囲は1〜100の整数で指定してください。デフォルト値(30)を使用します。`,
					);
				}
			}

			console.log(
				`[${bot.getName()}] Wander command executed by ${username}, range: ${range}`,
			);

			// 現在の状態をログに出力
			const currentState = bot.getCurrentState();
			const currentStateName = currentState
				? currentState.getName()
				: "Unknown";

			console.log(
				`[${bot.getName()}] Changing state from ${currentStateName} to Wandering`,
			);

			// 放浪状態に遷移（状態遷移の完了を待つ）
			await bot.changeState(new WanderingState(bot, range));

			// 成功メッセージを送信
			bot.sendMessage(
				`${username}様の指示により、${range}ブロック範囲で放浪を開始します。`,
			);
		} catch (error) {
			console.error(`[${bot.getName()}] Error in wander command:`, error);
			bot.sendMessage("放浪モードへの移行中にエラーが発生しました。");
		}
	}

	/**
	 * コマンド名を取得
	 * @returns コマンド名
	 */
	public getName(): string {
		return "wander";
	}

	/**
	 * コマンドの説明を取得
	 * @returns コマンドの説明
	 */
	public getDescription(): string {
		return "指定された範囲内をランダムに移動し続ける放浪モードに移行します";
	}

	/**
	 * コマンドの使用法を取得
	 * @returns コマンドの使用法
	 */
	public getUsage(): string {
		return "@bot wander [範囲] - 指定範囲内（デフォルト30ブロック）で放浪開始";
	}
}
