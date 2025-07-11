import { BaseCommand } from './BaseCommand';
import { Bot } from '../core/Bot';
import { ChatInterface } from '../botscript/chat/ChatInterface';
import { ExecutionContext } from '../botscript/interpreter/ExecutionContext';
import { Logger } from '../utils/Logger';

/**
 * BotScriptコマンド
 * チャット経由でBotScript言語の実行を管理する
 */
export class BotScriptCommand extends BaseCommand {
  private static instance: ChatInterface | null = null;
  private static context: ExecutionContext | null = null;

  /**
   * BotScript ChatInterfaceのシングルトンインスタンスを取得
   */
  private static getChatInterface(bot: Bot): ChatInterface {
    if (!this.instance) {
      this.context = new ExecutionContext();
      this.instance = new ChatInterface(bot, this.context);
      
      Logger.structured.info('BotScript ChatInterface initialized', {
        category: 'botscript'
      });
    }
    return this.instance;
  }

  protected async executeCommand(bot: Bot, username: string, args: string[]): Promise<void> {
    const chatInterface = BotScriptCommand.getChatInterface(bot);

    if (args.length === 0) {
      bot.say.say(`${username}さん、BotScriptコマンドの使用法: !botscript <サブコマンド>`);
      bot.say.say("サブコマンド: enable, disable, status, help");
      return;
    }

    const subCommand = args[0].toLowerCase();

    switch (subCommand) {
      case 'enable':
        chatInterface.enable();
        bot.say.say(`${username}さん、BotScript機能を有効にしました。`);
        bot.say.say("チャットで '!script <コード>' または '!mscript' で使用できます。");
        break;

      case 'disable':
        chatInterface.disable();
        bot.say.say(`${username}さん、BotScript機能を無効にしました。`);
        break;

      case 'status':
        const stats = chatInterface.getStatistics();
        bot.say.say(`${username}さん、BotScript状態: ` +
          `有効=${stats.isEnabled ? 'はい' : 'いいえ'}, ` +
          `アクティブセッション=${stats.activeSessions}, ` +
          `保存済みスクリプト=${stats.savedScripts}`);
        break;

      case 'help':
        this.showBotScriptHelp(bot, username);
        break;

      case 'admin':
        await this.handleAdminCommand(bot, username, args.slice(1), chatInterface);
        break;

      default:
        bot.say.say(`${username}さん、不明なサブコマンド: ${subCommand}`);
        bot.say.say("使用可能: enable, disable, status, help, admin");
        break;
    }
  }

  /**
   * 管理者コマンドを処理
   */
  private async handleAdminCommand(
    bot: Bot, 
    username: string, 
    args: string[], 
    chatInterface: ChatInterface
  ): Promise<void> {
    if (args.length === 0) {
      bot.say.say(`${username}さん、管理者コマンド: adduser <ユーザー名>, addadmin <ユーザー名>`);
      return;
    }

    const adminCommand = args[0].toLowerCase();
    const targetUser = args[1];

    if (!targetUser) {
      bot.say.say(`${username}さん、ユーザー名を指定してください。`);
      return;
    }

    switch (adminCommand) {
      case 'adduser':
        chatInterface.addAuthorizedUser(targetUser);
        bot.say.say(`${username}さん、${targetUser}を認証ユーザーに追加しました。`);
        break;

      case 'addadmin':
        chatInterface.addAdminUser(targetUser);
        bot.say.say(`${username}さん、${targetUser}を管理者に追加しました。`);
        break;

      default:
        bot.say.say(`${username}さん、不明な管理者コマンド: ${adminCommand}`);
        break;
    }
  }

  /**
   * BotScriptのヘルプを表示
   */
  private showBotScriptHelp(bot: Bot, username: string): void {
    bot.say.say(`${username}さん、BotScript言語について:`);
    bot.say.say("- 単発実行: !script SAY \"Hello World\"");
    bot.say.say("- 複数行: !mscript → コード入力 → !end");
    bot.say.say("- 変数: DEF $count = 5, $count = $count + 1");
    bot.say.say("- 制御文: IF $count > 3 THEN SAY \"多い\" ENDIF");
    bot.say.say("- ループ: REPEAT 3 SAY \"繰り返し\" ENDREPEAT");
    bot.say.say("- コマンド: SAY, MOVE, GOTO, ATTACK, DIG, PLACE, EQUIP, DROP, WAIT");
  }

  /**
   * チャットメッセージを処理
   * この関数は外部から呼び出される
   */
  public static async handleChatMessage(bot: Bot, username: string, message: string): Promise<void> {
    const chatInterface = this.getChatInterface(bot);
    await chatInterface.handleChatMessage(username, message);
  }

  public getName(): string {
    return "botscript";
  }

  public getDescription(): string {
    return "BotScript言語の実行と管理を行います";
  }

  public getUsage(): string {
    return "botscript <enable|disable|status|help|admin>";
  }
}