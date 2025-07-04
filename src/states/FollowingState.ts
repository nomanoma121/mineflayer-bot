import { IBotState } from './IBotState';
import { Bot } from '../core/Bot';
import { goals } from 'mineflayer-pathfinder';

/**
 * プレイヤー追従状態クラス
 * 指定されたプレイヤーを一定距離で追従し続ける状態
 */
export class FollowingState implements IBotState {
  private readonly bot: Bot;
  private readonly targetPlayerName: string;
  private readonly distance: number;
  private targetLostTime: number = 0;
  private readonly maxTargetLostTime: number = 5000; // 5秒間見失ったら停止
  private isFollowingActive: boolean = false;

  constructor(bot: Bot, targetPlayerName: string, distance: number = 2) {
    this.bot = bot;
    this.targetPlayerName = targetPlayerName;
    this.distance = distance;
  }

  /**
   * 追従状態に入る際の処理
   */
  public enter(): void {
    console.log(`[${this.bot.getName()}] Entering Following State - Target: ${this.targetPlayerName}`);
    
    // プレイヤーがサーバーに存在するかチェック
    if (!this.bot.mc.players[this.targetPlayerName]) {
      this.bot.sendMessage(`プレイヤー「${this.targetPlayerName}」が見つかりません。`);
      this.bot.changeStateToIdle();
      return;
    }

    this.bot.sendMessage(`${this.targetPlayerName}さんの追従を開始します。`);
    this.startFollowing();
    this.isFollowingActive = true;
  }

  /**
   * 追従状態から出る際の処理
   */
  public exit(): void {
    console.log(`[${this.bot.getName()}] Exiting Following State`);
    this.isFollowingActive = false;
    
    // 状態を抜ける時に、現在の移動目標をクリアする
    if (this.bot.mc.pathfinder) {
      this.bot.mc.pathfinder.stop();
    }
  }

  /**
   * 追従状態における定期実行処理
   */
  public execute(): void {
    if (!this.isFollowingActive) return;
    
    // プレイヤーがサーバーから完全に退出したかチェック
    if (!this.bot.mc.players[this.targetPlayerName]) {
      this.bot.sendMessage(`${this.targetPlayerName}さんがサーバーから退出しました。追従を停止します。`);
      this.bot.changeStateToIdle();
      return;
    }

    // エンティティが一時的に見えない場合の処理
    const target = this.bot.mc.players[this.targetPlayerName]?.entity;
    if (!target) {
      this.targetLostTime += 100; // executeは100ms毎に呼ばれる
      if (this.targetLostTime > this.maxTargetLostTime) {
        this.bot.sendMessage(`${this.targetPlayerName}さんを長時間見失いました。追従を停止します。`);
        this.bot.changeStateToIdle();
      }
      return;
    }

    // ターゲットが見つかった場合、タイマーをリセット
    this.targetLostTime = 0;
    
    // パスファインダーが動いていない場合のみ再設定
    if (!this.bot.mc.pathfinder.isMoving()) {
      this.startFollowing();
    }
  }

  /**
   * 追従開始処理
   */
  private startFollowing(): void {
    const target = this.bot.mc.players[this.targetPlayerName]?.entity;
    if (target) {
      const goal = new goals.GoalFollow(target, this.distance);
      this.bot.mc.pathfinder.setGoal(goal, true);
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
