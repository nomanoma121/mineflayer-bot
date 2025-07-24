import { CommandHandler } from '../CommandHandler';
import { Bot } from '../Bot';
import { ICommand } from '../../commands/ICommand';

// Botをモック化（既存のBotテストと同じモック）
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

// モックコマンドクラス
class MockCommand implements ICommand {
  constructor(
    private name: string,
    private description: string,
    private usage: string,
    private executeFunction?: (bot: Bot, username: string, args: string[]) => Promise<void>
  ) {}

  async execute(bot: Bot, username: string, args: string[]): Promise<void> {
    if (this.executeFunction) {
      await this.executeFunction(bot, username, args);
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

describe('CommandHandler', () => {
  let commandHandler: CommandHandler;
  let bot: Bot;
  const botName = 'TestBot';

  beforeEach(() => {
    commandHandler = new CommandHandler(botName);
    bot = new Bot({
      host: 'localhost',
      port: 25565,
      username: botName,
      auth: 'offline',
      version: '1.20.1'
    });
    jest.clearAllMocks();
  });

  describe('Constructor and Initialization', () => {
    test('should create command handler with bot name', () => {
      expect(commandHandler).toBeInstanceOf(CommandHandler);
    });

    test('should initialize with empty command map', () => {
      const commands = commandHandler.getCommands();
      expect(commands.size).toBe(0);
    });
  });

  describe('Command Registration', () => {
    test('should register command successfully', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const mockCommand = new MockCommand('test', 'Test command', 'test [args]');
      
      commandHandler.registerCommand('test', mockCommand);
      
      const commands = commandHandler.getCommands();
      expect(commands.has('test')).toBe(true);
      expect(commands.get('test')).toBe(mockCommand);
      expect(consoleSpy).toHaveBeenCalledWith('[TestBot] Command registered: test');
      
      consoleSpy.mockRestore();
    });

    test('should register command with case insensitive name', () => {
      const mockCommand = new MockCommand('Test', 'Test command', 'test [args]');
      
      commandHandler.registerCommand('TEST', mockCommand);
      
      const commands = commandHandler.getCommands();
      expect(commands.has('test')).toBe(true);
    });

    test('should unregister command successfully', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const mockCommand = new MockCommand('test', 'Test command', 'test [args]');
      
      commandHandler.registerCommand('test', mockCommand);
      commandHandler.unregisterCommand('test');
      
      const commands = commandHandler.getCommands();
      expect(commands.has('test')).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('[TestBot] Command unregistered: test');
      
      consoleSpy.mockRestore();
    });

    test('should not log when unregistering non-existent command', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      commandHandler.unregisterCommand('nonexistent');
      
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Command unregistered')
      );
      
      consoleSpy.mockRestore();
    });

    test('should return copy of commands map', () => {
      const mockCommand = new MockCommand('test', 'Test command', 'test [args]');
      commandHandler.registerCommand('test', mockCommand);
      
      const commands1 = commandHandler.getCommands();
      const commands2 = commandHandler.getCommands();
      
      expect(commands1).not.toBe(commands2); // 異なるインスタンス
      expect(commands1.size).toBe(commands2.size);
    });
  });

  describe('Message Handling', () => {
    let mockCommand: MockCommand;

    beforeEach(() => {
      mockCommand = new MockCommand('hello', 'Say hello', 'hello [name]');
      commandHandler.registerCommand('hello', mockCommand);
    });

    test('should handle bot mention with command', async () => {
      const executeSpy = jest.spyOn(mockCommand, 'execute');
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await commandHandler.handleMessage(bot, 'player1', '@TestBot hello world');
      
      expect(executeSpy).toHaveBeenCalledWith(bot, 'player1', ['world']);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Received command: hello from player1 with args: [world]')
      );
      
      consoleSpy.mockRestore();
    });

    test('should handle @all mention', async () => {
      const executeSpy = jest.spyOn(mockCommand, 'execute');
      
      await commandHandler.handleMessage(bot, 'player1', '@all hello everyone');
      
      expect(executeSpy).toHaveBeenCalledWith(bot, 'player1', ['everyone']);
    });

    test('should ignore messages from bot itself', async () => {
      const executeSpy = jest.spyOn(mockCommand, 'execute');
      
      await commandHandler.handleMessage(bot, botName, '@TestBot hello');
      
      expect(executeSpy).not.toHaveBeenCalled();
    });

    test('should ignore messages not mentioning bot', async () => {
      const executeSpy = jest.spyOn(mockCommand, 'execute');
      
      await commandHandler.handleMessage(bot, 'player1', 'hello world');
      
      expect(executeSpy).not.toHaveBeenCalled();
    });

    test('should ignore mentions to other bots', async () => {
      const executeSpy = jest.spyOn(mockCommand, 'execute');
      
      await commandHandler.handleMessage(bot, 'player1', '@OtherBot hello');
      
      expect(executeSpy).not.toHaveBeenCalled();
    });

    test('should handle case insensitive bot names', async () => {
      const executeSpy = jest.spyOn(mockCommand, 'execute');
      
      await commandHandler.handleMessage(bot, 'player1', '@testbot hello');
      
      expect(executeSpy).toHaveBeenCalled();
    });

    test('should handle case insensitive commands', async () => {
      const executeSpy = jest.spyOn(mockCommand, 'execute');
      
      await commandHandler.handleMessage(bot, 'player1', '@TestBot HELLO world');
      
      expect(executeSpy).toHaveBeenCalledWith(bot, 'player1', ['world']);
    });

    test('should handle commands with multiple arguments', async () => {
      const executeSpy = jest.spyOn(mockCommand, 'execute');
      
      await commandHandler.handleMessage(bot, 'player1', '@TestBot hello arg1 arg2 arg3');
      
      expect(executeSpy).toHaveBeenCalledWith(bot, 'player1', ['arg1', 'arg2', 'arg3']);
    });

    test('should handle commands with no arguments', async () => {
      const executeSpy = jest.spyOn(mockCommand, 'execute');
      
      await commandHandler.handleMessage(bot, 'player1', '@TestBot hello');
      
      expect(executeSpy).toHaveBeenCalledWith(bot, 'player1', []);
    });

    test('should handle trimmed messages', async () => {
      const executeSpy = jest.spyOn(mockCommand, 'execute');
      
      await commandHandler.handleMessage(bot, 'player1', '  @TestBot hello  ');
      
      expect(executeSpy).toHaveBeenCalled();
    });
  });

  describe('Unknown Command Handling', () => {
    test('should send error message for unknown command', async () => {
      const sendMessageSpy = jest.spyOn(bot, 'sendMessage');
      const mockCommand = new MockCommand('known', 'Known command', 'known');
      commandHandler.registerCommand('known', mockCommand);
      
      await commandHandler.handleMessage(bot, 'player1', '@TestBot unknown');
      
      expect(sendMessageSpy).toHaveBeenCalledWith(
        expect.stringContaining('未知のコマンド「unknown」です。利用可能なコマンド: known')
      );
    });

    test('should list available commands in error message', async () => {
      const sendMessageSpy = jest.spyOn(bot, 'sendMessage');
      const cmd1 = new MockCommand('cmd1', 'Command 1', 'cmd1');
      const cmd2 = new MockCommand('cmd2', 'Command 2', 'cmd2');
      
      commandHandler.registerCommand('cmd1', cmd1);
      commandHandler.registerCommand('cmd2', cmd2);
      
      await commandHandler.handleMessage(bot, 'player1', '@TestBot unknown');
      
      expect(sendMessageSpy).toHaveBeenCalledWith(
        expect.stringMatching(/利用可能なコマンド: .*cmd1.*cmd2|利用可能なコマンド: .*cmd2.*cmd1/)
      );
    });
  });

  describe('Error Handling', () => {
    test('should handle command execution errors', async () => {
      const errorCommand = new MockCommand(
        'error',
        'Error command',
        'error',
        async () => {
          throw new Error('Command failed');
        }
      );
      
      commandHandler.registerCommand('error', errorCommand);
      const sendMessageSpy = jest.spyOn(bot, 'sendMessage');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await commandHandler.handleMessage(bot, 'player1', '@TestBot error');
      
      expect(sendMessageSpy).toHaveBeenCalledWith(
        expect.stringContaining('コマンド「error」の実行中にエラーが発生しました: Command failed')
      );
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    test('should handle message parsing errors', async () => {
      const sendMessageSpy = jest.spyOn(bot, 'sendMessage');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // RegExpの部分でエラーを発生させるため、botNameを無効な文字にする
      const badHandler = new CommandHandler('[invalid');
      
      await badHandler.handleMessage(bot, 'player1', '@TestBot hello');
      
      expect(consoleSpy).toHaveBeenCalled();
      expect(sendMessageSpy).toHaveBeenCalledWith(
        expect.stringContaining('コマンド処理中にエラーが発生しました')
      );
      
      consoleSpy.mockRestore();
    });

    test('should handle non-Error exceptions', async () => {
      const errorCommand = new MockCommand(
        'error',
        'Error command',
        'error',
        async () => {
          throw 'String error';
        }
      );
      
      commandHandler.registerCommand('error', errorCommand);
      const sendMessageSpy = jest.spyOn(bot, 'sendMessage');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await commandHandler.handleMessage(bot, 'player1', '@TestBot error');
      
      expect(sendMessageSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown error')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Help System', () => {
    test('should generate help message with commands', () => {
      const cmd1 = new MockCommand('cmd1', 'First command', 'cmd1 [args]');
      const cmd2 = new MockCommand('cmd2', 'Second command', 'cmd2 [args]');
      
      commandHandler.registerCommand('cmd1', cmd1);
      commandHandler.registerCommand('cmd2', cmd2);
      
      const helpMessage = commandHandler.generateHelpMessage();
      
      expect(helpMessage).toContain('cmd1: First command');
      expect(helpMessage).toContain('cmd2: Second command');
    });

    test('should generate help message when no commands registered', () => {
      const helpMessage = commandHandler.generateHelpMessage();
      
      expect(helpMessage).toBe('利用可能なコマンドはありません。');
    });
  });

  describe('Command Execution Flow', () => {
    test('should send execution start and completion messages', async () => {
      const mockCommand = new MockCommand('test', 'Test command', 'test');
      commandHandler.registerCommand('test', mockCommand);
      
      const sendMessageSpy = jest.spyOn(bot, 'sendMessage');
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await commandHandler.handleMessage(bot, 'player1', '@TestBot test');
      
      expect(sendMessageSpy).toHaveBeenCalledWith('コマンド「test」を実行します...');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Command executed successfully: test')
      );
      
      consoleSpy.mockRestore();
    });

    test('should log command execution details', async () => {
      const mockCommand = new MockCommand('test', 'Test command', 'test');
      commandHandler.registerCommand('test', mockCommand);
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await commandHandler.handleMessage(bot, 'player1', '@TestBot test arg1');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Executing command: test')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Received command: test from player1 with args: [arg1]')
      );
      
      consoleSpy.mockRestore();
    });
  });
});