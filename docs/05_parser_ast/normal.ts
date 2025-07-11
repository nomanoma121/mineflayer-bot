/**
 * 🟡 05_parser_ast 中級問題: 高度な構文解析とAST構築実装
 * 
 * より複雑な構文解析機能とAST操作を実装してください。
 * この問題では、エラー回復、AST変換、最適化機能を学びます。
 */

// ===== 高度なASTノード =====

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

// ===== 式ノードの高度実装 =====

export class BinaryExpressionNode implements AdvancedASTNode {
  type = 'BinaryExpression';
  parent?: AdvancedASTNode;
  children: AdvancedASTNode[];
  metadata: Map<string, any> = new Map();
  sourceLocation?: SourceLocation;

  constructor(
    public left: AdvancedASTNode,
    public operator: string,
    public right: AdvancedASTNode
  ) {
    this.children = [left, right];
    this.left.parent = this;
    this.right.parent = this;
  }

  /**
   * 二項式の優先度を取得します
   */
  getPrecedence(): number {
    // TODO: 演算子の優先度計算
    // ヒント1: 演算子による優先度の差
    // ヒント2: 結合性の考慮
    // ヒント3: カスタム優先度の設定
    
    const precedenceMap = new Map([
      ['||', 1],
      ['&&', 2],
      ['==', 3], ['!=', 3],
      ['<', 4], ['>', 4], ['<=', 4], ['>=', 4],
      ['+', 5], ['-', 5],
      ['*', 6], ['/', 6], ['%', 6]
    ]);
    
    return precedenceMap.get(this.operator) || 0;
  }

  /**
   * 式を簡約化します
   */
  simplify(): AdvancedASTNode {
    // TODO: 代数的簡約化
    // ヒント1: 定数畳み込み
    // ヒント2: 恒等式の適用
    // ヒント3: 交換則・結合則
    
    const simplifiedLeft = this.left.simplify ? this.left.simplify() : this.left;
    const simplifiedRight = this.right.simplify ? this.right.simplify() : this.right;
    
    // 定数畳み込み
    if (simplifiedLeft instanceof LiteralNode && simplifiedRight instanceof LiteralNode) {
      const leftValue = simplifiedLeft.value;
      const rightValue = simplifiedRight.value;
      
      try {
        let result: any;
        switch (this.operator) {
          case '+': result = leftValue + rightValue; break;
          case '-': result = leftValue - rightValue; break;
          case '*': result = leftValue * rightValue; break;
          case '/': result = leftValue / rightValue; break;
          case '==': result = leftValue === rightValue; break;
          case '!=': result = leftValue !== rightValue; break;
          case '<': result = leftValue < rightValue; break;
          case '>': result = leftValue > rightValue; break;
          case '<=': result = leftValue <= rightValue; break;
          case '>=': result = leftValue >= rightValue; break;
          case '&&': result = leftValue && rightValue; break;
          case '||': result = leftValue || rightValue; break;
          default: throw new Error(`Unknown operator: ${this.operator}`);
        }
        
        return new LiteralNode(result);
      } catch {
        // 計算できない場合は元の式を返す
      }
    }
    
    // 恒等式の適用
    if (this.operator === '+' && simplifiedRight instanceof LiteralNode && simplifiedRight.value === 0) {
      return simplifiedLeft;
    }
    if (this.operator === '*' && simplifiedRight instanceof LiteralNode && simplifiedRight.value === 1) {
      return simplifiedLeft;
    }
    
    return new BinaryExpressionNode(simplifiedLeft, this.operator, simplifiedRight);
  }

  accept(visitor: ASTVisitor): any {
    return visitor.visitBinaryExpression(this);
  }
}

export class UnaryExpressionNode implements AdvancedASTNode {
  type = 'UnaryExpression';
  parent?: AdvancedASTNode;
  children: AdvancedASTNode[];
  metadata: Map<string, any> = new Map();
  sourceLocation?: SourceLocation;

  constructor(
    public operator: string,
    public operand: AdvancedASTNode
  ) {
    this.children = [operand];
    this.operand.parent = this;
  }

  /**
   * 単項式を簡約化します
   */
  simplify(): AdvancedASTNode {
    const simplifiedOperand = this.operand.simplify ? this.operand.simplify() : this.operand;
    
    // 定数畳み込み
    if (simplifiedOperand instanceof LiteralNode) {
      const value = simplifiedOperand.value;
      
      try {
        let result: any;
        switch (this.operator) {
          case '-': result = -value; break;
          case '+': result = +value; break;
          case '!': result = !value; break;
          default: throw new Error(`Unknown unary operator: ${this.operator}`);
        }
        
        return new LiteralNode(result);
      } catch {
        // 計算できない場合は元の式を返す
      }
    }
    
    return new UnaryExpressionNode(this.operator, simplifiedOperand);
  }

  accept(visitor: ASTVisitor): any {
    return visitor.visitUnaryExpression(this);
  }
}

export class CallExpressionNode implements AdvancedASTNode {
  type = 'CallExpression';
  parent?: AdvancedASTNode;
  children: AdvancedASTNode[];
  metadata: Map<string, any> = new Map();
  sourceLocation?: SourceLocation;

  constructor(
    public callee: AdvancedASTNode,
    public args: AdvancedASTNode[]
  ) {
    this.children = [callee, ...args];
    this.callee.parent = this;
    this.args.forEach(arg => arg.parent = this);
  }

  /**
   * 引数の型を検証します
   */
  validateArgumentTypes(): TypeValidationResult {
    // TODO: 引数の型検証
    // ヒント1: 関数シグネチャとの照合
    // ヒント2: 型強制の可能性
    // ヒント3: オーバーロード解決
    
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // 引数数のチェック
    if (this.callee instanceof IdentifierNode) {
      const expectedArgCount = this.getExpectedArgumentCount(this.callee.name);
      if (expectedArgCount !== -1 && this.args.length !== expectedArgCount) {
        errors.push(`Function ${this.callee.name} expects ${expectedArgCount} arguments, got ${this.args.length}`);
      }
    }
    
    return new TypeValidationResult(errors, warnings);
  }

  private getExpectedArgumentCount(functionName: string): number {
    // 組み込み関数の引数数
    const builtinFunctions = new Map([
      ['SAY', 1],
      ['MOVE', 2],
      ['GOTO', 3],
      ['WAIT', 1]
    ]);
    
    return builtinFunctions.get(functionName) || -1;
  }

  accept(visitor: ASTVisitor): any {
    return visitor.visitCallExpression(this);
  }
}

// ===== 文ノードの高度実装 =====

export class BlockStatementNode implements AdvancedASTNode {
  type = 'BlockStatement';
  parent?: AdvancedASTNode;
  children: AdvancedASTNode[];
  metadata: Map<string, any> = new Map();
  sourceLocation?: SourceLocation;

  constructor(public statements: AdvancedASTNode[]) {
    this.children = statements;
    this.statements.forEach(stmt => stmt.parent = this);
  }

  /**
   * ブロックスコープを取得します
   */
  getScope(): SymbolTable {
    // TODO: ブロックスコープの構築
    // ヒント1: 変数宣言の収集
    // ヒント2: ネストしたスコープの処理
    // ヒント3: シャドウイングの検出
    
    const scope = new SymbolTable(this.parent ? this.getParentScope() : null);
    
    for (const stmt of this.statements) {
      if (stmt instanceof VariableDeclarationNode) {
        scope.define(stmt.name, {
          type: 'variable',
          node: stmt,
          mutable: true
        });
      } else if (stmt instanceof FunctionDeclarationNode) {
        scope.define(stmt.name, {
          type: 'function',
          node: stmt,
          mutable: false
        });
      }
    }
    
    return scope;
  }

  private getParentScope(): SymbolTable | null {
    let current = this.parent;
    while (current) {
      if (current instanceof BlockStatementNode || current instanceof FunctionDeclarationNode) {
        return current.getScope();
      }
      current = current.parent;
    }
    return null;
  }

  /**
   * 到達不可能なコードを検出します
   */
  findUnreachableCode(): AdvancedASTNode[] {
    // TODO: 到達不可能コードの検出
    // ヒント1: return文後の処理
    // ヒント2: 条件文の分析
    // ヒント3: 無限ループの検出
    
    const unreachable: AdvancedASTNode[] = [];
    let hasReturn = false;
    
    for (let i = 0; i < this.statements.length; i++) {
      const stmt = this.statements[i];
      
      if (hasReturn) {
        unreachable.push(stmt);
        continue;
      }
      
      if (stmt instanceof ReturnStatementNode) {
        hasReturn = true;
      } else if (stmt instanceof IfStatementNode) {
        const alwaysReturns = this.checkAlwaysReturns(stmt);
        if (alwaysReturns) {
          hasReturn = true;
        }
      }
    }
    
    return unreachable;
  }

  private checkAlwaysReturns(ifStmt: IfStatementNode): boolean {
    const thenReturns = this.blockAlwaysReturns(ifStmt.thenStatement);
    const elseReturns = ifStmt.elseStatement ? this.blockAlwaysReturns(ifStmt.elseStatement) : false;
    
    return thenReturns && elseReturns;
  }

  private blockAlwaysReturns(stmt: AdvancedASTNode): boolean {
    if (stmt instanceof ReturnStatementNode) {
      return true;
    } else if (stmt instanceof BlockStatementNode) {
      return stmt.statements.some(s => this.blockAlwaysReturns(s));
    }
    return false;
  }

  accept(visitor: ASTVisitor): any {
    return visitor.visitBlockStatement(this);
  }
}

export class IfStatementNode implements AdvancedASTNode {
  type = 'IfStatement';
  parent?: AdvancedASTNode;
  children: AdvancedASTNode[];
  metadata: Map<string, any> = new Map();
  sourceLocation?: SourceLocation;

  constructor(
    public condition: AdvancedASTNode,
    public thenStatement: AdvancedASTNode,
    public elseStatement?: AdvancedASTNode
  ) {
    this.children = this.elseStatement ? 
      [condition, thenStatement, elseStatement] : 
      [condition, thenStatement];
    
    this.condition.parent = this;
    this.thenStatement.parent = this;
    if (this.elseStatement) {
      this.elseStatement.parent = this;
    }
  }

  /**
   * 条件式を最適化します
   */
  optimizeCondition(): AdvancedASTNode {
    // TODO: 条件式の最適化
    // ヒント1: 定数条件の除去
    // ヒント2: ド・モルガンの法則
    // ヒント3: 短絡評価の活用
    
    const optimizedCondition = this.condition.simplify ? this.condition.simplify() : this.condition;
    
    // 定数条件の処理
    if (optimizedCondition instanceof LiteralNode) {
      if (optimizedCondition.value) {
        // 常にtrue -> then部分のみ実行
        return this.thenStatement;
      } else {
        // 常にfalse -> else部分のみ実行（あれば）
        return this.elseStatement || new BlockStatementNode([]);
      }
    }
    
    return new IfStatementNode(optimizedCondition, this.thenStatement, this.elseStatement);
  }

  accept(visitor: ASTVisitor): any {
    return visitor.visitIfStatement(this);
  }
}

export class WhileStatementNode implements AdvancedASTNode {
  type = 'WhileStatement';
  parent?: AdvancedASTNode;
  children: AdvancedASTNode[];
  metadata: Map<string, any> = new Map();
  sourceLocation?: SourceLocation;

  constructor(
    public condition: AdvancedASTNode,
    public body: AdvancedASTNode
  ) {
    this.children = [condition, body];
    this.condition.parent = this;
    this.body.parent = this;
  }

  /**
   * 無限ループかチェックします
   */
  isInfiniteLoop(): boolean {
    // TODO: 無限ループの検出
    // ヒント1: 条件式の分析
    // ヒント2: ループ変数の変更
    // ヒント3: break文の存在
    
    // 条件が定数trueの場合
    if (this.condition instanceof LiteralNode && this.condition.value === true) {
      return !this.hasBreakStatement();
    }
    
    return false;
  }

  private hasBreakStatement(): boolean {
    // 簡略化された実装
    return false;
  }

  accept(visitor: ASTVisitor): any {
    return visitor.visitWhileStatement(this);
  }
}

// ===== エラー回復パーサー =====

export class ErrorRecoveryParser extends RecursiveDescentParser {
  private errors: ParseError[] = [];
  private recoveryStrategies: Map<string, RecoveryStrategy> = new Map();

  constructor(tokens: Token[]) {
    super(tokens);
    this.setupRecoveryStrategies();
  }

  /**
   * エラー回復戦略を設定します
   */
  private setupRecoveryStrategies(): void {
    // TODO: エラー回復戦略の設定
    // ヒント1: 同期トークンの選択
    // ヒント2: 文レベルの回復
    // ヒント3: 式レベルの回復
    
    this.recoveryStrategies.set('statement', new StatementRecoveryStrategy());
    this.recoveryStrategies.set('expression', new ExpressionRecoveryStrategy());
    this.recoveryStrategies.set('block', new BlockRecoveryStrategy());
  }

  /**
   * エラーから回復します
   */
  recoverFromError(expectedType: string): boolean {
    // TODO: エラー回復の実行
    // ヒント1: 現在の状況の分析
    // ヒント2: 適切な戦略の選択
    // ヒント3: 同期ポイントの検索
    
    const strategy = this.recoveryStrategies.get(expectedType);
    if (strategy) {
      const recoveryPoint = strategy.findRecoveryPoint(this.tokens, this.current);
      if (recoveryPoint !== -1) {
        this.current = recoveryPoint;
        return true;
      }
    }
    
    // フォールバック: 次のセミコロンまでスキップ
    while (this.current < this.tokens.length && this.currentToken().value !== ';') {
      this.current++;
    }
    if (this.currentToken().value === ';') {
      this.current++;
    }
    
    return true;
  }

  /**
   * パース文を保護して実行します
   */
  protected parseStatementSafe(): AdvancedASTNode | null {
    try {
      return this.parseStatement();
    } catch (error) {
      this.reportError(error instanceof Error ? error.message : 'Parse error');
      if (this.recoverFromError('statement')) {
        return this.parseStatement();
      }
      return null;
    }
  }

  /**
   * エラーを報告します
   */
  private reportError(message: string): void {
    const token = this.currentToken();
    const error = new ParseError(
      message,
      token.line || 1,
      token.column || 1,
      this.current
    );
    this.errors.push(error);
  }

  /**
   * エラーリストを取得します
   */
  getErrors(): ParseError[] {
    return [...this.errors];
  }
}

// ===== エラー回復戦略 =====

export interface RecoveryStrategy {
  findRecoveryPoint(tokens: Token[], currentPosition: number): number;
}

export class StatementRecoveryStrategy implements RecoveryStrategy {
  findRecoveryPoint(tokens: Token[], currentPosition: number): number {
    const statementKeywords = ['IF', 'WHILE', 'FOR', 'DEF', 'FUNCTION'];
    
    for (let i = currentPosition + 1; i < tokens.length; i++) {
      const token = tokens[i];
      if (statementKeywords.includes(token.value.toUpperCase())) {
        return i;
      }
      if (token.value === ';' || token.value === '}') {
        return i + 1;
      }
    }
    
    return -1;
  }
}

export class ExpressionRecoveryStrategy implements RecoveryStrategy {
  findRecoveryPoint(tokens: Token[], currentPosition: number): number {
    const operators = ['+', '-', '*', '/', '==', '!=', '<', '>', '&&', '||'];
    
    for (let i = currentPosition + 1; i < tokens.length; i++) {
      const token = tokens[i];
      if (operators.includes(token.value)) {
        return i + 1;
      }
      if ([';', ')', '}', ','].includes(token.value)) {
        return i;
      }
    }
    
    return -1;
  }
}

export class BlockRecoveryStrategy implements RecoveryStrategy {
  findRecoveryPoint(tokens: Token[], currentPosition: number): number {
    let braceLevel = 0;
    
    for (let i = currentPosition + 1; i < tokens.length; i++) {
      const token = tokens[i];
      if (token.value === '{') {
        braceLevel++;
      } else if (token.value === '}') {
        if (braceLevel === 0) {
          return i + 1;
        }
        braceLevel--;
      }
    }
    
    return -1;
  }
}

// ===== AST変換器 =====

export class ASTTransformer {
  private transformations: Map<string, TransformFunction> = new Map();

  constructor() {
    this.setupDefaultTransformations();
  }

  /**
   * デフォルトの変換を設定します
   */
  private setupDefaultTransformations(): void {
    // TODO: AST変換の設定
    // ヒント1: ノード型による変換
    // ヒント2: パターンマッチング
    // ヒント3: 条件付き変換
    
    this.transformations.set('ConstantFolding', this.constantFolding.bind(this));
    this.transformations.set('DeadCodeElimination', this.deadCodeElimination.bind(this));
    this.transformations.set('CommonSubexpressionElimination', this.commonSubexpressionElimination.bind(this));
  }

  /**
   * ASTを変換します
   */
  transform(node: AdvancedASTNode, transformationName: string): AdvancedASTNode {
    const transformation = this.transformations.get(transformationName);
    if (!transformation) {
      throw new Error(`Unknown transformation: ${transformationName}`);
    }
    
    return transformation(node);
  }

  /**
   * 定数畳み込み変換
   */
  private constantFolding(node: AdvancedASTNode): AdvancedASTNode {
    // 子ノードを先に変換
    const transformedChildren = node.children.map(child => this.constantFolding(child));
    
    if (node instanceof BinaryExpressionNode) {
      const newNode = new BinaryExpressionNode(
        transformedChildren[0],
        node.operator,
        transformedChildren[1]
      );
      return newNode.simplify();
    }
    
    // 他のノード型の処理...
    return node;
  }

  /**
   * デッドコード除去変換
   */
  private deadCodeElimination(node: AdvancedASTNode): AdvancedASTNode {
    if (node instanceof BlockStatementNode) {
      const unreachable = node.findUnreachableCode();
      const reachableStatements = node.statements.filter(stmt => !unreachable.includes(stmt));
      return new BlockStatementNode(reachableStatements);
    }
    
    return node;
  }

  /**
   * 共通部分式除去変換
   */
  private commonSubexpressionElimination(node: AdvancedASTNode): AdvancedASTNode {
    // 簡略化された実装
    return node;
  }
}

export type TransformFunction = (node: AdvancedASTNode) => AdvancedASTNode;

// ===== シンボルテーブル =====

export class SymbolTable {
  private symbols: Map<string, SymbolInfo> = new Map();

  constructor(private parent: SymbolTable | null = null) {}

  /**
   * シンボルを定義します
   */
  define(name: string, info: SymbolInfo): void {
    if (this.symbols.has(name)) {
      throw new Error(`Symbol ${name} is already defined in this scope`);
    }
    this.symbols.set(name, info);
  }

  /**
   * シンボルを検索します
   */
  lookup(name: string): SymbolInfo | null {
    if (this.symbols.has(name)) {
      return this.symbols.get(name)!;
    }
    
    if (this.parent) {
      return this.parent.lookup(name);
    }
    
    return null;
  }

  /**
   * 現在のスコープにシンボルが存在するかチェックします
   */
  hasLocal(name: string): boolean {
    return this.symbols.has(name);
  }

  /**
   * すべてのシンボルを取得します
   */
  getAllSymbols(): Map<string, SymbolInfo> {
    const allSymbols = new Map<string, SymbolInfo>();
    
    if (this.parent) {
      for (const [name, info] of this.parent.getAllSymbols()) {
        allSymbols.set(name, info);
      }
    }
    
    for (const [name, info] of this.symbols) {
      allSymbols.set(name, info);
    }
    
    return allSymbols;
  }
}

export interface SymbolInfo {
  type: 'variable' | 'function' | 'parameter';
  node: AdvancedASTNode;
  mutable: boolean;
  dataType?: string;
}

// ===== 型検証 =====

export class TypeValidationResult {
  constructor(
    public errors: string[],
    public warnings: string[]
  ) {}

  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  hasWarnings(): boolean {
    return this.warnings.length > 0;
  }
}

// ===== パースエラー =====

export class ParseError {
  constructor(
    public message: string,
    public line: number,
    public column: number,
    public position: number
  ) {}

  toString(): string {
    return `Parse Error at ${this.line}:${this.column}: ${this.message}`;
  }
}

// ===== デモクラス =====

export class AdvancedParserDemo {
  /**
   * 高度な構文解析機能のデモを実行します
   */
  public static runDemo(): void {
    console.log('=== Advanced Parser Demo ===');

    // 複雑なBotScriptコード
    const complexCode = `
      FUNCTION calculateDamage(baseDamage, multiplier, critChance)
        IF critChance > random()
          DEF result = baseDamage * multiplier * 1.5
        ELSE
          DEF result = baseDamage * multiplier
        ENDIF
        
        WHILE result > 100
          DEF result = result - 10
        ENDWHILE
        
        RETURN result
      ENDFUNCTION
      
      DEF playerDamage = calculateDamage(25, 1.2, 0.15)
      IF playerDamage > 50
        SAY "High damage!"
      ENDIF
    `;

    // エラー回復パーサーのテスト
    console.log('\n--- Error Recovery Parser Test ---');
    try {
      // 実際の実装では、まずレキサーでトークン化
      const mockTokens = [
        { type: 'KEYWORD', value: 'IF', line: 1, column: 1 },
        { type: 'IDENTIFIER', value: 'health', line: 1, column: 4 },
        { type: 'OPERATOR', value: '>', line: 1, column: 10 },
        { type: 'NUMBER', value: '50', line: 1, column: 12 }
      ];
      
      const parser = new ErrorRecoveryParser(mockTokens as Token[]);
      console.log('Error recovery parser initialized');
    } catch (error) {
      console.log('Parser setup completed');
    }

    // AST変換のテスト
    console.log('\n--- AST Transformation Test ---');
    const transformer = new ASTTransformer();
    
    // サンプルAST構築
    const literalLeft = new LiteralNode(5);
    const literalRight = new LiteralNode(3);
    const binaryExpr = new BinaryExpressionNode(literalLeft, '+', literalRight);
    
    console.log('Original expression:', binaryExpr.type);
    
    const optimized = transformer.transform(binaryExpr, 'ConstantFolding');
    console.log('Optimized expression:', optimized.type);
    
    if (optimized instanceof LiteralNode) {
      console.log('Constant folding result:', optimized.value);
    }

    // シンボルテーブルのテスト
    console.log('\n--- Symbol Table Test ---');
    const symbolTable = new SymbolTable();
    
    symbolTable.define('health', {
      type: 'variable',
      node: new VariableDeclarationNode('health', new LiteralNode(100)),
      mutable: true,
      dataType: 'number'
    });
    
    const healthSymbol = symbolTable.lookup('health');
    console.log('Symbol lookup result:', healthSymbol ? 'Found' : 'Not found');
    
    // ネストしたスコープのテスト
    const childScope = new SymbolTable(symbolTable);
    childScope.define('localVar', {
      type: 'variable',
      node: new VariableDeclarationNode('localVar', new LiteralNode(42)),
      mutable: true
    });
    
    const localSymbol = childScope.lookup('localVar');
    const parentSymbol = childScope.lookup('health');
    console.log('Local symbol:', localSymbol ? 'Found' : 'Not found');
    console.log('Parent symbol from child:', parentSymbol ? 'Found' : 'Not found');

    // ソースロケーションのテスト
    console.log('\n--- Source Location Test ---');
    const startPos = new Position(1, 5);
    const endPos = new Position(1, 15);
    const location = new SourceLocation(startPos, endPos);
    
    const testPos = new Position(1, 10);
    console.log(`Position ${testPos.toString()} is in range:`, location.contains(testPos));

    console.log('\nAdvanced parser demo completed');
  }
}

// 必要なインポート（easy.tsから）
import { 
  ASTNode, 
  Token, 
  RecursiveDescentParser, 
  ASTVisitor,
  LiteralNode,
  IdentifierNode,
  VariableDeclarationNode,
  FunctionDeclarationNode,
  ReturnStatementNode
} from './easy';