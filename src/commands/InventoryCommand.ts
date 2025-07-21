import type { Bot } from "../core/Bot";
import type { ICommand } from "./ICommand";

/**
 * インベントリ表示コマンドクラス
 * 現在の持ち物をチャットに表示する
 */
export class InventoryCommand implements ICommand {
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
			console.log(`[${bot.getName()}] Displaying inventory for ${username}`);

			const items = bot.mc.inventory.items();

			if (items.length === 0) {
				bot.sendMessage("インベントリは空です。");
				return;
			}

			// アイテムをカテゴリ別に整理
			const itemMap = new Map<string, number>();

			for (const item of items) {
				const itemName = item.displayName || item.name;
				const currentCount = itemMap.get(itemName) || 0;
				itemMap.set(itemName, currentCount + item.count);
			}

			// インベントリ情報を構築
			const inventoryLines: string[] = [];
			inventoryLines.push(`=== ${bot.getName()}のインベントリ ===`);

			let totalItems = 0;
			for (const [itemName, count] of itemMap.entries()) {
				inventoryLines.push(`${itemName}: ${count}個`);
				totalItems += count;
			}

			inventoryLines.push(
				`合計: ${totalItems}個 (${items.length}/${bot.mc.inventory.slots.length - 5}スロット使用)`,
			);

			// 複数行のメッセージを送信
			for (const line of inventoryLines) {
				bot.sendMessage(line);
				// チャットスパム防止のため少し待機
				await new Promise((resolve) => setTimeout(resolve, 100));
			}
		} catch (error) {
			console.error(`[${bot.getName()}] Error in inventory command:`, error);
			bot.sendMessage(
				`インベントリ表示中にエラーが発生しました: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	/**
	 * コマンド名を取得
	 * @returns コマンド名
	 */
	public getName(): string {
		return "inventory";
	}

	/**
	 * コマンドの説明を取得
	 * @returns コマンドの説明
	 */
	public getDescription(): string {
		return "現在の持ち物をチャットに表示します";
	}

	/**
	 * コマンドの使用法を取得
	 * @returns コマンドの使用法
	 */
	public getUsage(): string {
		return "@<botname> inventory";
	}
}
