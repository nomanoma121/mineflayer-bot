/**
 * 🟡 04_lexer_tokenizer 中級問題: 高度な字句解析機能実装
 * 
 * より複雑なトークン処理と字句解析機能を実装してください。
 * この問題では、正規表現パターン、エラー回復、ストリーミング処理を学びます。
 */

// ===== 高度なトークンタイプ =====

export enum AdvancedTokenType {
  // 基本トークン
  KEYWORD = 'KEYWORD',
  IDENTIFIER = 'IDENTIFIER',
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  BOOLEAN = 'BOOLEAN',
  
  // 演算子とデリミタ
  OPERATOR = 'OPERATOR',
  COMPARISON = 'COMPARISON',
  LOGICAL = 'LOGICAL',
  ASSIGNMENT = 'ASSIGNMENT',
  DELIMITER = 'DELIMITER',
  
  // 特殊トークン
  COMMENT = 'COMMENT',
  WHITESPACE = 'WHITESPACE',
  NEWLINE = 'NEWLINE',
  VARIABLE = 'VARIABLE',
  
  // 制御構造
  BLOCK_START = 'BLOCK_START',
  BLOCK_END = 'BLOCK_END',
  
  // エラー処理
  INVALID = 'INVALID',
  EOF = 'EOF'
}

// ===== 高度なトークン実装 =====

export class AdvancedToken {
  constructor(
    public type: AdvancedTokenType,
    public value: string,
    public line: number,
    public column: number,
    public position: number,
    public length: number
  ) {}

  /**
   * トークンの詳細情報を取得します
   */
  getInfo(): TokenInfo {
    // TODO: トークン情報の詳細化
    // ヒント1: 位置情報の詳細化
    // ヒント2: メタデータの追加
    // ヒント3: コンテキスト情報
    
    return new TokenInfo(
      this.type,
      this.value,
      new Position(this.line, this.column),
      new Location(this.position, this.length),
      this.extractMetadata()
    );
  }

  /**
   * メタデータを抽出します
   */
  private extractMetadata(): Map<string, any> {
    const metadata = new Map<string, any>();
    
    switch (this.type) {
      case AdvancedTokenType.NUMBER:
        metadata.set('isInteger', Number.isInteger(Number(this.value)));
        metadata.set('numericValue', Number(this.value));
        break;
      case AdvancedTokenType.STRING:
        metadata.set('length', this.value.length - 2); // 引用符を除く
        metadata.set('isMultiline', this.value.includes('\n'));
        break;
      case AdvancedTokenType.IDENTIFIER:
        metadata.set('isKeyword', this.isKeyword());
        metadata.set('isReserved', this.isReserved());
        break;
    }
    
    return metadata;
  }

  /**
   * キーワードかチェックします
   */
  private isKeyword(): boolean {
    const keywords = ['IF', 'ELSE', 'WHILE', 'FOR', 'FUNCTION', 'RETURN', 'TRY', 'CATCH'];
    return keywords.includes(this.value.toUpperCase());
  }

  /**
   * 予約語かチェックします
   */
  private isReserved(): boolean {
    const reserved = ['NULL', 'UNDEFINED', 'TRUE', 'FALSE'];
    return reserved.includes(this.value.toUpperCase());
  }

  /**
   * トークンを文字列として表現します
   */
  toString(): string {
    return `${this.type}(${this.value}) at ${this.line}:${this.column}`;
  }
}

// ===== 位置情報管理 =====

export class Position {
  constructor(
    public line: number,
    public column: number
  ) {}

  toString(): string {
    return `${this.line}:${this.column}`;
  }

  equals(other: Position): boolean {
    return this.line === other.line && this.column === other.column;
  }
}

export class Location {
  constructor(
    public start: number,
    public length: number
  ) {}

  get end(): number {
    return this.start + this.length;
  }

  contains(position: number): boolean {
    return position >= this.start && position < this.end;
  }
}

export class TokenInfo {
  constructor(
    public type: AdvancedTokenType,
    public value: string,
    public position: Position,
    public location: Location,
    public metadata: Map<string, any>
  ) {}
}

// ===== 正規表現ベースの字句解析器 =====

export class RegexLexer {
  private patterns: Map<AdvancedTokenType, RegExp> = new Map();
  private input: string = '';
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;
  private tokens: AdvancedToken[] = [];

  constructor() {
    this.setupPatterns();
  }

  /**
   * トークンパターンを設定します
   */
  private setupPatterns(): void {
    // TODO: 正規表現パターンの定義
    // ヒント1: キーワードパターン
    // ヒント2: 識別子パターン
    // ヒント3: リテラルパターン
    // ヒント4: 演算子パターン
    
    // 数値パターン（整数、小数、科学記法）
    this.patterns.set(AdvancedTokenType.NUMBER, /^-?\d+(\.\d+)?([eE][+-]?\d+)?/);
    
    // 文字列パターン（シングル・ダブルクォート、エスケープ対応）
    this.patterns.set(AdvancedTokenType.STRING, /^"(?:[^"\\]|\\.)*"|^'(?:[^'\\]|\\.)*'/);
    
    // ブール値
    this.patterns.set(AdvancedTokenType.BOOLEAN, /^(true|false)\b/i);
    
    // 変数（$で始まる）
    this.patterns.set(AdvancedTokenType.VARIABLE, /^\$[a-zA-Z_][a-zA-Z0-9_]*/);
    
    // 識別子（キーワードを除く）
    this.patterns.set(AdvancedTokenType.IDENTIFIER, /^[a-zA-Z_][a-zA-Z0-9_]*/);
    
    // 比較演算子
    this.patterns.set(AdvancedTokenType.COMPARISON, /^(==|!=|<=|>=|<|>)/);
    
    // 論理演算子
    this.patterns.set(AdvancedTokenType.LOGICAL, /^(&&|\|\||!)/);
    
    // 代入演算子
    this.patterns.set(AdvancedTokenType.ASSIGNMENT, /^(=|\+=|-=|\*=|\/=)/);
    
    // 算術演算子
    this.patterns.set(AdvancedTokenType.OPERATOR, /^[+\-*/()]/);
    
    // デリミタ
    this.patterns.set(AdvancedTokenType.DELIMITER, /^[,;:.]/);
    
    // コメント
    this.patterns.set(AdvancedTokenType.COMMENT, /^\/\/.*$/m);
    
    // 改行
    this.patterns.set(AdvancedTokenType.NEWLINE, /^\n/);
    
    // 空白
    this.patterns.set(AdvancedTokenType.WHITESPACE, /^[ \t]+/);
  }

  /**
   * 入力を字句解析します
   */
  tokenize(input: string): LexicalAnalysisResult {
    // TODO: 正規表現ベースの字句解析
    // ヒント1: パターンマッチングの順序
    // ヒント2: 最長マッチの選択
    // ヒント3: エラー処理
    // ヒント4: 位置情報の更新
    
    this.input = input;
    this.position = 0;
    this.line = 1;
    this.column = 1;
    this.tokens = [];
    
    while (this.position < this.input.length) {
      const matched = this.matchToken();
      
      if (!matched) {
        // マッチしない文字は無効トークンとして処理
        this.addInvalidToken();
      }
    }
    
    // EOFトークンを追加
    this.tokens.push(new AdvancedToken(
      AdvancedTokenType.EOF,
      '',
      this.line,
      this.column,
      this.position,
      0
    ));
    
    return new LexicalAnalysisResult(this.tokens, this.getErrors());
  }

  /**
   * トークンをマッチします
   */
  private matchToken(): boolean {
    const remainingInput = this.input.slice(this.position);
    
    // パターンの優先順位順にマッチを試行
    const orderedTypes = [
      AdvancedTokenType.COMMENT,
      AdvancedTokenType.STRING,
      AdvancedTokenType.NUMBER,
      AdvancedTokenType.BOOLEAN,
      AdvancedTokenType.VARIABLE,
      AdvancedTokenType.COMPARISON,
      AdvancedTokenType.LOGICAL,
      AdvancedTokenType.ASSIGNMENT,
      AdvancedTokenType.OPERATOR,
      AdvancedTokenType.DELIMITER,
      AdvancedTokenType.IDENTIFIER,
      AdvancedTokenType.NEWLINE,
      AdvancedTokenType.WHITESPACE
    ];
    
    for (const type of orderedTypes) {
      const pattern = this.patterns.get(type);
      if (pattern) {
        const match = remainingInput.match(pattern);
        if (match) {
          const value = match[0];
          
          // キーワードチェック
          const tokenType = this.isKeyword(value, type) ? AdvancedTokenType.KEYWORD : type;
          
          this.addToken(tokenType, value);
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * キーワードかチェックします
   */
  private isKeyword(value: string, currentType: AdvancedTokenType): boolean {
    if (currentType !== AdvancedTokenType.IDENTIFIER) {
      return false;
    }
    
    const keywords = [
      'IF', 'ELSE', 'ENDIF', 'WHILE', 'ENDWHILE', 'FOR', 'ENDFOR',
      'FUNCTION', 'ENDFUNCTION', 'RETURN', 'TRY', 'CATCH', 'ENDTRY',
      'REPEAT', 'ENDREPEAT', 'SWITCH', 'CASE', 'DEFAULT', 'ENDSWITCH',
      'DEF', 'SAY', 'MOVE', 'GOTO', 'ATTACK', 'DIG', 'PLACE', 'WAIT'
    ];
    
    return keywords.includes(value.toUpperCase());
  }

  /**
   * トークンを追加します
   */
  private addToken(type: AdvancedTokenType, value: string): void {
    const token = new AdvancedToken(
      type,
      value,
      this.line,
      this.column,
      this.position,
      value.length
    );
    
    // 空白とコメント以外のトークンを保存
    if (type !== AdvancedTokenType.WHITESPACE && type !== AdvancedTokenType.COMMENT) {
      this.tokens.push(token);
    }
    
    this.updatePosition(value);
  }

  /**
   * 無効なトークンを追加します
   */
  private addInvalidToken(): void {
    const char = this.input[this.position];
    this.addToken(AdvancedTokenType.INVALID, char);
  }

  /**
   * 位置情報を更新します
   */
  private updatePosition(value: string): void {
    for (const char of value) {
      if (char === '\n') {
        this.line++;
        this.column = 1;
      } else {
        this.column++;
      }
      this.position++;
    }
  }

  /**
   * エラー情報を取得します
   */
  private getErrors(): LexicalError[] {
    const errors: LexicalError[] = [];
    
    for (const token of this.tokens) {
      if (token.type === AdvancedTokenType.INVALID) {
        errors.push(new LexicalError(
          `Invalid character: '${token.value}'`,
          token.line,
          token.column
        ));
      }
    }
    
    return errors;
  }
}

// ===== ストリーミング字句解析器 =====

export class StreamingLexer {
  private buffer: string = '';
  private lexer: RegexLexer = new RegexLexer();
  private pendingTokens: AdvancedToken[] = [];

  /**
   * データチャンクを追加します
   */
  addChunk(chunk: string): AdvancedToken[] {
    // TODO: ストリーミング処理の実装
    // ヒント1: バッファ管理
    // ヒント2: 部分トークンの処理
    // ヒント3: チャンク境界の処理
    
    this.buffer += chunk;
    
    // 完全な行があるかチェック
    const lines = this.buffer.split('\n');
    const tokens: AdvancedToken[] = [];
    
    // 最後の行以外を処理
    for (let i = 0; i < lines.length - 1; i++) {
      const result = this.lexer.tokenize(lines[i] + '\n');
      tokens.push(...result.tokens);
    }
    
    // 残りの部分をバッファに保持
    this.buffer = lines[lines.length - 1];
    
    return tokens;
  }

  /**
   * バッファを完了します
   */
  flush(): AdvancedToken[] {
    if (this.buffer.length > 0) {
      const result = this.lexer.tokenize(this.buffer);
      this.buffer = '';
      return result.tokens;
    }
    return [];
  }
}

// ===== エラー回復機能 =====

export class ErrorRecoveryLexer extends RegexLexer {
  private errors: LexicalError[] = [];
  private recoveryStrategies: Map<string, RecoveryStrategy> = new Map();

  constructor() {
    super();
    this.setupRecoveryStrategies();
  }

  /**
   * エラー回復戦略を設定します
   */
  private setupRecoveryStrategies(): void {
    // TODO: エラー回復戦略の設定
    // ヒント1: 文字スキップ戦略
    // ヒント2: 区切り文字検索戦略
    // ヒント3: キーワード検索戦略
    
    this.recoveryStrategies.set('skip_char', new SkipCharStrategy());
    this.recoveryStrategies.set('find_delimiter', new FindDelimiterStrategy());
    this.recoveryStrategies.set('find_keyword', new FindKeywordStrategy());
  }

  /**
   * エラー回復を実行します
   */
  recoverFromError(position: number): number {
    // TODO: エラー回復の実装
    // ヒント1: 戦略の選択
    // ヒント2: 回復の実行
    // ヒント3: エラー報告
    
    const strategies = ['find_delimiter', 'find_keyword', 'skip_char'];
    
    for (const strategyName of strategies) {
      const strategy = this.recoveryStrategies.get(strategyName);
      if (strategy) {
        const newPosition = strategy.recover(this.input, position);
        if (newPosition > position) {
          this.reportError(position, newPosition, strategyName);
          return newPosition;
        }
      }
    }
    
    // 回復できない場合は1文字スキップ
    this.reportError(position, position + 1, 'skip_char');
    return position + 1;
  }

  /**
   * エラーを報告します
   */
  private reportError(start: number, end: number, strategy: string): void {
    const error = new LexicalError(
      `Syntax error recovered using ${strategy}`,
      this.line,
      this.column
    );
    this.errors.push(error);
  }

  /**
   * エラー情報を取得します
   */
  getRecoveryErrors(): LexicalError[] {
    return [...this.errors];
  }
}

// ===== エラー回復戦略 =====

export interface RecoveryStrategy {
  recover(input: string, position: number): number;
}

export class SkipCharStrategy implements RecoveryStrategy {
  recover(input: string, position: number): number {
    return position + 1;
  }
}

export class FindDelimiterStrategy implements RecoveryStrategy {
  recover(input: string, position: number): number {
    const delimiters = [' ', '\n', '\t', ';', ',', '(', ')', '{', '}'];
    
    for (let i = position + 1; i < input.length; i++) {
      if (delimiters.includes(input[i])) {
        return i;
      }
    }
    
    return position;
  }
}

export class FindKeywordStrategy implements RecoveryStrategy {
  recover(input: string, position: number): number {
    const keywords = ['IF', 'WHILE', 'FOR', 'FUNCTION', 'DEF'];
    const remaining = input.slice(position);
    
    for (const keyword of keywords) {
      const index = remaining.toUpperCase().indexOf(keyword);
      if (index >= 0) {
        return position + index;
      }
    }
    
    return position;
  }
}

// ===== エラー管理 =====

export class LexicalError {
  constructor(
    public message: string,
    public line: number,
    public column: number,
    public recoverable: boolean = true
  ) {}

  toString(): string {
    return `Lexical Error at ${this.line}:${this.column}: ${this.message}`;
  }
}

export class LexicalAnalysisResult {
  constructor(
    public tokens: AdvancedToken[],
    public errors: LexicalError[]
  ) {}

  /**
   * 字句解析が成功したかチェックします
   */
  isSuccess(): boolean {
    return this.errors.length === 0;
  }

  /**
   * 特定の型のトークンを取得します
   */
  getTokensByType(type: AdvancedTokenType): AdvancedToken[] {
    return this.tokens.filter(token => token.type === type);
  }

  /**
   * トークン統計を取得します
   */
  getStatistics(): TokenStatistics {
    const typeCount = new Map<AdvancedTokenType, number>();
    
    for (const token of this.tokens) {
      const count = typeCount.get(token.type) || 0;
      typeCount.set(token.type, count + 1);
    }
    
    return new TokenStatistics(
      this.tokens.length,
      typeCount,
      this.errors.length
    );
  }
}

export class TokenStatistics {
  constructor(
    public totalTokens: number,
    public typeCount: Map<AdvancedTokenType, number>,
    public errorCount: number
  ) {}

  /**
   * 最も多いトークン型を取得します
   */
  getMostCommonType(): AdvancedTokenType | null {
    let maxCount = 0;
    let mostCommon: AdvancedTokenType | null = null;
    
    for (const [type, count] of this.typeCount) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = type;
      }
    }
    
    return mostCommon;
  }
}

// ===== デモクラス =====

export class AdvancedLexerDemo {
  /**
   * 高度な字句解析機能のデモを実行します
   */
  public static runDemo(): void {
    console.log('=== Advanced Lexer Demo ===');

    // 複雑なBotScriptコード
    const complexCode = `
      // 複雑な関数定義
      FUNCTION calculateDamage(baseDamage, multiplier, critChance)
        DEF result = baseDamage * multiplier
        IF $random <= critChance
          DEF result = result * 1.5
        ENDIF
        RETURN result
      ENDFUNCTION
      
      // 変数宣言と計算
      DEF playerHealth = 100.5
      DEF enemyAttack = 25.75
      DEF $criticalHit = 0.15
      
      // 条件分岐
      WHILE playerHealth > 0 && enemyAttack > 0
        DEF damage = calculateDamage(enemyAttack, 1.2, $criticalHit)
        DEF playerHealth = playerHealth - damage
        SAY "Player health: " + playerHealth
      ENDWHILE
    `;

    // 正規表現字句解析器のテスト
    console.log('\n--- Regex Lexer Test ---');
    const regexLexer = new RegexLexer();
    const result = regexLexer.tokenize(complexCode);
    
    console.log(`Tokens found: ${result.tokens.length}`);
    console.log(`Errors found: ${result.errors.length}`);
    
    // トークン統計の表示
    const stats = result.getStatistics();
    console.log(`Total tokens: ${stats.totalTokens}`);
    console.log(`Most common type: ${stats.getMostCommonType()}`);
    
    // エラー回復字句解析器のテスト
    console.log('\n--- Error Recovery Lexer Test ---');
    const errorCode = `
      DEF invalid@name = 123
      SAY "Missing quote
      FUNCTION unclosed(param
      IF condition THEN // 無効な構文
    `;
    
    const errorLexer = new ErrorRecoveryLexer();
    const errorResult = errorLexer.tokenize(errorCode);
    
    console.log(`Recovery errors: ${errorLexer.getRecoveryErrors().length}`);
    for (const error of errorLexer.getRecoveryErrors()) {
      console.log(`  ${error.toString()}`);
    }
    
    // ストリーミング字句解析器のテスト
    console.log('\n--- Streaming Lexer Test ---');
    const streamingLexer = new StreamingLexer();
    
    const chunks = [
      'DEF health = ',
      '100\nSAY "Player',
      ' spawned"\n',
      'MOVE forward'
    ];
    
    let totalStreamTokens = 0;
    for (const chunk of chunks) {
      const tokens = streamingLexer.addChunk(chunk);
      totalStreamTokens += tokens.length;
      console.log(`Chunk processed: ${tokens.length} tokens`);
    }
    
    const finalTokens = streamingLexer.flush();
    totalStreamTokens += finalTokens.length;
    console.log(`Final flush: ${finalTokens.length} tokens`);
    console.log(`Total streaming tokens: ${totalStreamTokens}`);

    console.log('\nAdvanced lexer demo completed');
  }
}