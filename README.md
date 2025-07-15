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

### BotScript機能の有効化

1. まずボットを起動
2. チャットで以下のコマンドを実行：

```
@Bot botscript enable
```

### 基本的な使い方

#### 単発コマンド実行
```
!script SAY "Hello World"
```

#### 複数行スクリプト
```
!mscript
DEF $count = 1
REPEAT 3
  SAY "カウント: $count"
  DEF $count = $count + 1
ENDREPEAT
!end
```

### BotScript言語仕様

#### 基本構文

**変数定義と操作**
```
DEF $name = "Bot"        # 文字列
DEF $count = 10          # 数値
DEF $flag = true         # ブール値
```

**制御構文**
```
IF $count > 5 THEN
  SAY "大きい数です"
ELSE
  SAY "小さい数です"
ENDIF

REPEAT 5
  SAY "繰り返し処理"
ENDREPEAT
```

**コメント**
```
# これはコメントです
DEF $x = 100  # 行末コメント
```

#### 利用可能なコマンド

| コマンド | 使用例 | 説明 |
|---------|--------|------|
| `SAY` | `SAY "メッセージ"` | チャットでメッセージを送信 |
| `MOVE` | `MOVE 10 64 20` | 指定座標に移動 |
| `GOTO` | `GOTO 100 65 -50` | 指定座標に移動（パスファインディング） |
| `ATTACK` | `ATTACK "zombie"` | 指定エンティティを攻撃 |
| `DIG` | `DIG 10 64 20` | 指定座標のブロックを破壊 |
| `PLACE` | `PLACE "stone" 10 64 20` | 指定座標にブロックを設置 |
| `EQUIP` | `EQUIP "diamond_sword"` | アイテムを装備 |
| `DROP` | `DROP "dirt" 10` | アイテムをドロップ |
| `WAIT` | `WAIT 3000` | 指定ミリ秒待機 |

#### システム変数（読み取り専用）

```
bot_x, bot_y, bot_z      # ボットの現在位置
bot_health               # ボットの体力
bot_food                 # ボットの満腹度
bot_inventory_count      # インベントリのアイテム数
timestamp                # 現在のタイムスタンプ
```

### チャットコマンド

#### BotScript管理
```
@Bot botscript enable    # BotScript機能を有効化
@Bot botscript disable   # BotScript機能を無効化
@Bot botscript status    # 現在の状態を確認
@Bot botscript help      # ヘルプを表示
```

#### スクリプト実行
```
!script <コード>         # 単発実行
!mscript                 # 複数行スクリプト開始
!end                     # 複数行スクリプト終了・実行
!stop                    # 実行中のスクリプトを停止
!status                  # 実行状態を確認
```

#### 変数・セッション管理
```
!list                    # 現在の変数一覧を表示
!clear                   # 全変数をクリア
!save <名前>             # スクリプトを保存
!load <名前>             # 保存済みスクリプトを読み込み
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

### 自動建築
```
!mscript
# 5x5の石の床を作る
DEF $x = 0
REPEAT 5
  DEF $z = 0
  REPEAT 5
    PLACE "stone" $x 64 $z
    DEF $z = $z + 1
  ENDREPEAT
  DEF $x = $x + 1
ENDREPEAT
SAY "建築完了！"
!end
```

### 条件分岐での行動
```
!mscript
IF bot_health < 10 THEN
  SAY "体力が低いです！"
  EQUIP "food"
ELSE
  SAY "体力は十分です"
  GOTO 100 65 100
ENDIF
!end
```

### ループでの採掘
```
!mscript
DEF $y = 64
REPEAT 10
  DIG 100 $y -50
  WAIT 1000
  DEF $y = $y - 1
ENDREPEAT
SAY "採掘完了！"
!end
```

## 🐛 トラブルシューティング

### よくある問題

