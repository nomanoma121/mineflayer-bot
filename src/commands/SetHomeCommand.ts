import { Vec3 } from "vec3";
import type { Bot } from "../core/Bot";
import type { ICommand } from "./ICommand";

/**
 * 拠点設定コマンドクラス
 * 現在地を「拠点」として記憶する
 */
export class SetHomeCommand implements ICommand {
	// 拠点情報を保存するためのマップ（ボット名 -> 拠点座標）
	private static homePositions: Map<string, Vec3> = new Map();

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
			console.log(`[${bot.getName()}] Setting home position for ${username}`);

			if (args.length > 0) {
				bot.sendMessage("使用法: @botname sethome");
				return;
			}

			const currentPosition = bot.mc.entity.position;
			const homePosition = new Vec3(
				Math.floor(currentPosition.x),
				Math.floor(currentPosition.y),
				Math.floor(currentPosition.z),
			);

			// 拠点位置を保存
			SetHomeCommand.homePositions.set(bot.getName(), homePosition);

			bot.sendMessage(
				`拠点を設定しました: (${homePosition.x}, ${homePosition.y}, ${homePosition.z})`,
			);

			console.log(
				`[${bot.getName()}] Home position set to: (${homePosition.x}, ${homePosition.y}, ${homePosition.z})`,
			);
		} catch (error) {
			console.error(`[${bot.getName()}] Error in sethome command:`, error);
			bot.sendMessage(
				`拠点設定中にエラーが発生しました: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	/**
	 * 指定されたボットの拠点位置を取得
	 * @param botName - ボット名
	 * @returns 拠点位置（設定されていない場合はnull）
	 */
	public static getHomePosition(botName: string): Vec3 | null {
		return SetHomeCommand.homePositions.get(botName) || null;
	}

	/**
	 * 指定されたボットの拠点位置を削除
	 * @param botName - ボット名
	 */
	public static clearHomePosition(botName: string): void {
		SetHomeCommand.homePositions.delete(botName);
	}

	/**
	 * すべての拠点位置を取得
	 * @returns すべての拠点位置のマップ
	 */
	public static getAllHomePositions(): Map<string, Vec3> {
		return new Map(SetHomeCommand.homePositions);
	}

	/**
	 * コマンド名を取得
	 * @returns コマンド名
	 */
	public getName(): string {
		return "sethome";
	}

	/**
	 * コマンドの説明を取得
	 * @returns コマンドの説明
	 */
	public getDescription(): string {
		return "現在地を「拠点」として記憶します";
	}

	/**
	 * コマンドの使用法を取得
	 * @returns コマンドの使用法
	 */
	public getUsage(): string {
		return "@<botname> sethome";
	}
}
