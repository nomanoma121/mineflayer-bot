import type { Block } from "prismarine-block";
import type { Item } from "prismarine-item";
import type { Window } from "prismarine-windows";
import type { Bot } from "../core/Bot";
import type { IAbility } from "./IAbility";

/**
 * Inventory（所持品管理）アビリティ
 * インベントリとアイテムに関する能力
 */
export class InventoryAbility implements IAbility {
	private bot: Bot | null = null;

	getName(): string {
		return "Inventory";
	}

	getDescription(): string {
		return "インベントリとアイテムの管理を行います";
	}

	initialize(bot: Bot): void {
		this.bot = bot;
	}

	isAvailable(): boolean {
		return this.bot !== null;
	}

	/**
	 * 指定したアイテムを必要数だけ持っているか確認
	 * @param itemName アイテム名
	 * @param count 必要数（デフォルト: 1）
	 * @returns 十分な数を持っている場合はtrue
	 */
	hasItem(itemName: string, count: number = 1): boolean {
		if (!this.bot) return false;

		const items = this.bot.mc.inventory.items().filter((item) => {
			return item.name === itemName || item.displayName === itemName;
		});

		const totalCount = items.reduce((sum, item) => sum + item.count, 0);
		return totalCount >= count;
	}

	/**
	 * インベントリに空きがないか確認
	 * @returns インベントリが満杯の場合はtrue
	 */
	isFull(): boolean {
		if (!this.bot) return false;

		const emptySlots = this.bot.mc.inventory.emptySlotCount();
		return emptySlots === 0;
	}

	/**
	 * 指定したブロックを掘るのに最適なツールを見つける
	 * @param block 対象ブロック
	 * @returns 最適なツール、見つからない場合はnull
	 */
	findBestTool(block: Block): Item | null {
		if (!this.bot) return null;

		const tools = this.bot.mc.inventory.items().filter((item) => {
			return (
				item.name.includes("pickaxe") ||
				item.name.includes("axe") ||
				item.name.includes("shovel") ||
				item.name.includes("hoe") ||
				item.name.includes("sword")
			);
		});

		if (tools.length === 0) return null;

		// ブロックタイプに応じた最適なツールを選択
		const blockName = block.name.toLowerCase();
		let bestTool = tools[0];

		// 石系ブロックにはピッケル
		if (
			blockName.includes("stone") ||
			blockName.includes("ore") ||
			blockName.includes("cobblestone")
		) {
			const pickaxe = tools.find((tool) => tool.name.includes("pickaxe"));
			if (pickaxe) bestTool = pickaxe;
		}
		// 木系ブロックには斧
		else if (
			blockName.includes("log") ||
			blockName.includes("wood") ||
			blockName.includes("planks")
		) {
			const axe = tools.find((tool) => tool.name.includes("axe"));
			if (axe) bestTool = axe;
		}
		// 土系ブロックにはシャベル
		else if (
			blockName.includes("dirt") ||
			blockName.includes("sand") ||
			blockName.includes("gravel")
		) {
			const shovel = tools.find((tool) => tool.name.includes("shovel"));
			if (shovel) bestTool = shovel;
		}

		return bestTool;
	}

	/**
	 * 指定アイテムを装備
	 * @param item 装備するアイテム
	 * @param destination 装備先（'hand', 'head', 'torso', 'legs', 'feet', 'off-hand'）
	 * @returns 装備完了のPromise
	 */
	async equip(
		item: Item,
		destination:
			| "hand"
			| "head"
			| "torso"
			| "legs"
			| "feet"
			| "off-hand" = "hand",
	): Promise<void> {
		if (!this.bot) return;

		try {
			await this.bot.mc.equip(item, destination);
		} catch (error) {
			console.error(`装備エラー: ${error}`);
			throw error;
		}
	}

	/**
	 * 開いているチェストに指定アイテムを預ける
	 * @param chest チェストウィンドウ
	 * @param itemName アイテム名
	 * @param count 預ける数（デフォルト: 全て）
	 * @returns 預け入れ完了のPromise
	 */
	async deposit(
		chest: Window,
		itemName: string,
		count?: number,
	): Promise<void> {
		if (!this.bot) return;

		const items = this.bot.mc.inventory.items().filter((item) => {
			return item.name === itemName || item.displayName === itemName;
		});

		if (items.length === 0) {
			throw new Error(`アイテム「${itemName}」が見つかりません`);
		}

		let remainingCount =
			count || items.reduce((sum, item) => sum + item.count, 0);

		for (const item of items) {
			if (remainingCount <= 0) break;

			const transferCount = Math.min(item.count, remainingCount);
			// 簡単な実装：今のところは実装をスキップ
			try {
				// チェスト操作の実装は後で追加
				console.log(
					`${itemName} x${transferCount} をチェストに預け入れます（実装予定）`,
				);
			} catch (error) {
				console.error(`アイテム預け入れエラー: ${error}`);
				throw error;
			}
			remainingCount -= transferCount;
		}
	}

	/**
	 * 開いているチェストから指定アイテムを取り出す
	 * @param chest チェストウィンドウ
	 * @param itemName アイテム名
	 * @param count 取り出す数（デフォルト: 全て）
	 * @returns 取り出し完了のPromise
	 */
	async withdraw(
		chest: Window,
		itemName: string,
		count?: number,
	): Promise<void> {
		if (!this.bot) return;

		const chestItems = chest.items().filter((item) => {
			return item.name === itemName || item.displayName === itemName;
		});

		if (chestItems.length === 0) {
			throw new Error(`チェストにアイテム「${itemName}」が見つかりません`);
		}

		let remainingCount =
			count || chestItems.reduce((sum, item) => sum + item.count, 0);

		for (const item of chestItems) {
			if (remainingCount <= 0) break;

			const transferCount = Math.min(item.count, remainingCount);
			// 簡単な実装：今のところは実装をスキップ
			try {
				// チェスト操作の実装は後で追加
				console.log(
					`${itemName} x${transferCount} をチェストから取り出します（実装予定）`,
				);
			} catch (error) {
				console.error(`アイテム取り出しエラー: ${error}`);
				throw error;
			}
			remainingCount -= transferCount;
		}
	}

	/**
	 * 指定したアイテムを見つける
	 * @param itemName アイテム名
	 * @returns 見つかったアイテム、見つからない場合はnull
	 */
	findItem(itemName: string): Item | null {
		if (!this.bot) return null;

		return (
			this.bot.mc.inventory.items().find((item) => {
				return item.name === itemName || item.displayName === itemName;
			}) || null
		);
	}

	/**
	 * 指定したアイテムの総数を取得
	 * @param itemName アイテム名
	 * @returns アイテムの総数
	 */
	getItemCount(itemName: string): number {
		if (!this.bot) return 0;

		const items = this.bot.mc.inventory.items().filter((item) => {
			return item.name === itemName || item.displayName === itemName;
		});

		return items.reduce((sum, item) => sum + item.count, 0);
	}

	/**
	 * 空のスロット数を取得
	 * @returns 空のスロット数
	 */
	getEmptySlotCount(): number {
		if (!this.bot) return 0;
		return this.bot.mc.inventory.emptySlotCount();
	}

	/**
	 * インベントリの容量を取得
	 * @returns インベントリの総容量
	 */
	getTotalSlotCount(): number {
		if (!this.bot) return 0;
		return this.bot.mc.inventory.slots.length;
	}

	/**
	 * 現在装備しているアイテムを取得
	 * @returns 現在装備しているアイテム、装備していない場合はnull
	 */
	getEquippedItem(): Item | null {
		if (!this.bot) return null;
		return this.bot.mc.heldItem;
	}

	/**
	 * 指定したアイテムを捨てる
	 * @param itemName アイテム名
	 * @param count 捨てる数（デフォルト: 全て）
	 * @returns 捨て完了のPromise
	 */
	async dropItem(itemName: string, count?: number): Promise<void> {
		if (!this.bot) return;

		const item = this.findItem(itemName);
		if (!item) {
			throw new Error(`アイテム「${itemName}」が見つかりません`);
		}

		const dropCount = count || item.count;
		await this.bot.mc.tossStack(item);
	}

	/**
	 * 食べ物を見つける
	 * @returns 食べ物アイテム、見つからない場合はnull
	 */
	findFood(): Item | null {
		if (!this.bot) return null;

		// 一般的な食べ物アイテムのリスト
		const foodItems = [
			"bread",
			"apple",
			"golden_apple",
			"pork",
			"beef",
			"chicken",
			"mutton",
			"rabbit",
			"cod",
			"salmon",
			"tropical_fish",
			"pufferfish",
			"cooked_pork",
			"cooked_beef",
			"cooked_chicken",
			"cooked_mutton",
			"cooked_rabbit",
			"cooked_cod",
			"cooked_salmon",
			"cake",
			"cookie",
			"melon_slice",
			"sweet_berries",
			"honey_bottle",
			"mushroom_stew",
			"rabbit_stew",
			"beetroot_soup",
			"suspicious_stew",
			"baked_potato",
			"potato",
			"carrot",
			"beetroot",
			"dried_kelp",
			"golden_carrot",
			"pumpkin_pie",
		];

		return (
			this.bot.mc.inventory.items().find((item) => {
				return foodItems.includes(item.name);
			}) || null
		);
	}

	/**
	 * 武器を見つける
	 * @returns 武器アイテム、見つからない場合はnull
	 */
	findWeapon(): Item | null {
		if (!this.bot) return null;

		const weapons = this.bot.mc.inventory.items().filter((item) => {
			return (
				item.name.includes("sword") ||
				item.name.includes("axe") ||
				item.name.includes("bow") ||
				item.name.includes("crossbow") ||
				item.name.includes("trident")
			);
		});

		if (weapons.length === 0) return null;

		// ダメージが高い順にソート
		weapons.sort((a, b) => {
			const aDamage = this.getItemDamage(a);
			const bDamage = this.getItemDamage(b);
			return bDamage - aDamage;
		});

		return weapons[0];
	}

	/**
	 * アイテムのダメージ値を取得
	 * @param item アイテム
	 * @returns ダメージ値
	 */
	private getItemDamage(item: Item): number {
		if (!this.bot) return 0;

		// 基本的なダメージ値のマッピング
		const damageMap: { [key: string]: number } = {
			wooden_sword: 4,
			stone_sword: 5,
			iron_sword: 6,
			golden_sword: 4,
			diamond_sword: 7,
			netherite_sword: 8,
			wooden_axe: 7,
			stone_axe: 9,
			iron_axe: 9,
			golden_axe: 7,
			diamond_axe: 9,
			netherite_axe: 10,
		};

		return damageMap[item.name] || 1;
	}

	/**
	 * アーマーを見つける
	 * @param slot アーマースロット（'head', 'torso', 'legs', 'feet'）
	 * @returns アーマーアイテム、見つからない場合はnull
	 */
	findArmor(slot: string): Item | null {
		if (!this.bot) return null;

		const armorTypes = {
			head: ["helmet"],
			torso: ["chestplate"],
			legs: ["leggings"],
			feet: ["boots"],
		};

		const targetTypes = armorTypes[slot as keyof typeof armorTypes];
		if (!targetTypes) return null;

		return (
			this.bot.mc.inventory.items().find((item) => {
				return targetTypes.some((type) => item.name.includes(type));
			}) || null
		);
	}

	/**
	 * インベントリの詳細情報を取得
	 * @returns インベントリの詳細情報
	 */
	getInventoryInfo(): {
		totalSlots: number;
		usedSlots: number;
		emptySlots: number;
		items: Array<{
			name: string;
			displayName: string;
			count: number;
			slot: number;
		}>;
		equippedItem: string | null;
	} {
		if (!this.bot) {
			return {
				totalSlots: 0,
				usedSlots: 0,
				emptySlots: 0,
				items: [],
				equippedItem: null,
			};
		}

		const items = this.bot.mc.inventory.items();
		const equippedItem = this.getEquippedItem();

		return {
			totalSlots: this.getTotalSlotCount(),
			usedSlots: items.length,
			emptySlots: this.getEmptySlotCount(),
			items: items.map((item) => ({
				name: item.name,
				displayName: item.displayName,
				count: item.count,
				slot: item.slot,
			})),
			equippedItem: equippedItem ? equippedItem.displayName : null,
		};
	}

	/**
	 * 貴重なアイテムかどうかを判定
	 * @param item アイテム
	 * @returns 貴重なアイテムの場合はtrue
	 */
	isValuableItem(item: Item): boolean {
		const valuableItems = [
			"diamond",
			"emerald",
			"gold",
			"iron",
			"redstone",
			"lapis",
			"enchanted",
			"netherite",
			"totem",
			"elytra",
			"trident",
			"beacon",
			"conduit",
			"heart_of_the_sea",
			"nautilus_shell",
		];

		return valuableItems.some((valuable) =>
			item.name.toLowerCase().includes(valuable.toLowerCase()),
		);
	}

	/**
	 * 不要なアイテムかどうかを判定
	 * @param item アイテム
	 * @returns 不要なアイテムの場合はtrue
	 */
	isJunkItem(item: Item): boolean {
		const junkItems = [
			"cobblestone",
			"dirt",
			"gravel",
			"sand",
			"rotten_flesh",
			"spider_eye",
			"bone",
			"string",
			"gunpowder",
			"leather",
		];

		return junkItems.some((junk) =>
			item.name.toLowerCase().includes(junk.toLowerCase()),
		);
	}
}
