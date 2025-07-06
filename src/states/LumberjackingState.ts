import { IBotState } from "./IBotState";
import { Bot } from "../core/Bot";
import { goals } from "mineflayer-pathfinder";
import { Vec3 } from "vec3";
import { Block } from "prismarine-block";

/**
 * 木こり状態クラス
 * 木を探す→移動→伐採→苗木を植える→次の木を探すサイクルを管理
 */
export class LumberjackingState implements IBotState {
  private bot: Bot;
  private treeType: string;
  private range: number;
  private currentTree: Block | null = null;
  private currentTask: "searching" | "moving" | "chopping" | "planting" = "searching";
  private chopPosition: Vec3 | null = null;
  private searchCenter: Vec3;

  constructor(bot: Bot, treeType: string = "oak", range: number = 30) {
    this.bot = bot;
    this.treeType = treeType;
    this.range = range;
    this.searchCenter = bot.mc.entity.position.clone();
  }

  /**
   * 木こり状態に入る際の初期化処理
   */
  public async enter(): Promise<void> {
    console.log(`[${this.bot.getName()}] Entering Lumberjacking state. Tree type: ${this.treeType}, Range: ${this.range}`);
    
    this.searchCenter = this.bot.mc.entity.position.clone();
    this.currentTask = "searching";
    this.searchForTree();
  }

  /**
   * 木こり状態から出る際の終了処理
   */
  public exit(): void {
    console.log(`[${this.bot.getName()}] Exiting Lumberjacking state`);
    
    // 移動を停止
    this.bot.mc.pathfinder.stop();
    this.currentTree = null;
    this.currentTask = "searching";
    this.chopPosition = null;
  }

  /**
   * 木こり状態の定期実行処理
   */
  public execute(): void {
    // インベントリがいっぱいかチェック
    if (this.isInventoryFull()) {
      console.log(`[${this.bot.getName()}] Inventory is full, stopping lumberjacking`);
      this.bot.sendMessage("インベントリが満杯になったため、木こり作業を終了します。");
      this.bot.changeStateToIdle().catch(error => {
        console.error(`[${this.bot.getName()}] Error changing to idle state:`, error);
      });
      return;
    }

    switch (this.currentTask) {
      case "searching":
        this.searchForTree();
        break;
      case "moving":
        this.checkMovementProgress();
        break;
      case "chopping":
        this.chopTree();
        break;
      case "planting":
        this.plantSapling();
        break;
    }
  }

  /**
   * 状態の名前を取得
   */
  public getName(): string {
    return "Lumberjacking";
  }

  /**
   * 木こり状態では、インベントリ内で最も効率的な斧を推奨する
   * @returns 推奨装備のアイテム
   */
  public getRecommendedEquipment(): any | null {
    const axes = this.bot.mc.inventory.items().filter(item => {
      const itemName = item.name.toLowerCase();
      return itemName.includes('axe');
    });

    if (axes.length === 0) {
      return null;
    }

    // 斧を効率順で並べ替え（優先度順）
    const axePriority = [
      'netherite_axe', 'diamond_axe', 'iron_axe', 'stone_axe', 'golden_axe', 'wooden_axe'
    ];

    // 最も優先度の高い斧を探す
    for (const priorityAxe of axePriority) {
      const axe = axes.find(a => a.name.toLowerCase().includes(priorityAxe));
      if (axe) {
        return axe;
      }
    }

    // 優先度にないものは最初に見つかった斧を返す
    return axes[0];
  }

  /**
   * 木を探す
   */
  private searchForTree(): void {
    const logBlockName = this.getLogBlockName();
    
    // 指定された範囲内で木を探す
    const tree = this.bot.mc.findBlock({
      matching: (block) => block.name === logBlockName,
      maxDistance: this.range,
      point: this.searchCenter
    });

    if (tree) {
      console.log(`[${this.bot.getName()}] Found ${this.treeType} tree at (${tree.position.x}, ${tree.position.y}, ${tree.position.z})`);
      this.currentTree = tree;
      this.currentTask = "moving";
      this.moveToTree();
    } else {
      console.log(`[${this.bot.getName()}] No ${this.treeType} trees found in range, searching again...`);
      // 少し待ってから再検索
      setTimeout(() => {
        if (this.currentTask === "searching") {
          this.searchForTree();
        }
      }, 2000);
    }
  }

  /**
   * 木への移動
   */
  private moveToTree(): void {
    if (!this.currentTree) return;
    
    try {
      const goal = new goals.GoalNear(
        this.currentTree.position.x,
        this.currentTree.position.y,
        this.currentTree.position.z,
        2
      );
      
      this.bot.mc.pathfinder.setGoal(goal);
      console.log(`[${this.bot.getName()}] Moving to tree`);
    } catch (error) {
      console.error(`[${this.bot.getName()}] Error moving to tree:`, error);
      this.currentTask = "searching";
    }
  }

  /**
   * 移動の進捗をチェック
   */
  private checkMovementProgress(): void {
    if (!this.currentTree) {
      this.currentTask = "searching";
      return;
    }

    const distance = this.bot.mc.entity.position.distanceTo(this.currentTree.position);
    
    if (distance <= 3 || !this.bot.mc.pathfinder.isMoving()) {
      console.log(`[${this.bot.getName()}] Reached tree, starting to chop`);
      this.currentTask = "chopping";
      this.chopPosition = this.currentTree.position.clone();
    }
  }

  /**
   * 木を伐採
   */
  private async chopTree(): Promise<void> {
    if (!this.currentTree) {
      this.currentTask = "searching";
      return;
    }

    try {
      // 斧を装備
      await this.equipAxe();
      
      // 木を伐採
      await this.bot.mc.dig(this.currentTree);
      console.log(`[${this.bot.getName()}] Chopped tree block`);
      
      // 次の木ブロックを探す
      const nextLogBlock = this.findNextLogBlock();
      if (nextLogBlock) {
        this.currentTree = nextLogBlock;
        this.moveToTree();
        this.currentTask = "moving";
      } else {
        console.log(`[${this.bot.getName()}] Finished chopping tree, preparing to plant sapling`);
        this.currentTask = "planting";
      }
    } catch (error) {
      console.error(`[${this.bot.getName()}] Error chopping tree:`, error);
      this.currentTask = "searching";
    }
  }

  /**
   * 苗木を植える
   */
  private async plantSapling(): Promise<void> {
    if (!this.chopPosition) {
      this.currentTask = "searching";
      return;
    }

    try {
      const saplingName = this.getSaplingName();
      const sapling = this.bot.mc.inventory.items().find(item => item.name === saplingName);
      
      if (sapling) {
        // 苗木を植える位置を探す
        const plantPosition = this.findPlantPosition();
        if (plantPosition) {
          const plantBlock = this.bot.mc.blockAt(plantPosition);
          if (plantBlock) {
            await this.bot.mc.equip(sapling, "hand");
            await this.bot.mc.placeBlock(plantBlock, new Vec3(0, 1, 0));
            console.log(`[${this.bot.getName()}] Planted sapling`);
          }
        }
      }
    } catch (error) {
      console.error(`[${this.bot.getName()}] Error planting sapling:`, error);
    }
    
    // 次の木を探す
    this.currentTask = "searching";
    this.currentTree = null;
    this.chopPosition = null;
  }

  /**
   * 斧を装備
   */
  private async equipAxe(): Promise<void> {
    const axes = ["diamond_axe", "iron_axe", "stone_axe", "wooden_axe"];
    
    for (const axeName of axes) {
      const axe = this.bot.mc.inventory.items().find(item => item.name === axeName);
      if (axe) {
        await this.bot.mc.equip(axe, "hand");
        return;
      }
    }
  }

  /**
   * 次の木ブロックを探す
   */
  private findNextLogBlock(): Block | null {
    if (!this.currentTree) return null;
    
    const logBlockName = this.getLogBlockName();
    
    return this.bot.mc.findBlock({
      matching: (block) => block.name === logBlockName,
      maxDistance: 5,
      point: this.currentTree.position
    });
  }

  /**
   * 苗木を植える位置を探す
   */
  private findPlantPosition(): Vec3 | null {
    if (!this.chopPosition) return null;
    
    const groundPosition = this.chopPosition.clone();
    groundPosition.y -= 1;
    
    const groundBlock = this.bot.mc.blockAt(groundPosition);
    if (groundBlock && (groundBlock.name === "dirt" || groundBlock.name === "grass_block")) {
      return groundPosition;
    }
    
    return null;
  }

  /**
   * 木の種類から原木ブロック名を取得
   */
  private getLogBlockName(): string {
    return `${this.treeType}_log`;
  }

  /**
   * 木の種類から苗木名を取得
   */
  private getSaplingName(): string {
    return `${this.treeType}_sapling`;
  }

  /**
   * インベントリが満杯かチェック
   */
  private isInventoryFull(): boolean {
    return this.bot.mc.inventory.emptySlotCount() === 0;
  }
}
