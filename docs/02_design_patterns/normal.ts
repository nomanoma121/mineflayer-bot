/**
 * 🟡 02_design_patterns 中級問題: 高度なデザインパターン実装
 * 
 * より複雑なデザインパターンとその組み合わせを実装してください。
 * Strategy、Decorator、Command Queueパターンの実装を学びます。
 */

// ===== Strategyパターン =====

export interface MovementStrategy {
  move(bot: any, target: { x: number; y: number; z: number }): Promise<void>;
  getName(): string;
}

export class DirectMovementStrategy implements MovementStrategy {
  async move(bot: any, target: { x: number; y: number; z: number }): Promise<void> {
    // TODO: 直線移動戦略の実装
    // ヒント: 直接目標に向かって移動
    console.log(`Direct movement to ${target.x}, ${target.y}, ${target.z}`);
  }

  getName(): string {
    return 'Direct';
  }
}

export class PathfindingMovementStrategy implements MovementStrategy {
  async move(bot: any, target: { x: number; y: number; z: number }): Promise<void> {
    // TODO: パスファインディング移動戦略の実装
    // ヒント: 障害物を避けながら移動
    console.log(`Pathfinding to ${target.x}, ${target.y}, ${target.z}`);
  }

  getName(): string {
    return 'Pathfinding';
  }
}

export class SafeMovementStrategy implements MovementStrategy {
  async move(bot: any, target: { x: number; y: number; z: number }): Promise<void> {
    // TODO: 安全移動戦略の実装
    // ヒント: 危険な場所を避けながら移動
    console.log(`Safe movement to ${target.x}, ${target.y}, ${target.z}`);
  }

  getName(): string {
    return 'Safe';
  }
}

export class MovementContext {
  private strategy: MovementStrategy;

  constructor(strategy: MovementStrategy) {
    this.strategy = strategy;
  }

  /**
   * 移動戦略を変更します
   */
  public setStrategy(strategy: MovementStrategy): void {
    // TODO: 戦略の変更実装
    this.strategy = strategy;
  }

  /**
   * 現在の戦略で移動を実行します
   */
  public async executeMovement(bot: any, target: { x: number; y: number; z: number }): Promise<void> {
    // TODO: 戦略の実行
    await this.strategy.move(bot, target);
  }

  /**
   * 現在の戦略名を取得します
   */
  public getCurrentStrategy(): string {
    return this.strategy.getName();
  }
}

// ===== Decoratorパターン =====

export interface BotAction {
  execute(): Promise<void>;
  getDescription(): string;
}

export class BasicMoveAction implements BotAction {
  constructor(private direction: string, private distance: number) {}

  async execute(): Promise<void> {
    console.log(`Moving ${this.direction} by ${this.distance}`);
  }

  getDescription(): string {
    return `Move ${this.direction} ${this.distance}`;
  }
}

export abstract class ActionDecorator implements BotAction {
  protected action: BotAction;

  constructor(action: BotAction) {
    this.action = action;
  }

  async execute(): Promise<void> {
    await this.action.execute();
  }

  getDescription(): string {
    return this.action.getDescription();
  }
}

export class LoggingDecorator extends ActionDecorator {
  async execute(): Promise<void> {
    // TODO: ログ付きアクション実行の実装
    // ヒント1: 実行前にログ出力
    // ヒント2: 基底アクションを実行
    // ヒント3: 実行後にログ出力
    
    console.log(`[LOG] Starting: ${this.action.getDescription()}`);
    await super.execute();
    console.log(`[LOG] Completed: ${this.action.getDescription()}`);
  }

  getDescription(): string {
    return `Logged(${super.getDescription()})`;
  }
}

export class TimingDecorator extends ActionDecorator {
  async execute(): Promise<void> {
    // TODO: 実行時間測定の実装
    // ヒント1: 開始時間を記録
    // ヒント2: アクションを実行
    // ヒント3: 終了時間を記録して差分を出力
    
    const startTime = Date.now();
    await super.execute();
    const endTime = Date.now();
    console.log(`[TIMING] ${this.action.getDescription()} took ${endTime - startTime}ms`);
  }

  getDescription(): string {
    return `Timed(${super.getDescription()})`;
  }
}

export class RetryDecorator extends ActionDecorator {
  constructor(action: BotAction, private maxRetries: number = 3) {
    super(action);
  }

  async execute(): Promise<void> {
    // TODO: リトライ機能の実装
    // ヒント1: maxRetriesまでループ
    // ヒント2: try-catchでエラーをキャッチ
    // ヒント3: 最後の試行でも失敗したらエラーを投げる
    
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        await super.execute();
        return; // 成功したら終了
      } catch (error) {
        lastError = error as Error;
        console.log(`[RETRY] Attempt ${attempt} failed: ${error}`);
        if (attempt < this.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // 指数バックオフ
        }
      }
    }
    
    throw new Error(`Action failed after ${this.maxRetries} attempts: ${lastError?.message}`);
  }

  getDescription(): string {
    return `Retry(${super.getDescription()}, max=${this.maxRetries})`;
  }
}

// ===== Command Queueパターン =====

export interface QueueableCommand {
  execute(): Promise<void>;
  undo?(): Promise<void>;
  getId(): string;
  getPriority(): number;
}

export class PriorityMoveCommand implements QueueableCommand {
  constructor(
    private id: string,
    private direction: string,
    private distance: number,
    private priority: number = 0
  ) {}

  async execute(): Promise<void> {
    // TODO: 優先度付き移動コマンドの実装
    console.log(`[PRIORITY ${this.priority}] Moving ${this.direction} by ${this.distance}`);
  }

  async undo(): Promise<void> {
    // TODO: 移動コマンドの取り消し実装
    // ヒント: 逆方向に移動
    const reverseDirection = this.getReverseDirection(this.direction);
    console.log(`[UNDO] Moving ${reverseDirection} by ${this.distance}`);
  }

  private getReverseDirection(direction: string): string {
    const reverseMap: Record<string, string> = {
      'north': 'south',
      'south': 'north',
      'east': 'west',
      'west': 'east',
      'up': 'down',
      'down': 'up'
    };
    return reverseMap[direction] || direction;
  }

  getId(): string {
    return this.id;
  }

  getPriority(): number {
    return this.priority;
  }
}

export class CommandQueue {
  private commands: QueueableCommand[] = [];
  private history: QueueableCommand[] = [];
  private isProcessing: boolean = false;

  /**
   * コマンドをキューに追加します
   */
  public enqueue(command: QueueableCommand): void {
    // TODO: 優先度順でのコマンド挿入
    // ヒント1: 優先度の高い順にソート
    // ヒント2: 同一優先度なら追加順を維持
    
    this.commands.push(command);
    this.commands.sort((a, b) => b.getPriority() - a.getPriority());
  }

  /**
   * 次のコマンドを取得して削除します
   */
  public dequeue(): QueueableCommand | null {
    // TODO: コマンドの取り出し実装
    return this.commands.shift() || null;
  }

  /**
   * キューを処理します
   */
  public async processQueue(): Promise<void> {
    // TODO: キュー処理の実装
    // ヒント1: 処理中フラグを設定
    // ヒント2: キューが空になるまで処理
    // ヒント3: 各コマンドを実行し履歴に追加
    
    if (this.isProcessing) {
      console.log('Queue is already being processed');
      return;
    }

    this.isProcessing = true;
    
    try {
      while (this.commands.length > 0) {
        const command = this.dequeue();
        if (command) {
          console.log(`Processing command: ${command.getId()}`);
          await command.execute();
          this.history.push(command);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 最後のコマンドを取り消します
   */
  public async undoLast(): Promise<void> {
    // TODO: 最後のコマンドの取り消し実装
    const lastCommand = this.history.pop();
    if (lastCommand && lastCommand.undo) {
      console.log(`Undoing command: ${lastCommand.getId()}`);
      await lastCommand.undo();
    }
  }

  /**
   * キューの状態を取得します
   */
  public getStatus(): { pending: number; completed: number; processing: boolean } {
    return {
      pending: this.commands.length,
      completed: this.history.length,
      processing: this.isProcessing
    };
  }
}

// ===== 統合デモ =====

export class AdvancedPatternDemo {
  public static async runDemo(): Promise<void> {
    console.log('=== Advanced Design Patterns Demo ===');

    // Strategyパターンのデモ
    console.log('\n--- Strategy Pattern ---');
    const movementContext = new MovementContext(new DirectMovementStrategy());
    await movementContext.executeMovement(null, { x: 10, y: 64, z: 20 });
    
    movementContext.setStrategy(new PathfindingMovementStrategy());
    await movementContext.executeMovement(null, { x: 30, y: 70, z: 40 });

    // Decoratorパターンのデモ
    console.log('\n--- Decorator Pattern ---');
    let action: BotAction = new BasicMoveAction('north', 5);
    action = new LoggingDecorator(action);
    action = new TimingDecorator(action);
    action = new RetryDecorator(action, 2);
    
    console.log(`Action: ${action.getDescription()}`);
    await action.execute();

    // Command Queueパターンのデモ
    console.log('\n--- Command Queue Pattern ---');
    const queue = new CommandQueue();
    
    queue.enqueue(new PriorityMoveCommand('move1', 'north', 3, 1));
    queue.enqueue(new PriorityMoveCommand('move2', 'east', 2, 5)); // 高優先度
    queue.enqueue(new PriorityMoveCommand('move3', 'south', 1, 2));
    
    console.log('Queue status before processing:', queue.getStatus());
    await queue.processQueue();
    console.log('Queue status after processing:', queue.getStatus());
    
    await queue.undoLast();

    console.log('\nAdvanced demo completed');
  }
}