/**
 * BotScript言語のAST（抽象構文木）ノード定義
 * パースされたBotScriptプログラムの構造を表現する
 */

export enum ASTNodeType {
  // プログラム構造
  PROGRAM = 'PROGRAM',
  STATEMENT_LIST = 'STATEMENT_LIST',
  
  // リテラル
  NUMBER_LITERAL = 'NUMBER_LITERAL',
  STRING_LITERAL = 'STRING_LITERAL',
  BOOLEAN_LITERAL = 'BOOLEAN_LITERAL',
  VARIABLE_REFERENCE = 'VARIABLE_REFERENCE',
  
  // 式
  BINARY_EXPRESSION = 'BINARY_EXPRESSION',
  UNARY_EXPRESSION = 'UNARY_EXPRESSION',
  
  // 文
  VARIABLE_DECLARATION = 'VARIABLE_DECLARATION',
  ASSIGNMENT_STATEMENT = 'ASSIGNMENT_STATEMENT',
  IF_STATEMENT = 'IF_STATEMENT',
  REPEAT_STATEMENT = 'REPEAT_STATEMENT',
  COMMAND_STATEMENT = 'COMMAND_STATEMENT',
  
  // ボットコマンド
  SAY_COMMAND = 'SAY_COMMAND',
  MOVE_COMMAND = 'MOVE_COMMAND',
  GOTO_COMMAND = 'GOTO_COMMAND',
  ATTACK_COMMAND = 'ATTACK_COMMAND',
  DIG_COMMAND = 'DIG_COMMAND',
  PLACE_COMMAND = 'PLACE_COMMAND',
  EQUIP_COMMAND = 'EQUIP_COMMAND',
  DROP_COMMAND = 'DROP_COMMAND',
  WAIT_COMMAND = 'WAIT_COMMAND',
}

/**
 * ASTノードの基底インターフェース
 */
export interface ASTNode {
  type: ASTNodeType;
  line: number;
  column: number;
}

/**
 * プログラム全体を表すノード
 */
export interface ProgramNode extends ASTNode {
  type: ASTNodeType.PROGRAM;
  statements: StatementNode[];
}

/**
 * 文のベースインターフェース
 */
export interface StatementNode extends ASTNode {
  // 共通のフィールドは ASTNode から継承
}

/**
 * 式のベースインターフェース
 */
export interface ExpressionNode extends ASTNode {
  // 共通のフィールドは ASTNode から継承
}

// ===== リテラルノード =====

/**
 * 数値リテラル
 */
export interface NumberLiteralNode extends ExpressionNode {
  type: ASTNodeType.NUMBER_LITERAL;
  value: number;
}

/**
 * 文字列リテラル
 */
export interface StringLiteralNode extends ExpressionNode {
  type: ASTNodeType.STRING_LITERAL;
  value: string;
}

/**
 * 真偽値リテラル
 */
export interface BooleanLiteralNode extends ExpressionNode {
  type: ASTNodeType.BOOLEAN_LITERAL;
  value: boolean;
}

/**
 * 変数参照
 */
export interface VariableReferenceNode extends ExpressionNode {
  type: ASTNodeType.VARIABLE_REFERENCE;
  name: string; // $health → "health"
}

// ===== 式ノード =====

/**
 * 二項演算子の種類
 */
export enum BinaryOperator {
  // 算術演算子
  ADD = '+',
  SUBTRACT = '-',
  MULTIPLY = '*',
  DIVIDE = '/',
  
  // 比較演算子
  EQUALS = '==',
  NOT_EQUALS = '!=',
  LESS_THAN = '<',
  GREATER_THAN = '>',
  LESS_EQUALS = '<=',
  GREATER_EQUALS = '>=',
  
  // 論理演算子
  AND = 'AND',
  OR = 'OR',
}

/**
 * 二項式
 */
export interface BinaryExpressionNode extends ExpressionNode {
  type: ASTNodeType.BINARY_EXPRESSION;
  left: ExpressionNode;
  operator: BinaryOperator;
  right: ExpressionNode;
}

/**
 * 単項演算子の種類
 */
export enum UnaryOperator {
  NOT = 'NOT',
  MINUS = '-',
}

/**
 * 単項式
 */
export interface UnaryExpressionNode extends ExpressionNode {
  type: ASTNodeType.UNARY_EXPRESSION;
  operator: UnaryOperator;
  operand: ExpressionNode;
}

// ===== 文ノード =====

/**
 * 変数宣言文
 * DEF $health = 20
 */
export interface VariableDeclarationNode extends StatementNode {
  type: ASTNodeType.VARIABLE_DECLARATION;
  name: string; // $health → "health"
  initializer: ExpressionNode;
}

/**
 * 代入文
 * $health = 15
 */
export interface AssignmentStatementNode extends StatementNode {
  type: ASTNodeType.ASSIGNMENT_STATEMENT;
  target: VariableReferenceNode;
  value: ExpressionNode;
}

/**
 * IF文
 * IF condition THEN statements [ELSE statements] ENDIF
 */
export interface IfStatementNode extends StatementNode {
  type: ASTNodeType.IF_STATEMENT;
  condition: ExpressionNode;
  thenStatements: StatementNode[];
  elseStatements?: StatementNode[];
}

/**
 * REPEAT文
 * REPEAT count statements ENDREPEAT
 */
export interface RepeatStatementNode extends StatementNode {
  type: ASTNodeType.REPEAT_STATEMENT;
  count: ExpressionNode;
  statements: StatementNode[];
}

// ===== コマンドノード =====

/**
 * コマンド文の基底インターフェース
 */
export interface CommandStatementNode extends StatementNode {
  type: ASTNodeType.COMMAND_STATEMENT;
  command: BotCommandNode;
}

/**
 * ボットコマンドの基底インターフェース
 */
export interface BotCommandNode extends ASTNode {
  // 実装はサブクラスで行う
}

/**
 * SAYコマンド
 * SAY "hello world"
 * SAY $message
 */
export interface SayCommandNode extends BotCommandNode {
  type: ASTNodeType.SAY_COMMAND;
  message: ExpressionNode;
}

/**
 * MOVEコマンド
 * MOVE "forward" 5
 * MOVE "up" $distance
 */
export interface MoveCommandNode extends BotCommandNode {
  type: ASTNodeType.MOVE_COMMAND;
  direction: ExpressionNode; // "forward", "backward", "left", "right", "up", "down"
  distance?: ExpressionNode; // オプション：距離
}

/**
 * GOTOコマンド
 * GOTO 100 64 200
 * GOTO $x $y $z
 */
export interface GotoCommandNode extends BotCommandNode {
  type: ASTNodeType.GOTO_COMMAND;
  x: ExpressionNode;
  y: ExpressionNode;
  z: ExpressionNode;
}

/**
 * ATTACKコマンド
 * ATTACK "zombie"
 * ATTACK $target
 */
export interface AttackCommandNode extends BotCommandNode {
  type: ASTNodeType.ATTACK_COMMAND;
  target: ExpressionNode;
}

/**
 * DIGコマンド
 * DIG "stone"
 * DIG $block_type
 */
export interface DigCommandNode extends BotCommandNode {
  type: ASTNodeType.DIG_COMMAND;
  blockType?: ExpressionNode; // オプション：ブロックタイプ
}

/**
 * PLACEコマンド
 * PLACE "stone" 100 64 200
 * PLACE $item $x $y $z
 */
export interface PlaceCommandNode extends BotCommandNode {
  type: ASTNodeType.PLACE_COMMAND;
  item: ExpressionNode;
  x?: ExpressionNode; // オプション：座標
  y?: ExpressionNode;
  z?: ExpressionNode;
}

/**
 * EQUIPコマンド
 * EQUIP "sword"
 * EQUIP $item
 */
export interface EquipCommandNode extends BotCommandNode {
  type: ASTNodeType.EQUIP_COMMAND;
  item: ExpressionNode;
}

/**
 * DROPコマンド
 * DROP "stone" 10
 * DROP $item $count
 */
export interface DropCommandNode extends BotCommandNode {
  type: ASTNodeType.DROP_COMMAND;
  item: ExpressionNode;
  count?: ExpressionNode; // オプション：個数
}

/**
 * WAITコマンド
 * WAIT 5
 * WAIT $seconds
 */
export interface WaitCommandNode extends BotCommandNode {
  type: ASTNodeType.WAIT_COMMAND;
  duration: ExpressionNode; // 秒数
}

// ===== ヘルパー型定義 =====

/**
 * 全ての式ノードのユニオン型
 */
export type Expression = 
  | NumberLiteralNode
  | StringLiteralNode
  | BooleanLiteralNode
  | VariableReferenceNode
  | BinaryExpressionNode
  | UnaryExpressionNode;

/**
 * 全ての文ノードのユニオン型
 */
export type Statement = 
  | VariableDeclarationNode
  | AssignmentStatementNode
  | IfStatementNode
  | RepeatStatementNode
  | CommandStatementNode;

/**
 * 全てのコマンドノードのユニオン型
 */
export type BotCommand = 
  | SayCommandNode
  | MoveCommandNode
  | GotoCommandNode
  | AttackCommandNode
  | DigCommandNode
  | PlaceCommandNode
  | EquipCommandNode
  | DropCommandNode
  | WaitCommandNode;