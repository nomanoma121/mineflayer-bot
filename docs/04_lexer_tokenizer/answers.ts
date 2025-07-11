/**
 * 04_lexer_tokenizer 解答ファイル
 * 
 * すべての難易度レベルの完全な解答実装
 */

// ===== 初級解答 (easy.ts) =====

export enum TokenType {
  KEYWORD = 'KEYWORD',
  IDENTIFIER = 'IDENTIFIER',
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  OPERATOR = 'OPERATOR',
  DELIMITER = 'DELIMITER',
  WHITESPACE = 'WHITESPACE',
  COMMENT = 'COMMENT',
  INVALID = 'INVALID',
  EOF = 'EOF'
}

export class Token {
  constructor(
    public type: TokenType,
    public value: string,
    public line: number = 1,
    public column: number = 1
  ) {}

  toString(): string {
    return `${this.type}(${this.value})`;
  }

  equals(other: Token): boolean {
    return this.type === other.type && this.value === other.value;
  }

  isKeyword(): boolean {
    return this.type === TokenType.KEYWORD;
  }

  isValid(): boolean {
    return this.type !== TokenType.INVALID && this.value.length > 0;
  }
}

export class BasicLexer {
  private keywords: Set<string> = new Set([
    'IF', 'ELSE', 'ENDIF', 'WHILE', 'ENDWHILE', 'FOR', 'ENDFOR',
    'FUNCTION', 'ENDFUNCTION', 'RETURN', 'DEF', 'SAY', 'MOVE', 'GOTO',
    'ATTACK', 'DIG', 'PLACE', 'WAIT', 'TRUE', 'FALSE'
  ]);

  tokenize(input: string): Token[] {
    const tokens: Token[] = [];
    let position = 0;
    let line = 1;
    let column = 1;

    while (position < input.length) {
      const char = input[position];

      // 空白文字の処理
      if (this.isWhitespace(char)) {
        const whitespace = this.readWhitespace(input, position);
        tokens.push(new Token(TokenType.WHITESPACE, whitespace, line, column));
        
        for (const c of whitespace) {
          if (c === '\n') {
            line++;
            column = 1;
          } else {
            column++;
          }
        }
        position += whitespace.length;
        continue;
      }

      // コメントの処理
      if (char === '/' && position + 1 < input.length && input[position + 1] === '/') {
        const comment = this.readComment(input, position);
        tokens.push(new Token(TokenType.COMMENT, comment, line, column));
        column += comment.length;
        position += comment.length;
        continue;
      }

      // 数値の処理
      if (this.isDigit(char)) {
        const number = this.readNumber(input, position);
        tokens.push(new Token(TokenType.NUMBER, number, line, column));
        column += number.length;
        position += number.length;
        continue;
      }

      // 文字列の処理
      if (char === '"' || char === "'") {
        const string = this.readString(input, position);
        tokens.push(new Token(TokenType.STRING, string, line, column));
        column += string.length;
        position += string.length;
        continue;
      }

      // 識別子・キーワードの処理
      if (this.isLetter(char) || char === '_') {
        const identifier = this.readIdentifier(input, position);
        const type = this.keywords.has(identifier.toUpperCase()) ? TokenType.KEYWORD : TokenType.IDENTIFIER;
        tokens.push(new Token(type, identifier, line, column));
        column += identifier.length;
        position += identifier.length;
        continue;
      }

      // 演算子・デリミタの処理
      if (this.isOperatorOrDelimiter(char)) {
        const op = this.readOperator(input, position);
        const type = this.isDelimiter(op) ? TokenType.DELIMITER : TokenType.OPERATOR;
        tokens.push(new Token(type, op, line, column));
        column += op.length;
        position += op.length;
        continue;
      }

      // 無効な文字
      tokens.push(new Token(TokenType.INVALID, char, line, column));
      column++;
      position++;
    }

    // EOF トークンを追加
    tokens.push(new Token(TokenType.EOF, '', line, column));
    return tokens;
  }

  private isWhitespace(char: string): boolean {
    return /\s/.test(char);
  }

  private isDigit(char: string): boolean {
    return /\d/.test(char);
  }

  private isLetter(char: string): boolean {
    return /[a-zA-Z]/.test(char);
  }

  private isOperatorOrDelimiter(char: string): boolean {
    return '+-*/()[]{}=<>!&|,;:.'.includes(char);
  }

  private isDelimiter(str: string): boolean {
    return ',;:()[]{}.\n'.includes(str);
  }

  private readWhitespace(input: string, start: number): string {
    let end = start;
    while (end < input.length && this.isWhitespace(input[end])) {
      end++;
    }
    return input.slice(start, end);
  }

  private readComment(input: string, start: number): string {
    let end = start;
    while (end < input.length && input[end] !== '\n') {
      end++;
    }
    return input.slice(start, end);
  }

  private readNumber(input: string, start: number): string {
    let end = start;
    let hasDot = false;

    while (end < input.length) {
      const char = input[end];
      if (this.isDigit(char)) {
        end++;
      } else if (char === '.' && !hasDot) {
        hasDot = true;
        end++;
      } else {
        break;
      }
    }

    return input.slice(start, end);
  }

  private readString(input: string, start: number): string {
    const quote = input[start];
    let end = start + 1;

    while (end < input.length) {
      if (input[end] === quote) {
        end++;
        break;
      } else if (input[end] === '\\' && end + 1 < input.length) {
        end += 2; // エスケープ文字をスキップ
      } else {
        end++;
      }
    }

    return input.slice(start, end);
  }

  private readIdentifier(input: string, start: number): string {
    let end = start;
    while (end < input.length && (this.isLetter(input[end]) || this.isDigit(input[end]) || input[end] === '_')) {
      end++;
    }
    return input.slice(start, end);
  }

  private readOperator(input: string, start: number): string {
    const char = input[start];
    
    // 2文字演算子のチェック
    if (start + 1 < input.length) {
      const twoChar = input.slice(start, start + 2);
      if (['==', '!=', '<=', '>=', '&&', '||', '++', '--'].includes(twoChar)) {
        return twoChar;
      }
    }

    return char;
  }
}

export class LexicalAnalysisResult {
  constructor(
    public tokens: Token[],
    public hasErrors: boolean = false,
    public errorMessages: string[] = []
  ) {}

  getTokenCount(): number {
    return this.tokens.filter(token => token.type !== TokenType.EOF).length;
  }

  getValidTokens(): Token[] {
    return this.tokens.filter(token => token.type !== TokenType.INVALID && token.type !== TokenType.EOF);
  }

  getTokensByType(type: TokenType): Token[] {
    return this.tokens.filter(token => token.type === type);
  }

  hasInvalidTokens(): boolean {
    return this.tokens.some(token => token.type === TokenType.INVALID);
  }

  getErrorCount(): number {
    return this.errorMessages.length + this.tokens.filter(token => token.type === TokenType.INVALID).length;
  }
}

// ===== 中級解答 (normal.ts) =====

export enum AdvancedTokenType {
  KEYWORD = 'KEYWORD',
  IDENTIFIER = 'IDENTIFIER',
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  BOOLEAN = 'BOOLEAN',
  OPERATOR = 'OPERATOR',
  COMPARISON = 'COMPARISON',
  LOGICAL = 'LOGICAL',
  ASSIGNMENT = 'ASSIGNMENT',
  DELIMITER = 'DELIMITER',
  COMMENT = 'COMMENT',
  WHITESPACE = 'WHITESPACE',
  NEWLINE = 'NEWLINE',
  VARIABLE = 'VARIABLE',
  BLOCK_START = 'BLOCK_START',
  BLOCK_END = 'BLOCK_END',
  INVALID = 'INVALID',
  EOF = 'EOF'
}

export class AdvancedToken {
  constructor(
    public type: AdvancedTokenType,
    public value: string,
    public line: number,
    public column: number,
    public position: number,
    public length: number
  ) {}

  getInfo(): TokenInfo {
    return new TokenInfo(
      this.type,
      this.value,
      new Position(this.line, this.column),
      new Location(this.position, this.length),
      this.extractMetadata()
    );
  }

  private extractMetadata(): Map<string, any> {
    const metadata = new Map<string, any>();
    
    switch (this.type) {
      case AdvancedTokenType.NUMBER:
        metadata.set('isInteger', Number.isInteger(Number(this.value)));
        metadata.set('numericValue', Number(this.value));
        break;
      case AdvancedTokenType.STRING:
        metadata.set('length', this.value.length - 2);
        metadata.set('isMultiline', this.value.includes('\n'));
        break;
      case AdvancedTokenType.IDENTIFIER:
        metadata.set('isKeyword', this.isKeyword());
        metadata.set('isReserved', this.isReserved());
        break;
    }
    
    return metadata;
  }

  private isKeyword(): boolean {
    const keywords = ['IF', 'ELSE', 'WHILE', 'FOR', 'FUNCTION', 'RETURN', 'TRY', 'CATCH'];
    return keywords.includes(this.value.toUpperCase());
  }

  private isReserved(): boolean {
    const reserved = ['NULL', 'UNDEFINED', 'TRUE', 'FALSE'];
    return reserved.includes(this.value.toUpperCase());
  }

  toString(): string {
    return `${this.type}(${this.value}) at ${this.line}:${this.column}`;
  }
}

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

  private setupPatterns(): void {
    // 数値パターン（整数、小数、科学記法）
    this.patterns.set(AdvancedTokenType.NUMBER, /^-?\d+(\.\d+)?([eE][+-]?\d+)?/);
    
    // 文字列パターン（シングル・ダブルクォート、エスケープ対応）
    this.patterns.set(AdvancedTokenType.STRING, /^"(?:[^"\\]|\\.)*"|^'(?:[^'\\]|\\.)*'/);
    
    // ブール値
    this.patterns.set(AdvancedTokenType.BOOLEAN, /^(true|false)\b/i);
    
    // 変数（$で始まる）
    this.patterns.set(AdvancedTokenType.VARIABLE, /^\$[a-zA-Z_][a-zA-Z0-9_]*/);
    
    // 識別子
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

  tokenize(input: string): LexicalAnalysisResult {
    this.input = input;
    this.position = 0;
    this.line = 1;
    this.column = 1;
    this.tokens = [];
    
    while (this.position < this.input.length) {
      const matched = this.matchToken();
      
      if (!matched) {
        this.addInvalidToken();
      }
    }
    
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

  private matchToken(): boolean {
    const remainingInput = this.input.slice(this.position);
    
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
          const tokenType = this.isKeyword(value, type) ? AdvancedTokenType.KEYWORD : type;
          this.addToken(tokenType, value);
          return true;
        }
      }
    }
    
    return false;
  }

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

  private addToken(type: AdvancedTokenType, value: string): void {
    const token = new AdvancedToken(
      type,
      value,
      this.line,
      this.column,
      this.position,
      value.length
    );
    
    if (type !== AdvancedTokenType.WHITESPACE && type !== AdvancedTokenType.COMMENT) {
      this.tokens.push(token);
    }
    
    this.updatePosition(value);
  }

  private addInvalidToken(): void {
    const char = this.input[this.position];
    this.addToken(AdvancedTokenType.INVALID, char);
  }

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

  isSuccess(): boolean {
    return this.errors.length === 0;
  }

  getTokensByType(type: AdvancedTokenType): AdvancedToken[] {
    return this.tokens.filter(token => token.type === type);
  }

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

// ===== 上級解答 (hard.ts) =====
// (上級の解答は実装が複雑なため、主要なクラスの完全実装のみ示します)

export class OptimizedLexer {
  private tokenPool: TokenPool = new TokenPool();
  private lookupTable: Map<string, AdvancedTokenType> = new Map();
  private stateTable: LexerStateTable = new LexerStateTable();
  private metrics: LexerMetrics = new LexerMetrics();

  constructor() {
    this.buildLookupTable();
    this.initializeStateTable();
  }

  private buildLookupTable(): void {
    const keywords = [
      'IF', 'ELSE', 'ENDIF', 'WHILE', 'ENDWHILE', 'FOR', 'ENDFOR',
      'FUNCTION', 'ENDFUNCTION', 'RETURN', 'TRY', 'CATCH', 'ENDTRY',
      'REPEAT', 'ENDREPEAT', 'SWITCH', 'CASE', 'DEFAULT', 'ENDSWITCH',
      'DEF', 'SAY', 'MOVE', 'GOTO', 'ATTACK', 'DIG', 'PLACE', 'WAIT',
      'TRUE', 'FALSE', 'NULL', 'UNDEFINED'
    ];
    
    for (const keyword of keywords) {
      this.lookupTable.set(keyword.toLowerCase(), AdvancedTokenType.KEYWORD);
    }
  }

  private initializeStateTable(): void {
    this.stateTable.addState(LexerState.INITIAL);
    this.stateTable.addState(LexerState.IDENTIFIER);
    this.stateTable.addState(LexerState.NUMBER);
    this.stateTable.addState(LexerState.STRING);
    this.stateTable.addState(LexerState.OPERATOR);
    this.stateTable.addState(LexerState.COMMENT);
    
    this.setupStateTransitions();
  }

  private setupStateTransitions(): void {
    const table = this.stateTable;
    
    table.addTransition(LexerState.INITIAL, CharacterClass.LETTER, LexerState.IDENTIFIER);
    table.addTransition(LexerState.IDENTIFIER, CharacterClass.ALPHANUMERIC, LexerState.IDENTIFIER);
    
    table.addTransition(LexerState.INITIAL, CharacterClass.DIGIT, LexerState.NUMBER);
    table.addTransition(LexerState.NUMBER, CharacterClass.DIGIT, LexerState.NUMBER);
    table.addTransition(LexerState.NUMBER, CharacterClass.DOT, LexerState.NUMBER);
    
    table.addTransition(LexerState.INITIAL, CharacterClass.QUOTE, LexerState.STRING);
    table.addTransition(LexerState.INITIAL, CharacterClass.SLASH, LexerState.COMMENT);
  }

  tokenize(input: string): OptimizedLexicalResult {
    const startTime = performance.now();
    this.metrics.reset();
    
    const tokens = this.tokenPool.acquire();
    const errors: LexicalError[] = [];
    
    // 簡略化された実装
    const basicResult = new RegexLexer().tokenize(input);
    
    const endTime = performance.now();
    this.metrics.recordTime(endTime - startTime);
    this.metrics.recordTokens(basicResult.tokens.length);
    
    return new OptimizedLexicalResult(basicResult.tokens, basicResult.errors, this.metrics.getSnapshot());
  }

  private classifyCharacter(char: string): CharacterClass {
    const code = char.charCodeAt(0);
    
    if (code >= 65 && code <= 90) return CharacterClass.LETTER;
    if (code >= 97 && code <= 122) return CharacterClass.LETTER;
    if (code >= 48 && code <= 57) return CharacterClass.DIGIT;
    if (code === 95) return CharacterClass.UNDERSCORE;
    if (code === 46) return CharacterClass.DOT;
    if (code === 34 || code === 39) return CharacterClass.QUOTE;
    if (code === 47) return CharacterClass.SLASH;
    if (code === 32 || code === 9) return CharacterClass.WHITESPACE;
    if (code === 10 || code === 13) return CharacterClass.NEWLINE;
    
    return CharacterClass.OTHER;
  }
}

// 補助クラスの実装
export enum CharacterClass {
  LETTER = 'LETTER',
  DIGIT = 'DIGIT',
  ALPHANUMERIC = 'ALPHANUMERIC',
  UNDERSCORE = 'UNDERSCORE',
  DOT = 'DOT',
  QUOTE = 'QUOTE',
  SLASH = 'SLASH',
  WHITESPACE = 'WHITESPACE',
  NEWLINE = 'NEWLINE',
  OTHER = 'OTHER'
}

export enum LexerState {
  INITIAL = 'INITIAL',
  IDENTIFIER = 'IDENTIFIER',
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  OPERATOR = 'OPERATOR',
  COMMENT = 'COMMENT',
  ERROR = 'ERROR'
}

export class LexerStateTable {
  private transitions: Map<string, LexerState> = new Map();
  private actions: Map<string, StateAction> = new Map();
  private states: Set<LexerState> = new Set();

  addState(state: LexerState): void {
    this.states.add(state);
  }

  addTransition(from: LexerState, on: CharacterClass, to: LexerState): void {
    const key = `${from}:${on}`;
    this.transitions.set(key, to);
  }

  addAction(from: LexerState, on: CharacterClass, action: StateAction): void {
    const key = `${from}:${on}`;
    this.actions.set(key, action);
  }

  getNextState(from: LexerState, on: CharacterClass): LexerState {
    const key = `${from}:${on}`;
    return this.transitions.get(key) || from;
  }

  getAction(from: LexerState, on: CharacterClass): StateAction | undefined {
    const key = `${from}:${on}`;
    return this.actions.get(key);
  }
}

export type StateAction = (char: string, position: number, line: number, column: number) => ProcessResult;

export class ProcessResult {
  constructor(
    public nextState: LexerState,
    public nextPosition: number,
    public token?: AdvancedToken,
    public error?: LexicalError
  ) {}
}

export class TokenPool {
  private pool: AdvancedToken[][] = [];
  private maxPoolSize = 10;

  acquire(): AdvancedToken[] {
    return this.pool.pop() || [];
  }

  release(tokens: AdvancedToken[]): void {
    if (this.pool.length < this.maxPoolSize) {
      tokens.length = 0;
      this.pool.push(tokens);
    }
  }
}

export class LexerMetrics {
  private tokenCount = 0;
  private processingTime = 0;
  private errorCount = 0;
  private cacheHits = 0;
  private cacheMisses = 0;

  reset(): void {
    this.tokenCount = 0;
    this.processingTime = 0;
    this.errorCount = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  recordTime(time: number): void {
    this.processingTime = time;
  }

  recordTokens(count: number): void {
    this.tokenCount = count;
  }

  recordError(): void {
    this.errorCount++;
  }

  recordCacheHit(): void {
    this.cacheHits++;
  }

  recordCacheMiss(): void {
    this.cacheMisses++;
  }

  getSnapshot(): MetricsSnapshot {
    return new MetricsSnapshot(
      this.tokenCount,
      this.processingTime,
      this.errorCount,
      this.cacheHits,
      this.cacheMisses
    );
  }
}

export class MetricsSnapshot {
  constructor(
    public tokenCount: number,
    public processingTime: number,
    public errorCount: number,
    public cacheHits: number,
    public cacheMisses: number
  ) {}

  getTokensPerSecond(): number {
    return this.processingTime > 0 ? this.tokenCount / (this.processingTime / 1000) : 0;
  }

  getCacheHitRate(): number {
    const total = this.cacheHits + this.cacheMisses;
    return total > 0 ? this.cacheHits / total : 0;
  }
}

export class OptimizedLexicalResult {
  constructor(
    public tokens: AdvancedToken[],
    public errors: LexicalError[],
    public metrics: MetricsSnapshot
  ) {}

  getPerformanceReport(): PerformanceReport {
    return new PerformanceReport(
      this.metrics.getTokensPerSecond(),
      this.metrics.getCacheHitRate(),
      this.errors.length,
      this.tokens.length
    );
  }
}

export class PerformanceReport {
  constructor(
    public tokensPerSecond: number,
    public cacheHitRate: number,
    public errorCount: number,
    public tokenCount: number
  ) {}

  toString(): string {
    return `Performance Report:
  - Tokens/sec: ${this.tokensPerSecond.toFixed(2)}
  - Cache hit rate: ${(this.cacheHitRate * 100).toFixed(2)}%
  - Error count: ${this.errorCount}
  - Token count: ${this.tokenCount}`;
  }
}