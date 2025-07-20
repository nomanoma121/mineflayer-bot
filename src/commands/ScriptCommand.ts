import { BaseCommand } from "./BaseCommand";
import { Bot } from "../core/Bot";
import { ScriptManager } from "../interpreter/manager/ScriptManager";

/**
 * BotScriptコマンド
 * チャット経由でBotScript言語の実行を管理する
 */
export class ScriptCommand extends BaseCommand {
  private scriptManager: ScriptManager;

  constructor(scriptManager: ScriptManager) {
    super();
    this.scriptManager = scriptManager;
  }

  protected async executeCommand(
    bot: Bot,
    username: string,
    args: string[]
  ): Promise<void> {
    const subCommand = args.shift()?.toLowerCase() || "";

    switch (subCommand) {
      case "list":
        this.listSubCommands(bot, username);
        break;
      case "help":
        this.showBotScriptHelp(bot, username);
        break;
      case "run":
        this.runSubCommand(bot, username, args.join(" "));
        break;
      case "eval":
        this.evalSubCommand(bot, username, args.join(" "));
        break;
      case "save":
        const scriptName = args.shift();
        if (!scriptName) {
          bot.sendMessage(`${username}さん、保存するスクリプト名を指定してください。`);
          return;
        }
        const scriptContent = args.join(" ");
        await this.saveSubCommand(bot, username, scriptName, scriptContent);
        break;
      default:
        bot.sendMessage(`${username}さん、不明なサブコマンド: ${subCommand}`);
        bot.sendMessage("使用可能: list, help, run, eval, save");
        break;
    }
  }

  /**
   * サブコマンドの一覧を表示
   * @param bot - ボットインスタンス
   * @param username - コマンド実行者
   */
  private async listSubCommands(bot: Bot, username: string): Promise<void> {
    const scripts = this.scriptManager.getSavedScripts();
    if (scripts.size === 0) {
      bot.sendMessage(`${username}さん、保存されたスクリプトはありません。`);
      return;
    }
    const scriptList = Array.from(scripts.values())
      .map(
        (script) =>
          `${script.name} (作成日時: ${new Date(script.created).toLocaleString()})`
      )
      .join("\n");
    bot.sendMessage(
      `${username}さん、保存されたスクリプト:\n${scriptList}`
    );
  }

  /**
   * BotScriptのヘルプを表示
   */
  private showBotScriptHelp(bot: Bot, username: string): void {
    bot.sendMessage(`${username}さん、BotScript言語について:`);
    bot.sendMessage("");
    bot.sendMessage("- 変数: var count = 5, set count = count + 1");
    bot.sendMessage('- 制御文: if count > 3 { say "多い" }');
    bot.sendMessage('- ループ: repeat 3 { say "繰り返し" }');
    bot.sendMessage(
      "- コマンド: say, move, goto, attack, dig, place, equip, drop, wait"
    );
  }

  /**
    * スクリプトを実行
    * @param bot - 操作対象のボットインスタンス
    * @param username - コマンドを実行したプレイヤー名
    * @param scriptName - 実行するスクリプト名
    */
  private async runSubCommand(
    bot: Bot,
    username: string,
    scriptName: string
  ): Promise<void> {
    if (!scriptName) {
      bot.sendMessage(`${username}さん、実行するスクリプト名を指定してください。`);
      return;
    }
    try {
      await this.scriptManager.loadScript(username, scriptName);
      bot.sendMessage(`${username}さん、スクリプト「${scriptName}」を実行します。`);
    } catch (error) {
      bot.sendMessage(
        `${username}さん、スクリプト「${scriptName}」の実行に失敗しました: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      console.error(
        `[${bot.getName()}] Error executing script ${scriptName}:`,
        error
      );
    }
  }

  /**
   * スクリプトを評価して実行
   * @param bot - 操作対象のボットインスタンス
   * @param username - コマンドを実行したプレイヤー名
   * @param scriptContent - 実行するスクリプト内容
   */
  private async evalSubCommand(
    bot: Bot,
    username: string,
    scriptContent: string
  ): Promise<void> {
    if (!scriptContent) {
      bot.sendMessage(`${username}さん、実行するスクリプトを指定してください。`);
      return;
    }
    try {
      await this.scriptManager.executeScript(username, scriptContent);
      bot.sendMessage(`${username}さん、スクリプトを実行しました。`);
    } catch (error) {
      bot.sendMessage(
        `${username}さん、スクリプトの実行に失敗しました: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      console.error(`[${bot.getName()}] Error evaluating script:`, error);
    }
  }

  private async saveSubCommand(
    bot: Bot,
    username: string,
    scriptName: string,
    scriptContent: string
  ): Promise<void> {
    if (!scriptContent.trim()) {
      bot.sendMessage(`${username}さん、保存するスクリプトが空です。`);
      return;
    }

    try {
      // スクリプトのメタデータを作成
      const script = {
        name: scriptName,
        content: scriptContent,
        created: Date.now(),
      };

      // 保存済みスクリプトに追加
      this.scriptManager.getSavedScripts().set(scriptName, script);

      // ディスクに保存
      this.scriptManager.saveScriptToDisk(scriptName, script);

      bot.sendMessage(`${username}さん、スクリプト「${scriptName}」を保存しました。`);
    } catch (error) {
      const errorMessage = (error as Error).message;
      bot.sendMessage(
        `${username}さん、スクリプトの保存に失敗しました: ${errorMessage}`
      );
      console.error(`[${bot.getName()}] Failed to save script`, error);
    }
  }

  public getName(): string {
    return "script";
  }

  public getDescription(): string {
    return "Script言語の実行と管理を行います";
  }

  public getUsage(): string {
    // script run or eval or save or list or help
    return "script run | eval | save | list | help";
  }
}
