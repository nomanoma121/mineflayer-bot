import { goals } from "mineflayer-pathfinder";
import type { Block } from "prismarine-block";
import { Vec3 } from "vec3";
import type { Bot } from "../core/Bot";
import type { IBotState } from "./IBotState";

/**
 * 農業状態クラス
 * 畑エリア内で作物の収穫と植え直しを管理
 */
export class FarmingState implements IBotState {
	private bot: Bot;
	private farmArea: { min: Vec3; max: Vec3 };
	private currentTask: "scanning" | "moving" | "harvesting" | "planting" =
		"scanning";
	private currentTarget: Block | null = null;
	private harvestableBlocks: string[] = [
		"wheat",
		"carrots",
		"potatoes",
		"beetroots",
		"pumpkin",
		"melon",
		"sugar_cane",
	];

	constructor(bot: Bot, corner1: Vec3, corner2: Vec3) {
		this.bot = bot;

		// 畑エリアの最小・最大座標を計算
		this.farmArea = {
			min: new Vec3(
				Math.min(corner1.x, corner2.x),
				Math.min(corner1.y, corner2.y),
				Math.min(corner1.z, corner2.z),
			),
			max: new Vec3(
				Math.max(corner1.x, corner2.x),
				Math.max(corner1.y, corner2.y),
				Math.max(corner1.z, corner2.z),
			),
		};
	}

	/**
	 * 農業状態に入る際の初期化処理
	 */
	public async enter(): Promise<void> {
		console.log(`[${this.bot.getName()}] Entering Farming state`);
		console.log(
			`[${this.bot.getName()}] Farm area: (${this.farmArea.min.x},${this.farmArea.min.y},${this.farmArea.min.z}) to (${this.farmArea.max.x},${this.farmArea.max.y},${this.farmArea.max.z})`,
		);

		this.currentTask = "scanning";
	}

	/**
	 * 農業状態から出る際の終了処理
	 */
	public exit(): void {
		console.log(`[${this.bot.getName()}] Exiting Farming state`);

		// 移動を停止
		this.bot.mc.pathfinder.stop();
		this.currentTask = "scanning";
		this.currentTarget = null;
	}

	/**
	 * 農業状態の定期実行処理
	 */
	public execute(): void {
		switch (this.currentTask) {
			case "scanning":
				this.scanForMatureCrops();
				break;
			case "moving":
				this.checkMovementProgress();
				break;
			case "harvesting":
				this.harvestCrop();
				break;
			case "planting":
				this.replantCrop();
				break;
		}
	}

	/**
	 * 状態の名前を取得
	 */
	public getName(): string {
		return "Farming";
	}

	/**
	 * 農業状態では、インベントリ内で最も効率的な鍬を推奨する
	 * @returns 推奨装備のアイテム
	 */
	public getRecommendedEquipment(): any | null {
		const hoes = this.bot.mc.inventory.items().filter((item) => {
			const itemName = item.name.toLowerCase();
			return itemName.includes("hoe");
		});

		if (hoes.length === 0) {
			return null;
		}

		// 鍬を効率順で並べ替え（優先度順）
		const hoePriority = [
			"netherite_hoe",
			"diamond_hoe",
			"iron_hoe",
			"stone_hoe",
			"golden_hoe",
			"wooden_hoe",
		];

		// 最も優先度の高い鍬を探す
		for (const priorityHoe of hoePriority) {
			const hoe = hoes.find((h) => h.name.toLowerCase().includes(priorityHoe));
			if (hoe) {
				return hoe;
			}
		}

		// 優先度にないものは最初に見つかった鍬を返す
		return hoes[0];
	}

	/**
	 * 成熟した作物をスキャン
	 */
	private scanForMatureCrops(): void {
		// 畑エリア内で成熟した作物を探す
		const matureCrop = this.findMatureCropInArea();

		if (matureCrop) {
			console.log(
				`[${this.bot.getName()}] Found mature crop: ${matureCrop.name} at (${matureCrop.position.x}, ${matureCrop.position.y}, ${matureCrop.position.z})`,
			);
			this.currentTarget = matureCrop;
			this.currentTask = "moving";
			this.moveToCrop();
		} else {
			// 畑全体をスキャンしても成熟した作物が見つからない場合
			console.log(`[${this.bot.getName()}] No mature crops found, waiting...`);

			// 少し待ってから再スキャン
			setTimeout(() => {
				if (this.currentTask === "scanning") {
					this.scanForMatureCrops();
				}
			}, 5000);
		}
	}

	/**
	 * 畑エリア内で成熟した作物を探す
	 */
	private findMatureCropInArea(): Block | null {
		for (let x = this.farmArea.min.x; x <= this.farmArea.max.x; x++) {
			for (let y = this.farmArea.min.y; y <= this.farmArea.max.y; y++) {
				for (let z = this.farmArea.min.z; z <= this.farmArea.max.z; z++) {
					const block = this.bot.mc.blockAt(new Vec3(x, y, z));
					if (block && this.isMatureCrop(block)) {
						return block;
					}
				}
			}
		}
		return null;
	}

	/**
	 * ブロックが成熟した作物かチェック
	 */
	private isMatureCrop(block: Block): boolean {
		// 作物の成熟度をチェック
		if (this.harvestableBlocks.includes(block.name)) {
			// age プロパティで成熟度をチェック（wheat, carrots, potatoes, beetroots）
			if (block.getProperties().age !== undefined) {
				const maxAge = this.getMaxAge(block.name);
				return block.getProperties().age === maxAge;
			}

			// pumpkin, melon, sugar_cane は常に収穫可能
			if (["pumpkin", "melon", "sugar_cane"].includes(block.name)) {
				return true;
			}
		}

		return false;
	}

	/**
	 * 作物の最大成熟度を取得
	 */
	private getMaxAge(cropName: string): number {
		const maxAges: { [key: string]: number } = {
			wheat: 7,
			carrots: 7,
			potatoes: 7,
			beetroots: 3,
		};

		return maxAges[cropName] || 7;
	}

	/**
	 * 作物への移動
	 */
	private moveToCrop(): void {
		if (!this.currentTarget) return;

		try {
			const goal = new goals.GoalNear(
				this.currentTarget.position.x,
				this.currentTarget.position.y,
				this.currentTarget.position.z,
				2,
			);

			this.bot.mc.pathfinder.setGoal(goal);
			console.log(`[${this.bot.getName()}] Moving to crop`);
		} catch (error) {
			console.error(`[${this.bot.getName()}] Error moving to crop:`, error);
			this.currentTask = "scanning";
		}
	}

	/**
	 * 移動の進捗をチェック
	 */
	private checkMovementProgress(): void {
		if (!this.currentTarget) {
			this.currentTask = "scanning";
			return;
		}

		const distance = this.bot.mc.entity.position.distanceTo(
			this.currentTarget.position,
		);

		if (distance <= 3 || !this.bot.mc.pathfinder.isMoving()) {
			console.log(`[${this.bot.getName()}] Reached crop, starting to harvest`);
			this.currentTask = "harvesting";
		}
	}

	/**
	 * 作物を収穫
	 */
	private async harvestCrop(): Promise<void> {
		if (!this.currentTarget) {
			this.currentTask = "scanning";
			return;
		}

		try {
			// 適切なツールを装備
			await this.equipHarvestingTool();

			// 作物を収穫
			await this.bot.mc.dig(this.currentTarget);
			console.log(
				`[${this.bot.getName()}] Harvested ${this.currentTarget.name}`,
			);

			// 種植えタスクに移行
			this.currentTask = "planting";
		} catch (error) {
			console.error(`[${this.bot.getName()}] Error harvesting crop:`, error);
			this.currentTask = "scanning";
		}
	}

	/**
	 * 作物を植え直し
	 */
	private async replantCrop(): Promise<void> {
		if (!this.currentTarget) {
			this.currentTask = "scanning";
			return;
		}

		try {
			const seedName = this.getSeedForCrop(this.currentTarget.name);
			const seed = this.bot.mc.inventory
				.items()
				.find((item) => item.name === seedName);

			if (seed) {
				// 土の上に種を植える
				const soilBlock = this.bot.mc.blockAt(
					this.currentTarget.position.offset(0, -1, 0),
				);
				if (
					soilBlock &&
					(soilBlock.name === "farmland" || soilBlock.name === "dirt")
				) {
					await this.bot.mc.equip(seed, "hand");

					// 種を植える（右クリック）
					await this.bot.mc.activateBlock(soilBlock);
					console.log(`[${this.bot.getName()}] Planted ${seedName}`);
				}
			} else {
				console.log(
					`[${this.bot.getName()}] No seeds available for replanting`,
				);
			}
		} catch (error) {
			console.error(`[${this.bot.getName()}] Error replanting crop:`, error);
		}

		// 次の作物を探す
		this.currentTask = "scanning";
		this.currentTarget = null;
	}

	/**
	 * 収穫ツールを装備
	 */
	private async equipHarvestingTool(): Promise<void> {
		// 作物の収穫には主に手やクワを使用
		const tools = ["diamond_hoe", "iron_hoe", "stone_hoe", "wooden_hoe"];

		for (const toolName of tools) {
			const tool = this.bot.mc.inventory
				.items()
				.find((item) => item.name === toolName);
			if (tool) {
				await this.bot.mc.equip(tool, "hand");
				return;
			}
		}

		// ツールがない場合は手で収穫
	}

	/**
	 * 作物に対応する種を取得
	 */
	private getSeedForCrop(cropName: string): string {
		const seedMap: { [key: string]: string } = {
			wheat: "wheat_seeds",
			carrots: "carrot",
			potatoes: "potato",
			beetroots: "beetroot_seeds",
			pumpkin: "pumpkin_seeds",
			melon: "melon_seeds",
			sugar_cane: "sugar_cane",
		};

		return seedMap[cropName] || "wheat_seeds";
	}
}
