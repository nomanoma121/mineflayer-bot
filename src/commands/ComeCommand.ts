import { ICommand } from './ICommand';
import { Bot } from '../core/Bot';
import { FollowingState } from '../states/FollowingState';

/**
 * プレイヤー追従コマンドクラス
 * 指定されたプレイヤーを一定距離で追従する
 */
export class ComeCommand implements ICommand {
  /**
   * コマンドを実行
   * @param bot - 操作対象のボットインスタンス
   * @param username - コマンドを実行したプレイヤー名
   * @param args - コマンドの引数 [プレイヤー名]
   */
  public async execute(bot: Bot, username: string, args: string[]): Promise<void> {
    try {
      // 引数の検証
      if (args.length === 0) {
        bot.sendMessage(`使用法: @${bot.getName()} come <プレイヤー名>`);
        return;
      }

      const targetPlayerName = args[0];
      
      // ターゲットプレイヤーがオンラインかチェック
      const targetPlayer = bot.mc.players[targetPlayerName];
      if (!targetPlayer || !targetPlayer.entity) {
        bot.sendMessage(`プレイヤー「${targetPlayerName}」が見つかりません。`);
        return;
      }

      console.log(`[${bot.getName()}] Starting to follow player: ${targetPlayerName}`);
      
      // FollowingStateに遷移
      const followingState = new FollowingState(targetPlayerName, 2);
      bot.changeState(followingState);
      
    } catch (error) {
      console.error(`[${bot.getName()}] Error in come command:`, error);
      bot.sendMessage(`追従コマンドの実行中にエラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * コマンド名を取得
   * @returns コマンド名
   */
  public getName(): string {
    return 'come';
  }

  /**
   * コマンドの説明を取得
   * @returns コマンドの説明
   */
  public getDescription(): string {
    return '指定されたプレイヤーを一定距離で追従します';
  }

  /**
   * コマンドの使用法を取得
   * @returns コマンドの使用法
   */
  public getUsage(): string {
    return '@<botname> come <プレイヤー名>';
  }
}
