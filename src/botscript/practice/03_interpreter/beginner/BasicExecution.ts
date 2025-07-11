/**
 * 🟢 03_interpreter 初級問題1: 基本的なAST実行
 * 
 * 基本的なASTノードを実行するインタプリタを実装してください。
 * この問題では、Visitorパターンと環境管理の基礎を学びます。
 */

// ===== AST ノード定義 =====

export interface ASTNode {
  type: string;
  line?: number;
  column?: number;
}

export interface ProgramNode extends ASTNode {
  type: 'Program';
  statements: StatementNode[];
}

export interface StatementNode extends ASTNode {}
export interface ExpressionNode extends ASTNode {}

export interface VariableDeclarationNode extends StatementNode {
  type: 'VariableDeclaration';
  name: string;
  initializer: ExpressionNode;
}

export interface SayCommandNode extends StatementNode {
  type: 'SayCommand';
  message: ExpressionNode;
}

export interface NumberLiteralNode extends ExpressionNode {
  type: 'NumberLiteral';
  value: number;
}

export interface StringLiteralNode extends ExpressionNode {
  type: 'StringLiteral';
  value: string;
}

export interface VariableNode extends ExpressionNode {
  type: 'Variable';
  name: string;
}

// ===== 環境管理 =====

export class Environment {
  private variables: Map<string, any> = new Map();

  /**
   * 変数を定義します
   */
  public define(name: string, value: any): void {
    this.variables.set(name, value);
  }

  /**
   * 変数の値を取得します
   */
  public get(name: string): any {
    if (this.variables.has(name)) {
      return this.variables.get(name);
    }
    throw new Error(`Undefined variable: ${name}`);
  }

  /**
   * 全ての変数を取得します（デバッグ用）
   */
  public getAll(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of this.variables) {
      result[key] = value;
    }
    return result;
  }

  /**
   * 変数が定義されているかチェックします
   */
  public has(name: string): boolean {
    return this.variables.has(name);
  }
}

// ===== Visitorインターフェース =====

export interface ASTVisitor {
  visitProgram(node: ProgramNode): any;
  visitVariableDeclaration(node: VariableDeclarationNode): any;
  visitSayCommand(node: SayCommandNode): any;
  visitNumberLiteral(node: NumberLiteralNode): any;
  visitStringLiteral(node: StringLiteralNode): any;
  visitVariable(node: VariableNode): any;
}

// ===== 実行結果 =====

export interface ExecutionResult {
  output: string[];        // SAYコマンドの出力
  variables: Record<string, any>; // 最終的な変数状態
  errors: string[];        // 実行エラー
}

// ===== インタプリタ実装 =====

export class BasicInterpreter implements ASTVisitor {
  private environment: Environment;
  private output: string[] = [];
  private errors: string[] = [];

  constructor() {
    this.environment = new Environment();
  }

  /**
   * プログラム全体を実行します
   * 
   * 実装要件:
   * 1. 各文を順次実行
   * 2. エラーが発生しても継続
   * 3. 実行結果を収集
   */
  public interpret(program: ProgramNode): ExecutionResult {
    this.output = [];
    this.errors = [];
    
    // TODO: ここに実装してください
    // ヒント1: program.statements をループ
    // ヒント2: 各文に対して this.execute() を呼び出し
    // ヒント3: try-catch でエラーハンドリング
    
    return {
      output: this.output,
      variables: this.environment.getAll(),
      errors: this.errors
    };
  }

  /**
   * 任意のASTノードを実行します
   */
  private execute(node: ASTNode): any {
    // TODO: ノードタイプに応じた適切なvisitメソッドを呼び出し
    // ヒント1: this.visit(node) でVisitorパターンを使用
    // ヒント2: 動的メソッド呼び出し: this[`visit${node.type}`](node)
    
    return this.visit(node);
  }

  /**
   * Visitorパターンのディスパッチャ
   */
  private visit(node: ASTNode): any {
    const method = `visit${node.type}` as keyof this;
    if (typeof this[method] === 'function') {
      return (this[method] as Function)(node);
    }
    throw new Error(`Unknown node type: ${node.type}`);
  }

  // ===== Visitor メソッド =====

  public visitProgram(node: ProgramNode): void {
    // TODO: 全ての文を実行
    // ヒント: node.statements.forEach() を使用
    
    for (const statement of node.statements) {
      this.execute(statement);
    }
  }

  public visitVariableDeclaration(node: VariableDeclarationNode): void {
    // TODO: 変数宣言の実行
    // ヒント1: 初期化式を評価
    // ヒント2: 環境に変数を定義
    
    const value = this.execute(node.initializer);
    this.environment.define(node.name, value);
  }

  public visitSayCommand(node: SayCommandNode): void {
    // TODO: SAYコマンドの実行
    // ヒント1: メッセージ式を評価
    // ヒント2: 結果を文字列に変換
    // ヒント3: this.output に追加
    
    const message = this.execute(node.message);
    this.output.push(String(message));
  }

  public visitNumberLiteral(node: NumberLiteralNode): number {
    // TODO: 数値リテラルの評価
    // ヒント: そのまま値を返す
    
    return node.value;
  }

  public visitStringLiteral(node: StringLiteralNode): string {
    // TODO: 文字列リテラルの評価
    // ヒント: そのまま値を返す
    
    return node.value;
  }

  public visitVariable(node: VariableNode): any {
    // TODO: 変数参照の評価
    // ヒント1: 環境から変数を取得
    // ヒント2: 未定義の場合はエラー
    
    try {
      return this.environment.get(node.name);
    } catch (error) {
      throw new Error(`Undefined variable: ${node.name} at line ${node.line}`);
    }
  }

  // ===== ヘルパーメソッド =====

  /**
   * エラーを記録します
   */
  private recordError(message: string): void {
    this.errors.push(message);
  }

  /**
   * 現在の環境を取得します（デバッグ用）
   */
  public getEnvironment(): Environment {
    return this.environment;
  }

  /**
   * 出力をクリアします
   */
  public clearOutput(): void {
    this.output = [];
  }
}