import { ICommand } from './ICommand';
import { Bot } from '../core/Bot';
import { AttackingState } from '../states/AttackingState';
import { EntityUtils } from '../utils/EntityUtils';
import { CommandUtils } from '../utils/CommandUtils';

/**
 * 殺害コマンドクラス
 * 指定されたエンティティを倒すまで攻撃を続ける
 */
export class KillCommand implements ICommand {
  /**
   * コマンドを実行
   * @param bot - 操作対象のボットインスタンス
   * @param username - コマンドを実行したプレイヤー名
   * @param args - コマンドの引数 [エンティティ名またはプレイヤー名]
   */
  public async execute(bot: Bot, username: string, args: string[]): Promise<void> {
    try {
      CommandUtils.logCommandExecution(bot, 'kill', username, args);
      
      if (!CommandUtils.validateArgumentCount(args, 1, this.getUsage(), bot)) {
        return;
      }
      
      const targetName = args[0];
      
      // 近くのエンティティを検索（killコマンドは範囲を広めに設定）
      const nearbyEntities = EntityUtils.findNearbyEntitiesByName(bot, targetName, 30);
      
      if (nearbyEntities.length === 0) {
        bot.sendMessage(`「${targetName}」というエンティティが見つかりません。`);
        return;
      }
      
      // 最も近いエンティティを選択
      const target = EntityUtils.findClosestEntity(bot, nearbyEntities);
      
      if (!target) {
        bot.sendMessage(`攻撃対象が見つかりません。`);
        return;
      }
      
      // 自分自身を攻撃しようとしている場合は拒否
      if (!EntityUtils.canAttackTarget(bot, target)) {
        bot.sendMessage('自分自身を攻撃することはできません。');
        return;
      }
      
      const distance = EntityUtils.getDistanceToEntity(bot, target);
      const targetDisplayName = EntityUtils.getEntityDisplayName(target);
      
      bot.sendMessage(`${targetDisplayName} を倒します！（距離: ${distance.toFixed(1)}）`);
      
      // 攻撃状態に変更（倒すまで継続）
      // 現在の状態を保存しておいて、戦闘終了後に戻る
      const currentState = bot.getCurrentState();
      const attackingState = new AttackingState(bot, target, currentState || undefined, () => {
        bot.sendMessage(`${targetDisplayName} を倒しました！`);
      });
      
      await bot.changeState(attackingState);
      
    } catch (error) {
      CommandUtils.handleCommandError(bot, 'kill', error);
    }
  }

  /**
   * コマンド名を取得
   * @returns コマンド名
   */
  public getName(): string {
    return 'kill';
  }

  /**
   * コマンドの説明を取得
   * @returns コマンドの説明
   */
  public getDescription(): string {
    return '指定されたエンティティまたはプレイヤーを倒すまで攻撃し続けます';
  }

  /**
   * コマンドの使用法を取得
   * @returns コマンドの使用法
   */
  public getUsage(): string {
    return '@botname kill <エンティティ名またはプレイヤー名>';
  }
}
