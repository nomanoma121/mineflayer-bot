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
    this.scriptManager = new ScriptManager(bot);

    switch (subCommand) {
      case "list":
        // TODO: list command implementation
        const scripts = this.scriptManager.getSavedScripts();
        if (scripts.size === 0) {
          bot.sendMessage(
            `${username}さん、保存されたスクリプトはありません。`
          );
          return;
        }
        const scriptList = Array.from(scripts.values())
          .map(
            (script) =>
              `${script.name} (作成日時: ${new Date(
                script.created
              ).toLocaleString()})`
          )
          .join("\n");
        bot.sendMessage(
          `${username}さん、保存されたスクリプト:\n${scriptList}`
        );
        break;
      case "help":
        this.showBotScriptHelp(bot, username);
        break;

      case "run":
        // script run script_name
        if (args.length < 1) {
          bot.sendMessage(
            `${username}さん、実行するスクリプト名を指定してください。`
          );
          return;
        }
        const scriptName = args.join(" ");
        await this.scriptManager.loadScript(username, scriptName);
        break;
      case "eval":
        if (args.length < 1) {
          bot.sendMessage(
            `${username}さん、実行するスクリプトを指定してください。`
          );
          return;
        }
        const scriptContent = args.join(" ");
        await this.scriptManager.executeScript(username, scriptContent);
        break;
      case "save":
        // script save script_name [content]
        // validate script_name and script_content
        if (args.length < 2) {
          bot.sendMessage(
            `${username}さん、コマンドを正しく入力してください。`
          );
          return;
        }
        const saveScriptName = args.shift();
        if (!saveScriptName) {
          bot.sendMessage(
            `${username}さん、保存するスクリプト名を指定してください。`
          );
          return;
        }

        // スクリプト内容を結合
        const scriptContentToSave = args.join(" ") || "";
        await this.scriptManager.saveScript(
          username,
          saveScriptName,
          scriptContentToSave
        );
        bot.sendMessage(
          `${username}さん、スクリプト「${saveScriptName}」を保存しました。`
        );
        break;
      default:
        bot.sendMessage(`${username}さん、不明なサブコマンド: ${subCommand}`);
        bot.sendMessage("使用可能: enable, disable, status, help, admin");
        break;
    }
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
