import { IAbility } from "./IAbility";
import { Bot } from "../core/Bot";

/**
 * Say（発言）アビリティ
 * チャットでの発言やメッセージ送信に関する能力
 */
export class SayAbility implements IAbility {
  private bot: Bot | null = null;
  private messageHistory: Array<{ timestamp: number; message: string }> = [];
  private maxHistorySize = 100;

  getName(): string {
    return "Say";
  }

  getDescription(): string {
    return "チャットでの発言やメッセージ送信を管理します";
  }

  initialize(bot: Bot): void {
    this.bot = bot;
  }

  isAvailable(): boolean {
    return this.bot !== null;
  }

  /**
   * チャットメッセージを送信
   * @param message 送信するメッセージ
   */
  say(message: string): void {
    if (!this.bot) return;
    
    this.bot.sendMessage(message);
    this.addToHistory(message);
  }

  /**
   * ウィスパー（プライベートメッセージ）を送信
   * @param player 送信先プレイヤー
   * @param message 送信するメッセージ
   */
  whisper(player: string, message: string): void {
    if (!this.bot) return;
    
    const whisperMessage = `/msg ${player} ${message}`;
    this.bot.sendMessage(whisperMessage);
    this.addToHistory(`[Whisper to ${player}] ${message}`);
  }

  /**
   * 全体チャットにメッセージを送信
   * @param message 送信するメッセージ
   */
  broadcast(message: string): void {
    if (!this.bot) return;
    
    this.say(message);
  }

  /**
   * 挨拶メッセージを送信
   * @param player 挨拶する相手のプレイヤー（省略時は一般的な挨拶）
   */
  greet(player?: string): void {
    if (player) {
      this.say(`こんにちは、${player}さん！`);
    } else {
      this.say("こんにちは！");
    }
  }

  /**
   * 別れの挨拶メッセージを送信
   * @param player 別れの挨拶をする相手のプレイヤー（省略時は一般的な挨拶）
   */
  farewell(player?: string): void {
    if (player) {
      this.say(`さようなら、${player}さん！`);
    } else {
      this.say("さようなら！");
    }
  }

  /**
   * 感謝のメッセージを送信
   * @param player 感謝する相手のプレイヤー（省略時は一般的な感謝）
   */
  thank(player?: string): void {
    if (player) {
      this.say(`ありがとう、${player}さん！`);
    } else {
      this.say("ありがとう！");
    }
  }

  /**
   * 謝罪のメッセージを送信
   * @param player 謝罪する相手のプレイヤー（省略時は一般的な謝罪）
   */
  apologize(player?: string): void {
    if (player) {
      this.say(`すみません、${player}さん`);
    } else {
      this.say("すみません");
    }
  }

  /**
   * 状況報告メッセージを送信
   * @param status 報告する状況
   */
  reportStatus(status: string): void {
    this.say(`[状況報告] ${status}`);
  }

  /**
   * エラーメッセージを送信
   * @param error エラーの内容
   */
  reportError(error: string): void {
    this.say(`[エラー] ${error}`);
  }

  /**
   * 成功メッセージを送信
   * @param action 成功した行動
   */
  reportSuccess(action: string): void {
    this.say(`[成功] ${action}が完了しました`);
  }

  /**
   * 警告メッセージを送信
   * @param warning 警告の内容
   */
  reportWarning(warning: string): void {
    this.say(`[警告] ${warning}`);
  }

  /**
   * 情報メッセージを送信
   * @param info 情報の内容
   */
  reportInfo(info: string): void {
    this.say(`[情報] ${info}`);
  }

  /**
   * 位置情報を報告
   */
  reportPosition(): void {
    if (!this.bot) return;
    
    const pos = this.bot.getPosition();
    this.say(`現在位置: X=${pos.x}, Y=${pos.y}, Z=${pos.z}`);
  }

  /**
   * 体力状態を報告
   */
  reportHealth(): void {
    if (!this.bot) return;
    
    const health = this.bot.mc.health;
    const food = this.bot.mc.food;
    this.say(`体力: ${health}/20, 空腹度: ${food}/20`);
  }

  /**
   * インベントリ状態を報告
   */
  reportInventory(): void {
    if (!this.bot) return;
    
    const items = this.bot.getInventory();
    const emptySlots = this.bot.mc.inventory.emptySlotCount();
    this.say(`インベントリ: ${items.length}個のアイテム, 空きスロット: ${emptySlots}`);
  }

  /**
   * 現在の時刻を報告
   */
  reportTime(): void {
    if (!this.bot) return;
    
    const time = this.bot.mc.time.timeOfDay;
    const isDay = time < 12000;
    const timeStr = isDay ? "昼" : "夜";
    this.say(`現在の時刻: ${timeStr} (${time})`);
  }

  /**
   * 天候を報告
   */
  reportWeather(): void {
    if (!this.bot) return;
    
    const isRaining = this.bot.mc.isRaining;
    const weatherStr = isRaining ? "雨" : "晴れ";
    this.say(`天候: ${weatherStr}`);
  }

  /**
   * ランダムな励ましメッセージを送信
   */
  encourage(): void {
    const encouragements = [
      "頑張りましょう！",
      "一緒にがんばろう！",
      "きっとできる！",
      "諦めないで！",
      "応援しています！",
      "ファイト！",
      "その調子！",
      "素晴らしい！"
    ];
    
    const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
    this.say(randomEncouragement);
  }

  /**
   * ランダムな挨拶メッセージを送信
   */
  randomGreeting(): void {
    const greetings = [
      "こんにちは！",
      "おはよう！",
      "こんばんは！",
      "お疲れ様！",
      "よろしくお願いします！",
      "元気ですか？",
      "調子はどうですか？",
      "今日もよろしく！"
    ];
    
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    this.say(randomGreeting);
  }

  /**
   * メッセージ履歴に追加
   * @param message 追加するメッセージ
   */
  private addToHistory(message: string): void {
    this.messageHistory.push({
      timestamp: Date.now(),
      message: message
    });
    
    // 履歴サイズが上限を超えた場合、古いメッセージを削除
    if (this.messageHistory.length > this.maxHistorySize) {
      this.messageHistory.shift();
    }
  }

  /**
   * メッセージ履歴を取得
   * @param limit 取得する件数（デフォルト: 10）
   * @returns メッセージ履歴
   */
  getMessageHistory(limit: number = 10): Array<{ timestamp: number; message: string }> {
    return this.messageHistory.slice(-limit);
  }

  /**
   * 最後に送信したメッセージを取得
   * @returns 最後に送信したメッセージ、履歴がない場合はnull
   */
  getLastMessage(): string | null {
    if (this.messageHistory.length === 0) return null;
    return this.messageHistory[this.messageHistory.length - 1].message;
  }

  /**
   * メッセージ履歴をクリア
   */
  clearHistory(): void {
    this.messageHistory = [];
  }

  /**
   * 指定した時間前のメッセージを取得
   * @param minutes 何分前まで遡るか
   * @returns 指定時間内のメッセージ
   */
  getRecentMessages(minutes: number): Array<{ timestamp: number; message: string }> {
    const cutoffTime = Date.now() - (minutes * 60 * 1000);
    return this.messageHistory.filter(entry => entry.timestamp >= cutoffTime);
  }

  /**
   * 使用可能なメッセージテンプレートを取得
   * @returns メッセージテンプレートのリスト
   */
  getMessageTemplates(): {
    greetings: string[];
    farewells: string[];
    thanks: string[];
    apologies: string[];
    encouragements: string[];
  } {
    return {
      greetings: [
        "こんにちは！",
        "おはよう！",
        "こんばんは！",
        "お疲れ様！",
        "よろしくお願いします！"
      ],
      farewells: [
        "さようなら！",
        "また後で！",
        "お疲れ様でした！",
        "また会いましょう！",
        "バイバイ！"
      ],
      thanks: [
        "ありがとう！",
        "感謝します！",
        "助かりました！",
        "お疲れ様！",
        "ありがとうございました！"
      ],
      apologies: [
        "すみません",
        "申し訳ありません",
        "ごめんなさい",
        "失礼しました",
        "お詫びします"
      ],
      encouragements: [
        "頑張りましょう！",
        "一緒にがんばろう！",
        "きっとできる！",
        "諦めないで！",
        "応援しています！"
      ]
    };
  }
}