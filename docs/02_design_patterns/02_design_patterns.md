# デザインパターン実装 - 高度な設計技法の詳細解説

## 📖 プロジェクトで使用されているデザインパターン

このプロジェクトは、**5つの主要なデザインパターン**を組み合わせて、保守性・拡張性・テスタビリティを高めた設計になっています。各パターンの実装詳細とその設計判断について詳しく解説します。

## 🏛️ 1. Facade Pattern（ファサードパターン）

### 目的と問題解決
mineflayerの複雑なAPIを単純化し、アプリケーション全体で一貫したインターフェースを提供します。

### 実装詳細

```typescript
// src/core/Bot.ts
export class Bot {
  private mc: mineflayer.Bot;                    // 複雑な外部API
  private abilityManager: AbilityManager;       // 内部システム
  private currentState: IBotState;              // 状態管理
  private commandHandler: CommandHandler;       // コマンド処理

  constructor(config: BotConfig) {
    // 複雑な初期化処理をカプセル化
    this.mc = mineflayer.createBot(config);
    this.abilityManager = new AbilityManager(this);
    this.currentState = IdleState.getInstance();
    this.setupEventListeners();
    this.initializePathfinder();
  }

  // 複雑なAPIを単純化したメソッド
  public async goto(x: number, y: number, z: number): Promise<void> {
    try {
      const { goals } = await import('mineflayer-pathfinder');
      const goal = new goals.GoalBlock(x, y, z);
      await this.mc.pathfinder.goto(goal);
    } catch (error) {
      throw new Error(`Failed to move to ${x}, ${y}, ${z}: ${error}`);
    }
  }

  public getPosition(): { x: number; y: number; z: number } {
    return {
      x: Math.floor(this.mc.entity.position.x),
      y: Math.floor(this.mc.entity.position.y),
      z: Math.floor(this.mc.entity.position.z)
    };
  }

  // アビリティシステムへの便利なアクセス
  public get vitals(): VitalsAbility {
    return this.abilityManager.vitals;
  }

  public get sensing(): SensingAbility {
    return this.abilityManager.sensing;
  }

  public get inventory(): InventoryAbility {
    return this.abilityManager.inventory;
  }

  public get say(): SayAbility {
    return this.abilityManager.say;
  }
}
```

### 設計判断の理由

1. **複雑性の隠蔽**: mineflayerの詳細な設定を隠し、必要な機能だけを公開
2. **エラーハンドリングの統一**: 外部APIのエラーをアプリケーション固有のエラーに変換
3. **テスタビリティ**: 外部依存関係を内部に隠すことでモックしやすい構造
4. **保守性**: APIの変更時の影響範囲を限定

### 使用例とメリット

```typescript
// ファサードなしの場合（複雑）
const { goals } = await import('mineflayer-pathfinder');
const pathfinder = bot.mc.pathfinder;
pathfinder.setMovements(new Movements(bot.mc));
const goal = new goals.GoalBlock(x, y, z);
await pathfinder.goto(goal);

// ファサードありの場合（単純）
await bot.goto(x, y, z);
```

## 🎭 2. State Pattern（ステートパターン）

### 目的と問題解決
ボットの状態に応じて動作を変更し、状態遷移を明確に管理します。

### インターフェース設計

```typescript
// src/states/IBotState.ts
export interface IBotState {
  enter(bot: Bot): void;           // 状態開始時の処理
  execute(bot: Bot): Promise<void>; // 状態実行中の処理（毎フレーム）
  exit(bot: Bot): void;            // 状態終了時の処理
  getName(): string;               // 状態名（デバッグ用）
}
```

### 具体的な状態実装

#### IdleState（待機状態）
```typescript
// src/states/IdleState.ts
export class IdleState implements IBotState {
  private static instance: IdleState;

  // シングルトンパターンで実装
  public static getInstance(): IdleState {
    if (!IdleState.instance) {
      IdleState.instance = new IdleState();
    }
    return IdleState.instance;
  }

  public enter(bot: Bot): void {
    console.log('[State] Entering Idle state');
    bot.say.say('Ready for commands');
  }

  public async execute(bot: Bot): Promise<void> {
    // 周期的なヘルスチェック
    if (bot.vitals.isHealthLow()) {
      console.log('[Idle] Health is low, looking for food');
      // 必要に応じて状態遷移
    }

    // 自動食べ物消費
    if (bot.vitals.isHungry()) {
      await bot.vitals.eatFood();
    }

    // 基本的な待機時間
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  public exit(bot: Bot): void {
    console.log('[State] Exiting Idle state');
  }

  public getName(): string {
    return 'Idle';
  }
}
```

#### MovingState（移動状態）
```typescript
// src/states/MovingState.ts
export class MovingState implements IBotState {
  private static instance: MovingState;
  private target?: { x: number; y: number; z: number };
  private onComplete?: () => void;

  public static getInstance(): MovingState {
    if (!MovingState.instance) {
      MovingState.instance = new MovingState();
    }
    return MovingState.instance;
  }

  public setTarget(target: { x: number; y: number; z: number }, onComplete?: () => void): void {
    this.target = target;
    this.onComplete = onComplete;
  }

  public enter(bot: Bot): void {
    console.log(`[State] Entering Moving state to ${JSON.stringify(this.target)}`);
  }

  public async execute(bot: Bot): Promise<void> {
    if (!this.target) {
      console.warn('[Moving] No target set, returning to idle');
      bot.changeState(IdleState.getInstance());
      return;
    }

    try {
      const currentPos = bot.getPosition();
      const distance = Math.sqrt(
        Math.pow(currentPos.x - this.target.x, 2) +
        Math.pow(currentPos.y - this.target.y, 2) +
        Math.pow(currentPos.z - this.target.z, 2)
      );

      // 目標に到達した場合
      if (distance < 1.5) {
        console.log('[Moving] Reached target');
        if (this.onComplete) {
          this.onComplete();
        }
        bot.changeState(IdleState.getInstance());
        return;
      }

      // 移動継続
      await bot.goto(this.target.x, this.target.y, this.target.z);

    } catch (error) {
      console.error(`[Moving] Failed to move: ${error}`);
      bot.say.reportError(`Movement failed: ${error}`);
      bot.changeState(IdleState.getInstance());
    }
  }

  public exit(bot: Bot): void {
    console.log('[State] Exiting Moving state');
    this.target = undefined;
    this.onComplete = undefined;
  }

  public getName(): string {
    return 'Moving';
  }
}
```

### 状態管理システム

```typescript
// Bot クラス内の状態管理
export class Bot {
  private currentState: IBotState;

  public changeState(newState: IBotState): void {
    console.log(`[Bot] State change: ${this.currentState.getName()} → ${newState.getName()}`);
    
    this.currentState.exit(this);    // 現在の状態を終了
    this.currentState = newState;    // 新しい状態に変更
    this.currentState.enter(this);   // 新しい状態を開始
  }

  public getCurrentState(): IBotState {
    return this.currentState;
  }

  // メインループで状態実行
  private async mainLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        await this.currentState.execute(this);
      } catch (error) {
        console.error(`[Bot] Error in state ${this.currentState.getName()}: ${error}`);
        this.changeState(IdleState.getInstance());
      }
    }
  }
}
```

### シングルトンパターンとの組み合わせ

**なぜシングルトンを使うのか？**

1. **メモリ効率**: 同じ状態インスタンスを再利用
2. **状態データの保持**: 状態固有のデータを保持
3. **初期化コストの削減**: 重い初期化処理を一度だけ実行

```typescript
// メモリ効率の比較
// 通常の実装（非効率）
bot.changeState(new IdleState());  // 毎回新しいインスタンス作成

// シングルトン実装（効率的）
bot.changeState(IdleState.getInstance());  // 同じインスタンスを再利用
```

## 🎯 3. Command Pattern（コマンドパターン）

### 目的と問題解決
チャットコマンドを動的に登録・実行可能にし、コマンドの実装を分離します。

### インターフェース設計

```typescript
// src/commands/ICommand.ts
export interface ICommand {
  execute(bot: Bot, username: string, args: string[]): Promise<void>;
  getDescription(): string;
  getUsage(): string;
}
```

### CommandHandler（Invoker）

```typescript
// src/core/CommandHandler.ts
export class CommandHandler {
  private commands: Map<string, ICommand> = new Map();

  public registerCommand(name: string, command: ICommand): void {
    this.commands.set(name.toLowerCase(), command);
    console.log(`[CommandHandler] Registered command: ${name}`);
  }

  public unregisterCommand(name: string): void {
    this.commands.delete(name.toLowerCase());
    console.log(`[CommandHandler] Unregistered command: ${name}`);
  }

  public async handleMessage(username: string, message: string): Promise<void> {
    const parsedMessage = this.parseMessage(message);
    
    if (!parsedMessage.shouldHandle) {
      return;
    }

    const command = this.commands.get(parsedMessage.command);
    if (!command) {
      console.log(`[CommandHandler] Unknown command: ${parsedMessage.command}`);
      return;
    }

    try {
      await command.execute(this.bot, username, parsedMessage.args);
      console.log(`[CommandHandler] Executed command: ${parsedMessage.command} by ${username}`);
    } catch (error) {
      console.error(`[CommandHandler] Command execution failed: ${error}`);
      this.bot.say.reportError(`Command failed: ${error}`);
    }
  }

  private parseMessage(message: string): ParsedMessage {
    // @bot command arg1 arg2... 形式の解析
    const regex = /^@(bot|all|bot\d+)\s+(\w+)(?:\s+(.*))?$/i;
    const match = message.match(regex);

    if (!match) {
      return { shouldHandle: false, target: '', command: '', args: [] };
    }

    const [, target, command, argsString] = match;
    const args = argsString ? argsString.split(/\s+/) : [];

    return {
      shouldHandle: true,
      target: target.toLowerCase(),
      command: command.toLowerCase(),
      args
    };
  }
}
```

### 具体的なコマンド実装

#### GoCommand（移動コマンド）
```typescript
// src/commands/GoCommand.ts
export class GoCommand implements ICommand {
  public async execute(bot: Bot, username: string, args: string[]): Promise<void> {
    if (args.length < 3) {
      throw new Error('Usage: go <x> <y> <z>');
    }

    const x = parseInt(args[0]);
    const y = parseInt(args[1]);
    const z = parseInt(args[2]);

    if (isNaN(x) || isNaN(y) || isNaN(z)) {
      throw new Error('Coordinates must be numbers');
    }

    // 移動距離の検証
    const currentPos = bot.getPosition();
    const distance = Math.sqrt(
      Math.pow(currentPos.x - x, 2) +
      Math.pow(currentPos.y - y, 2) +
      Math.pow(currentPos.z - z, 2)
    );

    if (distance > 1000) {
      throw new Error('Distance too far (max 1000 blocks)');
    }

    bot.say.say(`Moving to coordinates ${x}, ${y}, ${z}`);
    
    // 移動状態に変更
    const movingState = MovingState.getInstance();
    movingState.setTarget({ x, y, z }, () => {
      bot.say.say(`Arrived at ${x}, ${y}, ${z}`);
    });
    
    bot.changeState(movingState);
  }

  public getDescription(): string {
    return 'Move bot to specified coordinates';
  }

  public getUsage(): string {
    return 'go <x> <y> <z>';
  }
}
```

#### BotScriptCommand（スクリプト実行コマンド）
```typescript
// src/commands/BotScriptCommand.ts
export class BotScriptCommand implements ICommand {
  private interpreter: Interpreter;
  private context: ExecutionContext;

  constructor(bot: Bot) {
    this.interpreter = new Interpreter(bot, new ExecutionContext());
    this.context = new ExecutionContext();
  }

  public async execute(bot: Bot, username: string, args: string[]): Promise<void> {
    const sourceCode = args.join(' ');
    
    if (!sourceCode.trim()) {
      throw new Error('Usage: script <BotScript code>');
    }

    try {
      // BotScript実行パイプライン
      const lexer = new Lexer(sourceCode);
      const tokens = lexer.tokenize();
      
      const parser = new Parser(tokens);
      const ast = parser.parse();
      
      bot.say.say(`Executing BotScript: ${sourceCode}`);
      
      const result = await this.interpreter.execute(ast);
      
      if (result.type === ExecutionResultType.SUCCESS) {
        bot.say.say(`Script completed successfully in ${result.duration}ms`);
      } else {
        bot.say.reportError(`Script failed: ${result.message}`);
      }
      
    } catch (error) {
      throw new Error(`BotScript error: ${error}`);
    }
  }

  public getDescription(): string {
    return 'Execute BotScript code';
  }

  public getUsage(): string {
    return 'script <BotScript code>';
  }
}
```

### コマンド登録システム

```typescript
// src/index.ts での使用例
const commandHandler = new CommandHandler(bot);

// コマンドの動的登録
commandHandler.registerCommand('go', new GoCommand());
commandHandler.registerCommand('say', new SayCommand());
commandHandler.registerCommand('script', new BotScriptCommand(bot));
commandHandler.registerCommand('status', new StatusCommand());
commandHandler.registerCommand('stop', new StopCommand());

// 条件付きコマンド登録
if (process.env.ADMIN_MODE === 'true') {
  commandHandler.registerCommand('admin', new AdminCommand());
}
```

## 🧩 4. Composite Pattern（コンポジットパターン）

### 目的と問題解決
アビリティシステムを階層構造で管理し、個別機能と統合機能を同じインターフェースで扱います。

### アビリティ基底インターフェース

```typescript
// src/abilities/IAbility.ts
export interface IAbility {
  getName(): string;
  getDescription(): string;
  initialize(): Promise<void>;
  isAvailable(): boolean;
  cleanup?(): void;
}
```

### AbilityManager（Composite）

```typescript
// src/abilities/AbilityManager.ts
export class AbilityManager {
  private abilities: Map<string, IAbility> = new Map();
  private bot: Bot;

  constructor(bot: Bot) {
    this.bot = bot;
    this.initializeAbilities();
  }

  private initializeAbilities(): void {
    // リーフコンポーネント（個別アビリティ）を登録
    this.registerAbility(new VitalsAbility(this.bot));
    this.registerAbility(new SensingAbility(this.bot));
    this.registerAbility(new InventoryAbility(this.bot));
    this.registerAbility(new SayAbility(this.bot));
  }

  public registerAbility(ability: IAbility): void {
    this.abilities.set(ability.getName(), ability);
    console.log(`[AbilityManager] Registered ability: ${ability.getName()}`);
  }

  public getAbility<T extends IAbility>(name: string): T | undefined {
    return this.abilities.get(name) as T;
  }

  // 全アビリティに対する統合操作
  public async initializeAll(): Promise<void> {
    console.log('[AbilityManager] Initializing all abilities...');
    
    for (const [name, ability] of this.abilities) {
      try {
        await ability.initialize();
        console.log(`[AbilityManager] Initialized ability: ${name}`);
      } catch (error) {
        console.error(`[AbilityManager] Failed to initialize ${name}: ${error}`);
      }
    }
  }

  public getAvailableAbilities(): string[] {
    return Array.from(this.abilities.values())
      .filter(ability => ability.isAvailable())
      .map(ability => ability.getName());
  }

  public cleanup(): void {
    for (const [name, ability] of this.abilities) {
      if (ability.cleanup) {
        try {
          ability.cleanup();
          console.log(`[AbilityManager] Cleaned up ability: ${name}`);
        } catch (error) {
          console.error(`[AbilityManager] Failed to cleanup ${name}: ${error}`);
        }
      }
    }
    this.abilities.clear();
  }

  // 便利なアクセサー（Facade的な機能も提供）
  public get vitals(): VitalsAbility {
    return this.getAbility('vitals') as VitalsAbility;
  }

  public get sensing(): SensingAbility {
    return this.getAbility('sensing') as SensingAbility;
  }

  public get inventory(): InventoryAbility {
    return this.getAbility('inventory') as InventoryAbility;
  }

  public get say(): SayAbility {
    return this.getAbility('say') as SayAbility;
  }
}
```

### 個別アビリティ実装（Leaf）

#### VitalsAbility
```typescript
// src/abilities/VitalsAbility.ts
export class VitalsAbility implements IAbility {
  private bot: Bot;

  constructor(bot: Bot) {
    this.bot = bot;
  }

  public getName(): string {
    return 'vitals';
  }

  public getDescription(): string {
    return 'Manages bot health, hunger, and vital statistics';
  }

  public async initialize(): Promise<void> {
    console.log('[VitalsAbility] Initializing vital monitoring...');
    // 初期化処理
  }

  public isAvailable(): boolean {
    return this.bot.mc && this.bot.mc.health !== undefined;
  }

  // ドメイン固有のメソッド
  public isHealthLow(): boolean {
    return this.bot.mc.health < 6;
  }

  public isHungry(): boolean {
    return this.bot.mc.food < 6;
  }

  public async eatFood(): Promise<boolean> {
    try {
      const food = this.bot.inventory.findFood();
      if (food) {
        await this.bot.mc.equip(food, 'hand');
        await this.bot.mc.consume();
        return true;
      }
      return false;
    } catch (error) {
      console.error('[VitalsAbility] Failed to eat food:', error);
      return false;
    }
  }

  public getVitalStats(): VitalStats {
    return {
      health: this.bot.mc.health,
      food: this.bot.mc.food,
      saturation: this.bot.mc.foodSaturation,
      level: this.bot.mc.experience.level,
      experience: this.bot.mc.experience.points
    };
  }
}
```

### 階層的アビリティ管理

```typescript
// アビリティの組み合わせによる高レベル機能
export class AdvancedActionAbility implements IAbility {
  private abilityManager: AbilityManager;

  constructor(abilityManager: AbilityManager) {
    this.abilityManager = abilityManager;
  }

  // 複数のアビリティを組み合わせた複合操作
  public async performSafeAction(action: () => Promise<void>): Promise<boolean> {
    // ヘルスチェック
    if (this.abilityManager.vitals.isHealthLow()) {
      this.abilityManager.say.reportError('Health too low for action');
      return false;
    }

    // 周囲の安全確認
    const enemies = this.abilityManager.sensing.findNearbyEntities('hostile');
    if (enemies.length > 0) {
      this.abilityManager.say.reportError('Enemies nearby, action cancelled');
      return false;
    }

    // アクション実行
    try {
      await action();
      return true;
    } catch (error) {
      this.abilityManager.say.reportError(`Action failed: ${error}`);
      return false;
    }
  }
}
```

## 🔄 5. Singleton Pattern（シングルトンパターン）

### 目的と問題解決
状態インスタンスのメモリ効率化と、グローバルアクセスが必要なオブジェクトの一意性保証。

### 実装パターン

#### 基本的なシングルトン実装
```typescript
export class IdleState implements IBotState {
  private static instance: IdleState;
  private constructor() {} // プライベートコンストラクタ

  public static getInstance(): IdleState {
    if (!IdleState.instance) {
      IdleState.instance = new IdleState();
    }
    return IdleState.instance;
  }

  // 状態固有のデータを保持可能
  private lastExecutionTime: number = 0;
  
  public async execute(bot: Bot): Promise<void> {
    const now = Date.now();
    if (now - this.lastExecutionTime < 100) {
      return; // 実行間隔制御
    }
    this.lastExecutionTime = now;
    
    // 実際の処理...
  }
}
```

#### スレッドセーフな実装（TypeScriptでの配慮）
```typescript
export class ConfigManager {
  private static instance: ConfigManager;
  private static isCreating = false;
  private config: BotConfig;

  private constructor() {
    this.loadConfig();
  }

  public static async getInstance(): Promise<ConfigManager> {
    if (!ConfigManager.instance && !ConfigManager.isCreating) {
      ConfigManager.isCreating = true;
      ConfigManager.instance = new ConfigManager();
      ConfigManager.isCreating = false;
    }
    
    // 作成中の場合は待機
    while (ConfigManager.isCreating) {
      await new Promise(resolve => setTimeout(resolve, 1));
    }
    
    return ConfigManager.instance;
  }

  private loadConfig(): void {
    // 設定ファイルの読み込み
    this.config = {
      host: process.env.MC_HOST || 'localhost',
      port: parseInt(process.env.MC_PORT || '25565'),
      username: process.env.MC_USERNAME || 'Bot',
      // ...
    };
  }

  public getConfig(): BotConfig {
    return { ...this.config }; // 防御的コピー
  }
}
```

### 使用場面と判断基準

| 使用場面 | 理由 | 実装クラス |
|---------|------|-----------|
| **状態クラス** | メモリ効率化・状態データ保持 | `IdleState`, `MovingState` |
| **設定管理** | グローバル設定へのアクセス | `ConfigManager` |
| **ログシステム** | 一元的なログ管理 | `Logger` |
| **リソース管理** | 重いリソースの共有 | - |

## 🔗 パターンの相互作用

### パターンの組み合わせ効果

```typescript
// 複数パターンの統合例
export class Bot {  // Facade
  private abilityManager: AbilityManager;  // Composite
  private currentState: IBotState;         // State (Singleton)
  private commandHandler: CommandHandler;  // Command

  public async executeCommand(command: string): Promise<void> {
    // Command Pattern: コマンドの実行
    await this.commandHandler.handleMessage('system', command);
  }

  public changeState(newState: IBotState): void {
    // State Pattern: 状態遷移
    this.currentState.exit(this);
    this.currentState = newState;  // Singleton instance
    this.currentState.enter(this);
  }

  public get vitals(): VitalsAbility {
    // Facade + Composite: 簡単なアクセス
    return this.abilityManager.vitals;
  }
}
```

### 依存関係図

```
Bot (Facade)
  │
  ├── CommandHandler (Command Pattern)
  │     └── ICommand implementations
  │
  ├── IBotState (State Pattern + Singleton)
  │     ├── IdleState (Singleton)
  │     ├── MovingState (Singleton)
  │     └── AttackingState (Singleton)
  │
  └── AbilityManager (Composite Pattern)
        ├── VitalsAbility (Leaf)
        ├── SensingAbility (Leaf)
        ├── InventoryAbility (Leaf)
        └── SayAbility (Leaf)
```

## 📝 練習問題

### 🟢 初級問題
**問題**: Facade パターンの利点を3つ挙げ、Bot クラスでの具体例を説明してください。

<details>
<summary>解答例</summary>

**Facade パターンの利点**:

1. **複雑性の隠蔽**
   ```typescript
   // 複雑な内部処理を隠蔽
   public async goto(x: number, y: number, z: number): Promise<void> {
     // pathfinder の複雑な設定をカプセル化
   }
   ```

2. **統一インターフェース**
   ```typescript
   // アビリティへの一貫したアクセス
   bot.vitals.isHealthLow()    // 統一された形式
   bot.sensing.isNight()       // 統一された形式
   ```

3. **依存関係の削減**
   ```typescript
   // クライアントは Bot のみに依存すれば良い
   // mineflayer の詳細を知る必要がない
   ```

**テスト方法**:
```typescript
test('facade pattern benefits', () => {
  const bot = new Bot(config);
  
  // 1. シンプルなインターフェース
  expect(typeof bot.goto).toBe('function');
  
  // 2. 統一されたアクセス
  expect(bot.vitals).toBeDefined();
  expect(bot.sensing).toBeDefined();
  
  // 3. 内部の複雑性が隠蔽されている
  expect(bot.mc).toBeUndefined(); // 外部に露出しない
});
```
</details>

### 🟡 中級問題
**問題**: State パターンで新しい状態 `MiningState` を実装してください。この状態では、ブロックを採掘し、インベントリが満杯になったら `IdleState` に戻る機能を実装してください。

<details>
<summary>解答例</summary>

```typescript
// src/states/MiningState.ts
export class MiningState implements IBotState {
  private static instance: MiningState;
  private targetBlock?: string;
  private miningCount: number = 0;
  private maxMiningCount: number = 50;

  private constructor() {}

  public static getInstance(): MiningState {
    if (!MiningState.instance) {
      MiningState.instance = new MiningState();
    }
    return MiningState.instance;
  }

  public setTarget(blockType: string, maxCount: number = 50): void {
    this.targetBlock = blockType;
    this.maxMiningCount = maxCount;
    this.miningCount = 0;
  }

  public enter(bot: Bot): void {
    console.log(`[State] Entering Mining state for ${this.targetBlock}`);
    bot.say.say(`Starting to mine ${this.targetBlock}`);
  }

  public async execute(bot: Bot): Promise<void> {
    if (!this.targetBlock) {
      console.warn('[Mining] No target block set');
      bot.changeState(IdleState.getInstance());
      return;
    }

    // インベントリ満杯チェック
    if (bot.inventory.isFull()) {
      bot.say.say('Inventory full, stopping mining');
      bot.changeState(IdleState.getInstance());
      return;
    }

    // 採掘上限チェック
    if (this.miningCount >= this.maxMiningCount) {
      bot.say.say(`Mining complete: ${this.miningCount} blocks mined`);
      bot.changeState(IdleState.getInstance());
      return;
    }

    try {
      // 対象ブロックを探す
      const block = bot.sensing.findNearestBlock(this.targetBlock);
      if (!block) {
        bot.say.say(`No ${this.targetBlock} found nearby`);
        bot.changeState(IdleState.getInstance());
        return;
      }

      // ブロックに移動
      await bot.goto(block.position.x, block.position.y, block.position.z);
      
      // 採掘実行
      await bot.mc.dig(block);
      this.miningCount++;
      
      // 進捗報告
      if (this.miningCount % 10 === 0) {
        bot.say.say(`Mined ${this.miningCount}/${this.maxMiningCount} blocks`);
      }

    } catch (error) {
      console.error(`[Mining] Error: ${error}`);
      bot.say.reportError(`Mining failed: ${error}`);
      bot.changeState(IdleState.getInstance());
    }
  }

  public exit(bot: Bot): void {
    console.log(`[State] Exiting Mining state (mined ${this.miningCount} blocks)`);
    this.targetBlock = undefined;
    this.miningCount = 0;
  }

  public getName(): string {
    return 'Mining';
  }
}

// 使用例
const miningState = MiningState.getInstance();
miningState.setTarget('stone', 30);
bot.changeState(miningState);
```

**テスト方法**:
```typescript
test('mining state implementation', async () => {
  const mockBot = createMockBot();
  const miningState = MiningState.getInstance();
  
  miningState.setTarget('stone', 5);
  miningState.enter(mockBot);
  
  // インベントリが満杯の場合
  mockBot.inventory.isFull = jest.fn(() => true);
  await miningState.execute(mockBot);
  
  expect(mockBot.changeState).toHaveBeenCalledWith(IdleState.getInstance());
});
```
</details>

### 🔴 上級問題
**問題**: Command パターンを拡張して、コマンドの実行履歴を管理し、Undo機能を実装してください。特に移動コマンドの Undo（元の位置に戻る）を実装してください。

<details>
<summary>解答例</summary>

```typescript
// コマンド履歴管理の拡張
export interface IUndoableCommand extends ICommand {
  undo(bot: Bot): Promise<void>;
  canUndo(): boolean;
  getUndoDescription(): string;
}

// CommandHistory クラス
export class CommandHistory {
  private history: Array<{
    command: IUndoableCommand;
    timestamp: number;
    context: any;
  }> = [];
  private maxHistorySize = 50;

  public addCommand(command: IUndoableCommand, context?: any): void {
    this.history.push({
      command,
      timestamp: Date.now(),
      context
    });

    // 履歴サイズ制限
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  public async undoLastCommand(bot: Bot): Promise<boolean> {
    const lastCommand = this.history.pop();
    if (!lastCommand || !lastCommand.command.canUndo()) {
      return false;
    }

    try {
      await lastCommand.command.undo(bot);
      return true;
    } catch (error) {
      // 失敗した場合は履歴に戻す
      this.history.push(lastCommand);
      throw error;
    }
  }

  public getHistory(): Array<{command: string; timestamp: number}> {
    return this.history.map(entry => ({
      command: entry.command.getDescription(),
      timestamp: entry.timestamp
    }));
  }
}

// UndoableGoCommand 実装
export class UndoableGoCommand implements IUndoableCommand {
  private originalPosition?: { x: number; y: number; z: number };

  public async execute(bot: Bot, username: string, args: string[]): Promise<void> {
    if (args.length < 3) {
      throw new Error('Usage: go <x> <y> <z>');
    }

    // 現在位置を保存（Undo用）
    this.originalPosition = bot.getPosition();

    const x = parseInt(args[0]);
    const y = parseInt(args[1]);
    const z = parseInt(args[2]);

    if (isNaN(x) || isNaN(y) || isNaN(z)) {
      throw new Error('Coordinates must be numbers');
    }

    bot.say.say(`Moving to ${x}, ${y}, ${z} (from ${this.originalPosition.x}, ${this.originalPosition.y}, ${this.originalPosition.z})`);
    
    const movingState = MovingState.getInstance();
    movingState.setTarget({ x, y, z });
    bot.changeState(movingState);
  }

  public async undo(bot: Bot): Promise<void> {
    if (!this.originalPosition) {
      throw new Error('No original position recorded');
    }

    const { x, y, z } = this.originalPosition;
    bot.say.say(`Returning to original position: ${x}, ${y}, ${z}`);
    
    const movingState = MovingState.getInstance();
    movingState.setTarget({ x, y, z });
    bot.changeState(movingState);
  }

  public canUndo(): boolean {
    return this.originalPosition !== undefined;
  }

  public getDescription(): string {
    return 'Move bot to coordinates';
  }

  public getUndoDescription(): string {
    return `Return to ${this.originalPosition?.x}, ${this.originalPosition?.y}, ${this.originalPosition?.z}`;
  }

  public getUsage(): string {
    return 'go <x> <y> <z>';
  }
}

// 拡張された CommandHandler
export class AdvancedCommandHandler extends CommandHandler {
  private commandHistory = new CommandHistory();

  public async handleMessage(username: string, message: string): Promise<void> {
    if (message.toLowerCase().includes('@bot undo')) {
      await this.handleUndo();
      return;
    }

    if (message.toLowerCase().includes('@bot history')) {
      this.showHistory();
      return;
    }

    // 通常のコマンド処理
    await super.handleMessage(username, message);
  }

  public async executeUndoableCommand(command: IUndoableCommand, username: string, args: string[]): Promise<void> {
    try {
      await command.execute(this.bot, username, args);
      this.commandHistory.addCommand(command);
    } catch (error) {
      throw error;
    }
  }

  private async handleUndo(): Promise<void> {
    try {
      const success = await this.commandHistory.undoLastCommand(this.bot);
      if (success) {
        this.bot.say.say('Command undone successfully');
      } else {
        this.bot.say.say('No command to undo');
      }
    } catch (error) {
      this.bot.say.reportError(`Undo failed: ${error}`);
    }
  }

  private showHistory(): void {
    const history = this.commandHistory.getHistory();
    if (history.length === 0) {
      this.bot.say.say('No command history');
      return;
    }

    const recent = history.slice(-5); // 最新5件
    const historyText = recent.map((entry, index) => {
      const time = new Date(entry.timestamp).toLocaleTimeString();
      return `${index + 1}. ${entry.command} (${time})`;
    }).join('\n');

    this.bot.say.say(`Recent commands:\n${historyText}`);
  }
}
```

**使用例とテスト**:
```typescript
// 使用例
const advancedHandler = new AdvancedCommandHandler(bot);
const undoableGoCommand = new UndoableGoCommand();

advancedHandler.registerCommand('go', undoableGoCommand);

// チャットでの使用
// @bot go 100 64 200  ← 移動実行
// @bot undo           ← 元の位置に戻る
// @bot history        ← 履歴表示

// テスト
test('undoable command system', async () => {
  const mockBot = createMockBot();
  mockBot.getPosition = jest.fn(() => ({ x: 0, y: 64, z: 0 }));
  
  const command = new UndoableGoCommand();
  const handler = new AdvancedCommandHandler(mockBot);
  
  // コマンド実行
  await handler.executeUndoableCommand(command, 'player', ['100', '64', '200']);
  
  // Undo実行
  const undoSuccess = await handler.commandHistory.undoLastCommand(mockBot);
  expect(undoSuccess).toBe(true);
});
```
</details>

## 🏆 自己評価チェックリスト

- [ ] **初級**: 各デザインパターンの目的と基本構造を理解している
- [ ] **中級**: パターンを組み合わせた実装ができる
- [ ] **上級**: 既存パターンを拡張して新機能を追加できる

## 📚 次のステップ

デザインパターンを理解したら、次は**[アビリティシステム](./08_ability_system.md)**で Composite パターンの実践的な応用を学び、その後**[テストアーキテクチャ](./11_testing_architecture.md)**でパターンのテスタビリティについて学習しましょう。