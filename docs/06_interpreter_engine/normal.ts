/**
 * 🟡 06_interpreter_engine 中級問題: 高度なインタプリタエンジン実装
 * 
 * より複雑なインタプリタ機能とランタイム管理を実装してください。
 * この問題では、スタック管理、ガベージコレクション、デバッグ機能を学びます。
 */

// ===== 高度な実行環境 =====

export class AdvancedExecutionEnvironment {
  private callStack: CallFrame[] = [];
  private heap: HeapManager = new HeapManager();
  private globalScope: ExecutionScope = new ExecutionScope();
  private debugger: RuntimeDebugger = new RuntimeDebugger();
  private profiler: ExecutionProfiler = new ExecutionProfiler();

  /**
   * プログラムを実行します
   */
  executeProgram(program: Program): ExecutionResult {
    // TODO: 高度なプログラム実行
    // ヒント1: コールスタックの管理
    // ヒント2: スコープチェーンの構築
    // ヒント3: 例外処理
    // ヒント4: デバッグ情報の収集
    
    this.profiler.startExecution();
    
    try {
      // グローバルスコープの初期化
      this.initializeGlobalScope();
      
      // メインフレームの作成
      const mainFrame = new CallFrame('__main__', this.globalScope, null);
      this.callStack.push(mainFrame);
      
      // プログラムの実行
      let result: any = null;
      for (const statement of program.statements) {
        result = this.executeStatement(statement);
        
        // リターン文の処理
        if (result instanceof ReturnValue) {
          break;
        }
      }
      
      this.profiler.endExecution();
      
      return new ExecutionResult(
        result instanceof ReturnValue ? result.value : result,
        this.profiler.getExecutionMetrics(),
        this.debugger.getDebugInfo()
      );
      
    } catch (error) {
      this.profiler.endExecution();
      return new ExecutionResult(
        null,
        this.profiler.getExecutionMetrics(),
        this.debugger.getDebugInfo(),
        error as Error
      );
    } finally {
      this.cleanup();
    }
  }

  /**
   * 文を実行します
   */
  private executeStatement(statement: Statement): any {
    this.debugger.recordStatementExecution(statement);
    
    switch (statement.type) {
      case 'VariableDeclaration':
        return this.executeVariableDeclaration(statement as VariableDeclaration);
      case 'FunctionDeclaration':
        return this.executeFunctionDeclaration(statement as FunctionDeclaration);
      case 'IfStatement':
        return this.executeIfStatement(statement as IfStatement);
      case 'WhileStatement':
        return this.executeWhileStatement(statement as WhileStatement);
      case 'ReturnStatement':
        return this.executeReturnStatement(statement as ReturnStatement);
      case 'ExpressionStatement':
        return this.executeExpression((statement as ExpressionStatement).expression);
      default:
        throw new RuntimeError(`Unknown statement type: ${statement.type}`);
    }
  }

  /**
   * 変数宣言を実行します
   */
  private executeVariableDeclaration(stmt: VariableDeclaration): void {
    const value = this.executeExpression(stmt.initializer);
    this.getCurrentScope().define(stmt.name, value);
  }

  /**
   * 関数宣言を実行します
   */
  private executeFunctionDeclaration(stmt: FunctionDeclaration): void {
    const func = new UserDefinedFunction(
      stmt.name,
      stmt.parameters,
      stmt.body,
      this.getCurrentScope()
    );
    this.getCurrentScope().define(stmt.name, func);
  }

  /**
   * IF文を実行します
   */
  private executeIfStatement(stmt: IfStatement): any {
    const condition = this.executeExpression(stmt.condition);
    
    if (this.isTruthy(condition)) {
      return this.executeStatement(stmt.thenStatement);
    } else if (stmt.elseStatement) {
      return this.executeStatement(stmt.elseStatement);
    }
    
    return null;
  }

  /**
   * WHILE文を実行します
   */
  private executeWhileStatement(stmt: WhileStatement): any {
    let result: any = null;
    
    while (this.isTruthy(this.executeExpression(stmt.condition))) {
      result = this.executeStatement(stmt.body);
      
      if (result instanceof ReturnValue || result instanceof BreakValue) {
        break;
      }
    }
    
    return result;
  }

  /**
   * RETURN文を実行します
   */
  private executeReturnStatement(stmt: ReturnStatement): ReturnValue {
    const value = stmt.expression ? this.executeExpression(stmt.expression) : null;
    return new ReturnValue(value);
  }

  /**
   * 式を実行します
   */
  private executeExpression(expr: Expression): any {
    switch (expr.type) {
      case 'BinaryExpression':
        return this.executeBinaryExpression(expr as BinaryExpression);
      case 'UnaryExpression':
        return this.executeUnaryExpression(expr as UnaryExpression);
      case 'CallExpression':
        return this.executeCallExpression(expr as CallExpression);
      case 'Identifier':
        return this.executeIdentifier(expr as Identifier);
      case 'Literal':
        return (expr as Literal).value;
      default:
        throw new RuntimeError(`Unknown expression type: ${expr.type}`);
    }
  }

  /**
   * 二項式を実行します
   */
  private executeBinaryExpression(expr: BinaryExpression): any {
    const left = this.executeExpression(expr.left);
    const right = this.executeExpression(expr.right);
    
    switch (expr.operator) {
      case '+': return left + right;
      case '-': return left - right;
      case '*': return left * right;
      case '/': 
        if (right === 0) throw new RuntimeError('Division by zero');
        return left / right;
      case '==': return left === right;
      case '!=': return left !== right;
      case '<': return left < right;
      case '>': return left > right;
      case '<=': return left <= right;
      case '>=': return left >= right;
      case '&&': return this.isTruthy(left) && this.isTruthy(right);
      case '||': return this.isTruthy(left) || this.isTruthy(right);
      default:
        throw new RuntimeError(`Unknown operator: ${expr.operator}`);
    }
  }

  /**
   * 単項式を実行します
   */
  private executeUnaryExpression(expr: UnaryExpression): any {
    const operand = this.executeExpression(expr.operand);
    
    switch (expr.operator) {
      case '-': return -operand;
      case '!': return !this.isTruthy(operand);
      default:
        throw new RuntimeError(`Unknown unary operator: ${expr.operator}`);
    }
  }

  /**
   * 関数呼び出しを実行します
   */
  private executeCallExpression(expr: CallExpression): any {
    const callee = this.executeExpression(expr.callee);
    const args = expr.args.map(arg => this.executeExpression(arg));
    
    if (callee instanceof UserDefinedFunction) {
      return this.callUserFunction(callee, args);
    } else if (callee instanceof NativeFunction) {
      return callee.call(args);
    } else {
      throw new RuntimeError('Not a function');
    }
  }

  /**
   * ユーザー定義関数を呼び出します
   */
  private callUserFunction(func: UserDefinedFunction, args: any[]): any {
    // パラメータ数のチェック
    if (args.length !== func.parameters.length) {
      throw new RuntimeError(
        `Function ${func.name} expects ${func.parameters.length} arguments, got ${args.length}`
      );
    }
    
    // 新しいスコープの作成
    const functionScope = new ExecutionScope(func.closure);
    
    // パラメータのバインド
    for (let i = 0; i < func.parameters.length; i++) {
      functionScope.define(func.parameters[i], args[i]);
    }
    
    // コールフレームの作成
    const frame = new CallFrame(func.name, functionScope, this.getCurrentFrame());
    this.callStack.push(frame);
    
    try {
      // 関数本体の実行
      const result = this.executeStatement(func.body);
      
      return result instanceof ReturnValue ? result.value : null;
    } finally {
      this.callStack.pop();
    }
  }

  /**
   * 識別子を実行します
   */
  private executeIdentifier(expr: Identifier): any {
    return this.getCurrentScope().get(expr.name);
  }

  /**
   * グローバルスコープを初期化します
   */
  private initializeGlobalScope(): void {
    // 組み込み関数の登録
    this.globalScope.define('print', new NativeFunction('print', (args) => {
      console.log(...args);
      return null;
    }));
    
    this.globalScope.define('type', new NativeFunction('type', (args) => {
      return typeof args[0];
    }));
    
    this.globalScope.define('len', new NativeFunction('len', (args) => {
      const value = args[0];
      if (typeof value === 'string' || Array.isArray(value)) {
        return value.length;
      }
      throw new RuntimeError('Object has no length');
    }));
  }

  /**
   * 真偽値を判定します
   */
  private isTruthy(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') return value.length > 0;
    return true;
  }

  /**
   * 現在のスコープを取得します
   */
  private getCurrentScope(): ExecutionScope {
    return this.getCurrentFrame().scope;
  }

  /**
   * 現在のコールフレームを取得します
   */
  private getCurrentFrame(): CallFrame {
    if (this.callStack.length === 0) {
      throw new RuntimeError('No active call frame');
    }
    return this.callStack[this.callStack.length - 1];
  }

  /**
   * クリーンアップを実行します
   */
  private cleanup(): void {
    this.callStack = [];
    this.heap.collectGarbage();
  }
}

// ===== コールスタック管理 =====

export class CallFrame {
  constructor(
    public functionName: string,
    public scope: ExecutionScope,
    public parent: CallFrame | null,
    public instructionPointer: number = 0
  ) {}

  /**
   * スタックトレースを生成します
   */
  getStackTrace(): string {
    const frames: string[] = [];
    let current: CallFrame | null = this;
    
    while (current) {
      frames.push(`at ${current.functionName}`);
      current = current.parent;
    }
    
    return frames.join('\n');
  }
}

export class ExecutionScope {
  private variables: Map<string, any> = new Map();

  constructor(private parent: ExecutionScope | null = null) {}

  /**
   * 変数を定義します
   */
  define(name: string, value: any): void {
    this.variables.set(name, value);
  }

  /**
   * 変数を取得します
   */
  get(name: string): any {
    if (this.variables.has(name)) {
      return this.variables.get(name);
    }
    
    if (this.parent) {
      return this.parent.get(name);
    }
    
    throw new RuntimeError(`Undefined variable: ${name}`);
  }

  /**
   * 変数を設定します
   */
  set(name: string, value: any): void {
    if (this.variables.has(name)) {
      this.variables.set(name, value);
      return;
    }
    
    if (this.parent) {
      this.parent.set(name, value);
      return;
    }
    
    throw new RuntimeError(`Undefined variable: ${name}`);
  }

  /**
   * 変数が存在するかチェックします
   */
  has(name: string): boolean {
    return this.variables.has(name) || (this.parent ? this.parent.has(name) : false);
  }
}

// ===== メモリ管理 =====

export class HeapManager {
  private objects: Map<string, HeapObject> = new Map();
  private gcThreshold: number = 1000;
  private allocatedCount: number = 0;

  /**
   * オブジェクトを割り当てます
   */
  allocate(value: any): string {
    const id = this.generateObjectId();
    const obj = new HeapObject(id, value);
    
    this.objects.set(id, obj);
    this.allocatedCount++;
    
    // GCの実行判定
    if (this.allocatedCount >= this.gcThreshold) {
      this.collectGarbage();
    }
    
    return id;
  }

  /**
   * オブジェクトを取得します
   */
  get(id: string): any {
    const obj = this.objects.get(id);
    if (obj) {
      obj.markAccessed();
      return obj.value;
    }
    return null;
  }

  /**
   * ガベージコレクションを実行します
   */
  collectGarbage(): void {
    // TODO: ガベージコレクションの実装
    // ヒント1: 到達可能性の分析
    // ヒント2: マーク&スイープアルゴリズム
    // ヒント3: 循環参照の処理
    
    const beforeCount = this.objects.size;
    const cutoffTime = Date.now() - 60000; // 1分前
    
    // 単純な時間ベースGC
    for (const [id, obj] of this.objects) {
      if (obj.lastAccessed < cutoffTime) {
        this.objects.delete(id);
      }
    }
    
    const afterCount = this.objects.size;
    console.log(`GC: Collected ${beforeCount - afterCount} objects`);
    
    this.allocatedCount = afterCount;
  }

  /**
   * オブジェクトIDを生成します
   */
  private generateObjectId(): string {
    return `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export class HeapObject {
  public lastAccessed: number;

  constructor(
    public id: string,
    public value: any
  ) {
    this.lastAccessed = Date.now();
  }

  markAccessed(): void {
    this.lastAccessed = Date.now();
  }
}

// ===== 関数システム =====

export abstract class Function {
  constructor(public name: string) {}
  
  abstract call(args: any[]): any;
}

export class UserDefinedFunction extends Function {
  constructor(
    name: string,
    public parameters: string[],
    public body: Statement,
    public closure: ExecutionScope
  ) {
    super(name);
  }

  call(args: any[]): any {
    // ExecutionEnvironmentで実装される
    throw new Error('UserDefinedFunction.call should not be called directly');
  }
}

export class NativeFunction extends Function {
  constructor(
    name: string,
    private implementation: (args: any[]) => any
  ) {
    super(name);
  }

  call(args: any[]): any {
    return this.implementation(args);
  }
}

// ===== 制御フロー =====

export class ReturnValue {
  constructor(public value: any) {}
}

export class BreakValue {
  constructor() {}
}

export class ContinueValue {
  constructor() {}
}

// ===== デバッグ機能 =====

export class RuntimeDebugger {
  private executionTrace: ExecutionTraceEntry[] = [];
  private breakpoints: Set<number> = new Set();
  private stepping: boolean = false;

  /**
   * 文の実行を記録します
   */
  recordStatementExecution(statement: Statement): void {
    const entry = new ExecutionTraceEntry(
      statement,
      Date.now(),
      this.getCurrentStackDepth()
    );
    
    this.executionTrace.push(entry);
    
    // ブレークポイントのチェック
    if (this.shouldBreak(statement)) {
      this.handleBreakpoint(statement);
    }
  }

  /**
   * ブレークポイントを設定します
   */
  setBreakpoint(line: number): void {
    this.breakpoints.add(line);
  }

  /**
   * ブレークポイントを削除します
   */
  removeBreakpoint(line: number): void {
    this.breakpoints.delete(line);
  }

  /**
   * ステップモードを有効にします
   */
  enableStepping(): void {
    this.stepping = true;
  }

  /**
   * デバッグ情報を取得します
   */
  getDebugInfo(): DebugInfo {
    return new DebugInfo(
      this.executionTrace,
      Array.from(this.breakpoints),
      this.stepping
    );
  }

  /**
   * ブレークするかチェックします
   */
  private shouldBreak(statement: Statement): boolean {
    if (this.stepping) return true;
    
    const line = this.getStatementLine(statement);
    return this.breakpoints.has(line);
  }

  /**
   * ブレークポイントを処理します
   */
  private handleBreakpoint(statement: Statement): void {
    console.log(`Breakpoint hit at line ${this.getStatementLine(statement)}`);
    console.log(`Statement: ${statement.type}`);
  }

  /**
   * 文の行番号を取得します
   */
  private getStatementLine(statement: Statement): number {
    // 簡略化された実装
    return (statement as any).line || 1;
  }

  /**
   * 現在のスタック深度を取得します
   */
  private getCurrentStackDepth(): number {
    // 簡略化された実装
    return 1;
  }
}

export class ExecutionTraceEntry {
  constructor(
    public statement: Statement,
    public timestamp: number,
    public stackDepth: number
  ) {}
}

export class DebugInfo {
  constructor(
    public executionTrace: ExecutionTraceEntry[],
    public breakpoints: number[],
    public steppingEnabled: boolean
  ) {}
}

// ===== パフォーマンス分析 =====

export class ExecutionProfiler {
  private startTime: number = 0;
  private endTime: number = 0;
  private functionCalls: Map<string, FunctionCallMetrics> = new Map();
  private memoryUsage: MemorySnapshot[] = [];

  /**
   * 実行を開始します
   */
  startExecution(): void {
    this.startTime = performance.now();
    this.recordMemorySnapshot();
  }

  /**
   * 実行を終了します
   */
  endExecution(): void {
    this.endTime = performance.now();
    this.recordMemorySnapshot();
  }

  /**
   * 関数呼び出しを記録します
   */
  recordFunctionCall(functionName: string, executionTime: number): void {
    if (!this.functionCalls.has(functionName)) {
      this.functionCalls.set(functionName, new FunctionCallMetrics(functionName));
    }
    
    const metrics = this.functionCalls.get(functionName)!;
    metrics.recordCall(executionTime);
  }

  /**
   * メモリスナップショットを記録します
   */
  recordMemorySnapshot(): void {
    const usage = process.memoryUsage();
    this.memoryUsage.push(new MemorySnapshot(
      Date.now(),
      usage.heapUsed,
      usage.heapTotal
    ));
  }

  /**
   * 実行メトリクスを取得します
   */
  getExecutionMetrics(): ExecutionMetrics {
    return new ExecutionMetrics(
      this.endTime - this.startTime,
      this.functionCalls,
      this.memoryUsage
    );
  }
}

export class FunctionCallMetrics {
  private callCount: number = 0;
  private totalTime: number = 0;
  private minTime: number = Infinity;
  private maxTime: number = 0;

  constructor(public functionName: string) {}

  recordCall(executionTime: number): void {
    this.callCount++;
    this.totalTime += executionTime;
    this.minTime = Math.min(this.minTime, executionTime);
    this.maxTime = Math.max(this.maxTime, executionTime);
  }

  getAverageTime(): number {
    return this.callCount > 0 ? this.totalTime / this.callCount : 0;
  }

  getCallCount(): number {
    return this.callCount;
  }

  getTotalTime(): number {
    return this.totalTime;
  }
}

export class MemorySnapshot {
  constructor(
    public timestamp: number,
    public heapUsed: number,
    public heapTotal: number
  ) {}
}

export class ExecutionMetrics {
  constructor(
    public totalExecutionTime: number,
    public functionMetrics: Map<string, FunctionCallMetrics>,
    public memorySnapshots: MemorySnapshot[]
  ) {}

  getMemoryGrowth(): number {
    if (this.memorySnapshots.length < 2) return 0;
    
    const first = this.memorySnapshots[0];
    const last = this.memorySnapshots[this.memorySnapshots.length - 1];
    
    return last.heapUsed - first.heapUsed;
  }
}

// ===== 結果とエラー =====

export class ExecutionResult {
  constructor(
    public value: any,
    public metrics: ExecutionMetrics,
    public debugInfo: DebugInfo,
    public error?: Error
  ) {}

  isSuccess(): boolean {
    return this.error === undefined;
  }
}

export class RuntimeError extends Error {
  constructor(message: string, public line?: number) {
    super(message);
    this.name = 'RuntimeError';
  }
}

// ===== AST型定義（簡略化） =====

export interface Statement {
  type: string;
}

export interface Expression {
  type: string;
}

export interface Program {
  statements: Statement[];
}

export interface VariableDeclaration extends Statement {
  name: string;
  initializer: Expression;
}

export interface FunctionDeclaration extends Statement {
  name: string;
  parameters: string[];
  body: Statement;
}

export interface IfStatement extends Statement {
  condition: Expression;
  thenStatement: Statement;
  elseStatement?: Statement;
}

export interface WhileStatement extends Statement {
  condition: Expression;
  body: Statement;
}

export interface ReturnStatement extends Statement {
  expression?: Expression;
}

export interface ExpressionStatement extends Statement {
  expression: Expression;
}

export interface BinaryExpression extends Expression {
  left: Expression;
  operator: string;
  right: Expression;
}

export interface UnaryExpression extends Expression {
  operator: string;
  operand: Expression;
}

export interface CallExpression extends Expression {
  callee: Expression;
  args: Expression[];
}

export interface Identifier extends Expression {
  name: string;
}

export interface Literal extends Expression {
  value: any;
}

// ===== デモクラス =====

export class AdvancedInterpreterDemo {
  /**
   * 高度なインタプリタ機能のデモを実行します
   */
  public static runDemo(): void {
    console.log('=== Advanced Interpreter Demo ===');

    // 実行環境の作成
    const env = new AdvancedExecutionEnvironment();

    // サンプルプログラムの作成
    const program: Program = {
      statements: [
        {
          type: 'FunctionDeclaration',
          name: 'factorial',
          parameters: ['n'],
          body: {
            type: 'IfStatement',
            condition: {
              type: 'BinaryExpression',
              left: { type: 'Identifier', name: 'n' },
              operator: '<=',
              right: { type: 'Literal', value: 1 }
            },
            thenStatement: {
              type: 'ReturnStatement',
              expression: { type: 'Literal', value: 1 }
            },
            elseStatement: {
              type: 'ReturnStatement',
              expression: {
                type: 'BinaryExpression',
                left: { type: 'Identifier', name: 'n' },
                operator: '*',
                right: {
                  type: 'CallExpression',
                  callee: { type: 'Identifier', name: 'factorial' },
                  args: [{
                    type: 'BinaryExpression',
                    left: { type: 'Identifier', name: 'n' },
                    operator: '-',
                    right: { type: 'Literal', value: 1 }
                  }]
                }
              }
            }
          }
        } as FunctionDeclaration,
        {
          type: 'ExpressionStatement',
          expression: {
            type: 'CallExpression',
            callee: { type: 'Identifier', name: 'print' },
            args: [{
              type: 'CallExpression',
              callee: { type: 'Identifier', name: 'factorial' },
              args: [{ type: 'Literal', value: 5 }]
            }]
          }
        } as ExpressionStatement
      ]
    };

    // プログラムの実行
    console.log('\n--- Program Execution ---');
    const result = env.executeProgram(program);
    
    if (result.isSuccess()) {
      console.log('Execution completed successfully');
      console.log(`Execution time: ${result.metrics.totalExecutionTime.toFixed(2)}ms`);
      console.log(`Memory growth: ${result.metrics.getMemoryGrowth()} bytes`);
    } else {
      console.log('Execution failed:', result.error?.message);
    }

    // デバッグ機能のテスト
    console.log('\n--- Debug Features Test ---');
    const debugger = new RuntimeDebugger();
    debugger.setBreakpoint(5);
    debugger.enableStepping();
    
    const debugInfo = debugger.getDebugInfo();
    console.log(`Breakpoints: ${debugInfo.breakpoints.join(', ')}`);
    console.log(`Stepping enabled: ${debugInfo.steppingEnabled}`);

    // プロファイラのテスト
    console.log('\n--- Profiler Test ---');
    const profiler = new ExecutionProfiler();
    profiler.startExecution();
    
    // 模擬的な関数呼び出し
    profiler.recordFunctionCall('testFunction', 15.5);
    profiler.recordFunctionCall('testFunction', 12.3);
    profiler.recordFunctionCall('anotherFunction', 25.1);
    
    profiler.endExecution();
    
    const metrics = profiler.getExecutionMetrics();
    console.log(`Total execution time: ${metrics.totalExecutionTime.toFixed(2)}ms`);
    
    for (const [name, funcMetrics] of metrics.functionMetrics) {
      console.log(`Function ${name}: ${funcMetrics.getCallCount()} calls, avg ${funcMetrics.getAverageTime().toFixed(2)}ms`);
    }

    // メモリ管理のテスト
    console.log('\n--- Memory Management Test ---');
    const heap = new HeapManager();
    
    const obj1 = heap.allocate({ data: 'test1' });
    const obj2 = heap.allocate({ data: 'test2' });
    
    console.log('Object 1:', heap.get(obj1));
    console.log('Object 2:', heap.get(obj2));
    
    // ガベージコレクションの実行
    heap.collectGarbage();

    console.log('\nAdvanced interpreter demo completed');
  }
}