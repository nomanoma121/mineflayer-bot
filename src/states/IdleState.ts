import { IBotState } from "./IBotState";
import { Bot } from "../core/Bot";

/**
 * 待機状態クラス
 * ボットが何もしておらず、命令を待っている状態を表現
 * ステートパターンの具体的な実装
 */
export class IdleState implements IBotState {
  private static instances: Map<string, IdleState> = new Map();
  private readonly bot: Bot;

  private constructor(bot: Bot) {
    this.bot = bot;
  }

  /**
   * IdleStateのシングルトンインスタンスを取得
   * @param bot - ボットインスタンス
   * @returns IdleStateのインスタンス
   */
  public static getInstance(bot: Bot): IdleState {
    const botName = bot.getName();
    if (!IdleState.instances.has(botName)) {
      IdleState.instances.set(botName, new IdleState(bot));
    }
    return IdleState.instances.get(botName)!;
  }

  /**
   * 待機状態に入る際の処理
   */
  public async enter(): Promise<void> {
    console.log(`[${this.bot.getName()}] Entering Idle State.`);

    // 移動や攻撃などの現在の行動を停止
    if (this.bot.mc.pathfinder) {
      this.bot.mc.pathfinder.stop();
    }

    // プレイヤーに状態変更を通知
    this.bot.sendMessage("待機状態になりました。コマンドをお待ちしています。");
  }

  /**
   * 待機状態から出る際の処理
   */
  public exit(): void {
    console.log(`[${this.bot.getName()}] Exiting Idle State.`);
  }

  /**
   * 待機状態における定期実行処理
   * 現在は特に何もしない（将来的にヘルスチェックなどを追加可能）
   */
  public execute(): void {
    // 待機中は特別な処理を行わない
    // 将来的にここでヘルスチェックやアイドル時の自動行動を実装可能
  }

  /**
   * 状態の名前を取得
   * @returns 状態名
   */
  public getName(): string {
    return "Idle";
  }
}
