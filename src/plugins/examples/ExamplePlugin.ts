import { IPlugin, PluginMetadata } from "../IPlugin";
import { Bot } from "../../core/Bot";
import { Logger } from "../../utils/Logger";

/**
 * 例: プラグインの実装サンプル
 * ボットの挨拶機能を拡張するプラグイン
 */
export class ExamplePlugin implements IPlugin {
  private bot: Bot | null = null;
  private enabled = false;
  private config = {
    autoGreeting: true,
    greetingInterval: 60000, // 60秒
    customGreetings: [
      "こんにちは！元気ですか？",
      "今日もよろしくお願いします！",
      "調子はどうですか？",
      "何かお手伝いできることはありますか？"
    ]
  };
  private greetingTimer: NodeJS.Timeout | null = null;

  getMetadata(): PluginMetadata {
    return {
      name: "ExamplePlugin",
      version: "1.0.0",
      description: "ボットの挨拶機能を拡張するサンプルプラグイン",
      author: "MinecraftBot Team",
      dependencies: [],
      permissions: ["chat.send"]
    };
  }

  async initialize(bot: Bot): Promise<void> {
    this.bot = bot;
    Logger.structured.info("ExamplePlugin initialized", { 
      botName: bot.getName() 
    });
  }

  async enable(): Promise<void> {
    if (!this.bot) {
      throw new Error("Plugin not initialized");
    }

    this.enabled = true;
    
    // 初回挨拶
    this.bot.say.randomGreeting();
    
    // 定期挨拶の開始
    if (this.config.autoGreeting) {
      this.startPeriodicGreeting();
    }

    Logger.structured.info("ExamplePlugin enabled");
  }

  async disable(): Promise<void> {
    this.enabled = false;
    
    // 定期挨拶の停止
    this.stopPeriodicGreeting();
    
    if (this.bot) {
      this.bot.say.say("ExamplePluginが無効化されました");
    }

    Logger.structured.info("ExamplePlugin disabled");
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getConfig(): any {
    return { ...this.config };
  }

  updateConfig(newConfig: any): void {
    this.config = { ...this.config, ...newConfig };
    
    // 設定変更に応じて定期挨拶を再設定
    if (this.enabled) {
      this.stopPeriodicGreeting();
      if (this.config.autoGreeting) {
        this.startPeriodicGreeting();
      }
    }
    
    Logger.structured.info("ExamplePlugin configuration updated", {
      config: this.config
    });
  }

  registerEventHandlers(): void {
    if (!this.bot) return;

    // カスタムイベントハンドラーの例
    this.bot.mc.on('chat', (username: string, message: string) => {
      this.handleChatMessage(username, message);
    });

    this.bot.mc.on('playerJoined', (player: any) => {
      this.handlePlayerJoined(player);
    });

    this.bot.mc.on('playerLeft', (player: any) => {
      this.handlePlayerLeft(player);
    });

    Logger.structured.info("ExamplePlugin event handlers registered");
  }

  async cleanup(): Promise<void> {
    this.stopPeriodicGreeting();
    this.bot = null;
    Logger.structured.info("ExamplePlugin cleanup completed");
  }

  /**
   * 定期挨拶を開始
   */
  private startPeriodicGreeting(): void {
    if (this.greetingTimer) {
      clearInterval(this.greetingTimer);
    }

    this.greetingTimer = setInterval(() => {
      if (this.bot && this.enabled) {
        const randomGreeting = this.getRandomCustomGreeting();
        this.bot.say.say(randomGreeting);
      }
    }, this.config.greetingInterval);
  }

  /**
   * 定期挨拶を停止
   */
  private stopPeriodicGreeting(): void {
    if (this.greetingTimer) {
      clearInterval(this.greetingTimer);
      this.greetingTimer = null;
    }
  }

  /**
   * ランダムなカスタム挨拶を取得
   */
  private getRandomCustomGreeting(): string {
    const greetings = this.config.customGreetings;
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  /**
   * チャットメッセージの処理
   */
  private handleChatMessage(username: string, message: string): void {
    if (!this.bot || !this.enabled) return;

    // 特定のキーワードに反応
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('こんにちは')) {
      this.bot.say.greet(username);
    } else if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye') || lowerMessage.includes('さようなら')) {
      this.bot.say.farewell(username);
    } else if (lowerMessage.includes('thank') || lowerMessage.includes('ありがとう')) {
      this.bot.say.say(`どういたしまして、${username}さん！`);
    }

    // ログ記録
    Logger.structured.debug("ExamplePlugin processed chat message", {
      username,
      message,
      botName: this.bot.getName()
    });
  }

  /**
   * プレイヤー参加の処理
   */
  private handlePlayerJoined(player: any): void {
    if (!this.bot || !this.enabled) return;

    // 新しいプレイヤーを歓迎
    setTimeout(() => {
      if (this.bot) {
        this.bot.say.say(`${player.username}さん、サーバーへようこそ！`);
        this.bot.say.encourage();
      }
    }, 2000); // 2秒後に挨拶

    Logger.structured.info("ExamplePlugin welcomed new player", {
      playerName: player.username,
      botName: this.bot.getName()
    });
  }

  /**
   * プレイヤー離脱の処理
   */
  private handlePlayerLeft(player: any): void {
    if (!this.bot || !this.enabled) return;

    this.bot.say.say(`${player.username}さん、また遊びに来てくださいね！`);

    Logger.structured.info("ExamplePlugin said goodbye to player", {
      playerName: player.username,
      botName: this.bot.getName()
    });
  }

  /**
   * プラグイン固有のコマンド処理（例）
   */
  public handleCustomCommand(command: string, args: string[], username: string): boolean {
    if (!this.bot || !this.enabled) return false;

    switch (command) {
      case 'greet':
        if (args.length > 0) {
          this.bot.say.greet(args[0]);
        } else {
          this.bot.say.greet(username);
        }
        return true;

      case 'customgreet':
        const customGreeting = this.getRandomCustomGreeting();
        this.bot.say.say(customGreeting);
        return true;

      case 'pluginstatus':
        this.reportPluginStatus();
        return true;

      default:
        return false;
    }
  }

  /**
   * プラグインの状態を報告
   */
  private reportPluginStatus(): void {
    if (!this.bot) return;

    const metadata = this.getMetadata();
    this.bot.say.reportInfo(`${metadata.name} v${metadata.version} - ${this.enabled ? '有効' : '無効'}`);
    
    if (this.config.autoGreeting) {
      this.bot.say.say(`定期挨拶: ${this.config.greetingInterval / 1000}秒間隔で有効`);
    } else {
      this.bot.say.say('定期挨拶: 無効');
    }
  }
}

// プラグインのエクスポート
export default ExamplePlugin;