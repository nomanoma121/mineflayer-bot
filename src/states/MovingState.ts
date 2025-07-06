import { IBotState } from './IBotState';
import { Bot } from '../core/Bot';
import { goals } from 'mineflayer-pathfinder';
import { Vec3 } from 'vec3';

/**
 * 座標指定移動状態クラス
 * 指定された座標まで障害物を避けながら移動する状態
 */
export class MovingState implements IBotState {
  private readonly bot: Bot;
  private targetPosition: Vec3;
  private isActive: boolean = false;
  private onComplete?: () => void;
  private onError?: (error: Error) => void;
  private checkInterval?: NodeJS.Timeout;

  constructor(
    bot: Bot,
    targetPosition: Vec3, 
    onComplete?: () => void, 
    onError?: (error: Error) => void
  ) {
    this.bot = bot;
    this.targetPosition = targetPosition;
    this.onComplete = onComplete;
    this.onError = onError;
  }

  /**
   * 移動状態に入る際の処理
   */
  public async enter(): Promise<void> {
    console.log(`[${this.bot.getName()}] Entering Moving State - Target: (${this.targetPosition.x}, ${this.targetPosition.y}, ${this.targetPosition.z})`);
    this.isActive = true;
    
    this.bot.sendMessage(`座標 (${Math.floor(this.targetPosition.x)}, ${Math.floor(this.targetPosition.y)}, ${Math.floor(this.targetPosition.z)}) への移動を開始します。`);
    this.startMoving();
  }

  /**
   * 移動状態から出る際の処理
   */
  public exit(): void {
    console.log(`[${this.bot.getName()}] Exiting Moving State`);
    this.isActive = false;
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
    }
    
    if (this.bot.mc.pathfinder) {
      this.bot.mc.pathfinder.stop();
    }
  }

  /**
   * 移動状態における定期実行処理
   */
  public execute(): void {
    if (!this.isActive) return;

    // 目標地点に到達したかチェック
    const currentPos = this.bot.mc.entity.position;
    const distance = currentPos.distanceTo(this.targetPosition);
    
    if (distance < 2) {
      console.log(`[${this.bot.getName()}] Reached target position`);
      this.bot.sendMessage(`目標地点に到達しました。`);
      
      // 移動完了のコールバックを実行
      if (this.onComplete) {
        this.onComplete();
      }
      
      // IdleStateに戻る（fire-and-forget）
      this.bot.changeStateToIdle().catch(error => {
        console.error(`[${this.bot.getName()}] Error changing to idle state:`, error);
      });
    }
  }

  /**
   * 移動を開始する
   */
  private startMoving(): void {
    try {
      const goal = new goals.GoalBlock(
        Math.floor(this.targetPosition.x),
        Math.floor(this.targetPosition.y),
        Math.floor(this.targetPosition.z)
      );
      
      this.bot.mc.pathfinder.setGoal(goal);
      
      // パスファインディング完了の監視
      const checkGoalReached = () => {
        if (!this.isActive) {
          if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = undefined;
          }
          return;
        }
        
        const distance = this.bot.mc.entity.position.distanceTo(this.targetPosition);
        if (distance < 2) {
          console.log(`[${this.bot.getName()}] Target reached`);
          this.isActive = false;
          if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = undefined;
          }
          if (this.onComplete) {
            this.onComplete();
          }
          // IdleStateに戻る（fire-and-forget）
          this.bot.changeStateToIdle().catch(error => {
            console.error(`[${this.bot.getName()}] Error changing to idle state:`, error);
          });
        }
      };
      
      // 定期的に目標到達をチェック
      this.checkInterval = setInterval(checkGoalReached, 1000);
      
      console.log(`[${this.bot.getName()}] Moving to (${this.targetPosition.x}, ${this.targetPosition.y}, ${this.targetPosition.z})`);
    } catch (error) {
      console.error(`[${this.bot.getName()}] Error starting movement:`, error);
      this.bot.sendMessage(`移動開始中にエラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      if (this.onError) {
        this.onError(error instanceof Error ? error : new Error('Unknown movement error'));
      }
    }
  }

  /**
   * 状態の名前を取得
   * @returns 状態名
   */
  public getName(): string {
    return `Moving(${Math.floor(this.targetPosition.x)},${Math.floor(this.targetPosition.y)},${Math.floor(this.targetPosition.z)})`;
  }

  /**
   * 目標座標を取得
   * @returns 目標座標
   */
  public getTargetPosition(): Vec3 {
    return this.targetPosition;
  }
}
