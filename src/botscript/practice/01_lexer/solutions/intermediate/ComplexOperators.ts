/**
 * 🟡 01_lexer 中級問題1: 複合演算子の処理 - 解答例
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

  public tokenize(): OperatorToken[] {
    const tokens: OperatorToken[] = [];
    
    while (!this.isAtEnd()) {
      this.skipWhitespace();
      
      if (this.isAtEnd()) break;
      
      const token = this.nextToken();
      if (token) {
        tokens.push(token);
      }
    }
    
    tokens.push(this.createToken(OperatorTokenType.EOF, ''));
    return tokens;
  }

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
        if (this.match('=')) {
          return this.createToken(OperatorTokenType.EQUAL, '==');
        }
        return this.createToken(OperatorTokenType.ASSIGN, '=');
        
      case '!':
        if (this.match('=')) {
          return this.createToken(OperatorTokenType.NOT_EQUAL, '!=');
        }
        throw new Error(`Unexpected character: ${char} at line ${this.line}, column ${startColumn}`);
        
      case '<':
        if (this.match('=')) {
          return this.createToken(OperatorTokenType.LESS_EQUAL, '<=');
        }
        return this.createToken(OperatorTokenType.LESS_THAN, '<');
        
      case '>':
        if (this.match('=')) {
          return this.createToken(OperatorTokenType.GREATER_EQUAL, '>=');
        }
        return this.createToken(OperatorTokenType.GREATER_THAN, '>');
        
      default:
        if (this.isDigit(char)) {
          return this.number();
        }
        
        throw new Error(`Unexpected character: ${char} at line ${this.line}, column ${startColumn}`);
    }
  }

  private number(): OperatorToken {
    const startColumn = this.column - 1;
    let value = this.source[this.position - 1]; // 最初の桁
    
    while (!this.isAtEnd() && this.isDigit(this.peek())) {
      value += this.advance();
    }
    
    return this.createToken(OperatorTokenType.NUMBER, value, startColumn);
  }

  private match(expected: string): boolean {
    if (this.isAtEnd() || this.source[this.position] !== expected) {
      return false;
    }
    this.position++;
    this.column++;
    return true;
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