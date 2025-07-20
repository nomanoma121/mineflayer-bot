import { ExecutionContext, VariableScope } from '../interpreter/ExecutionContext';

describe('BotScript ExecutionContext', () => {
  let context: ExecutionContext;

  beforeEach(() => {
    context = new ExecutionContext();
  });

  describe('Variable Management', () => {
    test('should define and retrieve global variables', () => {
      context.defineVariable('health', 20, VariableScope.GLOBAL);
      
      expect(context.getVariable('health')).toBe(20);
      expect(context.hasVariable('health')).toBe(true);
    });

    test('should define and retrieve local variables', () => {
      context.enterScope();
      context.defineVariable('local_var', 'test', VariableScope.LOCAL);
      
      expect(context.getVariable('local_var')).toBe('test');
      expect(context.hasVariable('local_var')).toBe(true);
    });

    test('should handle different variable types', () => {
      context.defineVariable('number_var', 42);
      context.defineVariable('string_var', 'hello');
      context.defineVariable('boolean_var', true);
      
      expect(context.getVariable('number_var')).toBe(42);
      expect(context.getVariable('string_var')).toBe('hello');
      expect(context.getVariable('boolean_var')).toBe(true);
    });

    test('should update variable values', () => {
      context.defineVariable('counter', 0);
      
      context.setVariable('counter', 1);
      expect(context.getVariable('counter')).toBe(1);
      
      context.setVariable('counter', 10);
      expect(context.getVariable('counter')).toBe(10);
    });

    test('should throw error for undefined variables', () => {
      expect(() => context.getVariable('undefined_var')).toThrow('Undefined variable: undefined_var');
      expect(() => context.setVariable('undefined_var', 123)).toThrow('Undefined variable: undefined_var');
    });

    test('should handle readonly variables', () => {
      context.defineVariable('readonly_var', 'constant', VariableScope.GLOBAL, true);
      
      expect(context.getVariable('readonly_var')).toBe('constant');
      expect(() => context.setVariable('readonly_var', 'changed')).toThrow('Cannot modify readonly variable: readonly_var');
    });

    test('should get variable info', () => {
      context.defineVariable('test_var', 123, VariableScope.GLOBAL, false, 5, 10);
      
      const info = context.getVariableInfo('test_var');
      expect(info).toBeDefined();
      expect(info!.name).toBe('test_var');
      expect(info!.value).toBe(123);
      expect(info!.scope).toBe(VariableScope.GLOBAL);
      expect(info!.readonly).toBe(false);
      expect(info!.line).toBe(5);
      expect(info!.column).toBe(10);
    });

    test('should list all variables', () => {
      context.defineVariable('global1', 1, VariableScope.GLOBAL);
      context.defineVariable('global2', 2, VariableScope.GLOBAL);
      
      context.enterScope();
      context.defineVariable('local1', 3, VariableScope.LOCAL);
      
      const allVars = context.getAllVariables();
      const varNames = allVars.map(v => v.name);
      
      // 組み込み変数もあることを考慮
      expect(varNames).toContain('global1');
      expect(varNames).toContain('global2');
      expect(varNames).toContain('local1');
      expect(varNames).toContain('bot_name'); // 組み込み変数
    });
  });

  describe('Scope Management', () => {
    test('should handle scope depth correctly', () => {
      expect(context.getScopeDepth()).toBe(0);
      
      context.enterScope();
      expect(context.getScopeDepth()).toBe(1);
      
      context.enterScope();
      expect(context.getScopeDepth()).toBe(2);
      
      context.exitScope();
      expect(context.getScopeDepth()).toBe(1);
      
      context.exitScope();
      expect(context.getScopeDepth()).toBe(0);
    });

    test('should handle variable shadowing', () => {
      // グローバル変数を定義
      context.defineVariable('name', 'global', VariableScope.GLOBAL);
      expect(context.getVariable('name')).toBe('global');
      
      // ローカルスコープで同名変数を定義
      context.enterScope();
      context.defineVariable('name', 'local', VariableScope.LOCAL);
      expect(context.getVariable('name')).toBe('local'); // ローカルが優先
      
      // スコープを抜ける
      context.exitScope();
      expect(context.getVariable('name')).toBe('global'); // グローバルに戻る
    });

    test('should handle nested scopes', () => {
      context.defineVariable('global_var', 'global');
      
      context.enterScope();
      context.defineVariable('scope1_var', 'scope1');
      
      context.enterScope();
      context.defineVariable('scope2_var', 'scope2');
      
      // 全変数にアクセス可能
      expect(context.getVariable('global_var')).toBe('global');
      expect(context.getVariable('scope1_var')).toBe('scope1');
      expect(context.getVariable('scope2_var')).toBe('scope2');
      
      context.exitScope();
      
      // scope2の変数はアクセス不可
      expect(context.getVariable('global_var')).toBe('global');
      expect(context.getVariable('scope1_var')).toBe('scope1');
      expect(() => context.getVariable('scope2_var')).toThrow();
      
      context.exitScope();
      
      // scope1の変数もアクセス不可
      expect(context.getVariable('global_var')).toBe('global');
      expect(() => context.getVariable('scope1_var')).toThrow();
    });

    test('should handle variable assignment across scopes', () => {
      context.defineVariable('shared_var', 10, VariableScope.GLOBAL);
      
      context.enterScope();
      // グローバル変数を変更
      context.setVariable('shared_var', 20);
      expect(context.getVariable('shared_var')).toBe(20);
      
      context.exitScope();
      // グローバル変数の変更が保持される
      expect(context.getVariable('shared_var')).toBe(20);
    });
  });

  describe('Execution Statistics', () => {
    test('should track statement execution', () => {
      const initialStats = context.getStats();
      expect(initialStats.statementsExecuted).toBe(0);
      
      context.incrementStatementCount();
      context.incrementStatementCount();
      context.incrementStatementCount();
      
      const updatedStats = context.getStats();
      expect(updatedStats.statementsExecuted).toBe(3);
    });

    test('should track command execution', () => {
      const initialStats = context.getStats();
      expect(initialStats.commandsExecuted).toBe(0);
      
      context.incrementCommandCount();
      context.incrementCommandCount();
      
      const updatedStats = context.getStats();
      expect(updatedStats.commandsExecuted).toBe(2);
    });

    test('should track variable creation', () => {
      const initialStats = context.getStats();
      const initialVarCount = initialStats.variablesCreated;
      
      context.defineVariable('var1', 1);
      context.defineVariable('var2', 2);
      
      const updatedStats = context.getStats();
      expect(updatedStats.variablesCreated).toBe(initialVarCount + 2);
    });

    test('should record errors', () => {
      context.recordError('Test error 1');
      context.recordError('Test error 2');
      
      const stats = context.getStats();
      expect(stats.errors).toContain('Test error 1');
      expect(stats.errors).toContain('Test error 2');
      expect(stats.errors).toHaveLength(2);
    });

    test('should track execution time', () => {
      const startTime = Date.now();
      
      // 少し時間を経過させる
      const executionTime = context.getExecutionTime();
      expect(executionTime).toBeGreaterThanOrEqual(0);
      
      context.markExecutionComplete();
      const finalStats = context.getStats();
      expect(finalStats.endTime).toBeDefined();
    });
  });

  describe('Built-in Variables', () => {
    test('should have system built-in variables', () => {
      expect(context.hasVariable('bot_name')).toBe(true);
      expect(context.hasVariable('version')).toBe(true);
      expect(context.hasVariable('pi')).toBe(true);
      expect(context.hasVariable('timestamp')).toBe(true);
      
      expect(context.getVariable('bot_name')).toBe('BotScript');
      expect(context.getVariable('version')).toBe('1.0.0');
      expect(context.getVariable('pi')).toBe(Math.PI);
    });

    test('should prevent modification of readonly built-in variables', () => {
      expect(() => context.setVariable('bot_name', 'Modified')).toThrow('Cannot modify readonly variable: bot_name');
      expect(() => context.setVariable('version', '2.0.0')).toThrow('Cannot modify readonly variable: version');
      expect(() => context.setVariable('pi', 3.14)).toThrow('Cannot modify readonly variable: pi');
    });

    test('should update system variables', () => {
      context.updateSystemVariables({
        health: 18,
        food: 15,
        position: { x: 100, y: 64, z: 200 },
        inventory_count: 25
      });
      
      expect(context.getVariable('bot_health')).toBe(18);
      expect(context.getVariable('bot_food')).toBe(15);
      expect(context.getVariable('bot_x')).toBe(100);
      expect(context.getVariable('bot_y')).toBe(64);
      expect(context.getVariable('bot_z')).toBe(200);
      expect(context.getVariable('bot_inventory_count')).toBe(25);
    });

    test('should update timestamp on system variable update', () => {
      const oldTimestamp = context.getVariable('timestamp') as number;
      
      // 少し時間を経過させる
      setTimeout(() => {
        context.updateSystemVariables({});
        const newTimestamp = context.getVariable('timestamp') as number;
        expect(newTimestamp).toBeGreaterThan(oldTimestamp);
      }, 10);
    });
  });

  describe('Utilities', () => {
    test('should dump context state', () => {
      context.defineVariable('test_var', 123);
      context.incrementStatementCount();
      
      const dump = context.dump();
      
      expect(dump).toContain('Execution Context');
      expect(dump).toContain('test_var = 123');
      expect(dump).toContain('Statements: 1');
      expect(dump).toContain('bot_name = BotScript');
    });

    test('should reset context', () => {
      context.defineVariable('temp_var', 'temp');
      context.incrementStatementCount();
      context.recordError('test error');
      
      expect(context.hasVariable('temp_var')).toBe(true);
      expect(context.getStats().statementsExecuted).toBe(1);
      
      context.reset();
      
      expect(context.hasVariable('temp_var')).toBe(false);
      expect(context.getStats().statementsExecuted).toBe(0);
      expect(context.getStats().errors).toHaveLength(0);
      
      // 組み込み変数は残る
      expect(context.hasVariable('bot_name')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty variable names', () => {
      expect(() => context.defineVariable('', 123)).not.toThrow();
      expect(context.getVariable('')).toBe(123);
    });

    test('should handle special characters in variable names', () => {
      context.defineVariable('var_with_underscore', 1);
      context.defineVariable('var123', 2);
      
      expect(context.getVariable('var_with_underscore')).toBe(1);
      expect(context.getVariable('var123')).toBe(2);
    });

    test('should handle exiting scope when no scope exists', () => {
      expect(context.getScopeDepth()).toBe(0);
      expect(() => context.exitScope()).not.toThrow();
      expect(context.getScopeDepth()).toBe(0);
    });

    test('should handle local variable definition when no scope exists', () => {
      // ローカルスコープがない場合はグローバルに設定される
      context.defineVariable('auto_global', 'value', VariableScope.LOCAL);
      expect(context.getVariable('auto_global')).toBe('value');
      
      const info = context.getVariableInfo('auto_global');
      expect(info!.scope).toBe(VariableScope.GLOBAL);
    });
  });
});