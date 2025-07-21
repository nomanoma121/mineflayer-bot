import { Vec3 } from "vec3";
import type { Bot } from "../core/Bot";
import { FarmingState } from "../states/FarmingState";
import type { ICommand } from "./ICommand";

/**
 * 農夫コマンドクラス
 * ボットを農業モードに移行させる
 */
export class FarmerCommand implements ICommand {
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
			// 引数から畑の座標を解析
			if (args.length < 6) {
				bot.sendMessage("使用法: @bot farmer <x1> <y1> <z1> <x2> <y2> <z2>");
				bot.sendMessage("例: @bot farmer 100 64 200 120 64 220");
				return;
			}

			const coords = args.slice(0, 6).map((arg) => parseInt(arg, 10));

			// 座標の妥当性をチェック
			if (coords.some((coord) => Number.isNaN(coord))) {
				bot.sendMessage("エラー: すべての座標は整数で指定してください。");
				return;
			}

			const [x1, y1, z1, x2, y2, z2] = coords;
			const corner1 = new Vec3(x1, y1, z1);
			const corner2 = new Vec3(x2, y2, z2);

			// 畑のサイズをチェック
			const area = Math.abs(x2 - x1) * Math.abs(z2 - z1);
			if (area > 10000) {
				// 100x100ブロック以上の場合は警告
				bot.sendMessage(
					"警告: 畑のサイズが大きすぎます。処理に時間がかかる可能性があります。",
				);
			}

			console.log(`[${bot.getName()}] Farmer command executed by ${username}`);
			console.log(
				`[${bot.getName()}] Farm area: (${x1},${y1},${z1}) to (${x2},${y2},${z2})`,
			);

			// 現在の状態をログに出力
			const currentState = bot.getCurrentState();
			const currentStateName = currentState
				? currentState.getName()
				: "Unknown";

			console.log(
				`[${bot.getName()}] Changing state from ${currentStateName} to Farming`,
			);

			// 農業状態に遷移
			await bot.changeState(new FarmingState(bot, corner1, corner2));

			// 成功メッセージを送信
			bot.sendMessage(
				`${username}様の指示により、指定された畑での農業作業を開始します。`,
			);
			bot.sendMessage(`畑エリア: (${x1},${y1},${z1}) から (${x2},${y2},${z2})`);
		} catch (error) {
			console.error(`[${bot.getName()}] Error in farmer command:`, error);
			bot.sendMessage("農業モードへの移行中にエラーが発生しました。");
		}
	}

	/**
	 * コマンド名を取得
	 * @returns コマンド名
	 */
	public getName(): string {
		return "farmer";
	}

	/**
	 * コマンドの説明を取得
	 * @returns コマンドの説明
	 */
	public getDescription(): string {
		return "指定された畑エリアで作物の収穫と植え直しを行う農業モードに移行します";
	}

	/**
	 * コマンドの使用法を取得
	 * @returns コマンドの使用法
	 */
	public getUsage(): string {
		return "@bot farmer <x1> <y1> <z1> <x2> <y2> <z2> - 畑の対角線座標を指定して農業開始";
	}
}
