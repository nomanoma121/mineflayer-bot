import type { Entity } from "prismarine-entity";
import { Vec3 } from "vec3";
import type { Bot } from "../core/Bot";
import type { IAbility } from "./IAbility";

/**
 * ブロック検索のオプション
 */
export interface FindBlockOptions {
	matching: number | number[];
	maxDistance?: number;
	count?: number;
}

/**
 * Sensing（知覚・認識）アビリティ
 * 周囲のワールドやエンティティの情報を取得する能力
 */
export class SensingAbility implements IAbility {
	private bot: Bot | null = null;

	getName(): string {
		return "Sensing";
	}

	getDescription(): string {
		return "周囲のワールドやエンティティの情報を取得します";
	}

	initialize(bot: Bot): void {
		this.bot = bot;
	}

	isAvailable(): boolean {
		return this.bot !== null;
	}

	/**
	 * 最も近いエンティティを見つける
	 * @param filter エンティティのフィルタ関数
	 * @returns 最も近いエンティティ、見つからない場合はnull
	 */
	findNearestEntity(filter: (e: Entity) => boolean): Entity | null {
		if (!this.bot) return null;

		const entities = Object.values(this.bot.mc.entities);
		const filteredEntities = entities.filter(filter);

		if (filteredEntities.length === 0) return null;

		const botPos = this.bot.mc.entity.position;
		let nearestEntity = filteredEntities[0];
		let nearestDistance = botPos.distanceTo(nearestEntity.position);

		for (const entity of filteredEntities) {
			const distance = botPos.distanceTo(entity.position);
			if (distance < nearestDistance) {
				nearestDistance = distance;
				nearestEntity = entity;
			}
		}

		return nearestEntity;
	}

	/**
	 * 最も近いブロックを見つける
	 * @param options ブロック検索のオプション
	 * @returns 最も近いブロックの位置、見つからない場合はnull
	 */
	findNearestBlock(options: FindBlockOptions): Vec3 | null {
		if (!this.bot) return null;

		const block = this.bot.mc.findBlock({
			matching: options.matching,
			maxDistance: options.maxDistance || 64,
			count: options.count || 1,
		});

		return block ? block.position : null;
	}

	/**
	 * 現在が夜（Mobが湧く時間帯）かどうかを判定
	 * @returns 夜の場合はtrue
	 */
	isNight(): boolean {
		if (!this.bot) return false;

		const time = this.bot.mc.time.timeOfDay;
		// Minecraftの時間：0-23999（0が朝、6000が正午、12000が夕方、18000が夜）
		return time >= 13000 || time <= 1000;
	}

	/**
	 * 現在、雨または雪が降っているかを判定
	 * @returns 雨または雪が降っている場合はtrue
	 */
	isRaining(): boolean {
		if (!this.bot) return false;
		return this.bot.mc.isRaining;
	}

	/**
	 * ターゲットとの間に障害物がないか（視線が通るか）を判定
	 * @param target ターゲットエンティティ
	 * @returns 視線が通る場合はtrue
	 */
	canSee(target: Entity): boolean {
		if (!this.bot) return false;

		// 簡単な距離チェック（実際の視線判定は複雑なので簡易版）
		const distance = this.bot.mc.entity.position.distanceTo(target.position);
		return distance <= 16; // 16ブロック以内なら見えるとする
	}

	/**
	 * 指定した位置との間に障害物がないかを判定
	 * @param position 対象位置
	 * @returns 視線が通る場合はtrue
	 */
	canSeePosition(position: Vec3): boolean {
		if (!this.bot) return false;

		const from = this.bot.mc.entity.position.offset(0, 1.6, 0); // 目の高さ
		const to = position.offset(0, 1, 0);

		// レイキャストで障害物をチェック
		const raycast = this.bot.mc.world.raycast(
			from,
			to.minus(from).normalize(),
			to.distanceTo(from),
		);

		return raycast === null;
	}

	/**
	 * 最も近いプレイヤーを見つける
	 * @param excludeSelf 自分自身を除外するかどうか
	 * @returns 最も近いプレイヤー、見つからない場合はnull
	 */
	findNearestPlayer(excludeSelf: boolean = true): Entity | null {
		return this.findNearestEntity((entity) => {
			if (entity.type !== "player") return false;
			if (excludeSelf && entity.username === this.bot?.getName()) return false;
			return true;
		});
	}

	/**
	 * 最も近い敵対的なMobを見つける
	 * @returns 最も近い敵対的なMob、見つからない場合はnull
	 */
	findNearestHostileMob(): Entity | null {
		const hostileMobs = [
			"zombie",
			"skeleton",
			"creeper",
			"spider",
			"enderman",
			"witch",
			"phantom",
			"pillager",
			"vindicator",
			"evoker",
			"ravager",
			"warden",
		];

		return this.findNearestEntity((entity) => {
			return hostileMobs.includes(entity.name?.toLowerCase() || "");
		});
	}

	/**
	 * 最も近い動物を見つける
	 * @returns 最も近い動物、見つからない場合はnull
	 */
	findNearestAnimal(): Entity | null {
		const animals = [
			"cow",
			"pig",
			"sheep",
			"chicken",
			"rabbit",
			"horse",
			"donkey",
			"llama",
			"cat",
			"dog",
			"wolf",
			"ocelot",
			"parrot",
			"turtle",
		];

		return this.findNearestEntity((entity) => {
			return animals.includes(entity.name?.toLowerCase() || "");
		});
	}

	/**
	 * 周囲のエンティティをカウント
	 * @param filter エンティティのフィルタ関数
	 * @param radius 検索半径（デフォルト: 16）
	 * @returns 条件に一致するエンティティの数
	 */
	countNearbyEntities(
		filter: (e: Entity) => boolean,
		radius: number = 16,
	): number {
		if (!this.bot) return 0;

		const botPos = this.bot.mc.entity.position;
		const entities = Object.values(this.bot.mc.entities);

		return entities.filter((entity) => {
			if (!filter(entity)) return false;
			return botPos.distanceTo(entity.position) <= radius;
		}).length;
	}

	/**
	 * 周囲のブロックをカウント
	 * @param blockType ブロックタイプ
	 * @param radius 検索半径（デフォルト: 16）
	 * @returns 条件に一致するブロックの数
	 */
	countNearbyBlocks(blockType: number, radius: number = 16): number {
		if (!this.bot) return 0;

		const botPos = this.bot.mc.entity.position.floored();
		let count = 0;

		for (let x = -radius; x <= radius; x++) {
			for (let y = -radius; y <= radius; y++) {
				for (let z = -radius; z <= radius; z++) {
					const pos = botPos.offset(x, y, z);
					const block = this.bot.mc.blockAt(pos);
					if (block && block.type === blockType) {
						count++;
					}
				}
			}
		}

		return count;
	}

	/**
	 * 現在の光レベルを取得
	 * @returns 現在の光レベル（0-15）
	 */
	getLightLevel(): number {
		if (!this.bot) return 0;

		const pos = this.bot.mc.entity.position.floored();
		const block = this.bot.mc.blockAt(pos);

		return block ? block.light : 0;
	}

	/**
	 * 現在の天候状態を取得
	 * @returns 天候状態の詳細情報
	 */
	getWeatherInfo(): {
		isRaining: boolean;
		isThundering: boolean;
		rainLevel: number;
		thunderLevel: number;
	} {
		if (!this.bot) {
			return {
				isRaining: false,
				isThundering: false,
				rainLevel: 0,
				thunderLevel: 0,
			};
		}

		return {
			isRaining: this.bot.mc.isRaining,
			isThundering: (this.bot.mc as any).thunderState > 0,
			rainLevel: (this.bot.mc as any).rainState || 0,
			thunderLevel: (this.bot.mc as any).thunderState || 0,
		};
	}

	/**
	 * 現在の時刻情報を取得
	 * @returns 時刻情報の詳細
	 */
	getTimeInfo(): {
		timeOfDay: number;
		day: number;
		isNight: boolean;
		isDawn: boolean;
		isDusk: boolean;
	} {
		if (!this.bot) {
			return {
				timeOfDay: 0,
				day: 0,
				isNight: false,
				isDawn: false,
				isDusk: false,
			};
		}

		const time = this.bot.mc.time.timeOfDay;
		const day = this.bot.mc.time.day;

		return {
			timeOfDay: time,
			day: day,
			isNight: this.isNight(),
			isDawn: time >= 22000 || time <= 2000,
			isDusk: time >= 11000 && time <= 13000,
		};
	}

	/**
	 * 周囲の環境情報を取得
	 * @returns 環境情報の詳細
	 */
	getEnvironmentInfo(): {
		position: Vec3;
		lightLevel: number;
		weather: {
			isRaining: boolean;
			isThundering: boolean;
			rainLevel: number;
			thunderLevel: number;
		};
		time: {
			timeOfDay: number;
			day: number;
			isNight: boolean;
			isDawn: boolean;
			isDusk: boolean;
		};
		nearbyPlayersCount: number;
		nearbyHostileMobsCount: number;
		nearbyAnimalsCount: number;
	} {
		if (!this.bot) {
			return {
				position: new Vec3(0, 0, 0),
				lightLevel: 0,
				weather: this.getWeatherInfo(),
				time: this.getTimeInfo(),
				nearbyPlayersCount: 0,
				nearbyHostileMobsCount: 0,
				nearbyAnimalsCount: 0,
			};
		}

		return {
			position: this.bot.mc.entity.position.clone(),
			lightLevel: this.getLightLevel(),
			weather: this.getWeatherInfo(),
			time: this.getTimeInfo(),
			nearbyPlayersCount: this.countNearbyEntities(
				(e: Entity) => e.type === "player",
			),
			nearbyHostileMobsCount: this.countNearbyEntities((e: Entity) => {
				const hostileMobs = [
					"zombie",
					"skeleton",
					"creeper",
					"spider",
					"enderman",
					"witch",
				];
				return hostileMobs.includes(e.name?.toLowerCase() || "");
			}),
			nearbyAnimalsCount: this.countNearbyEntities((e: Entity) => {
				const animals = ["cow", "pig", "sheep", "chicken", "rabbit", "horse"];
				return animals.includes(e.name?.toLowerCase() || "");
			}),
		};
	}
}
