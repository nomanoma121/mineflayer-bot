import { Bot } from "../../core/Bot";
import { Lexer } from "../lexer/Lexer";
import { Parser } from "../parser/Parser";
import { Interpreter, ExecutionResultType } from "../interpreter/Interpreter";
import { ExecutionContext } from "../interpreter/ExecutionContext";
import { Logger } from "../../utils/Logger";
import * as fs from "fs";
import * as path from "path";

/**
 * 保存されたスクリプト
 */
interface SavedScript {
  name: string;
  content: string;
  created: number;
}

/**
 * BotScript チャットインターフェース
 * Minecraftチャットを通じてBotScriptの実行を可能にする
 */

export class ScriptManager {
  private bot: Bot;
  private interpreter: Interpreter;
  private context: ExecutionContext;
  private savedScripts: Map<string, SavedScript> = new Map();
  private scriptsDirectory: string = path.join(
    process.cwd(),
    "scripts",
    "saved"
  );

  constructor(bot: Bot) {
    this.bot = bot;
    this.context = new ExecutionContext();
    this.interpreter = new Interpreter(bot, this.context);

    // スクリプト保存ディレクトリを作成
    this.ensureScriptsDirectory();

    // 保存済みスクリプトを読み込み
    this.loadSavedScriptsFromDisk();
  }

  /**
   * 単発スクリプトを実行
   */
  public async executeScript(
    username: string,
    scriptContent: string
  ): Promise<void> {
    if (!scriptContent.trim()) {
      this.bot.sendMessage(`${username}さん、実行するスクリプトが空です。`);
      return;
    }

    try {
      // スクリプトをパース
      const lexer = new Lexer(scriptContent);
      const tokens = lexer.tokenize();
      const parser = new Parser(tokens);
      const ast = parser.parse();

      this.bot.sendMessage(`${username}さんのスクリプトを実行しています...`);

      // スクリプトを実行
      const result = await this.interpreter.execute(ast);

      if (result.type === ExecutionResultType.SUCCESS) {
        const stats = this.context.getStats();
        this.bot.sendMessage(
          `${username}さん、スクリプトが正常に完了しました。` +
            `（文: ${stats.statementsExecuted}、コマンド: ${
              stats.commandsExecuted
            }、時間: ${this.context.getExecutionTime()}ms）`
        );
      } else {
        this.bot.sendMessage(
          `${username}さん、スクリプトでエラーが発生しました: ${result.message}`
        );
      }
    } catch (error) {
      const errorMessage = (error as Error).message;
      this.bot.sendMessage(
        `${username}さん、スクリプトの解析に失敗しました: ${errorMessage}`
      );
    }
  }

  /**
   * スクリプトを保存
   */
  public async saveScript(
    username: string,
    scriptName: string,
    scriptContent: string
  ): Promise<void> {
    if (!scriptName) {
      this.bot.sendMessage(
        `${username}さん、保存するスクリプト名を指定してください。`
      );
      return;
    }
    if (!scriptContent.trim()) {
      this.bot.sendMessage(`${username}さん、保存するスクリプトが空です。`);
      return;
    }

    try {
      // ファイル名のサニタイゼーション
      const sanitizedName = this.sanitizeFileName(scriptName);

      // スクリプトのメタデータを作成
      const script: SavedScript = {
        name: sanitizedName,
        content: scriptContent,
        created: Date.now(),
      };

      // ディスクに保存
      this.saveScriptToDisk(sanitizedName, script);

      this.savedScripts.set(sanitizedName, script); // メモリにも保存

      this.bot.sendMessage(
        `${username}さん、スクリプト「${sanitizedName}」を保存しました。`
      );
    } catch (error) {
      const errorMessage = (error as Error).message;
      this.bot.sendMessage(
        `${username}さん、スクリプトの保存に失敗しました: ${errorMessage}`
      );
      Logger.structured.error("Failed to save script", error as Error, {
        scriptName,
        category: "botscript",
      });
    }
  }

  public getSavedScripts(): Map<string, SavedScript> {
    return this.savedScripts;
  }

  /**
   * スクリプトを読み込み
   */
  public async loadScript(username: string, name: string): Promise<void> {
    if (!name) {
      // 保存されたスクリプト一覧を表示
      const scripts = Array.from(this.savedScripts.values());
      if (scripts.length === 0) {
        this.bot.sendMessage(
          `${username}さん、保存されたスクリプトはありません。`
        );
        return;
      }

      const scriptList = scripts
        .slice(0, 5)
        .map((s) => `${s.name}`)
        .join(", ");

      this.bot.sendMessage(
        `${username}さん、保存済みスクリプト: ${scriptList}${
          scripts.length > 5 ? ` (他${scripts.length - 5}個)` : ""
        }`
      );
      return;
    }

    const script = this.savedScripts.get(name);
    if (!script) {
      this.bot.sendMessage(
        `${username}さん、スクリプト「${name}」が見つかりません。`
      );
      return;
    }

    this.bot.sendMessage(
      `${username}さん、スクリプト「${name}」を実行します...`
    );
    await this.executeScript(username, script.content);
  }

  /**
   * 実行を停止
   */
  public stopExecution(username: string): void {
    if (!this.interpreter.isExecuting()) {
      this.bot.sendMessage(
        `${username}さん、現在実行中のスクリプトはありません。`
      );
      return;
    }

    this.interpreter.stop();
    this.bot.sendMessage(`${username}さん、スクリプトの実行を停止しました。`);
  }

  /**
   * 実行状態を表示
   */
  public showStatus(username: string): void {
    const stats = this.context.getStats();
    const isExecuting = this.interpreter.isExecuting();

    if (!isExecuting) {
      this.bot.sendMessage(
        `${username}さん、現在実行中のスクリプトはありません。`
      );
      return;
    }

    this.bot.sendMessage(
      `${username}さん、現在のスクリプト実行状態: ` +
        `文: ${stats.statementsExecuted}, コマンド: ${stats.commandsExecuted}, ` +
        `時間: ${this.context.getExecutionTime()}ms`
    );
  }

  // ===== ユーティリティ =====

  /**
   * ファイル名のサニタイゼーション
   * パストラバーサル攻撃を防止し、安全なファイル名のみを許可
   */
  private sanitizeFileName(fileName: string): string {
    if (!fileName || typeof fileName !== 'string') {
      throw new Error('ファイル名が無効です');
    }

    // 基本的なバリデーション
    if (fileName.trim().length === 0) {
      throw new Error('ファイル名が空です');
    }

    if (fileName.length > 100) {
      throw new Error('ファイル名が長すぎます（100文字以内）');
    }

    // パストラバーサル攻撃の検出
    const parsed = path.parse(fileName);
    if (parsed.dir !== '' || parsed.root !== '') {
      throw new Error('ファイル名にディレクトリパスを含めることはできません');
    }

    // 危険な文字の検出
    const dangerousChars = ['..', '/', '\\', ':', '*', '?', '"', '<', '>', '|'];
    for (const char of dangerousChars) {
      if (fileName.includes(char)) {
        throw new Error(`ファイル名に使用できない文字が含まれています: ${char}`);
      }
    }

    // ホワイトリスト: 英数字、ハイフン、アンダースコア、日本語のみ許可
    const allowedPattern = /^[a-zA-Z0-9\-_\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+$/;
    if (!allowedPattern.test(fileName)) {
      throw new Error('ファイル名には英数字、ハイフン、アンダースコア、日本語のみ使用できます');
    }

    return fileName.trim();
  }

  /**
   * スクリプト保存ディレクトリを確保
   */
  private ensureScriptsDirectory(): void {
    try {
      if (!fs.existsSync(this.scriptsDirectory)) {
        fs.mkdirSync(this.scriptsDirectory, { recursive: true });
      }
    } catch (error) {
      Logger.structured.error(
        "Failed to create scripts directory",
        error as Error,
        {
          directory: this.scriptsDirectory,
          category: "botscript",
        }
      );
    }
  }

  /**
   * 単一スクリプトファイルを読み込み
   */
  private loadSingleScript(file: string): boolean {
    try {
      const filePath = path.join(this.scriptsDirectory, file);
      const content = fs.readFileSync(filePath, "utf8");
      const scriptName = path.basename(file).replace(/\.(bs)$/, "");

      // ファイル名のサニタイゼーション
      const sanitizedName = this.sanitizeFileName(scriptName);
      
      this.savedScripts.set(sanitizedName, {
        name: sanitizedName,
        content: content,
        created: fs.statSync(filePath).mtimeMs,
      });

      return true;
    } catch (error) {
      // 不正なファイル名や読み込みエラーの場合
      Logger.structured.warn("Failed to load single script", {
        fileName: file,
        error: (error as Error).message,
        category: "botscript",
      });
      return false;
    }
  }

  /**
   * 保存済みスクリプトをディスクから読み込み
   */
  private loadSavedScriptsFromDisk(): void {
    try {
      const files = fs.readdirSync(this.scriptsDirectory);
      for (const file of files) {
        if (!file.endsWith(".bs")) continue;
        
        // 単一ファイル読み込みを分離したメソッドで処理
        this.loadSingleScript(file);
      }

      Logger.structured.info("Loaded saved scripts from disk", {
        count: this.savedScripts.size,
        category: "botscript",
      });
    } catch (error) {
      Logger.structured.error("Failed to load saved scripts", error as Error, {
        category: "botscript",
      });
    }
  }

  /**
   * スクリプトをディスクに保存
   */
  public saveScriptToDisk(name: string, script: SavedScript): void {
    try {
      const filePath = path.join(this.scriptsDirectory, `${name}.bs`);
      fs.writeFileSync(filePath, script.content, "utf8");

      Logger.structured.info("Script saved to disk", {
        name,
        filePath,
        category: "botscript",
      });
    } catch (error) {
      Logger.structured.error("Failed to save script to disk", error as Error, {
        name,
        category: "botscript",
      });
    }
  }
}
