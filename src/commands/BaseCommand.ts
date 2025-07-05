import { ICommand } from './ICommand';
import { Bot } from '../core/Bot';
import { CommandUtils } from '../utils/CommandUtils';

/**
 * コマンドの基底クラス
 * 共通の機能と基本的なエラーハンドリングを提供
 */
export abstract class BaseCommand implements ICommand {
  /**
   * コマンドを実行（基底実装）
   * @param bot - 操作対象のボットインスタンス
   * @param username - コマンドを実行したプレイヤー名
   * @param args - コマンドの引数
   */
  public async execute(bot: Bot, username: string, args: string[]): Promise<void> {
    try {
      CommandUtils.logCommandExecution(bot, this.getName(), username, args);
      await this.executeCommand(bot, username, args);
    } catch (error) {
      CommandUtils.handleCommandError(bot, this.getName(), error);
    }
  }

  /**
   * 実際のコマンド実行ロジック（サブクラスで実装）
   * @param bot - 操作対象のボットインスタンス
   * @param username - コマンドを実行したプレイヤー名
   * @param args - コマンドの引数
   */
  protected abstract executeCommand(bot: Bot, username: string, args: string[]): Promise<void>;

  /**
   * コマンド名を取得（サブクラスで実装）
   * @returns コマンド名
   */
  public abstract getName(): string;

  /**
   * コマンドの説明を取得（サブクラスで実装）
   * @returns コマンドの説明
   */
  public abstract getDescription(): string;

  /**
   * コマンドの使用法を取得（サブクラスで実装）
   * @returns コマンドの使用法
   */
  public abstract getUsage(): string;

  /**
   * 引数の数を検証（ヘルパーメソッド）
   * @param args - 引数配列
   * @param expectedCount - 期待される引数の数
   * @param bot - ボットインスタンス
   * @returns 検証が成功したかどうか
   */
  protected validateArgumentCount(args: string[], expectedCount: number, bot: Bot): boolean {
    return CommandUtils.validateArgumentCount(args, expectedCount, this.getUsage(), bot);
  }

  /**
   * 引数の範囲を検証（ヘルパーメソッド）
   * @param args - 引数配列
   * @param minCount - 最小引数数
   * @param maxCount - 最大引数数
   * @param bot - ボットインスタンス
   * @returns 検証が成功したかどうか
   */
  protected validateArgumentRange(args: string[], minCount: number, maxCount: number, bot: Bot): boolean {
    return CommandUtils.validateArgumentRange(args, minCount, maxCount, this.getUsage(), bot);
  }

  /**
   * 数値引数を解析（ヘルパーメソッド）
   * @param value - 解析する文字列
   * @param paramName - パラメータ名
   * @param bot - ボットインスタンス
   * @returns 解析された数値、またはnull
   */
  protected parseNumber(value: string, paramName: string, bot: Bot): number | null {
    return CommandUtils.parseNumber(value, paramName, bot);
  }
}
