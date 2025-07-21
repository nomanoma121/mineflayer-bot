import type { Bot } from "../core/Bot";
import type { ICommand } from "./ICommand";

/**
 * アビリティテストコマンドクラス
 * アビリティシステムの機能をテストするためのコマンド
 */
export class AbilityTestCommand implements ICommand {
	/**
	 * コマンドを実行
	 * @param bot - 操作対象のボットインスタンス
	 * @param username - コマンドを実行したプレイヤー名
	 * @param args - コマンドの引数
	 */
	public async execute(
		bot: Bot,
		username: string,
		args: string[],
	): Promise<void> {
		try {
			console.log(
				`[${bot.getName()}] Executing ability test command requested by ${username}`,
			);

			if (args.length === 0) {
				bot.say.say(
					"使用方法: @bot abilitytest <vitals|sensing|inventory|say|status|emergency>",
				);
				return;
			}

			const testType = args[0].toLowerCase();

			switch (testType) {
				case "vitals":
					await this.testVitals(bot);
					break;
				case "sensing":
					await this.testSensing(bot);
					break;
				case "inventory":
					await this.testInventory(bot);
					break;
				case "say":
					await this.testSay(bot);
					break;
				case "status":
					await this.testStatus(bot);
					break;
				case "emergency":
					await this.testEmergency(bot);
					break;
				default:
					bot.say.say(
						"不明なテストタイプです。vitals, sensing, inventory, say, status, emergency のいずれかを指定してください。",
					);
					break;
			}
		} catch (error) {
			console.error(`[${bot.getName()}] Error in ability test command:`, error);
			bot.say.reportError("アビリティテスト中にエラーが発生しました。");
		}
	}

	/**
	 * Vitalsアビリティのテスト
	 * @param bot ボットインスタンス
	 */
	private async testVitals(bot: Bot): Promise<void> {
		bot.say.reportInfo("=== Vitalsアビリティテスト ===");

		const vitalStats = bot.vitals.getVitalStats();
		bot.say.say(`体力: ${vitalStats.health}/20`);
		bot.say.say(`空腹度: ${vitalStats.hunger}/20`);
		bot.say.say(`満腹度: ${vitalStats.saturation.toFixed(1)}`);
		bot.say.say(`酸素レベル: ${vitalStats.oxygen}`);
		bot.say.say(`経験値レベル: ${vitalStats.experience.level}`);

		if (bot.vitals.isHealthLow()) {
			bot.say.reportWarning("体力が低下しています！");
		}

		if (bot.vitals.needsToEat()) {
			bot.say.reportWarning("食事が必要です！");
		}

		if (bot.vitals.isInDanger()) {
			bot.say.reportWarning("危険な状態です！");
		} else {
			bot.say.reportInfo("状態は安全です。");
		}
	}

	/**
	 * Sensingアビリティのテスト
	 * @param bot ボットインスタンス
	 */
	private async testSensing(bot: Bot): Promise<void> {
		bot.say.reportInfo("=== Sensingアビリティテスト ===");

		const envInfo = bot.sensing.getEnvironmentInfo();
		const pos = envInfo.position;
		bot.say.say(
			`現在位置: X=${Math.floor(pos.x)}, Y=${Math.floor(pos.y)}, Z=${Math.floor(pos.z)}`,
		);
		bot.say.say(`光レベル: ${envInfo.lightLevel}`);

		const timeInfo = envInfo.time;
		const timeStr = timeInfo.isNight ? "夜" : "昼";
		bot.say.say(`時刻: ${timeStr} (${timeInfo.timeOfDay})`);

		const weatherInfo = envInfo.weather;
		const weatherStr = weatherInfo.isRaining ? "雨" : "晴れ";
		bot.say.say(`天候: ${weatherStr}`);

		bot.say.say(`周囲のプレイヤー数: ${envInfo.nearbyPlayersCount}`);
		bot.say.say(`周囲の敵対Mob数: ${envInfo.nearbyHostileMobsCount}`);
		bot.say.say(`周囲の動物数: ${envInfo.nearbyAnimalsCount}`);

		// 最も近いプレイヤーを探す
		const nearestPlayer = bot.sensing.findNearestPlayer();
		if (nearestPlayer) {
			bot.say.say(`最も近いプレイヤー: ${nearestPlayer.username}`);
		} else {
			bot.say.say("近くにプレイヤーは見つかりませんでした。");
		}
	}

	/**
	 * Inventoryアビリティのテスト
	 * @param bot ボットインスタンス
	 */
	private async testInventory(bot: Bot): Promise<void> {
		bot.say.reportInfo("=== Inventoryアビリティテスト ===");

		const invInfo = bot.inventory.getInventoryInfo();
		bot.say.say(
			`インベントリ: ${invInfo.usedSlots}/${invInfo.totalSlots} スロット使用中`,
		);
		bot.say.say(`空きスロット: ${invInfo.emptySlots}`);

		if (invInfo.equippedItem) {
			bot.say.say(`装備中: ${invInfo.equippedItem}`);
		} else {
			bot.say.say("何も装備していません");
		}

		if (bot.inventory.isFull()) {
			bot.say.reportWarning("インベントリが満杯です！");
		}

		// 食べ物をチェック
		const food = bot.inventory.findFood();
		if (food) {
			bot.say.say(`食べ物を発見: ${food.displayName} x${food.count}`);
		} else {
			bot.say.reportWarning("食べ物が見つかりませんでした！");
		}

		// 武器をチェック
		const weapon = bot.inventory.findWeapon();
		if (weapon) {
			bot.say.say(`武器を発見: ${weapon.displayName}`);
		} else {
			bot.say.say("武器が見つかりませんでした。");
		}

		// アイテム数の上位5個を表示
		const itemCounts = invInfo.items
			.sort((a, b) => b.count - a.count)
			.slice(0, 5);

		if (itemCounts.length > 0) {
			bot.say.say("--- 所持アイテム上位5個 ---");
			itemCounts.forEach((item) => {
				bot.say.say(`${item.displayName}: ${item.count}個`);
			});
		}
	}

	/**
	 * Sayアビリティのテスト
	 * @param bot ボットインスタンス
	 */
	private async testSay(bot: Bot): Promise<void> {
		bot.say.reportInfo("=== Sayアビリティテスト ===");

		// 様々なメッセージタイプをテスト
		bot.say.greet();
		await this.sleep(1000);

		bot.say.reportStatus("テスト実行中...");
		await this.sleep(1000);

		bot.say.reportSuccess("テストメッセージ送信");
		await this.sleep(1000);

		bot.say.reportWarning("これは警告メッセージです");
		await this.sleep(1000);

		bot.say.reportInfo("これは情報メッセージです");
		await this.sleep(1000);

		bot.say.encourage();
		await this.sleep(1000);

		// メッセージ履歴を表示
		const history = bot.say.getMessageHistory(3);
		bot.say.say(`最近のメッセージ履歴: ${history.length}件`);

		bot.say.thank();
	}

	/**
	 * システム状態のテスト
	 * @param bot ボットインスタンス
	 */
	private async testStatus(bot: Bot): Promise<void> {
		bot.say.reportInfo("=== システム状態テスト ===");

		const diagnosis = bot.diagnoseAbilities();
		bot.say.say(`アビリティシステム状態: ${diagnosis.status}`);
		bot.say.say(
			`利用可能なアビリティ数: ${bot.getAbilityManager().getAvailableAbilities().length}`,
		);

		if (diagnosis.issues.length > 0) {
			bot.say.reportWarning("検出された問題:");
			diagnosis.issues.forEach((issue) => {
				bot.say.say(`- ${issue}`);
			});
		} else {
			bot.say.reportSuccess("全てのアビリティが正常に動作しています");
		}

		if (diagnosis.recommendations.length > 0) {
			bot.say.reportInfo("推奨事項:");
			diagnosis.recommendations.forEach((rec) => {
				bot.say.say(`- ${rec}`);
			});
		}
	}

	/**
	 * 緊急時対応のテスト
	 * @param bot ボットインスタンス
	 */
	private async testEmergency(bot: Bot): Promise<void> {
		bot.say.reportInfo("=== 緊急時対応テスト ===");

		const emergencyResult = await bot.handleEmergency();

		if (emergencyResult.success) {
			bot.say.reportSuccess("緊急時対応が正常に実行されました");
		} else {
			bot.say.reportError("緊急時対応でエラーが発生しました");
		}

		bot.say.say(`実行されたアクション: ${emergencyResult.actions.length}件`);
		emergencyResult.actions.forEach((action) => {
			bot.say.say(`- ${action}`);
		});

		bot.say.reportInfo(emergencyResult.message);
	}

	/**
	 * 指定時間待機
	 * @param ms 待機時間（ミリ秒）
	 */
	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	/**
	 * コマンド名を取得
	 * @returns コマンド名
	 */
	public getName(): string {
		return "abilitytest";
	}

	/**
	 * コマンドの説明を取得
	 * @returns コマンドの説明
	 */
	public getDescription(): string {
		return "アビリティシステムの機能をテストします";
	}

	/**
	 * コマンドの使用法を取得
	 * @returns コマンドの使用法
	 */
	public getUsage(): string {
		return "@<botname> abilitytest <vitals|sensing|inventory|say|status|emergency>";
	}
}
