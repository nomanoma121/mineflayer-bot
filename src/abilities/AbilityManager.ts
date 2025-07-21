import type { Bot } from "../core/Bot";
import type { IAbility } from "./IAbility";
import { InventoryAbility } from "./InventoryAbility";
import { SayAbility } from "./SayAbility";
import { SensingAbility } from "./SensingAbility";
import { VitalsAbility } from "./VitalsAbility";

/**
 * アビリティマネージャー
 * 全てのアビリティを管理し、統一的なアクセスを提供
 */
export class AbilityManager {
	private abilities: Map<string, IAbility> = new Map();
	private bot: Bot | null = null;

	constructor() {
		// アビリティを初期化
		this.registerAbility(new VitalsAbility());
		this.registerAbility(new SensingAbility());
		this.registerAbility(new InventoryAbility());
		this.registerAbility(new SayAbility());
	}

	/**
	 * アビリティを登録
	 * @param ability 登録するアビリティ
	 */
	registerAbility(ability: IAbility): void {
		this.abilities.set(ability.getName(), ability);
	}

	/**
	 * アビリティを取得
	 * @param name アビリティ名
	 * @returns 指定されたアビリティ、存在しない場合はundefined
	 */
	getAbility<T extends IAbility>(name: string): T | undefined {
		return this.abilities.get(name) as T;
	}

	/**
	 * 全てのアビリティを初期化
	 * @param bot ボットインスタンス
	 */
	initialize(bot: Bot): void {
		this.bot = bot;
		for (const ability of this.abilities.values()) {
			ability.initialize(bot);
		}
	}

	/**
	 * 利用可能なアビリティの一覧を取得
	 * @returns 利用可能なアビリティのリスト
	 */
	getAvailableAbilities(): IAbility[] {
		return Array.from(this.abilities.values()).filter((ability) =>
			ability.isAvailable(),
		);
	}

	/**
	 * 全てのアビリティの一覧を取得
	 * @returns 全てのアビリティのリスト
	 */
	getAllAbilities(): IAbility[] {
		return Array.from(this.abilities.values());
	}

	/**
	 * アビリティが存在するかを確認
	 * @param name アビリティ名
	 * @returns 存在する場合はtrue
	 */
	hasAbility(name: string): boolean {
		return this.abilities.has(name);
	}

	/**
	 * Vitalsアビリティを取得
	 * @returns Vitalsアビリティ
	 */
	get vitals(): VitalsAbility {
		return this.getAbility<VitalsAbility>("Vitals")!;
	}

	/**
	 * Sensingアビリティを取得
	 * @returns Sensingアビリティ
	 */
	get sensing(): SensingAbility {
		return this.getAbility<SensingAbility>("Sensing")!;
	}

	/**
	 * Inventoryアビリティを取得
	 * @returns Inventoryアビリティ
	 */
	get inventory(): InventoryAbility {
		return this.getAbility<InventoryAbility>("Inventory")!;
	}

	/**
	 * Sayアビリティを取得
	 * @returns Sayアビリティ
	 */
	get say(): SayAbility {
		return this.getAbility<SayAbility>("Say")!;
	}

	/**
	 * アビリティシステムの状態を取得
	 * @returns アビリティシステムの状態
	 */
	getSystemStatus(): {
		totalAbilities: number;
		availableAbilities: number;
		abilitiesList: Array<{
			name: string;
			description: string;
			available: boolean;
		}>;
	} {
		const allAbilities = this.getAllAbilities();
		const availableAbilities = this.getAvailableAbilities();

		return {
			totalAbilities: allAbilities.length,
			availableAbilities: availableAbilities.length,
			abilitiesList: allAbilities.map((ability) => ({
				name: ability.getName(),
				description: ability.getDescription(),
				available: ability.isAvailable(),
			})),
		};
	}

	/**
	 * アビリティシステムの診断を実行
	 * @returns 診断結果
	 */
	diagnose(): {
		status: "healthy" | "partial" | "critical";
		issues: string[];
		recommendations: string[];
	} {
		const issues: string[] = [];
		const recommendations: string[] = [];

		// ボットが初期化されているかチェック
		if (!this.bot) {
			issues.push("ボットが初期化されていません");
			recommendations.push("initialize(bot)メソッドを呼び出してください");
		}

		// 各アビリティの状態をチェック
		for (const ability of this.abilities.values()) {
			if (!ability.isAvailable()) {
				issues.push(`${ability.getName()}アビリティが利用できません`);
				recommendations.push(
					`${ability.getName()}アビリティの状態を確認してください`,
				);
			}
		}

		// 状態を判定
		let status: "healthy" | "partial" | "critical";
		if (issues.length === 0) {
			status = "healthy";
		} else if (issues.length <= 2) {
			status = "partial";
		} else {
			status = "critical";
		}

		return {
			status,
			issues,
			recommendations,
		};
	}

	/**
	 * アビリティの統計情報を取得
	 * @returns アビリティの統計情報
	 */
	getStats(): {
		vitals: ReturnType<VitalsAbility["getVitalStats"]> | null;
		environment: ReturnType<SensingAbility["getEnvironmentInfo"]> | null;
		inventory: ReturnType<InventoryAbility["getInventoryInfo"]> | null;
		messageHistory: ReturnType<SayAbility["getMessageHistory"]> | null;
	} {
		const vitalsAbility = this.getAbility<VitalsAbility>("Vitals");
		const sensingAbility = this.getAbility<SensingAbility>("Sensing");
		const inventoryAbility = this.getAbility<InventoryAbility>("Inventory");
		const sayAbility = this.getAbility<SayAbility>("Say");

		return {
			vitals: vitalsAbility?.isAvailable()
				? vitalsAbility.getVitalStats()
				: null,
			environment: sensingAbility?.isAvailable()
				? sensingAbility.getEnvironmentInfo()
				: null,
			inventory: inventoryAbility?.isAvailable()
				? inventoryAbility.getInventoryInfo()
				: null,
			messageHistory: sayAbility?.isAvailable()
				? sayAbility.getMessageHistory(5)
				: null,
		};
	}

	/**
	 * 緊急時の対応を実行
	 * @returns 緊急時対応の結果
	 */
	async handleEmergency(): Promise<{
		actions: string[];
		success: boolean;
		message: string;
	}> {
		const actions: string[] = [];
		let success = true;
		let message = "";

		try {
			const vitalsAbility = this.getAbility<VitalsAbility>("Vitals");
			const sayAbility = this.getAbility<SayAbility>("Say");

			if (!vitalsAbility || !sayAbility) {
				throw new Error("必要なアビリティが利用できません");
			}

			// 危険な状態かチェック
			if (vitalsAbility.isInDanger()) {
				actions.push("危険状態を検出");

				// 体力が低い場合
				if (vitalsAbility.isHealthLow()) {
					actions.push("体力が低い状態を検出");
					sayAbility.reportWarning("体力が低下しています！");
				}

				// 空腹の場合
				if (vitalsAbility.needsToEat()) {
					actions.push("空腹状態を検出");
					sayAbility.reportWarning("お腹が空いています！");
				}

				// 安全な場所を探す
				const safeSpot = vitalsAbility.findSafeSpot();
				if (safeSpot) {
					actions.push("安全な場所を発見");
					sayAbility.reportInfo(
						`安全な場所を発見: ${safeSpot.x}, ${safeSpot.y}, ${safeSpot.z}`,
					);
				}

				message = "緊急時対応を実行しました";
			} else {
				message = "危険な状態は検出されませんでした";
			}
		} catch (error) {
			success = false;
			message = `緊急時対応中にエラーが発生しました: ${error}`;
			actions.push("エラーが発生");
		}

		return {
			actions,
			success,
			message,
		};
	}

	/**
	 * アビリティマネージャーの状態をリセット
	 */
	reset(): void {
		this.bot = null;
		// 各アビリティの状態をリセット（必要に応じて）
		for (const ability of this.abilities.values()) {
			// アビリティにリセットメソッドがある場合は呼び出す
			if ("reset" in ability && typeof ability.reset === "function") {
				(ability as any).reset();
			}
		}
	}
}
