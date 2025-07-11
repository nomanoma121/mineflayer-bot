/**
 * 🟢 01_lexer 初級問題1: 基本トークンの認識
 * 
 * 基本的なトークンを認識できる字句解析器を実装してください。
 * この問題では、最も基本的なトークン（キーワード、文字列、EOF）の処理を学びます。
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

  /**
   * ソースコードをトークン化します
   * 
   * 実装要件:
   * 1. "SAY" キーワードをSAYトークンとして認識
   * 2. "MOVE" キーワードをMOVEトークンとして認識  
   * 3. "文字列" を STRING トークンとして認識（ダブルクォート除去）
   * 4. 最後にEOFトークンを追加
   * 5. 空白文字は無視
   * 
   * @returns トークンの配列
   */
  public tokenize(): BasicToken[] {
    const tokens: BasicToken[] = [];
    
    // TODO: ここに実装してください
    // ヒント1: while (!this.isAtEnd()) でループ
    // ヒント2: this.skipWhitespace() で空白をスキップ
    // ヒント3: this.nextToken() で次のトークンを取得
    // ヒント4: 最後にEOFトークンを追加
    
    return tokens;
  }

  /**
   * 次のトークンを取得します
   */
  private nextToken(): BasicToken | null {
    this.skipWhitespace();
    
    if (this.isAtEnd()) {
      return null;
    }

    const startColumn = this.column;
    const char = this.advance();

    // TODO: 文字に応じてトークンを生成
    // ヒント1: char === '"' なら文字列処理
    // ヒント2: this.isAlpha(char) なら識別子/キーワード処理
    // ヒント3: 不明な文字の場合はエラーを投げる
    
    throw new Error(`Unexpected character: ${char}`);
  }

  /**
   * 文字列リテラルを処理します
   */
  private string(): BasicToken {
    const startColumn = this.column - 1;
    let value = '';
    
    // TODO: 文字列の内容を読み取り
    // ヒント1: 終端の " まで文字を読み取る
    // ヒント2: this.advance() で文字を進める
    // ヒント3: 終端がない場合はエラー
    
    return this.createToken(BasicTokenType.STRING, value, startColumn);
  }

  /**
   * 識別子またはキーワードを処理します
   */
  private identifier(): BasicToken {
    const startColumn = this.column - 1;
    let value = this.source[this.position - 1]; // 最初の文字
    
    // TODO: 識別子の残りの文字を読み取り
    // ヒント1: this.isAlphaNumeric() で英数字をチェック
    // ヒント2: キーワードかどうかをチェック
    
    return this.createToken(BasicTokenType.SAY, value, startColumn); // 仮の実装
  }

  /**
   * キーワードタイプを取得します
   */
  private getKeywordType(value: string): BasicTokenType {
    // TODO: 文字列がキーワードかチェック
    // ヒント: 大文字小文字を区別しない比較
    
    // 仮の実装（正しく実装してください）
    return BasicTokenType.SAY;
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