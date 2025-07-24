import { GotoCommand } from '../GotoCommand';
import { Bot } from '../../core/Bot';
import { MovingState } from '../../states/MovingState';

// 依存関係をモック化
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

// MovingStateをモック化
jest.mock('../../states/MovingState', () => ({
  MovingState: jest.fn()
}));

// vec3をモック化
jest.mock('vec3', () => ({
  Vec3: jest.fn((x, y, z) => ({ x, y, z }))
}));

describe('GotoCommand', () => {
  let gotoCommand: GotoCommand;
  let bot: Bot;
  let mockMovingState: any;

  beforeEach(() => {
    gotoCommand = new GotoCommand();
    bot = new Bot({
      host: 'localhost',
      port: 25565,
      username: 'TestBot',
      auth: 'offline',
      version: '1.20.1'
    });

    // MovingStateのモックを設定
    mockMovingState = {
      enter: jest.fn(),
      exit: jest.fn(),
      execute: jest.fn()
    };
    jest.mocked(MovingState).mockImplementation(() => mockMovingState);

    jest.clearAllMocks();
  });

  describe('Command Metadata', () => {
    test('should return correct command name', () => {
      expect(gotoCommand.getName()).toBe('goto');
    });

    test('should return correct command description', () => {
      expect(gotoCommand.getDescription()).toBe('指定された座標まで障害物を避けながら移動します');
    });

    test('should return correct command usage', () => {
      expect(gotoCommand.getUsage()).toBe('@<botname> goto <x> <y> <z>');
    });
  });

  describe('Argument Validation', () => {
    test('should require 3 arguments', async () => {
      const sendMessageSpy = jest.spyOn(bot, 'sendMessage');

      await gotoCommand.execute(bot, 'player1', ['100', '64']);

      expect(sendMessageSpy).toHaveBeenCalledWith(
        '使用法: @TestBot goto <x> <y> <z>'
      );
    });

    test('should handle no arguments', async () => {
      const sendMessageSpy = jest.spyOn(bot, 'sendMessage');

      await gotoCommand.execute(bot, 'player1', []);

      expect(sendMessageSpy).toHaveBeenCalledWith(
        '使用法: @TestBot goto <x> <y> <z>'
      );
    });

    test('should validate numeric coordinates', async () => {
      const sendMessageSpy = jest.spyOn(bot, 'sendMessage');

      await gotoCommand.execute(bot, 'player1', ['abc', '64', '200']);

      expect(sendMessageSpy).toHaveBeenCalledWith(
        '座標は数値で指定してください。例: @bot01 goto 100 64 -200'
      );
    });

    test('should validate Y coordinate range (too low)', async () => {
      const sendMessageSpy = jest.spyOn(bot, 'sendMessage');

      await gotoCommand.execute(bot, 'player1', ['100', '-65', '200']);

      expect(sendMessageSpy).toHaveBeenCalledWith(
        'Y座標は-64から320の範囲で指定してください。'
      );
    });

    test('should validate Y coordinate range (too high)', async () => {
      const sendMessageSpy = jest.spyOn(bot, 'sendMessage');

      await gotoCommand.execute(bot, 'player1', ['100', '321', '200']);

      expect(sendMessageSpy).toHaveBeenCalledWith(
        'Y座標は-64から320の範囲で指定してください。'
      );
    });

    test('should accept valid Y coordinate boundaries', async () => {
      const sendMessageSpy = jest.spyOn(bot, 'sendMessage');
      const changeStateSpy = jest.spyOn(bot, 'changeState');

      // Y=-64 (下限)
      await gotoCommand.execute(bot, 'player1', ['100', '-64', '200']);
      expect(sendMessageSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Y座標は-64から320の範囲で指定してください。')
      );

      // Y=320 (上限)
      await gotoCommand.execute(bot, 'player1', ['100', '320', '200']);
      expect(sendMessageSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Y座標は-64から320の範囲で指定してください。')
      );
    });
  });

  describe('Command Execution', () => {
    test('should execute goto with valid coordinates', async () => {
      const changeStateSpy = jest.spyOn(bot, 'changeState');
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await gotoCommand.execute(bot, 'player1', ['100', '64', '200']);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[TestBot] Moving to coordinates: (100, 64, 200)'
      );
      expect(MovingState).toHaveBeenCalledWith(
        bot,
        expect.objectContaining({ x: 100, y: 64, z: 200 }),
        expect.any(Function),
        expect.any(Function)
      );
      expect(changeStateSpy).toHaveBeenCalledWith(mockMovingState);

      consoleSpy.mockRestore();
    });

    test('should handle decimal coordinates', async () => {
      const sendMessageSpy = jest.spyOn(bot, 'sendMessage');
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await gotoCommand.execute(bot, 'player1', ['100.5', '64.2', '-200.8']);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[TestBot] Moving to coordinates: (100.5, 64.2, -200.8)'
      );
      expect(MovingState).toHaveBeenCalledWith(
        bot,
        expect.objectContaining({ x: 100.5, y: 64.2, z: -200.8 }),
        expect.any(Function),
        expect.any(Function)
      );

      consoleSpy.mockRestore();
    });

    test('should handle negative coordinates', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await gotoCommand.execute(bot, 'player1', ['-100', '64', '-200']);

      expect(MovingState).toHaveBeenCalledWith(
        bot,
        expect.objectContaining({ x: -100, y: 64, z: -200 }),
        expect.any(Function),
        expect.any(Function)
      );

      consoleSpy.mockRestore();
    });

    test('should handle extra arguments by ignoring them', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await gotoCommand.execute(bot, 'player1', ['100', '64', '200', 'extra', 'args']);

      expect(MovingState).toHaveBeenCalledWith(
        bot,
        expect.objectContaining({ x: 100, y: 64, z: 200 }),
        expect.any(Function),
        expect.any(Function)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    test('should handle state change errors', async () => {
      const changeStateSpy = jest.spyOn(bot, 'changeState').mockRejectedValue(
        new Error('State change failed')
      );
      const sendMessageSpy = jest.spyOn(bot, 'sendMessage');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await gotoCommand.execute(bot, 'player1', ['100', '64', '200']);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error in goto command:'),
        expect.any(Error)
      );
      expect(sendMessageSpy).toHaveBeenCalledWith(
        '移動コマンドの実行中にエラーが発生しました: State change failed'
      );

      consoleSpy.mockRestore();
    });

    test('should handle MovingState creation errors', async () => {
      jest.mocked(MovingState).mockImplementation(() => {
        throw new Error('MovingState creation failed');
      });

      const sendMessageSpy = jest.spyOn(bot, 'sendMessage');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await gotoCommand.execute(bot, 'player1', ['100', '64', '200']);

      expect(consoleSpy).toHaveBeenCalled();
      expect(sendMessageSpy).toHaveBeenCalledWith(
        expect.stringContaining('移動コマンドの実行中にエラーが発生しました:')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    test('should handle zero coordinates', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await gotoCommand.execute(bot, 'player1', ['0', '0', '0']);

      expect(MovingState).toHaveBeenCalledWith(
        bot,
        expect.objectContaining({ x: 0, y: 0, z: 0 }),
        expect.any(Function),
        expect.any(Function)
      );

      consoleSpy.mockRestore();
    });

    test('should handle very large coordinates', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await gotoCommand.execute(bot, 'player1', ['999999', '64', '-999999']);

      expect(MovingState).toHaveBeenCalledWith(
        bot,
        expect.objectContaining({ x: 999999, y: 64, z: -999999 }),
        expect.any(Function),
        expect.any(Function)
      );

      consoleSpy.mockRestore();
    });

    test('should handle whitespace in arguments', async () => {
      const sendMessageSpy = jest.spyOn(bot, 'sendMessage');

      await gotoCommand.execute(bot, 'player1', [' 100 ', ' 64 ', ' 200 ']);

      expect(MovingState).toHaveBeenCalledWith(
        bot,
        expect.objectContaining({ x: 100, y: 64, z: 200 }),
        expect.any(Function),
        expect.any(Function)
      );
    });

    test('should handle scientific notation', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await gotoCommand.execute(bot, 'player1', ['1e2', '6.4e1', '2e2']);

      expect(MovingState).toHaveBeenCalledWith(
        bot,
        expect.objectContaining({ x: 100, y: 64, z: 200 }),
        expect.any(Function),
        expect.any(Function)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('User Feedback', () => {
    test('should provide clear feedback for successful command', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await gotoCommand.execute(bot, 'player1', ['100', '64', '200']);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[TestBot] Moving to coordinates: (100, 64, 200)'
      );
      
      consoleSpy.mockRestore();
    });

    test('should provide helpful usage message for insufficient arguments', async () => {
      const sendMessageSpy = jest.spyOn(bot, 'sendMessage');

      await gotoCommand.execute(bot, 'player1', ['100']);

      expect(sendMessageSpy).toHaveBeenCalledWith(
        '使用法: @TestBot goto <x> <y> <z>'
      );
    });

    test('should provide clear error messages for invalid input', async () => {
      const sendMessageSpy = jest.spyOn(bot, 'sendMessage');

      await gotoCommand.execute(bot, 'player1', ['invalid', 'coordinates', 'here']);

      expect(sendMessageSpy).toHaveBeenCalledWith(
        '座標は数値で指定してください。例: @bot01 goto 100 64 -200'
      );
    });
  });
});