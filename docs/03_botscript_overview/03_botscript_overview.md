# BotScript言語システム概要

## 📖 BotScriptとは

BotScriptは、Minecraftボット制御専用に設計された**完全自作のプログラミング言語**です。字句解析から実行まで全て独自実装されており、リアルタイムでMinecraftチャット経由で実行できる革新的な言語システムです。

## 🎯 設計思想

### 1. ドメイン特化言語（DSL）
```botscript
# ボット制御に特化した自然な構文
SAY "Hello World"
MOVE "forward" 10
IF $bot_health < 10 THEN
  SAY "Health is low!"
ENDIF
```

### 2. リアルタイム実行
- Minecraftチャット経由での即座実行
- 複数行スクリプトの動的送信
- インタラクティブなデバッグ環境

### 3. 型安全性
- TypeScriptベースの堅牢な型システム
- コンパイル時エラー検出
- 実行時型チェック

## 🏗️ 言語アーキテクチャ

```
[BotScript Source Code]
        ↓
    [Lexer] ← トークン化
        ↓
    [Parser] ← AST構築
        ↓
   [Interpreter] ← 実行
        ↓
    [Bot Actions]
```

### アーキテクチャの各層

| 層 | 責務 | 主要ファイル |
|---|---|---|
| **Lexer** | 字句解析・トークン化 | `Lexer.ts`, `TokenType.ts` |
| **Parser** | 構文解析・AST生成 | `Parser.ts`, `ASTNode.ts` |
| **Interpreter** | コード実行・Bot制御 | `Interpreter.ts` |
| **Context** | スコープ・変数管理 | `ExecutionContext.ts` |

## 📝 言語仕様

### データ型
```botscript
# 数値
DEF $count = 42
DEF $pi = 3.14159

# 文字列
DEF $message = "Hello Bot"
DEF $multiline = "Line 1" + "\nLine 2"

# 真偽値
DEF $is_ready = TRUE
DEF $is_finished = FALSE
```

### 変数宣言・操作
```botscript
# 変数宣言
DEF $health = 100
DEF $position_x = $bot_x

# 変数更新
SET $health = $health - 10
CALC $position_x = $position_x + 5
```

### 制御構造
```botscript
# 条件分岐
IF $bot_health < 10 THEN
  SAY "Critical health!"
  # ネストした条件
  IF $bot_food > 5 THEN
    SAY "Eating food..."
  ELSE
    SAY "No food available"
  ENDIF
ELSE
  SAY "Health is good"
ENDIF

# ループ
REPEAT 10
  MOVE "forward" 1
  WAIT 0.5
ENDREPEAT

# 変数を使ったループ
DEF $times = 5
REPEAT $times
  DIG "stone"
  WAIT 1
ENDREPEAT
```

### ボットコマンド
```botscript
# 移動
MOVE "forward" 10      # 前進
MOVE "backward" 5      # 後退
MOVE "left" 3         # 左移動
MOVE "right" 2        # 右移動

# 座標移動
GOTO 100 64 200       # 絶対座標
GOTO $start_x $start_y $start_z  # 変数使用

# アクション
ATTACK "zombie"       # エンティティ攻撃
DIG "stone"          # ブロック破壊
PLACE "cobblestone"  # ブロック設置
DROP "dirt" 10       # アイテムドロップ
EQUIP "sword"        # アイテム装備

# コミュニケーション
SAY "Hello players!"
SAY "Health: " + $bot_health

# 待機
WAIT 2.5             # 2.5秒待機
```

### 組み込み変数
```botscript
# ボット状態
$bot_health         # 体力 (0-20)
$bot_food          # 満腹度 (0-20)
$bot_x, $bot_y, $bot_z  # 座標

# 環境情報
$bot_time          # ゲーム内時刻
$bot_weather       # 天候状態
```

## 🔧 技術的特徴

### 1. 完全独立実装
- **外部パーサライブラリ不使用**
- **手書きレキサー・パーサー**
- **カスタムAST設計**

### 2. TypeScript型安全性
```typescript
// AST節点の型定義例
export interface IfStatementNode extends ASTNode {
  type: 'IfStatement';
  condition: ExpressionNode;
  thenBranch: StatementNode[];
  elseBranch?: StatementNode[];
}
```

### 3. エラーハンドリング
```botscript
# 実行時エラーの詳細レポート
# エラー例: 未定義変数参照
SET $undefined_var = 100
# → "Execution error: Undefined variable: undefined_var at line 1"
```

### 4. パフォーマンス最適化
- **シングルトンパターンによるメモリ効率化**
- **遅延評価による高速化**
- **トークンキャッシング**

## 🎮 実際の使用例

### 自動採掘スクリプト
```botscript
DEF $target_count = 50
DEF $collected = 0

SAY "Starting mining operation..."

REPEAT $target_count
  # 石を探して採掘
  DIG "stone"
  SET $collected = $collected + 1
  
  # 進捗報告
  IF $collected % 10 == 0 THEN
    SAY "Collected: " + $collected + "/" + $target_count
  ENDIF
  
  # 体力チェック
  IF $bot_health < 5 THEN
    SAY "Health too low, stopping mining"
    BREAK
  ENDIF
  
  WAIT 1
ENDREPEAT

SAY "Mining complete! Total collected: " + $collected
```

### 巡回警備スクリプト
```botscript
DEF $patrol_points = 4
DEF $base_x = $bot_x
DEF $base_y = $bot_y
DEF $base_z = $bot_z

SAY "Starting patrol routine..."

REPEAT 10  # 10回巡回
  # 北へ移動
  GOTO $base_x ($base_z + 20)
  SAY "Checkpoint North"
  WAIT 2
  
  # 東へ移動
  GOTO ($base_x + 20) ($base_z + 20)
  SAY "Checkpoint East"
  WAIT 2
  
  # 南へ移動
  GOTO ($base_x + 20) $base_z
  SAY "Checkpoint South"
  WAIT 2
  
  # 西へ移動（基地に戻る）
  GOTO $base_x $base_z
  SAY "Returned to base"
  WAIT 5
ENDREPEAT

SAY "Patrol mission complete"
```

## 🚀 なぜ自作言語を作ったのか

### 1. **特化性**
- Minecraftボット制御に最適化された構文
- 直感的で読みやすいコマンド

### 2. **学習価値**
- コンパイラ理論の実践
- 言語設計の深い理解

### 3. **拡張性**
- 新機能の迅速な追加
- ドメイン特有の最適化

### 4. **制御性**
- エラーメッセージのカスタマイズ
- デバッグ機能の完全制御

## 📝 練習問題

理解度を確認するために、以下の練習問題に挑戦してください。実際のBotScriptコードを書いて、テストで動作確認できます。

### 🟢 初級問題
**問題**: 「Hello World」と挨拶し、前に5歩進み、「I moved forward!」と報告するスクリプトを書いてください。

<details>
<summary>解答例</summary>

```botscript
SAY "Hello World"
MOVE "forward" 5
SAY "I moved forward!"
```

**テスト方法**:
```bash
# Minecraftチャットで実行
@bot SAY "Hello World"
@bot MOVE "forward" 5  
@bot SAY "I moved forward!"
```
</details>

### 🟡 中級問題
**問題**: ボットの体力が10以下の場合は「Low health!」、10より上の場合は「Health is good」と報告し、最後に現在の体力値を数値で表示するスクリプトを書いてください。

<details>
<summary>解答例</summary>

```botscript
IF $bot_health <= 10 THEN
  SAY "Low health!"
ELSE
  SAY "Health is good"
ENDIF
SAY "Current health: " + $bot_health
```

**テスト方法**:
```bash
# 体力を低く設定してテスト（モックボット使用）
npm test -- --testNamePattern="health check script"
```
</details>

### 🔴 上級問題
**問題**: 正方形の巡回路（各辺10ブロック）を3回繰り返すスクリプトを書いてください。各角で「Corner X」（Xは角番号1-4）と報告し、全巡回完了後に開始地点に戻って「Patrol complete」と報告してください。

<details>
<summary>解答例</summary>

```botscript
DEF $start_x = $bot_x
DEF $start_y = $bot_y  
DEF $start_z = $bot_z
DEF $lap = 1

REPEAT 3
  SAY "Starting lap " + $lap
  
  # 北へ（角1）
  MOVE "forward" 10
  SAY "Corner 1"
  WAIT 1
  
  # 東へ（角2）
  MOVE "right" 10  
  SAY "Corner 2"
  WAIT 1
  
  # 南へ（角3）
  MOVE "backward" 10
  SAY "Corner 3" 
  WAIT 1
  
  # 西へ（角4、開始地点）
  MOVE "left" 10
  SAY "Corner 4"
  WAIT 1
  
  SET $lap = $lap + 1
ENDREPEAT

GOTO $start_x $start_y $start_z
SAY "Patrol complete"
```

**テスト方法**:
```typescript
// src/botscript/__tests__/練習問題.test.ts で確認
test('正方形巡回スクリプト', async () => {
  const result = await executeScript(/* 上記スクリプト */);
  expect(result.type).toBe(ExecutionResultType.SUCCESS);
  // ボットの最終位置が開始地点に戻っていることを確認
});
```
</details>

## 🏆 自己評価チェックリスト

各問題を解いた後、以下の項目をチェックしてください：

- [ ] **初級**: 基本的なコマンド（SAY, MOVE）を正しく使えた
- [ ] **中級**: 条件分岐（IF-ELSE）と組み込み変数（$bot_health）を活用できた  
- [ ] **上級**: ループ（REPEAT）、変数操作（DEF, SET）、複雑な制御フローを組み合わせられた

## 📚 次のステップ

BotScript言語システムをより深く理解するために、以下の順序で学習を進めることをお勧めします：

1. **[字句解析器](./04_lexer_tokenizer.md)** - トークン化の仕組み
2. **[構文解析器](./05_parser_ast.md)** - AST構築の詳細
3. **[インタプリタエンジン](./06_interpreter_engine.md)** - 実行エンジンの核心
4. **[実行コンテキスト](./07_execution_context.md)** - スコープとメモリ管理

各章では、実際のコード例と詳細な解説、さらに理解度確認のための練習問題を通じて、自作言語開発の実践的な知識を習得できます。