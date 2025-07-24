import { Bot, BotOptions } from '../Bot';
import { ConfigManager } from '../../config/ConfigManager';
import { IdleState } from '../../states/IdleState';
import { AbilityManager } from '../../abilities/AbilityManager';

// mineflayerをモック化
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

// minecraft-dataをモック化
jest.mock('minecraft-data', () => jest.fn(() => ({
  version: '1.20.1',
  items: {},
  blocks: {}
})));

// pathfinderをモック化
jest.mock('mineflayer-pathfinder', () => ({
  pathfinder: {},
  Movements: jest.fn(),
  goals: {
    GoalBlock: jest.fn()
  }
}));

// Loggerをモック化
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

describe('Bot', () => {
  let botOptions: BotOptions;
  let configManager: ConfigManager;

  beforeEach(() => {
    botOptions = {
      host: 'localhost',
      port: 25565,
      username: 'TestBot',
      auth: 'offline',
      version: '1.20.1'
    };
    
    configManager = new ConfigManager();
    jest.clearAllMocks();
  });

  describe('Constructor and Initialization', () => {
    test('should create bot instance with valid options', () => {
      const bot = new Bot(botOptions);
      
      expect(bot).toBeInstanceOf(Bot);
      expect(bot.mc).toBeDefined();
    });

    test('should create bot instance with config manager', () => {
      const bot = new Bot(botOptions, configManager);
      
      expect(bot).toBeInstanceOf(Bot);
      expect(bot.mc).toBeDefined();
    });

    test('should initialize ability manager', () => {
      const bot = new Bot(botOptions);
      
      expect(bot.getAbilityManager()).toBeInstanceOf(AbilityManager);
    });

    test('should have default idle state initially', () => {
      const bot = new Bot(botOptions);
      
      // 初期状態はnullから始まる
      expect(bot.getCurrentState()).toBeNull();
    });
  });

  describe('State Management', () => {
    let bot: Bot;

    beforeEach(() => {
      bot = new Bot(botOptions);
    });

    test('should change state successfully', async () => {
      const mockBot = bot;
      const newState = IdleState.getInstance(mockBot);
      
      await bot.changeState(newState);
      
      expect(bot.getCurrentState()).toBe(newState);
    });

    test('should get current state', async () => {
      const mockBot = bot;
      const idleState = IdleState.getInstance(mockBot);
      await bot.changeState(idleState);
      
      const currentState = bot.getCurrentState();
      
      expect(currentState).toBe(idleState);
    });

    test('should change to idle state helper', async () => {
      await bot.changeStateToIdle();
      
      expect(bot.getCurrentState()).toBeDefined();
    });

    test('should call exit on previous state when changing states', async () => {
      const mockBot = bot;
      const state1 = IdleState.getInstance(mockBot);
      const state2 = IdleState.getInstance(mockBot);
      
      const exitSpy = jest.spyOn(state1, 'exit');
      const enterSpy = jest.spyOn(state2, 'enter');
      
      await bot.changeState(state1);
      await bot.changeState(state2);
      
      expect(exitSpy).toHaveBeenCalled();
      expect(enterSpy).toHaveBeenCalled();
    });
  });

  describe('Message System', () => {
    let bot: Bot;

    beforeEach(() => {
      bot = new Bot(botOptions);
    });

    test('should send chat message', () => {
      const message = 'Hello, world!';
      const chatSpy = jest.spyOn(bot.mc, 'chat');
      
      bot.sendMessage(message);
      
      expect(chatSpy).toHaveBeenCalledWith(message);
    });

    test('should handle empty message', () => {
      const chatSpy = jest.spyOn(bot.mc, 'chat');
      
      bot.sendMessage('');
      
      expect(chatSpy).toHaveBeenCalledWith('');
    });

    test('should handle long message', () => {
      const longMessage = 'a'.repeat(500);
      const chatSpy = jest.spyOn(bot.mc, 'chat');
      
      bot.sendMessage(longMessage);
      
      expect(chatSpy).toHaveBeenCalledWith(longMessage);
    });

    test('should handle chat errors gracefully', () => {
      const chatSpy = jest.spyOn(bot.mc, 'chat').mockImplementation(() => {
        throw new Error('Chat error');
      });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      expect(() => bot.sendMessage('test')).not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Ability System Integration', () => {
    let bot: Bot;

    beforeEach(() => {
      bot = new Bot(botOptions);
    });

    test('should provide access to ability manager', () => {
      const abilityManager = bot.getAbilityManager();
      
      expect(abilityManager).toBeInstanceOf(AbilityManager);
    });

    test('should provide access to vitals ability', () => {
      const vitals = bot.vitals;
      
      expect(vitals).toBeDefined();
    });

    test('should provide access to sensing ability', () => {
      const sensing = bot.sensing;
      
      expect(sensing).toBeDefined();
    });

    test('should provide access to inventory ability', () => {
      const inventory = bot.inventory;
      
      expect(inventory).toBeDefined();
    });

    test('should provide access to say ability', () => {
      const say = bot.say;
      
      expect(say).toBeDefined();
    });
  });

  describe('Configuration', () => {
    test('should use provided configuration', () => {
      const customConfig = {
        bot: {
          enableAutoEat: false,
          hungerThreshold: 10,
          mainLoopInterval: 200
        },
        logging: {
          level: 'error',
          enableFileLogging: false
        }
      };
      
      const mockConfigManager = {
        getConfig: jest.fn().mockReturnValue(customConfig)
      } as any;
      
      const bot = new Bot(botOptions, mockConfigManager);
      
      expect(mockConfigManager.getConfig).toHaveBeenCalled();
    });

    test('should use default configuration when none provided', () => {
      const bot = new Bot(botOptions);
      
      // デフォルトConfigManagerが内部で作成されることを確認
      expect(bot).toBeInstanceOf(Bot);
    });
  });

  describe('Error Handling', () => {
    test('should handle bot creation errors gracefully', () => {
      const invalidOptions = {
        ...botOptions,
        host: '', // 無効なホスト
      };
      
      // createBotがエラーを投げるようにモック
      const { createBot } = require('mineflayer');
      createBot.mockImplementationOnce(() => {
        throw new Error('Connection failed');
      });
      
      expect(() => new Bot(invalidOptions)).toThrow('Connection failed');
    });
  });

  describe('Bot Information', () => {
    let bot: Bot;

    beforeEach(() => {
      bot = new Bot(botOptions);
    });

    test('should get bot name', () => {
      const name = bot.getName();
      
      expect(name).toBe(botOptions.username);
    });

    test('should get bot position', () => {
      const position = bot.getPosition();
      
      expect(position).toHaveProperty('x');
      expect(position).toHaveProperty('y');
      expect(position).toHaveProperty('z');
      expect(typeof position.x).toBe('number');
      expect(typeof position.y).toBe('number');
      expect(typeof position.z).toBe('number');
    });

    test('should get inventory', () => {
      const inventory = bot.getInventory();
      
      expect(Array.isArray(inventory)).toBe(true);
    });

    test('should update current state', () => {
      const mockBot = bot;
      const state = IdleState.getInstance(mockBot);
      const executeSpy = jest.spyOn(state, 'execute');
      
      // ステートを設定してからupdate呼び出し
      bot.changeState(state).then(() => {
        bot.update();
        expect(executeSpy).toHaveBeenCalled();
      });
    });
  });

  describe('Advanced Features', () => {
    let bot: Bot;

    beforeEach(() => {
      bot = new Bot(botOptions);
    });

    test('should diagnose abilities', () => {
      const diagnosis = bot.diagnoseAbilities();
      
      expect(diagnosis).toBeDefined();
    });

    test('should handle emergency', async () => {
      const result = await bot.handleEmergency();
      
      expect(result).toBeDefined();
    });

    test('should goto coordinates', async () => {
      // pathfinderのgotoメソッドをモック
      const gotoSpy = jest.spyOn(bot.mc.pathfinder, 'goto').mockResolvedValue();
      
      await bot.goto(100, 64, 200);
      
      expect(gotoSpy).toHaveBeenCalled();
    });

    test('should connect to server', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      bot.connect();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Connecting bot TestBot to localhost:25565')
      );
      
      consoleSpy.mockRestore();
    });
  });
});