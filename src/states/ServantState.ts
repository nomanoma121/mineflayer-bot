import { IBotState } from "./IBotState";
import { Bot } from "../core/Bot";
import { goals } from "mineflayer-pathfinder";
import { Entity } from "prismarine-entity";
import { AttackingState } from "./AttackingState";

/**
 * サーバント状態クラス
 * 指定されたマスターを追従し、脅威を検出してAttackingStateに委譲する
 *
 * 敵対Mob判定にはMineflayerのentity.kindプロパティを使用し、
 * bot.mc.nearestEntity()を活用して効率的な索敵を行う
 */
export class ServantState implements IBotState {
  private bot: Bot;
  private masterName: string;
  private onEntityHurtBound: (entity: Entity, attacker: Entity | null) => void;
  private threatCheckInterval: NodeJS.Timeout | null = null;
  private readonly hostileDetectionRange: number = 10; // 敵対モブ検出範囲（ブロック数）
  private readonly hostileCheckInterval: number = 500; // 0.5秒間隔で敵対モブをチェック
  private readonly nightHuntingRange: number = 15; // 夜間の狩猟範囲（より広範囲）

  constructor(bot: Bot, masterName: string) {
    this.bot = bot;
    this.masterName = masterName;
    // メソッドをバインドしてイベントリスナーの登録・解除を正確に行う
    this.onEntityHurtBound = this.onEntityHurt.bind(this);
  }

  /**
   * サーバント状態に入る際の初期化処理
   */
  public async enter(): Promise<void> {
    console.log(
      `[${this.bot.getName()}] Entering Servant state. Master: ${
        this.masterName
      }`
    );

    // マスターの追従を開始
    this.startFollowingMaster();

    // ダメージ監視用のイベントリスナーを登録
    this.bot.mc.on("entityHurt", this.onEntityHurtBound);

    // 脅威チェック間隔を設定
    this.threatCheckInterval = setInterval(() => {
      this.checkForThreats();
    }, this.hostileCheckInterval);

    console.log(
      `[${this.bot.getName()}] Started following master: ${this.masterName}`
    );
  }

  /**
   * サーバント状態から出る際の終了処理
   */
  public exit(): void {
    console.log(`[${this.bot.getName()}] Exiting Servant state`);

    // 【最重要】entityHurtイベントリスナーを解除
    this.bot.mc.removeListener("entityHurt", this.onEntityHurtBound);

    // 脅威チェック間隔をクリア
    if (this.threatCheckInterval) {
      clearInterval(this.threatCheckInterval);
      this.threatCheckInterval = null;
    }

    // pathfinderの移動を停止
    if (this.bot.mc.pathfinder) {
      this.bot.mc.pathfinder.stop();
    }

    // 手動制御状態もクリア
    this.bot.mc.setControlState("forward", false);
    this.bot.mc.setControlState("sprint", false);
  }

  /**
   * サーバント状態の定期実行処理
   */
  public execute(): void {
    // 基本的にはマスターの追従のみ実行
    // 脅威チェックは間隔で実行
    this.maintainFollowing();
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
      const distance = this.bot.mc.entity.position.distanceTo(
        master.entity.position
      );
      console.log(
        `[${this.bot.getName()}] Starting to follow master ${
          this.masterName
        } at distance ${distance.toFixed(1)}`
      );

      const goal = new goals.GoalFollow(master.entity, 2);
      this.bot.mc.pathfinder.setGoal(goal, true);

      // pathfinderの状態を確認
      setTimeout(() => {
        const isMoving = this.bot.mc.pathfinder.isMoving();
        console.log(
          `[${this.bot.getName()}] Pathfinder is moving: ${isMoving}`
        );
      }, 100);
    }
  }

  /**
   * 追従の維持（マスターが移動した場合の対応）
   */
  private maintainFollowing(): void {
    const master = this.bot.mc.players[this.masterName];
    if (!master || !master.entity) {
      console.log(
        `[${this.bot.getName()}] Master ${this.masterName} is not available`
      );
      return;
    }

    // pathfinderが動いていない場合は追従を再開
    if (!this.bot.mc.pathfinder.isMoving()) {
      this.startFollowingMaster();
    }
  }

  /**
   * 脅威をチェックして戦闘を開始
   */
  private checkForThreats(): void {
    console.log(`[${this.bot.getName()}] Checking for threats...`);

    // 近くの敵対モブを検索（最適化されたnearestEntityを使用）
    const hostileMob = this.findNearestHostileMob();
    if (hostileMob) {
      const distance = this.bot.mc.entity.position.distanceTo(
        hostileMob.position
      );
      const mobName = hostileMob.name || hostileMob.type || "unknown";
      const mobKind = hostileMob.kind || "unknown kind";
      console.log(
        `[${this.bot.getName()}] Found hostile mob: ${mobName} (${mobKind}) at distance ${distance.toFixed(
          1
        )} blocks`
      );

      // AttackingStateに委譲
      this.delegateToAttackingState(hostileMob);
    } else {
      console.log(
        `[${this.bot.getName()}] No threats detected in current scan`
      );
    }
  }

  /**
   * エンティティダメージイベントハンドラー
   */
  private onEntityHurt(entity: Entity, attacker: Entity | null): void {
    if (!attacker) return;

    const isBotHurt = entity.id === this.bot.mc.entity.id;
    const isMasterHurt = entity.username === this.masterName;

    if (isBotHurt || isMasterHurt) {
      console.log(
        `[${this.bot.getName()}] ${
          isBotHurt ? "Bot" : "Master"
        } was attacked by ${
          attacker.username || attacker.name || "unknown entity"
        }`
      );

      // 攻撃者をAttackingStateに委譲
      this.delegateToAttackingState(attacker);
    }
  }

  /**
   * 戦闘をAttackingStateに委譲
   */
  private delegateToAttackingState(target: Entity): void {
    const targetName =
      target.username || target.name || target.type || "unknown entity";
    console.log(
      `[${this.bot.getName()}] Delegating combat with ${targetName} to AttackingState`
    );

    // 現在の状態（this）を親状態として設定
    const attackingState = new AttackingState(this.bot, target, this);
    this.bot.changeState(attackingState).catch(error => {
      console.error(`[${this.bot.getName()}] Error changing to attacking state:`, error);
    });
  }

  /**
   * 最も近い敵対モブを見つける
   */
  private findNearestHostileMob(): Entity | null {
    // 夜間や危険度に応じて検出範囲を調整
    const detectionRange = this.isNightTime()
      ? this.nightHuntingRange
      : this.hostileDetectionRange;

    console.log(
      `[${this.bot.getName()}] Searching for hostile mobs in range: ${detectionRange} blocks`
    );

    // nearestEntityを使用して最適化された検索
    const hostileMob = this.bot.mc.nearestEntity((entity) => {
      if (!entity || !entity.position || !entity.isValid) return false;

      // 距離チェック
      const distance = this.bot.mc.entity.position.distanceTo(entity.position);
      if (distance > detectionRange) return false;

      // 敵対モブかどうかチェック
      const isHostile = this.isHostileMob(entity);
      if (isHostile) {
        console.log(
          `[${this.bot.getName()}] Found hostile entity: ${
            entity.type || entity.name
          } at distance ${distance.toFixed(1)}`
        );
      }

      return isHostile;
    });

    if (hostileMob) {
      console.log(
        `[${this.bot.getName()}] Selected hostile mob: ${
          hostileMob.type || hostileMob.name
        }`
      );
    } else {
      console.log(`[${this.bot.getName()}] No hostile mobs found in range`);
    }

    return hostileMob || null;
  }

  /**
   * 夜間かどうかを判定
   */
  private isNightTime(): boolean {
    const timeOfDay = this.bot.mc.time.timeOfDay;
    const isNight = timeOfDay >= 13000 && timeOfDay <= 23000;

    return isNight;
  }

  /**
   * エンティティが敵対モブかどうかを判定
   * Mineflayerのkindプロパティを使用してシンプルかつ確実に判定
   */
  private isHostileMob(entity: Entity): boolean {
    return entity.kind === "Hostile mobs";
  }
}
