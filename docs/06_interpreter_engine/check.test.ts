/**
 * 06_interpreter_engine テストファイル
 * 
 * すべての難易度の実装をテストします
 */

// 初級問題のテスト
describe('06_interpreter_engine - Easy', () => {
  describe('BasicInterpreter基本機能', () => {
    let interpreter: any;

    beforeEach(() => {
      const { BasicInterpreter } = require('./easy');
      interpreter = new BasicInterpreter();
    });

    it('変数の定義と取得が正しく動作する', () => {
      interpreter.defineVariable('health', 100);
      expect(interpreter.getVariable('health')).toBe(100);
      
      interpreter.defineVariable('name', 'Bot');
      expect(interpreter.getVariable('name')).toBe('Bot');
    });

    it('未定義変数アクセスでエラーが発生する', () => {
      expect(() => {
        interpreter.getVariable('undefined_var');
      }).toThrow('Undefined variable: undefined_var');
    });

    it('数値リテラルを正しく評価する', () => {
      const result = interpreter.evaluateExpression(42);
      expect(result).toBe(42);
    });

    it('文字列リテラルを正しく評価する', () => {
      const result = interpreter.evaluateExpression('hello');
      expect(result).toBe('hello');
    });

    it('識別子を正しく評価する', () => {
      interpreter.defineVariable('x', 10);
      
      const identifier = {
        type: 'Identifier',
        name: 'x'
      };
      
      const result = interpreter.evaluateExpression(identifier);
      expect(result).toBe(10);
    });

    it('二項演算を正しく評価する', () => {
      const addition = {
        type: 'BinaryExpression',
        left: 5,
        operator: '+',
        right: 3
      };
      
      expect(interpreter.evaluateExpression(addition)).toBe(8);
      
      const subtraction = {
        type: 'BinaryExpression',
        left: 10,
        operator: '-',
        right: 4
      };
      
      expect(interpreter.evaluateExpression(subtraction)).toBe(6);
      
      const multiplication = {
        type: 'BinaryExpression',
        left: 6,
        operator: '*',
        right: 7
      };
      
      expect(interpreter.evaluateExpression(multiplication)).toBe(42);
      
      const division = {
        type: 'BinaryExpression',
        left: 15,
        operator: '/',
        right: 3
      };
      
      expect(interpreter.evaluateExpression(division)).toBe(5);
    });

    it('比較演算を正しく評価する', () => {
      const equality = {
        type: 'BinaryExpression',
        left: 5,
        operator: '==',
        right: 5
      };
      
      expect(interpreter.evaluateExpression(equality)).toBe(true);
      
      const inequality = {
        type: 'BinaryExpression',
        left: 5,
        operator: '!=',
        right: 3
      };
      
      expect(interpreter.evaluateExpression(inequality)).toBe(true);
      
      const lessThan = {
        type: 'BinaryExpression',
        left: 3,
        operator: '<',
        right: 5
      };
      
      expect(interpreter.evaluateExpression(lessThan)).toBe(true);
      
      const greaterThan = {
        type: 'BinaryExpression',
        left: 7,
        operator: '>',
        right: 5
      };
      
      expect(interpreter.evaluateExpression(greaterThan)).toBe(true);
    });

    it('ゼロ除算エラーを正しく処理する', () => {
      const division = {
        type: 'BinaryExpression',
        left: 10,
        operator: '/',
        right: 0
      };
      
      expect(() => {
        interpreter.evaluateExpression(division);
      }).toThrow('Division by zero');
    });

    it('関数呼び出しを正しく評価する', () => {
      const printCall = {
        type: 'CallExpression',
        callee: { name: 'print' },
        args: ['Hello, World!']
      };
      
      // print関数は戻り値がnullなのでnullが返る
      const result = interpreter.evaluateExpression(printCall);
      expect(result).toBe(null);
      
      const addCall = {
        type: 'CallExpression',
        callee: { name: 'add' },
        args: [5, 3]
      };
      
      const addResult = interpreter.evaluateExpression(addCall);
      expect(addResult).toBe(8);
    });

    it('未知の関数呼び出しでエラーが発生する', () => {
      const unknownCall = {
        type: 'CallExpression',
        callee: { name: 'unknown' },
        args: []
      };
      
      expect(() => {
        interpreter.evaluateExpression(unknownCall);
      }).toThrow('Unknown function: unknown');
    });

    it('引数数が間違った関数呼び出しでエラーが発生する', () => {
      const invalidCall = {
        type: 'CallExpression',
        callee: { name: 'add' },
        args: [5] // add関数は2つの引数が必要
      };
      
      expect(() => {
        interpreter.evaluateExpression(invalidCall);
      }).toThrow('add function requires 2 arguments');
    });

    it('変数宣言文を正しく実行する', () => {
      const varDeclaration = {
        type: 'VariableDeclaration',
        name: 'result',
        initializer: {
          type: 'BinaryExpression',
          left: 10,
          operator: '+',
          right: 5
        }
      };
      
      interpreter.executeStatement(varDeclaration);
      expect(interpreter.getVariable('result')).toBe(15);
    });

    it('式文を正しく実行する', () => {
      const exprStatement = {
        type: 'ExpressionStatement',
        expression: {
          type: 'CallExpression',
          callee: { name: 'add' },
          args: [3, 4]
        }
      };
      
      const result = interpreter.executeStatement(exprStatement);
      expect(result).toBe(7);
    });

    it('未知の文タイプでエラーが発生する', () => {
      const unknownStatement = {
        type: 'UnknownStatement'
      };
      
      expect(() => {
        interpreter.executeStatement(unknownStatement);
      }).toThrow('Unknown statement type: UnknownStatement');
    });

    it('未知の式タイプでエラーが発生する', () => {
      const unknownExpression = {
        type: 'UnknownExpression'
      };
      
      expect(() => {
        interpreter.evaluateExpression(unknownExpression);
      }).toThrow('Unknown expression type: UnknownExpression');
    });

    it('未知の演算子でエラーが発生する', () => {
      const unknownOperator = {
        type: 'BinaryExpression',
        left: 5,
        operator: '???',
        right: 3
      };
      
      expect(() => {
        interpreter.evaluateExpression(unknownOperator);
      }).toThrow('Unknown operator: ???');
    });
  });
});

// 中級問題のテスト
describe('06_interpreter_engine - Normal', () => {
  describe('AdvancedExecutionEnvironment高度機能', () => {
    let env: any;

    beforeEach(() => {
      const { AdvancedExecutionEnvironment } = require('./normal');
      env = new AdvancedExecutionEnvironment();
    });

    it('プログラム実行が正常に完了する', () => {
      const program = {
        statements: [
          {
            type: 'VariableDeclaration',
            name: 'x',
            initializer: { type: 'Literal', value: 10 }
          },
          {
            type: 'ExpressionStatement',
            expression: {
              type: 'CallExpression',
              callee: { type: 'Identifier', name: 'print' },
              args: [{ type: 'Identifier', name: 'x' }]
            }
          }
        ]
      };

      const result = env.executeProgram(program);
      expect(result.isSuccess()).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('関数宣言と呼び出しが正しく動作する', () => {
      const program = {
        statements: [
          {
            type: 'FunctionDeclaration',
            name: 'double',
            parameters: ['x'],
            body: {
              type: 'ReturnStatement',
              expression: {
                type: 'BinaryExpression',
                left: { type: 'Identifier', name: 'x' },
                operator: '*',
                right: { type: 'Literal', value: 2 }
              }
            }
          },
          {
            type: 'ExpressionStatement',
            expression: {
              type: 'CallExpression',
              callee: { type: 'Identifier', name: 'double' },
              args: [{ type: 'Literal', value: 21 }]
            }
          }
        ]
      };

      const result = env.executeProgram(program);
      expect(result.isSuccess()).toBe(true);
      expect(result.value).toBe(42);
    });

    it('IF文が正しく動作する', () => {
      const program = {
        statements: [
          {
            type: 'VariableDeclaration',
            name: 'result',
            initializer: { type: 'Literal', value: 0 }
          },
          {
            type: 'IfStatement',
            condition: {
              type: 'BinaryExpression',
              left: { type: 'Literal', value: 5 },
              operator: '>',
              right: { type: 'Literal', value: 3 }
            },
            thenStatement: {
              type: 'ExpressionStatement',
              expression: {
                type: 'CallExpression',
                callee: { type: 'Identifier', name: 'print' },
                args: [{ type: 'Literal', value: 'condition is true' }]
              }
            }
          }
        ]
      };

      const result = env.executeProgram(program);
      expect(result.isSuccess()).toBe(true);
    });

    it('WHILE文が正しく動作する', () => {
      const program = {
        statements: [
          {
            type: 'VariableDeclaration',
            name: 'i',
            initializer: { type: 'Literal', value: 0 }
          },
          {
            type: 'WhileStatement',
            condition: {
              type: 'BinaryExpression',
              left: { type: 'Identifier', name: 'i' },
              operator: '<',
              right: { type: 'Literal', value: 3 }
            },
            body: {
              type: 'ExpressionStatement',
              expression: {
                type: 'CallExpression',
                callee: { type: 'Identifier', name: 'print' },
                args: [{ type: 'Identifier', name: 'i' }]
              }
            }
          }
        ]
      };

      const result = env.executeProgram(program);
      expect(result.isSuccess()).toBe(true);
    });

    it('実行メトリクスが正しく記録される', () => {
      const program = {
        statements: [
          {
            type: 'VariableDeclaration',
            name: 'test',
            initializer: { type: 'Literal', value: 42 }
          }
        ]
      };

      const result = env.executeProgram(program);
      expect(result.isSuccess()).toBe(true);
      expect(result.metrics).toBeDefined();
      expect(result.metrics.totalExecutionTime).toBeGreaterThanOrEqual(0);
      expect(result.metrics.memorySnapshots).toHaveLength(2); // start と end
    });

    it('デバッグ情報が正しく記録される', () => {
      const program = {
        statements: [
          {
            type: 'VariableDeclaration',
            name: 'debug_test',
            initializer: { type: 'Literal', value: 'test' }
          }
        ]
      };

      const result = env.executeProgram(program);
      expect(result.isSuccess()).toBe(true);
      expect(result.debugInfo).toBeDefined();
      expect(result.debugInfo.executionTrace).toBeDefined();
      expect(result.debugInfo.breakpoints).toBeDefined();
    });

    it('ランタイムエラーが正しく処理される', () => {
      const program = {
        statements: [
          {
            type: 'ExpressionStatement',
            expression: {
              type: 'BinaryExpression',
              left: { type: 'Literal', value: 10 },
              operator: '/',
              right: { type: 'Literal', value: 0 }
            }
          }
        ]
      };

      const result = env.executeProgram(program);
      expect(result.isSuccess()).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Division by zero');
    });

    it('関数パラメータ数の不一致エラーが正しく処理される', () => {
      const program = {
        statements: [
          {
            type: 'FunctionDeclaration',
            name: 'testFunc',
            parameters: ['a', 'b'],
            body: {
              type: 'ReturnStatement',
              expression: { type: 'Literal', value: null }
            }
          },
          {
            type: 'ExpressionStatement',
            expression: {
              type: 'CallExpression',
              callee: { type: 'Identifier', name: 'testFunc' },
              args: [{ type: 'Literal', value: 1 }] // 引数が不足
            }
          }
        ]
      };

      const result = env.executeProgram(program);
      expect(result.isSuccess()).toBe(false);
      expect(result.error?.message).toContain('expects 2 arguments, got 1');
    });

    it('未定義変数エラーが正しく処理される', () => {
      const program = {
        statements: [
          {
            type: 'ExpressionStatement',
            expression: { type: 'Identifier', name: 'undefined_variable' }
          }
        ]
      };

      const result = env.executeProgram(program);
      expect(result.isSuccess()).toBe(false);
      expect(result.error?.message).toContain('Undefined variable: undefined_variable');
    });
  });

  describe('CallFrame機能', () => {
    it('スタックトレースが正しく生成される', () => {
      const { CallFrame, ExecutionScope } = require('./normal');
      
      const globalScope = new ExecutionScope();
      const mainFrame = new CallFrame('main', globalScope, null);
      const funcFrame = new CallFrame('myFunc', globalScope, mainFrame);
      
      const stackTrace = funcFrame.getStackTrace();
      expect(stackTrace).toContain('at myFunc');
      expect(stackTrace).toContain('at main');
    });
  });

  describe('ExecutionScope機能', () => {
    it('スコープチェーンが正しく動作する', () => {
      const { ExecutionScope } = require('./normal');
      
      const parentScope = new ExecutionScope();
      const childScope = new ExecutionScope(parentScope);
      
      parentScope.define('parentVar', 'parent value');
      childScope.define('childVar', 'child value');
      
      expect(childScope.get('childVar')).toBe('child value');
      expect(childScope.get('parentVar')).toBe('parent value');
      expect(childScope.has('parentVar')).toBe(true);
      expect(childScope.has('nonexistent')).toBe(false);
    });

    it('変数のシャドウイングが正しく動作する', () => {
      const { ExecutionScope } = require('./normal');
      
      const parentScope = new ExecutionScope();
      const childScope = new ExecutionScope(parentScope);
      
      parentScope.define('var', 'parent value');
      childScope.define('var', 'child value');
      
      expect(childScope.get('var')).toBe('child value');
      expect(parentScope.get('var')).toBe('parent value');
    });

    it('変数設定が正しく動作する', () => {
      const { ExecutionScope } = require('./normal');
      
      const scope = new ExecutionScope();
      scope.define('var', 'initial');
      scope.set('var', 'updated');
      
      expect(scope.get('var')).toBe('updated');
    });

    it('未定義変数設定でエラーが発生する', () => {
      const { ExecutionScope } = require('./normal');
      
      const scope = new ExecutionScope();
      
      expect(() => {
        scope.set('undefined_var', 'value');
      }).toThrow('Undefined variable: undefined_var');
    });
  });

  describe('HeapManager機能', () => {
    it('オブジェクト割り当てと取得が正しく動作する', () => {
      const { HeapManager } = require('./normal');
      
      const heap = new HeapManager();
      const objectId = heap.allocate({ test: 'data' });
      
      expect(objectId).toBeDefined();
      expect(typeof objectId).toBe('string');
      
      const retrieved = heap.get(objectId);
      expect(retrieved).toEqual({ test: 'data' });
    });

    it('存在しないオブジェクトIDでnullが返る', () => {
      const { HeapManager } = require('./normal');
      
      const heap = new HeapManager();
      const result = heap.get('nonexistent_id');
      
      expect(result).toBe(null);
    });

    it('ガベージコレクションが実行される', () => {
      const { HeapManager } = require('./normal');
      
      const heap = new HeapManager();
      
      // オブジェクトを作成
      heap.allocate({ data: 1 });
      heap.allocate({ data: 2 });
      
      // ガベージコレクションを手動実行
      heap.collectGarbage();
      
      // エラーが発生しないことを確認
      expect(true).toBe(true);
    });
  });

  describe('RuntimeDebugger機能', () => {
    it('デバッグ情報が正しく記録される', () => {
      const { RuntimeDebugger } = require('./normal');
      
      const debugger = new RuntimeDebugger();
      const statement = { type: 'VariableDeclaration', line: 1 };
      
      debugger.recordStatementExecution(statement);
      
      const debugInfo = debugger.getDebugInfo();
      expect(debugInfo.executionTrace).toHaveLength(1);
      expect(debugInfo.executionTrace[0].statement).toBe(statement);
    });

    it('ブレークポイントが正しく管理される', () => {
      const { RuntimeDebugger } = require('./normal');
      
      const debugger = new RuntimeDebugger();
      
      debugger.setBreakpoint(5);
      debugger.setBreakpoint(10);
      
      const debugInfo = debugger.getDebugInfo();
      expect(debugInfo.breakpoints).toContain(5);
      expect(debugInfo.breakpoints).toContain(10);
      
      debugger.removeBreakpoint(5);
      
      const updatedInfo = debugger.getDebugInfo();
      expect(updatedInfo.breakpoints).not.toContain(5);
      expect(updatedInfo.breakpoints).toContain(10);
    });

    it('ステップモードが正しく動作する', () => {
      const { RuntimeDebugger } = require('./normal');
      
      const debugger = new RuntimeDebugger();
      
      expect(debugger.getDebugInfo().steppingEnabled).toBe(false);
      
      debugger.enableStepping();
      
      expect(debugger.getDebugInfo().steppingEnabled).toBe(true);
    });
  });

  describe('ExecutionProfiler機能', () => {
    it('実行時間が正しく測定される', () => {
      const { ExecutionProfiler } = require('./normal');
      
      const profiler = new ExecutionProfiler();
      
      profiler.startExecution();
      
      // 少し待機
      for (let i = 0; i < 1000; i++) {
        Math.random();
      }
      
      profiler.endExecution();
      
      const metrics = profiler.getExecutionMetrics();
      expect(metrics.totalExecutionTime).toBeGreaterThan(0);
    });

    it('関数呼び出しメトリクスが正しく記録される', () => {
      const { ExecutionProfiler } = require('./normal');
      
      const profiler = new ExecutionProfiler();
      
      profiler.recordFunctionCall('testFunc', 10.5);
      profiler.recordFunctionCall('testFunc', 15.2);
      profiler.recordFunctionCall('anotherFunc', 20.0);
      
      const metrics = profiler.getExecutionMetrics();
      
      expect(metrics.functionMetrics.has('testFunc')).toBe(true);
      expect(metrics.functionMetrics.has('anotherFunc')).toBe(true);
      
      const testFuncMetrics = metrics.functionMetrics.get('testFunc')!;
      expect(testFuncMetrics.getCallCount()).toBe(2);
      expect(testFuncMetrics.getTotalTime()).toBe(25.7);
      expect(testFuncMetrics.getAverageTime()).toBeCloseTo(12.85);
    });

    it('メモリスナップショットが正しく記録される', () => {
      const { ExecutionProfiler } = require('./normal');
      
      const profiler = new ExecutionProfiler();
      
      profiler.startExecution();
      profiler.endExecution();
      
      const metrics = profiler.getExecutionMetrics();
      expect(metrics.memorySnapshots).toHaveLength(2);
      
      const memoryGrowth = metrics.getMemoryGrowth();
      expect(typeof memoryGrowth).toBe('number');
    });
  });

  describe('関数システム', () => {
    it('NativeFunction が正しく動作する', () => {
      const { NativeFunction } = require('./normal');
      
      const addFunc = new NativeFunction('add', (args) => args[0] + args[1]);
      
      expect(addFunc.name).toBe('add');
      expect(addFunc.call([3, 4])).toBe(7);
    });

    it('UserDefinedFunction が正しく構築される', () => {
      const { UserDefinedFunction, ExecutionScope } = require('./normal');
      
      const scope = new ExecutionScope();
      const body = { type: 'ReturnStatement' };
      
      const func = new UserDefinedFunction('myFunc', ['x', 'y'], body, scope);
      
      expect(func.name).toBe('myFunc');
      expect(func.parameters).toEqual(['x', 'y']);
      expect(func.body).toBe(body);
      expect(func.closure).toBe(scope);
    });
  });

  describe('制御フロー', () => {
    it('ReturnValue が正しく動作する', () => {
      const { ReturnValue } = require('./normal');
      
      const returnVal = new ReturnValue(42);
      expect(returnVal.value).toBe(42);
    });

    it('BreakValue が正しく動作する', () => {
      const { BreakValue } = require('./normal');
      
      const breakVal = new BreakValue();
      expect(breakVal).toBeInstanceOf(BreakValue);
    });

    it('ContinueValue が正しく動作する', () => {
      const { ContinueValue } = require('./normal');
      
      const continueVal = new ContinueValue();
      expect(continueVal).toBeInstanceOf(ContinueValue);
    });
  });

  describe('エラー処理', () => {
    it('RuntimeError が正しく動作する', () => {
      const { RuntimeError } = require('./normal');
      
      const error = new RuntimeError('Test error', 10);
      
      expect(error.message).toBe('Test error');
      expect(error.line).toBe(10);
      expect(error.name).toBe('RuntimeError');
    });

    it('ExecutionResult の成功判定が正しく動作する', () => {
      const { ExecutionResult, ExecutionMetrics, DebugInfo } = require('./normal');
      
      const metrics = new ExecutionMetrics(0, new Map(), []);
      const debugInfo = new DebugInfo([], [], false);
      
      const successResult = new ExecutionResult('success', metrics, debugInfo);
      expect(successResult.isSuccess()).toBe(true);
      
      const errorResult = new ExecutionResult(null, metrics, debugInfo, new Error('test'));
      expect(errorResult.isSuccess()).toBe(false);
    });
  });
});

// 上級問題のテスト
describe('06_interpreter_engine - Hard', () => {
  describe('JITCompilerEngine高度機能', () => {
    it('JITコンパイラが関数をコンパイルできる', () => {
      const { JITCompilerEngine } = require('./hard');
      
      const jit = new JITCompilerEngine();
      const func = { name: 'testFunc' };
      
      const compiled = jit.compileFunction(func, 50);
      
      expect(compiled).toBeDefined();
      expect(compiled.name).toBe('testFunc');
      expect(compiled.optimizationLevel).toBeDefined();
      expect(compiled.compilationTime).toBeGreaterThan(0);
    });

    it('最適化レベルが呼び出し回数に基づいて決定される', () => {
      const { JITCompilerEngine, OptimizationLevel } = require('./hard');
      
      const jit = new JITCompilerEngine();
      const func = { name: 'testFunc' };
      
      const lowOptimized = jit.compileFunction(func, 5);
      expect(lowOptimized.optimizationLevel).toBe(OptimizationLevel.O0);
      
      const mediumOptimized = jit.compileFunction(func, 50);
      expect(mediumOptimized.optimizationLevel).toBe(OptimizationLevel.O1);
      
      const highOptimized = jit.compileFunction(func, 500);
      expect(highOptimized.optimizationLevel).toBe(OptimizationLevel.O2);
      
      const maxOptimized = jit.compileFunction(func, 5000);
      expect(maxOptimized.optimizationLevel).toBe(OptimizationLevel.O3);
    });
  });

  describe('ParallelExecutionEngine並列実行', () => {
    it('並列実行が正常に完了する', async () => {
      const { ParallelExecutionEngine, ExecutionTask } = require('./hard');
      
      const engine = new ParallelExecutionEngine();
      
      const tasks = [
        new ExecutionTask('task1', 'console.log("Task 1")'),
        new ExecutionTask('task2', 'console.log("Task 2")', ['task1']),
        new ExecutionTask('task3', 'console.log("Task 3")')
      ];
      
      const result = await engine.executeParallel(tasks);
      
      expect(result).toBeDefined();
      expect(result.results).toHaveLength(3);
      expect(result.totalTime).toBeGreaterThan(0);
      expect(result.speedup).toBeGreaterThan(0);
    });

    it('タスクの依存関係が正しく処理される', async () => {
      const { ParallelExecutionEngine, ExecutionTask } = require('./hard');
      
      const engine = new ParallelExecutionEngine();
      
      const tasks = [
        new ExecutionTask('independent', 'task'),
        new ExecutionTask('dependent', 'task', ['independent'])
      ];
      
      const result = await engine.executeParallel(tasks);
      
      expect(result.results).toHaveLength(2);
    });
  });

  describe('AdaptiveOptimizer適応最適化', () => {
    it('アダプティブ最適化が実行される', () => {
      const { AdaptiveOptimizer } = require('./hard');
      
      const optimizer = new AdaptiveOptimizer();
      const program = { statements: [] };
      const history = new (require('./hard').ExecutionHistoryInterface)();
      
      const optimized = optimizer.optimize(program, history);
      
      expect(optimized).toBeDefined();
      expect(optimized.program).toBe(program);
      expect(optimized.appliedOptimizations).toBeDefined();
    });
  });

  describe('GenerationalGarbageCollector世代別GC', () => {
    it('ガベージコレクションが実行される', () => {
      const { GenerationalGarbageCollector } = require('./hard');
      
      const gc = new GenerationalGarbageCollector();
      const result = gc.collect();
      
      expect(result).toBeDefined();
      expect(result.collectedObjects).toBeGreaterThanOrEqual(0);
      expect(result.promotedObjects).toBeGreaterThanOrEqual(0);
      expect(result.gcTime).toBeGreaterThan(0);
    });
  });

  describe('WorkerPool ワーカープール', () => {
    it('ワーカープールが正しく動作する', async () => {
      const { WorkerPool, ExecutionTask } = require('./hard');
      
      const pool = new WorkerPool();
      
      expect(pool.hasAvailableWorker()).toBe(true);
      
      const worker = await pool.acquireWorker();
      expect(worker).toBeDefined();
      
      const task = new ExecutionTask('test', 'code');
      const result = await worker.execute(task);
      expect(result).toBeDefined();
      
      pool.releaseWorker(worker);
    });
  });

  describe('DependencyGraph依存関係グラフ', () => {
    it('依存関係グラフが正しく動作する', () => {
      const { DependencyGraph, ExecutionTask } = require('./hard');
      
      const tasks = [
        new ExecutionTask('a', 'code'),
        new ExecutionTask('b', 'code', ['a']),
        new ExecutionTask('c', 'code', ['a', 'b'])
      ];
      
      const graph = new DependencyGraph(tasks);
      
      const executable = graph.getExecutableTasks();
      expect(executable).toHaveLength(1);
      expect(executable[0].id).toBe('a');
      
      const newExecutable = graph.markCompleted('a');
      expect(newExecutable).toHaveLength(1);
      expect(newExecutable[0].id).toBe('b');
    });
  });

  describe('世代別ガベージコレクション詳細', () => {
    it('YoungGeneration が正しく動作する', () => {
      const { YoungGeneration, HeapObjectAdvanced } = require('./hard');
      
      const young = new YoungGeneration();
      const reachable = new Set<any>();
      
      const collected = young.sweep(reachable);
      expect(collected).toBeGreaterThanOrEqual(0);
    });

    it('OldGeneration が正しく動作する', () => {
      const { OldGeneration, HeapObjectAdvanced } = require('./hard');
      
      const old = new OldGeneration();
      const obj = new HeapObjectAdvanced('test', {});
      
      old.add(obj);
      expect(old.contains(obj)).toBe(true);
      
      const utilization = old.getUtilization();
      expect(utilization).toBeGreaterThanOrEqual(0);
    });

    it('RememberSet が正しく動作する', () => {
      const { RememberSet } = require('./hard');
      
      const rememberSet = new RememberSet();
      const refs = rememberSet.getReferencesToOld();
      
      expect(Array.isArray(refs)).toBe(true);
    });
  });

  describe('最適化システム', () => {
    it('OptimizationPrediction が正しく構築される', () => {
      const { OptimizationPrediction, OptimizationType } = require('./hard');
      
      const prediction = new OptimizationPrediction(
        OptimizationType.LOOP_UNROLLING,
        'loop1',
        0.9
      );
      
      expect(prediction.type).toBe(OptimizationType.LOOP_UNROLLING);
      expect(prediction.target).toBe('loop1');
      expect(prediction.confidence).toBe(0.9);
    });

    it('OptimizedProgram が正しく構築される', () => {
      const { OptimizedProgram, OptimizationPrediction, OptimizationType } = require('./hard');
      
      const program = { statements: [] };
      const predictions = [
        new OptimizationPrediction(OptimizationType.CONSTANT_PROPAGATION, 'const1', 0.8)
      ];
      
      const optimized = new OptimizedProgram(program, predictions);
      
      expect(optimized.program).toBe(program);
      expect(optimized.appliedOptimizations).toBe(predictions);
    });
  });

  describe('中間表現とコンパイレーション', () => {
    it('IntermediateRepresentation が正しく動作する', () => {
      const { IntermediateRepresentation, IRInstruction } = require('./hard');
      
      const ir = new IntermediateRepresentation();
      const instructions = [
        new IRInstruction('LOAD', ['x'], 'reg1'),
        new IRInstruction('ADD', ['reg1', '1'], 'reg2')
      ];
      
      ir.setInstructions(instructions);
      
      const retrieved = ir.getInstructions();
      expect(retrieved).toHaveLength(2);
      expect(retrieved[0].opcode).toBe('LOAD');
    });

    it('MachineCode が正しく動作する', () => {
      const { MachineCode, MachineInstruction } = require('./hard');
      
      const code = new MachineCode();
      const instruction = new MachineInstruction('MOV', ['eax', 'ebx'], null);
      
      code.addInstruction(instruction);
      
      const instructions = code.getInstructions();
      expect(instructions).toHaveLength(1);
      expect(instructions[0].opcode).toBe('MOV');
    });
  });

  describe('統合デモテスト', () => {
    it('MasterInterpreterDemo が正常に実行される', async () => {
      const { MasterInterpreterDemo } = require('./hard');
      
      // デモが例外なく実行されることを確認
      await expect(MasterInterpreterDemo.runDemo()).resolves.toBeUndefined();
    });
  });

  describe('パフォーマンステスト', () => {
    it('大量の並列タスクが効率的に処理される', async () => {
      const { ParallelExecutionEngine, ExecutionTask } = require('./hard');
      
      const engine = new ParallelExecutionEngine();
      
      // 大量のタスクを作成
      const tasks = [];
      for (let i = 0; i < 20; i++) {
        tasks.push(new ExecutionTask(`task${i}`, `console.log(${i})`));
      }
      
      const startTime = performance.now();
      const result = await engine.executeParallel(tasks);
      const endTime = performance.now();
      
      expect(result.results).toHaveLength(20);
      expect(endTime - startTime).toBeLessThan(5000); // 5秒以内
    });

    it('JITコンパイラが高負荷でも動作する', () => {
      const { JITCompilerEngine } = require('./hard');
      
      const jit = new JITCompilerEngine();
      
      // 複数の関数を連続コンパイル
      for (let i = 0; i < 10; i++) {
        const func = { name: `func${i}` };
        const compiled = jit.compileFunction(func, 100 + i * 10);
        expect(compiled).toBeDefined();
      }
    });

    it('ガベージコレクションが大量オブジェクトでも動作する', () => {
      const { GenerationalGarbageCollector } = require('./hard');
      
      const gc = new GenerationalGarbageCollector();
      
      // 複数回のGCを実行
      for (let i = 0; i < 5; i++) {
        const result = gc.collect();
        expect(result).toBeDefined();
      }
    });
  });
});

// 統合テスト
describe('06_interpreter_engine - Integration', () => {
  it('初級→中級→上級の機能が連携して動作する', async () => {
    // 初級機能のテスト
    const { BasicInterpreter } = require('./easy');
    const basicInterpreter = new BasicInterpreter();
    
    basicInterpreter.defineVariable('x', 10);
    const basicResult = basicInterpreter.evaluateExpression({
      type: 'BinaryExpression',
      left: { type: 'Identifier', name: 'x' },
      operator: '+',
      right: 5
    });
    
    expect(basicResult).toBe(15);
    
    // 中級機能のテスト
    const { AdvancedExecutionEnvironment } = require('./normal');
    const advancedEnv = new AdvancedExecutionEnvironment();
    
    const program = {
      statements: [
        {
          type: 'VariableDeclaration',
          name: 'result',
          initializer: { type: 'Literal', value: basicResult }
        }
      ]
    };
    
    const result = advancedEnv.executeProgram(program);
    expect(result.isSuccess()).toBe(true);
    
    // 上級機能のテスト
    const { JITCompilerEngine } = require('./hard');
    const jit = new JITCompilerEngine();
    
    const func = { name: 'integratedFunc' };
    const compiled = jit.compileFunction(func, 100);
    expect(compiled).toBeDefined();
  });

  it('エラーハンドリングが各レベルで一貫している', () => {
    // 初級レベルのエラー
    const { BasicInterpreter } = require('./easy');
    const basicInterpreter = new BasicInterpreter();
    
    expect(() => {
      basicInterpreter.getVariable('nonexistent');
    }).toThrow();
    
    // 中級レベルのエラー
    const { RuntimeError } = require('./normal');
    const error = new RuntimeError('Test error');
    expect(error.name).toBe('RuntimeError');
    
    // 上級レベルでのエラー耐性
    const { GenerationalGarbageCollector } = require('./hard');
    const gc = new GenerationalGarbageCollector();
    
    // ガベージコレクションは例外を投げずに完了する
    expect(() => gc.collect()).not.toThrow();
  });

  it('パフォーマンス測定が各レベルで機能する', async () => {
    // 基本的な実行時間測定
    const startTime = performance.now();
    
    // 初級機能の実行
    const { BasicInterpreter } = require('./easy');
    const basicInterpreter = new BasicInterpreter();
    
    for (let i = 0; i < 100; i++) {
      basicInterpreter.defineVariable(`var${i}`, i);
    }
    
    // 中級機能の実行
    const { ExecutionProfiler } = require('./normal');
    const profiler = new ExecutionProfiler();
    
    profiler.startExecution();
    
    for (let i = 0; i < 10; i++) {
      profiler.recordFunctionCall('testFunc', Math.random() * 10);
    }
    
    profiler.endExecution();
    
    const metrics = profiler.getExecutionMetrics();
    expect(metrics.totalExecutionTime).toBeGreaterThan(0);
    
    // 上級機能の実行
    const { ParallelExecutionEngine, ExecutionTask } = require('./hard');
    const engine = new ParallelExecutionEngine();
    
    const tasks = [new ExecutionTask('perf-test', 'performance test')];
    const result = await engine.executeParallel(tasks);
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    
    expect(totalTime).toBeGreaterThan(0);
    expect(result.totalTime).toBeGreaterThan(0);
  });
});
