/**
 * 🟡 01_lexer 中級問題2: 数値と文字列の高度な処理
 * 
 * 小数点、エスケープシーケンス、複数行文字列を含む
 * 高度な数値・文字列処理を実装してください。
 */

export enum AdvancedTokenType {
  // リテラル
  INTEGER = 'INTEGER',         // 整数: 42, 0, -15
  FLOAT = 'FLOAT',            // 浮動小数点: 3.14, 0.5, -2.7
  STRING = 'STRING',          // 文字列: "Hello\nWorld"
  
  // キーワード
  SAY = 'SAY',
  SET = 'SET',
  
  // 演算子
  ASSIGN = 'ASSIGN',          // =
  MINUS = 'MINUS',            // -
  
  // 制御
  NEWLINE = 'NEWLINE',
  EOF = 'EOF'
}

export interface AdvancedToken {
  type: AdvancedTokenType;
  value: string | number;     // 数値は実際の値、文字列は処理済み文字列
  raw: string;                // 元の文字列表現
  line: number;
  column: number;
}

export class AdvancedLexer {
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
   * 1. 整数と浮動小数点数の区別
   * 2. 負の数の処理
   * 3. エスケープシーケンス（\n, \t, \", \\）の処理
   * 4. 複数行文字列の対応
   * 5. 数値の実際の値を value に格納
   */
  public tokenize(): AdvancedToken[] {
    const tokens: AdvancedToken[] = [];
    
    // TODO: ここに実装してください
    // ヒント1: 数値は parseFloat() / parseInt() で変換
    // ヒント2: エスケープシーケンスの変換表を作成
    // ヒント3: 複数行文字列での行番号管理
    
    return tokens;
  }

  /**
   * 次のトークンを取得します
   */
  private nextToken(): AdvancedToken | null {
    this.skipWhitespace();
    
    if (this.isAtEnd()) {
      return null;
    }

    const startColumn = this.column;
    const char = this.advance();

    switch (char) {
      case '\n':
        return this.createToken(AdvancedTokenType.NEWLINE, '\n', '\n');
      case '=':
        return this.createToken(AdvancedTokenType.ASSIGN, '=', '=');
      case '-':
        // TODO: 負の数か減算演算子かを区別
        // ヒント: 前のトークンや文脈を考慮
        return this.createToken(AdvancedTokenType.MINUS, '-', '-'); // 仮の実装
      case '"':
        return this.string();
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
   * 数値リテラルを処理します（整数・浮動小数点・負数対応）
   */
  private number(): AdvancedToken {
    const startColumn = this.column - 1;
    let raw = this.source[this.position - 1]; // 最初の桁
    
    // TODO: 数値の完全な解析を実装
    // ヒント1: 整数部分の読み取り
    // ヒント2: 小数点がある場合の処理
    // ヒント3: parseInt() vs parseFloat() の使い分け
    // ヒント4: 不正な形式（3.14.5）のチェック
    
    // 仮の実装
    const value = parseInt(raw);
    const type = AdvancedTokenType.INTEGER;
    
    return this.createToken(type, value, raw, startColumn);
  }

  /**
   * 文字列リテラルを処理します（エスケープシーケンス対応）
   */
  private string(): AdvancedToken {
    const startColumn = this.column - 1;
    let value = '';
    let raw = '"';
    
    // TODO: エスケープシーケンスの処理を実装
    // ヒント1: \n, \t, \r, \\, \" の変換
    // ヒント2: 不正なエスケープシーケンスの検出
    // ヒント3: 複数行文字列での行番号更新
    // ヒント4: Unicode エスケープ（オプション）
    
    while (!this.isAtEnd() && this.peek() !== '"') {
      if (this.peek() === '\n') {
        this.line++;
        this.column = 0;
      }
      
      const char = this.advance();
      raw += char;
      
      // エスケープシーケンスの処理（基本実装）
      if (char === '\\') {
        // TODO: 完全なエスケープシーケンス処理
        value += char; // 仮の実装
      } else {
        value += char;
      }
    }
    
    if (this.isAtEnd()) {
      throw new Error(`Unterminated string at line ${this.line}`);
    }
    
    this.advance(); // 終端の " を消費
    raw += '"';
    
    return this.createToken(AdvancedTokenType.STRING, value, raw, startColumn);
  }

  /**
   * 識別子・キーワードを処理します
   */
  private identifier(): AdvancedToken {
    const startColumn = this.column - 1;
    let value = this.source[this.position - 1];
    
    while (!this.isAtEnd() && this.isAlphaNumeric(this.peek())) {
      value += this.advance();
    }
    
    const type = this.getKeywordType(value.toUpperCase());
    return this.createToken(type, value, value, startColumn);
  }

  /**
   * キーワード判定
   */
  private getKeywordType(value: string): AdvancedTokenType {
    // TODO: キーワードマップの実装
    const keywords: Record<string, AdvancedTokenType> = {
      'SAY': AdvancedTokenType.SAY,
      'SET': AdvancedTokenType.SET
    };
    
    return keywords[value] || AdvancedTokenType.SAY; // 仮の実装
  }

  /**
   * エスケープシーケンスを変換します
   */
  private processEscapeSequence(char: string): string {
    // TODO: エスケープシーケンスの変換マップを実装
    // ヒント: switch文 または マップオブジェクトを使用
    
    switch (char) {
      case 'n': return '\n';
      case 't': return '\t';
      case 'r': return '\r';
      case '\\': return '\\';
      case '"': return '"';
      default:
        throw new Error(`Invalid escape sequence: \\${char}`);
    }
  }

  /**
   * 負の数かどうかを判定します
   */
  private isNegativeNumber(): boolean {
    // TODO: 前のトークンの文脈から判定
    // ヒント1: 文の開始、代入の後、演算子の後なら負数
    // ヒント2: 数値の後なら減算演算子
    
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

  private peekNext(): string {
    if (this.position + 1 >= this.source.length) return '\0';
    return this.source[this.position + 1];
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

  private createToken(type: AdvancedTokenType, value: string | number, raw: string, column?: number): AdvancedToken {
    return {
      type,
      value,
      raw,
      line: this.line,
      column: column ?? this.column - raw.length
    };
  }
}