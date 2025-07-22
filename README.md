# Mineflayer Bot with BotScript

MinecraftでスクリプトやコマンドでボットをコントロールできるTypeScript製ボットです。

## 🚀 クイックスタート

### 1. インストール

```bash
git clone https://github.com/nomanoma121/mineflayer-bot.git
cd mineflayer-bot
npm install
```

### 2. ビルド

```bash
npm run build
```

### 3. ボットの起動

```bash
npm start
```

デフォルトでは `localhost:25565` に接続します。

## 📜 BotScript - チャットでボットを操作

BotScriptは、Minecraftのチャット経由でボットに複雡な操作をさせることができるスクリプト言語です。

### 基本的な使い方

#### 単発スクリプト実行
```
@Bot script eval say "Hello World"
```

#### 保存済みスクリプトの実行
```
@Bot script run hello_world
```

#### スクリプトの保存
```
@Bot script save my_script say "Hello"; wait 1; say "World"
```

#### 利用可能なscriptサブコマンド
- `run <name>` - 保存済みスクリプトを実行
- `eval <code>` - BotScriptコードを直接実行
- `save <name> <code>` - スクリプトを保存
- `list` - 保存済みスクリプト一覧を表示
- `help` - BotScript言語のヘルプを表示
- `status` - 現在の実行状況を確認
- `stop` - 実行中のスクリプトを停止

### BotScript言語仕様

#### 基本構文

**変数定義と操作**
```
var name = "Bot"        # 文字列
var count = 10          # 数値
var flag = true         # ブール値
```

**制御構文**
```
if count > 5 {
  say "大きい数です"
} else {
  say "小さい数です"
}

repeat 5 {
  say "繰り返し処理"
}
```

**コメント**
```
# これはコメントです
var x = 100  # 行末コメント
```

#### 利用可能なコマンド

| コマンド | 使用例 | 説明 |
|---------|--------|------|
| `say` | `say "メッセージ"` | チャットでメッセージを送信 |
| `goto` | `goto 100 65 -50` | 指定座標に移動（パスファインディング） |
| `dig` | `dig "stone"` | 指定ブロックタイプを掘る（最適ツール自動選択） |
| `place` | `place "stone" 100 65 50` | 指定座標にブロックを設置 |
| `equip` | `equip "iron_sword"` | アイテムを装備 |
| `drop` | `drop "dirt" 10` | アイテムをドロップ |
| `attack` | `attack "zombie"` | エンティティを攻撃 |
| `wait` | `wait 3` | 指定秒数待機 |

#### システム変数

BotScriptでは、ボットの状態を自動的に取得できるシステム変数が利用可能です：

**生存情報**
- `health` - 体力 (0-20)
- `food` - 空腹度 (0-20) 
- `saturation` - 満腹度
- `oxygen` - 酸素レベル
- `experience_level` - 経験値レベル

**位置・環境情報**
- `x`, `y`, `z` - 現在位置
- `light_level` - 光レベル (0-15)
- `is_night` - 夜かどうか (true/false)
- `is_raining` - 雨が降っているか (true/false)
- `time_of_day` - 現在時刻 (0-23999)

**インベントリ情報**
- `inventory_count` - 使用中のスロット数
- `inventory_slots_total` - 総スロット数
- `inventory_slots_empty` - 空きスロット数
- `equipped_item` - 装備中のアイテム名

**周囲情報**
- `nearby_players` - 近くのプレイヤー数
- `nearby_mobs` - 近くの敵対Mob数
- `nearby_animals` - 近くの動物数

**状態フラグ**
- `is_in_danger` - 危険状態かどうか
- `needs_food` - 食事が必要か
- `health_low` - 体力が低いか
- `hunger_low` - 空腹度が低いか
- `inventory_full` - インベントリが満杯か

## 📋 スクリプトサンプル

`scripts/saved/` フォルダに実用的なスクリプトサンプルが含まれています：

### 基本サンプル
- **hello_world.bs** - BotScript入門用の簡単な挨拶スクリプト
- **example.bs** - 基本的な変数と制御構文のデモ

### 作業系スクリプト
- **mining_simple.bs** - 基本的な採掘スクリプト
- **smart_mining.bs** - 安全性チェック付きスマート採掘
- **smart_building.bs** - インベントリ管理付きスマート建築

### 管理・監視系スクリプト
- **smart_status_monitor.bs** - 包括的なボット状態監視
- **equipment_manager.bs** - 状況に応じた自動装備管理

### パトロール系スクリプト
- **patrol_basic.bs** - 基本的な4方向パトロール
- **adaptive_patrol.bs** - 環境適応型パトロール（夜間・雨天対応）

詳細な使用例とBotScript言語仕様は [`scripts/examples.md`](./scripts/examples.md) をご覧ください。

### サンプルファイルの場所
- **BotScript言語ガイド**: [`scripts/examples.md`](./scripts/examples.md)
- **実行可能なスクリプト**: [`scripts/saved/`](./scripts/saved/) フォルダ

### スクリプトの実行方法

1. **保存済みスクリプトの実行**
   ```
   @Bot script run hello_world
   ```

2. **インラインスクリプトの実行**
   ```
   @Bot script eval say "現在体力: " + health + "/20"
   ```

3. **複数行スクリプト（セミコロン区切り）**
   ```
   @Bot script eval if health_low { say "体力が低下しています！" }; if needs_food { say "食事が必要です" }
   ```

4. **スクリプトを保存して実行**
   ```
   @Bot script save health_check if health_low { say "体力低下！" }; if needs_food { say "食事必要！" }
   @Bot script run health_check
   ```
```

## 🎮 チャットコマンド

ボットは多様なチャットコマンドに対応しています。コマンド形式は `@Bot <command> [args]` です。

### BotScript関連
| コマンド | 説明 | 使用例 |
|---------|------|--------|
| `script run <name>` | 保存済みスクリプト実行 | `@Bot script run hello_world` |
| `script eval <code>` | スクリプト直接実行 | `@Bot script eval say "Hello"` |
| `script save <name> <code>` | スクリプト保存 | `@Bot script save test say "Test"` |
| `script list` | 保存済みスクリプト一覧 | `@Bot script list` |
| `script help` | BotScript言語ヘルプ | `@Bot script help` |
| `script status` | 実行状況確認 | `@Bot script status` |
| `script stop` | 実行中止 | `@Bot script stop` |

### 移動・ナビゲーション
| コマンド | 説明 | 使用例 |
|---------|------|--------|
| `come` | プレイヤーのもとに移動 | `@Bot come` |
| `goto <x> <y> <z>` | 指定座標に移動 | `@Bot goto 100 64 200` |

### ワールド操作・作業
| コマンド | 説明 | 使用例 |
|---------|------|--------|
| `dig [x y z]` | ブロックを掘る | `@Bot dig 100 64 200` |
| `place <item> [x y z]` | ブロックを設置 | `@Bot place stone 100 65 200` |
| `kill <entity>` | エンティティを攻撃 | `@Bot kill zombie` |
| `setrespawn` | リスポーン地点設定 | `@Bot setrespawn` |

### インベントリ・アイテム管理
| コマンド | 説明 | 使用例 |
|---------|------|--------|
| `inventory` | インベントリ状況表示 | `@Bot inventory` |
| `give <player> <item> [count]` | アイテムを渡す | `@Bot give Steve bread 5` |
| `drop <item> [count]` | アイテムをドロップ | `@Bot drop dirt 10` |
| `equip <item>` | アイテムを装備 | `@Bot equip iron_sword` |

### その他
| コマンド | 説明 | 使用例 |
|---------|------|--------|
| `stop` | 現在の動作を停止 | `@Bot stop` |
| `servant` | サーバント（従者）モード | `@Bot servant` |
| `abilitytest <type>` | Ability機能テスト | `@Bot abilitytest vitals` |


## 🎮 通常のボットコマンド

BotScript以外にも、従来のコマンドも利用できます：

```
@Bot idle                # 待機状態
@Bot goto 100 65 -50     # 座標移動
@Bot attack zombie       # エンティティ攻撃
@Bot come                # プレイヤーの元に来る
@Bot wander 30           # 30ブロック範囲で放浪
@Bot miner 0 60 0 10 70 10  # 範囲採掘
@Bot inventory           # インベントリ表示
```

## 🛠️ 開発・テスト

### 開発モード
```bash
npm run dev              # ビルド + 実行
```

### テスト実行
```bash
npm test                 # 全テスト実行
npm run test:watch       # テスト監視モード
npm run test:coverage    # カバレッジ付きテスト
```

### CLI使用
```bash
npm run cli              # CLIツール起動
npm run bot:start        # CLI経由でボット起動
npm run bot:config       # 設定表示
```

## ⚙️ 設定

### 環境変数（.envファイル）

```env
MC_HOST=localhost
MC_PORT=25565
MC_USERNAME=Bot
MC_VERSION=1.20.1
MC_AUTH=offline
```

### 設定例

```typescript
// デフォルト設定（src/index.ts）
const options = {
  host: process.env.MC_HOST || 'localhost',
  port: parseInt(process.env.MC_PORT || '25565'),
  username: process.env.MC_USERNAME || 'Bot',
  version: process.env.MC_VERSION || '1.20.1',
  auth: process.env.MC_AUTH || 'offline'
};
```

## 📝 BotScriptスクリプト例

### 自動建築
```
@Bot script eval var x = 0; repeat 5 { var z = 0; repeat 5 { place "stone" (x + 100) 64 (z + 200); z = z + 1 }; x = x + 1 }; say "建築完了！"
```

### 条件分岐での行動
```
@Bot script eval if health < 10 { say "体力が低いです！体力: " + health } else { say "体力は十分です: " + health + "/20" }
```

### ループでの採掘
```
@Bot script eval var count = 0; repeat 10 { dig "stone"; count = count + 1; say "採掘進捗: " + count + "/10"; wait 2 }; say "採掘完了！"
```

## 🐛 トラブルシューティング

### よくある問題

