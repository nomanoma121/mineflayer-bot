import { Bot } from "../core/Bot";
import { IBotState } from "./IBotState";
import { Vec3 } from "vec3";

export class DigState implements IBotState {
  constructor(
    private readonly bot: Bot,
    private readonly targetBlock: Vec3,
    private readonly parentState?: IBotState
  ) {}

  public async enter(): Promise<void> {
    console.log(`[${this.bot.getName()}] Entering Dig State for block at ${this.targetBlock}`);

    // ブロックを掘るための初期化処理
    if (this.bot.mc.pathfinder) {
      this.bot.mc.pathfinder.setGoal(null);
    }

    // ブロックを掘る
    const block = this.bot.mc.blockAt(this.targetBlock);
    if (block) {
      try {
        await this.bot.mc.dig(block);
        console.log(`[${this.bot.getName()}] Successfully dug block at ${this.targetBlock}`);
      } catch (error) {
        console.error(`[${this.bot.getName()}] Error digging block:`, error);
      }
    } else {
      console.warn(`[${this.bot.getName()}] No block found at ${this.targetBlock}`);
    }
  }

  public exit(): void {}

  public execute(): void {}

  public getName(): string {
    return "DigState";
  }
}
