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
    const position = this.bot.getPosition();
    const yaw = this.bot.mc.entity?.yaw || 0;
    const pitch = this.bot.mc.entity?.pitch || 0;
    const timeOfDay = this.bot.mc.time?.timeOfDay || 0;
    const isDay = timeOfDay < 12300 || timeOfDay > 23850; // Minecraft day/night cycle
    const isNight = !isDay;
    
    // 天気情報の取得
    const isRaining = this.bot.mc.isRaining || false;
    const isThundering = this.bot.mc.thunderState > 0;
    let weather = 'clear';
    if (isThundering) {
      weather = 'thunder';
    } else if (isRaining) {
      weather = 'rain';
    }
    
    // ディメンション情報（安全に取得）
    let dimension = 'overworld';
    try {
      const dimName = (this.bot.mc as any).game?.dimension;
      if (dimName === -1) dimension = 'nether';
      else if (dimName === 1) dimension = 'end';
      else dimension = 'overworld';
    } catch {
      dimension = 'overworld';
    }
    
    // 近くのエンティティ情報
    const nearbyEntities = Object.values(this.bot.mc.entities || {});
    const botPosition = this.bot.mc.entity?.position || { x: 0, y: 0, z: 0 };
    
    const nearbyPlayers = nearbyEntities.filter(entity => {
      try {
        return entity.type === 'player' && entity.position && 
               entity.position.distanceTo(botPosition) <= 16;
      } catch {
        return false;
      }
    });
    
    const nearbyMobs = nearbyEntities.filter(entity => {
      try {
        return entity.type === 'mob' && entity.position &&
               entity.position.distanceTo(botPosition) <= 16;
      } catch {
        return false;
      }
    });

    // 装備情報の取得
    const slots = this.bot.mc.inventory?.slots || [];
    const helmet = slots[5]?.name || 'none';
    const chestplate = slots[6]?.name || 'none'; 
    const leggings = slots[7]?.name || 'none';
    const boots = slots[8]?.name || 'none';
    const mainHand = slots[36]?.name || 'none';
    const offHand = slots[45]?.name || 'none';

    // 酸素値の安全な取得
    let airValue = 300;
    try {
      airValue = (this.bot.mc.entity as any)?.air || 300;
    } catch {
      airValue = 300;
    }

    // 全ての新しい変数のデータを収集
    const updateData = {
      // 基本情報
      health: this.bot.mc.health,
      food: this.bot.mc.food,
      position: position,
      inventory_count: this.bot.getInventory().length,
      yaw: Math.round(yaw * 180 / Math.PI),
      pitch: Math.round(pitch * 180 / Math.PI),
      experience: this.bot.mc.experience?.level || 0,
      air: airValue,
      time_of_day: timeOfDay,
      is_day: isDay,
      is_night: isNight,
      weather: weather,
      dimension: dimension,
      nearby_players_count: nearbyPlayers.length,
      nearby_mobs_count: nearbyMobs.length,
      equipped_helmet: helmet,
      equipped_chestplate: chestplate,
      equipped_leggings: leggings,
      equipped_boots: boots,
      equipped_mainhand: mainHand,
      equipped_offhand: offHand,
      armor_points: this.calculateArmorPoints(helmet, chestplate, leggings, boots),
      light_level: this.getLightLevel(),
      biome: this.getCurrentBiome(),

      // ステータス・能力系
      ...this.getStatusAndAbilityData(),
      
      // インベントリ詳細系
      ...this.getInventoryDetailData(),
      
      // ワールド・ブロック情報系
      ...this.getWorldBlockData(),
      
      // 戦闘・PvP系
      ...this.getCombatData(nearbyEntities, botPosition),
      
      // 建築・クラフト系
      ...this.getBuildingCraftData(nearbyEntities, botPosition),
      
      // 移動・ナビゲーション系
      ...this.getNavigationData(),
      
      // サーバー・接続系
      ...this.getServerConnectionData(),
      
      // 時間・イベント系
      ...this.getTimeEventData(timeOfDay),
      
      // AI・学習系（基本実装）
      ...this.getAILearningData(),
      
      // コミュニケーション系（基本実装）
      ...this.getCommunicationData()
    };

    this.context.updateSystemVariables(updateData);
  }

  /**
   * 防具ポイントを計算
   */
  private calculateArmorPoints(helmet: string, chestplate: string, leggings: string, boots: string): number {
    let points = 0;
    // 簡易的な防具ポイント計算
    const armorValues: {[key: string]: number} = {
      'leather_helmet': 1, 'leather_chestplate': 3, 'leather_leggings': 2, 'leather_boots': 1,
      'iron_helmet': 2, 'iron_chestplate': 6, 'iron_leggings': 5, 'iron_boots': 2,
      'diamond_helmet': 3, 'diamond_chestplate': 8, 'diamond_leggings': 6, 'diamond_boots': 3,
      'netherite_helmet': 3, 'netherite_chestplate': 8, 'netherite_leggings': 6, 'netherite_boots': 3
    };
    
    points += armorValues[helmet] || 0;
    points += armorValues[chestplate] || 0;
    points += armorValues[leggings] || 0;
    points += armorValues[boots] || 0;
    
    return points;
  }

  /**
   * 光レベルを取得
   */
  private getLightLevel(): number {
    try {
      const pos = this.bot.getPosition();
      return (this.bot.mc as any).world?.getBlockLight?.(pos) || 0;
    } catch {
      return 0;
    }
  }

  /**
   * 現在のバイオームを取得
   */
  private getCurrentBiome(): string {
    try {
      const pos = this.bot.getPosition();
      const biomeId = (this.bot.mc as any).world?.getBiome?.(pos);
      const biomeNames: {[key: number]: string} = {
        0: 'ocean', 1: 'plains', 2: 'desert', 3: 'mountains', 4: 'forest',
        5: 'taiga', 6: 'swamp', 7: 'river', 14: 'mushroom_fields'
      };
      return biomeNames[biomeId] || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * ステータス・能力系データを取得
   */
  private getStatusAndAbilityData(): any {
    try {
      const entity = this.bot.mc.entity;
      const effects = (this.bot.mc as any).entity?.effects || {};
      const activeEffectsList = Object.keys(effects).join(', ') || 'none';
      
      return {
        bot_saturation: (this.bot.mc as any).food?.saturation || 0,
        bot_oxygen_time: entity ? Math.max(0, (entity as any).air || 300) / 20 : 15, // 秒に変換
        bot_fall_distance: (entity as any)?.fallDistance || 0,
        bot_speed_modifier: 1.0, // 基本実装
        bot_jump_boost: 0, // 基本実装
        active_effects: activeEffectsList
      };
    } catch {
      return {
        bot_saturation: 0,
        bot_oxygen_time: 15,
        bot_fall_distance: 0,
        bot_speed_modifier: 1.0,
        bot_jump_boost: 0,
        active_effects: 'none'
      };
    }
  }

  /**
   * インベントリ詳細系データを取得
   */
  private getInventoryDetailData(): any {
    try {
      const inventory = this.bot.getInventory();
      const slots = this.bot.mc.inventory?.slots || [];
      
      // 空きスロット数を計算
      const totalSlots = 36; // メインインベントリ
      const freeSlots = totalSlots - inventory.length;
      
      // 食べ物・武器・ツールの有無をチェック
      const hasFood = inventory.some(item => this.isFood(item?.name || ''));
      const hasWeapon = inventory.some(item => this.isWeapon(item?.name || ''));
      const hasTool = inventory.some(item => this.isTool(item?.name || ''));
      
      // 最強の武器を特定
      const weapons = inventory.filter(item => this.isWeapon(item?.name || ''));
      const strongestWeapon = this.getStrongestWeapon(weapons);
      
      return {
        hotbar_selected_slot: (this.bot.mc as any).quickBarSlot || 0,
        inventory_free_slots: freeSlots,
        has_food: hasFood,
        has_weapon: hasWeapon,
        has_tool: hasTool,
        strongest_weapon: strongestWeapon,
        best_tool_for: 'auto' // 基本実装
      };
    } catch {
      return {
        hotbar_selected_slot: 0,
        inventory_free_slots: 36,
        has_food: false,
        has_weapon: false,
        has_tool: false,
        strongest_weapon: 'none',
        best_tool_for: 'none'
      };
    }
  }

  /**
   * ワールド・ブロック情報系データを取得
   */
  private getWorldBlockData(): any {
    try {
      const pos = this.bot.getPosition();
      const blockAtFeet = this.getBlockAt(pos.x, pos.y - 1, pos.z);
      const blockAboveHead = this.getBlockAt(pos.x, pos.y + 2, pos.z);
      
      // 見ているブロックを取得
      let blockLookingAt = 'air';
      try {
        const block = (this.bot.mc as any).blockAt?.(this.bot.mc.entity?.position);
        blockLookingAt = block?.name || 'air';
      } catch {
        blockLookingAt = 'air';
      }
      
      // 空が見えるかチェック
      const canSeeSky = this.canSeeSkyfromPosition(pos);
      
      // スポーン地点とベッド位置
      const spawnPoint = (this.bot.mc as any).spawnPoint || { x: 0, y: 64, z: 0 };
      
      return {
        block_at_feet: blockAtFeet,
        block_looking_at: blockLookingAt,
        block_above_head: blockAboveHead,
        can_see_sky: canSeeSky,
        spawn_point_x: spawnPoint.x,
        spawn_point_y: spawnPoint.y,
        spawn_point_z: spawnPoint.z,
        bed_location_x: spawnPoint.x, // 基本実装
        bed_location_y: spawnPoint.y,
        bed_location_z: spawnPoint.z
      };
    } catch {
      return {
        block_at_feet: 'air',
        block_looking_at: 'air',
        block_above_head: 'air',
        can_see_sky: true,
        spawn_point_x: 0,
        spawn_point_y: 64,
        spawn_point_z: 0,
        bed_location_x: 0,
        bed_location_y: 64,
        bed_location_z: 0
      };
    }
  }

  /**
   * 戦闘・PvP系データを取得
   */
  private getCombatData(nearbyEntities: any[], botPosition: any): any {
    try {
      // 最も近い敵対Mobを特定
      const hostileMobs = nearbyEntities.filter(entity => 
        this.isHostileMob(entity.name || '') && entity.position
      );
      
      let nearestHostileMob = 'none';
      let nearestMobDistance = 999;
      
      if (hostileMobs.length > 0) {
        const nearest = hostileMobs.reduce((closest, mob) => {
          const distance = mob.position.distanceTo(botPosition);
          return distance < closest.distance ? { mob, distance } : closest;
        }, { mob: null, distance: Infinity });
        
        nearestHostileMob = nearest.mob?.name || 'none';
        nearestMobDistance = Math.round(nearest.distance);
      }
      
      return {
        nearest_hostile_mob: nearestHostileMob,
        nearest_mob_distance: nearestMobDistance,
        is_being_attacked: (this.bot.mc as any).entity?.hurtTime > 0 || false,
        last_damage_source: 'none', // 基本実装
        can_attack_target: nearestMobDistance <= 4
      };
    } catch {
      return {
        nearest_hostile_mob: 'none',
        nearest_mob_distance: 999,
        is_being_attacked: false,
        last_damage_source: 'none',
        can_attack_target: false
      };
    }
  }

  /**
   * 建築・クラフト系データを取得
   */
  private getBuildingCraftData(nearbyEntities: any[], botPosition: any): any {
    try {
      // 近くの特定ブロックをチェック
      const craftingTableNearby = this.isBlockNearby('crafting_table', botPosition, 5);
      const furnaceNearby = this.isBlockNearby('furnace', botPosition, 5);
      const chestNearby = this.isBlockNearby('chest', botPosition, 5);
      
      return {
        can_craft: 'basic', // 基本実装
        crafting_table_nearby: craftingTableNearby,
        furnace_nearby: furnaceNearby,
        chest_nearby: chestNearby,
        can_place_block: true // 基本実装
      };
    } catch {
      return {
        can_craft: 'none',
        crafting_table_nearby: false,
        furnace_nearby: false,
        chest_nearby: false,
        can_place_block: false
      };
    }
  }

  /**
   * 移動・ナビゲーション系データを取得
   */
  private getNavigationData(): any {
    try {
      const entity = this.bot.mc.entity;
      const position = this.bot.getPosition();
      
      return {
        is_on_ground: entity?.onGround || false,
        is_in_water: (entity as any)?.isInWater || false,
        is_in_lava: (entity as any)?.isInLava || false,
        is_climbing: (entity as any)?.isClimbing || false,
        path_blocked: false, // 基本実装
        distance_to_spawn: this.getDistanceToSpawn(position),
        can_reach_position: true // 基本実装
      };
    } catch {
      return {
        is_on_ground: true,
        is_in_water: false,
        is_in_lava: false,
        is_climbing: false,
        path_blocked: false,
        distance_to_spawn: 0,
        can_reach_position: true
      };
    }
  }

  /**
   * サーバー・接続系データを取得
   */
  private getServerConnectionData(): any {
    try {
      const players = Object.keys(this.bot.mc.players || {}).length;
      
      return {
        server_tps: 20.0, // 基本実装
        ping_ms: (this.bot.mc as any).ping || 0,
        player_count: players,
        server_difficulty: 'normal', // 基本実装
        game_mode: 'survival' // 基本実装
      };
    } catch {
      return {
        server_tps: 20.0,
        ping_ms: 0,
        player_count: 1,
        server_difficulty: 'normal',
        game_mode: 'survival'
      };
    }
  }

  /**
   * 時間・イベント系データを取得
   */
  private getTimeEventData(timeOfDay: number): any {
    try {
      // 夜明けと夕暮れまでの時間を計算
      const timeUntilDawn = timeOfDay > 23000 ? (24000 - timeOfDay) + 1000 : 
                           timeOfDay < 1000 ? 1000 - timeOfDay : 0;
      const timeUntilDusk = timeOfDay < 13000 ? 13000 - timeOfDay : 
                           (24000 - timeOfDay) + 13000;
      
      // 月の満ち欠け（簡易版）
      const moonPhase = Math.floor(timeOfDay / 3000) % 8;
      const isFullMoon = moonPhase === 0;
      
      return {
        days_played: Math.floor(timeOfDay / 24000) + 1,
        time_until_dawn: Math.round(timeUntilDawn / 20), // 秒に変換
        time_until_dusk: Math.round(timeUntilDusk / 20),
        moon_phase: moonPhase,
        is_full_moon: isFullMoon
      };
    } catch {
      return {
        days_played: 1,
        time_until_dawn: 0,
        time_until_dusk: 0,
        moon_phase: 0,
        is_full_moon: false
      };
    }
  }

  /**
   * AI・学習系データを取得（基本実装）
   */
  private getAILearningData(): any {
    return {
      death_count: 0,
      blocks_mined_today: 0,
      distance_walked: 0,
      items_crafted_count: 0,
      mobs_killed_count: 0
    };
  }

  /**
   * コミュニケーション系データを取得（基本実装）
   */
  private getCommunicationData(): any {
    return {
      last_chat_message: '',
      last_chat_sender: '',
      whisper_target: ''
    };
  }

  // ヘルパーメソッド群
  private isFood(itemName: string): boolean {
    const foods = ['bread', 'apple', 'cooked_beef', 'cooked_porkchop', 'cooked_chicken', 
                   'cooked_fish', 'cookie', 'cake', 'carrot', 'potato', 'baked_potato'];
    return foods.includes(itemName);
  }

  private isWeapon(itemName: string): boolean {
    return itemName.includes('sword') || itemName.includes('axe') || itemName.includes('bow');
  }

  private isTool(itemName: string): boolean {
    return itemName.includes('pickaxe') || itemName.includes('shovel') || 
           itemName.includes('hoe') || itemName.includes('axe');
  }

  private getStrongestWeapon(weapons: any[]): string {
    if (weapons.length === 0) return 'none';
    // 簡易的な武器強度判定
    const priorities = ['netherite_sword', 'diamond_sword', 'iron_sword', 'stone_sword', 'wooden_sword'];
    for (const priority of priorities) {
      const weapon = weapons.find(w => w?.name === priority);
      if (weapon) return weapon.name;
    }
    return weapons[0]?.name || 'none';
  }

  private getBlockAt(x: number, y: number, z: number): string {
    try {
      const block = (this.bot.mc as any).world?.getBlock?.({ x: Math.floor(x), y: Math.floor(y), z: Math.floor(z) });
      return block?.name || 'air';
    } catch {
      return 'air';
    }
  }

  private canSeeSkyfromPosition(pos: any): boolean {
    try {
      // 簡易的な空の見え方判定
      for (let y = Math.floor(pos.y) + 1; y < 256; y++) {
        const block = this.getBlockAt(pos.x, y, pos.z);
        if (block !== 'air') return false;
      }
      return true;
    } catch {
      return true;
    }
  }

  private isHostileMob(mobName: string): boolean {
    const hostileMobs = ['zombie', 'skeleton', 'creeper', 'spider', 'enderman', 'witch', 'phantom'];
    return hostileMobs.some(hostile => mobName.includes(hostile));
  }

  private isBlockNearby(blockType: string, position: any, radius: number): boolean {
    try {
      for (let x = -radius; x <= radius; x++) {
        for (let y = -radius; y <= radius; y++) {
          for (let z = -radius; z <= radius; z++) {
            const block = this.getBlockAt(position.x + x, position.y + y, position.z + z);
            if (block === blockType) return true;
          }
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  private getDistanceToSpawn(currentPos: any): number {
    try {
      const spawnPoint = (this.bot.mc as any).spawnPoint || { x: 0, y: 64, z: 0 };
      const dx = currentPos.x - spawnPoint.x;
      const dz = currentPos.z - spawnPoint.z;
      return Math.round(Math.sqrt(dx * dx + dz * dz));
    } catch {
      return 0;
    }
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
