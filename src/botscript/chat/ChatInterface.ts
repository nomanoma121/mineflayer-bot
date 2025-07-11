import { Bot } from '../../core/Bot';
import { Lexer } from '../lexer/Lexer';
import { Parser } from '../parser/Parser';
import { Interpreter, ExecutionResultType } from '../interpreter/Interpreter';
import { ExecutionContext } from '../interpreter/ExecutionContext';
import { Logger } from '../../utils/Logger';

/**
 * チャットコマンドの種類
 */
export enum ChatCommandType {
  SCRIPT = 'script',      // 単発スクリプト実行
  MULTILINE = 'mscript',  // 複数行スクリプト開始
  END = 'end',           // 複数行スクリプト終了
  LIST = 'list',         // 変数一覧表示
  CLEAR = 'clear',       // 変数クリア
  SAVE = 'save',         // スクリプト保存
  LOAD = 'load',         // スクリプト読み込み
  STOP = 'stop',         // スクリプト停止
  STATUS = 'status',     // 実行状態確認
  HELP = 'help'          // ヘルプ表示
}

/**
 * 複数行スクリプトの状態
 */
interface MultilineSession {
  username: string;
  lines: string[];
  startTime: number;
}

/**
 * 保存されたスクリプト
 */
interface SavedScript {
  name: string;
  content: string;
  author: string;
  created: number;
  description?: string;
}

/**
 * BotScript チャットインターフェース
 * Minecraftチャットを通じてBotScriptの実行を可能にする
 */
export class ChatInterface {
  private bot: Bot;
  private interpreter: Interpreter;
  private context: ExecutionContext;
  private multilineSessions: Map<string, MultilineSession> = new Map();
  private savedScripts: Map<string, SavedScript> = new Map();
  private commandPrefix: string = '!';
  private isEnabled: boolean = true;
  private authorizedUsers: Set<string> = new Set();
  private adminUsers: Set<string> = new Set();

  constructor(bot: Bot, context?: ExecutionContext) {
    this.bot = bot;
    this.context = context || new ExecutionContext();
    this.interpreter = new Interpreter(bot, this.context);
    
    // デフォルトの管理者設定（環境変数から読み込み）
    const adminList = process.env.BOTSCRIPT_ADMINS?.split(',') || [];
    adminList.forEach(admin => this.adminUsers.add(admin.trim()));
    
    // ログ設定
    Logger.structured.info('BotScript ChatInterface initialized', {
      commandPrefix: this.commandPrefix,
      admins: Array.from(this.adminUsers)
    });
  }

  /**
   * チャットインターフェースを有効化
   */
  enable(): void {
    this.isEnabled = true;
    Logger.structured.info('BotScript ChatInterface enabled');
  }

  /**
   * チャットインターフェースを無効化
   */
  disable(): void {
    this.isEnabled = false;
    this.clearAllSessions();
    Logger.structured.info('BotScript ChatInterface disabled');
  }

  /**
   * チャットメッセージを処理
   */
  async handleChatMessage(username: string, message: string): Promise<void> {
    if (!this.isEnabled) return;

    try {
      // 複数行セッション中の処理
      if (this.multilineSessions.has(username)) {
        await this.handleMultilineInput(username, message);
        return;
      }

      // コマンドプレフィックスをチェック
      if (!message.startsWith(this.commandPrefix)) return;

      const commandText = message.substring(this.commandPrefix.length).trim();
      if (!commandText) return;

      // コマンドを解析
      const parts = commandText.split(/\s+/);
      const command = parts[0].toLowerCase() as ChatCommandType;
      const args = parts.slice(1);

      Logger.structured.debug('BotScript command received', {
        username,
        command,
        args,
        category: 'botscript'
      });

      // 権限チェック
      if (!this.hasPermission(username, command)) {
        this.bot.say.say(`${username}さん、そのコマンドを実行する権限がありません。`);
        return;
      }

      // コマンドを実行
      await this.executeCommand(username, command, args);

    } catch (error) {
      Logger.structured.error('Error handling chat message', error as Error, {
        username,
        message,
        category: 'botscript'
      });
      
      this.bot.say.say(`${username}さん、エラーが発生しました: ${(error as Error).message}`);
    }
  }

  /**
   * チャットコマンドを実行
   */
  private async executeCommand(username: string, command: ChatCommandType, args: string[]): Promise<void> {
    switch (command) {
      case ChatCommandType.SCRIPT:
        await this.executeScript(username, args.join(' '));
        break;

      case ChatCommandType.MULTILINE:
        this.startMultilineSession(username, args.join(' '));
        break;

      case ChatCommandType.LIST:
        this.listVariables(username);
        break;

      case ChatCommandType.CLEAR:
        this.clearVariables(username);
        break;

      case ChatCommandType.SAVE:
        await this.saveScript(username, args);
        break;

      case ChatCommandType.LOAD:
        await this.loadScript(username, args[0]);
        break;

      case ChatCommandType.STOP:
        this.stopExecution(username);
        break;

      case ChatCommandType.STATUS:
        this.showStatus(username);
        break;

      case ChatCommandType.HELP:
        this.showHelp(username, args[0]);
        break;

      default:
        // 不明なコマンド - スクリプトとして実行を試行
        await this.executeScript(username, command + ' ' + args.join(' '));
        break;
    }
  }

  /**
   * 単発スクリプトを実行
   */
  private async executeScript(username: string, scriptContent: string): Promise<void> {
    if (!scriptContent.trim()) {
      this.bot.say.say(`${username}さん、実行するスクリプトが空です。`);
      return;
    }

    try {
      // スクリプトをパース
      const lexer = new Lexer(scriptContent);
      const tokens = lexer.tokenize();
      const parser = new Parser(tokens);
      const ast = parser.parse();

      this.bot.say.say(`${username}さんのスクリプトを実行しています...`);

      // スクリプトを実行
      const result = await this.interpreter.execute(ast);

      if (result.type === ExecutionResultType.SUCCESS) {
        const stats = this.context.getStats();
        this.bot.say.say(`${username}さん、スクリプトが正常に完了しました。` +
          `（文: ${stats.statementsExecuted}、コマンド: ${stats.commandsExecuted}、時間: ${this.context.getExecutionTime()}ms）`);
      } else {
        this.bot.say.say(`${username}さん、スクリプトでエラーが発生しました: ${result.message}`);
      }

      Logger.structured.info('Script executed', {
        username,
        scriptLength: scriptContent.length,
        result: result.type,
        stats: this.context.getStats(),
        category: 'botscript'
      });

    } catch (error) {
      const errorMessage = (error as Error).message;
      this.bot.say.say(`${username}さん、スクリプトの解析に失敗しました: ${errorMessage}`);
      
      Logger.structured.error('Script parsing error', error as Error, {
        username,
        scriptContent,
        category: 'botscript'
      });
    }
  }

  /**
   * 複数行セッションを開始
   */
  private startMultilineSession(username: string, description?: string): void {
    if (this.multilineSessions.has(username)) {
      this.bot.say.say(`${username}さん、既に複数行モードです。!endで終了してください。`);
      return;
    }

    this.multilineSessions.set(username, {
      username,
      lines: [],
      startTime: Date.now()
    });

    this.bot.say.say(`${username}さん、複数行スクリプトモードを開始しました。` +
      `スクリプトを入力し、!endで実行してください。${description ? ` (${description})` : ''}`);
  }

  /**
   * 複数行入力を処理
   */
  private async handleMultilineInput(username: string, message: string): Promise<void> {
    const session = this.multilineSessions.get(username)!;

    // 終了コマンド
    if (message.trim() === '!end') {
      this.multilineSessions.delete(username);

      if (session.lines.length === 0) {
        this.bot.say.say(`${username}さん、スクリプトが空のため実行をキャンセルしました。`);
        return;
      }

      const scriptContent = session.lines.join('\n');
      this.bot.say.say(`${username}さん、複数行スクリプトを実行します...`);
      
      await this.executeScript(username, scriptContent);
      return;
    }

    // キャンセルコマンド
    if (message.trim() === '!cancel') {
      this.multilineSessions.delete(username);
      this.bot.say.say(`${username}さん、複数行スクリプトをキャンセルしました。`);
      return;
    }

    // 行を追加
    session.lines.push(message);
    
    // セッションタイムアウトチェック（5分）
    if (Date.now() - session.startTime > 5 * 60 * 1000) {
      this.multilineSessions.delete(username);
      this.bot.say.say(`${username}さん、複数行セッションがタイムアウトしました。`);
      return;
    }

    // 進捗表示（10行ごと）
    if (session.lines.length % 10 === 0) {
      this.bot.say.say(`${username}さん、${session.lines.length}行入力されました。!endで実行、!cancelでキャンセル。`);
    }
  }

  /**
   * 変数一覧を表示
   */
  private listVariables(username: string): void {
    const variables = this.context.getAllVariables();
    
    if (variables.length === 0) {
      this.bot.say.say(`${username}さん、定義されている変数はありません。`);
      return;
    }

    const userVars = variables.filter(v => !v.name.startsWith('bot_') && !['timestamp', 'pi', 'version', 'bot_name'].includes(v.name));
    const systemVars = variables.filter(v => v.name.startsWith('bot_') || ['timestamp', 'pi', 'version', 'bot_name'].includes(v.name));

    if (userVars.length > 0) {
      const varList = userVars.slice(0, 5).map(v => `$${v.name}=${v.value}`).join(', ');
      this.bot.say.say(`${username}さん、ユーザー変数: ${varList}${userVars.length > 5 ? ` (他${userVars.length - 5}個)` : ''}`);
    }

    const healthInfo = systemVars.find(v => v.name === 'bot_health');
    const foodInfo = systemVars.find(v => v.name === 'bot_food');
    if (healthInfo && foodInfo) {
      this.bot.say.say(`システム情報: 体力=${healthInfo.value}, 満腹度=${foodInfo.value}`);
    }
  }

  /**
   * 変数をクリア
   */
  private clearVariables(username: string): void {
    if (!this.hasAdminPermission(username)) {
      this.bot.say.say(`${username}さん、変数クリアには管理者権限が必要です。`);
      return;
    }

    this.context.reset();
    this.bot.say.say(`${username}さん、全ての変数をクリアしました。`);
  }

  /**
   * スクリプトを保存
   */
  private async saveScript(username: string, args: string[]): Promise<void> {
    if (args.length < 1) {
      this.bot.say.say(`${username}さん、使用法: !save <名前> [説明]`);
      return;
    }

    const name = args[0];
    const description = args.slice(1).join(' ');

    // 複数行セッション中の場合はそれを保存
    const session = this.multilineSessions.get(username);
    if (session && session.lines.length > 0) {
      const content = session.lines.join('\n');
      this.savedScripts.set(name, {
        name,
        content,
        author: username,
        created: Date.now(),
        description
      });

      this.bot.say.say(`${username}さん、スクリプト「${name}」を保存しました。（${session.lines.length}行）`);
      return;
    }

    this.bot.say.say(`${username}さん、保存するスクリプトがありません。複数行モード(!mscript)でスクリプトを作成してください。`);
  }

  /**
   * スクリプトを読み込み
   */
  private async loadScript(username: string, name: string): Promise<void> {
    if (!name) {
      // 保存されたスクリプト一覧を表示
      const scripts = Array.from(this.savedScripts.values());
      if (scripts.length === 0) {
        this.bot.say.say(`${username}さん、保存されたスクリプトはありません。`);
        return;
      }

      const scriptList = scripts.slice(0, 5).map(s => 
        `${s.name}(${s.author})`
      ).join(', ');

      this.bot.say.say(`${username}さん、保存済みスクリプト: ${scriptList}${scripts.length > 5 ? ` (他${scripts.length - 5}個)` : ''}`);
      return;
    }

    const script = this.savedScripts.get(name);
    if (!script) {
      this.bot.say.say(`${username}さん、スクリプト「${name}」が見つかりません。`);
      return;
    }

    this.bot.say.say(`${username}さん、スクリプト「${name}」を実行します...（作成者: ${script.author}）`);
    await this.executeScript(username, script.content);
  }

  /**
   * 実行を停止
   */
  private stopExecution(username: string): void {
    if (!this.interpreter.isExecuting()) {
      this.bot.say.say(`${username}さん、現在実行中のスクリプトはありません。`);
      return;
    }

    this.interpreter.stop();
    this.bot.say.say(`${username}さん、スクリプトの実行を停止しました。`);
  }

  /**
   * 実行状態を表示
   */
  private showStatus(username: string): void {
    const stats = this.context.getStats();
    const isExecuting = this.interpreter.isExecuting();
    const sessionsCount = this.multilineSessions.size;
    const scriptsCount = this.savedScripts.size;

    this.bot.say.say(`${username}さん、BotScript状態: ` +
      `実行中=${isExecuting ? 'はい' : 'いいえ'}, ` +
      `セッション=${sessionsCount}, ` +
      `保存済み=${scriptsCount}, ` +
      `変数=${this.context.getAllVariables().length}`);

    if (stats.statementsExecuted > 0) {
      this.bot.say.say(`実行統計: 文=${stats.statementsExecuted}, コマンド=${stats.commandsExecuted}, エラー=${stats.errors.length}`);
    }
  }

  /**
   * ヘルプを表示
   */
  private showHelp(username: string, topic?: string): void {
    if (!topic) {
      this.bot.say.say(`${username}さん、BotScriptコマンド: ` +
        `!script <コード>, !mscript (複数行), !list (変数), !save <名前>, !load <名前>, !stop, !status`);
      this.bot.say.say(`詳細ヘルプ: !help <コマンド名> 例: !help script`);
      return;
    }

    const helpTexts: Record<string, string> = {
      'script': '!script <コード> - 単発スクリプトを実行。例: !script SAY "Hello"',
      'mscript': '!mscript - 複数行モード開始。スクリプトを入力後!endで実行。',
      'list': '!list - 定義済み変数一覧を表示。',
      'save': '!save <名前> [説明] - 複数行セッション中のスクリプトを保存。',
      'load': '!load <名前> - 保存済みスクリプトを実行。名前なしで一覧表示。',
      'clear': '!clear - 全変数をクリア（管理者のみ）。',
      'stop': '!stop - 実行中のスクリプトを停止。',
      'status': '!status - BotScriptの現在の状態を表示。'
    };

    const helpText = helpTexts[topic.toLowerCase()];
    if (helpText) {
      this.bot.say.say(`${username}さん、${helpText}`);
    } else {
      this.bot.say.say(`${username}さん、「${topic}」のヘルプは見つかりません。`);
    }
  }

  // ===== 権限管理 =====

  /**
   * ユーザーに権限があるかチェック
   */
  private hasPermission(username: string, command: ChatCommandType): boolean {
    // 基本コマンドは全ユーザーに許可
    const basicCommands = [
      ChatCommandType.SCRIPT,
      ChatCommandType.MULTILINE,
      ChatCommandType.LIST,
      ChatCommandType.SAVE,
      ChatCommandType.LOAD,
      ChatCommandType.STOP,
      ChatCommandType.STATUS,
      ChatCommandType.HELP
    ];

    if (basicCommands.includes(command)) {
      return true;
    }

    // 管理者コマンド
    return this.hasAdminPermission(username);
  }

  /**
   * 管理者権限をチェック
   */
  private hasAdminPermission(username: string): boolean {
    return this.adminUsers.has(username);
  }

  /**
   * ユーザーに権限を追加
   */
  addAuthorizedUser(username: string): void {
    this.authorizedUsers.add(username);
  }

  /**
   * ユーザーを管理者に追加
   */
  addAdminUser(username: string): void {
    this.adminUsers.add(username);
  }

  // ===== ユーティリティ =====

  /**
   * コマンドプレフィックスを設定
   */
  setCommandPrefix(prefix: string): void {
    this.commandPrefix = prefix;
  }

  /**
   * 全セッションをクリア
   */
  private clearAllSessions(): void {
    this.multilineSessions.clear();
  }

  /**
   * 統計情報を取得
   */
  getStatistics(): {
    isEnabled: boolean;
    activeSessions: number;
    savedScripts: number;
    authorizedUsers: number;
    adminUsers: number;
  } {
    return {
      isEnabled: this.isEnabled,
      activeSessions: this.multilineSessions.size,
      savedScripts: this.savedScripts.size,
      authorizedUsers: this.authorizedUsers.size,
      adminUsers: this.adminUsers.size
    };
  }
}