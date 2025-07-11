/**
 * 🔴 01_lexer 上級問題1: エラー回復機能
 * 
 * エラー回復機能を持つ字句解析器を実装してください。
 * この問題では、一つのエラーで解析を停止せず、
 * 可能な限り解析を継続してすべてのエラーを報告する方法を学びます。
 */

export enum RecoveryTokenType {
  // キーワード
  SAY = 'SAY',
  MOVE = 'MOVE',
  IF = 'IF',
  THEN = 'THEN',
  ENDIF = 'ENDIF',
  
  // リテラル
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  VARIABLE = 'VARIABLE',
  
  // 演算子
  ASSIGN = 'ASSIGN',
  EQUAL = 'EQUAL',
  PLUS = 'PLUS',
  
  // 制御
  NEWLINE = 'NEWLINE',
  EOF = 'EOF',
  
  // エラー
  ERROR = 'ERROR'
}

export interface RecoveryToken {
  type: RecoveryTokenType;
  value: string;
  line: number;
  column: number;
  error?: string; // エラートークンの場合のエラーメッセージ
}

export interface LexingResult {
  tokens: RecoveryToken[];
  errors: string[];
  hasErrors: boolean;
}

export class ErrorRecoveryLexer {
  private source: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;
  private errors: string[] = [];

  constructor(source: string) {
    this.source = source;
  }

  /**
   * エラー回復機能付きでトークン化します
   * 
   * 実装要件:
   * 1. エラーが発生しても解析を継続
   * 2. すべてのエラーを収集
   * 3. エラートークンとして不正な文字を記録
   * 4. パニックモード回復の実装
   * 5. 詳細なエラー報告
   */
  public tokenizeWithErrorRecovery(): LexingResult {
    const tokens: RecoveryToken[] = [];
    this.errors = [];
    
    // TODO: ここに実装してください
    // ヒント1: try-catch でエラーをキャッチ
    // ヒント2: エラー時はERRORトークンを生成
    // ヒント3: this.synchronize() でエラー回復
    // ヒント4: 解析継続のためのスキップロジック
    
    return {
      tokens,
      errors: this.errors,
      hasErrors: this.errors.length > 0
    };
  }

  /**
   * 次のトークンを取得します（エラー処理付き）
   */
  private nextTokenSafe(): RecoveryToken | null {
    try {
      return this.nextToken();
    } catch (error) {
      // TODO: エラーを記録してERRORトークンを生成
      // ヒント1: this.errors にエラーメッセージを追加
      // ヒント2: 現在の文字をスキップしてERRORトークンを返す
      // ヒント3: this.synchronize() でエラー回復
      
      return null; // 仮の実装
    }
  }

  /**
   * 通常のトークン処理
   */
  private nextToken(): RecoveryToken | null {
    this.skipWhitespace();
    
    if (this.isAtEnd()) {
      return null;
    }

    const startColumn = this.column;
    const char = this.advance();

    switch (char) {
      case '\n':
        return this.createToken(RecoveryTokenType.NEWLINE, '\n');
      case '+':
        return this.createToken(RecoveryTokenType.PLUS, '+');
      case '=':
        if (this.match('=')) {
          return this.createToken(RecoveryTokenType.EQUAL, '==');
        }
        return this.createToken(RecoveryTokenType.ASSIGN, '=');
      case '"':
        return this.string();
      case '$':
        return this.variable();
      default:
        if (this.isDigit(char)) {
          return this.number();
        }
        if (this.isAlpha(char)) {
          return this.identifier();
        }
        
        throw new Error(`Unexpected character: ${char} at line ${this.line}, column ${startColumn}`);
    }
  }

  /**
   * パニックモード回復
   * エラー発生時に適切な回復ポイントまでスキップします
   */
  private synchronize(): void {
    // TODO: エラー回復のためのスキップロジックを実装
    // ヒント1: 改行まで進む
    // ヒント2: キーワードが見つかるまで進む
    // ヒント3: 文の境界を見つける
    
    this.advance(); // 最低限エラー文字をスキップ
  }

  /**
   * 文字列の処理（エラー処理付き）
   */
  private string(): RecoveryToken {
    const startColumn = this.column - 1;
    let value = '';
    
    // TODO: 終端のない文字列のエラー処理
    // ヒント1: EOFチェック
    // ヒント2: エラー時はERRORトークンを返す
    // ヒント3: 部分的な文字列も保持
    
    while (!this.isAtEnd() && this.peek() !== '"') {
      if (this.peek() === '\n') {
        this.line++;
        this.column = 0;
      }
      value += this.advance();
    }
    
    if (this.isAtEnd()) {
      throw new Error(`Unterminated string at line ${this.line}`);
    }
    
    this.advance(); // 終端の " を消費
    return this.createToken(RecoveryTokenType.STRING, value, startColumn);
  }

  /**
   * 変数の処理
   */
  private variable(): RecoveryToken {
    const startColumn = this.column - 1;
    let value = '$';
    
    // TODO: 不正な変数名のエラー処理
    // ヒント1: $ の後に文字がない場合
    // ヒント2: 不正な文字が含まれる場合
    
    if (this.isAtEnd() || !this.isAlpha(this.peek())) {
      throw new Error(`Invalid variable name at line ${this.line}, column ${startColumn}`);
    }
    
    while (!this.isAtEnd() && this.isAlphaNumeric(this.peek())) {
      value += this.advance();
    }
    
    return this.createToken(RecoveryTokenType.VARIABLE, value, startColumn);
  }

  /**
   * 数値の処理
   */
  private number(): RecoveryToken {
    const startColumn = this.column - 1;
    let value = this.source[this.position - 1];
    
    while (!this.isAtEnd() && this.isDigit(this.peek())) {
      value += this.advance();
    }
    
    // TODO: 小数点の不正な使用をチェック
    // ヒント: 3.14.5 のような不正な形式
    
    return this.createToken(RecoveryTokenType.NUMBER, value, startColumn);
  }

  /**
   * 識別子・キーワードの処理
   */
  private identifier(): RecoveryToken {
    const startColumn = this.column - 1;
    let value = this.source[this.position - 1];
    
    while (!this.isAtEnd() && this.isAlphaNumeric(this.peek())) {
      value += this.advance();
    }
    
    const type = this.getKeywordType(value.toUpperCase());
    return this.createToken(type, value, startColumn);
  }

  /**
   * キーワード判定
   */
  private getKeywordType(value: string): RecoveryTokenType {
    const keywords: Record<string, RecoveryTokenType> = {
      'SAY': RecoveryTokenType.SAY,
      'MOVE': RecoveryTokenType.MOVE,
      'IF': RecoveryTokenType.IF,
      'THEN': RecoveryTokenType.THEN,
      'ENDIF': RecoveryTokenType.ENDIF
    };
    
    return keywords[value] || RecoveryTokenType.SAY; // 仮の実装
  }

  /**
   * エラートークンを作成します
   */
  private createErrorToken(char: string, message: string): RecoveryToken {
    // TODO: エラートークンの実装
    // ヒント: ERROR タイプで、error フィールドにメッセージを設定
    
    return this.createToken(RecoveryTokenType.ERROR, char);
  }

  /**
   * エラーメッセージを記録します
   */
  private recordError(message: string): void {
    // TODO: エラーメッセージを this.errors に追加
    // ヒント: 行番号と列番号を含める
    
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

  private match(expected: string): boolean {
    if (this.isAtEnd() || this.source[this.position] !== expected) {
      return false;
    }
    this.position++;
    this.column++;
    return true;
  }

  private skipWhitespace(): void {
    while (!this.isAtEnd()) {
      const char = this.peek();
      if (char === ' ' || char === '\t' || char === '\r') {
        this.advance();
      } else {
        break;
      }
    }
  }

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  private isAlpha(char: string): boolean {
    return (char >= 'a' && char <= 'z') || 
           (char >= 'A' && char <= 'Z') || 
           char === '_';
  }

  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }

  private createToken(type: RecoveryTokenType, value: string, column?: number): RecoveryToken {
    return {
      type,
      value,
      line: this.line,
      column: column ?? this.column - value.length
    };
  }
}