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
      // スクリプトのメタデータを作成
      const script: SavedScript = {
        name: scriptName,
        content: scriptContent,
        created: Date.now(),
      };

      // 保存済みスクリプトに追加
      this.savedScripts.set(scriptName, script);

      // ディスクに保存
      this.saveScriptToDisk(scriptName, script);

      this.bot.sendMessage(
        `${username}さん、スクリプト「${scriptName}」を保存しました。`
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
   * 保存済みスクリプトをディスクから読み込み
   */
  private loadSavedScriptsFromDisk(): void {
    try {
      if (!fs.existsSync(this.scriptsDirectory)) {
        return;
      }

      const files = fs.readdirSync(this.scriptsDirectory);
      for (const file of files) {
        // .bs形式のスクリプト（人間が読みやすい）
        const filePath = path.join(this.scriptsDirectory, file);
        const content = fs.readFileSync(filePath, "utf8");
        const scriptName = path.basename(file).replace(/\.(bs)$/, "");

        this.savedScripts.set(scriptName, {
          name: scriptName,
          content: content,
          created: Date.now(),
        });
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
      const filePath = path.join(this.scriptsDirectory, `${name}.json`);
      fs.writeFileSync(filePath, JSON.stringify(script, null, 2), "utf8");

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
