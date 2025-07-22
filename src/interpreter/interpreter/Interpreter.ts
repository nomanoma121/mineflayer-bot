import type { Bot } from "../../core/Bot";
import { Vec3 } from "vec3";
import {
	ASTNodeType,
	type AssignmentStatementNode,
	type AttackCommandNode,
	type BinaryExpressionNode,
	BinaryOperator,
	type BooleanLiteralNode,
	type BotCommandNode,
	type CommandStatementNode,
	type DigCommandNode,
	type DropCommandNode,
	type EquipCommandNode,
	type ExpressionNode,
	type GotoCommandNode,
	type IfStatementNode,
	type NumberLiteralNode,
	type PlaceCommandNode,
	type ProgramNode,
	type RepeatStatementNode,
	type SayCommandNode,
	type StatementNode,
	type StringLiteralNode,
	type UnaryExpressionNode,
	UnaryOperator,
	type VariableDeclarationNode,
	type VariableReferenceNode,
	type WaitCommandNode,
} from "../ast/ASTNode";
import { type BotScriptValue, ExecutionContext } from "./ExecutionContext";

/**
 * 実行結果の種類
 */
export enum ExecutionResultType {
	SUCCESS = "SUCCESS",
	ERROR = "ERROR",
	BREAK = "BREAK",
	CONTINUE = "CONTINUE",
	RETURN = "RETURN",
}

/**
 * 実行結果
 */
export interface ExecutionResult {
	type: ExecutionResultType;
	value?: BotScriptValue;
	message?: string;
}

/**
 * コマンド実行の結果
 */
export interface CommandResult {
	success: boolean;
	message: string;
	duration: number;
}

/**
 * BotScript インタープリター
 * ASTを実行し、ボットコマンドを実際のボット操作にマッピングする
 */
export class Interpreter {
	private context: ExecutionContext;
	private bot: Bot;
	private isRunning: boolean = false;
	private shouldStop: boolean = false;

	constructor(bot: Bot, context?: ExecutionContext) {
		this.bot = bot;
		this.context = context || new ExecutionContext();
	}

	// ===== メイン実行メソッド =====

	/**
	 * プログラムを実行
	 */
	async execute(program: ProgramNode): Promise<ExecutionResult> {
		try {
			this.isRunning = true;
			this.shouldStop = false;

			// システム変数を更新
			this.updateSystemVariables();

			// 各文を順次実行
			for (const statement of program.statements) {
				if (this.shouldStop) {
					break;
				}

				const result = await this.executeStatement(statement);
				this.context.incrementStatementCount();

				// エラーまたは制御フローの処理
				if (result.type !== ExecutionResultType.SUCCESS) {
					return result;
				}
			}

			this.context.markExecutionComplete();
			return { type: ExecutionResultType.SUCCESS };
		} catch (error) {
			const errorMessage = `Execution error: ${(error as Error).message}`;
			this.context.recordError(errorMessage);
			return {
				type: ExecutionResultType.ERROR,
				message: errorMessage,
			};
		} finally {
			this.isRunning = false;
		}
	}

	/**
	 * 実行を停止
	 */
	stop(): void {
		this.shouldStop = true;
	}

	/**
	 * 実行中かどうか
	 */
	isExecuting(): boolean {
		return this.isRunning;
	}

	// ===== 文の実行 =====

	/**
	 * 文を実行
	 */
	private async executeStatement(
		statement: StatementNode,
	): Promise<ExecutionResult> {
		switch (statement.type) {
			case ASTNodeType.VARIABLE_DECLARATION:
				return this.executeVariableDeclaration(
					statement as VariableDeclarationNode,
				);

			case ASTNodeType.ASSIGNMENT_STATEMENT:
				return this.executeAssignment(statement as AssignmentStatementNode);

			case ASTNodeType.IF_STATEMENT:
				return this.executeIfStatement(statement as IfStatementNode);

			case ASTNodeType.REPEAT_STATEMENT:
				return this.executeRepeatStatement(statement as RepeatStatementNode);

			case ASTNodeType.COMMAND_STATEMENT:
				return this.executeCommandStatement(statement as CommandStatementNode);

			// 式文（式を単独で実行）
			case ASTNodeType.NUMBER_LITERAL:
			case ASTNodeType.STRING_LITERAL:
			case ASTNodeType.BOOLEAN_LITERAL:
			case ASTNodeType.VARIABLE_REFERENCE:
			case ASTNodeType.BINARY_EXPRESSION:
			case ASTNodeType.UNARY_EXPRESSION:
				this.evaluateExpression(statement as ExpressionNode);
				return { type: ExecutionResultType.SUCCESS };

			default:
				throw new Error(`Unknown statement type: ${statement.type}`);
		}
	}

	/**
	 * 変数宣言の実行
	 */
	private executeVariableDeclaration(
		node: VariableDeclarationNode,
	): ExecutionResult {
		const value = this.evaluateExpression(node.initializer);
		this.context.defineVariable(
			node.name,
			value,
			undefined,
			false,
			node.line,
			node.column,
		);

		return { type: ExecutionResultType.SUCCESS };
	}

	/**
	 * 代入文の実行
	 */
	private executeAssignment(node: AssignmentStatementNode): ExecutionResult {
		const value = this.evaluateExpression(node.value);
		this.context.setVariable(node.target.name, value);

		return { type: ExecutionResultType.SUCCESS };
	}

	/**
	 * IF文の実行
	 */
	private async executeIfStatement(
		node: IfStatementNode,
	): Promise<ExecutionResult> {
		const condition = this.evaluateExpression(node.condition);
		const isTrue = this.isTruthy(condition);

		this.context.enterScope();

		try {
			if (isTrue) {
				// THEN節の実行
				for (const statement of node.thenStatements) {
					if (this.shouldStop) break;

					const result = await this.executeStatement(statement);
					if (result.type !== ExecutionResultType.SUCCESS) {
						return result;
					}
				}
			} else if (node.elseStatements) {
				// ELSE節の実行
				for (const statement of node.elseStatements) {
					if (this.shouldStop) break;

					const result = await this.executeStatement(statement);
					if (result.type !== ExecutionResultType.SUCCESS) {
						return result;
					}
				}
			}

			return { type: ExecutionResultType.SUCCESS };
		} finally {
			this.context.exitScope();
		}
	}

	/**
	 * REPEAT文の実行
	 */
	private async executeRepeatStatement(
		node: RepeatStatementNode,
	): Promise<ExecutionResult> {
		const countValue = this.evaluateExpression(node.count);

		if (typeof countValue !== "number") {
			throw new Error(
				`REPEAT count must be a number, got ${typeof countValue}`,
			);
		}

		const count = Math.floor(countValue);
		if (count < 0) {
			throw new Error(`REPEAT count must be non-negative, got ${count}`);
		}

		for (let i = 0; i < count; i++) {
			if (this.shouldStop) break;

			this.context.enterScope();

			try {
				// ループカウンターを設定
				this.context.defineVariable("_loop_index", i);

				for (const statement of node.statements) {
					if (this.shouldStop) break;

					const result = await this.executeStatement(statement);
					if (result.type !== ExecutionResultType.SUCCESS) {
						return result;
					}
				}
			} finally {
				this.context.exitScope();
			}
		}

		return { type: ExecutionResultType.SUCCESS };
	}

	/**
	 * コマンド文の実行
	 */
	private async executeCommandStatement(
		node: CommandStatementNode,
	): Promise<ExecutionResult> {
		try {
			const result = await this.executeCommand(node.command);
			this.context.incrementCommandCount();

			if (!result.success) {
				return {
					type: ExecutionResultType.ERROR,
					message: `Command failed: ${result.message}`,
				};
			}

			return { type: ExecutionResultType.SUCCESS };
		} catch (error) {
			return {
				type: ExecutionResultType.ERROR,
				message: `Command execution error: ${(error as Error).message}`,
			};
		}
	}

	// ===== 式の評価 =====

	/**
	 * 式を評価
	 */
	private evaluateExpression(expression: ExpressionNode): BotScriptValue {
		switch (expression.type) {
			case ASTNodeType.NUMBER_LITERAL:
				return (expression as NumberLiteralNode).value;

			case ASTNodeType.STRING_LITERAL:
				return (expression as StringLiteralNode).value;

			case ASTNodeType.BOOLEAN_LITERAL:
				return (expression as BooleanLiteralNode).value;

			case ASTNodeType.VARIABLE_REFERENCE:
				return this.context.getVariable(
					(expression as VariableReferenceNode).name,
				);

			case ASTNodeType.BINARY_EXPRESSION:
				return this.evaluateBinaryExpression(
					expression as BinaryExpressionNode,
				);

			case ASTNodeType.UNARY_EXPRESSION:
				return this.evaluateUnaryExpression(expression as UnaryExpressionNode);

			default:
				throw new Error(`Unknown expression type: ${expression.type}`);
		}
	}

	/**
	 * 二項式を評価
	 */
	private evaluateBinaryExpression(node: BinaryExpressionNode): BotScriptValue {
		const left = this.evaluateExpression(node.left);
		const right = this.evaluateExpression(node.right);

		switch (node.operator) {
			// 算術演算子
			case BinaryOperator.ADD:
				if (typeof left === "number" && typeof right === "number") {
					return left + right;
				} else {
					return String(left) + String(right); // 文字列連結
				}

			case BinaryOperator.SUBTRACT:
				this.ensureNumbers(left, right, "-");
				return (left as number) - (right as number);

			case BinaryOperator.MULTIPLY:
				this.ensureNumbers(left, right, "*");
				return (left as number) * (right as number);

			case BinaryOperator.DIVIDE:
				this.ensureNumbers(left, right, "/");
				if (right === 0) throw new Error("Division by zero");
				return (left as number) / (right as number);

			// 比較演算子
			case BinaryOperator.EQUALS:
				return left === right;

			case BinaryOperator.NOT_EQUALS:
				return left !== right;

			case BinaryOperator.LESS_THAN:
				this.ensureNumbers(left, right, "<");
				return (left as number) < (right as number);

			case BinaryOperator.GREATER_THAN:
				this.ensureNumbers(left, right, ">");
				return (left as number) > (right as number);

			case BinaryOperator.LESS_EQUALS:
				this.ensureNumbers(left, right, "<=");
				return (left as number) <= (right as number);

			case BinaryOperator.GREATER_EQUALS:
				this.ensureNumbers(left, right, ">=");
				return (left as number) >= (right as number);

			// 論理演算子
			case BinaryOperator.AND:
				return this.isTruthy(left) && this.isTruthy(right);

			case BinaryOperator.OR:
				return this.isTruthy(left) || this.isTruthy(right);

			default:
				throw new Error(`Unknown binary operator: ${node.operator}`);
		}
	}

	/**
	 * 単項式を評価
	 */
	private evaluateUnaryExpression(node: UnaryExpressionNode): BotScriptValue {
		const operand = this.evaluateExpression(node.operand);

		switch (node.operator) {
			case UnaryOperator.NOT:
				return !this.isTruthy(operand);

			case UnaryOperator.MINUS:
				if (typeof operand !== "number") {
					throw new Error(
						`Unary minus requires a number, got ${typeof operand}`,
					);
				}
				return -operand;

			default:
				throw new Error(`Unknown unary operator: ${node.operator}`);
		}
	}

	// ===== コマンドの実行 =====

	/**
	 * ボットコマンドを実行
	 */
	private async executeCommand(
		command: BotCommandNode,
	): Promise<CommandResult> {
		const startTime = Date.now();

		try {
			switch (command.type) {
				case ASTNodeType.SAY_COMMAND:
					return await this.executeSayCommand(
						command as SayCommandNode,
						startTime,
					);

				case ASTNodeType.GOTO_COMMAND:
					return await this.executeGotoCommand(
						command as GotoCommandNode,
						startTime,
					);

				case ASTNodeType.ATTACK_COMMAND:
					return await this.executeAttackCommand(
						command as AttackCommandNode,
						startTime,
					);

				case ASTNodeType.DIG_COMMAND:
					return await this.executeDigCommand(
						command as DigCommandNode,
						startTime,
					);

				case ASTNodeType.PLACE_COMMAND:
					return await this.executePlaceCommand(
						command as PlaceCommandNode,
						startTime,
					);

				case ASTNodeType.EQUIP_COMMAND:
					return await this.executeEquipCommand(
						command as EquipCommandNode,
						startTime,
					);

				case ASTNodeType.DROP_COMMAND:
					return await this.executeDropCommand(
						command as DropCommandNode,
						startTime,
					);

				case ASTNodeType.WAIT_COMMAND:
					return await this.executeWaitCommand(
						command as WaitCommandNode,
						startTime,
					);

				default:
					throw new Error(`Unknown command type: ${command.type}`);
			}
		} catch (error) {
			return {
				success: false,
				message: (error as Error).message,
				duration: Date.now() - startTime,
			};
		}
	}

	private async executeSayCommand(
		node: SayCommandNode,
		startTime: number,
	): Promise<CommandResult> {
		const message = String(this.evaluateExpression(node.message));
		
		// SayAbilityを使用してメッセージを送信（履歴管理付き）
		this.bot.say.say(message);

		return {
			success: true,
			message: `Said: "${message}"`,
			duration: Date.now() - startTime,
		};
	}

	private async executeGotoCommand(
		node: GotoCommandNode,
		startTime: number,
	): Promise<CommandResult> {
		const x = Number(this.evaluateExpression(node.x));
		const y = Number(this.evaluateExpression(node.y));
		const z = Number(this.evaluateExpression(node.z));

		try {
			// 座標の妥当性チェック
			if (Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(z)) {
				throw new Error("Invalid coordinates: must be numbers");
			}

			// 実際の移動を実行
			await new Promise<void>((resolve, reject) => {
				const timeout = setTimeout(() => {
					reject(new Error("Goto timeout"));
				}, 60000); // 60秒タイムアウト

				try {
					this.bot.goto(x, y, z);
					clearTimeout(timeout);
					resolve();
				} catch (error) {
					clearTimeout(timeout);
					reject(error);
				}
			});

			return {
				success: true,
				message: `Successfully moved to (${x}, ${y}, ${z})`,
				duration: Date.now() - startTime,
			};
		} catch (error) {
			return {
				success: false,
				message: `Goto failed: ${(error as Error).message}`,
				duration: Date.now() - startTime,
			};
		}
	}

	private async executeAttackCommand(
		node: AttackCommandNode,
		startTime: number,
	): Promise<CommandResult> {
		const target = String(this.evaluateExpression(node.target));

		try {
			// エンティティを検索
			const entity = this.bot.sensing.findNearestEntity((entity) => {
				return (
					entity.name === target ||
					entity.displayName === target ||
					entity.type === target ||
					entity.username === target
				);
			});

			if (!entity) {
				return {
					success: false,
					message: `Target entity '${target}' not found`,
					duration: Date.now() - startTime,
				};
			}

			// 攻撃を実行
			this.bot.mc.attack(entity);

			return {
				success: true,
				message: `Attacked ${target} (${entity.type})`,
				duration: Date.now() - startTime,
			};
		} catch (error) {
			return {
				success: false,
				message: `Attack failed: ${(error as Error).message}`,
				duration: Date.now() - startTime,
			};
		}
	}

	private async executeDigCommand(
		node: DigCommandNode,
		startTime: number,
	): Promise<CommandResult> {
		const blockType = node.blockType
			? String(this.evaluateExpression(node.blockType))
			: "any";

		try {
			let targetBlock = null;

			if (blockType !== "any") {
				// 指定されたブロックタイプを探す
				const blockId = this.bot.mc.registry.blocksByName[blockType]?.id;
				if (blockId) {
					const blockPosition = this.bot.sensing.findNearestBlock({
						matching: blockId,
						maxDistance: 16,
						count: 1,
					});
					if (blockPosition) {
						targetBlock = this.bot.mc.blockAt(blockPosition);
					}
				}
			} else {
				// 見ているブロックを掘る
				targetBlock = this.bot.mc.targetDigBlock;
			}

			if (!targetBlock) {
				return {
					success: false,
					message: `Target block '${blockType}' not found`,
					duration: Date.now() - startTime,
				};
			}

			// 掘れないブロックをチェック
			if (
				targetBlock.name === "air" ||
				targetBlock.name === "water" ||
				targetBlock.name === "lava"
			) {
				return {
					success: false,
					message: `Cannot dig ${targetBlock.name}`,
					duration: Date.now() - startTime,
				};
			}

			// 距離チェック
			const distance = this.bot.mc.entity.position.distanceTo(targetBlock.position);
			if (distance > 6) {
				return {
					success: false,
					message: `Block too far away (distance: ${distance.toFixed(1)})`,
					duration: Date.now() - startTime,
				};
			}

			// 最適なツールを装備
			const bestTool = this.bot.inventory.findBestTool(targetBlock);
			if (bestTool) {
				await this.bot.mc.equip(bestTool, "hand");
			}

			// 掘削を実行
			await this.bot.mc.dig(targetBlock);

			return {
				success: true,
				message: `Successfully dug ${targetBlock.name} at (${targetBlock.position.x}, ${targetBlock.position.y}, ${targetBlock.position.z})`,
				duration: Date.now() - startTime,
			};
		} catch (error) {
			return {
				success: false,
				message: `Dig failed: ${(error as Error).message}`,
				duration: Date.now() - startTime,
			};
		}
	}

	private async executePlaceCommand(
		node: PlaceCommandNode,
		startTime: number,
	): Promise<CommandResult> {
		const itemName = String(this.evaluateExpression(node.item));

		try {
			// アイテムをインベントリから検索
			const item = this.bot.inventory.findItem(itemName);
			if (!item) {
				return {
					success: false,
					message: `Item '${itemName}' not found in inventory`,
					duration: Date.now() - startTime,
				};
			}

			let targetPosition;

			if (node.x && node.y && node.z) {
				// 座標指定の場合
				const x = Number(this.evaluateExpression(node.x));
				const y = Number(this.evaluateExpression(node.y));
				const z = Number(this.evaluateExpression(node.z));

				// 座標の妥当性チェック
				if (Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(z)) {
					return {
						success: false,
						message: "Invalid coordinates: must be numbers",
						duration: Date.now() - startTime,
					};
				}

				targetPosition = { x, y, z };
			} else {
				// 現在見ているブロックの隣に設置
				const targetBlock = this.bot.mc.blockAtCursor();
				if (!targetBlock) {
					return {
						success: false,
						message: "No target block found. Please look at a block.",
						duration: Date.now() - startTime,
					};
				}

				// 設置位置は見ているブロックの上
				targetPosition = {
					x: targetBlock.position.x,
					y: targetBlock.position.y + 1,
					z: targetBlock.position.z,
				};
			}

			// Vec3オブジェクトに変換
			const targetVec3 = new Vec3(targetPosition.x, targetPosition.y, targetPosition.z);

			// 設置位置の距離チェック
			const distance = this.bot.mc.entity.position.distanceTo(targetVec3);
			if (distance > 6) {
				return {
					success: false,
					message: `Target position too far away (distance: ${distance.toFixed(1)})`,
					duration: Date.now() - startTime,
				};
			}

			// 設置位置が空いているかチェック
			const blockAtPosition = this.bot.mc.blockAt(targetVec3);
			if (blockAtPosition && blockAtPosition.name !== "air") {
				return {
					success: false,
					message: `Position (${targetPosition.x}, ${targetPosition.y}, ${targetPosition.z}) is not empty`,
					duration: Date.now() - startTime,
				};
			}

			// 設置する隣接ブロックを見つける
			const adjacentPositions = [
				new Vec3(targetPosition.x, targetPosition.y - 1, targetPosition.z), // 下
				new Vec3(targetPosition.x, targetPosition.y + 1, targetPosition.z), // 上
				new Vec3(targetPosition.x + 1, targetPosition.y, targetPosition.z), // 東
				new Vec3(targetPosition.x - 1, targetPosition.y, targetPosition.z), // 西
				new Vec3(targetPosition.x, targetPosition.y, targetPosition.z + 1), // 南
				new Vec3(targetPosition.x, targetPosition.y, targetPosition.z - 1), // 北
			];

			let referenceBlock = null;
			for (const pos of adjacentPositions) {
				const block = this.bot.mc.blockAt(pos);
				if (block && block.name !== "air") {
					referenceBlock = block;
					break;
				}
			}

			if (!referenceBlock) {
				return {
					success: false,
					message: "No adjacent block found for placement",
					duration: Date.now() - startTime,
				};
			}

			// アイテムを装備
			await this.bot.mc.equip(item, "hand");

			// ブロックを設置
			const faceVector = new Vec3(
				targetPosition.x - referenceBlock.position.x,
				targetPosition.y - referenceBlock.position.y,
				targetPosition.z - referenceBlock.position.z,
			);

			await this.bot.mc.placeBlock(referenceBlock, faceVector);

			return {
				success: true,
				message: `Successfully placed ${itemName} at (${targetPosition.x}, ${targetPosition.y}, ${targetPosition.z})`,
				duration: Date.now() - startTime,
			};
		} catch (error) {
			return {
				success: false,
				message: `Place failed: ${(error as Error).message}`,
				duration: Date.now() - startTime,
			};
		}
	}

	private async executeEquipCommand(
		node: EquipCommandNode,
		startTime: number,
	): Promise<CommandResult> {
		const item = String(this.evaluateExpression(node.item));

		try {
			// アイテムを検索
			const itemToEquip = this.bot.inventory.findItem(item);

			if (!itemToEquip) {
				return {
					success: false,
					message: `Item '${item}' not found in inventory`,
					duration: Date.now() - startTime,
				};
			}

			// 装備を実行
			await this.bot.mc.equip(itemToEquip, "hand");

			return {
				success: true,
				message: `Equipped ${item}`,
				duration: Date.now() - startTime,
			};
		} catch (error) {
			return {
				success: false,
				message: `Equip failed: ${(error as Error).message}`,
				duration: Date.now() - startTime,
			};
		}
	}

	private async executeDropCommand(
		node: DropCommandNode,
		startTime: number,
	): Promise<CommandResult> {
		const item = String(this.evaluateExpression(node.item));
		const count = node.count ? Number(this.evaluateExpression(node.count)) : 1;

		try {
			// アイテムを検索
			const itemToDrop = this.bot.inventory.findItem(item);

			if (!itemToDrop) {
				return {
					success: false,
					message: `Item '${item}' not found in inventory`,
					duration: Date.now() - startTime,
				};
			}

			// ドロップ数を調整
			const actualCount = Math.min(count, itemToDrop.count);

			// アイテムをドロップ
			await this.bot.mc.toss(itemToDrop.type, null, actualCount);

			return {
				success: true,
				message: `Dropped ${actualCount} ${item}`,
				duration: Date.now() - startTime,
			};
		} catch (error) {
			return {
				success: false,
				message: `Drop failed: ${(error as Error).message}`,
				duration: Date.now() - startTime,
			};
		}
	}

	private async executeWaitCommand(
		node: WaitCommandNode,
		startTime: number,
	): Promise<CommandResult> {
		const duration = Number(this.evaluateExpression(node.duration));

		await new Promise((resolve) => setTimeout(resolve, duration * 1000));

		return {
			success: true,
			message: `Waited ${duration} seconds`,
			duration: Date.now() - startTime,
		};
	}

	// ===== ヘルパーメソッド =====

	/**
	 * 値が真偽値として真かどうか判定
	 */
	private isTruthy(value: BotScriptValue): boolean {
		if (typeof value === "boolean") return value;
		if (typeof value === "number") return value !== 0;
		if (typeof value === "string") return value.length > 0;
		return false;
	}

	/**
	 * 数値が必要な演算の型チェック
	 */
	private ensureNumbers(
		left: BotScriptValue,
		right: BotScriptValue,
		operator: string,
	): void {
		if (typeof left !== "number" || typeof right !== "number") {
			throw new Error(
				`Operator '${operator}' requires numbers, got ${typeof left} and ${typeof right}`,
			);
		}
	}

	/**
	 * システム変数を更新
	 */
	private updateSystemVariables(): void {
		// 基本ステータス
		const vitals = this.bot.vitals.getVitalStats();
		const environment = this.bot.sensing.getEnvironmentInfo();
		const inventoryInfo = this.bot.inventory.getInventoryInfo();

		this.context.updateSystemVariables({
			// 基本情報
			health: vitals.health,
			food: vitals.hunger,
			saturation: vitals.saturation,
			oxygen: vitals.oxygen,
			experience_level: vitals.experience.level,
			experience_points: vitals.experience.points,
			
			// 位置情報
			position: this.bot.getPosition(),
			x: environment.position.x,
			y: environment.position.y,
			z: environment.position.z,
			
			// 環境情報
			light_level: environment.lightLevel,
			is_night: environment.time.isNight,
			is_raining: environment.weather.isRaining,
			time_of_day: environment.time.timeOfDay,
			
			// インベントリ情報
			inventory_count: inventoryInfo.usedSlots,
			inventory_slots_total: inventoryInfo.totalSlots,
			inventory_slots_empty: inventoryInfo.emptySlots,
			equipped_item: inventoryInfo.equippedItem || "none",
			
			// エンティティ情報
			nearby_players: environment.nearbyPlayersCount,
			nearby_mobs: environment.nearbyHostileMobsCount,
			nearby_animals: environment.nearbyAnimalsCount,
			
			// 状態フラグ
			is_in_danger: vitals.isInDanger,
			needs_food: this.bot.vitals.needsToEat(),
			health_low: this.bot.vitals.isHealthLow(),
			hunger_low: this.bot.vitals.isHungerLow(),
			inventory_full: this.bot.inventory.isFull(),
		});
	}

	/**
	 * 実行コンテキストを取得
	 */
	getContext(): ExecutionContext {
		return this.context;
	}

	/**
	 * 新しいコンテキストを設定
	 */
	setContext(context: ExecutionContext): void {
		this.context = context;
	}
}
