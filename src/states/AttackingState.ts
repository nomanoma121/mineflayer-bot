import { IBotState } from './IBotState';
import { Bot } from '../core/Bot';
import { IdleState } from './IdleState';
import { Entity } from 'prismarine-entity';

/**
 * 攻撃状態クラス
 * 指定されたエンティティを攻撃し続ける状態
 */
export class AttackingState implements IBotState {
  private target: Entity;
  private attackInterval: NodeJS.Timeout | null = null;
  private onComplete?: () => void;

  constructor(target: Entity, onComplete?: () => void) {
    this.target = target;
    this.onComplete = onComplete;
  }

  /**
   * 攻撃状態開始時の処理
   * @param bot - 操作対象のボットインスタンス
   */
  public enter(bot: Bot): void {
    console.log(`[${bot.getName()}] Entering attacking state, target: ${this.target.name || 'unknown'}`);
    
    // 攻撃を開始
    this.startAttacking(bot);
  }

  /**
   * 攻撃状態実行中の処理
   * @param bot - 操作対象のボットインスタンス
   */
  public execute(bot: Bot): void {
    // ターゲットが存在しない場合はアイドル状態に戻る
    if (!this.target || !this.target.isValid) {
      this.stopAttacking();
      if (this.onComplete) {
        this.onComplete();
      }
      bot.changeState(IdleState.getInstance());
      return;
    }

    // ターゲットまでの距離をチェック
    const distance = bot.mc.entity.position.distanceTo(this.target.position);
    if (distance > 4) {
      // 距離が遠い場合は近づく
      bot.mc.lookAt(this.target.position.offset(0, this.target.height, 0));
      bot.mc.setControlState('forward', true);
      bot.mc.setControlState('sprint', true);
    } else {
      // 攻撃範囲内の場合は停止
      bot.mc.setControlState('forward', false);
      bot.mc.setControlState('sprint', false);
    }
  }

  /**
   * 攻撃状態終了時の処理
   * @param bot - 操作対象のボットインスタンス
   */
  public exit(bot: Bot): void {
    console.log(`[${bot.getName()}] Exiting attacking state`);
    
    this.stopAttacking();
    
    // 移動を停止
    bot.mc.setControlState('forward', false);
    bot.mc.setControlState('sprint', false);
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
   * @param bot - 操作対象のボットインスタンス
   */
  private startAttacking(bot: Bot): void {
    // 定期的に攻撃を実行
    this.attackInterval = setInterval(() => {
      if (this.target && this.target.isValid) {
        const distance = bot.mc.entity.position.distanceTo(this.target.position);
        if (distance <= 4) {
          // ターゲットを見つめる
          bot.mc.lookAt(this.target.position.offset(0, this.target.height, 0));
          
          // 攻撃を実行
          bot.mc.attack(this.target);
          console.log(`[${bot.getName()}] Attacking ${this.target.name || 'unknown'}`);
        }
      }
    }, 600); // 0.6秒間隔で攻撃
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
