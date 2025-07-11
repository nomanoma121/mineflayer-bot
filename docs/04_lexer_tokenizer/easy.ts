/**
 * 🟢 04_lexer_tokenizer 初級問題: 基本的な字句解析の実装
 * 
 * BotScript言語の基本的なトークンを認識する字句解析器を実装してください。
 * この問題では、キーワード、識別子、リテラル、演算子の認識を学びます。
 */

// ===== トークン型定義 =====

export enum TokenType {
  // キーワード
  DEF = 'DEF',
  SAY = 'SAY',
  MOVE = 'MOVE',
  IF = 'IF',
  THEN = 'THEN',
  ELSE = 'ELSE',
  ENDIF = 'ENDIF',
  
  // リテラル
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  BOOLEAN = 'BOOLEAN',
  VARIABLE = 'VARIABLE',
  
  // 演算子
  ASSIGN = 'ASSIGN',         // =
  PLUS = 'PLUS',             // +
  MINUS = 'MINUS',           // -
  EQUAL = 'EQUAL',           // ==
  LESS_THAN = 'LESS_THAN',   // <
  GREATER_THAN = 'GREATER_THAN', // >
  
  // 区切り文字
  WHITESPACE = 'WHITESPACE',
  NEWLINE = 'NEWLINE',
  EOF = 'EOF',
  
  // エラー
  UNKNOWN = 'UNKNOWN'
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

// ===== 字句解析器クラス =====

export class BasicLexer {
  private source: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;
  private tokens: Token[] = [];

  constructor(source: string) {
    this.source = source;
  }

  /**
   * 字句解析を実行してトークン列を返します
   */
  public tokenize(): Token[] {
    // TODO: 字句解析のメインループ
    // ヒント1: 文字列の終端まで繰り返し
    // ヒント2: 各文字を解析してトークンを生成
    // ヒント3: 最後にEOFトークンを追加
    
    this.tokens = [];
    
    while (!this.isAtEnd()) {
      const token = this.nextToken();
      if (token && token.type !== TokenType.WHITESPACE) {
        this.tokens.push(token);
      }
    }
    
    this.tokens.push(this.createToken(TokenType.EOF, ''));
    return this.tokens;
  }

  /**
   * 次のトークンを取得します
   */
  private nextToken(): Token | null {
    // TODO: 次のトークンの識別
    // ヒント1: 現在の文字を確認
    // ヒント2: 文字の種類に応じて適切なメソッドを呼び出し
    
    if (this.isAtEnd()) {
      return null;
    }

    const startColumn = this.column;
    const char = this.advance();

    switch (char) {
      case ' ':
      case '\t':
      case '\r':
        return this.createToken(TokenType.WHITESPACE, char, startColumn);
      
      case '\n':
        this.line++;
        this.column = 1;
        return this.createToken(TokenType.NEWLINE, char, startColumn);
      
      case '=':
        if (this.match('=')) {
          return this.createToken(TokenType.EQUAL, '==', startColumn);
        }
        return this.createToken(TokenType.ASSIGN, '=', startColumn);
      
      case '+':
        return this.createToken(TokenType.PLUS, '+', startColumn);
      
      case '-':
        return this.createToken(TokenType.MINUS, '-', startColumn);
      
      case '<':
        return this.createToken(TokenType.LESS_THAN, '<', startColumn);
      
      case '>':
        return this.createToken(TokenType.GREATER_THAN, '>', startColumn);
      
      case '"':
        return this.string(startColumn);
      
      case '$':
        return this.variable(startColumn);
      
      default:
        if (this.isDigit(char)) {
          return this.number(startColumn);
        }
        
        if (this.isAlpha(char)) {
          return this.identifier(startColumn);
        }
        
        return this.createToken(TokenType.UNKNOWN, char, startColumn);
    }
  }

  /**
   * 文字列リテラルを解析します
   */
  private string(startColumn: number): Token {
    // TODO: 文字列リテラルの解析
    // ヒント1: 終端のダブルクォートまで読み進める
    // ヒント2: エスケープシーケンスの処理
    // ヒント3: 終端がない場合のエラー処理
    
    let value = '';
    
    while (!this.isAtEnd() && this.peek() !== '"') {
      if (this.peek() === '\n') {
        this.line++;
        this.column = 0;
      }
      value += this.advance();
    }
    
    if (this.isAtEnd()) {
      // 終端のない文字列
      return this.createToken(TokenType.UNKNOWN, '"' + value, startColumn);
    }
    
    this.advance(); // 終端の " を消費
    return this.createToken(TokenType.STRING, value, startColumn);
  }

  /**
   * 変数を解析します
   */
  private variable(startColumn: number): Token {
    // TODO: 変数の解析（$で始まる識別子）
    // ヒント1: $ の後に英数字が続く
    // ヒント2: 有効な変数名の規則をチェック
    
    let value = '$';
    
    while (!this.isAtEnd() && this.isAlphaNumeric(this.peek())) {
      value += this.advance();
    }
    
    if (value === '$') {
      // $ だけで変数名がない
      return this.createToken(TokenType.UNKNOWN, value, startColumn);
    }
    
    return this.createToken(TokenType.VARIABLE, value, startColumn);
  }

  /**
   * 数値リテラルを解析します
   */
  private number(startColumn: number): Token {
    // TODO: 数値リテラルの解析
    // ヒント1: 連続する数字を読み取り
    // ヒント2: 小数点の処理
    
    let value = this.source[this.position - 1]; // 最初の桁
    
    while (!this.isAtEnd() && this.isDigit(this.peek())) {
      value += this.advance();
    }
    
    // 小数点の処理
    if (!this.isAtEnd() && this.peek() === '.' && 
        this.position + 1 < this.source.length && 
        this.isDigit(this.source[this.position + 1])) {
      value += this.advance(); // '.'
      
      while (!this.isAtEnd() && this.isDigit(this.peek())) {
        value += this.advance();
      }
    }
    
    return this.createToken(TokenType.NUMBER, value, startColumn);
  }

  /**
   * 識別子またはキーワードを解析します
   */
  private identifier(startColumn: number): Token {
    // TODO: 識別子/キーワードの解析
    // ヒント1: 英数字とアンダースコアを読み取り
    // ヒント2: キーワードテーブルでチェック
    
    let value = this.source[this.position - 1]; // 最初の文字
    
    while (!this.isAtEnd() && this.isAlphaNumeric(this.peek())) {
      value += this.advance();
    }
    
    // キーワードチェック
    const type = this.getKeywordType(value.toUpperCase());
    return this.createToken(type, value, startColumn);
  }

  /**
   * キーワードタイプを取得します
   */
  private getKeywordType(value: string): TokenType {
    // TODO: キーワードマップの実装
    const keywords: Record<string, TokenType> = {
      'DEF': TokenType.DEF,
      'SAY': TokenType.SAY,
      'MOVE': TokenType.MOVE,
      'IF': TokenType.IF,
      'THEN': TokenType.THEN,
      'ELSE': TokenType.ELSE,
      'ENDIF': TokenType.ENDIF,
      'TRUE': TokenType.BOOLEAN,
      'FALSE': TokenType.BOOLEAN
    };
    
    return keywords[value] || TokenType.UNKNOWN;
  }

  // ===== ヘルパーメソッド =====

  /**
   * 現在の文字を取得して位置を進めます
   */
  private advance(): string {
    const char = this.source[this.position++];
    this.column++;
    return char;
  }

  /**
   * 次の文字を先読みします
   */
  private peek(): string {
    if (this.isAtEnd()) return '\0';
    return this.source[this.position];
  }

  /**
   * 期待する文字と一致するかチェックして消費します
   */
  private match(expected: string): boolean {
    if (this.isAtEnd() || this.source[this.position] !== expected) {
      return false;
    }
    this.position++;
    this.column++;
    return true;
  }

  /**
   * 文字列の終端に達したかチェックします
   */
  private isAtEnd(): boolean {
    return this.position >= this.source.length;
  }

  /**
   * 文字が数字かチェックします
   */
  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  /**
   * 文字がアルファベットかチェックします
   */
  private isAlpha(char: string): boolean {
    return (char >= 'a' && char <= 'z') || 
           (char >= 'A' && char <= 'Z') || 
           char === '_';
  }

  /**
   * 文字が英数字かチェックします
   */
  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }

  /**
   * トークンを作成します
   */
  private createToken(type: TokenType, value: string, column?: number): Token {
    return {
      type,
      value,
      line: this.line,
      column: column ?? this.column - value.length
    };
  }

  /**
   * 現在の位置情報を取得します
   */
  public getPosition(): { line: number; column: number; position: number } {
    return {
      line: this.line,
      column: this.column,
      position: this.position
    };
  }
}

// ===== トークン解析結果クラス =====

export class LexicalAnalysisResult {
  constructor(
    public tokens: Token[],
    public hasErrors: boolean = false,
    public errors: string[] = []
  ) {}

  /**
   * 特定のタイプのトークンを取得します
   */
  getTokensByType(type: TokenType): Token[] {
    return this.tokens.filter(token => token.type === type);
  }

  /**
   * トークンの統計情報を取得します
   */
  getStatistics(): Record<string, number> {
    const stats: Record<string, number> = {};
    
    for (const token of this.tokens) {
      stats[token.type] = (stats[token.type] || 0) + 1;
    }
    
    return stats;
  }

  /**
   * 解析結果を表示用にフォーマットします
   */
  format(): string {
    const lines: string[] = [];
    
    lines.push('=== Lexical Analysis Result ===');
    lines.push(`Total tokens: ${this.tokens.length}`);
    lines.push(`Has errors: ${this.hasErrors}`);
    
    if (this.hasErrors) {
      lines.push('\nErrors:');
      this.errors.forEach(error => lines.push(`  - ${error}`));
    }
    
    lines.push('\nToken Statistics:');
    const stats = this.getStatistics();
    Object.entries(stats).forEach(([type, count]) => {
      lines.push(`  ${type}: ${count}`);
    });
    
    lines.push('\nTokens:');
    this.tokens.forEach((token, index) => {
      lines.push(`  ${index}: ${token.type} '${token.value}' (${token.line}:${token.column})`);
    });
    
    return lines.join('\n');
  }
}

// ===== デモクラス =====

export class LexerDemo {
  /**
   * 字句解析のデモを実行します
   */
  public static runDemo(): void {
    console.log('=== Lexer Demo ===');

    // サンプルBotScriptコード
    const sampleCode = `
      DEF $health = 100
      DEF $name = "MinecraftBot"
      
      IF $health > 50 THEN
        SAY "Health is good"
        MOVE north 5
      ELSE
        SAY "Health is low"
      ENDIF
    `;

    // 字句解析の実行
    const lexer = new BasicLexer(sampleCode);
    const tokens = lexer.tokenize();
    
    // 結果の作成と表示
    const result = new LexicalAnalysisResult(tokens);
    console.log(result.format());

    // 特定のトークンタイプの検索
    console.log('\n--- Token Type Analysis ---');
    console.log('Keywords:', result.getTokensByType(TokenType.DEF).length + 
                           result.getTokensByType(TokenType.IF).length + 
                           result.getTokensByType(TokenType.SAY).length);
    console.log('Variables:', result.getTokensByType(TokenType.VARIABLE).map(t => t.value));
    console.log('Strings:', result.getTokensByType(TokenType.STRING).map(t => t.value));
    console.log('Numbers:', result.getTokensByType(TokenType.NUMBER).map(t => t.value));

    console.log('\nDemo completed');
  }
}