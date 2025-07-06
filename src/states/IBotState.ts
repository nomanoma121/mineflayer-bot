import { Bot } from "../core/Bot";
import { Item } from "prismarine-item";

/**
 * ボットの状態を表すインターフェース
 * ステートパターンの実装により、ボットの動作を状態ごとに管理
 */
export interface IBotState {
  /**
   * 状態に入る際に呼ばれる初期化メソッド
   */
  enter(): void;

  /**
   * 状態から出る際に呼ばれる終了処理メソッド
   */
  exit(): void;

  /**
   * 状態における定期的な処理を実行するメソッド
   */
  execute(): void;

  /**
   * 状態の名前を返すメソッド
   * デバッグやログ出力に使用
   */
  getName(): string;

  /**
   * この状態でボットが優先的に装備すべきアイテムを返す（オプショナル）
   * @returns 装備すべきItemオブジェクト、または何もなければnull
   */
  getRecommendedEquipment?(): Item | null;
}
