import { ICommand } from './ICommand';
import { Bot } from '../core/Bot';

/**
 * アイテム装備コマンドクラス
 * 指定されたアイテム（防具・武器・ツール）を装備する
 */
export class EquipCommand implements ICommand {
  /**
   * コマンドを実行
   * @param bot - 操作対象のボットインスタンス
   * @param username - コマンドを実行したプレイヤー名
   * @param args - コマンドの引数 [アイテム名]
   */
  public async execute(bot: Bot, username: string, args: string[]): Promise<void> {
    try {
      console.log(`[${bot.getName()}] Equip command executed by ${username}`);
      
      if (args.length === 0) {
        bot.sendMessage('使用法: @botname equip <アイテム名>');
        return;
      }
      
      const itemName = args[0];
      
      // アイテムをインベントリから検索
      const matchingItems = bot.mc.inventory.items().filter(item => 
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
        console.log(`[${bot.getName()}] Equipped ${item.displayName} in ${equipmentSlot}`);
        
      } catch (error) {
        console.error(`Error equipping item:`, error);
        bot.sendMessage(`${item.displayName} の装備中にエラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
    } catch (error) {
      console.error(`[${bot.getName()}] Error in equip command:`, error);
      bot.sendMessage(`装備中にエラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * アイテムの装備先スロットを決定
   * @param item - 装備するアイテム
   * @returns 装備先スロット名 | null
   */
  private getEquipmentSlot(item: any): 'hand' | 'head' | 'torso' | 'legs' | 'feet' | 'off-hand' | null {
    const itemName = item.name.toLowerCase();
    
    // 武器・ツール類
    if (itemName.includes('sword') || 
        itemName.includes('axe') || 
        itemName.includes('pickaxe') || 
        itemName.includes('shovel') || 
        itemName.includes('spade') || 
        itemName.includes('hoe') || 
        itemName.includes('bow') || 
        itemName.includes('crossbow') || 
        itemName.includes('trident') || 
        itemName.includes('rod') ||
        itemName.includes('stick') ||
        itemName.includes('flint_and_steel') ||
        itemName.includes('shears')) {
      return 'hand';
    }
    
    // ヘルメット
    if (itemName.includes('helmet') || 
        itemName.includes('cap') ||
        itemName.includes('_helmet')) {
      return 'head';
    }
    
    // チェストプレート
    if (itemName.includes('chestplate') || 
        itemName.includes('tunic') ||
        itemName.includes('_chestplate')) {
      return 'torso';
    }
    
    // レギンス
    if (itemName.includes('leggings') || 
        itemName.includes('pants') ||
        itemName.includes('_leggings')) {
      return 'legs';
    }
    
    // ブーツ
    if (itemName.includes('boots') || 
        itemName.includes('shoes') ||
        itemName.includes('_boots')) {
      return 'feet';
    }
    
    // 盾
    if (itemName.includes('shield')) {
      return 'off-hand';
    }
    
    // エリトラ
    if (itemName.includes('elytra')) {
      return 'torso';
    }
    
    // カボチャ（頭装備）
    if (itemName.includes('pumpkin')) {
      return 'head';
    }
    
    // 特殊なケース: 一般的なアイテム名パターン
    const displayName = item.displayName.toLowerCase();
    
    if (displayName.includes('helmet') || displayName.includes('cap')) {
      return 'head';
    }
    
    if (displayName.includes('chestplate') || displayName.includes('tunic')) {
      return 'torso';
    }
    
    if (displayName.includes('leggings') || displayName.includes('pants')) {
      return 'legs';
    }
    
    if (displayName.includes('boots') || displayName.includes('shoes')) {
      return 'feet';
    }
    
    // その他のアイテムは手に持つ
    return 'hand';
  }

  /**
   * コマンド名を取得
   * @returns コマンド名
   */
  public getName(): string {
    return 'equip';
  }

  /**
   * コマンドの説明を取得
   * @returns コマンドの説明
   */
  public getDescription(): string {
    return '指定されたアイテム（防具・武器・ツール）を装備します';
  }

  /**
   * コマンドの使用法を取得
   * @returns コマンドの使用法
   */
  public getUsage(): string {
    return '@botname equip <アイテム名>';
  }
}
