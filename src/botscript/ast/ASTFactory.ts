import {
  ASTNode,
  ASTNodeType,
  ProgramNode,
  NumberLiteralNode,
  StringLiteralNode,
  BooleanLiteralNode,
  VariableReferenceNode,
  BinaryExpressionNode,
  UnaryExpressionNode,
  VariableDeclarationNode,
  AssignmentStatementNode,
  IfStatementNode,
  RepeatStatementNode,
  CommandStatementNode,
  SayCommandNode,
  MoveCommandNode,
  GotoCommandNode,
  AttackCommandNode,
  DigCommandNode,
  PlaceCommandNode,
  EquipCommandNode,
  DropCommandNode,
  WaitCommandNode,
  BinaryOperator,
  UnaryOperator,
  StatementNode,
  ExpressionNode,
  BotCommandNode
} from './ASTNode';

/**
 * ASTノードを作成するためのファクトリクラス
 * パーサーが使用してASTノードを簡単に作成できるようにする
 */
export class ASTFactory {
  
  // ===== プログラム構造 =====
  
  /**
   * プログラムノードを作成
   */
  static createProgram(statements: StatementNode[], line: number = 1, column: number = 1): ProgramNode {
    return {
      type: ASTNodeType.PROGRAM,
      statements,
      line,
      column
    };
  }

  // ===== リテラルノード =====

  /**
   * 数値リテラルノードを作成
   */
  static createNumberLiteral(value: number, line: number, column: number): NumberLiteralNode {
    return {
      type: ASTNodeType.NUMBER_LITERAL,
      value,
      line,
      column
    };
  }

  /**
   * 文字列リテラルノードを作成
   */
  static createStringLiteral(value: string, line: number, column: number): StringLiteralNode {
    return {
      type: ASTNodeType.STRING_LITERAL,
      value,
      line,
      column
    };
  }

  /**
   * 真偽値リテラルノードを作成
   */
  static createBooleanLiteral(value: boolean, line: number, column: number): BooleanLiteralNode {
    return {
      type: ASTNodeType.BOOLEAN_LITERAL,
      value,
      line,
      column
    };
  }

  /**
   * 変数参照ノードを作成
   */
  static createVariableReference(name: string, line: number, column: number): VariableReferenceNode {
    return {
      type: ASTNodeType.VARIABLE_REFERENCE,
      name,
      line,
      column
    };
  }

  // ===== 式ノード =====

  /**
   * 二項式ノードを作成
   */
  static createBinaryExpression(
    left: ExpressionNode,
    operator: BinaryOperator,
    right: ExpressionNode,
    line: number,
    column: number
  ): BinaryExpressionNode {
    return {
      type: ASTNodeType.BINARY_EXPRESSION,
      left,
      operator,
      right,
      line,
      column
    };
  }

  /**
   * 単項式ノードを作成
   */
  static createUnaryExpression(
    operator: UnaryOperator,
    operand: ExpressionNode,
    line: number,
    column: number
  ): UnaryExpressionNode {
    return {
      type: ASTNodeType.UNARY_EXPRESSION,
      operator,
      operand,
      line,
      column
    };
  }

  // ===== 文ノード =====

  /**
   * 変数宣言ノードを作成
   */
  static createVariableDeclaration(
    name: string,
    initializer: ExpressionNode,
    line: number,
    column: number
  ): VariableDeclarationNode {
    return {
      type: ASTNodeType.VARIABLE_DECLARATION,
      name,
      initializer,
      line,
      column
    };
  }

  /**
   * 代入文ノードを作成
   */
  static createAssignmentStatement(
    target: VariableReferenceNode,
    value: ExpressionNode,
    line: number,
    column: number
  ): AssignmentStatementNode {
    return {
      type: ASTNodeType.ASSIGNMENT_STATEMENT,
      target,
      value,
      line,
      column
    };
  }

  /**
   * IF文ノードを作成
   */
  static createIfStatement(
    condition: ExpressionNode,
    thenStatements: StatementNode[],
    elseStatements: StatementNode[] | undefined,
    line: number,
    column: number
  ): IfStatementNode {
    return {
      type: ASTNodeType.IF_STATEMENT,
      condition,
      thenStatements,
      elseStatements,
      line,
      column
    };
  }

  /**
   * REPEAT文ノードを作成
   */
  static createRepeatStatement(
    count: ExpressionNode,
    statements: StatementNode[],
    line: number,
    column: number
  ): RepeatStatementNode {
    return {
      type: ASTNodeType.REPEAT_STATEMENT,
      count,
      statements,
      line,
      column
    };
  }

  /**
   * コマンド文ノードを作成
   */
  static createCommandStatement(
    command: BotCommandNode,
    line: number,
    column: number
  ): CommandStatementNode {
    return {
      type: ASTNodeType.COMMAND_STATEMENT,
      command,
      line,
      column
    };
  }

  // ===== コマンドノード =====

  /**
   * SAYコマンドノードを作成
   */
  static createSayCommand(
    message: ExpressionNode,
    line: number,
    column: number
  ): SayCommandNode {
    return {
      type: ASTNodeType.SAY_COMMAND,
      message,
      line,
      column
    };
  }

  /**
   * MOVEコマンドノードを作成
   */
  static createMoveCommand(
    direction: ExpressionNode,
    distance: ExpressionNode | undefined,
    line: number,
    column: number
  ): MoveCommandNode {
    return {
      type: ASTNodeType.MOVE_COMMAND,
      direction,
      distance,
      line,
      column
    };
  }

  /**
   * GOTOコマンドノードを作成
   */
  static createGotoCommand(
    x: ExpressionNode,
    y: ExpressionNode,
    z: ExpressionNode,
    line: number,
    column: number
  ): GotoCommandNode {
    return {
      type: ASTNodeType.GOTO_COMMAND,
      x,
      y,
      z,
      line,
      column
    };
  }

  /**
   * ATTACKコマンドノードを作成
   */
  static createAttackCommand(
    target: ExpressionNode,
    line: number,
    column: number
  ): AttackCommandNode {
    return {
      type: ASTNodeType.ATTACK_COMMAND,
      target,
      line,
      column
    };
  }

  /**
   * DIGコマンドノードを作成
   */
  static createDigCommand(
    blockType: ExpressionNode | undefined,
    line: number,
    column: number
  ): DigCommandNode {
    return {
      type: ASTNodeType.DIG_COMMAND,
      blockType,
      line,
      column
    };
  }

  /**
   * PLACEコマンドノードを作成
   */
  static createPlaceCommand(
    item: ExpressionNode,
    x: ExpressionNode | undefined,
    y: ExpressionNode | undefined,
    z: ExpressionNode | undefined,
    line: number,
    column: number
  ): PlaceCommandNode {
    return {
      type: ASTNodeType.PLACE_COMMAND,
      item,
      x,
      y,
      z,
      line,
      column
    };
  }

  /**
   * EQUIPコマンドノードを作成
   */
  static createEquipCommand(
    item: ExpressionNode,
    line: number,
    column: number
  ): EquipCommandNode {
    return {
      type: ASTNodeType.EQUIP_COMMAND,
      item,
      line,
      column
    };
  }

  /**
   * DROPコマンドノードを作成
   */
  static createDropCommand(
    item: ExpressionNode,
    count: ExpressionNode | undefined,
    line: number,
    column: number
  ): DropCommandNode {
    return {
      type: ASTNodeType.DROP_COMMAND,
      item,
      count,
      line,
      column
    };
  }

  /**
   * WAITコマンドノードを作成
   */
  static createWaitCommand(
    duration: ExpressionNode,
    line: number,
    column: number
  ): WaitCommandNode {
    return {
      type: ASTNodeType.WAIT_COMMAND,
      duration,
      line,
      column
    };
  }

  // ===== ヘルパーメソッド =====

  /**
   * 変数名から$プレフィックスを除去
   */
  static extractVariableName(variableToken: string): string {
    return variableToken.startsWith('$') ? variableToken.substring(1) : variableToken;
  }

  /**
   * トークンから二項演算子に変換
   */
  static tokenToBinaryOperator(token: string): BinaryOperator {
    switch (token) {
      case '+': return BinaryOperator.ADD;
      case '-': return BinaryOperator.SUBTRACT;
      case '*': return BinaryOperator.MULTIPLY;
      case '/': return BinaryOperator.DIVIDE;
      case '==': return BinaryOperator.EQUALS;
      case '!=': return BinaryOperator.NOT_EQUALS;
      case '<': return BinaryOperator.LESS_THAN;
      case '>': return BinaryOperator.GREATER_THAN;
      case '<=': return BinaryOperator.LESS_EQUALS;
      case '>=': return BinaryOperator.GREATER_EQUALS;
      case 'AND': return BinaryOperator.AND;
      case 'OR': return BinaryOperator.OR;
      default:
        throw new Error(`Unknown binary operator: ${token}`);
    }
  }

  /**
   * トークンから単項演算子に変換
   */
  static tokenToUnaryOperator(token: string): UnaryOperator {
    switch (token) {
      case 'NOT': return UnaryOperator.NOT;
      case '-': return UnaryOperator.MINUS;
      default:
        throw new Error(`Unknown unary operator: ${token}`);
    }
  }
}