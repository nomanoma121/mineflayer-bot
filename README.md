# 汎用 Mineflayer ボット v2.0

TypeScript とデザインパターンを活用した、高度な Minecraft ボットプロジェクトです。

## 🎯 プロジェクトの特徴

このプロジェクトは、単なる Minecraft ボットの実装を超えて、**ソフトウェア設計の原則とデザインパターンの実践的な学習教材**として設計されています。

### 📚 実装されているデザインパターン

#### 1. **ステートパターン (State Pattern)**

- **場所**: `src/states/IBotState.ts`, `src/states/IdleState.ts`
- **目的**: ボットの状態（待機中、移動中、攻撃中など）を独立したクラスとして管理
- **利点**:
  - 状態遷移の複雑さを軽減
  - 新しい状態の追加が容易
  - 状態ごとの処理を分離し、保守性向上

```typescript
// 状態の切り替えが安全かつ明確
bot.changeState(IdleState.getInstance());
```

#### 2. **コマンドパターン (Command Pattern)**

- **場所**: `src/commands/ICommand.ts`, `src/commands/StopCommand.ts`
- **目的**: チャット命令をオブジェクトとしてカプセル化
- **利点**:
  - コマンドの追加・削除が動的に可能
  - コマンドの実行履歴や Undo の実装が容易
  - 複雑なコマンドチェーンの構築が可能

```typescript
// 新しいコマンドの追加が簡単
commandHandler.registerCommand("goto", new GotoCommand());
```

#### 3. **シングルトンパターン (Singleton Pattern)**

- **場所**: `src/states/IdleState.ts`
- **目的**: 同一状態のインスタンスを一意に保つ
- **利点**:
  - メモリ効率の向上
  - 状態の一貫性保証
  - グローバルアクセスポイントの提供

#### 4. **ファサードパターン (Facade Pattern)**

- **場所**: `src/core/Bot.ts`
- **目的**: mineflayer の複雑な API を簡潔なインターフェースで隠蔽
- **利点**:
  - 複雑なライブラリの使用を簡素化
  - 依存関係の局所化
  - API の変更に対する耐性

## 🏗️ アーキテクチャの見どころ

### 1. **責務の分離 (Separation of Concerns)**

各クラスが単一の責務を持つように設計：

- `Bot`: ボットのライフサイクル管理
- `CommandHandler`: コマンドの解析と実行
- `ICommand`: 個別コマンドのロジック
- `IBotState`: 状態固有の動作

### 2. **依存性注入 (Dependency Injection)**

```typescript
// コンストラクタで依存関係を明示
const commandHandler = new CommandHandler(botName);
commandHandler.registerCommand("stop", new StopCommand());
```

### 3. **型安全性の徹底**

TypeScript の型システムを最大限活用：

```typescript
interface BotOptions {
  host: string;
  port: number;
  username: string;
  auth: "offline" | "microsoft";
  version: string;
}
```

## 🔀 他の設計アプローチとの比較

### **現在の設計 vs 手続き型アプローチ**

| 側面             | 現在の設計 (OOP + パターン) | 手続き型アプローチ        |
| ---------------- | --------------------------- | ------------------------- |
| **保守性**       | ✅ 高い（責務分離）         | ❌ 低い（コード分散）     |
| **拡張性**       | ✅ 容易（新クラス追加）     | ❌ 困難（既存コード変更） |
| **テスト容易性** | ✅ 高い（モック化可能）     | ❌ 低い（依存関係複雑）   |
| **学習コスト**   | ⚠️ 高め（パターン理解必要） | ✅ 低い（直感的）         |

### **ファクトリーパターンの検討**

現在は各コマンドを直接インスタンス化していますが、以下のような拡張も可能：

```typescript
class CommandFactory {
  static createCommand(type: string): ICommand {
    switch (type) {
      case "stop":
        return new StopCommand();
      case "goto":
        return new GotoCommand();
      // ...
    }
  }
}
```

### **オブザーバーパターンの可能性**

ボットの状態変化を他のシステムに通知する場合：

```typescript
interface IBotStateObserver {
  onStateChanged(oldState: IBotState, newState: IBotState): void;
}
```

## 🚀 技術スタック

- **言語**: TypeScript
- **ランタイム**: Node.js 18+
- **主要ライブラリ**: mineflayer, mineflayer-pathfinder
- **コンテナ**: Docker & Docker Compose
- **ビルドツール**: TypeScript Compiler

## 📁 プロジェクト構造

```
src/
├── core/           # コアシステム
│   ├── Bot.ts      # ボットのメインクラス
│   └── CommandHandler.ts  # コマンド管理
├── states/         # 状態パターン実装
│   ├── IBotState.ts    # 状態インターフェース
│   └── IdleState.ts    # 待機状態
├── commands/       # コマンドパターン実装
│   ├── ICommand.ts     # コマンドインターフェース
│   └── StopCommand.ts  # 停止コマンド
└── index.ts        # エントリーポイント
```

## 🔧 開発環境セットアップ

### 前提条件

- Node.js 18+
- Docker & Docker Compose
- TypeScript 基本知識

### ローカル開発

```bash
# 依存関係のインストール
npm install

# TypeScriptのビルド
npm run build

# 開発モード（ビルド＋実行）
npm run dev
```

### Docker 環境

```bash
# ボット群を起動
docker-compose up --build

# 特定のボットのみ起動
docker-compose up bot00
```

## 🚀 実装されている機能

### 移動・ナビゲーション機能

| コマンド                | 説明                                 | 使用例                                 |
| ----------------------- | ------------------------------------ | -------------------------------------- |
| `@bot come [player]`    | 指定プレイヤーを追従（省略時は自分） | `@bot come player1` または `@bot come` |
| `@bot stop`             | 現在の移動を停止                     | `@bot stop`                            |
| `@bot goto <x> <y> <z>` | 指定座標へ移動                       | `@bot goto 100 64 -200`                |
| `@bot sethome`          | 現在地を拠点として設定               | `@bot sethome`                         |
| `@bot home`             | 設定した拠点に帰還                   | `@bot home`                            |

### ワールド操作・作業機能

| コマンド                        | 説明                             | 使用例                 |
| ------------------------------- | -------------------------------- | ---------------------- |
| `@bot dig [x] [y] [z]`          | ブロックを掘る                   | `@bot dig 100 64 -200` |
| `@bot place <item> [x] [y] [z]` | ブロックを設置                   | `@bot place stone`     |
| `@bot attack <target>`          | 指定エンティティを攻撃           | `@bot attack zombie`   |
| `@bot kill <player>`            | 指定プレイヤーを倒すまで攻撃     | `@bot kill player1`    |
| `@bot setrespawn`               | 近くのベッドでリスポーン地点設定 | `@bot setrespawn`      |

### インベントリ・アイテム管理機能

| コマンド                            | 説明               | 使用例                       |
| ----------------------------------- | ------------------ | ---------------------------- |
| `@bot inventory`                    | インベントリを表示 | `@bot inventory`             |
| `@bot give <player> <item> [count]` | アイテムを渡す     | `@bot give player1 stone 10` |
| `@bot drop <item> [count]`          | アイテムを捨てる   | `@bot drop stone 5`          |
| `@bot equip <item>`                 | アイテムを装備     | `@bot equip diamond_sword`   |

### パフォーマンス最適化

ボットの移動速度とレスポンシブ性を向上させるために、以下の最適化が実装されています：

- **スプリント有効化**: `allowSprinting = true`でボットが走って移動
- **効率的な追従**: パスファインダーが動作中の場合は新しいゴール設定を避ける
- **ブロック掘削無効化**: 移動時にブロックを掘らず、高速化を優先
- **自由な動き許可**: `allowFreeMotion = true`で柔軟な移動パターンを実現

### 状態管理

| 状態             | 説明     | 遷移条件                        |
| ---------------- | -------- | ------------------------------- |
| `IdleState`      | 待機状態 | コマンド待ち、エラー発生時      |
| `FollowingState` | 追従状態 | `come` コマンド実行時           |
| `MovingState`    | 移動状態 | `goto`, `home` コマンド実行時   |
| `AttackingState` | 攻撃状態 | `attack`, `kill` コマンド実行時 |

## 📋 実装済みコマンド

| コマンド | 使用法                           | 説明                         |
| -------- | -------------------------------- | ---------------------------- |
| stop     | `@bot01 stop` または `@all stop` | 全ての行動を停止し待機状態に |

## 🎮 使用方法

1. Minecraft サーバーを起動
2. `docker-compose.yml`の接続設定を調整
3. `docker-compose up`でボット起動
4. ゲーム内でボットにメンション: `@bot01 stop`

## 🔮 今後の拡張予定

### フェーズ 1: 基本機能

- [ ] プレイヤー追従 (`come` コマンド)
- [ ] 座標移動 (`goto` コマンド)
- [ ] 拠点設定・帰還 (`sethome`, `home` コマンド)

### フェーズ 2: ワールド操作

- [ ] ブロック破壊・設置
- [ ] インベントリ管理
- [ ] 戦闘システム

### フェーズ 3: 高度な機能

- [ ] 複数ボット連携
- [ ] スケジューリング
- [ ] Web 管理インターフェース

## 📖 学習のポイント

### 初学者向け

1. **インターフェース設計**: `IBotState`, `ICommand`の抽象化を理解
2. **責務分離**: 各クラスが持つ単一の責務を確認
3. **型安全性**: TypeScript の型システムによる恩恵を体感

### 中級者向け

1. **デザインパターン**: 実装された 4 つのパターンの使い分け
2. **非同期処理**: Promise/async-await の適切な使用
3. **エラーハンドリング**: 堅牢性を保つための例外処理

### 上級者向け

1. **アーキテクチャ評価**: SOLID 原則の適用度合い
2. **パフォーマンス**: シングルトンパターンによるメモリ効率
3. **拡張性**: 新機能追加時の既存コードへの影響度

## 🤝 貢献ガイド

1. Issue で機能提案・バグ報告
2. Fork して feature ブランチで開発
3. デザインパターンに沿った実装
4. TypeScript の型安全性を維持
5. プルリクエストでレビュー依頼

## 📄 ライセンス

ISC License

---

**このプロジェクトは、実用的な Minecraft ボットであると同時に、オブジェクト指向設計とデザインパターンの生きた教材として設計されています。コードを読み、拡張し、改善することで、ソフトウェア設計の深い理解を得ることができます。**
