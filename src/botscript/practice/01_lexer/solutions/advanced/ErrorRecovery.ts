/**
 * 🔴 01_lexer 上級問題1: エラー回復機能 - 解答例
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
  error?: string;
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

  public tokenizeWithErrorRecovery(): LexingResult {
    const tokens: RecoveryToken[] = [];
    this.errors = [];
    
    while (!this.isAtEnd()) {
      this.skipWhitespace();
      
      if (this.isAtEnd()) break;
      
      const token = this.nextTokenSafe();
      if (token) {
        tokens.push(token);
      }
    }
    
    tokens.push(this.createToken(RecoveryTokenType.EOF, ''));
    
    return {
      tokens,
      errors: this.errors,
      hasErrors: this.errors.length > 0
    };
  }

  private nextTokenSafe(): RecoveryToken | null {
    try {
      return this.nextToken();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.recordError(errorMessage);
      
      // エラー文字を取得してERRORトークンを作成
      const startColumn = this.column;
      const char = this.source[this.position - 1] || this.advance();
      
      const errorToken = this.createErrorToken(char, errorMessage);
      
      // エラー回復
      this.synchronize();
      
      return errorToken;
    }
  }

  private nextToken(): RecoveryToken | null {
    this.skipWhitespace();
    
    if (this.isAtEnd()) {
      return null;
    }

    const startColumn = this.column;
    const char = this.advance();

    switch (char) {
      case '\n':
        this.line++;
        this.column = 1;
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

  private synchronize(): void {
    // エラー後の回復戦略
    while (!this.isAtEnd()) {
      const char = this.peek();
      
      // 改行まで進む
      if (char === '\n') {
        this.advance();
        break;
      }
      
      // キーワードの開始を探す
      if (this.isAlpha(char)) {
        const nextWord = this.peekWord();
        if (['SAY', 'MOVE', 'IF', 'THEN', 'ENDIF'].includes(nextWord.toUpperCase())) {
          break;
        }
      }
      
      this.advance();
    }
  }

  private peekWord(): string {
    let word = '';
    let pos = this.position;
    
    while (pos < this.source.length && this.isAlphaNumeric(this.source[pos])) {
      word += this.source[pos];
      pos++;
    }
    
    return word;
  }

  private string(): RecoveryToken {
    const startColumn = this.column - 1;
    let value = '';
    
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

  private variable(): RecoveryToken {
    const startColumn = this.column - 1;
    let value = '$';
    
    if (this.isAtEnd() || !this.isAlpha(this.peek())) {
      throw new Error(`Invalid variable name at line ${this.line}, column ${startColumn}`);
    }
    
    while (!this.isAtEnd() && this.isAlphaNumeric(this.peek())) {
      value += this.advance();
    }
    
    return this.createToken(RecoveryTokenType.VARIABLE, value, startColumn);
  }

  private number(): RecoveryToken {
    const startColumn = this.column - 1;
    let value = this.source[this.position - 1];
    
    while (!this.isAtEnd() && this.isDigit(this.peek())) {
      value += this.advance();
    }
    
    return this.createToken(RecoveryTokenType.NUMBER, value, startColumn);
  }

  private identifier(): RecoveryToken {
    const startColumn = this.column - 1;
    let value = this.source[this.position - 1];
    
    while (!this.isAtEnd() && this.isAlphaNumeric(this.peek())) {
      value += this.advance();
    }
    
    const type = this.getKeywordType(value.toUpperCase());
    return this.createToken(type, value, startColumn);
  }

  private getKeywordType(value: string): RecoveryTokenType {
    const keywords: Record<string, RecoveryTokenType> = {
      'SAY': RecoveryTokenType.SAY,
      'MOVE': RecoveryTokenType.MOVE,
      'IF': RecoveryTokenType.IF,
      'THEN': RecoveryTokenType.THEN,
      'ENDIF': RecoveryTokenType.ENDIF
    };
    
    return keywords[value] || RecoveryTokenType.SAY;
  }

  private createErrorToken(char: string, message: string): RecoveryToken {
    return {
      type: RecoveryTokenType.ERROR,
      value: char,
      line: this.line,
      column: this.column - 1,
      error: message
    };
  }

  private recordError(message: string): void {
    const errorMsg = `${message} (line ${this.line}, column ${this.column})`;
    this.errors.push(errorMsg);
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