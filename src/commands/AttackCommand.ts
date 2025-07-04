import { ICommand } from './ICommand';
import { Bot } from '../core/Bot';
import { AttackingState } from '../states/AttackingState';

/**
 * 攻撃コマンドクラス
 * 指定されたエンティティを攻撃する
 */
export class AttackCommand implements ICommand {
  /**
   * コマンドを実行
   * @param bot - 操作対象のボットインスタンス
   * @param username - コマンドを実行したプレイヤー名
   * @param args - コマンドの引数 [エンティティ名またはプレイヤー名]
   */
  public async execute(bot: Bot, username: string, args: string[]): Promise<void> {
    try {
      console.log(`[${bot.getName()}] Attack command executed by ${username}`);
      
      if (args.length === 0) {
        bot.sendMessage('使用法: @botname attack <エンティティ名またはプレイヤー名>');
        return;
      }
      
      const targetName = args[0];
      
      // 近くのエンティティを検索
      const nearbyEntities = Object.values(bot.mc.entities).filter(entity => {
        if (!entity || !entity.position) return false;
        
        // 距離チェック（20ブロック以内）
        const distance = bot.mc.entity.position.distanceTo(entity.position);
        if (distance > 20) return false;
        
        // 名前チェック
        if (entity.name && entity.name.toLowerCase().includes(targetName.toLowerCase())) {
          return true;
        }
        
        // プレイヤー名チェック
        if (entity.username && entity.username.toLowerCase().includes(targetName.toLowerCase())) {
          return true;
        }
        
        // エンティティタイプチェック
        if (entity.type && entity.type.toLowerCase().includes(targetName.toLowerCase())) {
          return true;
        }
        
        return false;
      });
      
      if (nearbyEntities.length === 0) {
        bot.sendMessage(`「${targetName}」というエンティティが見つかりません。`);
        return;
      }
      
      // 最も近いエンティティを選択
      const target = nearbyEntities.reduce((closest, current) => {
        if (!closest) return current;
        
        const closestDistance = bot.mc.entity.position.distanceTo(closest.position);
        const currentDistance = bot.mc.entity.position.distanceTo(current.position);
        
        return currentDistance < closestDistance ? current : closest;
      });
      
      if (!target) {
        bot.sendMessage(`攻撃対象が見つかりません。`);
        return;
      }
      
      // 自分自身を攻撃しようとしている場合は拒否
      if (target.username === bot.getName()) {
        bot.sendMessage('自分自身を攻撃することはできません。');
        return;
      }
      
      const distance = bot.mc.entity.position.distanceTo(target.position);
      const targetDisplayName = target.name || target.username || target.type || 'unknown';
      
      bot.sendMessage(`${targetDisplayName} を攻撃します！（距離: ${distance.toFixed(1)}）`);
      
      // 攻撃状態に変更
      const attackingState = new AttackingState(target, () => {
        bot.sendMessage(`${targetDisplayName} への攻撃を終了しました。`);
      });
      
      bot.changeState(attackingState);
      
    } catch (error) {
      console.error(`[${bot.getName()}] Error in attack command:`, error);
      bot.sendMessage(`攻撃中にエラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * コマンド名を取得
   * @returns コマンド名
   */
  public getName(): string {
    return 'attack';
  }

  /**
   * コマンドの説明を取得
   * @returns コマンドの説明
   */
  public getDescription(): string {
    return '指定されたエンティティまたはプレイヤーを攻撃します';
  }

  /**
   * コマンドの使用法を取得
   * @returns コマンドの使用法
   */
  public getUsage(): string {
    return '@botname attack <エンティティ名またはプレイヤー名>';
  }
}
