/**
 * 🟡 07_execution_context 中級問題: 高度な実行コンテキスト管理実装
 * 
 * より複雑な実行コンテキストとメモリ管理を実装してください。
 * この問題では、スコープチェーン、クロージャ、メモリリーク対策を学びます。
 */

// ===== 高度な実行コンテキスト =====

export class AdvancedExecutionContext {
  private scopeChain: ScopeChain = new ScopeChain();
  private memoryManager: MemoryManager = new MemoryManager();
  private closureManager: ClosureManager = new ClosureManager();
  private exceptionHandler: ExceptionHandler = new ExceptionHandler();

  /**
   * 新しいスコープを作成します
   */
  createScope(type: ScopeType, parent?: Scope): Scope {
    // TODO: スコープの作成と管理
    // ヒント1: スコープタイプによる処理の分岐
    // ヒント2: 親スコープとの関連付け
    // ヒント3: メモリ管理の考慮
    // ヒント4: スコープチェーンの構築
    
    const parentScope = parent || this.scopeChain.getCurrentScope();
    const scope = new Scope(type, parentScope);
    
    // スコープタイプに応じた初期化
    switch (type) {
      case ScopeType.GLOBAL:
        this.initializeGlobalScope(scope);
        break;
      case ScopeType.FUNCTION:
        this.initializeFunctionScope(scope);
        break;
      case ScopeType.BLOCK:
        this.initializeBlockScope(scope);
        break;
      case ScopeType.MODULE:
        this.initializeModuleScope(scope);
        break;
    }
    
    // メモリ管理への登録
    this.memoryManager.registerScope(scope);
    
    return scope;
  }

  /**
   * スコープに入ります
   */
  enterScope(scope: Scope): void {
    this.scopeChain.push(scope);
    scope.enter();
  }

  /**
   * スコープから出ます
   */
  exitScope(): Scope | null {
    const scope = this.scopeChain.pop();
    
    if (scope) {
      scope.exit();
      
      // クロージャの作成判定
      if (this.shouldCreateClosure(scope)) {
        this.closureManager.createClosure(scope);
      } else {
        // スコープのクリーンアップ
        this.memoryManager.unregisterScope(scope);
      }
    }
    
    return scope;
  }

  /**
   * 変数を検索します
   */
  resolveVariable(name: string): VariableBinding | null {
    // TODO: 変数の解決
    // ヒント1: スコープチェーンの探索
    // ヒント2: シャドウイングの処理
    // ヒント3: クロージャ変数の検索
    // ヒント4: グローバル変数のフォールバック
    
    // スコープチェーンを上向きに検索
    for (const scope of this.scopeChain.getScopes()) {
      const binding = scope.getBinding(name);
      if (binding) {
        // アクセス記録
        binding.recordAccess();
        return binding;
      }
    }
    
    // クロージャ内の変数を検索
    const closureBinding = this.closureManager.resolveVariable(name);
    if (closureBinding) {
      return closureBinding;
    }
    
    return null;
  }

  /**
   * 変数を定義します
   */
  defineVariable(name: string, value: any, mutable: boolean = true): VariableBinding {
    const currentScope = this.scopeChain.getCurrentScope();
    
    if (!currentScope) {
      throw new ExecutionError('No active scope for variable definition');
    }
    
    const binding = new VariableBinding(name, value, mutable, currentScope.getType());
    currentScope.define(name, binding);
    
    return binding;
  }

  /**
   * 例外処理を実行します
   */
  handleException(error: RuntimeException): void {
    this.exceptionHandler.handle(error, this.scopeChain);
  }

  /**
   * グローバルスコープを初期化します
   */
  private initializeGlobalScope(scope: Scope): void {
    // 組み込み関数の定義
    const builtins = this.getBuiltinFunctions();
    for (const [name, func] of builtins) {
      scope.define(name, new VariableBinding(name, func, false, ScopeType.GLOBAL));
    }
  }

  /**
   * 関数スコープを初期化します
   */
  private initializeFunctionScope(scope: Scope): void {
    // arguments オブジェクトの作成
    const args = this.getCurrentFunctionArguments();
    scope.define('arguments', new VariableBinding('arguments', args, false, ScopeType.FUNCTION));
  }

  /**
   * ブロックスコープを初期化します
   */
  private initializeBlockScope(scope: Scope): void {
    // ブロックスコープ特有の初期化は不要
  }

  /**
   * モジュールスコープを初期化します
   */
  private initializeModuleScope(scope: Scope): void {
    // モジュールシステムの初期化
    scope.define('exports', new VariableBinding('exports', {}, true, ScopeType.MODULE));
    scope.define('module', new VariableBinding('module', { exports: {} }, false, ScopeType.MODULE));
  }

  /**
   * クロージャを作成すべきかチェックします
   */
  private shouldCreateClosure(scope: Scope): boolean {
    // 関数スコープで外部からの参照がある場合
    return scope.getType() === ScopeType.FUNCTION && scope.hasExternalReferences();
  }

  /**
   * 組み込み関数を取得します
   */
  private getBuiltinFunctions(): Map<string, Function> {
    const builtins = new Map<string, Function>();
    
    builtins.set('print', {
      name: 'print',
      call: (args: any[]) => console.log(...args)
    });
    
    builtins.set('typeof', {
      name: 'typeof',
      call: (args: any[]) => typeof args[0]
    });
    
    builtins.set('parseInt', {
      name: 'parseInt',
      call: (args: any[]) => parseInt(args[0], args[1] || 10)
    });
    
    return builtins;
  }

  /**
   * 現在の関数の引数を取得します
   */
  private getCurrentFunctionArguments(): any[] {
    // 簡略化された実装
    return [];
  }
}

// ===== スコープ管理 =====

export enum ScopeType {
  GLOBAL = 'GLOBAL',
  FUNCTION = 'FUNCTION',
  BLOCK = 'BLOCK',
  MODULE = 'MODULE',
  CLASS = 'CLASS'
}

export class Scope {
  private bindings: Map<string, VariableBinding> = new Map();
  private children: Set<Scope> = new Set();
  private createdAt: number = Date.now();
  private accessCount: number = 0;
  private isActive: boolean = false;

  constructor(
    private type: ScopeType,
    private parent: Scope | null = null
  ) {
    if (parent) {
      parent.addChild(this);
    }
  }

  /**
   * スコープに入ります
   */
  enter(): void {
    this.isActive = true;
  }

  /**
   * スコープから出ます
   */
  exit(): void {
    this.isActive = false;
  }

  /**
   * 変数を定義します
   */
  define(name: string, binding: VariableBinding): void {
    if (this.bindings.has(name)) {
      throw new ExecutionError(`Variable '${name}' is already defined in this scope`);
    }
    
    this.bindings.set(name, binding);
    binding.setScope(this);
  }

  /**
   * 変数バインディングを取得します
   */
  getBinding(name: string): VariableBinding | null {
    this.accessCount++;
    return this.bindings.get(name) || null;
  }

  /**
   * 変数を設定します
   */
  setVariable(name: string, value: any): boolean {
    const binding = this.bindings.get(name);
    
    if (binding) {
      if (!binding.isMutable()) {
        throw new ExecutionError(`Cannot assign to immutable variable '${name}'`);
      }
      binding.setValue(value);
      return true;
    }
    
    return false;
  }

  /**
   * スコープタイプを取得します
   */
  getType(): ScopeType {
    return this.type;
  }

  /**
   * 親スコープを取得します
   */
  getParent(): Scope | null {
    return this.parent;
  }

  /**
   * 子スコープを追加します
   */
  addChild(child: Scope): void {
    this.children.add(child);
  }

  /**
   * 外部参照があるかチェックします
   */
  hasExternalReferences(): boolean {
    // TODO: 外部参照の検出
    // ヒント1: クロージャによる参照
    // ヒント2: イベントハンドラへの参照
    // ヒント3: タイマー関数への参照
    
    // 簡略化された実装
    return this.accessCount > 10 || this.children.size > 0;
  }

  /**
   * スコープの統計情報を取得します
   */
  getStatistics(): ScopeStatistics {
    return new ScopeStatistics(
      this.type,
      this.bindings.size,
      this.accessCount,
      this.children.size,
      Date.now() - this.createdAt,
      this.isActive
    );
  }

  /**
   * すべてのバインディングを取得します
   */
  getAllBindings(): Map<string, VariableBinding> {
    return new Map(this.bindings);
  }
}

export class ScopeChain {
  private scopes: Scope[] = [];

  /**
   * スコープをプッシュします
   */
  push(scope: Scope): void {
    this.scopes.push(scope);
  }

  /**
   * スコープをポップします
   */
  pop(): Scope | null {
    return this.scopes.pop() || null;
  }

  /**
   * 現在のスコープを取得します
   */
  getCurrentScope(): Scope | null {
    return this.scopes.length > 0 ? this.scopes[this.scopes.length - 1] : null;
  }

  /**
   * すべてのスコープを取得します
   */
  getScopes(): Scope[] {
    return [...this.scopes].reverse(); // 現在から上位へ
  }

  /**
   * スコープチェーンの深度を取得します
   */
  getDepth(): number {
    return this.scopes.length;
  }
}

// ===== 変数バインディング =====

export class VariableBinding {
  private accessCount: number = 0;
  private lastAccessed: number = Date.now();
  private scope: Scope | null = null;

  constructor(
    private name: string,
    private value: any,
    private mutable: boolean,
    private scopeType: ScopeType
  ) {}

  /**
   * 値を取得します
   */
  getValue(): any {
    this.recordAccess();
    return this.value;
  }

  /**
   * 値を設定します
   */
  setValue(value: any): void {
    if (!this.mutable) {
      throw new ExecutionError(`Cannot assign to immutable variable '${this.name}'`);
    }
    
    this.value = value;
    this.recordAccess();
  }

  /**
   * 変更可能かチェックします
   */
  isMutable(): boolean {
    return this.mutable;
  }

  /**
   * 名前を取得します
   */
  getName(): string {
    return this.name;
  }

  /**
   * スコープタイプを取得します
   */
  getScopeType(): ScopeType {
    return this.scopeType;
  }

  /**
   * アクセスを記録します
   */
  recordAccess(): void {
    this.accessCount++;
    this.lastAccessed = Date.now();
  }

  /**
   * スコープを設定します
   */
  setScope(scope: Scope): void {
    this.scope = scope;
  }

  /**
   * バインディング情報を取得します
   */
  getInfo(): BindingInfo {
    return new BindingInfo(
      this.name,
      typeof this.value,
      this.mutable,
      this.scopeType,
      this.accessCount,
      this.lastAccessed
    );
  }
}

export class BindingInfo {
  constructor(
    public name: string,
    public type: string,
    public mutable: boolean,
    public scopeType: ScopeType,
    public accessCount: number,
    public lastAccessed: number
  ) {}
}

// ===== クロージャ管理 =====

export class ClosureManager {
  private closures: Map<string, Closure> = new Map();
  private weakReferences: WeakMap<object, ClosureData> = new WeakMap();

  /**
   * クロージャを作成します
   */
  createClosure(scope: Scope): Closure {
    // TODO: クロージャの作成
    // ヒント1: 自由変数の特定
    // ヒント2: 環境の保存
    // ヒント3: メモリリークの防止
    // ヒント4: 弱参照の活用
    
    const freeVariables = this.extractFreeVariables(scope);
    const environment = this.captureEnvironment(freeVariables);
    
    const closure = new Closure(
      this.generateClosureId(),
      environment,
      scope.getType()
    );
    
    this.closures.set(closure.getId(), closure);
    
    return closure;
  }

  /**
   * クロージャ内の変数を解決します
   */
  resolveVariable(name: string): VariableBinding | null {
    for (const closure of this.closures.values()) {
      const binding = closure.getBinding(name);
      if (binding) {
        return binding;
      }
    }
    
    return null;
  }

  /**
   * 自由変数を抽出します
   */
  private extractFreeVariables(scope: Scope): string[] {
    const freeVars: string[] = [];
    const bindings = scope.getAllBindings();
    
    for (const [name, binding] of bindings) {
      // 外部から参照される可能性のある変数
      if (this.isReferencedExternally(name, binding)) {
        freeVars.push(name);
      }
    }
    
    return freeVars;
  }

  /**
   * 環境をキャプチャします
   */
  private captureEnvironment(freeVariables: string[]): Map<string, any> {
    const environment = new Map<string, any>();
    
    // 自由変数の値をキャプチャ
    for (const varName of freeVariables) {
      // 現在の値をコピー
      const currentValue = this.getCurrentVariableValue(varName);
      environment.set(varName, this.deepClone(currentValue));
    }
    
    return environment;
  }

  /**
   * 外部参照されているかチェックします
   */
  private isReferencedExternally(name: string, binding: VariableBinding): boolean {
    // 簡略化された実装
    return binding.getInfo().accessCount > 1;
  }

  /**
   * 現在の変数値を取得します
   */
  private getCurrentVariableValue(name: string): any {
    // 簡略化された実装
    return null;
  }

  /**
   * ディープクローンを作成します
   */
  private deepClone(value: any): any {
    if (value === null || typeof value !== 'object') {
      return value;
    }
    
    if (Array.isArray(value)) {
      return value.map(item => this.deepClone(item));
    }
    
    const cloned: any = {};
    for (const key in value) {
      if (value.hasOwnProperty(key)) {
        cloned[key] = this.deepClone(value[key]);
      }
    }
    
    return cloned;
  }

  /**
   * クロージャIDを生成します
   */
  private generateClosureId(): string {
    return `closure_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * クロージャをクリーンアップします
   */
  cleanup(): void {
    const cutoffTime = Date.now() - 300000; // 5分前
    
    for (const [id, closure] of this.closures) {
      if (closure.getCreatedAt() < cutoffTime && !closure.isActive()) {
        this.closures.delete(id);
      }
    }
  }
}

export class Closure {
  private createdAt: number = Date.now();
  private active: boolean = true;

  constructor(
    private id: string,
    private environment: Map<string, any>,
    private scopeType: ScopeType
  ) {}

  /**
   * IDを取得します
   */
  getId(): string {
    return this.id;
  }

  /**
   * バインディングを取得します
   */
  getBinding(name: string): VariableBinding | null {
    if (this.environment.has(name)) {
      const value = this.environment.get(name);
      return new VariableBinding(name, value, true, this.scopeType);
    }
    
    return null;
  }

  /**
   * 作成時刻を取得します
   */
  getCreatedAt(): number {
    return this.createdAt;
  }

  /**
   * アクティブかチェックします
   */
  isActive(): boolean {
    return this.active;
  }

  /**
   * 非アクティブにします
   */
  deactivate(): void {
    this.active = false;
  }
}

export class ClosureData {
  constructor(
    public environment: Map<string, any>,
    public timestamp: number
  ) {}
}

// ===== メモリ管理 =====

export class MemoryManager {
  private scopeRegistry: Set<Scope> = new Set();
  private memoryUsage: MemoryUsage = new MemoryUsage();
  private leakDetector: MemoryLeakDetector = new MemoryLeakDetector();

  /**
   * スコープを登録します
   */
  registerScope(scope: Scope): void {
    this.scopeRegistry.add(scope);
    this.memoryUsage.recordScopeCreation();
  }

  /**
   * スコープの登録を解除します
   */
  unregisterScope(scope: Scope): void {
    this.scopeRegistry.delete(scope);
    this.memoryUsage.recordScopeDestruction();
  }

  /**
   * メモリリークを検出します
   */
  detectLeaks(): MemoryLeak[] {
    return this.leakDetector.detectLeaks(this.scopeRegistry);
  }

  /**
   * メモリ使用量を取得します
   */
  getMemoryUsage(): MemoryUsageSnapshot {
    return this.memoryUsage.getSnapshot();
  }

  /**
   * ガベージコレクションを実行します
   */
  collectGarbage(): GarbageCollectionResult {
    const beforeCount = this.scopeRegistry.size;
    const beforeMemory = process.memoryUsage().heapUsed;
    
    // 未使用スコープの特定と削除
    const unusedScopes = this.findUnusedScopes();
    for (const scope of unusedScopes) {
      this.unregisterScope(scope);
    }
    
    const afterCount = this.scopeRegistry.size;
    const afterMemory = process.memoryUsage().heapUsed;
    
    return new GarbageCollectionResult(
      beforeCount - afterCount,
      beforeMemory - afterMemory,
      Date.now()
    );
  }

  /**
   * 未使用スコープを検索します
   */
  private findUnusedScopes(): Scope[] {
    const unused: Scope[] = [];
    const cutoffTime = Date.now() - 60000; // 1分前
    
    for (const scope of this.scopeRegistry) {
      const stats = scope.getStatistics();
      if (!stats.isActive && stats.lastAccessTime < cutoffTime) {
        unused.push(scope);
      }
    }
    
    return unused;
  }
}

export class MemoryUsage {
  private scopeCount: number = 0;
  private peakScopeCount: number = 0;
  private creationCount: number = 0;
  private destructionCount: number = 0;

  recordScopeCreation(): void {
    this.scopeCount++;
    this.creationCount++;
    this.peakScopeCount = Math.max(this.peakScopeCount, this.scopeCount);
  }

  recordScopeDestruction(): void {
    this.scopeCount--;
    this.destructionCount++;
  }

  getSnapshot(): MemoryUsageSnapshot {
    return new MemoryUsageSnapshot(
      this.scopeCount,
      this.peakScopeCount,
      this.creationCount,
      this.destructionCount,
      process.memoryUsage().heapUsed
    );
  }
}

export class MemoryUsageSnapshot {
  constructor(
    public currentScopeCount: number,
    public peakScopeCount: number,
    public totalCreated: number,
    public totalDestroyed: number,
    public heapUsed: number
  ) {}
}

export class MemoryLeakDetector {
  /**
   * メモリリークを検出します
   */
  detectLeaks(scopes: Set<Scope>): MemoryLeak[] {
    const leaks: MemoryLeak[] = [];
    
    for (const scope of scopes) {
      const stats = scope.getStatistics();
      
      // 長時間アクティブなスコープ
      if (stats.isActive && stats.aliveTime > 600000) { // 10分
        leaks.push(new MemoryLeak(
          'long_lived_scope',
          `Scope has been active for ${stats.aliveTime}ms`,
          scope
        ));
      }
      
      // 過度に多くの変数を持つスコープ
      if (stats.bindingCount > 1000) {
        leaks.push(new MemoryLeak(
          'large_scope',
          `Scope contains ${stats.bindingCount} bindings`,
          scope
        ));
      }
      
      // 循環参照の可能性
      if (stats.childCount > 100) {
        leaks.push(new MemoryLeak(
          'potential_circular_reference',
          `Scope has ${stats.childCount} children`,
          scope
        ));
      }
    }
    
    return leaks;
  }
}

export class MemoryLeak {
  constructor(
    public type: string,
    public description: string,
    public scope: Scope
  ) {}
}

export class GarbageCollectionResult {
  constructor(
    public freedScopes: number,
    public freedMemory: number,
    public timestamp: number
  ) {}
}

// ===== 例外処理 =====

export class ExceptionHandler {
  private handlers: Map<string, ExceptionHandlerFunction> = new Map();

  constructor() {
    this.setupDefaultHandlers();
  }

  /**
   * 例外を処理します
   */
  handle(exception: RuntimeException, scopeChain: ScopeChain): void {
    const handler = this.handlers.get(exception.getType());
    
    if (handler) {
      handler(exception, scopeChain);
    } else {
      this.handleUnknownException(exception, scopeChain);
    }
  }

  /**
   * デフォルトハンドラを設定します
   */
  private setupDefaultHandlers(): void {
    this.handlers.set('ReferenceError', this.handleReferenceError.bind(this));
    this.handlers.set('TypeError', this.handleTypeError.bind(this));
    this.handlers.set('RangeError', this.handleRangeError.bind(this));
  }

  /**
   * 参照エラーを処理します
   */
  private handleReferenceError(exception: RuntimeException, scopeChain: ScopeChain): void {
    console.error(`ReferenceError: ${exception.getMessage()}`);
    this.printScopeChain(scopeChain);
  }

  /**
   * 型エラーを処理します
   */
  private handleTypeError(exception: RuntimeException, scopeChain: ScopeChain): void {
    console.error(`TypeError: ${exception.getMessage()}`);
  }

  /**
   * 範囲エラーを処理します
   */
  private handleRangeError(exception: RuntimeException, scopeChain: ScopeChain): void {
    console.error(`RangeError: ${exception.getMessage()}`);
  }

  /**
   * 未知の例外を処理します
   */
  private handleUnknownException(exception: RuntimeException, scopeChain: ScopeChain): void {
    console.error(`Unknown Exception: ${exception.getMessage()}`);
    this.printScopeChain(scopeChain);
  }

  /**
   * スコープチェーンを出力します
   */
  private printScopeChain(scopeChain: ScopeChain): void {
    console.log('Scope Chain:');
    const scopes = scopeChain.getScopes();
    
    for (let i = 0; i < scopes.length; i++) {
      const scope = scopes[i];
      const stats = scope.getStatistics();
      console.log(`  ${i}: ${stats.type} (${stats.bindingCount} bindings)`);
    }
  }
}

export type ExceptionHandlerFunction = (exception: RuntimeException, scopeChain: ScopeChain) => void;

export class RuntimeException {
  constructor(
    private type: string,
    private message: string,
    private line?: number,
    private column?: number
  ) {}

  getType(): string {
    return this.type;
  }

  getMessage(): string {
    return this.message;
  }

  getLine(): number | undefined {
    return this.line;
  }

  getColumn(): number | undefined {
    return this.column;
  }
}

// ===== 統計情報 =====

export class ScopeStatistics {
  constructor(
    public type: ScopeType,
    public bindingCount: number,
    public accessCount: number,
    public childCount: number,
    public aliveTime: number,
    public isActive: boolean,
    public lastAccessTime: number = Date.now()
  ) {}
}

export class ExecutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExecutionError';
  }
}

// ===== デモクラス =====

export class AdvancedExecutionContextDemo {
  /**
   * 高度な実行コンテキスト機能のデモを実行します
   */
  public static runDemo(): void {
    console.log('=== Advanced Execution Context Demo ===');

    // 実行コンテキストの作成
    const context = new AdvancedExecutionContext();

    // グローバルスコープの作成
    console.log('\n--- Global Scope Creation ---');
    const globalScope = context.createScope(ScopeType.GLOBAL);
    context.enterScope(globalScope);
    
    // グローバル変数の定義
    context.defineVariable('globalVar', 'I am global', false);
    
    const globalVar = context.resolveVariable('globalVar');
    console.log('Global variable:', globalVar?.getValue());

    // 関数スコープのテスト
    console.log('\n--- Function Scope Test ---');
    const functionScope = context.createScope(ScopeType.FUNCTION, globalScope);
    context.enterScope(functionScope);
    
    // 関数内変数の定義
    context.defineVariable('localVar', 'I am local', true);
    context.defineVariable('param', 42, true);
    
    const localVar = context.resolveVariable('localVar');
    const param = context.resolveVariable('param');
    console.log('Local variable:', localVar?.getValue());
    console.log('Parameter:', param?.getValue());
    
    // グローバル変数への参照
    const globalFromFunction = context.resolveVariable('globalVar');
    console.log('Global from function:', globalFromFunction?.getValue());

    // ブロックスコープのテスト
    console.log('\n--- Block Scope Test ---');
    const blockScope = context.createScope(ScopeType.BLOCK, functionScope);
    context.enterScope(blockScope);
    
    context.defineVariable('blockVar', 'I am in block', true);
    
    // 変数の変更
    const blockVar = context.resolveVariable('blockVar');
    if (blockVar) {
      blockVar.setValue('Modified in block');
      console.log('Modified block variable:', blockVar.getValue());
    }

    // スコープの終了
    console.log('\n--- Scope Exit Test ---');
    context.exitScope(); // block
    context.exitScope(); // function
    
    // 関数スコープの変数にアクセス不可
    const localAfterExit = context.resolveVariable('localVar');
    console.log('Local variable after exit:', localAfterExit?.getValue() || 'undefined');

    // クロージャのテスト
    console.log('\n--- Closure Test ---');
    const closureManager = new ClosureManager();
    
    // 新しい関数スコープでクロージャ作成
    const newFunctionScope = context.createScope(ScopeType.FUNCTION, globalScope);
    context.enterScope(newFunctionScope);
    
    context.defineVariable('closureVar', 'I will be captured', true);
    
    const closure = closureManager.createClosure(newFunctionScope);
    console.log('Closure created:', closure.getId());
    
    // クロージャから変数を解決
    const closureVar = closureManager.resolveVariable('closureVar');
    console.log('Closure variable:', closureVar?.getValue());

    // メモリ管理のテスト
    console.log('\n--- Memory Management Test ---');
    const memoryManager = new MemoryManager();
    
    // 複数のスコープを作成
    for (let i = 0; i < 5; i++) {
      const testScope = context.createScope(ScopeType.BLOCK, globalScope);
      memoryManager.registerScope(testScope);
    }
    
    let memoryUsage = memoryManager.getMemoryUsage();
    console.log('Memory usage before GC:', memoryUsage.currentScopeCount, 'scopes');
    
    // ガベージコレクション
    const gcResult = memoryManager.collectGarbage();
    console.log('GC result:', gcResult.freedScopes, 'scopes freed');
    
    memoryUsage = memoryManager.getMemoryUsage();
    console.log('Memory usage after GC:', memoryUsage.currentScopeCount, 'scopes');

    // 例外処理のテスト
    console.log('\n--- Exception Handling Test ---');
    const exceptionHandler = new ExceptionHandler();
    const scopeChain = new ScopeChain();
    scopeChain.push(globalScope);
    
    const exception = new RuntimeException('ReferenceError', 'Variable not found: unknownVar', 10, 5);
    exceptionHandler.handle(exception, scopeChain);

    console.log('\nAdvanced execution context demo completed');
  }
}