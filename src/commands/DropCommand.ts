import type { Bot } from "../core/Bot";
import type { ICommand } from "./ICommand";

/**
 * アイテムドロップコマンドクラス
 * 指定されたアイテムをインベントリから捨てる
 */
export class DropCommand implements ICommand {
	/**
	 * コマンドを実行
	 * @param bot - 操作対象のボットインスタンス
	 * @param username - コマンドを実行したプレイヤー名
	 * @param args - コマンドの引数 [アイテム名, 数量]
	 */
	public async execute(
		bot: Bot,
		username: string,
		args: string[],
	): Promise<void> {
		try {
			console.log(`[${bot.getName()}] Drop command executed by ${username}`);

			if (args.length === 0) {
				bot.sendMessage("使用法: @botname drop <アイテム名> [数量]");
				return;
			}

			const itemName = args[0];
			const quantity = args.length > 1 ? parseInt(args[1]) : 1;

			if (isNaN(quantity) || quantity <= 0) {
				bot.sendMessage("数量は1以上の数値で指定してください。");
				return;
			}

			// 特殊なキーワードをチェック
			if (itemName.toLowerCase() === "all") {
				await this.dropAllItems(bot);
				return;
			}

			// アイテムをインベントリから検索
			const matchingItems = bot.mc.inventory
				.items()
				.filter(
					(item) =>
						item.name.toLowerCase().includes(itemName.toLowerCase()) ||
						item.displayName.toLowerCase().includes(itemName.toLowerCase()),
				);

			if (matchingItems.length === 0) {
				bot.sendMessage(`アイテム「${itemName}」が見つかりません。`);
				return;
			}

			// アイテムの総数を計算
			const totalQuantity = matchingItems.reduce(
				(total, item) => total + item.count,
				0,
			);

			if (totalQuantity < quantity) {
				bot.sendMessage(
					`アイテム「${itemName}」が不足しています。必要: ${quantity}, 所持: ${totalQuantity}`,
				);
				return;
			}

			const firstItem = matchingItems[0];
			let remainingQuantity = quantity;

			bot.sendMessage(
				`${firstItem.displayName} x${quantity} をドロップします...`,
			);

			// 複数スタックにまたがる場合の処理
			for (const item of matchingItems) {
				if (remainingQuantity <= 0) break;

				const toDrop = Math.min(remainingQuantity, item.count);

				try {
					// アイテムをドロップ
					await bot.mc.toss(item.type, null, toDrop);
					remainingQuantity -= toDrop;

					console.log(
						`[${bot.getName()}] Dropped ${toDrop} ${item.displayName}`,
					);
				} catch (error) {
					console.error(`Error dropping item:`, error);
					bot.sendMessage(
						`アイテムのドロップ中にエラーが発生しました: ${error instanceof Error ? error.message : "Unknown error"}`,
					);
					return;
				}
			}

			bot.sendMessage(
				`${firstItem.displayName} x${quantity} をドロップしました！`,
			);
		} catch (error) {
			console.error(`[${bot.getName()}] Error in drop command:`, error);
			bot.sendMessage(
				`アイテムドロップ中にエラーが発生しました: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	/**
	 * 全てのアイテムをドロップ
	 * @param bot - 操作対象のボットインスタンス
	 */
	private async dropAllItems(bot: Bot): Promise<void> {
		const items = bot.mc.inventory.items();

		if (items.length === 0) {
			bot.sendMessage("インベントリにアイテムがありません。");
			return;
		}

		bot.sendMessage(`全てのアイテム（${items.length}種類）をドロップします...`);

		for (const item of items) {
			try {
				await bot.mc.toss(item.type, null, item.count);
				console.log(
					`[${bot.getName()}] Dropped all ${item.displayName} (${item.count})`,
				);
			} catch (error) {
				console.error(`Error dropping ${item.displayName}:`, error);
				bot.sendMessage(
					`${item.displayName} のドロップ中にエラーが発生しました。`,
				);
			}
		}

		bot.sendMessage("全てのアイテムをドロップしました！");
	}

	/**
	 * コマンド名を取得
	 * @returns コマンド名
	 */
	public getName(): string {
		return "drop";
	}

	/**
	 * コマンドの説明を取得
	 * @returns コマンドの説明
	 */
	public getDescription(): string {
		return 'アイテムをインベントリから捨てます。"all"で全てのアイテムを捨てます';
	}

	/**
	 * コマンドの使用法を取得
	 * @returns コマンドの使用法
	 */
	public getUsage(): string {
		return "@botname drop <アイテム名|all> [数量]";
	}
}
