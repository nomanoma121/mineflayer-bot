import { ICommand } from "../commands/ICommand";
import { Bot } from "./Bot";

/**
 * コマンドハンドラークラス
 * チャットメッセージを解析し、適切なコマンドを実行する責務を持つ
 * コマンドパターンの管理者として機能
 */
export class CommandHandler {
  private commands: Map<string, ICommand> = new Map();
  private readonly botName: string;

  constructor(botName: string) {
    this.botName = botName;
  }

  /**
   * 新しいコマンドを登録
   * @param commandName - コマンド名
   * @param command - コマンドインスタンス
   */
  public registerCommand(commandName: string, command: ICommand): void {
    this.commands.set(commandName.toLowerCase(), command);
    console.log(`[${this.botName}] Command registered: ${commandName}`);
  }

  /**
   * コマンドの登録を解除
   * @param commandName - コマンド名
   */
  public unregisterCommand(commandName: string): void {
    const removed = this.commands.delete(commandName.toLowerCase());
    if (removed) {
      console.log(`[${this.botName}] Command unregistered: ${commandName}`);
    }
  }

  /**
   * 登録されているすべてのコマンドを取得
   * @returns コマンドのMap
   */
  public getCommands(): Map<string, ICommand> {
    return new Map(this.commands);
  }

  /**
   * チャットメッセージを解析し、適切なコマンドを実行
   * @param bot - ボットインスタンス
   * @param username - メッセージを送信したプレイヤー名
   * @param message - チャットメッセージ
   */
  public async handleMessage(
    bot: Bot,
    username: string,
    message: string
  ): Promise<void> {
    try {
      // ボット自身のメッセージは無視
      if (username === this.botName) {
        return;
      }

      // メッセージをトリム
      const trimmedMessage = message.trim();

      // メンション形式のチェック
      const mentionPattern = new RegExp(
        `^@(${this.botName}|all)\\s+(.+)$`,
        "i"
      );
      const match = trimmedMessage.match(mentionPattern);

      if (!match) {
        return; // メンションでない場合は無視
      }

      const [, target, commandPart] = match;

      // @all または自分宛のメンションでない場合は無視
      if (
        target.toLowerCase() !== "all" &&
        target.toLowerCase() !== this.botName.toLowerCase()
      ) {
        return;
      }

      // コマンドと引数を分離
      const parts = commandPart.split(/\s+/);
      const commandName = parts[0].toLowerCase();
      const args = parts.slice(1);

      console.log(
        `[${
          this.botName
        }] Received command: ${commandName} from ${username} with args: [${args.join(
          ", "
        )}]`
      );

      // コマンドを検索して実行
      const command = this.commands.get(commandName);
      if (command) {
        await this.executeCommand(command, bot, username, args);
      } else {
        // 未知のコマンドの場合
        bot.sendMessage(
          `未知のコマンド「${commandName}」です。利用可能なコマンド: ${Array.from(
            this.commands.keys()
          ).join(", ")}`
        );
      }
    } catch (error) {
      console.error(`[${this.botName}] Error handling message:`, error);
      bot.sendMessage(
        `コマンド処理中にエラーが発生しました: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * コマンドを安全に実行
   * @param command - 実行するコマンド
   * @param bot - ボットインスタンス
   * @param username - コマンド実行者
   * @param args - コマンド引数
   */
  private async executeCommand(
    command: ICommand,
    bot: Bot,
    username: string,
    args: string[]
  ): Promise<void> {
    try {
      console.log(`[${this.botName}] Executing command: ${command.getName()}`);
      bot.sendMessage(`コマンド「${command.getName()}」を実行します...`);

      await command.execute(bot, username, args);

      console.log(
        `[${this.botName}] Command executed successfully: ${command.getName()}`
      );
    } catch (error) {
      console.error(
        `[${this.botName}] Error executing command ${command.getName()}:`,
        error
      );
      bot.sendMessage(
        `コマンド「${command.getName()}」の実行中にエラーが発生しました: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * ヘルプメッセージを生成
   * @returns ヘルプメッセージ
   */
  public generateHelpMessage(): string {
    if (this.commands.size === 0) {
      return "利用可能なコマンドはありません。";
    }

    const commandList = Array.from(this.commands.values())
      .map((cmd) => `${cmd.getName()}: ${cmd.getDescription()}`)
      .join("\n");

    return `利用可能なコマンド:\n${commandList}`;
  }
}
