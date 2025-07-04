import { Bot as MineflayerBot, createBot } from "mineflayer";
import { pathfinder, Movements } from "mineflayer-pathfinder";
import { IBotState } from "../states/IBotState";
import { IdleState } from "../states/IdleState";

/**
 * ボットの設定オプション
 */
export interface BotOptions {
  host: string;
  port: number;
  username: string;
  auth: "offline" | "microsoft";
  version: string;
}

/**
 * ボットのコアクラス
 * ステートパターンとシングルトンパターンの要素を組み合わせ、
 * ボットの状態管理とライフサイクルを統一的に管理
 */
export class Bot {
  public readonly mc: MineflayerBot;
  private currentState: IBotState | null = null;
  private readonly options: BotOptions;

  constructor(options: BotOptions) {
    this.options = options;

    // mineflayerインスタンスを作成
    this.mc = createBot({
      host: options.host,
      port: options.port,
      username: options.username,
      auth: options.auth,
      version: options.version,
    });

    // pathfinderプラグインをロード
    this.mc.loadPlugin(pathfinder);

    // 基本的なイベントリスナーを設定
    this.setupEventListeners();
  }

  /**
   * 基本的なイベントリスナーを設定
   */
  private setupEventListeners(): void {
    this.mc.on("login", () => {
      console.log(`Bot ${this.options.username} has logged in.`);
    });

    this.mc.on("error", (err) => {
      console.error(`Bot ${this.options.username} encountered an error:`, err);
    });

    this.mc.on("end", (reason) => {
      console.log(`Bot ${this.options.username} disconnected: ${reason}`);
    });

    this.mc.on("kicked", (reason) => {
      console.log(`Bot ${this.options.username} was kicked: ${reason}`);
    });

    this.mc.on("spawn", () => {
      console.log(`Bot ${this.options.username} spawned in the world.`);

      // パスファインダーの設定
      const mcData = require('minecraft-data')(this.mc.version);
      const defaultMove = new Movements(this.mc);
      this.mc.pathfinder.setMovements(defaultMove);
      
      // 初期状態を「待機」に設定
      this.changeState(IdleState.getInstance());
      
      // 0.1秒ごとに現在の状態のexecuteメソッドを実行するメインループを開始
      setInterval(() => {
        if (this.currentState) {
          this.currentState.execute(this);
        }
      }, 100);
    });
  }

  /**
   * 現在の状態を取得
   * @returns IBotState | null - 現在の状態
   */
  public getCurrentState(): IBotState | null {
    return this.currentState;
  }

  /**
   * 状態を変更
   * ステートパターンの実装により、状態の遷移を安全に管理
   * @param newState - 新しい状態
   */
  public changeState(newState: IBotState): void {
    try {
      // 現在の状態を終了
      if (this.currentState) {
        console.log(`Exiting state: ${this.currentState.getName()}`);
        this.currentState.exit(this);
      }

      // 新しい状態に遷移
      this.currentState = newState;
      console.log(`Entering state: ${this.currentState.getName()}`);
      this.currentState.enter(this);
    } catch (error) {
      console.error("Error during state transition:", error);
      this.sendMessage("状態の変更中にエラーが発生しました。");
    }
  }

  /**
   * ボットを待機状態に遷移させるヘルパーメソッド
   */
  public changeStateToIdle(): void {
    this.changeState(IdleState.getInstance());
  }

  /**
   * サーバーへの接続を開始
   */
  public connect(): void {
    console.log(
      `Connecting bot ${this.options.username} to ${this.options.host}:${this.options.port}`
    );
    // mineflayerのcreateBotは自動的に接続を開始します
  }

  /**
   * チャットメッセージを送信
   * @param message - 送信するメッセージ
   */
  public sendMessage(message: string): void {
    try {
      this.mc.chat(message);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }

  /**
   * 現在の位置を取得
   * @returns 現在の位置情報
   */
  public getPosition(): { x: number; y: number; z: number } {
    const pos = this.mc.entity.position;
    return {
      x: Math.floor(pos.x),
      y: Math.floor(pos.y),
      z: Math.floor(pos.z),
    };
  }

  /**
   * ボットの名前を取得
   * @returns ボットの名前
   */
  public getName(): string {
    return this.options.username;
  }

  /**
   * ボットのインベントリ情報を取得
   * @returns インベントリ情報
   */
  public getInventory(): any[] {
    return this.mc.inventory.items();
  }

  /**
   * 現在の状態を定期的に実行
   * メインループで呼び出されることを想定
   */
  public update(): void {
    if (this.currentState) {
      this.currentState.execute(this);
    }
  }
}
