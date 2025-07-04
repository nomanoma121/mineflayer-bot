import { Bot } from "../core/Bot";

/**
 * ボットコマンドのインターフェース
 * コマンドパターンの実装により、チャット命令を統一的に管理
 */
export interface ICommand {
  /**
   * コマンドを実行するメソッド
   * @param bot - 操作対象のボットインスタンス
   * @param username - コマンドを実行したプレイヤーのユーザー名
   * @param args - コマンドの引数配列
   * @returns Promise<void> - 非同期処理の完了を示すPromise
   */
  execute(bot: Bot, username: string, args: string[]): Promise<void>;

  /**
   * コマンドの名前を返すメソッド
   * @returns string - コマンド名
   */
  getName(): string;

  /**
   * コマンドの説明を返すメソッド
   * @returns string - コマンドの説明
   */
  getDescription(): string;

  /**
   * コマンドの使用法を返すメソッド
   * @returns string - コマンドの使用法
   */
  getUsage(): string;
}
