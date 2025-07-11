import { Token, TokenType } from '../lexer/TokenType';
import {
  ProgramNode,
  StatementNode,
  ExpressionNode,
  BotCommandNode,
  ASTNodeType,
  BinaryOperator,
  UnaryOperator
} from '../ast/ASTNode';
import { ASTFactory } from '../ast/ASTFactory';

/**
 * BotScript言語のパーサー
 * トークン列をASTに変換する再帰下降パーサー
 */
export class Parser {
  private tokens: Token[];
  private current: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  /**
   * トークン列をパースしてASTを生成
   */
  public parse(): ProgramNode {
    const statements: StatementNode[] = [];
    
    while (!this.isAtEnd()) {
      // 改行をスキップ
      if (this.check(TokenType.NEWLINE)) {
        this.advance();
        continue;
      }
      
      const stmt = this.statement();
      if (stmt) {
        statements.push(stmt);
      }
    }
    
    return ASTFactory.createProgram(statements);
  }

  // ===== 文の解析 =====

  /**
   * 文を解析
   */
  private statement(): StatementNode {
    try {
      if (this.match(TokenType.DEF)) {
        return this.variableDeclaration();
      }
      
      if (this.match(TokenType.IF)) {
        return this.ifStatement();
      }
      
      if (this.match(TokenType.REPEAT)) {
        return this.repeatStatement();
      }
      
      // 変数代入をチェック
      if (this.check(TokenType.VARIABLE) && this.checkNext(TokenType.ASSIGN)) {
        return this.assignmentStatement();
      }
      
      // ボットコマンド
      if (this.checkBotCommand()) {
        return this.commandStatement();
      }
      
      // 式文（式を単独で使用）
      const expr = this.expression();
      this.consumeNewlineOrEOF();
      return expr as any; // 式をStatementNodeとして扱う
      
    } catch (error) {
      throw new Error(`Parse error at line ${this.peek().line}, column ${this.peek().column}: ${(error as Error).message}`);
    }
  }

  /**
   * 変数宣言の解析
   * DEF $variable = expression
   */
  private variableDeclaration(): StatementNode {
    const variable = this.consume(TokenType.VARIABLE, 'Expected variable name after DEF');
    this.consume(TokenType.ASSIGN, 'Expected "=" after variable name');
    
    const initializer = this.expression();
    this.consumeNewlineOrEOF();
    
    const varName = ASTFactory.extractVariableName(variable.value);
    return ASTFactory.createVariableDeclaration(
      varName,
      initializer,
      variable.line,
      variable.column
    );
  }

  /**
   * 代入文の解析
   * $variable = expression
   */
  private assignmentStatement(): StatementNode {
    const variable = this.advance(); // VARIABLE token
    this.advance(); // ASSIGN token
    
    const value = this.expression();
    this.consumeNewlineOrEOF();
    
    const varName = ASTFactory.extractVariableName(variable.value);
    const target = ASTFactory.createVariableReference(varName, variable.line, variable.column);
    
    return ASTFactory.createAssignmentStatement(
      target,
      value,
      variable.line,
      variable.column
    );
  }

  /**
   * IF文の解析
   * IF condition THEN statements [ELSE statements] ENDIF
   */
  private ifStatement(): StatementNode {
    const ifToken = this.previous();
    const condition = this.expression();
    
    this.consume(TokenType.THEN, 'Expected THEN after IF condition');
    this.consumeNewlineOrEOF();
    
    const thenStatements = this.statementBlock([TokenType.ELSE, TokenType.ENDIF]);
    
    let elseStatements: StatementNode[] | undefined;
    if (this.match(TokenType.ELSE)) {
      this.consumeNewlineOrEOF();
      elseStatements = this.statementBlock([TokenType.ENDIF]);
    }
    
    this.consume(TokenType.ENDIF, 'Expected ENDIF');
    this.consumeNewlineOrEOF();
    
    return ASTFactory.createIfStatement(
      condition,
      thenStatements,
      elseStatements,
      ifToken.line,
      ifToken.column
    );
  }

  /**
   * REPEAT文の解析
   * REPEAT count statements ENDREPEAT
   */
  private repeatStatement(): StatementNode {
    const repeatToken = this.previous();
    const count = this.expression();
    this.consumeNewlineOrEOF();
    
    const statements = this.statementBlock([TokenType.ENDREPEAT]);
    
    this.consume(TokenType.ENDREPEAT, 'Expected ENDREPEAT');
    this.consumeNewlineOrEOF();
    
    return ASTFactory.createRepeatStatement(
      count,
      statements,
      repeatToken.line,
      repeatToken.column
    );
  }

  /**
   * コマンド文の解析
   */
  private commandStatement(): StatementNode {
    const commandToken = this.advance();
    const command = this.botCommand(commandToken);
    this.consumeNewlineOrEOF();
    
    return ASTFactory.createCommandStatement(
      command,
      commandToken.line,
      commandToken.column
    );
  }

  /**
   * 文のブロックを解析（終了トークンまで）
   */
  private statementBlock(endTokens: TokenType[]): StatementNode[] {
    const statements: StatementNode[] = [];
    
    while (!this.isAtEnd() && !this.checkAny(endTokens)) {
      // 改行をスキップ
      if (this.check(TokenType.NEWLINE)) {
        this.advance();
        continue;
      }
      
      const stmt = this.statement();
      if (stmt) {
        statements.push(stmt);
      }
    }
    
    return statements;
  }

  // ===== 式の解析 =====

  /**
   * 式を解析（最高レベル）
   */
  private expression(): ExpressionNode {
    return this.logicalOr();
  }

  /**
   * 論理OR式の解析
   */
  private logicalOr(): ExpressionNode {
    let expr = this.logicalAnd();
    
    while (this.match(TokenType.OR)) {
      const operator = ASTFactory.tokenToBinaryOperator(this.previous().value);
      const right = this.logicalAnd();
      expr = ASTFactory.createBinaryExpression(expr, operator, right, expr.line, expr.column);
    }
    
    return expr;
  }

  /**
   * 論理AND式の解析
   */
  private logicalAnd(): ExpressionNode {
    let expr = this.equality();
    
    while (this.match(TokenType.AND)) {
      const operator = ASTFactory.tokenToBinaryOperator(this.previous().value);
      const right = this.equality();
      expr = ASTFactory.createBinaryExpression(expr, operator, right, expr.line, expr.column);
    }
    
    return expr;
  }

  /**
   * 等価比較式の解析
   */
  private equality(): ExpressionNode {
    let expr = this.comparison();
    
    while (this.match(TokenType.EQUALS, TokenType.NOT_EQUALS)) {
      const operator = ASTFactory.tokenToBinaryOperator(this.previous().value);
      const right = this.comparison();
      expr = ASTFactory.createBinaryExpression(expr, operator, right, expr.line, expr.column);
    }
    
    return expr;
  }

  /**
   * 大小比較式の解析
   */
  private comparison(): ExpressionNode {
    let expr = this.term();
    
    while (this.match(TokenType.LESS_THAN, TokenType.GREATER_THAN, 
                      TokenType.LESS_EQUALS, TokenType.GREATER_EQUALS)) {
      const operator = ASTFactory.tokenToBinaryOperator(this.previous().value);
      const right = this.term();
      expr = ASTFactory.createBinaryExpression(expr, operator, right, expr.line, expr.column);
    }
    
    return expr;
  }

  /**
   * 加減算式の解析
   */
  private term(): ExpressionNode {
    let expr = this.factor();
    
    while (this.match(TokenType.PLUS, TokenType.MINUS)) {
      const operator = ASTFactory.tokenToBinaryOperator(this.previous().value);
      const right = this.factor();
      expr = ASTFactory.createBinaryExpression(expr, operator, right, expr.line, expr.column);
    }
    
    return expr;
  }

  /**
   * 乗除算式の解析
   */
  private factor(): ExpressionNode {
    let expr = this.unary();
    
    while (this.match(TokenType.MULTIPLY, TokenType.DIVIDE)) {
      const operator = ASTFactory.tokenToBinaryOperator(this.previous().value);
      const right = this.unary();
      expr = ASTFactory.createBinaryExpression(expr, operator, right, expr.line, expr.column);
    }
    
    return expr;
  }

  /**
   * 単項式の解析
   */
  private unary(): ExpressionNode {
    if (this.match(TokenType.NOT, TokenType.MINUS)) {
      const operator = ASTFactory.tokenToUnaryOperator(this.previous().value);
      const right = this.unary();
      return ASTFactory.createUnaryExpression(operator, right, this.previous().line, this.previous().column);
    }
    
    return this.primary();
  }

  /**
   * 基本式の解析
   */
  private primary(): ExpressionNode {
    if (this.match(TokenType.TRUE)) {
      const token = this.previous();
      return ASTFactory.createBooleanLiteral(true, token.line, token.column);
    }
    
    if (this.match(TokenType.FALSE)) {
      const token = this.previous();
      return ASTFactory.createBooleanLiteral(false, token.line, token.column);
    }
    
    if (this.match(TokenType.NUMBER)) {
      const token = this.previous();
      return ASTFactory.createNumberLiteral(parseFloat(token.value), token.line, token.column);
    }
    
    if (this.match(TokenType.STRING)) {
      const token = this.previous();
      return ASTFactory.createStringLiteral(token.value, token.line, token.column);
    }
    
    if (this.match(TokenType.VARIABLE)) {
      const token = this.previous();
      const varName = ASTFactory.extractVariableName(token.value);
      return ASTFactory.createVariableReference(varName, token.line, token.column);
    }
    
    if (this.match(TokenType.LPAREN)) {
      const expr = this.expression();
      this.consume(TokenType.RPAREN, 'Expected ")" after expression');
      return expr;
    }
    
    const current = this.peek();
    throw new Error(`Unexpected token: ${current.value} (${current.type})`);
  }

  // ===== ボットコマンドの解析 =====

  /**
   * ボットコマンドの解析
   */
  private botCommand(commandToken: Token): BotCommandNode {
    switch (commandToken.type) {
      case TokenType.SAY:
        return this.sayCommand(commandToken);
      case TokenType.MOVE:
        return this.moveCommand(commandToken);
      case TokenType.GOTO:
        return this.gotoCommand(commandToken);
      case TokenType.ATTACK:
        return this.attackCommand(commandToken);
      case TokenType.DIG:
        return this.digCommand(commandToken);
      case TokenType.PLACE:
        return this.placeCommand(commandToken);
      case TokenType.EQUIP:
        return this.equipCommand(commandToken);
      case TokenType.DROP:
        return this.dropCommand(commandToken);
      case TokenType.WAIT:
        return this.waitCommand(commandToken);
      default:
        throw new Error(`Unknown command: ${commandToken.value}`);
    }
  }

  private sayCommand(token: Token): BotCommandNode {
    const message = this.expression();
    return ASTFactory.createSayCommand(message, token.line, token.column);
  }

  private moveCommand(token: Token): BotCommandNode {
    const direction = this.expression();
    let distance: ExpressionNode | undefined;
    
    // 次にパースできる式があるかチェック
    if (this.canParseExpression()) {
      distance = this.expression();
    }
    
    return ASTFactory.createMoveCommand(direction, distance, token.line, token.column);
  }

  private gotoCommand(token: Token): BotCommandNode {
    const x = this.expression();
    const y = this.expression();
    const z = this.expression();
    return ASTFactory.createGotoCommand(x, y, z, token.line, token.column);
  }

  private attackCommand(token: Token): BotCommandNode {
    const target = this.expression();
    return ASTFactory.createAttackCommand(target, token.line, token.column);
  }

  private digCommand(token: Token): BotCommandNode {
    let blockType: ExpressionNode | undefined;
    
    // 次にパースできる式があるかチェック
    if (this.canParseExpression()) {
      blockType = this.expression();
    }
    
    return ASTFactory.createDigCommand(blockType, token.line, token.column);
  }

  private placeCommand(token: Token): BotCommandNode {
    const item = this.expression();
    let x: ExpressionNode | undefined;
    let y: ExpressionNode | undefined;
    let z: ExpressionNode | undefined;
    
    if (this.canParseExpression()) {
      x = this.expression();
      y = this.expression();
      z = this.expression();
    }
    
    return ASTFactory.createPlaceCommand(item, x, y, z, token.line, token.column);
  }

  private equipCommand(token: Token): BotCommandNode {
    const item = this.expression();
    return ASTFactory.createEquipCommand(item, token.line, token.column);
  }

  private dropCommand(token: Token): BotCommandNode {
    const item = this.expression();
    let count: ExpressionNode | undefined;
    
    if (this.canParseExpression()) {
      count = this.expression();
    }
    
    return ASTFactory.createDropCommand(item, count, token.line, token.column);
  }

  private waitCommand(token: Token): BotCommandNode {
    const duration = this.expression();
    return ASTFactory.createWaitCommand(duration, token.line, token.column);
  }

  // ===== ヘルパーメソッド =====

  /**
   * 指定したトークンタイプのいずれかにマッチするかチェック
   */
  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  /**
   * 現在のトークンが指定したタイプかチェック
   */
  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  /**
   * 複数のトークンタイプのいずれかにマッチするかチェック
   */
  private checkAny(types: TokenType[]): boolean {
    return types.some(type => this.check(type));
  }

  /**
   * 次のトークンが指定したタイプかチェック
   */
  private checkNext(type: TokenType): boolean {
    if (this.current + 1 >= this.tokens.length) return false;
    return this.tokens[this.current + 1].type === type;
  }

  /**
   * ボットコマンドかチェック
   */
  private checkBotCommand(): boolean {
    const botCommands = [
      TokenType.SAY, TokenType.MOVE, TokenType.GOTO, TokenType.ATTACK,
      TokenType.DIG, TokenType.PLACE, TokenType.EQUIP, TokenType.DROP, TokenType.WAIT
    ];
    return this.checkAny(botCommands);
  }

  /**
   * 改行またはEOFかチェック
   */
  private checkNewlineOrEOF(): boolean {
    return this.check(TokenType.NEWLINE) || this.check(TokenType.EOF);
  }

  /**
   * 現在のトークンを取得して進める
   */
  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  /**
   * 終端に達したかチェック
   */
  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  /**
   * 現在のトークンを取得
   */
  private peek(): Token {
    return this.tokens[this.current];
  }

  /**
   * 前のトークンを取得
   */
  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  /**
   * 指定したタイプのトークンを消費
   */
  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    
    const current = this.peek();
    throw new Error(`${message}. Got ${current.type} (${current.value}) at line ${current.line}, column ${current.column}`);
  }

  /**
   * 改行またはEOFを消費
   */
  private consumeNewlineOrEOF(): void {
    if (this.check(TokenType.NEWLINE)) {
      this.advance();
    } else if (!this.check(TokenType.EOF)) {
      // ステートメントの終わりを期待する場合のみエラーを投げる
      // 式単体の場合はスキップ
    }
  }

  /**
   * 次のトークンが式としてパース可能かチェック
   */
  private canParseExpression(): boolean {
    if (this.checkNewlineOrEOF()) {
      return false;
    }
    
    const current = this.peek();
    
    // 式として有効な開始トークンかチェック
    const validExpressionTokens = [
      TokenType.NUMBER,
      TokenType.STRING,
      TokenType.VARIABLE,
      TokenType.TRUE,
      TokenType.FALSE,
      TokenType.LPAREN,
      TokenType.NOT,
      TokenType.MINUS
    ];
    
    return validExpressionTokens.includes(current.type);
  }
}