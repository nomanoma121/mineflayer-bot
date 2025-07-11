/**
 * 🟡 01_lexer 中級問題1: 複合演算子の処理
 * 
 * 複合演算子（>=, <=, ==, !=）を正確に認識する字句解析器を実装してください。
 * この問題では先読み処理とトークンの区別を学びます。
 */

export enum OperatorTokenType {
  // 基本演算子
  ASSIGN = 'ASSIGN',           // =
  PLUS = 'PLUS',               // +
  MINUS = 'MINUS',             // -
  
  // 複合演算子
  EQUAL = 'EQUAL',             // ==
  NOT_EQUAL = 'NOT_EQUAL',     // !=
  LESS_THAN = 'LESS_THAN',     // <
  GREATER_THAN = 'GREATER_THAN', // >
  LESS_EQUAL = 'LESS_EQUAL',   // <=
  GREATER_EQUAL = 'GREATER_EQUAL', // >=
  
  // リテラル
  NUMBER = 'NUMBER',
  
  // 制御
  EOF = 'EOF'
}

export interface OperatorToken {
  type: OperatorTokenType;
  value: string;
  line: number;
  column: number;
}

export class OperatorLexer {
  private source: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;

  constructor(source: string) {
    this.source = source;
  }

  /**
   * ソースコードをトークン化します
   * 
   * 実装要件:
   * 1. 先読み処理で = と == を区別
   * 2. 複合演算子（<=, >=, ==, !=）の正確な認識
   * 3. 数値リテラルの処理
   * 4. エラーメッセージの詳細化
   */
  public tokenize(): OperatorToken[] {
    const tokens: OperatorToken[] = [];
    
    // TODO: ここに実装してください
    // ヒント1: while (!this.isAtEnd()) でループ
    // ヒント2: 複合演算子は先読みが必要
    // ヒント3: this.match() メソッドを活用
    
    return tokens;
  }

  /**
   * 次のトークンを取得します
   */
  private nextToken(): OperatorToken | null {
    this.skipWhitespace();
    
    if (this.isAtEnd()) {
      return null;
    }

    const startColumn = this.column;
    const char = this.advance();

    switch (char) {
      case '+':
        return this.createToken(OperatorTokenType.PLUS, '+');
      case '-':
        return this.createToken(OperatorTokenType.MINUS, '-');
        
      case '=':
        // TODO: this.match('=') で次の文字が = かチェック
        // == なら EQUAL トークン、= なら ASSIGN トークン
        return this.createToken(OperatorTokenType.ASSIGN, '='); // 仮の実装
        
      case '!':
        // TODO: != の処理を実装
        // ! 単体は無効なので、!= でない場合はエラー
        throw new Error(`Unexpected character: ${char} at line ${this.line}, column ${startColumn}`);
        
      case '<':
        // TODO: <= と < を区別
        return this.createToken(OperatorTokenType.LESS_THAN, '<'); // 仮の実装
        
      case '>':
        // TODO: >= と > を区別
        return this.createToken(OperatorTokenType.GREATER_THAN, '>'); // 仮の実装
        
      default:
        // TODO: 数値の処理
        if (this.isDigit(char)) {
          return this.number();
        }
        
        throw new Error(`Unexpected character: ${char} at line ${this.line}, column ${startColumn}`);
    }
  }

  /**
   * 数値リテラルを処理します
   */
  private number(): OperatorToken {
    const startColumn = this.column - 1;
    let value = this.source[this.position - 1]; // 最初の桁
    
    // TODO: 数値の残りの桁を読み取り
    // ヒント1: this.isDigit() で数字をチェック
    // ヒント2: 小数点の処理は不要
    
    return this.createToken(OperatorTokenType.NUMBER, value, startColumn);
  }

  /**
   * 次の文字が期待する文字と一致するかチェックし、一致する場合は消費します
   */
  private match(expected: string): boolean {
    // TODO: 先読み処理を実装
    // ヒント1: this.isAtEnd() で終端チェック
    // ヒント2: this.source[this.position] で次の文字を確認
    // ヒント3: 一致する場合は this.advance() で消費
    
    return false; // 仮の実装
  }

  // ===== ヘルパーメソッド =====

  private advance(): string {
    const char = this.source[this.position++];
    this.column++;
    return char;
  }

  private isAtEnd(): boolean {
    return this.position >= this.source.length;
  }

  private peek(): string {
    if (this.isAtEnd()) return '\0';
    return this.source[this.position];
  }

  private skipWhitespace(): void {
    while (!this.isAtEnd()) {
      const char = this.peek();
      if (char === ' ' || char === '\t' || char === '\r') {
        this.advance();
      } else if (char === '\n') {
        this.line++;
        this.column = 1;
        this.advance();
      } else {
        break;
      }
    }
  }

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  private createToken(type: OperatorTokenType, value: string, column?: number): OperatorToken {
    return {
      type,
      value,
      line: this.line,
      column: column ?? this.column - value.length
    };
  }
}