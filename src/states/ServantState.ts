import { IBotState } from "./IBotState";
import { Bot } from "../core/Bot";
import { goals } from "mineflayer-pathfinder";
import { Entity } from "prismarine-entity";

/**
 * サーバント状態クラス
 * 指定されたマスターを追従し、マスターまたはボット自身が攻撃された場合に自動で反撃する
 */
export class ServantState implements IBotState {
  private bot: Bot;
  private masterName: string;
  private isEngaging: boolean = false;
  private currentTarget: Entity | null = null;
  private onEntityHurtBound: (entity: Entity, attacker: Entity | null) => void;

  constructor(bot: Bot, masterName: string) {
    this.bot = bot;
    this.masterName = masterName;
    // メソッドをバインドしてイベントリスナーの登録・解除を正確に行う
    this.onEntityHurtBound = this.onEntityHurt.bind(this);
  }

  /**
   * サーバント状態に入る際の初期化処理
   */
  public enter(): void {
    console.log(`[${this.bot.getName()}] Entering Servant state. Master: ${this.masterName}`);
    
    // 戦闘フラグを初期化
    this.isEngaging = false;
    this.currentTarget = null;
    
    // マスターの追従を開始
    this.startFollowingMaster();
    
    // ダメージ監視用のイベントリスナーを登録
    this.bot.mc.on('entityHurt', this.onEntityHurtBound);
    
    console.log(`[${this.bot.getName()}] Started following master: ${this.masterName}`);
  }

  /**
   * サーバント状態から出る際の終了処理
   */
  public exit(): void {
    console.log(`[${this.bot.getName()}] Exiting Servant state`);
    
    // 【最重要】entityHurtイベントリスナーを解除
    this.bot.mc.removeListener('entityHurt', this.onEntityHurtBound);
    
    // 全ての移動を停止
    this.bot.mc.pathfinder.stop();
    
    // 状態をリセット
    this.isEngaging = false;
    this.currentTarget = null;
  }

  /**
   * サーバント状態の定期実行処理
   */
  public execute(): void {
    if (this.isEngaging && this.currentTarget) {
      // 戦闘中の場合、ターゲットの状態をチェック
      if (this.shouldStopEngaging()) {
        this.stopEngaging();
        this.startFollowingMaster();
      } else {
        // ターゲットを攻撃
        this.attackTarget();
      }
    } else {
      // 非戦闘時はマスターの追従を継続
      this.maintainFollowing();
    }
  }

  /**
   * 状態の名前を取得
   */
  public getName(): string {
    return "Servant";
  }

  /**
   * マスターの追従を開始
   */
  private startFollowingMaster(): void {
    const master = this.bot.mc.players[this.masterName];
    if (master && master.entity) {
      const goal = new goals.GoalFollow(master.entity, 2);
      this.bot.mc.pathfinder.setGoal(goal);
    }
  }

  /**
   * 追従の維持（マスターが移動した場合の対応）
   */
  private maintainFollowing(): void {
    if (this.isEngaging) return;
    
    const master = this.bot.mc.players[this.masterName];
    if (master && master.entity) {
      const distance = this.bot.mc.entity.position.distanceTo(master.entity.position);
      
      // マスターが遠くにいる場合、追従を再開
      if (distance > 5) {
        this.startFollowingMaster();
      }
    }
  }

  /**
   * エンティティダメージイベントハンドラー
   */
  private onEntityHurt(entity: Entity, attacker: Entity | null): void {
    if (!attacker || this.isEngaging) return;

    const isBotHurt = entity.id === this.bot.mc.entity.id;
    const isMasterHurt = entity.username === this.masterName;

    if (isBotHurt || isMasterHurt) {
      console.log(`[${this.bot.getName()}] ${isBotHurt ? 'Bot' : 'Master'} was attacked by ${attacker.username || attacker.name || 'unknown entity'}`);
      
      // 攻撃者を反撃対象に設定
      this.startEngaging(attacker);
    }
  }

  /**
   * 戦闘開始
   */
  private startEngaging(target: Entity): void {
    this.isEngaging = true;
    this.currentTarget = target;
    
    console.log(`[${this.bot.getName()}] Starting combat with ${target.username || target.name || 'unknown entity'}`);
    
    // 攻撃対象への移動を開始
    const goal = new goals.GoalNear(target.position.x, target.position.y, target.position.z, 1);
    this.bot.mc.pathfinder.setGoal(goal);
  }

  /**
   * 戦闘終了の判定
   */
  private shouldStopEngaging(): boolean {
    if (!this.currentTarget) return true;
    
    // ターゲットが死亡している場合
    if (this.currentTarget.isValid === false) {
      console.log(`[${this.bot.getName()}] Target is no longer valid (dead)`);
      return true;
    }
    
    // ターゲットが遠くに離れた場合（50ブロック以上）
    const distance = this.bot.mc.entity.position.distanceTo(this.currentTarget.position);
    if (distance > 50) {
      console.log(`[${this.bot.getName()}] Target is too far away (${distance.toFixed(2)} blocks)`);
      return true;
    }
    
    return false;
  }

  /**
   * 戦闘終了処理
   */
  private stopEngaging(): void {
    console.log(`[${this.bot.getName()}] Stopping combat, returning to follow master`);
    
    this.isEngaging = false;
    this.currentTarget = null;
    
    // パスファインダーを停止
    this.bot.mc.pathfinder.stop();
  }

  /**
   * ターゲットを攻撃
   */
  private attackTarget(): void {
    if (!this.currentTarget) return;
    
    const distance = this.bot.mc.entity.position.distanceTo(this.currentTarget.position);
    
    // 攻撃範囲内（3ブロック以内）にいる場合
    if (distance <= 3) {
      try {
        this.bot.mc.attack(this.currentTarget);
        console.log(`[${this.bot.getName()}] Attacking target at distance ${distance.toFixed(2)}`);
      } catch (error) {
        console.error(`[${this.bot.getName()}] Error attacking target:`, error);
      }
    } else {
      // 攻撃範囲外の場合、ターゲットに近づく
      const goal = new goals.GoalNear(this.currentTarget.position.x, this.currentTarget.position.y, this.currentTarget.position.z, 1);
      this.bot.mc.pathfinder.setGoal(goal);
    }
  }
}
