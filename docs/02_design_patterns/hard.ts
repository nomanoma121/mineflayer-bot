/**
 * 🔴 02_design_patterns 上級問題: 複合パターンとアーキテクチャ設計
 * 
 * 複数のデザインパターンを組み合わせた複雑なシステムを実装してください。
 * Composite、Chain of Responsibility、MVCパターンの理解を深めます。
 */

// ===== Compositeパターン（能力システム） =====

export interface Ability {
  getName(): string;
  execute(context: any): Promise<void>;
  canExecute(context: any): boolean;
  getChildren?(): Ability[];
}

export class SingleAbility implements Ability {
  constructor(private name: string, private action: (context: any) => Promise<void>) {}

  getName(): string {
    return this.name;
  }

  async execute(context: any): Promise<void> {
    // TODO: 単一能力の実行
    if (!this.canExecute(context)) {
      throw new Error(`Cannot execute ability: ${this.name}`);
    }
    await this.action(context);
  }

  canExecute(context: any): boolean {
    // TODO: 実行可能性の判定
    return true; // 仮実装
  }
}

export class CompositeAbility implements Ability {
  private children: Ability[] = [];

  constructor(private name: string) {}

  getName(): string {
    return this.name;
  }

  /**
   * 子能力を追加します
   */
  public add(ability: Ability): void {
    // TODO: 子能力の追加
    this.children.push(ability);
  }

  /**
   * 子能力を削除します
   */
  public remove(ability: Ability): void {
    // TODO: 子能力の削除
    const index = this.children.indexOf(ability);
    if (index > -1) {
      this.children.splice(index, 1);
    }
  }

  async execute(context: any): Promise<void> {
    // TODO: 複合能力の実行
    // ヒント1: 全ての子能力が実行可能かチェック
    // ヒント2: 順次または並列で実行
    
    const executableChildren = this.children.filter(child => child.canExecute(context));
    
    for (const child of executableChildren) {
      await child.execute(context);
    }
  }

  canExecute(context: any): boolean {
    // TODO: 複合能力の実行可能性判定
    // ヒント: 少なくとも一つの子能力が実行可能であれば true
    return this.children.some(child => child.canExecute(context));
  }

  getChildren(): Ability[] {
    return [...this.children];
  }
}

// ===== Chain of Responsibilityパターン =====

export interface RequestHandler {
  setNext(handler: RequestHandler): RequestHandler;
  handle(request: BotRequest): Promise<boolean>;
}

export interface BotRequest {
  type: string;
  priority: number;
  data: any;
  timestamp: number;
}

export abstract class AbstractRequestHandler implements RequestHandler {
  private nextHandler?: RequestHandler;

  public setNext(handler: RequestHandler): RequestHandler {
    this.nextHandler = handler;
    return handler;
  }

  public async handle(request: BotRequest): Promise<boolean> {
    // TODO: Chain of Responsibilityの実装
    // ヒント1: 自分で処理できるかチェック
    // ヒント2: 処理できない場合は次のハンドラーに委譲
    
    if (await this.canHandle(request)) {
      return await this.doHandle(request);
    }
    
    if (this.nextHandler) {
      return await this.nextHandler.handle(request);
    }
    
    return false; // 誰も処理できなかった
  }

  protected abstract canHandle(request: BotRequest): Promise<boolean>;
  protected abstract doHandle(request: BotRequest): Promise<boolean>;
}

export class EmergencyHandler extends AbstractRequestHandler {
  protected async canHandle(request: BotRequest): Promise<boolean> {
    // TODO: 緊急事態の判定
    return request.priority >= 9 || request.type === 'emergency';
  }

  protected async doHandle(request: BotRequest): Promise<boolean> {
    // TODO: 緊急事態の処理
    console.log(`[EMERGENCY] Handling urgent request: ${request.type}`);
    return true;
  }
}

export class CombatHandler extends AbstractRequestHandler {
  protected async canHandle(request: BotRequest): Promise<boolean> {
    // TODO: 戦闘関連の判定
    return request.type === 'attack' || request.type === 'defend';
  }

  protected async doHandle(request: BotRequest): Promise<boolean> {
    // TODO: 戦闘の処理
    console.log(`[COMBAT] Handling combat request: ${request.type}`);
    return true;
  }
}

export class MovementHandler extends AbstractRequestHandler {
  protected async canHandle(request: BotRequest): Promise<boolean> {
    // TODO: 移動関連の判定
    return request.type === 'move' || request.type === 'goto';
  }

  protected async doHandle(request: BotRequest): Promise<boolean> {
    // TODO: 移動の処理
    console.log(`[MOVEMENT] Handling movement request: ${request.type}`);
    return true;
  }
}

export class DefaultHandler extends AbstractRequestHandler {
  protected async canHandle(request: BotRequest): Promise<boolean> {
    // TODO: デフォルトハンドラーは全てを受け入れ
    return true;
  }

  protected async doHandle(request: BotRequest): Promise<boolean> {
    // TODO: デフォルト処理
    console.log(`[DEFAULT] Handling request: ${request.type}`);
    return true;
  }
}

// ===== MVCパターン =====

export interface BotModel {
  getState(): any;
  setState(state: any): void;
  addObserver(observer: ModelObserver): void;
  removeObserver(observer: ModelObserver): void;
  notifyObservers(): void;
}

export interface ModelObserver {
  onModelChanged(model: BotModel): void;
}

export class BotStateModel implements BotModel {
  private state: any = {
    health: 100,
    position: { x: 0, y: 64, z: 0 },
    inventory: [],
    status: 'idle'
  };
  private observers: ModelObserver[] = [];

  getState(): any {
    return { ...this.state };
  }

  setState(newState: any): void {
    // TODO: 状態更新とオブザーバー通知
    this.state = { ...this.state, ...newState };
    this.notifyObservers();
  }

  addObserver(observer: ModelObserver): void {
    this.observers.push(observer);
  }

  removeObserver(observer: ModelObserver): void {
    const index = this.observers.indexOf(observer);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }

  notifyObservers(): void {
    this.observers.forEach(observer => observer.onModelChanged(this));
  }
}

export interface BotView {
  render(model: BotModel): void;
  setController(controller: BotController): void;
}

export class ConsoleView implements BotView, ModelObserver {
  private controller?: BotController;

  setController(controller: BotController): void {
    this.controller = controller;
  }

  render(model: BotModel): void {
    // TODO: コンソール表示の実装
    const state = model.getState();
    console.log('=== Bot Status ===');
    console.log(`Health: ${state.health}`);
    console.log(`Position: ${state.position.x}, ${state.position.y}, ${state.position.z}`);
    console.log(`Status: ${state.status}`);
    console.log(`Inventory: ${state.inventory.length} items`);
  }

  onModelChanged(model: BotModel): void {
    // TODO: モデル変更時の自動更新
    this.render(model);
  }
}

export interface BotController {
  handleUserInput(input: string): Promise<void>;
  executeCommand(command: string, params: any[]): Promise<void>;
}

export class BotMVCController implements BotController {
  constructor(private model: BotModel, private view: BotView) {
    this.view.setController(this);
    this.model.addObserver(this.view as ModelObserver);
  }

  async handleUserInput(input: string): Promise<void> {
    // TODO: ユーザー入力の解析と処理
    const [command, ...params] = input.trim().split(' ');
    await this.executeCommand(command, params);
  }

  async executeCommand(command: string, params: any[]): Promise<void> {
    // TODO: コマンド実行とモデル更新
    const currentState = this.model.getState();
    
    switch (command.toLowerCase()) {
      case 'move':
        const [direction, distance] = params;
        // 位置計算ロジック
        this.model.setState({
          status: 'moving',
          position: this.calculateNewPosition(currentState.position, direction, parseInt(distance) || 1)
        });
        break;
        
      case 'heal':
        this.model.setState({
          health: Math.min(100, currentState.health + 20),
          status: 'healing'
        });
        break;
        
      case 'status':
        this.view.render(this.model);
        break;
        
      default:
        console.log(`Unknown command: ${command}`);
    }
  }

  private calculateNewPosition(current: any, direction: string, distance: number): any {
    // TODO: 方向に応じた位置計算
    const newPos = { ...current };
    
    switch (direction?.toLowerCase()) {
      case 'north': newPos.z -= distance; break;
      case 'south': newPos.z += distance; break;
      case 'east': newPos.x += distance; break;
      case 'west': newPos.x -= distance; break;
      case 'up': newPos.y += distance; break;
      case 'down': newPos.y -= distance; break;
    }
    
    return newPos;
  }
}

// ===== 統合システム =====

export class AdvancedBotSystem {
  private abilities: CompositeAbility;
  private requestChain: RequestHandler;
  private mvc: { model: BotModel; view: BotView; controller: BotController };

  constructor() {
    this.setupAbilities();
    this.setupRequestChain();
    this.setupMVC();
  }

  private setupAbilities(): void {
    // TODO: 能力システムの構築
    this.abilities = new CompositeAbility('Root Abilities');
    
    // 移動能力
    const movement = new CompositeAbility('Movement');
    movement.add(new SingleAbility('Walk', async (ctx) => console.log('Walking')));
    movement.add(new SingleAbility('Run', async (ctx) => console.log('Running')));
    movement.add(new SingleAbility('Jump', async (ctx) => console.log('Jumping')));
    
    // 戦闘能力
    const combat = new CompositeAbility('Combat');
    combat.add(new SingleAbility('Attack', async (ctx) => console.log('Attacking')));
    combat.add(new SingleAbility('Defend', async (ctx) => console.log('Defending')));
    
    this.abilities.add(movement);
    this.abilities.add(combat);
  }

  private setupRequestChain(): void {
    // TODO: リクエストチェーンの構築
    const emergency = new EmergencyHandler();
    const combat = new CombatHandler();
    const movement = new MovementHandler();
    const defaultHandler = new DefaultHandler();
    
    emergency.setNext(combat).setNext(movement).setNext(defaultHandler);
    this.requestChain = emergency;
  }

  private setupMVC(): void {
    // TODO: MVCシステムの構築
    const model = new BotStateModel();
    const view = new ConsoleView();
    const controller = new BotMVCController(model, view);
    
    this.mvc = { model, view, controller };
  }

  /**
   * システム全体のデモを実行します
   */
  public async runSystemDemo(): Promise<void> {
    console.log('=== Advanced Bot System Demo ===');

    // 能力システムのテスト
    console.log('\n--- Ability System ---');
    await this.abilities.execute({});

    // リクエストチェーンのテスト
    console.log('\n--- Request Chain ---');
    const requests: BotRequest[] = [
      { type: 'emergency', priority: 10, data: {}, timestamp: Date.now() },
      { type: 'attack', priority: 5, data: {}, timestamp: Date.now() },
      { type: 'move', priority: 3, data: {}, timestamp: Date.now() },
      { type: 'unknown', priority: 1, data: {}, timestamp: Date.now() }
    ];

    for (const request of requests) {
      const handled = await this.requestChain.handle(request);
      console.log(`Request ${request.type} handled: ${handled}`);
    }

    // MVCシステムのテスト
    console.log('\n--- MVC System ---');
    await this.mvc.controller.handleUserInput('move north 5');
    await this.mvc.controller.handleUserInput('heal');
    await this.mvc.controller.handleUserInput('status');

    console.log('\nSystem demo completed');
  }
}