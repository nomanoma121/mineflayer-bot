import type { Bot } from "../core/Bot";
import { ServantState } from "../states/ServantState";
import type { ICommand } from "./ICommand";

/**
 * サーバントコマンドクラス
 * ボットを指定されたマスターに仕える「サーバントモード」に移行させる
 */
export class ServantCommand implements ICommand {
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
			// マスターとなるプレイヤー名を決定
			let masterName: string;

			if (args.length > 0) {
				// 引数でマスターが指定された場合
				masterName = args[0];
			} else {
				// 引数がない場合、コマンド実行者をマスターとする
				masterName = username;
			}

			console.log(
				`[${bot.getName()}] Servant command executed by ${username}, master: ${masterName}`,
			);

			// マスターとなるプレイヤーがサーバーに存在するかチェック
			const master = bot.mc.players[masterName];
			if (!master) {
				bot.sendMessage(
					`エラー: プレイヤー '${masterName}' が見つかりません。`,
				);
				console.log(
					`[${bot.getName()}] Master player '${masterName}' not found`,
				);
				return;
			}

			// マスターが実際にワールドに存在するかチェック
			if (!master.entity) {
				bot.sendMessage(
					`エラー: プレイヤー '${masterName}' はワールドに存在しません。`,
				);
				console.log(
					`[${bot.getName()}] Master player '${masterName}' entity not found`,
				);
				return;
			}

			// 現在の状態をログに出力
			const currentState = bot.getCurrentState();
			const currentStateName = currentState
				? currentState.getName()
				: "Unknown";

			console.log(
				`[${bot.getName()}] Changing state from ${currentStateName} to Servant`,
			);

			// サーバント状態に遷移
			await bot.changeState(new ServantState(bot, masterName));

			// 成功メッセージを送信
			if (masterName === username) {
				bot.sendMessage(
					`${username}様のサーバントになりました。お守りいたします。`,
				);
			} else {
				bot.sendMessage(
					`${username}様の指示により、${masterName}様のサーバントになりました。`,
				);
			}
		} catch (error) {
			console.error(`[${bot.getName()}] Error in servant command:`, error);
			bot.sendMessage("サーバントモードへの移行中にエラーが発生しました。");
		}
	}

	/**
	 * コマンド名を取得
	 * @returns コマンド名
	 */
	public getName(): string {
		return "servant";
	}

	/**
	 * コマンドの説明を取得
	 * @returns コマンドの説明
	 */
	public getDescription(): string {
		return "指定されたプレイヤーのサーバントになり、マスターを追従・護衛します";
	}

	/**
	 * コマンドの使用法を取得
	 * @returns コマンドの使用法
	 */
	public getUsage(): string {
		return "@bot servant [マスター名] - 指定プレイヤー（省略時は実行者）のサーバントになる";
	}
}
