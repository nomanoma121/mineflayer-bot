import type { Bot } from "../core/Bot";
import { FollowingState } from "../states/FollowingState";
import type { ICommand } from "./ICommand";

/**
 * プレイヤー追従コマンドクラス
 * 指定されたプレイヤーを一定距離で追従する
 */
export class ComeCommand implements ICommand {
	/**
	 * コマンドを実行
	 * @param bot - 操作対象のボットインスタンス
	 * @param username - コマンドを実行したプレイヤー名
	 * @param args - コマンドの引数 [プレイヤー名]
	 */
	public async execute(
		bot: Bot,
		username: string,
		args: string[],
	): Promise<void> {
		try {
			// 引数の検証 - 指定がない場合はコマンド実行者をターゲットにする
			const targetPlayerName = args.length > 0 ? args[0] : username;

			// ターゲットプレイヤーがオンラインかチェック
			const targetPlayer = bot.mc.players[targetPlayerName];
			if (!targetPlayer || !targetPlayer.entity) {
				bot.sendMessage(`プレイヤー「${targetPlayerName}」が見つかりません。`);
				return;
			}

			console.log(
				`[${bot.getName()}] Starting to follow player: ${targetPlayerName}`,
			);

			// ボット番号から追従距離を計算（もしくはデフォルト2）
			const botNumber = parseInt(bot.getName().replace("bot", ""), 10);
			const followDistance = 1 + (isNaN(botNumber) ? 1 : botNumber);

			bot.sendMessage(`${targetPlayerName}さんの追従を開始します。`);

			// FollowingStateに遷移
			const followingState = new FollowingState(
				bot,
				targetPlayerName,
				followDistance,
			);
			await bot.changeState(followingState);
		} catch (error) {
			console.error(`[${bot.getName()}] Error in come command:`, error);
			bot.sendMessage(
				`追従コマンドの実行中にエラーが発生しました: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	/**
	 * コマンド名を取得
	 * @returns コマンド名
	 */
	public getName(): string {
		return "come";
	}

	/**
	 * コマンドの説明を取得
	 * @returns コマンドの説明
	 */
	public getDescription(): string {
		return "指定されたプレイヤーを一定距離で追従します（省略時はコマンド実行者）";
	}

	/**
	 * コマンドの使用法を取得
	 * @returns コマンドの使用法
	 */
	public getUsage(): string {
		return "@<botname> come [プレイヤー名]";
	}
}
