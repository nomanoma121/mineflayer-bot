import { IBotState } from "./IBotState";
import { Bot } from "../core/Bot";

/**
 * 待機状態クラス
 * ボットが何もしておらず、命令を待っている状態を表現
 * ステートパターンの具体的な実装
 */
export class IdleState implements IBotState {
  private static instance: IdleState | null = null;

  private constructor() {
    // プライベートコンストラクタでシングルトンパターンを実装
  }

  /**
   * IdleStateのシングルトンインスタンスを取得
   * @returns IdleStateのインスタンス
   */
  public static getInstance(): IdleState {
    if (!IdleState.instance) {
      IdleState.instance = new IdleState();
    }
    return IdleState.instance;
  }

  /**
   * 待機状態に入る際の処理
   * @param bot - ボットインスタンス
   */
  public enter(bot: Bot): void {
    console.log(`[${bot.getName()}] Entering Idle State.`);

    // 移動や攻撃などの現在の行動を停止
    if (bot.mc.pathfinder) {
      bot.mc.pathfinder.stop();
    }

    // プレイヤーに状態変更を通知
    bot.sendMessage("待機状態になりました。コマンドをお待ちしています。");
  }

  /**
   * 待機状態から出る際の処理
   * @param bot - ボットインスタンス
   */
  public exit(bot: Bot): void {
    console.log(`[${bot.getName()}] Exiting Idle State.`);
  }

  /**
   * 待機状態における定期実行処理
   * 現在は特に何もしない（将来的にヘルスチェックなどを追加可能）
   * @param bot - ボットインスタンス
   */
  public execute(bot: Bot): void {
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
