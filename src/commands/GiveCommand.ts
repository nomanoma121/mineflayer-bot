import { ICommand } from './ICommand';
import { Bot } from '../core/Bot';

/**
 * アイテム提供コマンドクラス
 * 指定されたプレイヤーにアイテムを提供する
 */
export class GiveCommand implements ICommand {
  /**
   * コマンドを実行
   * @param bot - 操作対象のボットインスタンス
   * @param username - コマンドを実行したプレイヤー名
   * @param args - コマンドの引数 [プレイヤー名, アイテム名, 数量]
   */
  public async execute(bot: Bot, username: string, args: string[]): Promise<void> {
    try {
      console.log(`[${bot.getName()}] Give command executed by ${username}`);
      
      if (args.length < 2) {
        bot.sendMessage('使用法: @botname give <プレイヤー名> <アイテム名> [数量]');
        return;
      }
      
      const targetPlayerName = args[0];
      const itemName = args[1];
      const quantity = args.length > 2 ? parseInt(args[2]) : 1;
      
      if (isNaN(quantity) || quantity <= 0) {
        bot.sendMessage('数量は1以上の数値で指定してください。');
        return;
      }
      
      // ターゲットプレイヤーが存在するかチェック
      const targetPlayer = bot.mc.players[targetPlayerName];
      if (!targetPlayer || !targetPlayer.entity) {
        bot.sendMessage(`プレイヤー「${targetPlayerName}」が見つかりません。`);
        return;
      }
      
      // アイテムをインベントリから検索
      const matchingItems = bot.mc.inventory.items().filter(item => 
        item.name.toLowerCase().includes(itemName.toLowerCase()) || 
        item.displayName.toLowerCase().includes(itemName.toLowerCase())
      );
      
      if (matchingItems.length === 0) {
        bot.sendMessage(`アイテム「${itemName}」が見つかりません。`);
        return;
      }
      
      // アイテムの総数を計算
      const totalQuantity = matchingItems.reduce((total, item) => total + item.count, 0);
      
      if (totalQuantity < quantity) {
        bot.sendMessage(`アイテム「${itemName}」が不足しています。必要: ${quantity}, 所持: ${totalQuantity}`);
        return;
      }
      
      // プレイヤーまでの距離をチェック
      const distance = bot.mc.entity.position.distanceTo(targetPlayer.entity.position);
      if (distance > 4) {
        bot.sendMessage(`プレイヤー「${targetPlayerName}」までの距離が遠すぎます（距離: ${distance.toFixed(1)}）。近づいてください。`);
        return;
      }
      
      const firstItem = matchingItems[0];
      let remainingQuantity = quantity;
      
      bot.sendMessage(`${targetPlayerName} に ${firstItem.displayName} x${quantity} を渡します...`);
      
      // 複数スタックにまたがる場合の処理
      for (const item of matchingItems) {
        if (remainingQuantity <= 0) break;
        
        const toToss = Math.min(remainingQuantity, item.count);
        
        try {
          // アイテムをトス（プレイヤーの方向に投げる）
          await bot.mc.toss(item.type, null, toToss);
          remainingQuantity -= toToss;
          
          console.log(`[${bot.getName()}] Tossed ${toToss} ${item.displayName} towards ${targetPlayerName}`);
        } catch (error) {
          console.error(`Error tossing item:`, error);
          bot.sendMessage(`アイテムの投擲中にエラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
          return;
        }
      }
      
      bot.sendMessage(`${targetPlayerName} に ${firstItem.displayName} x${quantity} を渡しました！`);
      
    } catch (error) {
      console.error(`[${bot.getName()}] Error in give command:`, error);
      bot.sendMessage(`アイテム提供中にエラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * コマンド名を取得
   * @returns コマンド名
   */
  public getName(): string {
    return 'give';
  }

  /**
   * コマンドの説明を取得
   * @returns コマンドの説明
   */
  public getDescription(): string {
    return '指定されたプレイヤーにアイテムを提供します';
  }

  /**
   * コマンドの使用法を取得
   * @returns コマンドの使用法
   */
  public getUsage(): string {
    return '@botname give <プレイヤー名> <アイテム名> [数量]';
  }
}
