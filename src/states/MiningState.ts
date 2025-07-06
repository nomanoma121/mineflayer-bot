import { IBotState } from "./IBotState";
import { Bot } from "../core/Bot";
import { goals } from "mineflayer-pathfinder";
import { Vec3 } from "vec3";
import { Block } from "prismarine-block";

/**
 * 採掘状態クラス
 * 指定された範囲内での組織的な採掘作業を管理
 */
export class MiningState implements IBotState {
  private bot: Bot;
  private miningArea: { min: Vec3; max: Vec3 };
  private currentTarget: Vec3 | null = null;
  private currentTask: "moving" | "mining" | "depositing" | "placing_torch" = "moving";
  private miningPattern: Vec3[] = [];
  private currentPatternIndex: number = 0;
  private torchCounter: number = 0;
  private torchInterval: number = 8; // 8ブロックごとに松明設置
  private depositLocation: Vec3 | null = null;

  constructor(bot: Bot, corner1: Vec3, corner2: Vec3) {
    this.bot = bot;
    
    // 採掘エリアの最小・最大座標を計算
    this.miningArea = {
      min: new Vec3(
        Math.min(corner1.x, corner2.x),
        Math.min(corner1.y, corner2.y),
        Math.min(corner1.z, corner2.z)
      ),
      max: new Vec3(
        Math.max(corner1.x, corner2.x),
        Math.max(corner1.y, corner2.y),
        Math.max(corner1.z, corner2.z)
      )
    };
    
    this.generateMiningPattern();
    this.depositLocation = this.miningArea.min.clone().offset(0, 1, 0); // デフォルトの保管場所
  }

  /**
   * 採掘状態に入る際の初期化処理
   */
  public enter(): void {
    console.log(`[${this.bot.getName()}] Entering Mining state`);
    console.log(`[${this.bot.getName()}] Mining area: (${this.miningArea.min.x},${this.miningArea.min.y},${this.miningArea.min.z}) to (${this.miningArea.max.x},${this.miningArea.max.y},${this.miningArea.max.z})`);
    
    this.currentTask = "moving";
    this.setNextMiningTarget();
  }

  /**
   * 採掘状態から出る際の終了処理
   */
  public exit(): void {
    console.log(`[${this.bot.getName()}] Exiting Mining state`);
    
    // 移動を停止
    this.bot.mc.pathfinder.stop();
    this.currentTask = "moving";
    this.currentTarget = null;
  }

  /**
   * 採掘状態の定期実行処理
   */
  public execute(): void {
    // インベントリがいっぱいかチェック
    if (this.isInventoryFull() && this.currentTask !== "depositing") {
      this.currentTask = "depositing";
      this.moveToDepositLocation();
      return;
    }

    switch (this.currentTask) {
      case "moving":
        this.checkMovementProgress();
        break;
      case "mining":
        this.mineCurrentTarget();
        break;
      case "depositing":
        this.depositItems();
        break;
      case "placing_torch":
        this.placeTorch();
        break;
    }
  }

  /**
   * 状態の名前を取得
   */
  public getName(): string {
    return "Mining";
  }

  /**
   * 採掘状態では、インベントリ内で最も効率的なピッケルを推奨する
   * @returns 推奨装備のアイテム
   */
  public getRecommendedEquipment(): any | null {
    const tools = this.bot.mc.inventory.items().filter(item => {
      const itemName = item.name.toLowerCase();
      return itemName.includes('pickaxe') || 
             itemName.includes('shovel') ||
             itemName.includes('axe');
    });

    if (tools.length === 0) {
      return null;
    }

    // 採掘道具を効率順で並べ替え（優先度順）
    const toolPriority = [
      'netherite_pickaxe', 'diamond_pickaxe', 'iron_pickaxe', 'stone_pickaxe', 'golden_pickaxe', 'wooden_pickaxe',
      'netherite_shovel', 'diamond_shovel', 'iron_shovel', 'stone_shovel', 'golden_shovel', 'wooden_shovel',
      'netherite_axe', 'diamond_axe', 'iron_axe', 'stone_axe', 'golden_axe', 'wooden_axe'
    ];

    // 最も優先度の高い道具を探す
    for (const priorityTool of toolPriority) {
      const tool = tools.find(t => t.name.toLowerCase().includes(priorityTool));
      if (tool) {
        return tool;
      }
    }

    // 優先度にないものは最初に見つかった道具を返す
    return tools[0];
  }

  /**
   * 採掘パターンを生成
   */
  private generateMiningPattern(): void {
    this.miningPattern = [];
    
    // 層ごとに採掘パターンを生成（下から上へ）
    for (let y = this.miningArea.min.y; y <= this.miningArea.max.y; y++) {
      for (let x = this.miningArea.min.x; x <= this.miningArea.max.x; x++) {
        for (let z = this.miningArea.min.z; z <= this.miningArea.max.z; z++) {
          this.miningPattern.push(new Vec3(x, y, z));
        }
      }
    }
    
    console.log(`[${this.bot.getName()}] Generated mining pattern with ${this.miningPattern.length} blocks`);
  }

  /**
   * 次の採掘目標を設定
   */
  private setNextMiningTarget(): void {
    if (this.currentPatternIndex >= this.miningPattern.length) {
      console.log(`[${this.bot.getName()}] Mining completed!`);
      this.bot.sendMessage("採掘作業が完了しました。");
      this.bot.changeStateToIdle();
      return;
    }
    
    this.currentTarget = this.miningPattern[this.currentPatternIndex];
    this.currentPatternIndex++;
    
    console.log(`[${this.bot.getName()}] Next mining target: (${this.currentTarget.x}, ${this.currentTarget.y}, ${this.currentTarget.z})`);
    this.moveToTarget();
  }

  /**
   * 目標地点への移動
   */
  private moveToTarget(): void {
    if (!this.currentTarget) return;
    
    try {
      const goal = new goals.GoalNear(
        this.currentTarget.x,
        this.currentTarget.y,
        this.currentTarget.z,
        2
      );
      
      this.bot.mc.pathfinder.setGoal(goal);
      this.currentTask = "moving";
      console.log(`[${this.bot.getName()}] Moving to mining target`);
    } catch (error) {
      console.error(`[${this.bot.getName()}] Error moving to mining target:`, error);
      this.setNextMiningTarget();
    }
  }

  /**
   * 移動の進捗をチェック
   */
  private checkMovementProgress(): void {
    if (!this.currentTarget) {
      this.setNextMiningTarget();
      return;
    }

    const distance = this.bot.mc.entity.position.distanceTo(this.currentTarget);
    
    if (distance <= 3 || !this.bot.mc.pathfinder.isMoving()) {
      console.log(`[${this.bot.getName()}] Reached mining target, starting to mine`);
      this.currentTask = "mining";
    }
  }

  /**
   * 現在の目標を採掘
   */
  private async mineCurrentTarget(): Promise<void> {
    if (!this.currentTarget) {
      this.setNextMiningTarget();
      return;
    }

    try {
      const block = this.bot.mc.blockAt(this.currentTarget);
      
      if (block && block.name !== "air" && this.isMineable(block)) {
        // 適切なツールを装備
        await this.equipMiningTool(block);
        
        // ブロックを掘る
        await this.bot.mc.dig(block);
        console.log(`[${this.bot.getName()}] Mined ${block.name}`);
        
        // 松明を設置するかチェック
        this.torchCounter++;
        if (this.torchCounter >= this.torchInterval) {
          this.torchCounter = 0;
          this.currentTask = "placing_torch";
          return;
        }
      }
      
      // 次の目標に移動
      this.setNextMiningTarget();
    } catch (error) {
      console.error(`[${this.bot.getName()}] Error mining block:`, error);
      this.setNextMiningTarget();
    }
  }

  /**
   * アイテムを保管場所に預ける
   */
  private depositItems(): void {
    if (!this.depositLocation) {
      this.currentTask = "moving";
      this.setNextMiningTarget();
      return;
    }

    const distance = this.bot.mc.entity.position.distanceTo(this.depositLocation);
    
    if (distance > 5) {
      // 保管場所への移動
      const goal = new goals.GoalNear(
        this.depositLocation.x,
        this.depositLocation.y,
        this.depositLocation.z,
        2
      );
      this.bot.mc.pathfinder.setGoal(goal);
    } else {
      // アイテムを投下
      this.dropValuableItems();
      this.currentTask = "moving";
      this.setNextMiningTarget();
    }
  }

  /**
   * 松明を設置
   */
  private async placeTorch(): Promise<void> {
    try {
      const torch = this.bot.mc.inventory.items().find(item => item.name === "torch");
      
      if (torch && this.currentTarget) {
        await this.bot.mc.equip(torch, "hand");
        
        // 壁や床に松明を設置
        const placePosition = this.findTorchPlacePosition();
        if (placePosition) {
          const referenceBlock = this.bot.mc.blockAt(placePosition);
          if (referenceBlock) {
            await this.bot.mc.placeBlock(referenceBlock, new Vec3(0, 1, 0));
            console.log(`[${this.bot.getName()}] Placed torch`);
          }
        }
      }
    } catch (error) {
      console.error(`[${this.bot.getName()}] Error placing torch:`, error);
    }
    
    // 採掘作業を続行
    this.currentTask = "moving";
    this.setNextMiningTarget();
  }

  /**
   * 適切な採掘ツールを装備
   */
  private async equipMiningTool(block: Block): Promise<void> {
    const tools = this.getBestToolsForBlock(block);
    
    for (const toolName of tools) {
      const tool = this.bot.mc.inventory.items().find(item => item.name === toolName);
      if (tool) {
        await this.bot.mc.equip(tool, "hand");
        return;
      }
    }
  }

  /**
   * ブロックに最適なツールを取得
   */
  private getBestToolsForBlock(block: Block): string[] {
    const blockName = block.name;
    
    if (blockName.includes("stone") || blockName.includes("ore")) {
      return ["diamond_pickaxe", "iron_pickaxe", "stone_pickaxe", "wooden_pickaxe"];
    } else if (blockName.includes("dirt") || blockName.includes("sand")) {
      return ["diamond_shovel", "iron_shovel", "stone_shovel", "wooden_shovel"];
    } else {
      return ["diamond_pickaxe", "iron_pickaxe", "stone_pickaxe", "wooden_pickaxe"];
    }
  }

  /**
   * ブロックが採掘可能かチェック
   */
  private isMineable(block: Block): boolean {
    const nonMineableBlocks = ["air", "water", "lava", "bedrock"];
    return !nonMineableBlocks.includes(block.name);
  }

  /**
   * 松明を設置する位置を探す
   */
  private findTorchPlacePosition(): Vec3 | null {
    if (!this.currentTarget) return null;
    
    // 現在の位置の足元に設置
    return this.currentTarget.clone().offset(0, -1, 0);
  }

  /**
   * 貴重なアイテムを投下
   */
  private dropValuableItems(): void {
    const valuableItems = [
      "diamond", "emerald", "iron_ingot", "gold_ingot",
      "coal", "redstone", "lapis_lazuli"
    ];
    
    for (const item of this.bot.mc.inventory.items()) {
      if (valuableItems.includes(item.name)) {
        this.bot.mc.toss(item.type, null, item.count);
        console.log(`[${this.bot.getName()}] Dropped ${item.count} ${item.name}`);
      }
    }
  }

  /**
   * 保管場所への移動
   */
  private moveToDepositLocation(): void {
    if (!this.depositLocation) return;
    
    const goal = new goals.GoalNear(
      this.depositLocation.x,
      this.depositLocation.y,
      this.depositLocation.z,
      2
    );
    this.bot.mc.pathfinder.setGoal(goal);
  }

  /**
   * インベントリが満杯かチェック
   */
  private isInventoryFull(): boolean {
    return this.bot.mc.inventory.emptySlotCount() <= 2; // 余裕を持って2スロット残す
  }
}
