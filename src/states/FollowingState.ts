import { IBotState } from './IBotState';
import { Bot } from '../core/Bot';
import { goals } from 'mineflayer-pathfinder';

/**
 * プレイヤー追従状態クラス
 * 指定されたプレイヤーを一定距離で追従し続ける状態
 */
export class FollowingState implements IBotState {
  private readonly targetPlayerName: string;
  private readonly distance: number;

  constructor(targetPlayerName: string, distance: number = 2) {
    this.targetPlayerName = targetPlayerName;
    this.distance = distance;
  }

  /**
   * 追従状態に入る際の処理
   * @param bot - ボットインスタンス
   */
  public enter(bot: Bot): void {
    console.log(`[${bot.getName()}] Entering Following State - Target: ${this.targetPlayerName}`);
    
    const target = bot.mc.players[this.targetPlayerName]?.entity;
    if (!target) {
      bot.sendMessage(`ターゲット「${this.targetPlayerName}」が見つかりません。`);
      bot.changeStateToIdle();
      return;
    }

    bot.sendMessage(`${this.targetPlayerName}さんの追従を開始します。`);
    const goal = new goals.GoalFollow(target, this.distance);
    bot.mc.pathfinder.setGoal(goal, true);
  }

  /**
   * 追従状態から出る際の処理
   * @param bot - ボットインスタンス
   */
  public exit(bot: Bot): void {
    console.log(`[${bot.getName()}] Exiting Following State`);
    
    // 状態を抜ける時に、現在の移動目標をクリアする
    if (bot.mc.pathfinder) {
      bot.mc.pathfinder.stop();
    }
  }

  /**
   * 追従状態における定期実行処理
   * @param bot - ボットインスタンス
   */
  public execute(bot: Bot): void {
    // ターゲットがサーバーからいなくなったら、追従を止めて待機状態に戻る
    const target = bot.mc.players[this.targetPlayerName]?.entity;
    if (!target) {
      bot.sendMessage(`${this.targetPlayerName}さんを見失いました。追従を停止します。`);
      bot.changeStateToIdle();
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
