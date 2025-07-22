import type { Block } from "prismarine-block";
import type { Vec3 } from "vec3";
import type { Bot } from "../core/Bot";
import type { IBotState } from "./IBotState";

export class PlaceState implements IBotState {
	private readonly bot: Bot;
	private readonly targetPosition: Vec3;
	private readonly blockName: string;
	private isActive: boolean = false;
	private onComplete?: () => void;
	private onError?: (error: Error) => void;

	constructor(
		bot: Bot,
		targetPosition: Vec3,
		blockName: string,
		onComplete?: () => void,
		onError?: (error: Error) => void,
	) {
		this.bot = bot;
		this.targetPosition = targetPosition;
		this.blockName = blockName;
		this.onComplete = onComplete;
		this.onError = onError;
	}

	public async enter(): Promise<void> {
		console.log(
			`[${this.bot.getName()}] Entering Place State for ${this.blockName} at ${this.targetPosition}`,
		);
		this.isActive = true;

		if (this.bot.mc.pathfinder) {
			this.bot.mc.pathfinder.setGoal(null);
		}

		this.bot.sendMessage(
			`${this.blockName}を座標 (${Math.floor(this.targetPosition.x)}, ${Math.floor(this.targetPosition.y)}, ${Math.floor(this.targetPosition.z)}) に設置します。`,
		);

		await this.placeBlock();
	}

	public exit(): void {
		console.log(`[${this.bot.getName()}] Exiting Place State`);
		this.isActive = false;
	}

	public execute(): void {
		// 設置は一回きりの動作なので、execute()では特に何もしない
	}

	public getName(): string {
		return `Place(${this.blockName})`;
	}

	private async placeBlock(): Promise<void> {
		try {
			// 指定されたブロックがインベントリにあるかチェック
			const item = this.bot.mc.inventory
				.items()
				.find(
					(item) =>
						item.name.toLowerCase().includes(this.blockName.toLowerCase()) ||
						item.displayName
							.toLowerCase()
							.includes(this.blockName.toLowerCase()),
				);
			if (!item) {
				const errorMsg = `${this.blockName}がインベントリにありません。`;
				console.error(`[${this.bot.getName()}] ${errorMsg}`);
				this.bot.sendMessage(errorMsg);
				if (this.onError) {
					this.onError(new Error(errorMsg));
				}
				await this.returnToIdle();
				return;
			}

			// 設置位置のブロックをチェック
			const targetBlock = this.bot.mc.blockAt(this.targetPosition);
			if (targetBlock && targetBlock.name !== "air") {
				const errorMsg = `座標 (${this.targetPosition.x}, ${this.targetPosition.y}, ${this.targetPosition.z}) には既にブロック (${targetBlock.name}) があります。`;
				console.error(`[${this.bot.getName()}] ${errorMsg}`);
				this.bot.sendMessage(errorMsg);
				if (this.onError) {
					this.onError(new Error(errorMsg));
				}
				await this.returnToIdle();
				return;
			}

			// 設置する隣接ブロックを見つける
			const adjacentPositions = [
				this.targetPosition.offset(0, -1, 0), // 下
				this.targetPosition.offset(0, 1, 0), // 上
				this.targetPosition.offset(1, 0, 0), // 東
				this.targetPosition.offset(-1, 0, 0), // 西
				this.targetPosition.offset(0, 0, 1), // 南
				this.targetPosition.offset(0, 0, -1), // 北
			];

			let referenceBlock: Block | null = null;
			for (const pos of adjacentPositions) {
				const block = this.bot.mc.blockAt(pos);
				if (block && block.name !== "air") {
					referenceBlock = block;
					break;
				}
			}

			if (!referenceBlock) {
				const errorMsg = `設置位置の周りに参照できるブロックがありません。`;
				console.error(`[${this.bot.getName()}] ${errorMsg}`);
				this.bot.sendMessage(errorMsg);
				if (this.onError) {
					this.onError(new Error(errorMsg));
				}
				await this.returnToIdle();
				return;
			}

			// ブロックを装備
			await this.bot.mc.equip(item, "hand");

			// ブロックを設置
			await this.bot.mc.placeBlock(
				referenceBlock,
				this.targetPosition.subtract(referenceBlock.position),
			);

			const successMsg = `${this.blockName}を座標 (${this.targetPosition.x}, ${this.targetPosition.y}, ${this.targetPosition.z}) に設置しました。`;
			console.log(`[${this.bot.getName()}] ${successMsg}`);
			this.bot.sendMessage(successMsg);

			if (this.onComplete) {
				this.onComplete();
			}
		} catch (error) {
			const errorMsg = `ブロック設置中にエラーが発生しました: ${error instanceof Error ? error.message : "Unknown error"}`;
			console.error(`[${this.bot.getName()}] ${errorMsg}`, error);
			this.bot.sendMessage(errorMsg);

			if (this.onError) {
				this.onError(error instanceof Error ? error : new Error(errorMsg));
			}
		}

		await this.returnToIdle();
	}

	private async returnToIdle(): Promise<void> {
		if (this.isActive) {
			this.isActive = false;
			try {
				await this.bot.changeStateToIdle();
			} catch (error) {
				console.error(
					`[${this.bot.getName()}] Error changing to idle state:`,
					error,
				);
			}
		}
	}
}
