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

**コメント**
```
# これは単行コメントです
var name = "Bot"    # 行末コメントも可能
# 複数行のコメントは
# このように書けます
```

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
  say "大きい数です"       # 条件が真の場合
} else {
  say "小さい数です"       # 条件が偽の場合
}

repeat 5 {
  say "繰り返し処理 " + _loop_index  # ループ処理
  wait 1                              # 1秒待機
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

#### 組み込み変数（全て読み取り専用）

**基本情報**
```bash
bot_name                 # ボット名 ("BotScript")
version                  # BotScriptバージョン ("1.0.0")
pi                       # 円周率 (3.14159...)
timestamp                # 現在のタイムスタンプ（実行時更新）
```

**ボット状態**
```bash
bot_health               # 体力値 (0-20)
bot_food                 # 満腹度 (0-20)
bot_experience           # 経験値レベル
bot_air                  # 酸素値（水中時）
bot_inventory_count      # インベントリのアイテム数
```

**位置・方向**
```bash
bot_x, bot_y, bot_z      # ボットの現在座標
bot_yaw                  # 水平方向の向き（度、-180～180）
bot_pitch                # 垂直方向の向き（度、-90～90）
```

**環境情報**
```bash
time_of_day              # ゲーム内時刻 (0-24000)
is_day                   # 昼間かどうか (true/false)
is_night                 # 夜間かどうか (true/false)  
weather                  # 天気 ("clear", "rain", "thunder")
dimension                # 現在のディメンション ("overworld", "nether", "end")
```

**ステータス・能力系**
```bash
bot_saturation           # 隠し満腹度（自然回復に影響）
bot_oxygen_time          # 水中での残り酸素時間（秒）
bot_fall_distance        # 現在の落下距離
bot_speed_modifier       # 移動速度倍率（ポーション効果等）
bot_jump_boost           # ジャンプ力ボーナス
active_effects           # 現在のポーション効果一覧
```

**装備情報**
```bash
equipped_helmet          # 装備中のヘルメット ("none"または装備名)
equipped_chestplate      # 装備中のチェストプレート
equipped_leggings        # 装備中のレギンス
equipped_boots           # 装備中のブーツ
equipped_mainhand        # メインハンドのアイテム
equipped_offhand         # オフハンドのアイテム
armor_points             # 現在の防具ポイント合計
```

**インベントリ詳細系**
```bash
hotbar_selected_slot     # 現在選択中のホットバースロット（0-8）
inventory_free_slots     # 空きスロット数
has_food                 # 食べ物を持っているか
has_weapon               # 武器を持っているか
has_tool                 # ツール類を持っているか
strongest_weapon         # 最も強力な武器名
best_tool_for            # 特定ブロック用の最適ツール
```

**ワールド・ブロック情報系**
```bash
block_at_feet            # 足元のブロック
block_looking_at         # 見ているブロック
block_above_head         # 頭上のブロック
can_see_sky              # 空が見えるか
spawn_point_x/y/z        # スポーン地点座標
bed_location_x/y/z       # ベッドの位置
```

**戦闘・PvP系**
```bash
nearest_hostile_mob      # 最も近い敵対Mob名
nearest_mob_distance     # 最も近いMobまでの距離
is_being_attacked        # 攻撃されているか
last_damage_source       # 最後に受けたダメージ源
can_attack_target        # 攻撃可能な範囲にターゲットがいるか
```

**建築・クラフト系**  
```bash
can_craft                # 特定アイテムをクラフト可能か
crafting_table_nearby    # 近くにクラフトテーブルがあるか
furnace_nearby           # 近くにかまどがあるか
chest_nearby             # 近くにチェストがあるか
can_place_block          # 指定座標にブロックを設置可能か
```

**移動・ナビゲーション系**
```bash
is_on_ground             # 地面に立っているか
is_in_water              # 水中にいるか
is_in_lava               # 溶岩中にいるか
is_climbing              # 梯子等を登っているか
path_blocked             # 進路が塞がれているか
distance_to_spawn        # スポーン地点までの距離
can_reach_position       # 指定座標に到達可能か
```

**サーバー・接続系**
```bash
server_tps               # サーバーのTPS（パフォーマンス）
ping_ms                  # サーバーへのPing値
player_count             # サーバーの総プレイヤー数
server_difficulty        # サーバー難易度
game_mode                # ゲームモード
```

**時間・イベント系**
```bash
days_played              # プレイ日数
time_until_dawn          # 夜明けまでの時間（秒）
time_until_dusk          # 日暮れまでの時間（秒）
moon_phase               # 月の満ち欠け（0-7）
is_full_moon             # 満月かどうか
```

**AI・学習系**
```bash
death_count              # 死亡回数
blocks_mined_today       # 今日掘ったブロック数
distance_walked          # 歩いた距離の累計
items_crafted_count      # クラフトしたアイテム数
mobs_killed_count        # 倒したMob数
```

**コミュニケーション系**
```bash
last_chat_message        # 最後に受信したチャットメッセージ
last_chat_sender         # 最後にチャットした人
whisper_target           # ささやき対象のプレイヤー
```

**周辺・環境情報**
```bash
nearby_players_count     # 16ブロック以内のプレイヤー数
nearby_mobs_count        # 16ブロック以内のMob数
light_level              # 現在地の光レベル (0-15)
biome                    # 現在のバイオーム ("plains", "forest", "desert"等)
```

**ループ変数**
```bash
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

