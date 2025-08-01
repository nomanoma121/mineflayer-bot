import { Bot as MineflayerBot, createBot } from "mineflayer";
import { pathfinder, Movements } from "mineflayer-pathfinder";
import { IBotState } from "../states/IBotState";
import { IdleState } from "../states/IdleState";
import mcData from "minecraft-data";
import { Item } from "prismarine-item";
import { AbilityManager } from "../abilities/AbilityManager";
import { VitalsAbility } from "../abilities/VitalsAbility";
import { SensingAbility } from "../abilities/SensingAbility";
import { InventoryAbility } from "../abilities/InventoryAbility";
import { SayAbility } from "../abilities/SayAbility";
import { ConfigManager, BotConfig } from "../config/ConfigManager";
import { Logger } from "../utils/Logger";

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
  private readonly config: BotConfig;
  private mainLoopStarted: boolean = false;
  private isEating: boolean = false;
  private hungerNotificationSent: boolean = false;
  private mcData: mcData.IndexedData;
  private abilityManager: AbilityManager;
  private logger: typeof Logger;

  constructor(options: BotOptions, configManager?: ConfigManager) {
    this.options = options;
    this.config = configManager?.getConfig() || new ConfigManager().getConfig();
    this.logger = Logger;

    // ロガーの初期化
    Logger.bot.connected(options.host, options.port, options.username);

    // mineflayerインスタンスを作成
    this.mc = createBot({
      host: options.host,
      port: options.port,
      username: options.username,
      auth: options.auth,
      version: options.version,
    });

    // minecraft-dataを初期化
    this.mcData = mcData(this.mc.version);

    // pathfinderプラグインをロード
    this.mc.loadPlugin(pathfinder);

    // アビリティマネージャーを初期化
    this.abilityManager = new AbilityManager();
    this.abilityManager.initialize(this);

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

    this.mc.on("spawn", async () => {
      console.log(`Bot ${this.options.username} spawned in the world.`);

      // パスファインダーの設定
      const defaultMove = new Movements(this.mc);
      
      // 移動速度を向上させる設定
      defaultMove.allowFreeMotion = true; // 自由な動きを許可
      defaultMove.allowSprinting = true; // スプリント許可
      
      this.mc.pathfinder.setMovements(defaultMove);
      
      // 初期状態を「待機」に設定
      await this.changeState(IdleState.getInstance(this));
      console.log(`Bot ${this.options.username} spawned. Setting initial state to Idle.`);
      
      // メインループが既に開始されていない場合のみ開始
      if (!this.mainLoopStarted) {
        // 0.1秒ごとに現在の状態のexecuteメソッドを実行するメインループを開始
        setInterval(() => {
          if (this.currentState) {
            this.currentState.execute();
          }
          // 自動食事チェック
          this.checkAndEat();
        }, 100);
        this.mainLoopStarted = true;
      }
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
  public async changeState(newState: IBotState): Promise<void> {
    try {
      // 現在の状態を終了
      if (this.currentState) {
        console.log(`Exiting state: ${this.currentState.getName()}`);
        this.currentState.exit();
      }

      // 新しい状態に遷移
      this.currentState = newState;
      console.log(`Entering state: ${this.currentState.getName()}`);
      await this.currentState.enter();
    } catch (error) {
      console.error("Error during state transition:", error);
      this.sendMessage("状態の変更中にエラーが発生しました。");
    }
  }

  /**
   * ボットを待機状態に遷移させるヘルパーメソッド
   */
  public async changeStateToIdle(): Promise<void> {
    await this.changeState(IdleState.getInstance(this));
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
      this.currentState.execute();
    }
  }

  /**
   * ボットの空腹状態をチェックし、必要に応じて自動で食事を行う
   */
  private async checkAndEat(): Promise<void> {
    try {
      // 実行条件: 食事中でない、かつ空腹度が17以下
      if (this.isEating || this.mc.food > 17) {
        // 空腹度が改善されたら通知フラグをリセット
        if (this.mc.food > 17) {
          this.hungerNotificationSent = false;
        }
        return;
      }

      // インベントリから食べ物を検索（minecraft-dataを使用）
      const food = this.mc.inventory.items().find(item => {
        return this.mcData.foods[item.type] !== undefined;
      });

      if (!food) {
        // 食べ物がない場合、一度だけ通知
        if (!this.hungerNotificationSent) {
          this.sendMessage("お腹が減りましたが、食べ物がありません！");
          this.hungerNotificationSent = true;
        }
        return;
      }

      // 食事処理開始
      this.isEating = true;
      const foodData = this.mcData.foods[food.type];
      console.log(`[${this.getName()}] 空腹度: ${this.mc.food}/20 - ${food.displayName}を食べます（回復量: ${foodData.foodPoints}）`);

      // 食事前の装備を記憶
      const previouslyEquipped = this.mc.heldItem;

      try {
        // 食べ物を手に持つ
        await this.mc.equip(food, 'hand');
        
        // 食事を実行
        await this.mc.consume();
        
        console.log(`[${this.getName()}] ${food.displayName}を食べました。空腹度: ${this.mc.food}/20`);
        
      } catch (error) {
        console.error(`[${this.getName()}] 食事中にエラーが発生しました:`, error);
      } finally {
        // 装備の復元
        await this.restoreEquipment(previouslyEquipped);
        
        // 食事状態をリセット
        this.isEating = false;
      }
    } catch (error) {
      console.error(`[${this.getName()}] checkAndEat()でエラーが発生しました:`, error);
      this.isEating = false;
    }
  }

  /**
   * 食事後の装備復元を行う
   * @param previouslyEquipped - 食事前に装備していたアイテム
   */
  private async restoreEquipment(previouslyEquipped: Item | null): Promise<void> {
    try {
      // 現在のStateに推奨装備メソッドが実装されているか確認
      if (this.currentState && this.currentState.getRecommendedEquipment) {
        const recommendedItem = this.currentState.getRecommendedEquipment();
        if (recommendedItem) {
          await this.mc.equip(recommendedItem, 'hand');
          console.log(`[${this.getName()}] 推奨装備 ${recommendedItem.displayName} を装備しました`);
          return;
        }
      }

      // 推奨装備がない場合、食事前の装備を復元
      if (previouslyEquipped) {
        await this.mc.equip(previouslyEquipped, 'hand');
        console.log(`[${this.getName()}] 食事前の装備 ${previouslyEquipped.displayName} を復元しました`);
      }
    } catch (error) {
      console.error(`[${this.getName()}] 装備復元中にエラーが発生しました:`, error);
    }
  }

  /**
   * アビリティマネージャーを取得
   * @returns アビリティマネージャー
   */
  public getAbilityManager(): AbilityManager {
    return this.abilityManager;
  }

  /**
   * Vitalsアビリティを取得
   * @returns Vitalsアビリティ
   */
  public get vitals(): VitalsAbility {
    return this.abilityManager.vitals;
  }

  /**
   * Sensingアビリティを取得
   * @returns Sensingアビリティ
   */
  public get sensing(): SensingAbility {
    return this.abilityManager.sensing;
  }

  /**
   * Inventoryアビリティを取得
   * @returns Inventoryアビリティ
   */
  public get inventory(): InventoryAbility {
    return this.abilityManager.inventory;
  }

  /**
   * Sayアビリティを取得
   * @returns Sayアビリティ
   */
  public get say(): SayAbility {
    return this.abilityManager.say;
  }

  /**
   * アビリティシステムの状態を確認
   * @returns アビリティシステムの診断結果
   */
  public diagnoseAbilities(): ReturnType<AbilityManager["diagnose"]> {
    return this.abilityManager.diagnose();
  }

  /**
   * 緊急時対応を実行
   * @returns 緊急時対応の結果
   */
  public async handleEmergency(): Promise<ReturnType<AbilityManager["handleEmergency"]>> {
    return await this.abilityManager.handleEmergency();
  }

  /**
   * 指定した座標に移動する
   * @param x - X座標
   * @param y - Y座標
   * @param z - Z座標
   */
  public async goto(x: number, y: number, z: number): Promise<void> {
    const { goals } = await import('mineflayer-pathfinder');
    const goal = new goals.GoalBlock(x, y, z);
    
    await this.mc.pathfinder.goto(goal);
  }
}
