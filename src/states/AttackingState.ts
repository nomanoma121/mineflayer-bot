import { IBotState } from './IBotState';
import { Bot } from '../core/Bot';
import { Entity } from 'prismarine-entity';

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

  constructor(bot: Bot, target: Entity, onComplete?: () => void) {
    this.bot = bot;
    this.target = target;
    this.onComplete = onComplete;
  }

  /**
   * 攻撃状態開始時の処理
   */
  public enter(): void {
    console.log(`[${this.bot.getName()}] Entering attacking state, target: ${this.target.name || 'unknown'}`);
    
    // 攻撃を開始
    this.startAttacking();
  }

  /**
   * 攻撃状態実行中の処理
   */
  public execute(): void {
    // ターゲットが存在しない場合はアイドル状態に戻る
    if (!this.target || !this.target.isValid) {
      this.stopAttacking();
      if (this.onComplete) {
        this.onComplete();
      }
      this.bot.changeStateToIdle();
      return;
    }

    // ターゲットまでの距離をチェック
    const distance = this.bot.mc.entity.position.distanceTo(this.target.position);
    if (distance > 4) {
      // 距離が遠い場合は近づく
      this.bot.mc.lookAt(this.target.position.offset(0, this.target.height, 0));
      this.bot.mc.setControlState('forward', true);
      this.bot.mc.setControlState('sprint', true);
    } else {
      // 攻撃範囲内の場合は停止
      this.bot.mc.setControlState('forward', false);
      this.bot.mc.setControlState('sprint', false);
      
      // 攻撃実行
      this.performAttack();
    }
  }

  /**
   * 攻撃状態終了時の処理
   */
  public exit(): void {
    console.log(`[${this.bot.getName()}] Exiting attacking state`);
    
    this.stopAttacking();
    
    // 移動を停止
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
