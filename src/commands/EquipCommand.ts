import { ICommand } from "./ICommand";
import { Bot } from "../core/Bot";

/**
 * アイテム装備コマンドクラス
 * 指定されたアイテム（防具・武器・ツール）を装備する
 */
export class EquipCommand implements ICommand {
  /**
   * コマンドを実行
   * @param bot - 操作対象のボットインスタンス
   * @param username - コマンドを実行したプレイヤー名
   * @param args - コマンドの引数 [アイテム名] (省略可能)
   */
  public async execute(
    bot: Bot,
    username: string,
    args: string[]
  ): Promise<void> {
    try {
      console.log(`[${bot.getName()}] Equip command executed by ${username}`);

      if (args.length === 0) {
        // 引数なしの場合は自動装備
        await this.autoEquipBestGear(bot);
        return;
      }

      const itemName = args[0];

      // アイテムをインベントリから検索
      const matchingItems = bot.mc.inventory
        .items()
        .filter(
          (item) =>
            item.name.toLowerCase().includes(itemName.toLowerCase()) ||
            item.displayName.toLowerCase().includes(itemName.toLowerCase())
        );

      if (matchingItems.length === 0) {
        bot.sendMessage(`アイテム「${itemName}」が見つかりません。`);
        return;
      }

      const item = matchingItems[0];

      // 装備先を決定
      const equipmentSlot = this.getEquipmentSlot(item);

      if (!equipmentSlot) {
        bot.sendMessage(`${item.displayName} は装備できないアイテムです。`);
        return;
      }

      bot.sendMessage(`${item.displayName} を装備します...`);

      try {
        // アイテムを装備
        await bot.mc.equip(item, equipmentSlot);

        bot.sendMessage(`${item.displayName} を装備しました！`);
        console.log(
          `[${bot.getName()}] Equipped ${item.displayName} in ${equipmentSlot}`
        );
      } catch (error) {
        console.error(`Error equipping item:`, error);
        bot.sendMessage(
          `${item.displayName} の装備中にエラーが発生しました: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    } catch (error) {
      console.error(`[${bot.getName()}] Error in equip command:`, error);
    }
  }

  /**
   * 自動装備：インベントリにある最良の装備を自動で装備する
   * @param bot - ボットインスタンス
   */
  private async autoEquipBestGear(bot: Bot): Promise<void> {
    bot.sendMessage("利用可能な最良の装備を自動で装備します...");

    const equipped: string[] = [];
    const errors: string[] = [];

    try {
      // 各装備スロットに対して最良のアイテムを検索・装備
      const slots = [
        { slot: "hand" as const, name: "武器/ツール" },
        { slot: "head" as const, name: "ヘルメット" },
        { slot: "torso" as const, name: "チェストプレート" },
        { slot: "legs" as const, name: "レギンス" },
        { slot: "feet" as const, name: "ブーツ" },
        { slot: "off-hand" as const, name: "盾" },
      ];

      for (const { slot, name } of slots) {
        try {
          const bestItem = this.findBestItemForSlot(bot, slot);

          if (bestItem) {
            await bot.mc.equip(bestItem, slot);
            equipped.push(`${name}: ${bestItem.displayName}`);
            console.log(
              `[${bot.getName()}] Auto-equipped ${
                bestItem.displayName
              } in ${slot}`
            );

            // 短い待機時間を設ける（装備処理の安定化）
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        } catch (error) {
          console.error(`Error auto-equipping ${slot}:`, error);
          errors.push(`${name}の装備中にエラー`);
        }
      }

      // 結果を報告
      if (equipped.length > 0) {
        bot.sendMessage("装備完了:");
        equipped.forEach((item) => bot.sendMessage(`  ${item}`));
      } else {
        bot.sendMessage("装備可能なアイテムが見つかりませんでした。");
      }

      if (errors.length > 0) {
        bot.sendMessage("エラーが発生した装備:");
        errors.forEach((error) => bot.sendMessage(`  ${error}`));
      }
    } catch (error) {
      console.error(`[${bot.getName()}] Error in auto-equip:`, error);
      bot.sendMessage(
        `自動装備中にエラーが発生しました: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * 指定されたスロットに最適なアイテムを検索
   * @param bot - ボットインスタンス
   * @param slot - 装備スロット
   * @returns 最良のアイテム | null
   */
  private findBestItemForSlot(
    bot: Bot,
    slot: "hand" | "head" | "torso" | "legs" | "feet" | "off-hand"
  ): any | null {
    const items = bot.mc.inventory.items();
    const candidates = items.filter(
      (item) => this.getEquipmentSlot(item) === slot
    );

    if (candidates.length === 0) {
      return null;
    }

    // アイテムの質を評価して最良のものを選択
    return candidates.reduce((best, current) => {
      const bestScore = this.calculateItemScore(best, slot);
      const currentScore = this.calculateItemScore(current, slot);
      return currentScore > bestScore ? current : best;
    });
  }

  /**
   * アイテムの質を数値で評価
   * @param item - 評価するアイテム
   * @param slot - 装備スロット
   * @returns スコア（高いほど良い）
   */
  private calculateItemScore(
    item: any,
    slot: "hand" | "head" | "torso" | "legs" | "feet" | "off-hand"
  ): number {
    const itemName = item.name.toLowerCase();
    let score = 0;

    // 素材による基本スコア
    if (itemName.includes("netherite")) score += 50;
    else if (itemName.includes("diamond")) score += 40;
    else if (itemName.includes("iron")) score += 30;
    else if (itemName.includes("golden") || itemName.includes("gold"))
      score += 25;
    else if (itemName.includes("stone")) score += 20;
    else if (itemName.includes("leather")) score += 15;
    else if (itemName.includes("wooden") || itemName.includes("wood"))
      score += 10;
    else score += 5; // デフォルトスコア

    // 装備タイプごとの追加スコア
    if (slot === "hand") {
      // 武器/ツールの場合
      if (itemName.includes("sword")) score += 15;
      else if (itemName.includes("axe")) score += 12;
      else if (itemName.includes("pickaxe")) score += 10;
      else if (itemName.includes("shovel")) score += 8;
      else if (itemName.includes("hoe")) score += 5;
      else if (itemName.includes("bow") || itemName.includes("crossbow"))
        score += 13;
      else if (itemName.includes("trident")) score += 16;
    } else if (slot === "off-hand") {
      // 盾の場合
      if (itemName.includes("shield")) score += 20;
    } else {
      // 防具の場合
      if (
        itemName.includes("helmet") ||
        itemName.includes("chestplate") ||
        itemName.includes("leggings") ||
        itemName.includes("boots")
      ) {
        score += 10;
      }
    }

    // エンチャントがある場合のボーナス（推定）
    if (item.enchants && item.enchants.length > 0) {
      score += item.enchants.length * 5;
    }

    // 耐久値による調整
    if (item.durabilityUsed && item.maxDurability) {
      const durabilityRatio =
        (item.maxDurability - item.durabilityUsed) / item.maxDurability;
      score *= durabilityRatio;
    }

    return score;
  }

  /**
   * アイテムの装備先スロットを決定
   * @param item - 装備するアイテム
   * @returns 装備先スロット名 | null
   */
  private getEquipmentSlot(
    item: any
  ): "hand" | "head" | "torso" | "legs" | "feet" | "off-hand" | null {
    const itemName = item.name.toLowerCase();

    // 武器・ツール類
    if (
      itemName.includes("sword") ||
      itemName.includes("axe") ||
      itemName.includes("pickaxe") ||
      itemName.includes("shovel") ||
      itemName.includes("spade") ||
      itemName.includes("hoe") ||
      itemName.includes("bow") ||
      itemName.includes("crossbow") ||
      itemName.includes("trident") ||
      itemName.includes("rod") ||
      itemName.includes("stick") ||
      itemName.includes("flint_and_steel") ||
      itemName.includes("shears")
    ) {
      return "hand";
    }

    // ヘルメット
    if (
      itemName.includes("helmet") ||
      itemName.includes("cap") ||
      itemName.includes("_helmet")
    ) {
      return "head";
    }

    // チェストプレート
    if (
      itemName.includes("chestplate") ||
      itemName.includes("tunic") ||
      itemName.includes("_chestplate")
    ) {
      return "torso";
    }

    // レギンス
    if (
      itemName.includes("leggings") ||
      itemName.includes("pants") ||
      itemName.includes("_leggings")
    ) {
      return "legs";
    }

    // ブーツ
    if (
      itemName.includes("boots") ||
      itemName.includes("shoes") ||
      itemName.includes("_boots")
    ) {
      return "feet";
    }

    // 盾
    if (itemName.includes("shield")) {
      return "off-hand";
    }

    // エリトラ
    if (itemName.includes("elytra")) {
      return "torso";
    }

    // カボチャ（頭装備）
    if (itemName.includes("pumpkin")) {
      return "head";
    }

    // 特殊なケース: 一般的なアイテム名パターン
    const displayName = item.displayName.toLowerCase();

    if (displayName.includes("helmet") || displayName.includes("cap")) {
      return "head";
    }

    if (displayName.includes("chestplate") || displayName.includes("tunic")) {
      return "torso";
    }

    if (displayName.includes("leggings") || displayName.includes("pants")) {
      return "legs";
    }

    if (displayName.includes("boots") || displayName.includes("shoes")) {
      return "feet";
    }

    // その他のアイテムは手に持つ
    return "hand";
  }

  /**
   * コマンド名を取得
   * @returns コマンド名
   */
  public getName(): string {
    return "equip";
  }

  /**
   * コマンドの説明を取得
   * @returns コマンドの説明
   */
  public getDescription(): string {
    return "指定されたアイテムを装備、または引数なしで最良の装備を自動装備します";
  }

  /**
   * コマンドの使用法を取得
   * @returns コマンドの使用法
   */
  public getUsage(): string {
    return "@botname equip [アイテム名] - 指定したアイテムを装備、省略時は自動で最良の装備を装備";
  }
}
