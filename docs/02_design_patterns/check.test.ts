import { 
  BotManager, 
  CommandFactory, 
  BotEventSubject, 
  BotEventLogger, 
  BotHealthMonitor,
  PatternDemo 
} from './easy';

import { 
  MovementContext, 
  DirectMovementStrategy, 
  PathfindingMovementStrategy,
  LoggingDecorator,
  TimingDecorator,
  RetryDecorator,
  BasicMoveAction,
  CommandQueue,
  PriorityMoveCommand,
  AdvancedPatternDemo 
} from './normal';

import { 
  CompositeAbility, 
  SingleAbility,
  EmergencyHandler,
  CombatHandler,
  MovementHandler,
  DefaultHandler,
  BotStateModel,
  ConsoleView,
  BotMVCController,
  AdvancedBotSystem 
} from './hard';

/**
 * 02_design_patterns テストスイート
 * 
 * 各問題の実装が正しく動作するかをテストします。
 */
describe('02_design_patterns - Design Pattern Implementation Tests', () => {
  
  describe('🟢 Easy Level: Basic Patterns', () => {
    test('Singleton Pattern - BotManager', () => {
      const manager1 = BotManager.getInstance();
      const manager2 = BotManager.getInstance();
      
      expect(manager1).toBe(manager2);
      
      manager1.addBot('bot1', { name: 'TestBot' });
      expect(manager2.getBot('bot1')).toEqual({ name: 'TestBot' });
    });

    test('Factory Pattern - CommandFactory', () => {
      const sayCommand = CommandFactory.createCommand('SAY', 'Hello World');
      const moveCommand = CommandFactory.createCommand('MOVE', 'north', 5);
      const attackCommand = CommandFactory.createCommand('ATTACK', 'zombie');
      
      expect(sayCommand.getType()).toBe('SAY');
      expect(moveCommand.getType()).toBe('MOVE');
      expect(attackCommand.getType()).toBe('ATTACK');
      
      // コマンド実行をテスト
      expect(() => sayCommand.execute()).not.toThrow();
      expect(() => moveCommand.execute()).not.toThrow();
      expect(() => attackCommand.execute()).not.toThrow();
      
      // 不正なコマンドタイプ
      expect(() => CommandFactory.createCommand('INVALID')).toThrow();
    });

    test('Observer Pattern - Event System', () => {
      const eventSubject = new BotEventSubject();
      const logger = new BotEventLogger();
      const healthMonitor = new BotHealthMonitor();
      
      eventSubject.addObserver(logger);
      eventSubject.addObserver(healthMonitor);
      
      // ヘルス変更イベント
      eventSubject.emitBotEvent('healthChange', { botId: 'bot1', health: 15 });
      
      // ログが記録されていることを確認
      expect(logger.getLogs().length).toBeGreaterThan(0);
      
      // ヘルスアラートが発生していることを確認
      expect(healthMonitor.getAlerts().length).toBeGreaterThan(0);
      
      // 位置変更イベント（ヘルスアラートは発生しない）
      const initialAlerts = healthMonitor.getAlerts().length;
      eventSubject.emitBotEvent('positionChange', { botId: 'bot1', x: 10, y: 64, z: 20 });
      expect(healthMonitor.getAlerts().length).toBe(initialAlerts);
    });

    test('Pattern Integration Demo', () => {
      // デモが例外なく実行されることを確認
      expect(() => PatternDemo.runDemo()).not.toThrow();
    });
  });

  describe('🟡 Normal Level: Advanced Patterns', () => {
    test('Strategy Pattern - Movement Strategies', async () => {
      const movementContext = new MovementContext(new DirectMovementStrategy());
      
      expect(movementContext.getCurrentStrategy()).toBe('Direct');
      
      // 戦略実行
      await expect(movementContext.executeMovement(null, { x: 10, y: 64, z: 20 })).resolves.not.toThrow();
      
      // 戦略変更
      movementContext.setStrategy(new PathfindingMovementStrategy());
      expect(movementContext.getCurrentStrategy()).toBe('Pathfinding');
    });

    test('Decorator Pattern - Action Decorators', async () => {
      let action = new BasicMoveAction('north', 5);
      
      // 基本動作
      expect(action.getDescription()).toBe('Move north 5');
      
      // デコレーターの適用
      action = new LoggingDecorator(action);
      expect(action.getDescription()).toContain('Logged');
      
      action = new TimingDecorator(action);
      expect(action.getDescription()).toContain('Timed');
      
      action = new RetryDecorator(action, 2);
      expect(action.getDescription()).toContain('Retry');
      
      // 実行テスト
      await expect(action.execute()).resolves.not.toThrow();
    });

    test('Command Queue Pattern - Priority Queue', async () => {
      const queue = new CommandQueue();
      
      // コマンドの追加
      queue.enqueue(new PriorityMoveCommand('move1', 'north', 3, 1));
      queue.enqueue(new PriorityMoveCommand('move2', 'east', 2, 5)); // 高優先度
      queue.enqueue(new PriorityMoveCommand('move3', 'south', 1, 2));
      
      const initialStatus = queue.getStatus();
      expect(initialStatus.pending).toBe(3);
      expect(initialStatus.completed).toBe(0);
      expect(initialStatus.processing).toBe(false);
      
      // キューの処理
      await queue.processQueue();
      
      const finalStatus = queue.getStatus();
      expect(finalStatus.pending).toBe(0);
      expect(finalStatus.completed).toBe(3);
      expect(finalStatus.processing).toBe(false);
      
      // 取り消し機能
      await queue.undoLast();
      expect(queue.getStatus().completed).toBe(2);
    });

    test('Advanced Pattern Integration Demo', async () => {
      await expect(AdvancedPatternDemo.runDemo()).resolves.not.toThrow();
    });
  });

  describe('🔴 Hard Level: Composite Patterns', () => {
    test('Composite Pattern - Ability System', async () => {
      const rootAbility = new CompositeAbility('Root');
      const walkAbility = new SingleAbility('Walk', async () => console.log('Walking'));
      const runAbility = new SingleAbility('Run', async () => console.log('Running'));
      
      rootAbility.add(walkAbility);
      rootAbility.add(runAbility);
      
      expect(rootAbility.getName()).toBe('Root');
      expect(rootAbility.getChildren().length).toBe(2);
      expect(rootAbility.canExecute({})).toBe(true);
      
      await expect(rootAbility.execute({})).resolves.not.toThrow();
      
      // 子能力の削除
      rootAbility.remove(walkAbility);
      expect(rootAbility.getChildren().length).toBe(1);
    });

    test('Chain of Responsibility Pattern - Request Handling', async () => {
      const emergency = new EmergencyHandler();
      const combat = new CombatHandler();
      const movement = new MovementHandler();
      const defaultHandler = new DefaultHandler();
      
      // チェーンの構築
      emergency.setNext(combat).setNext(movement).setNext(defaultHandler);
      
      // 緊急事態リクエスト
      const emergencyRequest = {
        type: 'emergency',
        priority: 10,
        data: {},
        timestamp: Date.now()
      };
      
      const handled1 = await emergency.handle(emergencyRequest);
      expect(handled1).toBe(true);
      
      // 戦闘リクエスト
      const combatRequest = {
        type: 'attack',
        priority: 5,
        data: {},
        timestamp: Date.now()
      };
      
      const handled2 = await emergency.handle(combatRequest);
      expect(handled2).toBe(true);
      
      // 未知のリクエスト（デフォルトハンドラーが処理）
      const unknownRequest = {
        type: 'unknown',
        priority: 1,
        data: {},
        timestamp: Date.now()
      };
      
      const handled3 = await emergency.handle(unknownRequest);
      expect(handled3).toBe(true);
    });

    test('MVC Pattern - Bot State Management', async () => {
      const model = new BotStateModel();
      const view = new ConsoleView();
      const controller = new BotMVCController(model, view);
      
      // 初期状態の確認
      const initialState = model.getState();
      expect(initialState.health).toBe(100);
      expect(initialState.status).toBe('idle');
      
      // コマンド実行
      await controller.handleUserInput('move north 5');
      const stateAfterMove = model.getState();
      expect(stateAfterMove.status).toBe('moving');
      expect(stateAfterMove.position.z).toBe(-5);
      
      // ヒール実行
      model.setState({ health: 50 }); // ヘルスを下げる
      await controller.handleUserInput('heal');
      const stateAfterHeal = model.getState();
      expect(stateAfterHeal.health).toBe(70); // 50 + 20
      expect(stateAfterHeal.status).toBe('healing');
      
      // 状態確認コマンド
      await expect(controller.handleUserInput('status')).resolves.not.toThrow();
    });

    test('Integrated Advanced System', async () => {
      const system = new AdvancedBotSystem();
      await expect(system.runSystemDemo()).resolves.not.toThrow();
    });
  });

  describe('Integration Tests', () => {
    test('All patterns work together', async () => {
      // Singleton + Factory
      const manager = BotManager.getInstance();
      const command = CommandFactory.createCommand('SAY', 'Integration test');
      
      // Observer + Strategy
      const eventSubject = new BotEventSubject();
      const logger = new BotEventLogger();
      eventSubject.addObserver(logger);
      
      const movementContext = new MovementContext(new DirectMovementStrategy());
      
      // MVC + Composite
      const model = new BotStateModel();
      const view = new ConsoleView();
      const controller = new BotMVCController(model, view);
      
      const ability = new CompositeAbility('Integration');
      ability.add(new SingleAbility('Test', async () => {
        eventSubject.emitBotEvent('integration', { test: true });
      }));
      
      // 統合実行
      command.execute();
      await movementContext.executeMovement(null, { x: 0, y: 0, z: 0 });
      await ability.execute({});
      await controller.handleUserInput('move east 3');
      
      // 結果確認
      expect(logger.getLogs().length).toBeGreaterThan(0);
      expect(model.getState().position.x).toBe(3);
      
      console.log('🎉 02_design_patterns 全問題クリア！デザインパターンの実装が完了しました！');
    });
  });
});