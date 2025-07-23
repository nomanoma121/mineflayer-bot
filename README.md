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

BotScriptは、Minecraftのチャット経由でボットに複雑な操作をさせることができるスクリプト言語です。

### 基本的な使い方

#### スクリプト管理コマンド
```
@bot script run <name>         # 保存済みスクリプトを実行
@bot script eval <code>        # インラインコードを実行
@bot script save <name> <code> # スクリプトを保存
@bot script list              # 保存済みスクリプト一覧
@bot script help              # ヘルプを表示
@bot script status            # 実行状態を確認
@bot script stop              # 実行中のスクリプトを停止
```

### BotScript言語仕様（推奨：小文字形式）

#### 基本構文

**変数宣言と代入**
```
var name = "Bot"           # 変数宣言
var count = 10             # 数値
var flag = true            # 真偽値
set count = count + 1      # 変数代入
```

**制御構造**
```
if count > 5 {
  say "大きい数です"
} else {
  say "小さい数です"
}

repeat 5 {
  say "繰り返し処理 " + _loop_index
  wait 1
}
```

#### データ型

- **数値**: `10`, `3.14`, `-5`
- **文字列**: `"こんにちは"`, `""`
- **真偽値**: `true`, `false`

#### 演算子

**算術演算子**
```
var result = 10 + 5    # 加算
var result = 10 - 5    # 減算
var result = 10 * 5    # 乗算
var result = 10 / 5    # 除算
```

**比較演算子**
```
if x == 10 { ... }     # 等しい
if x != 10 { ... }     # 等しくない
if x < 10 { ... }      # 小さい
if x > 10 { ... }      # 大きい
if x <= 10 { ... }     # 以下
if x >= 10 { ... }     # 以上
```

**論理演算子**
```
if x > 5 AND x < 15 { ... }  # 論理積
if x < 5 OR x > 15 { ... }   # 論理和
if NOT flag { ... }          # 論理否定
```

#### 利用可能なコマンド

| コマンド | 使用例 | 説明 |
|---------|--------|------|
| `say` | `say "メッセージ"` | チャットでメッセージを送信 |
| `goto` | `goto 100 64 200` | 指定座標に移動 |
| `attack` | `attack "zombie"` | 指定エンティティを攻撃 |
| `dig` | `dig "stone"` | ブロックを掘削 |
| `place` | `place "stone" 10 64 20` | 指定座標にブロックを設置 |
| `equip` | `equip "diamond_sword"` | アイテムを装備 |
| `drop` | `drop "dirt" 10` | アイテムをドロップ |
| `wait` | `wait 5` | 指定秒数待機 |

#### 組み込み変数

**システム変数（読み取り専用）**
```
bot_name                 # ボット名
version                  # バージョン
pi                       # 円周率
timestamp                # 現在のタイムスタンプ
```

**動的システム変数（実行時更新）**
```
bot_health               # ボットの体力
bot_food                 # ボットの満腹度
bot_x, bot_y, bot_z      # ボットの現在座標
bot_inventory_count      # インベントリのアイテム数
```

**ループ変数**
```
_loop_index              # REPEATループ内の現在のインデックス（0から開始）
```

#### スクリプトファイル
BotScriptは`.bs`ファイル形式で保存・実行できます：

```bash
# scripts/saved/フォルダに.bsファイルを配置
echo 'say "Hello from file!"
wait 1
say "BotScript実行中"' > scripts/saved/my_script.bs

# ゲーム内で実行
@bot script run my_script
```

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
MINECRAFT_HOST=localhost
MINECRAFT_PORT=25565
BOT_USERNAME=Bot
MINECRAFT_VERSION=1.20.1
BOT_AUTH=offline
```

### 設定例

```typescript
// デフォルト設定（src/index.ts）
const options = {
  host: process.env.MINECRAFT_HOST || 'localhost',
  port: parseInt(process.env.MINECRAFT_PORT || '25565'),
  username: process.env.BOT_USERNAME || 'Bot',
  version: process.env.MINECRAFT_VERSION || '1.20.1',
  auth: process.env.BOT_AUTH || 'offline'
};
```

## 📝 スクリプト例

### 基本的な挨拶スクリプト
```
say "こんにちは！"
wait 1
say "私はBotScriptで動いています"

var count = 0
repeat 3 {
  set count = count + 1
  say "カウント: " + count
  wait 1
}

say "終了します"
```

### 条件分岐での体力管理
```
var health = bot_health

if health < 10 {
  say "危険！体力が少ないです"
  equip "apple"
} else {
  if health < 15 {
    say "体力がやや少ないです"
  } else {
    say "体力は十分です"
  }
}
```

### ループでの座標移動
```
say "パトロール開始"

repeat 4 {
  say "ポイント " + (_loop_index + 1) + " に移動中"
  goto (100 + _loop_index * 10) 64 200
  wait 2
  say "到着しました"
}

say "パトロール完了"
```

### 変数と演算の活用
```
var base_x = 100
var base_y = 64
var base_z = 200

var distance = 10
repeat 5 {
  var new_x = base_x + distance * _loop_index
  say "座標 " + new_x + " に移動します"
  goto new_x base_y base_z
  wait 1
}
```

## 🐛 トラブルシューティング

### よくある問題

