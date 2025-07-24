import { Bot } from "../../core/Bot";
import { Lexer } from "../lexer/Lexer";
import { Parser } from "../parser/Parser";
import { Interpreter, ExecutionResultType } from "../interpreter/Interpreter";
import { ExecutionContext } from "../interpreter/ExecutionContext";
import { Logger } from "../../utils/Logger";
import * as fs from "fs";
import * as path from "path";

/**
 * Saved script
 */
interface SavedScript {
  name: string;
  content: string;
  created: number;
}

/**
 * Script execution result
 */
export interface ExecutionResult {
  statementsExecuted: number;
  commandsExecuted: number;
  executionTime: number;
}

/**
 * Script execution status
 */
export interface ExecutionStatus extends ExecutionResult {
  isExecuting: boolean;
}

/**
 * BotScript chat interface
 * Enables BotScript execution through Minecraft chat
 */

export class ScriptManager {
  private interpreter: Interpreter;
  private context: ExecutionContext;
  private savedScripts: Map<string, SavedScript> = new Map();
  private scriptsDirectory: string = path.join(
    process.cwd(),
    "scripts",
    "saved"
  );

  constructor(bot: Bot) {
    this.context = new ExecutionContext();
    this.interpreter = new Interpreter(bot, this.context);

    // Create script save directory
    this.ensureScriptsDirectory();

    // Load saved scripts
    this.loadSavedScriptsFromDisk();
  }

  /**
   * Execute one-time script
   * @returns Execution result statistics
   */
  public async executeScript(scriptContent: string): Promise<ExecutionResult> {
    if (!scriptContent.trim()) {
      throw new Error('Script to execute is empty');
    }

    // Parse script
    const lexer = new Lexer(scriptContent);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    // Execute script
    const result = await this.interpreter.execute(ast);

    if (result.type !== ExecutionResultType.SUCCESS) {
      throw new Error(`Script execution error: ${result.message}`);
    }

    const stats = this.context.getStats();
    return {
      statementsExecuted: stats.statementsExecuted,
      commandsExecuted: stats.commandsExecuted,
      executionTime: this.context.getExecutionTime(),
    };
  }

  /**
   * Save script
   * @returns Sanitized script name
   */
  public async saveScript(
    scriptName: string,
    scriptContent: string
  ): Promise<string> {
    if (!scriptName) {
      throw new Error('Please specify a script name to save');
    }
    if (!scriptContent.trim()) {
      throw new Error('Script to save is empty');
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
    return new Map(this.savedScripts);
  }

  /**
   * スクリプトを読み込んで実行
   * @returns 実行結果の統計情報
   */
  public async loadScript(name: string): Promise<ExecutionResult> {
    if (!name) {
      throw new Error('Please specify a script name to execute');
    }

    const script = this.savedScripts.get(name);
    if (!script) {
      throw new Error(`Script "${name}" not found`);
    }

    return await this.executeScript(script.content);
  }

  /**
   * 実行を停止
   * @returns 停止に成功したかどうか
   */
  public stopExecution(): boolean {
    if (!this.interpreter.isExecuting()) {
      return false;
    }

    this.interpreter.stop();
    return true;
  }

  /**
   * 実行状態を取得
   * @returns 実行状態情報
   */
  public getStatus(): ExecutionStatus {
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
      throw new Error("Invalid filename");
    }

    // 基本的なバリデーション
    if (fileName.trim().length === 0) {
      throw new Error("Filename is empty");
    }

    if (fileName.length > 100) {
      throw new Error("Filename is too long (max 100 characters)");
    }

    // パストラバーサル攻撃の検出
    const parsed = path.parse(fileName);
    if (parsed.dir !== "" || parsed.root !== "") {
      throw new Error("Filename cannot contain directory paths");
    }

    // 危険な文字の検出
    const dangerousChars = ["..", "/", "\\", ":", "*", "?", '"', "<", ">", "|"];
    for (const char of dangerousChars) {
      if (fileName.includes(char)) {
        throw new Error(
          `Filename contains invalid character: ${char}`
        );
      }
    }

    // ホワイトリスト: 英数字、ハイフン、アンダースコア、日本語のみ許可
    const allowedPattern =
      /^[a-zA-Z0-9\-_\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+$/;
    if (!allowedPattern.test(fileName)) {
      throw new Error(
        "Filename can only contain alphanumeric characters, hyphens, underscores, and Japanese characters"
      );
    }

    // 高度なパストラバーサル攻撃対策
    // path.resolve()で正規化してpath.relative()で安全性を確認
    const sanitizedName = fileName.trim();
    const resolvedPath = path.resolve(this.scriptsDirectory, sanitizedName);
    const normalizedScriptsDir = path.resolve(this.scriptsDirectory);
    
    // 相対パスを計算してセキュリティチェック
    const relativePath = path.relative(normalizedScriptsDir, resolvedPath);
    
    // セキュリティチェック: ディレクトリ自体、親ディレクトリ、絶対パスを禁止
    if (relativePath === "") {
      throw new Error("Cannot access directory itself");
    }
    
    if (relativePath.startsWith("..")) {
      throw new Error("Access to parent directory is prohibited");
    }
    
    if (path.isAbsolute(relativePath)) {
      throw new Error("Absolute paths are not allowed");
    }
    
    // Windows環境での追加チェック: バックスラッシュでの親ディレクトリアクセス
    if (relativePath.includes("..")) {
      throw new Error("Path traversal attack detected");
    }

    return sanitizedName;
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
  private loadSingleScript(file: string): void {
    try {
      const filePath = path.join(this.scriptsDirectory, file);
      const content = fs.readFileSync(filePath, "utf8");
      const scriptName = path.basename(file).replace(/\.bs$/, "");

      // ファイル名のサニタイゼーション
      const sanitizedName = this.sanitizeFileName(scriptName);

      this.savedScripts.set(sanitizedName, {
        name: sanitizedName,
        content: content,
        created: fs.statSync(filePath).mtimeMs,
      });
    } catch (error) {
      // 不正なファイル名や読み込みエラーの場合はログに記録して続行
      Logger.structured.warn("Failed to load single script", {
        fileName: file,
        error: (error as Error).message,
        category: "botscript",
      });
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
