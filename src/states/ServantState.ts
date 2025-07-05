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
  private lastTargetPosition: { x: number; y: number; z: number } | null = null;
  private readonly positionUpdateThreshold: number = 3; // 3ブロック以上移動したら目標を更新
  private lastAttackTime: number = 0;
  private readonly attackCooldown: number = 600; // 0.6秒間隔で攻撃

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
    
    // pathfinderの移動を停止
    if (this.bot.mc.pathfinder) {
      this.bot.mc.pathfinder.stop();
    }
    
    // 手動制御状態もクリア
    this.bot.mc.setControlState('forward', false);
    this.bot.mc.setControlState('sprint', false);
    
    // 状態をリセット
    this.isEngaging = false;
    this.currentTarget = null;
    this.lastTargetPosition = null;
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
      this.bot.mc.pathfinder.setGoal(goal, true);
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
    
    // 初期ターゲット位置を記録
    this.updateLastTargetPosition();
    
    // 攻撃対象への移動を開始
    const goal = new goals.GoalNear(target.position.x, target.position.y, target.position.z, 2);
    this.bot.mc.pathfinder.setGoal(goal, true);
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
    this.lastTargetPosition = null;
    
    // pathfinderを停止
    if (this.bot.mc.pathfinder) {
      this.bot.mc.pathfinder.stop();
    }
  }

  /**
   * ターゲットを攻撃
   */
  private attackTarget(): void {
    if (!this.currentTarget) return;
    
    const distance = this.bot.mc.entity.position.distanceTo(this.currentTarget.position);
    
    if (distance > 4) {
      // 距離が遠い場合はpathfinderを使って近づく
      // ターゲットの位置が大きく変わった場合は目標を更新
      const shouldUpdateGoal = !this.bot.mc.pathfinder.isMoving() || this.hasTargetMovedSignificantly();
      
      if (shouldUpdateGoal) {
        const goal = new goals.GoalNear(
          this.currentTarget.position.x,
          this.currentTarget.position.y,
          this.currentTarget.position.z,
          2 // 2ブロック以内に近づく
        );
        this.bot.mc.pathfinder.setGoal(goal, true);
        this.updateLastTargetPosition();
      }
    } else {
      // 攻撃範囲内の場合は移動を停止して攻撃
      if (this.bot.mc.pathfinder.isMoving()) {
        this.bot.mc.pathfinder.stop();
      }
      
      // 攻撃実行
      this.performAttack();
    }
  }

  /**
   * ターゲットが大きく移動したかを判定
   */
  private hasTargetMovedSignificantly(): boolean {
    if (!this.lastTargetPosition || !this.currentTarget?.position) {
      return true;
    }
    
    const distance = Math.sqrt(
      Math.pow(this.currentTarget.position.x - this.lastTargetPosition.x, 2) +
      Math.pow(this.currentTarget.position.y - this.lastTargetPosition.y, 2) +
      Math.pow(this.currentTarget.position.z - this.lastTargetPosition.z, 2)
    );
    
    return distance > this.positionUpdateThreshold;
  }

  /**
   * 最後のターゲット位置を更新
   */
  private updateLastTargetPosition(): void {
    if (this.currentTarget?.position) {
      this.lastTargetPosition = {
        x: this.currentTarget.position.x,
        y: this.currentTarget.position.y,
        z: this.currentTarget.position.z
      };
    }
  }

  /**
   * 攻撃を実行
   */
  private performAttack(): void {
    const now = Date.now();
    if (now - this.lastAttackTime < this.attackCooldown) {
      return; // クールダウン中
    }

    if (this.currentTarget && this.currentTarget.isValid) {
      const distance = this.bot.mc.entity.position.distanceTo(this.currentTarget.position);
      if (distance <= 4) {
        try {
          // ターゲットを見つめる
          this.bot.mc.lookAt(this.currentTarget.position.offset(0, this.currentTarget.height, 0));
          
          // 攻撃を実行
          this.bot.mc.attack(this.currentTarget);
          this.lastAttackTime = now;
          console.log(`[${this.bot.getName()}] Attacking ${this.currentTarget.username || this.currentTarget.name || 'unknown'}`);
        } catch (error) {
          console.error(`[${this.bot.getName()}] Error attacking target:`, error);
        }
      }
    }
  }
}
