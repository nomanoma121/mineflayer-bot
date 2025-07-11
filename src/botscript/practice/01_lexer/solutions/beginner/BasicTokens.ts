/**
 * 🟢 01_lexer 初級問題1: 基本トークンの認識 - 解答例
 */

export enum BasicTokenType {
  // キーワード
  SAY = 'SAY',
  MOVE = 'MOVE',
  
  // リテラル
  STRING = 'STRING',
  
  // 制御
  EOF = 'EOF'
}

export interface BasicToken {
  type: BasicTokenType;
  value: string;
  line: number;
  column: number;
}

export class BasicLexer {
  private source: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;

  constructor(source: string) {
    this.source = source;
  }

  public tokenize(): BasicToken[] {
    const tokens: BasicToken[] = [];
    
    while (!this.isAtEnd()) {
      this.skipWhitespace();
      
      if (this.isAtEnd()) break;
      
      const token = this.nextToken();
      if (token) {
        tokens.push(token);
      }
    }
    
    tokens.push(this.createToken(BasicTokenType.EOF, ''));
    return tokens;
  }

  private nextToken(): BasicToken | null {
    this.skipWhitespace();
    
    if (this.isAtEnd()) {
      return null;
    }

    const startColumn = this.column;
    const char = this.advance();

    switch (char) {
      case '"':
        return this.string();
      default:
        if (this.isAlpha(char)) {
          return this.identifier();
        }
        throw new Error(`Unexpected character: ${char} at line ${this.line}, column ${startColumn}`);
    }
  }

  private string(): BasicToken {
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
    return this.createToken(BasicTokenType.STRING, value, startColumn);
  }

  private identifier(): BasicToken {
    const startColumn = this.column - 1;
    let value = this.source[this.position - 1]; // 最初の文字
    
    while (!this.isAtEnd() && this.isAlphaNumeric(this.peek())) {
      value += this.advance();
    }
    
    const type = this.getKeywordType(value.toUpperCase());
    return this.createToken(type, value, startColumn);
  }

  private getKeywordType(value: string): BasicTokenType {
    switch (value) {
      case 'SAY': return BasicTokenType.SAY;
      case 'MOVE': return BasicTokenType.MOVE;
      default: 
        throw new Error(`Unknown keyword: ${value}`);
    }
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

  private isAlpha(char: string): boolean {
    return (char >= 'a' && char <= 'z') || 
           (char >= 'A' && char <= 'Z') || 
           char === '_';
  }

  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  private createToken(type: BasicTokenType, value: string, column?: number): BasicToken {
    return {
      type,
      value,
      line: this.line,
      column: column ?? this.column - value.length
    };
  }
}