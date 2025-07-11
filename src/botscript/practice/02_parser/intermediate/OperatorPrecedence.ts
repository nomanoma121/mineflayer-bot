/**
 * 🟡 02_parser 中級問題1: 演算子優先順位
 * 
 * 演算子の優先順位を正確に処理するパーサーを実装してください。
 * この問題では、数学的な演算順序をASTで正確に表現する方法を学びます。
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

// 変数宣言: DEF $name = expression
export interface VariableDeclarationNode extends StatementNode {
  type: 'VariableDeclaration';
  name: string;
  initializer: ExpressionNode;
}

// 二項演算: left operator right
export interface BinaryExpressionNode extends ExpressionNode {
  type: 'BinaryExpression';
  left: ExpressionNode;
  operator: string;
  right: ExpressionNode;
}

// 単項演算: operator operand
export interface UnaryExpressionNode extends ExpressionNode {
  type: 'UnaryExpression';
  operator: string;
  operand: ExpressionNode;
}

// 数値リテラル
export interface NumberLiteralNode extends ExpressionNode {
  type: 'NumberLiteral';
  value: number;
}

// 変数参照
export interface VariableNode extends ExpressionNode {
  type: 'Variable';
  name: string;
}

// ===== トークン定義 =====

export enum PrecedenceTokenType {
  DEF = 'DEF',
  VARIABLE = 'VARIABLE',
  NUMBER = 'NUMBER',
  ASSIGN = 'ASSIGN',
  
  // 算術演算子
  PLUS = 'PLUS',           // +
  MINUS = 'MINUS',         // -
  MULTIPLY = 'MULTIPLY',   // *
  DIVIDE = 'DIVIDE',       // /
  MODULO = 'MODULO',       // %
  
  // 比較演算子
  EQUAL = 'EQUAL',         // ==
  NOT_EQUAL = 'NOT_EQUAL', // !=
  LESS_THAN = 'LESS_THAN', // <
  GREATER_THAN = 'GREATER_THAN', // >
  
  // 論理演算子
  AND = 'AND',             // AND
  OR = 'OR',               // OR
  NOT = 'NOT',             // NOT
  
  // 括弧
  LEFT_PAREN = 'LEFT_PAREN',   // (
  RIGHT_PAREN = 'RIGHT_PAREN', // )
  
  EOF = 'EOF'
}

export interface PrecedenceToken {
  type: PrecedenceTokenType;
  value: string;
  line: number;
  column: number;
}

// ===== パーサー実装 =====

export class PrecedenceParser {
  private tokens: PrecedenceToken[];
  private current: number = 0;

  constructor(tokens: PrecedenceToken[]) {
    this.tokens = tokens;
  }

  /**
   * プログラム全体を解析します
   * 
   * 実装要件:
   * 1. 複数の変数宣言文を処理
   * 2. 各変数宣言で複雑な式を解析
   */
  public parse(): ProgramNode {
    const statements: StatementNode[] = [];
    
    while (!this.isAtEnd()) {
      const stmt = this.statement();
      statements.push(stmt);
    }
    
    return {
      type: 'Program',
      statements
    };
  }

  /**
   * 文の解析
   */
  private statement(): StatementNode {
    if (this.check(PrecedenceTokenType.DEF)) {
      return this.variableDeclaration();
    }
    
    throw new Error(`Unexpected token: ${this.peek().value} at line ${this.peek().line}`);
  }

  /**
   * 変数宣言の解析
   */
  private variableDeclaration(): VariableDeclarationNode {
    this.consume(PrecedenceTokenType.DEF, 'Expected DEF');
    const nameToken = this.consume(PrecedenceTokenType.VARIABLE, 'Expected variable name');
    this.consume(PrecedenceTokenType.ASSIGN, 'Expected =');
    
    const initializer = this.expression();
    
    return {
      type: 'VariableDeclaration',
      name: nameToken.value,
      initializer,
      line: nameToken.line,
      column: nameToken.column
    };
  }

  /**
   * 式の解析（エントリーポイント）
   * 
   * 実装要件:
   * 1. 最も優先順位の低い演算子から開始
   * 2. 正確な優先順位の階層を実装
   */
  private expression(): ExpressionNode {
    // TODO: 論理OR演算子から開始（最も優先順位が低い）
    // ヒント: 優先順位は OR < AND < 等値 < 比較 < 加減 < 乗除 < 単項 < プライマリ
    
    return this.logical();
  }

  /**
   * 論理演算子の解析（OR, AND）
   * 優先順位: OR < AND
   */
  private logical(): ExpressionNode {
    // TODO: OR演算子の処理を実装
    // ヒント1: まずAND演算子を解析
    // ヒント2: OR演算子があれば左結合で処理
    // ヒント3: while ループで連続するOR演算子を処理
    
    let expr = this.logicalAnd();
    
    while (this.match(PrecedenceTokenType.OR)) {
      const operator = this.previous().value;
      const right = this.logicalAnd();
      expr = {
        type: 'BinaryExpression',
        left: expr,
        operator,
        right,
        line: expr.line,
        column: expr.column
      };
    }
    
    return expr;
  }

  /**
   * 論理AND演算子の解析
   */
  private logicalAnd(): ExpressionNode {
    // TODO: AND演算子の処理を実装
    // ヒント: OR演算子と同様の構造
    
    let expr = this.equality();
    
    // 仮の実装（正しく実装してください）
    return expr;
  }

  /**
   * 等値演算子の解析（==, !=）
   */
  private equality(): ExpressionNode {
    // TODO: 等値演算子の処理を実装
    // ヒント1: 比較演算子を先に解析
    // ヒント2: == と != を処理
    // ヒント3: 左結合性を考慮
    
    let expr = this.comparison();
    
    // 仮の実装（正しく実装してください）
    return expr;
  }

  /**
   * 比較演算子の解析（<, >）
   */
  private comparison(): ExpressionNode {
    // TODO: 比較演算子の処理を実装
    // ヒント: < と > を処理
    
    let expr = this.term();
    
    // 仮の実装（正しく実装してください）
    return expr;
  }

  /**
   * 加算・減算演算子の解析（+, -）
   */
  private term(): ExpressionNode {
    // TODO: 加算・減算演算子の処理を実装
    // ヒント1: 乗除演算子を先に解析
    // ヒント2: + と - を処理
    // ヒント3: 左結合性（1 - 2 - 3 = (1 - 2) - 3）
    
    let expr = this.factor();
    
    while (this.match(PrecedenceTokenType.PLUS, PrecedenceTokenType.MINUS)) {
      const operator = this.previous().value;
      const right = this.factor();
      expr = {
        type: 'BinaryExpression',
        left: expr,
        operator,
        right,
        line: expr.line,
        column: expr.column
      };
    }
    
    return expr;
  }

  /**
   * 乗算・除算・剰余演算子の解析（*, /, %）
   */
  private factor(): ExpressionNode {
    // TODO: 乗除演算子の処理を実装
    // ヒント1: 単項演算子を先に解析
    // ヒント2: *, /, % を処理
    // ヒント3: 左結合性
    
    let expr = this.unary();
    
    // 仮の実装（正しく実装してください）
    return expr;
  }

  /**
   * 単項演算子の解析（-, NOT）
   */
  private unary(): ExpressionNode {
    // TODO: 単項演算子の処理を実装
    // ヒント1: - や NOT があるかチェック
    // ヒント2: 再帰的に unary() を呼び出し（右結合性）
    // ヒント3: UnaryExpressionNode を作成
    
    if (this.match(PrecedenceTokenType.NOT, PrecedenceTokenType.MINUS)) {
      const operator = this.previous().value;
      const right = this.unary();
      return {
        type: 'UnaryExpression',
        operator,
        operand: right,
        line: this.previous().line,
        column: this.previous().column
      };
    }
    
    return this.primary();
  }

  /**
   * プライマリ式の解析（数値、変数、括弧）
   */
  private primary(): ExpressionNode {
    // TODO: プライマリ式の処理を実装
    // ヒント1: 数値リテラル
    // ヒント2: 変数参照
    // ヒント3: 括弧で囲まれた式
    
    if (this.match(PrecedenceTokenType.NUMBER)) {
      const token = this.previous();
      return {
        type: 'NumberLiteral',
        value: parseFloat(token.value),
        line: token.line,
        column: token.column
      };
    }
    
    if (this.match(PrecedenceTokenType.VARIABLE)) {
      const token = this.previous();
      return {
        type: 'Variable',
        name: token.value,
        line: token.line,
        column: token.column
      };
    }
    
    if (this.match(PrecedenceTokenType.LEFT_PAREN)) {
      const expr = this.expression();
      this.consume(PrecedenceTokenType.RIGHT_PAREN, 'Expected ) after expression');
      return expr;
    }
    
    throw new Error(`Unexpected token: ${this.peek().value} at line ${this.peek().line}`);
  }

  // ===== ヘルパーメソッド =====

  private match(...types: PrecedenceTokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: PrecedenceTokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): PrecedenceToken {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === PrecedenceTokenType.EOF;
  }

  private peek(): PrecedenceToken {
    return this.tokens[this.current];
  }

  private previous(): PrecedenceToken {
    return this.tokens[this.current - 1];
  }

  private consume(type: PrecedenceTokenType, message: string): PrecedenceToken {
    if (this.check(type)) return this.advance();

    const current = this.peek();
    throw new Error(`${message}. Got '${current.value}' at line ${current.line}, column ${current.column}`);
  }
}