/**
 * 🟢 02_design_patterns 初級問題: 基本的なデザインパターン実装
 * 
 * Minecraftボットプロジェクトで使用される基本的なデザインパターンを実装してください。
 * この問題では、Singleton、Factory、Observerパターンの理解を深めます。
 */

// ===== Singletonパターン =====

export class BotManager {
  private static instance: BotManager | null = null;
  private bots: Map<string, any> = new Map();

  private constructor() {
    // プライベートコンストラクタ
  }

  /**
   * Singletonインスタンスを取得します
   */
  public static getInstance(): BotManager {
    // TODO: Singletonパターンの実装
    // ヒント1: instanceがnullの場合のみ新しいインスタンスを作成
    // ヒント2: 作成済みのインスタンスを返す
    
    if (!BotManager.instance) {
      BotManager.instance = new BotManager();
    }
    return BotManager.instance;
  }

  /**
   * ボットを追加します
   */
  public addBot(id: string, bot: any): void {
    // TODO: ボット追加の実装
    this.bots.set(id, bot);
  }

  /**
   * ボットを取得します
   */
  public getBot(id: string): any | undefined {
    // TODO: ボット取得の実装
    return this.bots.get(id);
  }

  /**
   * 全てのボットを取得します
   */
  public getAllBots(): any[] {
    // TODO: 全ボット取得の実装
    return Array.from(this.bots.values());
  }
}

// ===== Factoryパターン =====

export interface BotCommand {
  execute(): void;
  getType(): string;
}

export class SayCommand implements BotCommand {
  constructor(private message: string) {}

  public execute(): void {
    // TODO: SAYコマンドの実行
    console.log(`Bot says: ${this.message}`);
  }

  public getType(): string {
    return 'SAY';
  }
}

export class MoveCommand implements BotCommand {
  constructor(private direction: string, private distance: number) {}

  public execute(): void {
    // TODO: MOVEコマンドの実行
    console.log(`Bot moves ${this.direction} by ${this.distance}`);
  }

  public getType(): string {
    return 'MOVE';
  }
}

export class AttackCommand implements BotCommand {
  constructor(private target: string) {}

  public execute(): void {
    // TODO: ATTACKコマンドの実行
    console.log(`Bot attacks ${this.target}`);
  }

  public getType(): string {
    return 'ATTACK';
  }
}

export class CommandFactory {
  /**
   * コマンドタイプに応じたコマンドを作成します
   */
  public static createCommand(type: string, ...args: any[]): BotCommand {
    // TODO: Factoryパターンの実装
    // ヒント1: typeに応じて適切なCommandクラスをインスタンス化
    // ヒント2: 不正なtypeの場合はエラーを投げる
    
    switch (type.toUpperCase()) {
      case 'SAY':
        return new SayCommand(args[0] || '');
      case 'MOVE':
        return new MoveCommand(args[0] || 'forward', args[1] || 1);
      case 'ATTACK':
        return new AttackCommand(args[0] || 'nearest');
      default:
        throw new Error(`Unknown command type: ${type}`);
    }
  }

  /**
   * 利用可能なコマンドタイプを取得します
   */
  public static getAvailableTypes(): string[] {
    // TODO: 利用可能なコマンドタイプのリストを返す
    return ['SAY', 'MOVE', 'ATTACK'];
  }
}

// ===== Observerパターン =====

export interface BotEventObserver {
  onBotEvent(eventType: string, data: any): void;
}

export class BotEventLogger implements BotEventObserver {
  private logs: string[] = [];

  public onBotEvent(eventType: string, data: any): void {
    // TODO: イベントログの実装
    // ヒント: タイムスタンプ付きでログを記録
    
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${eventType}: ${JSON.stringify(data)}`;
    this.logs.push(logEntry);
    console.log(logEntry);
  }

  public getLogs(): string[] {
    return this.logs;
  }
}

export class BotHealthMonitor implements BotEventObserver {
  private healthAlerts: string[] = [];

  public onBotEvent(eventType: string, data: any): void {
    // TODO: ヘルスモニタリングの実装
    // ヒント1: 'healthChange'イベントのみを処理
    // ヒント2: ヘルスが低い場合はアラート
    
    if (eventType === 'healthChange' && data.health < 20) {
      const alert = `ALERT: Bot ${data.botId} health is low: ${data.health}`;
      this.healthAlerts.push(alert);
      console.warn(alert);
    }
  }

  public getAlerts(): string[] {
    return this.healthAlerts;
  }
}

export class BotEventSubject {
  private observers: BotEventObserver[] = [];

  /**
   * オブザーバーを追加します
   */
  public addObserver(observer: BotEventObserver): void {
    // TODO: オブザーバー追加の実装
    this.observers.push(observer);
  }

  /**
   * オブザーバーを削除します
   */
  public removeObserver(observer: BotEventObserver): void {
    // TODO: オブザーバー削除の実装
    const index = this.observers.indexOf(observer);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }

  /**
   * 全てのオブザーバーにイベントを通知します
   */
  public notifyObservers(eventType: string, data: any): void {
    // TODO: オブザーバー通知の実装
    // ヒント: 全てのオブザーバーのonBotEventを呼び出し
    
    this.observers.forEach(observer => {
      observer.onBotEvent(eventType, data);
    });
  }

  /**
   * ボットイベントを発火します
   */
  public emitBotEvent(eventType: string, data: any): void {
    // TODO: イベント発火の実装
    this.notifyObservers(eventType, data);
  }
}

// ===== 統合テスト用のクラス =====

export class PatternDemo {
  /**
   * 全てのパターンを組み合わせたデモ
   */
  public static runDemo(): void {
    console.log('=== Design Patterns Demo ===');

    // Singletonパターンのテスト
    const manager1 = BotManager.getInstance();
    const manager2 = BotManager.getInstance();
    console.log('Singleton test:', manager1 === manager2); // true であるべき

    // Factoryパターンのテスト
    const sayCommand = CommandFactory.createCommand('SAY', 'Hello World');
    const moveCommand = CommandFactory.createCommand('MOVE', 'north', 5);
    
    sayCommand.execute();
    moveCommand.execute();

    // Observerパターンのテスト
    const eventSubject = new BotEventSubject();
    const logger = new BotEventLogger();
    const healthMonitor = new BotHealthMonitor();

    eventSubject.addObserver(logger);
    eventSubject.addObserver(healthMonitor);

    eventSubject.emitBotEvent('healthChange', { botId: 'bot1', health: 15 });
    eventSubject.emitBotEvent('positionChange', { botId: 'bot1', x: 10, y: 64, z: 20 });

    console.log('Demo completed');
  }
}

// ===== エクスポート =====

export { 
  BotManager,
  CommandFactory,
  BotEventSubject,
  BotEventLogger,
  BotHealthMonitor,
  PatternDemo
};