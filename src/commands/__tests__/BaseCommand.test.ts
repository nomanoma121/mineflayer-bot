import { BaseCommand } from '../BaseCommand';
import { Bot } from '../../core/Bot';
import { CommandUtils } from '../../utils/CommandUtils';

// Botと依存関係をモック化
jest.mock('mineflayer', () => ({
  createBot: jest.fn(() => ({
    loadPlugin: jest.fn(),
    on: jest.fn(),
    version: '1.20.1',
    chat: jest.fn(),
    entity: {
      position: { x: 0, y: 64, z: 0 }
    },
    health: 20,
    food: 20,
    inventory: {
      items: jest.fn(() => [])
    },
    pathfinder: {
      setMovements: jest.fn(),
      goto: jest.fn()
    }
  }))
}));

jest.mock('minecraft-data', () => jest.fn(() => ({
  version: '1.20.1',
  items: {},
  blocks: {}
})));

jest.mock('mineflayer-pathfinder', () => ({
  pathfinder: {},
  Movements: jest.fn(),
  goals: {
    GoalBlock: jest.fn()
  }
}));

jest.mock('../../utils/Logger', () => ({
  Logger: {
    bot: {
      connected: jest.fn(),
      stateChange: jest.fn(),
      message: jest.fn(),
      error: jest.fn()
    }
  }
}));

// CommandUtilsをモック化
jest.mock('../../utils/CommandUtils', () => ({
  CommandUtils: {
    logCommandExecution: jest.fn(),
    handleCommandError: jest.fn(),
    validateArgumentCount: jest.fn(),
    validateArgumentRange: jest.fn(),
    parseNumber: jest.fn()
  }
}));

// テスト用のBaseCommandを継承したクラス
class TestCommand extends BaseCommand {
  private shouldThrow: boolean = false;
  private executedWith: { bot: Bot; username: string; args: string[] } | null = null;

  constructor(
    private name: string = 'test',
    private description: string = 'Test command',
    private usage: string = 'test [args]'
  ) {
    super();
  }

  setShouldThrow(shouldThrow: boolean): void {
    this.shouldThrow = shouldThrow;
  }

  getExecutedWith(): { bot: Bot; username: string; args: string[] } | null {
    return this.executedWith;
  }

  protected async executeCommand(bot: Bot, username: string, args: string[]): Promise<void> {
    this.executedWith = { bot, username, args };
    
    if (this.shouldThrow) {
      throw new Error('Test command error');
    }
  }

  getName(): string {
    return this.name;
  }

  getDescription(): string {
    return this.description;
  }

  getUsage(): string {
    return this.usage;
  }
}

describe('BaseCommand', () => {
  let bot: Bot;
  let testCommand: TestCommand;

  beforeEach(() => {
    bot = new Bot({
      host: 'localhost',
      port: 25565,
      username: 'TestBot',
      auth: 'offline',
      version: '1.20.1'
    });
    
    testCommand = new TestCommand();
    jest.clearAllMocks();
  });

  describe('Command Execution Flow', () => {
    test('should execute command successfully', async () => {
      await testCommand.execute(bot, 'player1', ['arg1', 'arg2']);

      expect(CommandUtils.logCommandExecution).toHaveBeenCalledWith(
        bot,
        'test',
        'player1',
        ['arg1', 'arg2']
      );

      const executedWith = testCommand.getExecutedWith();
      expect(executedWith).not.toBeNull();
      expect(executedWith!.bot).toBe(bot);
      expect(executedWith!.username).toBe('player1');
      expect(executedWith!.args).toEqual(['arg1', 'arg2']);
    });

    test('should handle command execution errors', async () => {
      testCommand.setShouldThrow(true);

      await testCommand.execute(bot, 'player1', ['arg1']);

      expect(CommandUtils.logCommandExecution).toHaveBeenCalled();
      expect(CommandUtils.handleCommandError).toHaveBeenCalledWith(
        bot,
        'test',
        expect.any(Error)
      );
    });

    test('should call logCommandExecution before executeCommand', async () => {
      const logSpy = jest.spyOn(CommandUtils, 'logCommandExecution');
      let logCalled = false;
      
      // executeCommandが呼ばれた時点でlogが既に呼ばれているかチェック
      jest.spyOn(testCommand, 'executeCommand' as any).mockImplementation(async () => {
        logCalled = logSpy.mock.calls.length > 0;
      });

      await testCommand.execute(bot, 'player1', []);

      expect(logCalled).toBe(true);
    });
  });

  describe('Abstract Method Implementation', () => {
    test('should return correct command name', () => {
      const command = new TestCommand('mycommand', 'My description', 'mycommand usage');
      
      expect(command.getName()).toBe('mycommand');
    });

    test('should return correct command description', () => {
      const command = new TestCommand('test', 'Custom description', 'usage');
      
      expect(command.getDescription()).toBe('Custom description');
    });

    test('should return correct command usage', () => {
      const command = new TestCommand('test', 'desc', 'custom usage format');
      
      expect(command.getUsage()).toBe('custom usage format');
    });
  });

  describe('Validation Helper Methods', () => {
    beforeEach(() => {
      // CommandUtilsのモックをリセット
      jest.mocked(CommandUtils.validateArgumentCount).mockReturnValue(true);
      jest.mocked(CommandUtils.validateArgumentRange).mockReturnValue(true);
      jest.mocked(CommandUtils.parseNumber).mockReturnValue(42);
    });

    test('should validate argument count', () => {
      const result = testCommand['validateArgumentCount'](['arg1', 'arg2'], 2, bot);

      expect(CommandUtils.validateArgumentCount).toHaveBeenCalledWith(
        ['arg1', 'arg2'],
        2,
        'test [args]',
        bot
      );
      expect(result).toBe(true);
    });

    test('should validate argument range', () => {
      const result = testCommand['validateArgumentRange'](['arg1'], 1, 3, bot);

      expect(CommandUtils.validateArgumentRange).toHaveBeenCalledWith(
        ['arg1'],
        1,
        3,
        'test [args]',
        bot
      );
      expect(result).toBe(true);
    });

    test('should parse number with parameter name', () => {
      const result = testCommand['parseNumber']('123', 'count', bot);

      expect(CommandUtils.parseNumber).toHaveBeenCalledWith('123', 'count', bot);
      expect(result).toBe(42);
    });

    test('should handle validation failures', () => {
      jest.mocked(CommandUtils.validateArgumentCount).mockReturnValue(false);

      const result = testCommand['validateArgumentCount'](['arg1'], 2, bot);

      expect(result).toBe(false);
    });

    test('should handle parse number failures', () => {
      jest.mocked(CommandUtils.parseNumber).mockReturnValue(null);

      const result = testCommand['parseNumber']('invalid', 'count', bot);

      expect(result).toBeNull();
    });
  });

  describe('Error Handling Integration', () => {
    test('should propagate error details to CommandUtils', async () => {
      const customError = new Error('Custom command error');
      testCommand.setShouldThrow(true);
      
      // executeCommandをモックして特定のエラーを投げる
      jest.spyOn(testCommand, 'executeCommand' as any).mockRejectedValue(customError);

      await testCommand.execute(bot, 'player1', []);

      expect(CommandUtils.handleCommandError).toHaveBeenCalledWith(
        bot,
        'test',
        customError
      );
    });

    test('should handle async errors in executeCommand', async () => {
      // 非同期エラーをシミュレート
      jest.spyOn(testCommand, 'executeCommand' as any).mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        throw new Error('Async error');
      });

      await testCommand.execute(bot, 'player1', []);

      expect(CommandUtils.handleCommandError).toHaveBeenCalledWith(
        bot,
        'test',
        expect.objectContaining({ message: 'Async error' })
      );
    });
  });

  describe('Method Accessibility', () => {
    test('should expose protected methods to subclasses', () => {
      // protectedメソッドがサブクラスからアクセス可能であることを確認
      expect(() => testCommand['validateArgumentCount']([], 0, bot)).not.toThrow();
      expect(() => testCommand['validateArgumentRange']([], 0, 0, bot)).not.toThrow();
      expect(() => testCommand['parseNumber']('1', 'test', bot)).not.toThrow();
    });
  });

  describe('Command Metadata', () => {
    test('should maintain command metadata consistency', () => {
      const name = 'consistent';
      const description = 'Consistent command';
      const usage = 'consistent <arg>';
      
      const command = new TestCommand(name, description, usage);

      expect(command.getName()).toBe(name);
      expect(command.getDescription()).toBe(description);
      expect(command.getUsage()).toBe(usage);
    });

    test('should handle empty metadata gracefully', () => {
      const command = new TestCommand('', '', '');

      expect(command.getName()).toBe('');
      expect(command.getDescription()).toBe('');
      expect(command.getUsage()).toBe('');
    });
  });

  describe('Command Execution Context', () => {
    test('should preserve execution context through error handling', async () => {
      testCommand.setShouldThrow(true);

      await testCommand.execute(bot, 'contextUser', ['contextArg']);

      // エラーが発生してもログ記録は正しく行われる
      expect(CommandUtils.logCommandExecution).toHaveBeenCalledWith(
        bot,
        'test',
        'contextUser',
        ['contextArg']
      );

      // エラーハンドリングも正しいコンテキストで呼ばれる
      expect(CommandUtils.handleCommandError).toHaveBeenCalledWith(
        bot,
        'test',
        expect.any(Error)
      );
    });

    test('should handle multiple concurrent executions', async () => {
      const command1 = new TestCommand('cmd1');
      const command2 = new TestCommand('cmd2');

      const promise1 = command1.execute(bot, 'user1', ['arg1']);
      const promise2 = command2.execute(bot, 'user2', ['arg2']);

      await Promise.all([promise1, promise2]);

      expect(CommandUtils.logCommandExecution).toHaveBeenCalledTimes(2);
      expect(CommandUtils.logCommandExecution).toHaveBeenCalledWith(bot, 'cmd1', 'user1', ['arg1']);
      expect(CommandUtils.logCommandExecution).toHaveBeenCalledWith(bot, 'cmd2', 'user2', ['arg2']);
    });
  });
});