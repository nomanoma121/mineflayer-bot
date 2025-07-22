# BotScript Examples

## 利用可能なコマンド

### 基本コマンド
- `say "message"` - チャットでメッセージを送信
- `goto x y z` - 指定座標に移動
- `wait seconds` - 指定秒数待機

### アクションコマンド
- `dig "blocktype"` - 指定ブロックタイプを掘る（最適ツール自動選択）
- `dig` - 見ているブロックを掘る
- `place "item" x y z` - 指定座標にアイテムを設置
- `place "item"` - 見ている場所にアイテムを設置
- `equip "item"` - アイテムを装備
- `drop "item" count` - アイテムをドロップ
- `attack "entity"` - エンティティを攻撃

### システム変数
プログラム内で利用可能な自動更新される変数：

#### 生存情報
- `health` - 体力 (0-20)
- `food` - 空腹度 (0-20)
- `saturation` - 満腹度
- `oxygen` - 酸素レベル
- `experience_level` - 経験値レベル
- `experience_points` - 経験値ポイント

#### 位置・環境情報
- `x`, `y`, `z` - 現在位置
- `light_level` - 光レベル (0-15)
- `is_night` - 夜かどうか (true/false)
- `is_raining` - 雨が降っているか (true/false)
- `time_of_day` - 現在時刻 (0-23999)

#### インベントリ情報
- `inventory_count` - 使用中のスロット数
- `inventory_slots_total` - 総スロット数
- `inventory_slots_empty` - 空きスロット数
- `equipped_item` - 装備中のアイテム名

#### 周囲情報
- `nearby_players` - 近くのプレイヤー数
- `nearby_mobs` - 近くの敵対Mob数
- `nearby_animals` - 近くの動物数

#### 状態フラグ
- `is_in_danger` - 危険状態かどうか
- `needs_food` - 食事が必要か
- `health_low` - 体力が低いか
- `hunger_low` - 空腹度が低いか
- `inventory_full` - インベントリが満杯か

## 基本的な例

### 1. Hello World
```botscript
say "こんにちは世界！"
say "現在位置: (" + x + ", " + y + ", " + z + ")"
say "体力: " + health + "/20"
```

### 2. 変数と条件分岐
```botscript
var count = 0

if health_low {
  say "警告: 体力が低下しています！"
}

if needs_food {
  say "お腹が空いています"
}

if is_night {
  say "夜になりました。危険です！"
} else {
  say "昼間です。安全に作業できます"
}
```

### 3. 繰り返し処理
```botscript
say "カウントダウンを開始します"

repeat 5 {
  var remaining = 6 - _loop_index
  say "残り " + remaining + " 秒"
  wait 1
}

say "カウントダウン完了！"
```

## 実用的な例

### 1. 体力監視スクリプト
```botscript
say "体力監視を開始します"

repeat 20 {
  say "体力: " + health + "/20, 空腹度: " + food + "/20"
  
  if health_low {
    say "警告: 体力が危険レベルです！"
  }
  
  if needs_food {
    say "食事が必要です"
  }
  
  if is_in_danger {
    say "緊急事態！安全な場所に避難してください"
  }
  
  wait 3
}
```

### 2. 環境監視スクリプト
```botscript
say "環境監視を開始します"

repeat 10 {
  say "=== 環境レポート ==="
  say "時刻: " + time_of_day + " " + (is_night ? "(夜)" : "(昼)")
  say "天候: " + (is_raining ? "雨" : "晴れ")
  say "光レベル: " + light_level + "/15"
  say "周囲のプレイヤー: " + nearby_players + "人"
  say "周囲の敵対Mob: " + nearby_mobs + "体"
  say "周囲の動物: " + nearby_animals + "匹"
  
  wait 5
}
```

### 3. スマート採掘スクリプト
```botscript
say "スマート採掘を開始します"

var blocks_mined = 0
var target_blocks = 20

repeat target_blocks {
  if inventory_full {
    say "インベントリが満杯です。採掘を中断します"
    break
  }
  
  dig "stone"
  blocks_mined = blocks_mined + 1
  
  if blocks_mined % 5 = 0 {
    say "進捗: " + blocks_mined + "/" + target_blocks + " ブロック"
    say "インベントリ: " + inventory_count + "/" + inventory_slots_total
  }
  
  wait 1
}

say "採掘完了！" + blocks_mined + "ブロック採掘しました"
```

### 4. 建築スクリプト
```botscript
say "建築を開始します"

var start_x = x
var start_y = y
var start_z = z

repeat 5 {
  var build_x = start_x + _loop_index
  
  goto build_x start_y start_z
  place "stone" build_x start_y start_z
  
  say "ブロック " + (_loop_index + 1) + "/5 設置完了"
  wait 2
}

say "建築完了！"
```

### 5. 条件付き戦闘スクリプト
```botscript
say "戦闘態勢に入ります"

repeat 10 {
  if health_low {
    say "体力が低いため戦闘を中断します"
    break
  }
  
  if nearby_mobs > 0 {
    say "敵を発見！攻撃開始"
    attack "zombie"
    wait 1
  } else {
    say "周囲に敵はいません"
  }
  
  wait 2
}

say "戦闘終了"
```

### 6. インベントリ管理スクリプト
```botscript
say "インベントリ管理を開始します"

say "=== インベントリ状況 ==="
say "使用スロット: " + inventory_count + "/" + inventory_slots_total
say "空きスロット: " + inventory_slots_empty
say "装備中: " + equipped_item

if inventory_full {
  say "インベントリが満杯です！"
  say "不要なアイテムを整理してください"
} else {
  say "インベントリに余裕があります"
}

# 装備の変更例
equip "diamond_sword"
say "ダイヤモンドソードを装備しました"
wait 1

equip "iron_pickaxe"
say "鉄のピッケルに変更しました"
```
