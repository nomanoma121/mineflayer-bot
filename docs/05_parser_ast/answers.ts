/**
 * 05_parser_ast 解答ファイル
 * 
 * すべての難易度レベルの完全な解答実装
 */

// ===== 初級解答 (easy.ts) =====

export interface ASTNode {
  type: string;
  accept(visitor: ASTVisitor): any;
}

export interface ASTVisitor {
  visitProgram(node: ProgramNode): any;
  visitVariableDeclaration(node: VariableDeclarationNode): any;
  visitFunctionDeclaration(node: FunctionDeclarationNode): any;
  visitBinaryExpression(node: BinaryExpressionNode): any;
  visitUnaryExpression(node: UnaryExpressionNode): any;
  visitCallExpression(node: CallExpressionNode): any;
  visitIfStatement(node: IfStatementNode): any;
  visitWhileStatement(node: WhileStatementNode): any;
  visitBlockStatement(node: BlockStatementNode): any;
  visitReturnStatement(node: ReturnStatementNode): any;
  visitIdentifier(node: IdentifierNode): any;
  visitLiteral(node: LiteralNode): any;
}

export class ProgramNode implements ASTNode {
  type = 'Program';
  
  constructor(public statements: ASTNode[]) {}

  accept(visitor: ASTVisitor): any {
    return visitor.visitProgram(this);
  }

  addStatement(statement: ASTNode): void {
    this.statements.push(statement);
  }

  getStatements(): ASTNode[] {
    return [...this.statements];
  }

  getStatementCount(): number {
    return this.statements.length;
  }

  toString(): string {
    return this.statements.map(stmt => stmt.toString()).join('\n');
  }
}

export class VariableDeclarationNode implements ASTNode {
  type = 'VariableDeclaration';
  
  constructor(
    public name: string,
    public initializer: ASTNode
  ) {}

  accept(visitor: ASTVisitor): any {
    return visitor.visitVariableDeclaration(this);
  }

  toString(): string {
    return `DEF ${this.name} = ${this.initializer.toString()}`;
  }
}

export class FunctionDeclarationNode implements ASTNode {
  type = 'FunctionDeclaration';
  
  constructor(
    public name: string,
    public parameters: string[],
    public body: ASTNode
  ) {}

  accept(visitor: ASTVisitor): any {
    return visitor.visitFunctionDeclaration(this);
  }

  getParameterCount(): number {
    return this.parameters.length;
  }

  hasParameter(name: string): boolean {
    return this.parameters.includes(name);
  }

  toString(): string {
    const params = this.parameters.join(', ');
    return `FUNCTION ${this.name}(${params})\n${this.body.toString()}\nENDFUNCTION`;
  }
}

export class BinaryExpressionNode implements ASTNode {
  type = 'BinaryExpression';
  
  constructor(
    public left: ASTNode,
    public operator: string,
    public right: ASTNode
  ) {}

  accept(visitor: ASTVisitor): any {
    return visitor.visitBinaryExpression(this);
  }

  isArithmetic(): boolean {
    return ['+', '-', '*', '/', '%'].includes(this.operator);
  }

  isComparison(): boolean {
    return ['==', '!=', '<', '>', '<=', '>='].includes(this.operator);
  }

  isLogical(): boolean {
    return ['&&', '||'].includes(this.operator);
  }

  toString(): string {
    return `(${this.left.toString()} ${this.operator} ${this.right.toString()})`;
  }
}

export class IdentifierNode implements ASTNode {
  type = 'Identifier';
  
  constructor(public name: string) {}

  accept(visitor: ASTVisitor): any {
    return visitor.visitIdentifier(this);
  }

  toString(): string {
    return this.name;
  }
}

export class LiteralNode implements ASTNode {
  type = 'Literal';
  
  constructor(public value: any) {}

  accept(visitor: ASTVisitor): any {
    return visitor.visitLiteral(this);
  }

  isNumber(): boolean {
    return typeof this.value === 'number';
  }

  isString(): boolean {
    return typeof this.value === 'string';
  }

  isBoolean(): boolean {
    return typeof this.value === 'boolean';
  }

  toString(): string {
    if (typeof this.value === 'string') {
      return `"${this.value}"`;
    }
    return String(this.value);
  }
}

export class IfStatementNode implements ASTNode {
  type = 'IfStatement';
  
  constructor(
    public condition: ASTNode,
    public thenStatement: ASTNode,
    public elseStatement?: ASTNode
  ) {}

  accept(visitor: ASTVisitor): any {
    return visitor.visitIfStatement(this);
  }

  hasElse(): boolean {
    return this.elseStatement !== undefined;
  }

  toString(): string {
    let result = `IF ${this.condition.toString()}\n${this.thenStatement.toString()}`;
    if (this.elseStatement) {
      result += `\nELSE\n${this.elseStatement.toString()}`;
    }
    result += '\nENDIF';
    return result;
  }
}

export class ReturnStatementNode implements ASTNode {
  type = 'ReturnStatement';
  
  constructor(public expression?: ASTNode) {}

  accept(visitor: ASTVisitor): any {
    return visitor.visitReturnStatement(this);
  }

  hasValue(): boolean {
    return this.expression !== undefined;
  }

  toString(): string {
    return this.expression ? `RETURN ${this.expression.toString()}` : 'RETURN';
  }
}

export interface Token {
  type: string;
  value: string;
  line?: number;
  column?: number;
}

export class RecursiveDescentParser {
  protected current: number = 0;

  constructor(protected tokens: Token[]) {}

  /**
   * プログラム全体をパースします
   */
  parseProgram(): ProgramNode {
    const statements: ASTNode[] = [];
    
    while (!this.isAtEnd()) {
      const stmt = this.parseStatement();
      if (stmt) {
        statements.push(stmt);
      }
    }
    
    return new ProgramNode(statements);
  }

  /**
   * 文をパースします
   */
  parseStatement(): ASTNode | null {
    if (this.match('DEF')) {
      return this.parseVariableDeclaration();
    }
    
    if (this.match('FUNCTION')) {
      return this.parseFunctionDeclaration();
    }
    
    if (this.match('IF')) {
      return this.parseIfStatement();
    }
    
    if (this.match('RETURN')) {
      return this.parseReturnStatement();
    }
    
    // 式文として処理
    return this.parseExpression();
  }

  /**
   * 変数宣言をパースします
   */
  parseVariableDeclaration(): VariableDeclarationNode {
    const name = this.consume('IDENTIFIER', 'Expected variable name').value;
    this.consume('ASSIGN', 'Expected "="');
    const initializer = this.parseExpression();
    
    return new VariableDeclarationNode(name, initializer);
  }

  /**
   * 関数宣言をパースします
   */
  parseFunctionDeclaration(): FunctionDeclarationNode {
    const name = this.consume('IDENTIFIER', 'Expected function name').value;
    this.consume('LPAREN', 'Expected "("');
    
    const parameters: string[] = [];
    if (!this.check('RPAREN')) {
      do {
        parameters.push(this.consume('IDENTIFIER', 'Expected parameter name').value);
      } while (this.match('COMMA'));
    }
    
    this.consume('RPAREN', 'Expected ")"');
    
    const body = this.parseStatement() || new ProgramNode([]);
    
    return new FunctionDeclarationNode(name, parameters, body);
  }

  /**
   * IF文をパースします
   */
  parseIfStatement(): IfStatementNode {
    const condition = this.parseExpression();
    const thenStatement = this.parseStatement() || new ProgramNode([]);
    
    let elseStatement: ASTNode | undefined;
    if (this.match('ELSE')) {
      elseStatement = this.parseStatement() || new ProgramNode([]);
    }
    
    this.match('ENDIF'); // オプション
    
    return new IfStatementNode(condition, thenStatement, elseStatement);
  }

  /**
   * RETURN文をパースします
   */
  parseReturnStatement(): ReturnStatementNode {
    let expression: ASTNode | undefined;
    
    if (!this.check('SEMICOLON') && !this.isAtEnd()) {
      expression = this.parseExpression();
    }
    
    return new ReturnStatementNode(expression);
  }

  /**
   * 式をパースします
   */
  parseExpression(): ASTNode {
    return this.parseLogicalOr();
  }

  /**
   * 論理OR式をパースします
   */
  private parseLogicalOr(): ASTNode {
    let expr = this.parseLogicalAnd();
    
    while (this.match('OR')) {
      const operator = this.previous().value;
      const right = this.parseLogicalAnd();
      expr = new BinaryExpressionNode(expr, operator, right);
    }
    
    return expr;
  }

  /**
   * 論理AND式をパースします
   */
  private parseLogicalAnd(): ASTNode {
    let expr = this.parseEquality();
    
    while (this.match('AND')) {
      const operator = this.previous().value;
      const right = this.parseEquality();
      expr = new BinaryExpressionNode(expr, operator, right);
    }
    
    return expr;
  }

  /**
   * 等価性比較をパースします
   */
  private parseEquality(): ASTNode {
    let expr = this.parseComparison();
    
    while (this.match('EQUAL', 'NOT_EQUAL')) {
      const operator = this.previous().value;
      const right = this.parseComparison();
      expr = new BinaryExpressionNode(expr, operator, right);
    }
    
    return expr;
  }

  /**
   * 比較式をパースします
   */
  private parseComparison(): ASTNode {
    let expr = this.parseTerm();
    
    while (this.match('GREATER', 'GREATER_EQUAL', 'LESS', 'LESS_EQUAL')) {
      const operator = this.previous().value;
      const right = this.parseTerm();
      expr = new BinaryExpressionNode(expr, operator, right);
    }
    
    return expr;
  }

  /**
   * 項をパースします
   */
  private parseTerm(): ASTNode {
    let expr = this.parseFactor();
    
    while (this.match('MINUS', 'PLUS')) {
      const operator = this.previous().value;
      const right = this.parseFactor();
      expr = new BinaryExpressionNode(expr, operator, right);
    }
    
    return expr;
  }

  /**
   * 因子をパースします
   */
  private parseFactor(): ASTNode {
    let expr = this.parseUnary();
    
    while (this.match('SLASH', 'STAR')) {
      const operator = this.previous().value;
      const right = this.parseUnary();
      expr = new BinaryExpressionNode(expr, operator, right);
    }
    
    return expr;
  }

  /**
   * 単項式をパースします
   */
  private parseUnary(): ASTNode {
    if (this.match('BANG', 'MINUS')) {
      const operator = this.previous().value;
      const right = this.parseUnary();
      return new UnaryExpressionNode(operator, right);
    }
    
    return this.parsePrimary();
  }

  /**
   * 一次式をパースします
   */
  private parsePrimary(): ASTNode {
    if (this.match('TRUE')) {
      return new LiteralNode(true);
    }
    
    if (this.match('FALSE')) {
      return new LiteralNode(false);
    }
    
    if (this.match('NUMBER')) {
      return new LiteralNode(Number(this.previous().value));
    }
    
    if (this.match('STRING')) {
      return new LiteralNode(this.previous().value);
    }
    
    if (this.match('IDENTIFIER')) {
      return new IdentifierNode(this.previous().value);
    }
    
    if (this.match('LPAREN')) {
      const expr = this.parseExpression();
      this.consume('RPAREN', 'Expected ")" after expression');
      return expr;
    }
    
    throw new Error(`Unexpected token: ${this.peek().value}`);
  }

  // ユーティリティメソッド
  protected match(...types: string[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  protected check(type: string): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  protected advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  protected isAtEnd(): boolean {
    return this.current >= this.tokens.length || this.peek().type === 'EOF';
  }

  protected peek(): Token {
    return this.tokens[this.current] || { type: 'EOF', value: '' };
  }

  protected previous(): Token {
    return this.tokens[this.current - 1];
  }

  protected currentToken(): Token {
    return this.peek();
  }

  protected consume(type: string, message: string): Token {
    if (this.check(type)) return this.advance();
    
    const current = this.peek();
    throw new Error(`${message}. Got ${current.type}(${current.value}) at line ${current.line || 'unknown'}`);
  }
}

export class UnaryExpressionNode implements ASTNode {
  type = 'UnaryExpression';
  
  constructor(
    public operator: string,
    public operand: ASTNode
  ) {}

  accept(visitor: ASTVisitor): any {
    return visitor.visitUnaryExpression(this);
  }

  toString(): string {
    return `${this.operator}${this.operand.toString()}`;
  }
}

export class CallExpressionNode implements ASTNode {
  type = 'CallExpression';
  
  constructor(
    public callee: ASTNode,
    public args: ASTNode[]
  ) {}

  accept(visitor: ASTVisitor): any {
    return visitor.visitCallExpression(this);
  }

  getArgumentCount(): number {
    return this.args.length;
  }

  toString(): string {
    const argsStr = this.args.map(arg => arg.toString()).join(', ');
    return `${this.callee.toString()}(${argsStr})`;
  }
}

export class WhileStatementNode implements ASTNode {
  type = 'WhileStatement';
  
  constructor(
    public condition: ASTNode,
    public body: ASTNode
  ) {}

  accept(visitor: ASTVisitor): any {
    return visitor.visitWhileStatement(this);
  }

  toString(): string {
    return `WHILE ${this.condition.toString()}\n${this.body.toString()}\nENDWHILE`;
  }
}

export class BlockStatementNode implements ASTNode {
  type = 'BlockStatement';
  
  constructor(public statements: ASTNode[]) {}

  accept(visitor: ASTVisitor): any {
    return visitor.visitBlockStatement(this);
  }

  addStatement(statement: ASTNode): void {
    this.statements.push(statement);
  }

  getStatementCount(): number {
    return this.statements.length;
  }

  toString(): string {
    return this.statements.map(stmt => `  ${stmt.toString()}`).join('\n');
  }
}

// ===== 中級解答 (normal.ts) =====
// (中級の主要クラスの完全実装)

export interface AdvancedASTNode extends ASTNode {
  parent?: AdvancedASTNode;
  children: AdvancedASTNode[];
  metadata: Map<string, any>;
  sourceLocation?: SourceLocation;
}

export class SourceLocation {
  constructor(
    public start: Position,
    public end: Position,
    public source?: string
  ) {}

  contains(position: Position): boolean {
    return (
      position.line >= this.start.line &&
      position.line <= this.end.line &&
      (position.line !== this.start.line || position.column >= this.start.column) &&
      (position.line !== this.end.line || position.column <= this.end.column)
    );
  }

  toString(): string {
    return `${this.start.toString()}-${this.end.toString()}`;
  }
}

export class Position {
  constructor(
    public line: number,
    public column: number
  ) {}

  toString(): string {
    return `${this.line}:${this.column}`;
  }

  equals(other: Position): boolean {
    return this.line === other.line && this.column === other.column;
  }
}

// ===== 上級解答 (hard.ts) =====
// (上級の主要クラスの抜粋実装)

export class IncrementalParser {
  private astCache: Map<string, CachedAST> = new Map();
  private syntaxTree: SyntaxTree = new SyntaxTree();
  private changeTracker: ChangeTracker = new ChangeTracker();
  private parseMetrics: ParseMetrics = new ParseMetrics();

  parseIncremental(source: string, changes: TextChange[]): IncrementalParseResult {
    const startTime = performance.now();
    this.parseMetrics.reset();
    
    const affectedRange = this.changeTracker.calculateAffectedRange(changes);
    const affectedNodes = this.syntaxTree.findNodesInRange(affectedRange);
    
    this.invalidateCache(affectedNodes);
    const reparsedNodes = this.reparseAffectedNodes(affectedNodes, source);
    this.syntaxTree.updateNodes(reparsedNodes);
    
    const endTime = performance.now();
    this.parseMetrics.recordTime(endTime - startTime);
    
    return new IncrementalParseResult(
      this.syntaxTree.getRoot(),
      affectedRange,
      reparsedNodes,
      this.parseMetrics.getSnapshot()
    );
  }

  private invalidateCache(affectedNodes: AdvancedASTNode[]): void {
    for (const node of affectedNodes) {
      const cacheKey = this.generateCacheKey(node);
      this.astCache.delete(cacheKey);
    }
  }

  private reparseAffectedNodes(affectedNodes: AdvancedASTNode[], source: string): AdvancedASTNode[] {
    return []; // 簡略化
  }

  private generateCacheKey(node: AdvancedASTNode): string {
    return `${node.type}_${node.sourceLocation?.toString() || 'unknown'}`;
  }
}

// 補助クラス
export class CachedAST {
  constructor(
    public node: AdvancedASTNode,
    public source: string,
    public timestamp: number = Date.now()
  ) {}
}

export class SyntaxTree {
  private root: AdvancedASTNode | null = null;

  setRoot(root: AdvancedASTNode): void {
    this.root = root;
  }

  getRoot(): AdvancedASTNode | null {
    return this.root;
  }

  findNodesInRange(range: TextRange): AdvancedASTNode[] {
    return []; // 簡略化
  }

  updateNodes(newNodes: AdvancedASTNode[]): void {
    // 簡略化
  }
}

export class ChangeTracker {
  calculateAffectedRange(changes: TextChange[]): TextRange {
    if (changes.length === 0) {
      return new TextRange(new Position(1, 1), new Position(1, 1));
    }
    
    let minLine = Number.MAX_SAFE_INTEGER;
    let minColumn = Number.MAX_SAFE_INTEGER;
    let maxLine = 0;
    let maxColumn = 0;
    
    for (const change of changes) {
      if (change.range.start.line < minLine || 
          (change.range.start.line === minLine && change.range.start.column < minColumn)) {
        minLine = change.range.start.line;
        minColumn = change.range.start.column;
      }
      
      if (change.range.end.line > maxLine || 
          (change.range.end.line === maxLine && change.range.end.column > maxColumn)) {
        maxLine = change.range.end.line;
        maxColumn = change.range.end.column;
      }
    }
    
    return new TextRange(
      new Position(minLine, minColumn),
      new Position(maxLine, maxColumn)
    );
  }
}

export class TextRange {
  constructor(
    public start: Position,
    public end: Position
  ) {}
}

export class TextChange {
  constructor(
    public range: TextRange,
    public text: string
  ) {}
}

export class ParseMetrics {
  private parseTime = 0;
  private nodesCreated = 0;
  private errorsRecovered = 0;

  reset(): void {
    this.parseTime = 0;
    this.nodesCreated = 0;
    this.errorsRecovered = 0;
  }

  recordTime(time: number): void {
    this.parseTime = time;
  }

  getSnapshot(): ParseMetricsSnapshot {
    return new ParseMetricsSnapshot(
      this.parseTime,
      this.nodesCreated,
      this.errorsRecovered
    );
  }
}

export class ParseMetricsSnapshot {
  constructor(
    public parseTime: number,
    public nodesCreated: number,
    public errorsRecovered: number
  ) {}
}

export class IncrementalParseResult {
  constructor(
    public ast: AdvancedASTNode | null,
    public affectedRange: TextRange,
    public reparsedNodes: AdvancedASTNode[],
    public metrics: ParseMetricsSnapshot
  ) {}
}

// AST Visitor実装例
export class PrintVisitor implements ASTVisitor {
  private indent = 0;

  visitProgram(node: ProgramNode): string {
    const result = ['Program:'];
    this.indent++;
    for (const stmt of node.statements) {
      result.push(this.getIndent() + stmt.accept(this));
    }
    this.indent--;
    return result.join('\n');
  }

  visitVariableDeclaration(node: VariableDeclarationNode): string {
    return `VariableDeclaration: ${node.name} = ${node.initializer.accept(this)}`;
  }

  visitFunctionDeclaration(node: FunctionDeclarationNode): string {
    const params = node.parameters.join(', ');
    return `FunctionDeclaration: ${node.name}(${params})`;
  }

  visitBinaryExpression(node: BinaryExpressionNode): string {
    return `BinaryExpression: ${node.left.accept(this)} ${node.operator} ${node.right.accept(this)}`;
  }

  visitUnaryExpression(node: UnaryExpressionNode): string {
    return `UnaryExpression: ${node.operator}${node.operand.accept(this)}`;
  }

  visitCallExpression(node: CallExpressionNode): string {
    const args = node.args.map(arg => arg.accept(this)).join(', ');
    return `CallExpression: ${node.callee.accept(this)}(${args})`;
  }

  visitIfStatement(node: IfStatementNode): string {
    let result = `IfStatement: condition=${node.condition.accept(this)}`;
    if (node.elseStatement) {
      result += `, else=${node.elseStatement.accept(this)}`;
    }
    return result;
  }

  visitWhileStatement(node: WhileStatementNode): string {
    return `WhileStatement: condition=${node.condition.accept(this)}`;
  }

  visitBlockStatement(node: BlockStatementNode): string {
    return `BlockStatement: ${node.statements.length} statements`;
  }

  visitReturnStatement(node: ReturnStatementNode): string {
    return node.expression ? 
      `ReturnStatement: ${node.expression.accept(this)}` : 
      'ReturnStatement: void';
  }

  visitIdentifier(node: IdentifierNode): string {
    return node.name;
  }

  visitLiteral(node: LiteralNode): string {
    return String(node.value);
  }

  private getIndent(): string {
    return '  '.repeat(this.indent);
  }
}