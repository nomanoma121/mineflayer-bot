import { IBotState } from './IBotState';
import { Bot } from '../core/Bot';
import { goals } from 'mineflayer-pathfinder';

/**
 * プレイヤー追従状態クラス
 * 指定されたプレイヤーを一定距離で追従し続ける状態
 */
export class FollowingState implements IBotState {
  private targetPlayerName: string;
  private followDistance: number;
  private isActive: boolean = false;

  constructor(targetPlayerName: string, followDistance: number = 2) {
    this.targetPlayerName = targetPlayerName;
    this.followDistance = followDistance;
  }

  /**
   * 追従状態に入る際の処理
   * @param bot - ボットインスタンス
   */
  public enter(bot: Bot): void {
    console.log(`[${bot.getName()}] Entering Following State - Target: ${this.targetPlayerName}`);
    this.isActive = true;
    
    bot.sendMessage(`${this.targetPlayerName}さんの追従を開始します。`);
    this.startFollowing(bot);
  }

  /**
   * 追従状態から出る際の処理
   * @param bot - ボットインスタンス
   */
  public exit(bot: Bot): void {
    console.log(`[${bot.getName()}] Exiting Following State`);
    this.isActive = false;
    
    if (bot.mc.pathfinder) {
      bot.mc.pathfinder.stop();
    }
  }

  /**
   * 追従状態における定期実行処理
   * @param bot - ボットインスタンス
   */
  public execute(bot: Bot): void {
    if (!this.isActive) return;

    // ターゲットプレイヤーがオンラインかチェック
    const targetPlayer = bot.mc.players[this.targetPlayerName];
    if (!targetPlayer || !targetPlayer.entity) {
      console.log(`[${bot.getName()}] Target player ${this.targetPlayerName} not found`);
      bot.sendMessage(`${this.targetPlayerName}さんが見つかりません。追従を停止します。`);
      // IdleStateに戻る
      const { IdleState } = require('./IdleState');
      bot.changeState(IdleState.getInstance());
      return;
    }

    // 距離をチェックして必要に応じて追従を再開
    const distance = bot.mc.entity.position.distanceTo(targetPlayer.entity.position);
    if (distance > this.followDistance + 2) {
      this.startFollowing(bot);
    }
  }

  /**
   * 追従を開始する
   * @param bot - ボットインスタンス
   */
  private startFollowing(bot: Bot): void {
    try {
      const targetPlayer = bot.mc.players[this.targetPlayerName];
      if (!targetPlayer || !targetPlayer.entity) {
        return;
      }

      const followGoal = new goals.GoalFollow(targetPlayer.entity, this.followDistance);
      bot.mc.pathfinder.setGoal(followGoal, true);
      
      console.log(`[${bot.getName()}] Following ${this.targetPlayerName} at distance ${this.followDistance}`);
    } catch (error) {
      console.error(`[${bot.getName()}] Error starting follow:`, error);
      bot.sendMessage(`追従中にエラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 状態の名前を取得
   * @returns 状態名
   */
  public getName(): string {
    return `Following(${this.targetPlayerName})`;
  }

  /**
   * 追従対象のプレイヤー名を取得
   * @returns プレイヤー名
   */
  public getTargetPlayer(): string {
    return this.targetPlayerName;
  }
}
