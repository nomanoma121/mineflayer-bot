import { BaseCommand } from "./BaseCommand";
import { Bot } from "../core/Bot";
import { ScriptManager } from "../interpreter/manager/ScriptManager";

/**
 * Script command
 * Manages BotScript language execution via chat
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
      case "status":
        this.showStatus(bot, username);
        break;
      case "stop":
        this.stopExecution(bot, username);
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
          bot.sendMessage(`${username}, please specify a script name to save.`);
          return;
        }
        const scriptContent = args.join(" ");
        await this.saveSubCommand(bot, username, scriptName, scriptContent);
        break;
      default:
        bot.sendMessage(`${username}, unknown subcommand: ${subCommand}`);
        bot.sendMessage("Available commands: list, help, run, eval, save, status, stop");
        break;
    }
  }

  /**
   * Display list of saved scripts
   * @param bot - Bot instance
   * @param username - Command executor
   */
  private async listSubCommands(bot: Bot, username: string): Promise<void> {
    const scripts = this.scriptManager.getSavedScripts();
    if (scripts.size === 0) {
      bot.sendMessage(`${username}, no saved scripts found.`);
      return;
    }

    // Always show just the file names, ignore showDetails parameter
    const scriptList = Array.from(scripts.values())
      .map((script) => script.name)
      .join(", ");

    bot.sendMessage(`${username}, saved scripts: ${scriptList}`);
  }

  /**
   * Display BotScript help
   */
  private showBotScriptHelp(bot: Bot, username: string): void {
    bot.sendMessage(`${username}, about BotScript language:`);
    bot.sendMessage("");
    bot.sendMessage("- Variables: var count = 5, set count = count + 1");
    bot.sendMessage('- Control flow: if count > 3 { say "high" }');
    bot.sendMessage('- Loops: repeat 3 { say "repeat" }');
    bot.sendMessage(
      "- Commands: say, move, goto, attack, dig, place, equip, drop, wait"
    );
  }

  /**
    * Execute script
    * @param bot - Target bot instance
    * @param username - Player name who executed the command
    * @param scriptName - Name of script to execute
    */
  private async runSubCommand(
    bot: Bot,
    username: string,
    scriptName: string
  ): Promise<void> {
    if (!scriptName) {
      bot.sendMessage(`${username}, please specify a script name to run.`);
      return;
    }

    try {
      bot.sendMessage(`${username}, running script "${scriptName}"...`);
      const result = await this.scriptManager.loadScript(scriptName);
      bot.sendMessage(
        `${username}, script "${scriptName}" completed successfully.` +
        ` (statements: ${result.statementsExecuted}, commands: ${result.commandsExecuted}, time: ${result.executionTime}ms)`
      );
    } catch (error) {
      bot.sendMessage(
        `${username}, failed to run script "${scriptName}": ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Evaluate and execute script
   * @param bot - Target bot instance
   * @param username - Player name who executed the command
   * @param scriptContent - Script content to execute
   */
  private async evalSubCommand(
    bot: Bot,
    username: string,
    scriptContent: string
  ): Promise<void> {
    if (!scriptContent) {
      bot.sendMessage(`${username}, please specify a script to execute.`);
      return;
    }

    try {
      bot.sendMessage(`${username}, executing script...`);
      const result = await this.scriptManager.executeScript(scriptContent);
      bot.sendMessage(
        `${username}, script completed successfully.` +
        ` (statements: ${result.statementsExecuted}, commands: ${result.commandsExecuted}, time: ${result.executionTime}ms)`
      );
    } catch (error) {
      bot.sendMessage(
        `${username}, failed to execute script: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private async saveSubCommand(
    bot: Bot,
    username: string,
    scriptName: string,
    scriptContent: string
  ): Promise<void> {
    try {
      const savedName = await this.scriptManager.saveScript(scriptName, scriptContent);
      bot.sendMessage(`${username}, script "${savedName}" saved successfully.`);
    } catch (error) {
      const errorMessage = (error as Error).message;
      bot.sendMessage(
        `${username}, failed to save script: ${errorMessage}`
      );
    }
  }

  private showStatus(bot: Bot, username: string): void {
    const status = this.scriptManager.getStatus();
    
    if (!status.isExecuting) {
      bot.sendMessage(`${username}, no script is currently running.`);
      return;
    }

    bot.sendMessage(
      `${username}, current script execution status: ` +
      `statements: ${status.statementsExecuted}, commands: ${status.commandsExecuted}, ` +
      `time: ${status.executionTime}ms`
    );
  }

  private stopExecution(bot: Bot, username: string): void {
    try {
      this.scriptManager.stopExecution();
      bot.sendMessage(`${username}, script execution stopped.`);
    } catch (error) {
      bot.sendMessage(
        `${username}, ${error instanceof Error ? error.message : "failed to stop execution"}`
      );
    }
  }

  public getName(): string {
    return "script";
  }

  public getDescription(): string {
    return "Execute and manage Script language";
  }

  public getUsage(): string {
    return "script run <name> | eval <code> | save <name> <code> | list | help | status | stop";
  }
}
