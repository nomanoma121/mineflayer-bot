import { IBotState } from './IBotState';
import { Bot } from '../core/Bot';
import { Entity } from 'prismarine-entity';
import { goals } from 'mineflayer-pathfinder';

/**
 * 攻撃状態クラス
 * 指定されたエンティティを攻撃し続ける状態
 */
export class AttackingState implements IBotState {
  private readonly bot: Bot;
  private target: Entity;
  private attackInterval: NodeJS.Timeout | null = null;
  private onComplete?: () => void;
  private lastAttackTime: number = 0;
  private readonly attackCooldown: number = 600; // 0.6秒間隔で攻撃
  private lastTargetPosition: { x: number; y: number; z: number } | null = null;
  private readonly positionUpdateThreshold: number = 3; // 3ブロック以上移動したら目標を更新
  private parentState: IBotState | null = null;

  constructor(bot: Bot, target: Entity, parentState?: IBotState, onComplete?: () => void) {
    this.bot = bot;
    this.target = target;
    this.parentState = parentState || null;
    this.onComplete = onComplete;
  }

  /**
   * 攻撃状態開始時の処理
   */
  public enter(): void {
    console.log(`[${this.bot.getName()}] Entering attacking state, target: ${this.target.name || 'unknown'}`);
    
    // 初期ターゲット位置を記録
    this.updateLastTargetPosition();
    
    // 攻撃を開始
    this.startAttacking();
  }

  /**
   * 攻撃状態実行中の処理
   */
  public execute(): void {
    // ターゲットが存在しない場合は適切な状態に戻る
    if (!this.target || !this.target.isValid) {
      this.stopAttacking();
      if (this.onComplete) {
        this.onComplete();
      }
      
      // 親状態が設定されている場合は親状態に戻る、そうでなければIdleStateに戻る
      if (this.parentState) {
        this.bot.changeState(this.parentState);
      } else {
        this.bot.changeStateToIdle();
      }
      return;
    }

    // ターゲットまでの距離をチェック
    const distance = this.bot.mc.entity.position.distanceTo(this.target.position);
    
    if (distance > 4) {
      // 距離が遠い場合はpathfinderを使って近づく
      // ターゲットの位置が大きく変わった場合は目標を更新
      const shouldUpdateGoal = !this.bot.mc.pathfinder.isMoving() || this.hasTargetMovedSignificantly();
      
      if (shouldUpdateGoal) {
        const goal = new goals.GoalNear(
          this.target.position.x,
          this.target.position.y,
          this.target.position.z,
          2 // 2ブロック以内に近づく
        );
        this.bot.mc.pathfinder.setGoal(goal, true);
        this.updateLastTargetPosition();
      }
    } else {
      // 攻撃範囲内の場合は移動を停止して攻撃
      if (this.bot.mc.pathfinder.isMoving()) {
        this.bot.mc.pathfinder.stop();
      }
      
      // 攻撃実行
      this.performAttack();
    }
  }

  /**
   * ターゲットが大きく移動したかを判定
   */
  private hasTargetMovedSignificantly(): boolean {
    if (!this.lastTargetPosition || !this.target.position) {
      return true;
    }
    
    const distance = Math.sqrt(
      Math.pow(this.target.position.x - this.lastTargetPosition.x, 2) +
      Math.pow(this.target.position.y - this.lastTargetPosition.y, 2) +
      Math.pow(this.target.position.z - this.lastTargetPosition.z, 2)
    );
    
    return distance > this.positionUpdateThreshold;
  }

  /**
   * 最後のターゲット位置を更新
   */
  private updateLastTargetPosition(): void {
    if (this.target.position) {
      this.lastTargetPosition = {
        x: this.target.position.x,
        y: this.target.position.y,
        z: this.target.position.z
      };
    }
  }

  /**
   * 攻撃状態終了時の処理
   */
  public exit(): void {
    console.log(`[${this.bot.getName()}] Exiting attacking state`);
    
    this.stopAttacking();
    
    // pathfinderの移動を停止
    if (this.bot.mc.pathfinder) {
      this.bot.mc.pathfinder.stop();
    }
    
    // 手動制御状態もクリア
    this.bot.mc.setControlState('forward', false);
    this.bot.mc.setControlState('sprint', false);
  }

  /**
   * 状態名を取得
   * @returns 状態名
   */
  public getName(): string {
    return 'Attacking';
  }

  /**
   * 攻撃を開始
   */
  private startAttacking(): void {
    // 定期的に攻撃を実行するタイマーを設定
    this.attackInterval = setInterval(() => {
      this.performAttack();
    }, this.attackCooldown);
  }

  /**
   * 攻撃を実行
   */
  private performAttack(): void {
    const now = Date.now();
    if (now - this.lastAttackTime < this.attackCooldown) {
      return; // クールダウン中
    }

    if (this.target && this.target.isValid) {
      const distance = this.bot.mc.entity.position.distanceTo(this.target.position);
      if (distance <= 4) {
        // ターゲットを見つめる
        this.bot.mc.lookAt(this.target.position.offset(0, this.target.height, 0));
        
        // 攻撃を実行
        this.bot.mc.attack(this.target);
        this.lastAttackTime = now;
        console.log(`[${this.bot.getName()}] Attacking ${this.target.name || 'unknown'}`);
      }
    }
  }

  /**
   * 攻撃を停止
   */
  private stopAttacking(): void {
    if (this.attackInterval) {
      clearInterval(this.attackInterval);
      this.attackInterval = null;
    }
  }
}
