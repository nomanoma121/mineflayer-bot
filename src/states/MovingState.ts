import { IBotState } from './IBotState';
import { Bot } from '../core/Bot';
import { goals } from 'mineflayer-pathfinder';
import { Vec3 } from 'vec3';

/**
 * 座標指定移動状態クラス
 * 指定された座標まで障害物を避けながら移動する状態
 */
export class MovingState implements IBotState {
  private targetPosition: Vec3;
  private isActive: boolean = false;
  private onComplete?: () => void;
  private onError?: (error: Error) => void;

  constructor(
    targetPosition: Vec3, 
    onComplete?: () => void, 
    onError?: (error: Error) => void
  ) {
    this.targetPosition = targetPosition;
    this.onComplete = onComplete;
    this.onError = onError;
  }

  /**
   * 移動状態に入る際の処理
   * @param bot - ボットインスタンス
   */
  public enter(bot: Bot): void {
    console.log(`[${bot.getName()}] Entering Moving State - Target: (${this.targetPosition.x}, ${this.targetPosition.y}, ${this.targetPosition.z})`);
    this.isActive = true;
    
    bot.sendMessage(`座標 (${Math.floor(this.targetPosition.x)}, ${Math.floor(this.targetPosition.y)}, ${Math.floor(this.targetPosition.z)}) への移動を開始します。`);
    this.startMoving(bot);
  }

  /**
   * 移動状態から出る際の処理
   * @param bot - ボットインスタンス
   */
  public exit(bot: Bot): void {
    console.log(`[${bot.getName()}] Exiting Moving State`);
    this.isActive = false;
    
    if (bot.mc.pathfinder) {
      bot.mc.pathfinder.stop();
    }
  }

  /**
   * 移動状態における定期実行処理
   * @param bot - ボットインスタンス
   */
  public execute(bot: Bot): void {
    if (!this.isActive) return;

    // 目標地点に到達したかチェック
    const currentPos = bot.mc.entity.position;
    const distance = currentPos.distanceTo(this.targetPosition);
    
    if (distance < 2) {
      console.log(`[${bot.getName()}] Reached target position`);
      bot.sendMessage(`目標地点に到達しました。`);
      
      // 移動完了のコールバックを実行
      if (this.onComplete) {
        this.onComplete();
      }
      
      // IdleStateに戻る
      const { IdleState } = require('./IdleState');
      bot.changeState(IdleState.getInstance());
    }
  }

  /**
   * 移動を開始する
   * @param bot - ボットインスタンス
   */
  private startMoving(bot: Bot): void {
    try {
      const goal = new goals.GoalBlock(
        Math.floor(this.targetPosition.x),
        Math.floor(this.targetPosition.y),
        Math.floor(this.targetPosition.z)
      );
      
      bot.mc.pathfinder.setGoal(goal);
      
      // パスファインディングのイベントリスナーを設定
      const onGoalReached = () => {
        console.log(`[${bot.getName()}] Pathfinding goal reached`);
        bot.mc.pathfinder.off('goal_reached', onGoalReached);
        bot.mc.pathfinder.off('path_stop', onPathStop);
      };
      
      const onPathStop = (reason: any) => {
        console.log(`[${bot.getName()}] Pathfinding stopped: ${reason}`);
        bot.mc.pathfinder.off('goal_reached', onGoalReached);
        bot.mc.pathfinder.off('path_stop', onPathStop);
        
        if (reason !== 'goal_reached' && this.isActive) {
          bot.sendMessage(`移動が中断されました: ${reason}`);
          if (this.onError) {
            this.onError(new Error(`Pathfinding stopped: ${reason}`));
          }
          
          // IdleStateに戻る
          const { IdleState } = require('./IdleState');
          bot.changeState(IdleState.getInstance());
        }
      };
      
      bot.mc.pathfinder.on('goal_reached', onGoalReached);
      bot.mc.pathfinder.on('path_stop', onPathStop);
      
      console.log(`[${bot.getName()}] Moving to (${this.targetPosition.x}, ${this.targetPosition.y}, ${this.targetPosition.z})`);
    } catch (error) {
      console.error(`[${bot.getName()}] Error starting movement:`, error);
      bot.sendMessage(`移動開始中にエラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
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
