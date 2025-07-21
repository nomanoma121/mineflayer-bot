import { Vec3 } from "vec3";
import type { Bot } from "../core/Bot";
import { MiningState } from "../states/MiningState";
import type { ICommand } from "./ICommand";

/**
 * 採掘コマンドクラス
 * ボットを採掘モードに移行させる
 */
export class MinerCommand implements ICommand {
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
			// 引数から採掘範囲の座標を解析
			if (args.length < 6) {
				bot.sendMessage("使用法: @bot miner <x1> <y1> <z1> <x2> <y2> <z2>");
				bot.sendMessage("例: @bot miner 100 50 200 120 60 220");
				return;
			}

			const coords = args.slice(0, 6).map((arg) => parseInt(arg, 10));

			// 座標の妥当性をチェック
			if (coords.some((coord) => Number.isNaN(coord))) {
				bot.sendMessage("エラー: すべての座標は整数で指定してください。");
				return;
			}

			const [x1, y1, z1, x2, y2, z2] = coords;

			// Y座標の安全性をチェック
			if (Math.min(y1, y2) < 5) {
				bot.sendMessage(
					"警告: Y座標が5未満です。岩盤に近いため注意してください。",
				);
			}
			if (Math.max(y1, y2) > 100) {
				bot.sendMessage(
					"警告: Y座標が100を超えています。地上での採掘になります。",
				);
			}

			const corner1 = new Vec3(x1, y1, z1);
			const corner2 = new Vec3(x2, y2, z2);

			// 採掘エリアのサイズをチェック
			const volume = Math.abs(x2 - x1) * Math.abs(y2 - y1) * Math.abs(z2 - z1);
			if (volume > 50000) {
				// 50x50x20ブロック以上の場合は警告
				bot.sendMessage(
					"警告: 採掘エリアが大きすぎます。処理に非常に時間がかかる可能性があります。",
				);
			}

			console.log(`[${bot.getName()}] Miner command executed by ${username}`);
			console.log(
				`[${bot.getName()}] Mining area: (${x1},${y1},${z1}) to (${x2},${y2},${z2}), Volume: ${volume} blocks`,
			);

			// 現在の状態をログに出力
			const currentState = bot.getCurrentState();
			const currentStateName = currentState
				? currentState.getName()
				: "Unknown";

			console.log(
				`[${bot.getName()}] Changing state from ${currentStateName} to Mining`,
			);

			// 採掘状態に遷移
			await bot.changeState(new MiningState(bot, corner1, corner2));

			// 成功メッセージを送信
			bot.sendMessage(
				`${username}様の指示により、指定された範囲での採掘作業を開始します。`,
			);
			bot.sendMessage(
				`採掘エリア: (${x1},${y1},${z1}) から (${x2},${y2},${z2})`,
			);
			bot.sendMessage(`予定ブロック数: ${volume}個`);
		} catch (error) {
			console.error(`[${bot.getName()}] Error in miner command:`, error);
			bot.sendMessage("採掘モードへの移行中にエラーが発生しました。");
		}
	}

	/**
	 * コマンド名を取得
	 * @returns コマンド名
	 */
	public getName(): string {
		return "miner";
	}

	/**
	 * コマンドの説明を取得
	 * @returns コマンドの説明
	 */
	public getDescription(): string {
		return "指定された範囲内で組織的な採掘作業を行う採掘モードに移行します";
	}

	/**
	 * コマンドの使用法を取得
	 * @returns コマンドの使用法
	 */
	public getUsage(): string {
		return "@bot miner <x1> <y1> <z1> <x2> <y2> <z2> - 採掘範囲の対角線座標を指定して採掘開始";
	}
}
