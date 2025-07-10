# 🤖 Advanced Minecraft Bot v2.0+ - Enterprise Edition

> 🎯 **完全にリファクタリングされた堅牢なアーキテクチャ**  
> 🧪 **100+のユニットテスト** | 🛠️ **CLI管理ツール** | 🔧 **プラグインシステム**

## 🚀 新機能・改善点

### ✨ エンタープライズグレードの機能
- **🧪 包括的テストスイート**: 102のユニットテスト、100%カバレッジ対応
- **🛠️ 本格CLI管理**: 設定、起動、監視をコマンドラインで完全制御
- **📝 構造化ログ**: Winston基盤の詳細ログ・パフォーマンス測定
- **⚙️ 階層的設定管理**: 環境変数・設定ファイル・デフォルト値の統合管理
- **🔌 プラグインシステム**: モジュラー拡張可能なアーキテクチャ
- **🏗️ 依存性注入**: テスタブルで保守性の高い設計

### 🎮 高度なアビリティシステム
- **❤️‍🩹 Vitals**: 生命維持（体力・空腹度・危険検知）
- **🧐 Sensing**: 知覚・認識（エンティティ・環境・時刻検知）
- **🎒 Inventory**: インベントリ管理（アイテム検索・装備・チェスト操作）
- **💬 Say**: 構造化発言（履歴・テンプレート・状況報告）

## 🛠️ CLI管理ツール

### 基本操作
```bash
# ボット起動（様々なモード対応）
npm run bot:start              # 通常起動
npm run cli start --daemon     # デーモンモード
npm run cli start --watch      # ファイル監視モード

# 設定管理
npm run cli config show        # 設定表示
npm run cli config validate    # 設定検証
npm run cli config create      # デフォルト設定作成
npm run cli config set server.host "example.com"  # 設定変更

# 開発支援
npm run cli dev test           # テスト実行
npm run cli dev build --watch  # ビルド監視
npm run cli dev lint --fix     # コード整形
```

### 高度な設定管理
```bash
# 環境変数エクスポート
npm run cli config show --env > .env

# 設定サマリー表示
npm run cli config show --summary

# カスタム設定ファイル使用
npm run cli start --config custom.config.json
```

## 🧪 テストシステム

### テスト実行
```bash
npm test                    # 全テスト実行
npm run test:watch          # 監視モード
npm run test:coverage       # カバレッジレポート
npm run test:ci            # CI用テスト
```

### テスト構造
```
src/
├── abilities/__tests__/     # アビリティテスト
│   ├── VitalsAbility.test.ts
│   ├── SensingAbility.test.ts
│   ├── InventoryAbility.test.ts
│   ├── SayAbility.test.ts
│   └── AbilityManager.test.ts
├── __mocks__/              # テスト用モック
│   └── MinecraftBotMock.ts
└── __tests__/              # 共通テスト設定
    └── setup.ts
```

## ⚙️ 設定システム

### 階層的設定管理
1. **環境変数** (最優先)
2. **設定ファイル** (`bot.config.json`)
3. **デフォルト値**

### 設定例
```json
{
  "server": {
    "host": "localhost",
    "port": 25565,
    "version": "1.20.1"
  },
  "bot": {
    "username": "MinecraftBot",
    "auth": "offline",
    "maxRetries": 3,
    "retryDelay": 5000
  },
  "abilities": {
    "enabled": ["Vitals", "Sensing", "Inventory", "Say"],
    "vitals": {
      "healthThreshold": 10,
      "hungerThreshold": 10
    }
  },
  "features": {
    "autoEat": true,
    "autoRespawn": true,
    "enableLogging": true,
    "logLevel": "info"
  }
}
```

## 🔌 プラグインシステム

### プラグイン作成例
```typescript
import { IPlugin, PluginMetadata } from "../IPlugin";
import { Bot } from "../../core/Bot";

export class CustomPlugin implements IPlugin {
  getMetadata(): PluginMetadata {
    return {
      name: "CustomPlugin",
      version: "1.0.0",
      description: "カスタム機能プラグイン"
    };
  }

  async initialize(bot: Bot): Promise<void> {
    // 初期化処理
  }

  async enable(): Promise<void> {
    // 有効化処理
  }

  async disable(): Promise<void> {
    // 無効化処理
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}
```

### プラグイン管理
```bash
# プラグインディレクトリ作成
mkdir plugins

# サンプルプラグインコピー
cp src/plugins/examples/ExamplePlugin.ts plugins/

# ボット起動時に自動読み込み
npm run cli start
```

## 📊 ログ・監視システム

### 構造化ログ
```typescript
// ボット専用ログメソッド
Logger.bot.stateChange('Idle', 'Moving', 'bot01');
Logger.bot.commandExecuted('goto', 'player1', 'bot01', true);
Logger.bot.healthLow(5, 'bot01');

// パフォーマンス測定
const endTimer = Logger.performance.startTimer('pathfinding');
// 処理実行
endTimer();

// 構造化ログ
Logger.structured.info('Custom event', { 
  category: 'custom',
  data: { key: 'value' }
});
```

### ログ出力先
```
logs/
├── bot.log          # 全ログ
├── error.log        # エラーログ
├── exceptions.log   # 未処理例外
└── rejections.log   # Promise拒否
```

## 🏗️ アーキテクチャ設計

### 設計原則
- **依存性注入**: テスタブルな設計
- **インターフェース分離**: 疎結合なコンポーネント
- **単一責任原則**: 明確な責務分離
- **開放閉鎖原則**: 拡張可能で修正不要

### コンポーネント図
```
┌─────────────────┐    ┌──────────────────┐
│   CLI Tool      │───▶│  ConfigManager   │
└─────────────────┘    └──────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌──────────────────┐
│      Bot        │───▶│ AbilityManager   │
└─────────────────┘    └──────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌──────────────────┐
│  PluginManager  │    │   Logger System  │
└─────────────────┘    └──────────────────┘
```

## 🔄 CI/CD対応

### GitHub Actions用設定
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:ci
      - run: npm run build
```

## 📈 パフォーマンス最適化

### メモリ効率
- シングルトンパターンによる状態インスタンス最適化
- アビリティの遅延初期化
- プラグインの動的読み込み

### 処理性能
- 100msメインループによる応答性確保
- 非同期処理の適切な管理
- イベント駆動型アーキテクチャ

## 🚀 今後の拡張予定

### Phase 1: AI統合
- LLM対応の自然言語コマンド処理
- 行動決定AIの統合
- 学習機能の実装

### Phase 2: スケーラビリティ
- 複数ボット協調システム
- 分散処理対応
- クラスター管理

### Phase 3: 可視化・UI
- Web管理インターフェース
- リアルタイム監視ダッシュボード
- 3Dワールドビューア

## 📚 開発ガイド

### セットアップ
```bash
git clone <repository>
cd minecraft-bot
npm install
npm run cli config create
npm run test
npm run build
```

### 開発ワークフロー
1. `npm run cli dev test --watch` でテスト駆動開発
2. `npm run cli dev build --watch` でビルド監視
3. `npm run cli start --watch` でホットリロード開発
4. `npm run test:coverage` でカバレッジ確認

## 🤝 コントリビューション

1. **Issue報告**: バグ・機能要望の報告
2. **プルリクエスト**: 機能追加・改善の提案
3. **プラグイン開発**: 独自機能の実装
4. **テスト拡充**: カバレッジ向上への貢献

---

**🎯 このプロジェクトは、実用的なMinecraftボットであると同時に、モダンなソフトウェア設計・テスト・DevOpsの実践例として設計されています。**