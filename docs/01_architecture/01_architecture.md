# プロジェクト全体アーキテクチャ - システム設計の詳細解説

## 📖 プロジェクト概要

このMinecraftボットプロジェクトは、**複数の高度な設計パターンとエンタープライズグレードの機能を統合した大規模ソフトウェアシステム**です。TypeScriptで実装され、mineflayerフレームワークを基盤として、独自のプログラミング言語（BotScript）まで含む包括的なボット制御プラットフォームです。

## 🏗️ システムアーキテクチャ概要

### 全体構成図

```
┌─────────────────────────────────────────────────────────────────┐
│                    Minecraft Server                             │
│                   ↑ Minecraft Protocol ↓                       │
└─────────────────────────────────────────────────────────────────┘
                               ↑
┌─────────────────────────────────────────────────────────────────┐
│                   Mineflayer Framework                          │
└─────────────────────────────────────────────────────────────────┘
                               ↑
┌─────────────────────────────────────────────────────────────────┐
│                      Bot Core System                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │    Bot      │  │ CommandHandler │ │   State    │             │
│  │  (Facade)   │←→│   (Command)    │←→│  Machine   │             │
│  └─────────────┘  └─────────────┐  └─────────────┘             │
│         ↑                       │                               │
│         │                       ↓                               │
│  ┌─────────────┐  ┌─────────────────────────────────────────┐   │
│  │  Ability    │  │         BotScript Language              │   │
│  │  Manager    │  │  ┌─────────┐ ┌─────────┐ ┌──────────┐  │   │
│  │ (Composite) │  │  │ Lexer   │→│ Parser  │→│Interpreter│  │   │
│  └─────────────┘  │  └─────────┘ └─────────┘ └──────────┘  │   │
│         ↑          └─────────────────────────────────────────┘   │
│         │                                                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Individual Abilities                        │    │
│  │ ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌─────────────┐   │    │
│  │ │ Vitals  │ │Sensing  │ │Inventory │ │     Say     │   │    │
│  │ │ (Health)│ │(Perception)│(Items)  │ │(Communication)│   │    │
│  │ └─────────┘ └─────────┘ └──────────┘ └─────────────┘   │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 レイヤードアーキテクチャ

### 1. プレゼンテーション層（Presentation Layer）
```typescript
// Minecraftチャットインターフェース
// ユーザーとの相互作用を処理
src/index.ts          // エントリーポイント
src/core/Bot.ts       // メインファサード
```

### 2. アプリケーション層（Application Layer）  
```typescript
// ビジネスロジックとワークフロー制御
src/core/CommandHandler.ts     // コマンド処理統括
src/commands/*.ts              // 個別コマンド実装
src/states/*.ts                // 状態管理
```

### 3. ドメイン層（Domain Layer）
```typescript
// コアビジネスルールとエンティティ
src/abilities/*.ts             // アビリティシステム
src/botscript/                 // 自作言語エンジン
```

### 4. インフラストラクチャ層（Infrastructure Layer）
```typescript
// 外部システムとの接続
mineflayer                     // Minecraft接続
minecraft-data                 // ゲームデータ
```

## 🔧 主要コンポーネント詳細

### Bot クラス（Facade Pattern）

```typescript
// src/core/Bot.ts
export class Bot {
  private mc: mineflayer.Bot;           // Mineflayerボット実装
  private abilityManager: AbilityManager; // アビリティ統括管理
  private currentState: IBotState;      // 現在の状態
  
  // 外部APIを統一インターフェースで提供
  public async goto(x: number, y: number, z: number): Promise<void> {
    const { goals } = await import('mineflayer-pathfinder');
    const goal = new goals.GoalBlock(x, y, z);
    await this.mc.pathfinder.goto(goal);
  }
}
```

**設計判断**:
- 複雑なmineflayer APIを単純化
- アビリティシステムへの統一アクセス
- 状態パターンとの連携
- テスタビリティの向上

### CommandHandler クラス（Command Pattern）

```typescript
// src/core/CommandHandler.ts
export class CommandHandler {
  private commands: Map<string, ICommand> = new Map();
  
  public registerCommand(name: string, command: ICommand): void {
    this.commands.set(name.toLowerCase(), command);
  }
  
  public async handleMessage(username: string, message: string): Promise<void> {
    // チャットメッセージをパースしてコマンド実行
    const parsedMessage = this.parseMessage(message);
    if (parsedMessage.shouldHandle) {
      const command = this.commands.get(parsedMessage.command);
      await command?.execute(this.bot, username, parsedMessage.args);
    }
  }
}
```

**設計判断**:
- コマンドの動的登録・削除
- 統一されたコマンドインターフェース
- エラーハンドリングの集約
- 拡張性の確保

### State System（State Pattern）

```typescript
// src/states/IBotState.ts
export interface IBotState {
  enter(bot: Bot): void;
  execute(bot: Bot): Promise<void>;
  exit(bot: Bot): void;
  getName(): string;
}

// 状態実装例
export class IdleState implements IBotState {
  private static instance: IdleState;
  
  public static getInstance(): IdleState {
    if (!IdleState.instance) {
      IdleState.instance = new IdleState();
    }
    return IdleState.instance;
  }
  
  public enter(bot: Bot): void {
    console.log('[State] Entering Idle state');
  }
  
  public async execute(bot: Bot): Promise<void> {
    // 待機状態のロジック
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
```

**設計判断**:
- シングルトンによるメモリ効率化
- 状態遷移の明確化
- 各状態の責任分離
- テストしやすい構造

## 🧠 BotScript言語システム

### アーキテクチャ図
```
[Source Code] → [Lexer] → [Tokens] → [Parser] → [AST] → [Interpreter] → [Bot Actions]
     ↑             ↑         ↑          ↑         ↑          ↑             ↑
   文字列        字句解析   トークン列   構文解析   抽象構文木  インタプリタ   実際の実行
```

### 各層の責務

#### 1. Lexer（字句解析層）
```typescript
// src/botscript/lexer/Lexer.ts
export class Lexer {
  public tokenize(): Token[] {
    // ソースコードをトークンに分解
    // "SAY \"Hello\"" → [SAY, STRING("Hello")]
  }
}
```

#### 2. Parser（構文解析層）
```typescript
// src/botscript/parser/Parser.ts  
export class Parser {
  public parse(): ProgramNode {
    // トークン列をASTに変換
    // 再帰下降パーサーによる構文解析
  }
}
```

#### 3. Interpreter（実行層）
```typescript
// src/botscript/interpreter/Interpreter.ts
export class Interpreter {
  public async execute(ast: ProgramNode): Promise<ExecutionResult> {
    // ASTを走査してボット動作を実行
    // Visitor パターンによるAST処理
  }
}
```

## 🔄 アビリティシステム（Composite Pattern）

### 設計思想
- **単一責任原則**: 各アビリティは特定の機能のみを担当
- **開放閉鎖原則**: 新機能追加時に既存コードを変更しない
- **依存性逆転**: 高レベルモジュールは抽象に依存

### アビリティ階層構造

```typescript
// src/abilities/AbilityManager.ts
export class AbilityManager {
  private abilities: Map<string, IAbility> = new Map();
  
  public getAbility<T extends IAbility>(name: string): T | undefined {
    return this.abilities.get(name) as T;
  }
  
  // 便利なアクセサー
  public get vitals(): VitalsAbility {
    return this.getAbility('vitals') as VitalsAbility;
  }
}

// 各アビリティの実装
export class VitalsAbility implements IAbility {
  public isHealthLow(): boolean {
    return this.bot.mc.health < 6;
  }
  
  public isHungry(): boolean {
    return this.bot.mc.food < 6;
  }
}
```

### アビリティ種類と責務

| アビリティ | 責務 | 主要メソッド |
|-----------|------|-------------|
| **Vitals** | 生命維持・健康管理 | `isHealthLow()`, `isHungry()`, `findSafeSpot()` |
| **Sensing** | 環境認知・感知 | `findNearestEntity()`, `isNight()`, `detectPlayers()` |
| **Inventory** | 所持品管理 | `hasItem()`, `selectBestTool()`, `countItems()` |
| **Say** | コミュニケーション | `say()`, `reportError()`, `reportStatus()` |

## 📦 ディレクトリ構造解説

```
src/
├── index.ts                    # 🚪 アプリケーションエントリーポイント
├── core/                       # 🏛️ コアシステム
│   ├── Bot.ts                 # メインファサード
│   └── CommandHandler.ts      # コマンド処理統括
├── commands/                   # 🎮 チャットコマンド実装
│   ├── ICommand.ts           # コマンドインターフェース
│   ├── GoCommand.ts          # 移動コマンド
│   ├── SayCommand.ts         # 発言コマンド
│   └── BotScriptCommand.ts   # BotScript実行コマンド
├── states/                     # 🔄 状態パターン実装
│   ├── IBotState.ts          # 状態インターフェース
│   ├── IdleState.ts          # 待機状態
│   ├── MovingState.ts        # 移動状態
│   └── AttackingState.ts     # 攻撃状態
├── abilities/                  # 🧩 モジュラーアビリティシステム
│   ├── IAbility.ts           # アビリティ基底インターフェース
│   ├── AbilityManager.ts     # アビリティ統括管理
│   ├── VitalsAbility.ts      # 生命維持システム
│   ├── SensingAbility.ts     # 感知システム
│   ├── InventoryAbility.ts   # 所持品管理システム
│   └── SayAbility.ts         # コミュニケーションシステム
├── botscript/                  # 🤖 自作プログラミング言語
│   ├── lexer/                # 字句解析
│   │   ├── Lexer.ts         # レキサー実装
│   │   └── TokenType.ts     # トークン型定義
│   ├── parser/               # 構文解析
│   │   ├── Parser.ts        # パーサー実装
│   │   └── ASTNode.ts       # AST節点定義
│   └── interpreter/          # 実行エンジン
│       ├── Interpreter.ts   # インタプリタ実装
│       └── ExecutionContext.ts # 実行コンテキスト
└── __mocks__/                  # 🧪 テスト用モック
    └── MinecraftBotMock.ts   # mineflayerモック
```

## ⚡ パフォーマンス最適化戦略

### 1. メモリ効率化
```typescript
// シングルトンパターンによる状態インスタンス共有
export class IdleState implements IBotState {
  private static instance: IdleState;
  
  public static getInstance(): IdleState {
    if (!IdleState.instance) {
      IdleState.instance = new IdleState();
    }
    return IdleState.instance;
  }
}
```

### 2. 計算最適化
```typescript
// Pathfinder設定による移動効率化
bot.mc.pathfinder.setMovements(new Movements(bot.mc));
bot.mc.pathfinder.setGoal(goal);
```

### 3. 非同期処理
```typescript
// Promise.allによる並列実行
await Promise.all([
  this.updateHealthStatus(),
  this.updateInventoryStatus(),
  this.updatePositionStatus()
]);
```

## 🧪 テストアーキテクチャ

### テスト階層

```
テスト種類                 カバレッジ対象                  ファイル数
─────────────────────────────────────────────────────────
Unit Tests              個別クラス・メソッド              ~200テスト
Integration Tests       コンポーネント間連携              ~50テスト  
System Tests           エンドツーエンド動作               ~30テスト
Performance Tests      実行時間・メモリ使用量             ~32テスト
─────────────────────────────────────────────────────────
合計                                                    312テスト
```

### モック戦略
```typescript
// src/__mocks__/MinecraftBotMock.ts
export const createMockBot = (): any => ({
  health: 20,
  food: 20,
  time: { timeOfDay: 6000, day: 1 },
  players: new Map(),
  inventory: { items: () => [] },
  // 150以上の詳細なモック実装
});
```

## 🔄 データフローとライフサイクル

### 1. ボット起動フロー
```
index.ts
  ↓ ボット作成
Bot.constructor()
  ↓ アビリティ初期化
AbilityManager.initialize()
  ↓ 状態設定
Bot.changeState(IdleState)
  ↓ コマンドハンドラー登録
CommandHandler.registerCommands()
  ↓ イベントリスナー設定
Bot.setupEventListeners()
  ↓ 実行ループ開始
Bot.mainLoop()
```

### 2. コマンド実行フロー
```
Minecraftチャット
  ↓ メッセージ受信
CommandHandler.handleMessage()
  ↓ コマンド解析
CommandHandler.parseMessage()
  ↓ コマンド実行
ICommand.execute()
  ↓ 状態変更（必要時）
Bot.changeState()
  ↓ アクション実行
Bot/Ability methods
```

### 3. BotScript実行フロー
```
BotScriptコマンド
  ↓ ソースコード受信
BotScriptCommand.execute()
  ↓ 字句解析
Lexer.tokenize()
  ↓ 構文解析
Parser.parse()
  ↓ コード実行
Interpreter.execute()
  ↓ ボット制御
Bot Actions
```

## 📊 システムメトリクス

### コードベース統計
```
言語: TypeScript
総行数: ~8,000行
ファイル数: ~60ファイル
テスト数: 312テスト
テストカバレッジ: >95%
```

### パフォーマンス指標
```
起動時間: ~2秒
メモリ使用量: ~50MB
コマンド応答時間: <100ms
BotScript実行時間: <50ms
```

## 📝 練習問題

### 🟢 初級問題
**問題**: プロジェクトの主要なアーキテクチャパターンを3つ挙げ、それぞれがどのクラスで実装されているかを説明してください。

<details>
<summary>解答例</summary>

**主要パターン**:
1. **Facade Pattern** - `Bot`クラス
   - 複雑なmineflayer APIを単純化
   - アビリティシステムへの統一アクセス

2. **Command Pattern** - `CommandHandler`と`ICommand`実装
   - チャットコマンドの動的登録・実行
   - コマンドのカプセル化

3. **State Pattern** - `IBotState`実装クラス群
   - ボットの状態に応じた動作変更
   - 状態遷移の管理

**テスト方法**:
```typescript
test('architecture patterns verification', () => {
  // Facade Pattern
  expect(bot).toHaveProperty('goto');
  expect(bot).toHaveProperty('vitals');
  
  // Command Pattern  
  expect(commandHandler.commands.size).toBeGreaterThan(0);
  
  // State Pattern
  expect(bot.getCurrentState()).toBeInstanceOf(IdleState);
});
```
</details>

### 🟡 中級問題
**問題**: BotScriptの実行フローにおいて、エラーがどの段階で発生し、どのように処理されるかを段階別に説明してください。

<details>
<summary>解答例</summary>

**エラー発生段階と処理**:

1. **字句解析段階** (Lexer)
   ```typescript
   // 無効な文字に対するエラー
   throw new Error(`Unexpected character: ${char} at line ${this.line}`);
   ```

2. **構文解析段階** (Parser)
   ```typescript
   // 構文エラーに対するパニックモード回復
   private synchronize(): void {
     // エラー回復処理
   }
   ```

3. **実行段階** (Interpreter)
   ```typescript
   // 実行時エラーのキャッチと詳細レポート
   catch (error) {
     return {
       type: ExecutionResultType.ERROR,
       message: `Execution error: ${error.message}`,
       context: this.context
     };
   }
   ```

**テスト方法**:
```typescript
test('error handling at each stage', async () => {
  // 字句解析エラー
  expect(() => new Lexer('invalid@char').tokenize()).toThrow();
  
  // 構文解析エラー
  expect(() => new Parser([/* 無効なトークン */]).parse()).toThrow();
  
  // 実行時エラー
  const result = await interpreter.execute(invalidAST);
  expect(result.type).toBe(ExecutionResultType.ERROR);
});
```
</details>

### 🔴 上級問題
**問題**: 新しいアビリティ（`CraftingAbility`）を追加する場合の設計を、既存のアーキテクチャパターンに従って実装計画を立ててください。インターフェース設計、依存関係、テスト戦略まで含めて設計してください。

<details>
<summary>解答例</summary>

**CraftingAbility 設計計画**:

```typescript
// 1. インターフェース設計
export interface ICraftingAbility extends IAbility {
  canCraft(itemName: string): boolean;
  craft(itemName: string, quantity?: number): Promise<boolean>;
  getCraftableItems(): string[];
  getRequiredMaterials(itemName: string): ItemRequirement[];
}

// 2. 実装クラス
export class CraftingAbility implements ICraftingAbility {
  constructor(private bot: Bot) {}
  
  public getName(): string {
    return 'crafting';
  }
  
  public async initialize(): Promise<void> {
    // Crafting table detection logic
  }
  
  public canCraft(itemName: string): boolean {
    const recipe = this.getRecipe(itemName);
    return this.hasRequiredMaterials(recipe);
  }
  
  public async craft(itemName: string, quantity = 1): Promise<boolean> {
    if (!this.canCraft(itemName)) {
      throw new Error(`Cannot craft ${itemName}: missing materials`);
    }
    
    // Crafting implementation using mineflayer
    return await this.performCrafting(itemName, quantity);
  }
}

// 3. AbilityManager拡張
export class AbilityManager {
  public get crafting(): CraftingAbility {
    return this.getAbility('crafting') as CraftingAbility;
  }
}

// 4. BotScript統合
// 新しいCRAFTコマンドをBotScriptに追加
case 'CraftCommand':
  await this.executeCraftCommand(statement as CraftCommandNode);
  break;

// 5. テスト戦略
describe('CraftingAbility', () => {
  it('should check material availability', () => {
    // マテリアル確認テスト
  });
  
  it('should perform crafting operation', async () => {
    // クラフト実行テスト
  });
  
  it('should integrate with BotScript', async () => {
    // BotScript統合テスト
  });
});
```

**依存関係図**:
```
CraftingAbility
    ↓ 依存
InventoryAbility (材料確認)
    ↓ 依存  
SensingAbility (Crafting Table検出)
    ↓ 依存
Bot (mineflayer API)
```

**統合ポイント**:
1. `AbilityManager`への登録
2. `BotScript`への`CRAFT`コマンド追加
3. チャットコマンド`CraftCommand`の実装
4. 既存テストスイートへの追加
</details>

## 🏆 自己評価チェックリスト

- [ ] **初級**: プロジェクトの主要アーキテクチャパターンを理解している
- [ ] **中級**: BotScriptシステムの各層の責務とエラーハンドリングを理解している  
- [ ] **上級**: 新機能追加時の設計手法と既存アーキテクチャとの整合性を考慮できる

## 📚 次のステップ

プロジェクト全体アーキテクチャを理解したら、次は**[デザインパターン](./02_design_patterns.md)**で具体的な設計パターンの実装詳細を学び、その後**[アビリティシステム](./08_ability_system.md)**でモジュラー設計の実践を学習しましょう。