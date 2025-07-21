import type { Bot } from "../core/Bot";

/**
 * コマンド実行時の共通エラーハンドリングユーティリティ
 */
export class CommandUtils {
	/**
	 * コマンド実行時の標準的なエラーハンドリング
	 * @param bot - ボットインスタンス
	 * @param commandName - コマンド名
	 * @param error - エラーオブジェクト
	 * @param customMessage - カスタムエラーメッセージ（オプション）
	 */
	public static handleCommandError(
		bot: Bot,
		commandName: string,
		error: unknown,
		customMessage?: string,
	): void {
		console.error(`[${bot.getName()}] Error in ${commandName} command:`, error);

		const errorMessage =
			customMessage ||
			`${commandName}コマンドの実行中にエラーが発生しました: ${
				error instanceof Error ? error.message : "Unknown error"
			}`;

		bot.sendMessage(errorMessage);
	}

	/**
	 * 引数の数を検証
	 * @param args - 引数配列
	 * @param expectedCount - 期待される引数の数
	 * @param usage - 使用法メッセージ
	 * @param bot - ボットインスタンス
	 * @returns 検証が成功したかどうか
	 */
	public static validateArgumentCount(
		args: string[],
		expectedCount: number,
		usage: string,
		bot: Bot,
	): boolean {
		if (args.length < expectedCount) {
			bot.sendMessage(`使用法: ${usage}`);
			return false;
		}
		return true;
	}

	/**
	 * 引数の数を検証（最小・最大）
	 * @param args - 引数配列
	 * @param minCount - 最小引数数
	 * @param maxCount - 最大引数数
	 * @param usage - 使用法メッセージ
	 * @param bot - ボットインスタンス
	 * @returns 検証が成功したかどうか
	 */
	public static validateArgumentRange(
		args: string[],
		minCount: number,
		maxCount: number,
		usage: string,
		bot: Bot,
	): boolean {
		if (args.length < minCount || args.length > maxCount) {
			bot.sendMessage(`使用法: ${usage}`);
			return false;
		}
		return true;
	}

	/**
	 * 数値引数を解析・検証
	 * @param value - 解析する文字列
	 * @param paramName - パラメータ名（エラーメッセージ用）
	 * @param bot - ボットインスタンス
	 * @returns 解析された数値、またはnull（エラー時）
	 */
	public static parseNumber(
		value: string,
		paramName: string,
		bot: Bot,
	): number | null {
		const parsed = parseInt(value, 10);
		if (isNaN(parsed)) {
			bot.sendMessage(`${paramName}は有効な数値で指定してください。`);
			return null;
		}
		return parsed;
	}

	/**
	 * コマンド実行ログを出力
	 * @param bot - ボットインスタンス
	 * @param commandName - コマンド名
	 * @param username - 実行者
	 * @param args - 引数（オプション）
	 */
	public static logCommandExecution(
		bot: Bot,
		commandName: string,
		username: string,
		args?: string[],
	): void {
		const argsStr =
			args && args.length > 0 ? ` with args: [${args.join(", ")}]` : "";
		console.log(
			`[${bot.getName()}] ${commandName} command executed by ${username}${argsStr}`,
		);
	}
}
