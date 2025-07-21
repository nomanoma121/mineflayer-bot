import { Vec3 } from "vec3";
import type { Bot } from "../core/Bot";
import type { IAbility } from "./IAbility";

/**
 * Vitals（生命維持）アビリティ
 * ボット自身の生存状態を管理する能力
 */
export class VitalsAbility implements IAbility {
	private bot: Bot | null = null;

	getName(): string {
		return "Vitals";
	}

	getDescription(): string {
		return "ボット自身の生存状態（体力、空腹度など）を管理します";
	}

	initialize(bot: Bot): void {
		this.bot = bot;
	}

	isAvailable(): boolean {
		return this.bot !== null;
	}

	/**
	 * 体力が指定した閾値を下回っているか判定
	 * @param threshold 閾値（デフォルト: 10）
	 * @returns 体力が閾値以下の場合はtrue
	 */
	isHealthLow(threshold: number = 10): boolean {
		if (!this.bot) return false;
		return this.bot.mc.health <= threshold;
	}

	/**
	 * 空腹度が指定した閾値を下回っているか判定
	 * @param threshold 閾値（デフォルト: 10）
	 * @returns 空腹度が閾値以下の場合はtrue
	 */
	isHungerLow(threshold: number = 10): boolean {
		if (!this.bot) return false;
		return this.bot.mc.food <= threshold;
	}

	/**
	 * 食事が必要な状態（空腹度が一定以下）か判定
	 * @returns 食事が必要な場合はtrue
	 */
	needsToEat(): boolean {
		return this.isHungerLow(17);
	}

	/**
	 * 近くの安全な場所を探す
	 * @param radius 検索半径（デフォルト: 10）
	 * @returns 安全な場所のVec3座標、見つからない場合はnull
	 */
	findSafeSpot(radius: number = 10): Vec3 | null {
		if (!this.bot) return null;

		const currentPos = this.bot.mc.entity.position;

		// 現在位置から半径内で安全な場所を検索
		for (let x = -radius; x <= radius; x += 2) {
			for (let z = -radius; z <= radius; z += 2) {
				const checkPos = currentPos.offset(x, 0, z);

				// 地面の高さを見つける
				const groundY = Math.floor(checkPos.y);
				for (let y = groundY; y >= groundY - 5; y--) {
					const blockBelow = this.bot.mc.blockAt(
						checkPos.floored().offset(0, y - 1, 0),
					);
					const blockAt = this.bot.mc.blockAt(
						checkPos.floored().offset(0, y, 0),
					);
					const blockAbove = this.bot.mc.blockAt(
						checkPos.floored().offset(0, y + 1, 0),
					);

					// 地面に固体ブロックがあり、その上2ブロックが空気の場合は安全
					if (blockBelow && blockAt && blockAbove) {
						if (
							blockBelow.type !== 0 &&
							blockAt.type === 0 &&
							blockAbove.type === 0
						) {
							return new Vec3(checkPos.x, y, checkPos.z);
						}
					}
				}
			}
		}

		return null;
	}

	/**
	 * 現在の体力を取得
	 * @returns 現在の体力
	 */
	getHealth(): number {
		if (!this.bot) return 0;
		return this.bot.mc.health;
	}

	/**
	 * 現在の空腹度を取得
	 * @returns 現在の空腹度
	 */
	getHunger(): number {
		if (!this.bot) return 0;
		return this.bot.mc.food;
	}

	/**
	 * 現在の満腹度を取得
	 * @returns 現在の満腹度
	 */
	getSaturation(): number {
		if (!this.bot) return 0;
		return this.bot.mc.foodSaturation;
	}

	/**
	 * 現在の酸素レベルを取得
	 * @returns 現在の酸素レベル
	 */
	getOxygen(): number {
		if (!this.bot) return 0;
		return this.bot.mc.oxygenLevel;
	}

	/**
	 * 現在の経験値レベルを取得
	 * @returns 現在の経験値レベル
	 */
	getExperienceLevel(): number {
		if (!this.bot) return 0;
		return this.bot.mc.experience.level;
	}

	/**
	 * 現在の経験値ポイントを取得
	 * @returns 現在の経験値ポイント
	 */
	getExperiencePoints(): number {
		if (!this.bot) return 0;
		return this.bot.mc.experience.points;
	}

	/**
	 * 現在の総経験値を取得
	 * @returns 現在の総経験値
	 */
	getTotalExperience(): number {
		if (!this.bot) return 0;
		// totalが利用できない場合の代替実装
		return (this.bot.mc.experience as any).total || 0;
	}

	/**
	 * 危険な状態かどうかを判定
	 * @returns 危険な状態の場合はtrue
	 */
	isInDanger(): boolean {
		return this.isHealthLow(6) || this.needsToEat() || this.getOxygen() < 10;
	}

	/**
	 * 生存状態の詳細情報を取得
	 * @returns 生存状態の詳細情報
	 */
	getVitalStats(): {
		health: number;
		hunger: number;
		saturation: number;
		oxygen: number;
		experience: {
			level: number;
			points: number;
			total: number;
		};
		isInDanger: boolean;
	} {
		return {
			health: this.getHealth(),
			hunger: this.getHunger(),
			saturation: this.getSaturation(),
			oxygen: this.getOxygen(),
			experience: {
				level: this.getExperienceLevel(),
				points: this.getExperiencePoints(),
				total: this.getTotalExperience(),
			},
			isInDanger: this.isInDanger(),
		};
	}
}
