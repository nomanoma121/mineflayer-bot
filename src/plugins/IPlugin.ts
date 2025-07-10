import { Bot } from "../core/Bot";

/**
 * プラグインのメタデータ
 */
export interface PluginMetadata {
  name: string;
  version: string;
  description: string;
  author?: string;
  dependencies?: string[];
  permissions?: string[];
}

/**
 * プラグインのインターフェース
 * 拡張可能なモジュラーシステムの基盤
 */
export interface IPlugin {
  /**
   * プラグインのメタデータを取得
   */
  getMetadata(): PluginMetadata;

  /**
   * プラグインを初期化
   * @param bot ボットインスタンス
   */
  initialize(bot: Bot): Promise<void> | void;

  /**
   * プラグインを有効化
   */
  enable(): Promise<void> | void;

  /**
   * プラグインを無効化
   */
  disable(): Promise<void> | void;

  /**
   * プラグインが有効かどうか
   */
  isEnabled(): boolean;

  /**
   * プラグインの設定を取得
   */
  getConfig?(): any;

  /**
   * プラグインの設定を更新
   */
  updateConfig?(config: any): void;

  /**
   * プラグインのイベントハンドラーを登録
   */
  registerEventHandlers?(): void;

  /**
   * プラグインのクリーンアップ処理
   */
  cleanup?(): Promise<void> | void;
}