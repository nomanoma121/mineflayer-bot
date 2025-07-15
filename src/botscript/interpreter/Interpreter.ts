import {
  ProgramNode,
  StatementNode,
  ExpressionNode,
  BotCommandNode,
  ASTNodeType,
  BinaryOperator,
  UnaryOperator,
  VariableDeclarationNode,
  AssignmentStatementNode,
  IfStatementNode,
  RepeatStatementNode,
  CommandStatementNode,
  NumberLiteralNode,
  StringLiteralNode,
  BooleanLiteralNode,
  VariableReferenceNode,
  BinaryExpressionNode,
  UnaryExpressionNode,
  SayCommandNode,
  MoveCommandNode,
  GotoCommandNode,
  AttackCommandNode,
  DigCommandNode,
  PlaceCommandNode,
  EquipCommandNode,
  DropCommandNode,
  WaitCommandNode
} from '../ast/ASTNode';
import { ExecutionContext, BotScriptValue } from './ExecutionContext';
import { Bot } from '../../core/Bot';

/**
 * 実行結果の種類
 */
export enum ExecutionResultType {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  BREAK = 'BREAK',
  CONTINUE = 'CONTINUE',
  RETURN = 'RETURN'
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
        message: errorMessage
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
  private async executeStatement(statement: StatementNode): Promise<ExecutionResult> {
    switch (statement.type) {
      case ASTNodeType.VARIABLE_DECLARATION:
        return this.executeVariableDeclaration(statement as VariableDeclarationNode);
      
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
  private executeVariableDeclaration(node: VariableDeclarationNode): ExecutionResult {
    const value = this.evaluateExpression(node.initializer);
    this.context.defineVariable(node.name, value, undefined, false, node.line, node.column);
    
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
  private async executeIfStatement(node: IfStatementNode): Promise<ExecutionResult> {
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
  private async executeRepeatStatement(node: RepeatStatementNode): Promise<ExecutionResult> {
    const countValue = this.evaluateExpression(node.count);
    
    if (typeof countValue !== 'number') {
      throw new Error(`REPEAT count must be a number, got ${typeof countValue}`);
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
        this.context.defineVariable('_loop_index', i);
        
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
  private async executeCommandStatement(node: CommandStatementNode): Promise<ExecutionResult> {
    try {
      const result = await this.executeCommand(node.command);
      this.context.incrementCommandCount();
      
      if (!result.success) {
        return {
          type: ExecutionResultType.ERROR,
          message: `Command failed: ${result.message}`
        };
      }
      
      return { type: ExecutionResultType.SUCCESS };
      
    } catch (error) {
      return {
        type: ExecutionResultType.ERROR,
        message: `Command execution error: ${(error as Error).message}`
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
        return this.context.getVariable((expression as VariableReferenceNode).name);
      
      case ASTNodeType.BINARY_EXPRESSION:
        return this.evaluateBinaryExpression(expression as BinaryExpressionNode);
      
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
        if (typeof left === 'number' && typeof right === 'number') {
          return left + right;
        } else {
          return String(left) + String(right); // 文字列連結
        }
      
      case BinaryOperator.SUBTRACT:
        this.ensureNumbers(left, right, '-');
        return (left as number) - (right as number);
      
      case BinaryOperator.MULTIPLY:
        this.ensureNumbers(left, right, '*');
        return (left as number) * (right as number);
      
      case BinaryOperator.DIVIDE:
        this.ensureNumbers(left, right, '/');
        if (right === 0) throw new Error('Division by zero');
        return (left as number) / (right as number);
      
      // 比較演算子
      case BinaryOperator.EQUALS:
        return left === right;
      
      case BinaryOperator.NOT_EQUALS:
        return left !== right;
      
      case BinaryOperator.LESS_THAN:
        this.ensureNumbers(left, right, '<');
        return (left as number) < (right as number);
      
      case BinaryOperator.GREATER_THAN:
        this.ensureNumbers(left, right, '>');
        return (left as number) > (right as number);
      
      case BinaryOperator.LESS_EQUALS:
        this.ensureNumbers(left, right, '<=');
        return (left as number) <= (right as number);
      
      case BinaryOperator.GREATER_EQUALS:
        this.ensureNumbers(left, right, '>=');
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
        if (typeof operand !== 'number') {
          throw new Error(`Unary minus requires a number, got ${typeof operand}`);
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
  private async executeCommand(command: BotCommandNode): Promise<CommandResult> {
    const startTime = Date.now();
    
    try {
      switch (command.type) {
        case ASTNodeType.SAY_COMMAND:
          return await this.executeSayCommand(command as SayCommandNode, startTime);
        
        case ASTNodeType.MOVE_COMMAND:
          return await this.executeMoveCommand(command as MoveCommandNode, startTime);
        
        case ASTNodeType.GOTO_COMMAND:
          return await this.executeGotoCommand(command as GotoCommandNode, startTime);
        
        case ASTNodeType.ATTACK_COMMAND:
          return await this.executeAttackCommand(command as AttackCommandNode, startTime);
        
        case ASTNodeType.DIG_COMMAND:
          return await this.executeDigCommand(command as DigCommandNode, startTime);
        
        case ASTNodeType.PLACE_COMMAND:
          return await this.executePlaceCommand(command as PlaceCommandNode, startTime);
        
        case ASTNodeType.EQUIP_COMMAND:
          return await this.executeEquipCommand(command as EquipCommandNode, startTime);
        
        case ASTNodeType.DROP_COMMAND:
          return await this.executeDropCommand(command as DropCommandNode, startTime);
        
        case ASTNodeType.WAIT_COMMAND:
          return await this.executeWaitCommand(command as WaitCommandNode, startTime);
        
        default:
          throw new Error(`Unknown command type: ${command.type}`);
      }
    } catch (error) {
      return {
        success: false,
        message: (error as Error).message,
        duration: Date.now() - startTime
      };
    }
  }

  private async executeSayCommand(node: SayCommandNode, startTime: number): Promise<CommandResult> {
    const message = String(this.evaluateExpression(node.message));
    this.bot.sendMessage(message);
    
    return {
      success: true,
      message: `Said: "${message}"`,
      duration: Date.now() - startTime
    };
  }

  private async executeMoveCommand(node: MoveCommandNode, startTime: number): Promise<CommandResult> {
    const direction = String(this.evaluateExpression(node.direction)).toLowerCase();
    const distance = node.distance ? Number(this.evaluateExpression(node.distance)) : 1;
    
    try {
      const currentPos = this.bot.getPosition();
      let targetPos = { ...currentPos };
      
      // 移動方向に応じて目標座標を計算
      switch (direction) {
        case 'forward':
          targetPos.z += distance;
          break;
        case 'backward':
          targetPos.z -= distance;
          break;
        case 'left':
          targetPos.x -= distance;
          break;
        case 'right':
          targetPos.x += distance;
          break;
        case 'up':
          targetPos.y += distance;
          break;
        case 'down':
          targetPos.y -= distance;
          break;
        default:
          throw new Error(`Invalid direction: ${direction}. Use: forward, backward, left, right, up, down`);
      }
      
      // 実際の移動を実行
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Movement timeout'));
        }, 30000);
        
        try {
          this.bot.goto(targetPos.x, targetPos.y, targetPos.z);
          clearTimeout(timeout);
          resolve();
        } catch (error) {
          clearTimeout(timeout);
          reject(error);
        }
      });
      
      return {
        success: true,
        message: `Moved ${direction} for ${distance} blocks to (${targetPos.x}, ${targetPos.y}, ${targetPos.z})`,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        message: `Movement failed: ${(error as Error).message}`,
        duration: Date.now() - startTime
      };
    }
  }

  private async executeGotoCommand(node: GotoCommandNode, startTime: number): Promise<CommandResult> {
    const x = Number(this.evaluateExpression(node.x));
    const y = Number(this.evaluateExpression(node.y));
    const z = Number(this.evaluateExpression(node.z));
    
    try {
      // 座標の妥当性チェック
      if (isNaN(x) || isNaN(y) || isNaN(z)) {
        throw new Error('Invalid coordinates: must be numbers');
      }
      
      // 実際の移動を実行
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Goto timeout'));
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
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        message: `Goto failed: ${(error as Error).message}`,
        duration: Date.now() - startTime
      };
    }
  }

  private async executeAttackCommand(node: AttackCommandNode, startTime: number): Promise<CommandResult> {
    const target = String(this.evaluateExpression(node.target));
    
    try {
      // エンティティを検索
      const entity = this.bot.sensing.findNearestEntity((entity) => {
        return (entity.name === target) || 
               (entity.displayName === target) || 
               (entity.type === target) ||
               (entity.username === target);
      });
      
      if (!entity) {
        return {
          success: false,
          message: `Target entity '${target}' not found`,
          duration: Date.now() - startTime
        };
      }
      
      // 攻撃を実行
      this.bot.mc.attack(entity);
      
      return {
        success: true,
        message: `Attacked ${target} (${entity.type})`,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        message: `Attack failed: ${(error as Error).message}`,
        duration: Date.now() - startTime
      };
    }
  }

  private async executeDigCommand(node: DigCommandNode, startTime: number): Promise<CommandResult> {
    const blockType = node.blockType ? String(this.evaluateExpression(node.blockType)) : 'any';
    
    return {
      success: true,
      message: `Digging ${blockType}`,
      duration: Date.now() - startTime
    };
  }

  private async executePlaceCommand(node: PlaceCommandNode, startTime: number): Promise<CommandResult> {
    const item = String(this.evaluateExpression(node.item));
    
    if (node.x && node.y && node.z) {
      const x = Number(this.evaluateExpression(node.x));
      const y = Number(this.evaluateExpression(node.y));
      const z = Number(this.evaluateExpression(node.z));
      
      return {
        success: true,
        message: `Placing ${item} at (${x}, ${y}, ${z})`,
        duration: Date.now() - startTime
      };
    } else {
      return {
        success: true,
        message: `Placing ${item}`,
        duration: Date.now() - startTime
      };
    }
  }

  private async executeEquipCommand(node: EquipCommandNode, startTime: number): Promise<CommandResult> {
    const item = String(this.evaluateExpression(node.item));
    
    try {
      // アイテムを検索
      const itemToEquip = this.bot.inventory.findItem(item);
      
      if (!itemToEquip) {
        return {
          success: false,
          message: `Item '${item}' not found in inventory`,
          duration: Date.now() - startTime
        };
      }
      
      // 装備を実行
      await this.bot.mc.equip(itemToEquip, 'hand');
      
      return {
        success: true,
        message: `Equipped ${item}`,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        message: `Equip failed: ${(error as Error).message}`,
        duration: Date.now() - startTime
      };
    }
  }

  private async executeDropCommand(node: DropCommandNode, startTime: number): Promise<CommandResult> {
    const item = String(this.evaluateExpression(node.item));
    const count = node.count ? Number(this.evaluateExpression(node.count)) : 1;
    
    try {
      // アイテムを検索
      const itemToDrop = this.bot.inventory.findItem(item);
      
      if (!itemToDrop) {
        return {
          success: false,
          message: `Item '${item}' not found in inventory`,
          duration: Date.now() - startTime
        };
      }
      
      // ドロップ数を調整
      const actualCount = Math.min(count, itemToDrop.count);
      
      // アイテムをドロップ
      await this.bot.mc.toss(itemToDrop.type, null, actualCount);
      
      return {
        success: true,
        message: `Dropped ${actualCount} ${item}`,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        message: `Drop failed: ${(error as Error).message}`,
        duration: Date.now() - startTime
      };
    }
  }

  private async executeWaitCommand(node: WaitCommandNode, startTime: number): Promise<CommandResult> {
    const duration = Number(this.evaluateExpression(node.duration));
    
    await new Promise(resolve => setTimeout(resolve, duration * 1000));
    
    return {
      success: true,
      message: `Waited ${duration} seconds`,
      duration: Date.now() - startTime
    };
  }

  // ===== ヘルパーメソッド =====

  /**
   * 値が真偽値として真かどうか判定
   */
  private isTruthy(value: BotScriptValue): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') return value.length > 0;
    return false;
  }

  /**
   * 数値が必要な演算の型チェック
   */
  private ensureNumbers(left: BotScriptValue, right: BotScriptValue, operator: string): void {
    if (typeof left !== 'number' || typeof right !== 'number') {
      throw new Error(`Operator '${operator}' requires numbers, got ${typeof left} and ${typeof right}`);
    }
  }

  /**
   * システム変数を更新
   */
  private updateSystemVariables(): void {
    this.context.updateSystemVariables({
      health: this.bot.mc.health,
      food: this.bot.mc.food,
      position: this.bot.getPosition(),
      inventory_count: this.bot.getInventory().length
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