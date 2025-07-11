/**
 * 🟢 02_parser 初級問題1: 基本的なAST構築
 * 
 * 基本的なAST（抽象構文木）を構築するパーサーを実装してください。
 * この問題では、変数宣言、基本式、ボットコマンドのAST構築を学びます。
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

// 変数宣言: DEF $name = value
export interface VariableDeclarationNode extends StatementNode {
  type: 'VariableDeclaration';
  name: string;
  initializer: ExpressionNode;
}

// 変数参照: $name
export interface VariableNode extends ExpressionNode {
  type: 'Variable';
  name: string;
}

// 数値リテラル: 42
export interface NumberLiteralNode extends ExpressionNode {
  type: 'NumberLiteral';
  value: number;
}

// 文字列リテラル: "Hello"
export interface StringLiteralNode extends ExpressionNode {
  type: 'StringLiteral';
  value: string;
}

// SAYコマンド: SAY message
export interface SayCommandNode extends StatementNode {
  type: 'SayCommand';
  message: ExpressionNode;
}

// ===== トークン定義 =====

export enum BasicParserTokenType {
  DEF = 'DEF',
  SAY = 'SAY',
  VARIABLE = 'VARIABLE',
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  ASSIGN = 'ASSIGN',
  EOF = 'EOF'
}

export interface BasicParserToken {
  type: BasicParserTokenType;
  value: string;
  line: number;
  column: number;
}

// ===== パーサー実装 =====

export class BasicASTParser {
  private tokens: BasicParserToken[];
  private current: number = 0;

  constructor(tokens: BasicParserToken[]) {
    this.tokens = tokens;
  }

  /**
   * プログラム全体を解析してASTを構築します
   * 
   * 実装要件:
   * 1. 文（statement）のリストを解析
   * 2. ProgramNodeを作成して返す
   * 3. EOFまで全ての文を処理
   */
  public parse(): ProgramNode {
    const statements: StatementNode[] = [];
    
    // TODO: ここに実装してください
    // ヒント1: while (!this.isAtEnd()) でループ
    // ヒント2: this.statement() で各文を解析
    // ヒント3: 解析した文を statements に追加
    
    return {
      type: 'Program',
      statements
    };
  }

  /**
   * 文（statement）を解析します
   */
  private statement(): StatementNode {
    // TODO: トークンの種類に応じて適切な解析メソッドを呼び出し
    // ヒント1: this.check(TokenType.DEF) で変数宣言を判定
    // ヒント2: this.check(TokenType.SAY) でSAYコマンドを判定
    // ヒント3: 不明なトークンの場合はエラーを投げる
    
    if (this.check(BasicParserTokenType.DEF)) {
      return this.variableDeclaration();
    }
    
    if (this.check(BasicParserTokenType.SAY)) {
      return this.sayCommand();
    }
    
    throw new Error(`Unexpected token: ${this.peek().value} at line ${this.peek().line}`);
  }

  /**
   * 変数宣言を解析します: DEF $name = value
   */
  private variableDeclaration(): VariableDeclarationNode {
    // TODO: 変数宣言の解析を実装
    // ヒント1: DEF トークンを消費
    // ヒント2: 変数名トークンを消費
    // ヒント3: = トークンを消費
    // ヒント4: 式を解析
    // ヒント5: VariableDeclarationNode を作成
    
    this.consume(BasicParserTokenType.DEF, 'Expected DEF');
    const nameToken = this.consume(BasicParserTokenType.VARIABLE, 'Expected variable name');
    this.consume(BasicParserTokenType.ASSIGN, 'Expected =');
    
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
   * SAYコマンドを解析します: SAY message
   */
  private sayCommand(): SayCommandNode {
    // TODO: SAYコマンドの解析を実装
    // ヒント1: SAY トークンを消費
    // ヒント2: メッセージ式を解析
    // ヒント3: SayCommandNode を作成
    
    const sayToken = this.consume(BasicParserTokenType.SAY, 'Expected SAY');
    const message = this.expression();
    
    return {
      type: 'SayCommand',
      message,
      line: sayToken.line,
      column: sayToken.column
    };
  }

  /**
   * 式（expression）を解析します
   */
  private expression(): ExpressionNode {
    // TODO: 基本的な式の解析を実装
    // ヒント1: primary() メソッドを呼び出し
    // ヒント2: 現在は単純な式のみ対応
    
    return this.primary();
  }

  /**
   * プライマリ式（数値、文字列、変数）を解析します
   */
  private primary(): ExpressionNode {
    // TODO: プライマリ式の解析を実装
    // ヒント1: トークンの種類に応じて適切なASTノードを作成
    // ヒント2: 数値は parseFloat() で変換
    // ヒント3: 位置情報も設定
    
    if (this.match(BasicParserTokenType.NUMBER)) {
      const token = this.previous();
      return {
        type: 'NumberLiteral',
        value: parseFloat(token.value),
        line: token.line,
        column: token.column
      };
    }
    
    if (this.match(BasicParserTokenType.STRING)) {
      const token = this.previous();
      return {
        type: 'StringLiteral',
        value: token.value,
        line: token.line,
        column: token.column
      };
    }
    
    if (this.match(BasicParserTokenType.VARIABLE)) {
      const token = this.previous();
      return {
        type: 'Variable',
        name: token.value,
        line: token.line,
        column: token.column
      };
    }
    
    throw new Error(`Unexpected token: ${this.peek().value} at line ${this.peek().line}`);
  }

  // ===== ヘルパーメソッド =====

  /**
   * 指定されたトークンタイプと一致するかチェックして、一致する場合は消費します
   */
  private match(...types: BasicParserTokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  /**
   * 現在のトークンが指定されたタイプかチェックします
   */
  private check(type: BasicParserTokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  /**
   * 現在のトークンを消費して次に進みます
   */
  private advance(): BasicParserToken {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  /**
   * 入力の終端に達したかチェックします
   */
  private isAtEnd(): boolean {
    return this.peek().type === BasicParserTokenType.EOF;
  }

  /**
   * 現在のトークンを返します
   */
  private peek(): BasicParserToken {
    return this.tokens[this.current];
  }

  /**
   * 前のトークンを返します
   */
  private previous(): BasicParserToken {
    return this.tokens[this.current - 1];
  }

  /**
   * 指定されたトークンタイプを期待して消費します
   */
  private consume(type: BasicParserTokenType, message: string): BasicParserToken {
    if (this.check(type)) return this.advance();

    const current = this.peek();
    throw new Error(`${message}. Got '${current.value}' at line ${current.line}, column ${current.column}`);
  }
}