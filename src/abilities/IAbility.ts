import type { Bot } from "../core/Bot";

/**
 * アビリティの基底インターフェース
 * 全てのアビリティはこのインターフェースを実装する必要があります
 */
export interface IAbility {
	/**
	 * アビリティの名前を取得
	 * @returns アビリティの名前
	 */
	getName(): string;

	/**
	 * アビリティの説明を取得
	 * @returns アビリティの説明
	 */
	getDescription(): string;

	/**
	 * アビリティの初期化
	 * @param bot ボットインスタンス
	 */
	initialize(bot: Bot): void;

	/**
	 * アビリティが利用可能かどうかを判定
	 * @returns 利用可能な場合はtrue
	 */
	isAvailable(): boolean;
}
