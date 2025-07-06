import { IBotState } from "./IBotState";
import { Bot } from "../core/Bot";
import { goals } from "mineflayer-pathfinder";
import { Vec3 } from "vec3";

/**
 * 探検状態クラス
 * 未踏の領域を探索し続ける
 */
export class ExploringState implements IBotState {
  private bot: Bot;
  private startPosition: Vec3;
  private currentTarget: Vec3 | null = null;
  private exploredChunks: Set<string> = new Set();
  private explorationRadius: number = 0;
  private maxRadius: number = 500;
  private isMoving: boolean = false;

  constructor(bot: Bot) {
    this.bot = bot;
    this.startPosition = bot.mc.entity.position.clone();
  }

  /**
   * 探検状態に入る際の初期化処理
   */
  public async enter(): Promise<void> {
    console.log(`[${this.bot.getName()}] Entering Exploring state`);
    
    this.startPosition = this.bot.mc.entity.position.clone();
    this.exploredChunks.clear();
    this.explorationRadius = 50; // 最初の探索範囲
    
    // 現在のチャンクを探索済みとしてマーク
    this.markCurrentChunkAsExplored();
    
    // 最初の未踏の目標を設定
    this.setNextExplorationTarget();
  }

  /**
   * 探検状態から出る際の終了処理
   */
  public exit(): void {
    console.log(`[${this.bot.getName()}] Exiting Exploring state`);
    
    // 移動を停止
    this.bot.mc.pathfinder.stop();
    this.isMoving = false;
    this.currentTarget = null;
  }

  /**
   * 探検状態の定期実行処理
   */
  public execute(): void {
    if (!this.currentTarget) {
      this.setNextExplorationTarget();
      return;
    }

    // 目標地点に到達したかチェック
    if (this.hasReachedTarget()) {
      console.log(`[${this.bot.getName()}] Reached exploration target, marking area as explored`);
      
      // 現在の位置を探索済みとしてマーク
      this.markCurrentChunkAsExplored();
      
      // 次の未踏の目標を設定
      this.setNextExplorationTarget();
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
    return "Exploring";
  }

  /**
   * 次の探索目標を設定
   */
  private setNextExplorationTarget(): void {
    // 未踏の方向を探す
    const target = this.findUnexploredTarget();
    
    if (target) {
      this.currentTarget = target;
      console.log(`[${this.bot.getName()}] New exploration target: (${target.x.toFixed(1)}, ${target.y.toFixed(1)}, ${target.z.toFixed(1)})`);
      this.moveToTarget();
    } else {
      // 探索範囲を拡大
      this.explorationRadius = Math.min(this.explorationRadius + 50, this.maxRadius);
      console.log(`[${this.bot.getName()}] Expanding exploration radius to ${this.explorationRadius}`);
      
      if (this.explorationRadius >= this.maxRadius) {
        console.log(`[${this.bot.getName()}] Reached maximum exploration radius, stopping`);
        this.bot.sendMessage("最大探索範囲に到達しました。探検を終了します。");
        this.bot.changeStateToIdle().catch(error => {
          console.error(`[${this.bot.getName()}] Error changing to idle state:`, error);
        });
        return;
      }
      
      // 新しい範囲で再試行
      this.setNextExplorationTarget();
    }
  }

  /**
   * 未踏の目標地点を探す
   */
  private findUnexploredTarget(): Vec3 | null {
    const attempts = 20; // 最大試行回数
    
    for (let i = 0; i < attempts; i++) {
      const angle = (Math.PI * 2 * i) / attempts;
      const x = this.startPosition.x + Math.cos(angle) * this.explorationRadius;
      const z = this.startPosition.z + Math.sin(angle) * this.explorationRadius;
      const y = this.startPosition.y + (Math.random() - 0.5) * 20;
      
      const chunkKey = this.getChunkKey(x, z);
      
      if (!this.exploredChunks.has(chunkKey)) {
        return new Vec3(x, y, z);
      }
    }
    
    return null;
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
        5 // 5ブロック以内に到達すれば成功
      );
      
      this.bot.mc.pathfinder.setGoal(goal);
      this.isMoving = true;
      
      console.log(`[${this.bot.getName()}] Starting movement to exploration target`);
    } catch (error) {
      console.error(`[${this.bot.getName()}] Error setting exploration target:`, error);
      // エラーが発生した場合は新しい目標を設定
      this.setNextExplorationTarget();
    }
  }

  /**
   * 目標地点に到達したかチェック
   */
  private hasReachedTarget(): boolean {
    if (!this.currentTarget) return false;
    
    const distance = this.bot.mc.entity.position.distanceTo(this.currentTarget);
    
    // 10ブロック以内に到達、または移動が停止していたら到達とみなす
    if (distance <= 10 || !this.bot.mc.pathfinder.isMoving()) {
      this.isMoving = false;
      return true;
    }
    
    return false;
  }

  /**
   * 現在のチャンクを探索済みとしてマーク
   */
  private markCurrentChunkAsExplored(): void {
    const pos = this.bot.mc.entity.position;
    const chunkKey = this.getChunkKey(pos.x, pos.z);
    this.exploredChunks.add(chunkKey);
    console.log(`[${this.bot.getName()}] Marked chunk as explored: ${chunkKey}`);
  }

  /**
   * 座標からチャンクキーを生成
   */
  private getChunkKey(x: number, z: number): string {
    const chunkX = Math.floor(x / 16);
    const chunkZ = Math.floor(z / 16);
    return `${chunkX},${chunkZ}`;
  }
}
