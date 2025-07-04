import { ICommand } from './ICommand';
import { Bot } from '../core/Bot';
import { MovingState } from '../states/MovingState';
import { Vec3 } from 'vec3';

/**
 * 座標指定移動コマンドクラス
 * 指定された座標まで障害物を避けながら移動する
 */
export class GotoCommand implements ICommand {
  /**
   * コマンドを実行
   * @param bot - 操作対象のボットインスタンス
   * @param username - コマンドを実行したプレイヤー名
   * @param args - コマンドの引数 [x, y, z]
   */
  public async execute(bot: Bot, username: string, args: string[]): Promise<void> {
    try {
      // 引数の検証
      if (args.length < 3) {
        bot.sendMessage(`使用法: @${bot.getName()} goto <x> <y> <z>`);
        return;
      }

      const x = parseFloat(args[0]);
      const y = parseFloat(args[1]);
      const z = parseFloat(args[2]);

      // 数値の検証
      if (isNaN(x) || isNaN(y) || isNaN(z)) {
        bot.sendMessage('座標は数値で指定してください。例: @bot01 goto 100 64 -200');
        return;
      }

      // Y座標の妥当性チェック（Minecraftの世界の範囲内）
      if (y < -64 || y > 320) {
        bot.sendMessage('Y座標は-64から320の範囲で指定してください。');
        return;
      }

      console.log(`[${bot.getName()}] Moving to coordinates: (${x}, ${y}, ${z})`);
      
      const targetPosition = new Vec3(x, y, z);
      
      // MovingStateに遷移
      const movingState = new MovingState(
        targetPosition,
        () => {
          // 移動完了時のコールバック
          console.log(`[${bot.getName()}] Successfully reached target position`);
        },
        (error) => {
          // エラー時のコールバック
          console.error(`[${bot.getName()}] Movement failed:`, error);
          bot.sendMessage(`移動に失敗しました: ${error.message}`);
        }
      );
      
      bot.changeState(movingState);
      
    } catch (error) {
      console.error(`[${bot.getName()}] Error in goto command:`, error);
      bot.sendMessage(`移動コマンドの実行中にエラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * コマンド名を取得
   * @returns コマンド名
   */
  public getName(): string {
    return 'goto';
  }

  /**
   * コマンドの説明を取得
   * @returns コマンドの説明
   */
  public getDescription(): string {
    return '指定された座標まで障害物を避けながら移動します';
  }

  /**
   * コマンドの使用法を取得
   * @returns コマンドの使用法
   */
  public getUsage(): string {
    return '@<botname> goto <x> <y> <z>';
  }
}
