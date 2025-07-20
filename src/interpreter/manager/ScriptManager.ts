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
   * @returns 実行結果の統計情報
   */
  public async executeScript(scriptContent: string): Promise<{
    statementsExecuted: number;
    commandsExecuted: number;
    executionTime: number;
  }> {
    if (!scriptContent.trim()) {
      throw new Error('実行するスクリプトが空です');
    }

    // スクリプトをパース
    const lexer = new Lexer(scriptContent);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    // スクリプトを実行
    const result = await this.interpreter.execute(ast);

    if (result.type !== ExecutionResultType.SUCCESS) {
      throw new Error(`スクリプト実行エラー: ${result.message}`);
    }

    const stats = this.context.getStats();
    return {
      statementsExecuted: stats.statementsExecuted,
      commandsExecuted: stats.commandsExecuted,
      executionTime: this.context.getExecutionTime(),
    };
  }

  /**
   * スクリプトを保存
   * @returns サニタイズされたスクリプト名
   */
  public async saveScript(
    scriptName: string,
    scriptContent: string
  ): Promise<string> {
    if (!scriptName) {
      throw new Error('保存するスクリプト名を指定してください');
    }
    if (!scriptContent.trim()) {
      throw new Error('保存するスクリプトが空です');
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

      // メモリにも保存
      this.savedScripts.set(sanitizedName, script);

      return sanitizedName;
    } catch (error) {
      Logger.structured.error("Failed to save script", error as Error, {
        scriptName,
        category: "botscript",
      });
      throw error;
    }
  }

  public getSavedScripts(): Map<string, SavedScript> {
    return this.savedScripts;
  }

  /**
   * スクリプトを読み込んで実行
   * @returns 実行結果の統計情報
   */
  public async loadScript(name: string): Promise<{
    statementsExecuted: number;
    commandsExecuted: number;
    executionTime: number;
  }> {
    if (!name) {
      throw new Error('実行するスクリプト名を指定してください');
    }

    const script = this.savedScripts.get(name);
    if (!script) {
      throw new Error(`スクリプト「${name}」が見つかりません`);
    }

    return await this.executeScript(script.content);
  }

  /**
   * 実行を停止
   * @returns 停止に成功したかどうか
   */
  public stopExecution(): boolean {
    if (!this.interpreter.isExecuting()) {
      throw new Error('現在実行中のスクリプトはありません');
    }

    this.interpreter.stop();
    return true;
  }

  /**
   * 実行状態を取得
   * @returns 実行状態情報
   */
  public getStatus(): {
    isExecuting: boolean;
    statementsExecuted: number;
    commandsExecuted: number;
    executionTime: number;
  } {
    const stats = this.context.getStats();
    return {
      isExecuting: this.interpreter.isExecuting(),
      statementsExecuted: stats.statementsExecuted,
      commandsExecuted: stats.commandsExecuted,
      executionTime: this.context.getExecutionTime(),
    };
  }

  // ===== ユーティリティ =====

  /**
   * ファイル名のサニタイゼーション
   * パストラバーサル攻撃を防止し、安全なファイル名のみを許可
   */
  private sanitizeFileName(fileName: string): string {
    if (!fileName || typeof fileName !== "string") {
      throw new Error("ファイル名が無効です");
    }

    // 基本的なバリデーション
    if (fileName.trim().length === 0) {
      throw new Error("ファイル名が空です");
    }

    if (fileName.length > 100) {
      throw new Error("ファイル名が長すぎます（100文字以内）");
    }

    // パストラバーサル攻撃の検出
    const parsed = path.parse(fileName);
    if (parsed.dir !== "" || parsed.root !== "") {
      throw new Error("ファイル名にディレクトリパスを含めることはできません");
    }

    // 危険な文字の検出
    const dangerousChars = ["..", "/", "\\", ":", "*", "?", '"', "<", ">", "|"];
    for (const char of dangerousChars) {
      if (fileName.includes(char)) {
        throw new Error(
          `ファイル名に使用できない文字が含まれています: ${char}`
        );
      }
    }

    // ホワイトリスト: 英数字、ハイフン、アンダースコア、日本語のみ許可
    const allowedPattern =
      /^[a-zA-Z0-9\-_\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+$/;
    if (!allowedPattern.test(fileName)) {
      throw new Error(
        "ファイル名には英数字、ハイフン、アンダースコア、日本語のみ使用できます"
      );
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
  private saveScriptToDisk(name: string, script: SavedScript): void {
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
