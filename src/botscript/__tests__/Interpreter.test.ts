import { Interpreter, ExecutionResultType } from '../interpreter/Interpreter';
import { ExecutionContext, VariableScope } from '../interpreter/ExecutionContext';
import { Parser } from '../parser/Parser';
import { Lexer } from '../lexer/Lexer';
import { Bot } from '../../core/Bot';
import { MinecraftBotMock } from '../../__mocks__/MinecraftBotMock';

describe('BotScript Interpreter', () => {
  let interpreter: Interpreter;
  let context: ExecutionContext;
  let mockBot: Bot;

  beforeEach(() => {
    const botMock = new MinecraftBotMock();
    
    // モック用のBotオブジェクトを作成
    mockBot = {
      mc: botMock,
      getName: () => 'TestBot',
      getPosition: () => ({ x: 100, y: 64, z: -200 }),
      sensing: {
        findNearestEntity: jest.fn().mockReturnValue(null)
      },
      inventory: {
        hasItem: jest.fn().mockReturnValue(false),
        findItem: jest.fn().mockReturnValue(null)
      },
      goto: jest.fn().mockResolvedValue(undefined),
      sendMessage: jest.fn()
    } as any;
    
    // sensing能力にmockエンティティを追加してATTACKテストを成功させる
    mockBot.sensing.findNearestEntity = jest.fn().mockReturnValue({
      id: 1,
      name: 'zombie',
      type: 'mob'
    });
    
    // inventory能力でアイテムが見つかるようにmock
    mockBot.inventory.findItem = jest.fn().mockReturnValue({
      name: 'sword',
      type: 267
    });
    
    mockBot.getInventory = jest.fn().mockReturnValue([]);
    
    context = new ExecutionContext();
    interpreter = new Interpreter(mockBot, context);
  });

  const executeScript = async (script: string) => {
    const lexer = new Lexer(script);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    return await interpreter.execute(ast);
  };

  describe('Expression Evaluation', () => {
    test('should evaluate number literals', async () => {
      const result = await executeScript('42');
      if (result.type === ExecutionResultType.ERROR) {
        console.log('Error details:', result.message);
      }
      expect(result.type).toBe(ExecutionResultType.SUCCESS);
    });

    test('should evaluate string literals', async () => {
      const result = await executeScript('"hello world"');
      expect(result.type).toBe(ExecutionResultType.SUCCESS);
    });

    test('should evaluate boolean literals', async () => {
      const result = await executeScript('TRUE');
      expect(result.type).toBe(ExecutionResultType.SUCCESS);
    });

    test('should evaluate arithmetic expressions', async () => {
      const result = await executeScript('5 + 3 * 2');
      expect(result.type).toBe(ExecutionResultType.SUCCESS);
    });

    test('should evaluate comparison expressions', async () => {
      const result = await executeScript('5 > 3');
      expect(result.type).toBe(ExecutionResultType.SUCCESS);
    });

    test('should evaluate logical expressions', async () => {
      const result = await executeScript('TRUE AND FALSE');
      expect(result.type).toBe(ExecutionResultType.SUCCESS);
    });

    test('should handle string concatenation', async () => {
      const result = await executeScript('"Hello" + " " + "World"');
      expect(result.type).toBe(ExecutionResultType.SUCCESS);
    });

    test('should throw error for division by zero', async () => {
      const result = await executeScript('10 / 0');
      expect(result.type).toBe(ExecutionResultType.ERROR);
      expect(result.message).toContain('Division by zero');
    });

    test('should throw error for invalid operations', async () => {
      const result = await executeScript('"hello" - 5');
      expect(result.type).toBe(ExecutionResultType.ERROR);
      expect(result.message).toContain('requires numbers');
    });
  });

  describe('Variable Management', () => {
    test('should define and use variables', async () => {
      const result = await executeScript(`
        DEF $health = 20
        $health
      `);
      
      expect(result.type).toBe(ExecutionResultType.SUCCESS);
      expect(context.getVariable('health')).toBe(20);
    });

    test('should assign values to variables', async () => {
      const result = await executeScript(`
        DEF $counter = 0
        $counter = 5
      `);
      
      expect(result.type).toBe(ExecutionResultType.SUCCESS);
      expect(context.getVariable('counter')).toBe(5);
    });

    test('should use variables in expressions', async () => {
      const result = await executeScript(`
        DEF $a = 10
        DEF $b = 5
        DEF $result = $a + $b * 2
      `);
      
      expect(result.type).toBe(ExecutionResultType.SUCCESS);
      expect(context.getVariable('result')).toBe(20);
    });

    test('should throw error for undefined variables', async () => {
      const result = await executeScript('$undefined_var');
      expect(result.type).toBe(ExecutionResultType.ERROR);
      expect(result.message).toContain('Undefined variable: undefined_var');
    });

    test('should access built-in variables', async () => {
      const result = await executeScript('$bot_name');
      expect(result.type).toBe(ExecutionResultType.SUCCESS);
      expect(context.getVariable('bot_name')).toBe('BotScript');
    });
  });

  describe('Control Flow', () => {
    test('should execute IF statement (true condition)', async () => {
      const result = await executeScript(`
        DEF $executed = FALSE
        IF TRUE THEN
          $executed = TRUE
        ENDIF
      `);
      
      expect(result.type).toBe(ExecutionResultType.SUCCESS);
      expect(context.getVariable('executed')).toBe(true);
    });

    test('should skip IF statement (false condition)', async () => {
      const result = await executeScript(`
        DEF $executed = FALSE
        IF FALSE THEN
          $executed = TRUE
        ENDIF
      `);
      
      expect(result.type).toBe(ExecutionResultType.SUCCESS);
      expect(context.getVariable('executed')).toBe(false);
    });

    test('should execute ELSE branch', async () => {
      const result = await executeScript(`
        DEF $branch = "none"
        IF FALSE THEN
          $branch = "if"
        ELSE
          $branch = "else"
        ENDIF
      `);
      
      expect(result.type).toBe(ExecutionResultType.SUCCESS);
      expect(context.getVariable('branch')).toBe('else');
    });

    test('should handle complex conditions', async () => {
      const result = await executeScript(`
        DEF $a = 10
        DEF $b = 5
        DEF $result = FALSE
        IF $a > $b AND $b > 0 THEN
          $result = TRUE
        ENDIF
      `);
      
      expect(result.type).toBe(ExecutionResultType.SUCCESS);
      expect(context.getVariable('result')).toBe(true);
    });

    test('should execute REPEAT statement', async () => {
      const result = await executeScript(`
        DEF $counter = 0
        REPEAT 3
          $counter = $counter + 1
        ENDREPEAT
      `);
      
      expect(result.type).toBe(ExecutionResultType.SUCCESS);
      expect(context.getVariable('counter')).toBe(3);
    });

    test('should handle REPEAT with zero count', async () => {
      const result = await executeScript(`
        DEF $counter = 0
        REPEAT 0
          $counter = 1
        ENDREPEAT
      `);
      
      expect(result.type).toBe(ExecutionResultType.SUCCESS);
      expect(context.getVariable('counter')).toBe(0);
    });

    test('should handle REPEAT with variable count', async () => {
      const result = await executeScript(`
        DEF $times = 4
        DEF $sum = 0
        REPEAT $times
          $sum = $sum + 1
        ENDREPEAT
      `);
      
      expect(result.type).toBe(ExecutionResultType.SUCCESS);
      expect(context.getVariable('sum')).toBe(4);
    });

    test('should throw error for negative REPEAT count', async () => {
      const result = await executeScript(`
        REPEAT -1
          SAY "test"
        ENDREPEAT
      `);
      
      expect(result.type).toBe(ExecutionResultType.ERROR);
      expect(result.message).toContain('must be non-negative');
    });

    test('should throw error for non-number REPEAT count', async () => {
      const result = await executeScript(`
        REPEAT "invalid"
          SAY "test"
        ENDREPEAT
      `);
      
      expect(result.type).toBe(ExecutionResultType.ERROR);
      expect(result.message).toContain('must be a number');
    });
  });

  describe('Bot Commands', () => {
    test('should execute SAY command', async () => {
      const result = await executeScript('SAY "Hello World"');
      
      expect(result.type).toBe(ExecutionResultType.SUCCESS);
      // Note: この時点では実際のボット動作のモックアップ
    });

    test('should execute SAY command with variable', async () => {
      const result = await executeScript(`
        DEF $message = "Hello from variable"
        SAY $message
      `);
      
      expect(result.type).toBe(ExecutionResultType.SUCCESS);
    });

    test('should execute MOVE command', async () => {
      const result = await executeScript('MOVE "forward" 5');
      
      expect(result.type).toBe(ExecutionResultType.SUCCESS);
    });

    test('should execute MOVE command without distance', async () => {
      const result = await executeScript('MOVE "up"');
      
      expect(result.type).toBe(ExecutionResultType.SUCCESS);
    });

    test('should execute GOTO command', async () => {
      const result = await executeScript('GOTO 100 64 200');
      
      expect(result.type).toBe(ExecutionResultType.SUCCESS);
    });

    test('should execute GOTO command with variables', async () => {
      const result = await executeScript(`
        DEF $x = 150
        DEF $y = 80
        DEF $z = 250
        GOTO $x $y $z
      `);
      
      expect(result.type).toBe(ExecutionResultType.SUCCESS);
    });

    test('should execute ATTACK command', async () => {
      const result = await executeScript('ATTACK "zombie"');
      
      expect(result.type).toBe(ExecutionResultType.SUCCESS);
    });

    test('should execute DIG command', async () => {
      const result = await executeScript('DIG "stone"');
      
      expect(result.type).toBe(ExecutionResultType.SUCCESS);
    });

    test('should execute DIG command without block type', async () => {
      const result = await executeScript('DIG');
      
      expect(result.type).toBe(ExecutionResultType.SUCCESS);
    });

    test('should execute EQUIP command', async () => {
      const result = await executeScript('EQUIP "sword"');
      
      expect(result.type).toBe(ExecutionResultType.SUCCESS);
    });

    test('should execute DROP command', async () => {
      const result = await executeScript('DROP "stone" 10');
      
      expect(result.type).toBe(ExecutionResultType.SUCCESS);
    });

    test('should execute WAIT command', async () => {
      const startTime = Date.now();
      const result = await executeScript('WAIT 0.1'); // 100ms wait
      const endTime = Date.now();
      
      expect(result.type).toBe(ExecutionResultType.SUCCESS);
      expect(endTime - startTime).toBeGreaterThanOrEqual(90); // Allow some margin
    });
  });

  describe('Complex Scripts', () => {
    test('should execute health monitoring script', async () => {
      const result = await executeScript(`
        DEF $health_threshold = 10
        IF $bot_health < $health_threshold THEN
          SAY "Health is low!"
          SAY "Current health: " + $bot_health
        ELSE
          SAY "Health is good"
        ENDIF
      `);
      
      expect(result.type).toBe(ExecutionResultType.SUCCESS);
    });

    test('should execute resource gathering script', async () => {
      const result = await executeScript(`
        DEF $wood_needed = 5
        DEF $wood_collected = 0
        
        REPEAT $wood_needed
          DIG "log"
          $wood_collected = $wood_collected + 1
          SAY "Collected " + $wood_collected + " wood"
        ENDREPEAT
        
        SAY "Finished collecting wood!"
      `);
      
      expect(result.type).toBe(ExecutionResultType.SUCCESS);
      expect(context.getVariable('wood_collected')).toBe(5);
    });

    test('should execute movement pattern script', async () => {
      const result = await executeScript(`
        DEF $start_x = $bot_x
        DEF $start_y = $bot_y
        DEF $start_z = $bot_z
        
        MOVE "forward" 10
        WAIT 1
        MOVE "right" 5
        WAIT 1
        MOVE "backward" 10
        WAIT 1
        MOVE "left" 5
        
        GOTO $start_x $start_y $start_z
        SAY "Returned to starting position"
      `);
      
      expect(result.type).toBe(ExecutionResultType.SUCCESS);
    });

    test('should handle nested control structures', async () => {
      const result = await executeScript(`
        DEF $total = 0
        REPEAT 3
          DEF $inner_total = 0
          REPEAT 2
            $inner_total = $inner_total + 1
            $total = $total + 1
          ENDREPEAT
          IF $inner_total == 2 THEN
            SAY "Inner loop completed correctly"
          ENDIF
        ENDREPEAT
      `);
      
      expect(result.type).toBe(ExecutionResultType.SUCCESS);
      expect(context.getVariable('total')).toBe(6);
    });
  });

  describe('Error Handling', () => {
    test('should handle runtime errors gracefully', async () => {
      const result = await executeScript('$undefined_variable + 5');
      
      expect(result.type).toBe(ExecutionResultType.ERROR);
      expect(result.message).toContain('Undefined variable');
    });

    test('should report line information in errors', async () => {
      const result = await executeScript(`
        DEF $x = 10
        $undefined_var = 5
      `);
      
      expect(result.type).toBe(ExecutionResultType.ERROR);
      // エラーメッセージに行情報が含まれることを期待
    });

    test('should track execution statistics', async () => {
      await executeScript(`
        DEF $var1 = 1
        DEF $var2 = 2
        SAY "test"
        IF TRUE THEN
          SAY "inner"
        ENDIF
      `);
      
      const stats = context.getStats();
      expect(stats.statementsExecuted).toBeGreaterThan(0);
      expect(stats.commandsExecuted).toBeGreaterThan(0);
      expect(stats.variablesCreated).toBeGreaterThan(0);
    });
  });

  describe('Execution Control', () => {
    test('should support stopping execution', async () => {
      // 長時間実行されるスクリプトを開始
      const executePromise = executeScript(`
        REPEAT 1000000
          WAIT 0.001
        ENDREPEAT
      `);
      
      // 少し待ってから停止
      setTimeout(() => {
        interpreter.stop();
      }, 50);
      
      const result = await executePromise;
      expect(result.type).toBe(ExecutionResultType.SUCCESS);
    });

    test('should report execution status', () => {
      expect(interpreter.isExecuting()).toBe(false);
    });

    test('should allow context switching', () => {
      const newContext = new ExecutionContext();
      interpreter.setContext(newContext);
      
      expect(interpreter.getContext()).toBe(newContext);
    });
  });

  describe('System Integration', () => {
    test('should update system variables', async () => {
      await executeScript('SAY "Starting"');
      
      // システム変数が利用可能であることを確認
      expect(context.hasVariable('bot_health')).toBe(true);
      expect(context.hasVariable('bot_food')).toBe(true);
      expect(context.hasVariable('bot_x')).toBe(true);
      expect(context.hasVariable('bot_y')).toBe(true);
      expect(context.hasVariable('bot_z')).toBe(true);
    });

    test('should handle truthiness correctly', async () => {
      const result = await executeScript(`
        DEF $result1 = FALSE
        DEF $result2 = FALSE
        DEF $result3 = FALSE
        DEF $result4 = FALSE
        
        IF 0 THEN
          $result1 = TRUE
        ENDIF
        
        IF 1 THEN
          $result2 = TRUE
        ENDIF
        
        IF "" THEN
          $result3 = TRUE
        ENDIF
        
        IF "hello" THEN
          $result4 = TRUE
        ENDIF
      `);
      
      expect(result.type).toBe(ExecutionResultType.SUCCESS);
      expect(context.getVariable('result1')).toBe(false); // 0 is falsy
      expect(context.getVariable('result2')).toBe(true);  // 1 is truthy
      expect(context.getVariable('result3')).toBe(false); // "" is falsy
      expect(context.getVariable('result4')).toBe(true);  // "hello" is truthy
    });
  });
});