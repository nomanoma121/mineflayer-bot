import { IBotState } from "./IBotState";
import { Bot } from "../core/Bot";
import { goals } from "mineflayer-pathfinder";
import { Vec3 } from "vec3";

/**
 * 放浪状態クラス
 * 指定された範囲内をランダムに移動し続ける
 */
export class WanderingState implements IBotState {
  private bot: Bot;
  private range: number;
  private centerPoint: Vec3;
  private currentTarget: Vec3 | null = null;
  private isMoving: boolean = false;

  constructor(bot: Bot, range: number = 30) {
    this.bot = bot;
    this.range = range;
    this.centerPoint = bot.mc.entity.position.clone();
  }

  /**
   * 放浪状態に入る際の初期化処理
   */
  public async enter(): Promise<void> {
    console.log(`[${this.bot.getName()}] Entering Wandering state. Range: ${this.range} blocks`);
    
    // 現在の位置を中心点として保存
    this.centerPoint = this.bot.mc.entity.position.clone();
    
    // 最初のランダムな目標地点への移動を開始
    this.setRandomTarget();
  }

  /**
   * 放浪状態から出る際の終了処理
   */
  public exit(): void {
    console.log(`[${this.bot.getName()}] Exiting Wandering state`);
    
    // 移動を停止
    this.bot.mc.pathfinder.stop();
    this.isMoving = false;
    this.currentTarget = null;
  }

  /**
   * 放浪状態の定期実行処理
   */
  public execute(): void {
    if (!this.currentTarget) {
      this.setRandomTarget();
      return;
    }

    // 目標地点に到着したかチェック
    if (this.hasReachedTarget()) {
      console.log(`[${this.bot.getName()}] Reached target, setting new random destination`);
      this.setRandomTarget();
    }

    // 移動が停止していたら再開
    if (!this.isMoving) {
      this.moveToTarget();
    }
  }

  /**
   * 状態の名前を取得
   */
  public getName(): string {
    return "Wandering";
  }

  /**
   * ランダムな目標地点を設定
   */
  private setRandomTarget(): void {
    // 中心点から指定範囲内のランダムな座標を生成
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * this.range;
    
    const x = this.centerPoint.x + Math.cos(angle) * distance;
    const z = this.centerPoint.z + Math.sin(angle) * distance;
    
    // Y座標は現在の高さを基準に±10ブロック程度の範囲
    const y = this.centerPoint.y + (Math.random() - 0.5) * 20;
    
    this.currentTarget = new Vec3(x, y, z);
    
    console.log(`[${this.bot.getName()}] New wander target: (${x.toFixed(1)}, ${y.toFixed(1)}, ${z.toFixed(1)})`);
    
    this.moveToTarget();
  }

  /**
   * 目標地点への移動を開始
   */
  private moveToTarget(): void {
    if (!this.currentTarget) return;
    
    try {
      const goal = new goals.GoalNear(
        this.currentTarget.x,
        this.currentTarget.y,
        this.currentTarget.z,
        3 // 3ブロック以内に到達すれば成功
      );
      
      this.bot.mc.pathfinder.setGoal(goal);
      this.isMoving = true;
      
      console.log(`[${this.bot.getName()}] Starting movement to wander target`);
    } catch (error) {
      console.error(`[${this.bot.getName()}] Error setting wander target:`, error);
      // エラーが発生した場合は新しい目標を設定
      this.setRandomTarget();
    }
  }

  /**
   * 目標地点に到達したかチェック
   */
  private hasReachedTarget(): boolean {
    if (!this.currentTarget) return false;
    
    const distance = this.bot.mc.entity.position.distanceTo(this.currentTarget);
    
    // 5ブロック以内に到達、または移動が停止していたら到達とみなす
    if (distance <= 5 || !this.bot.mc.pathfinder.isMoving()) {
      this.isMoving = false;
      return true;
    }
    
    return false;
  }
}
