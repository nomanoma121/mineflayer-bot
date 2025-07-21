import type { Bot } from "../core/Bot";
import { MovingState } from "../states/MovingState";
import type { ICommand } from "./ICommand";
import { SetHomeCommand } from "./SetHomeCommand";

/**
 * ホーム帰還コマンドクラス
 * 設定済みの拠点位置にボットを帰還させる
 */
export class HomeCommand implements ICommand {
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
			console.log(`[${bot.getName()}] Home command executed by ${username}`);

			if (args.length > 0) {
				bot.sendMessage("使用法: @botname home");
				return;
			}

			const homePosition = SetHomeCommand.getHomePosition(bot.getName());

			if (!homePosition) {
				bot.sendMessage(
					"拠点が設定されていません。@botname sethome で拠点を設定してください。",
				);
				return;
			}

			bot.sendMessage(
				`拠点に帰還します: (${homePosition.x}, ${homePosition.y}, ${homePosition.z})`,
			);

			// MovingStateを使用して移動処理を実行
			const movingState = new MovingState(bot, homePosition, () => {
				bot.sendMessage("拠点に帰還しました！");
			});

			await bot.changeState(movingState);
		} catch (error) {
			console.error(`[${bot.getName()}] Error in home command:`, error);
			bot.sendMessage(
				`拠点帰還中にエラーが発生しました: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	/**
	 * コマンド名を取得
	 * @returns コマンド名
	 */
	public getName(): string {
		return "home";
	}

	/**
	 * コマンドの説明を取得
	 * @returns コマンドの説明
	 */
	public getDescription(): string {
		return "設定済みの拠点位置にボットを帰還させます";
	}

	/**
	 * コマンドの使用法を取得
	 * @returns コマンドの使用法
	 */
	public getUsage(): string {
		return "@botname home";
	}
}
