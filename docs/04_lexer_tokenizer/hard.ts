/**
 * 🔴 04_lexer_tokenizer 上級問題: 最高度字句解析エンジン実装
 * 
 * プロダクション品質の字句解析エンジンを実装してください。
 * この問題では、パフォーマンス最適化、国際化対応、プラグイン拡張機能を学びます。
 */

// ===== 最適化字句解析エンジン =====

export class OptimizedLexer {
  private tokenPool: TokenPool = new TokenPool();
  private lookupTable: Map<string, AdvancedTokenType> = new Map();
  private stateTable: LexerStateTable = new LexerStateTable();
  private metrics: LexerMetrics = new LexerMetrics();

  constructor() {
    this.buildLookupTable();
    this.initializeStateTable();
  }

  /**
   * 高速ルックアップテーブルを構築します
   */
  private buildLookupTable(): void {
    // TODO: O(1)ルックアップテーブルの構築
    // ヒント1: ハッシュテーブルによる高速検索
    // ヒント2: キーワードの事前計算
    // ヒント3: 文字コードによる分類
    
    // キーワードのハッシュテーブル
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

  /**
   * 状態テーブルを初期化します
   */
  private initializeStateTable(): void {
    // TODO: 有限状態機械による字句解析
    // ヒント1: 状態遷移テーブル
    // ヒント2: アクション関数
    // ヒント3: 予測的解析
    
    this.stateTable.addState(LexerState.INITIAL);
    this.stateTable.addState(LexerState.IDENTIFIER);
    this.stateTable.addState(LexerState.NUMBER);
    this.stateTable.addState(LexerState.STRING);
    this.stateTable.addState(LexerState.OPERATOR);
    this.stateTable.addState(LexerState.COMMENT);
    
    // 状態遷移の定義
    this.setupStateTransitions();
  }

  /**
   * 状態遷移を設定します
   */
  private setupStateTransitions(): void {
    const table = this.stateTable;
    
    // 英字 -> 識別子状態
    table.addTransition(LexerState.INITIAL, CharacterClass.LETTER, LexerState.IDENTIFIER);
    table.addTransition(LexerState.IDENTIFIER, CharacterClass.ALPHANUMERIC, LexerState.IDENTIFIER);
    
    // 数字 -> 数値状態
    table.addTransition(LexerState.INITIAL, CharacterClass.DIGIT, LexerState.NUMBER);
    table.addTransition(LexerState.NUMBER, CharacterClass.DIGIT, LexerState.NUMBER);
    table.addTransition(LexerState.NUMBER, CharacterClass.DOT, LexerState.NUMBER);
    
    // 引用符 -> 文字列状態
    table.addTransition(LexerState.INITIAL, CharacterClass.QUOTE, LexerState.STRING);
    
    // スラッシュ -> コメント状態
    table.addTransition(LexerState.INITIAL, CharacterClass.SLASH, LexerState.COMMENT);
  }

  /**
   * 高速字句解析を実行します
   */
  tokenize(input: string): OptimizedLexicalResult {
    // TODO: 高速字句解析の実装
    // ヒント1: バイト単位の処理
    // ヒント2: 分岐予測の最適化
    // ヒント3: メモリプールの活用
    
    const startTime = performance.now();
    this.metrics.reset();
    
    const tokens = this.tokenPool.acquire();
    const errors: LexicalError[] = [];
    
    let position = 0;
    let line = 1;
    let column = 1;
    let state = LexerState.INITIAL;
    
    while (position < input.length) {
      const char = input[position];
      const charClass = this.classifyCharacter(char);
      
      const result = this.processCharacter(char, charClass, state, position, line, column);
      
      if (result.token) {
        tokens.push(result.token);
      }
      
      if (result.error) {
        errors.push(result.error);
      }
      
      state = result.nextState;
      position = result.nextPosition;
      
      if (char === '\n') {
        line++;
        column = 1;
      } else {
        column++;
      }
    }
    
    const endTime = performance.now();
    this.metrics.recordTime(endTime - startTime);
    this.metrics.recordTokens(tokens.length);
    
    return new OptimizedLexicalResult(tokens, errors, this.metrics.getSnapshot());
  }

  /**
   * 文字を分類します
   */
  private classifyCharacter(char: string): CharacterClass {
    const code = char.charCodeAt(0);
    
    if (code >= 65 && code <= 90) return CharacterClass.LETTER; // A-Z
    if (code >= 97 && code <= 122) return CharacterClass.LETTER; // a-z
    if (code >= 48 && code <= 57) return CharacterClass.DIGIT; // 0-9
    if (code === 95) return CharacterClass.UNDERSCORE; // _
    if (code === 46) return CharacterClass.DOT; // .
    if (code === 34 || code === 39) return CharacterClass.QUOTE; // " '
    if (code === 47) return CharacterClass.SLASH; // /
    if (code === 32 || code === 9) return CharacterClass.WHITESPACE; // space, tab
    if (code === 10 || code === 13) return CharacterClass.NEWLINE; // \n \r
    
    return CharacterClass.OTHER;
  }

  /**
   * 文字を処理します
   */
  private processCharacter(
    char: string,
    charClass: CharacterClass,
    state: LexerState,
    position: number,
    line: number,
    column: number
  ): ProcessResult {
    // TODO: 状態に基づく文字処理
    const nextState = this.stateTable.getNextState(state, charClass);
    const action = this.stateTable.getAction(state, charClass);
    
    if (action) {
      return action(char, position, line, column);
    }
    
    return new ProcessResult(nextState, position + 1);
  }
}

// ===== 文字分類 =====

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

// ===== 字句解析状態 =====

export enum LexerState {
  INITIAL = 'INITIAL',
  IDENTIFIER = 'IDENTIFIER',
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  OPERATOR = 'OPERATOR',
  COMMENT = 'COMMENT',
  ERROR = 'ERROR'
}

// ===== 状態テーブル =====

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

// ===== パフォーマンス管理 =====

export class TokenPool {
  private pool: AdvancedToken[][] = [];
  private maxPoolSize = 10;

  /**
   * トークン配列を取得します
   */
  acquire(): AdvancedToken[] {
    return this.pool.pop() || [];
  }

  /**
   * トークン配列を返却します
   */
  release(tokens: AdvancedToken[]): void {
    if (this.pool.length < this.maxPoolSize) {
      tokens.length = 0; // 配列をクリア
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

// ===== 国際化対応 =====

export class InternationalLexer extends OptimizedLexer {
  private unicodeCategories: Map<string, UnicodeCategory> = new Map();
  private localizedKeywords: Map<string, Map<string, AdvancedTokenType>> = new Map();

  constructor(locale: string = 'en-US') {
    super();
    this.setupUnicodeSupport();
    this.loadLocalizedKeywords(locale);
  }

  /**
   * Unicode文字カテゴリサポートを設定します
   */
  private setupUnicodeSupport(): void {
    // TODO: Unicode文字カテゴリの設定
    // ヒント1: Unicode文字プロパティ
    // ヒント2: 正規化形式
    // ヒント3: 双方向テキスト
    
    // 基本的なUnicodeカテゴリ
    this.unicodeCategories.set('L', UnicodeCategory.LETTER);
    this.unicodeCategories.set('N', UnicodeCategory.NUMBER);
    this.unicodeCategories.set('P', UnicodeCategory.PUNCTUATION);
    this.unicodeCategories.set('S', UnicodeCategory.SYMBOL);
    this.unicodeCategories.set('Z', UnicodeCategory.SEPARATOR);
    this.unicodeCategories.set('M', UnicodeCategory.MARK);
    this.unicodeCategories.set('C', UnicodeCategory.OTHER);
  }

  /**
   * ローカライズされたキーワードを読み込みます
   */
  private loadLocalizedKeywords(locale: string): void {
    // TODO: 多言語キーワードサポート
    // ヒント1: 言語別キーワードマップ
    // ヒント2: フォールバック機構
    // ヒント3: 動的読み込み
    
    const englishKeywords = new Map<string, AdvancedTokenType>();
    englishKeywords.set('if', AdvancedTokenType.KEYWORD);
    englishKeywords.set('while', AdvancedTokenType.KEYWORD);
    englishKeywords.set('function', AdvancedTokenType.KEYWORD);
    
    const japaneseKeywords = new Map<string, AdvancedTokenType>();
    japaneseKeywords.set('もし', AdvancedTokenType.KEYWORD);
    japaneseKeywords.set('繰り返し', AdvancedTokenType.KEYWORD);
    japaneseKeywords.set('関数', AdvancedTokenType.KEYWORD);
    
    this.localizedKeywords.set('en-US', englishKeywords);
    this.localizedKeywords.set('ja-JP', japaneseKeywords);
  }

  /**
   * Unicode文字を分類します
   */
  classifyUnicodeCharacter(char: string): UnicodeCategory {
    // 簡略化された実装
    const code = char.charCodeAt(0);
    
    if (code >= 0x0041 && code <= 0x005A) return UnicodeCategory.LETTER; // A-Z
    if (code >= 0x0061 && code <= 0x007A) return UnicodeCategory.LETTER; // a-z
    if (code >= 0x0030 && code <= 0x0039) return UnicodeCategory.NUMBER; // 0-9
    if (code >= 0x3040 && code <= 0x309F) return UnicodeCategory.LETTER; // ひらがな
    if (code >= 0x30A0 && code <= 0x30FF) return UnicodeCategory.LETTER; // カタカナ
    if (code >= 0x4E00 && code <= 0x9FAF) return UnicodeCategory.LETTER; // 漢字
    
    return UnicodeCategory.OTHER;
  }
}

export enum UnicodeCategory {
  LETTER = 'LETTER',
  NUMBER = 'NUMBER',
  PUNCTUATION = 'PUNCTUATION',
  SYMBOL = 'SYMBOL',
  SEPARATOR = 'SEPARATOR',
  MARK = 'MARK',
  OTHER = 'OTHER'
}

// ===== プラグインシステム =====

export interface LexerPlugin {
  name: string;
  version: string;
  initialize(lexer: PluggableLexer): void;
  tokenize?(input: string, position: number): PluginTokenResult | null;
  preprocess?(input: string): string;
  postprocess?(tokens: AdvancedToken[]): AdvancedToken[];
}

export class PluginTokenResult {
  constructor(
    public token: AdvancedToken,
    public consumedLength: number
  ) {}
}

export class PluggableLexer extends OptimizedLexer {
  private plugins: Map<string, LexerPlugin> = new Map();
  private pluginOrder: string[] = [];

  /**
   * プラグインを登録します
   */
  registerPlugin(plugin: LexerPlugin): void {
    // TODO: プラグインの登録と管理
    // ヒント1: 依存関係の解決
    // ヒント2: 初期化順序
    // ヒント3: エラーハンドリング
    
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} is already registered`);
    }
    
    this.plugins.set(plugin.name, plugin);
    this.pluginOrder.push(plugin.name);
    
    try {
      plugin.initialize(this);
    } catch (error) {
      this.plugins.delete(plugin.name);
      const index = this.pluginOrder.indexOf(plugin.name);
      if (index >= 0) {
        this.pluginOrder.splice(index, 1);
      }
      throw new Error(`Failed to initialize plugin ${plugin.name}: ${error}`);
    }
  }

  /**
   * プラグインを削除します
   */
  unregisterPlugin(name: string): void {
    this.plugins.delete(name);
    const index = this.pluginOrder.indexOf(name);
    if (index >= 0) {
      this.pluginOrder.splice(index, 1);
    }
  }

  /**
   * プラグイン対応字句解析
   */
  tokenizeWithPlugins(input: string): OptimizedLexicalResult {
    // TODO: プラグインチェーンの実行
    // ヒント1: 前処理プラグイン
    // ヒント2: トークン生成プラグイン
    // ヒント3: 後処理プラグイン
    
    let processedInput = input;
    
    // 前処理プラグインの実行
    for (const pluginName of this.pluginOrder) {
      const plugin = this.plugins.get(pluginName);
      if (plugin && plugin.preprocess) {
        processedInput = plugin.preprocess(processedInput);
      }
    }
    
    // 基本字句解析
    const result = this.tokenize(processedInput);
    let tokens = result.tokens;
    
    // 後処理プラグインの実行
    for (const pluginName of this.pluginOrder) {
      const plugin = this.plugins.get(pluginName);
      if (plugin && plugin.postprocess) {
        tokens = plugin.postprocess(tokens);
      }
    }
    
    return new OptimizedLexicalResult(tokens, result.errors, result.metrics);
  }
}

// ===== サンプルプラグイン =====

export class MacroExpansionPlugin implements LexerPlugin {
  name = 'MacroExpansion';
  version = '1.0.0';
  private macros: Map<string, string> = new Map();

  initialize(lexer: PluggableLexer): void {
    // マクロの定義
    this.macros.set('ATTACK_NEAREST', 'ATTACK nearest_mob');
    this.macros.set('HEAL_SELF', 'USE potion_of_healing');
  }

  preprocess(input: string): string {
    let result = input;
    
    for (const [macro, expansion] of this.macros) {
      const regex = new RegExp(`\\b${macro}\\b`, 'g');
      result = result.replace(regex, expansion);
    }
    
    return result;
  }
}

export class SyntaxHighlightPlugin implements LexerPlugin {
  name = 'SyntaxHighlight';
  version = '1.0.0';

  initialize(lexer: PluggableLexer): void {
    // 初期化処理
  }

  postprocess(tokens: AdvancedToken[]): AdvancedToken[] {
    // トークンに色情報を追加
    return tokens.map(token => {
      const coloredToken = { ...token } as any;
      coloredToken.color = this.getTokenColor(token.type);
      return coloredToken;
    });
  }

  private getTokenColor(type: AdvancedTokenType): string {
    switch (type) {
      case AdvancedTokenType.KEYWORD: return '#569CD6';
      case AdvancedTokenType.STRING: return '#CE9178';
      case AdvancedTokenType.NUMBER: return '#B5CEA8';
      case AdvancedTokenType.COMMENT: return '#6A9955';
      default: return '#D4D4D4';
    }
  }
}

// ===== 結果クラス =====

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

// ===== デモクラス =====

export class MasterLexerDemo {
  /**
   * 最高度字句解析機能のデモを実行します
   */
  public static runDemo(): void {
    console.log('=== Master Lexer Demo ===');

    // 複雑な多言語BotScriptコード
    const multilingualCode = `
      // English keywords
      FUNCTION calculateHealth(base, modifier)
        DEF result = base * modifier
        IF result <= 0
          RETURN 0
        ENDIF
        RETURN result
      ENDFUNCTION
      
      // Japanese keywords (simulated)
      もし playerHealth < 50
        SAY "体力が低下しています"
        USE "回復薬"
      ENDIF
      
      // Unicode identifiers
      DEF プレイヤー名 = "冒険者"
      DEF ダメージ値 = 25.5
      
      // Complex expressions
      WHILE (health > 0) && (energy >= 10)
        ATTACK_NEAREST  // マクロ展開
        WAIT 1.5
      ENDWHILE
    `;

    // 最適化字句解析器のテスト
    console.log('\n--- Optimized Lexer Test ---');
    const optimizedLexer = new OptimizedLexer();
    const startTime = performance.now();
    
    const result = optimizedLexer.tokenize(multilingualCode);
    const endTime = performance.now();
    
    console.log(`Processing time: ${(endTime - startTime).toFixed(2)}ms`);
    console.log(result.getPerformanceReport().toString());

    // 国際化字句解析器のテスト
    console.log('\n--- International Lexer Test ---');
    const intlLexer = new InternationalLexer('ja-JP');
    const intlResult = intlLexer.tokenize(multilingualCode);
    
    console.log(`International tokens: ${intlResult.tokens.length}`);
    
    // プラグイン対応字句解析器のテスト
    console.log('\n--- Pluggable Lexer Test ---');
    const pluggableLexer = new PluggableLexer();
    
    // プラグインの登録
    pluggableLexer.registerPlugin(new MacroExpansionPlugin());
    pluggableLexer.registerPlugin(new SyntaxHighlightPlugin());
    
    const pluginResult = pluggableLexer.tokenizeWithPlugins(multilingualCode);
    
    console.log(`Plugin-processed tokens: ${pluginResult.tokens.length}`);
    console.log(`First token color: ${(pluginResult.tokens[0] as any).color || 'N/A'}`);

    // メモリ使用量の比較
    console.log('\n--- Memory Usage Test ---');
    const memBefore = process.memoryUsage();
    
    // 大量のデータを処理
    const largeCode = multilingualCode.repeat(1000);
    optimizedLexer.tokenize(largeCode);
    
    const memAfter = process.memoryUsage();
    const memDiff = memAfter.heapUsed - memBefore.heapUsed;
    console.log(`Memory usage: ${(memDiff / 1024 / 1024).toFixed(2)} MB`);

    console.log('\nMaster lexer demo completed');
  }
}

// 必要なインポート
import { AdvancedTokenType, AdvancedToken, LexicalError } from './normal';