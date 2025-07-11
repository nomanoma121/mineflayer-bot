# 実行コンテキスト - スコープとメモリ管理

## 📖 実行コンテキストとは

実行コンテキスト（Execution Context）は、**プログラム実行時の変数スコープ、変数の値、実行統計情報を管理するコンポーネント**です。これは自作言語において、変数のライフサイクルや可視性を制御し、メモリ効率的な実行環境を提供します。

```
実行コンテキスト = スコープスタック + 変数管理 + 統計情報
```

## 🏗️ スコープ管理システム

### スコープの概念

スコープ（Scope）は**変数が有効な範囲**を定義します。BotScriptでは階層的なスコープシステムを採用：

```botscript
DEF $global_var = "global"      # グローバルスコープ

REPEAT 3                        # ← 新しいスコープ開始
  DEF $loop_var = "loop"        # ループスコープ
  
  IF TRUE THEN                  # ← さらに新しいスコープ
    DEF $if_var = "if"          # IF文スコープ
    SAY $global_var             # ✓ アクセス可能
    SAY $loop_var               # ✓ アクセス可能
    SAY $if_var                 # ✓ アクセス可能
  ENDIF                         # ← IFスコープ終了
  
  # SAY $if_var                 # ✗ アクセス不可（スコープ外）
ENDREPEAT                       # ← ループスコープ終了

# SAY $loop_var                 # ✗ アクセス不可（スコープ外）
SAY $global_var                 # ✓ アクセス可能
```

### スコープスタックの実装

```typescript
// src/botscript/interpreter/ExecutionContext.ts
export interface VariableScope {
  variables: Map<string, any>;
  readonly: Set<string>;        // 読み取り専用変数
  parent?: VariableScope;       // 親スコープへの参照
}

export class ExecutionContext {
  private scopeStack: VariableScope[];
  private globalScope: VariableScope;
  private stats: ExecutionStats;

  constructor() {
    // グローバルスコープの初期化
    this.globalScope = {
      variables: new Map(),
      readonly: new Set()
    };
    
    this.scopeStack = [this.globalScope];
    this.stats = {
      statementsExecuted: 0,
      commandsExecuted: 0,
      variablesCreated: 0,
      scopesCreated: 0,
      startTime: Date.now()
    };
  }
}
```

## 🔧 スコープ操作メソッド

### スコープの作成と破棄

```typescript
/**
 * 新しいスコープをスタックにプッシュ
 * REPEAT文やIF文の開始時に呼び出される
 */
public pushScope(): void {
  const newScope: VariableScope = {
    variables: new Map(),
    readonly: new Set(),
    parent: this.getCurrentScope()
  };
  
  this.scopeStack.push(newScope);
  this.stats.scopesCreated++;
}

/**
 * 現在のスコープをポップ
 * ブロック終了時に呼び出される
 */
public popScope(): void {
  if (this.scopeStack.length <= 1) {
    throw new Error('Cannot pop global scope');
  }
  
  const poppedScope = this.scopeStack.pop()!;
  
  // スコープ内変数の統計更新
  this.stats.variablesCreated += poppedScope.variables.size;
}

/**
 * 現在のスコープを取得
 */
private getCurrentScope(): VariableScope {
  return this.scopeStack[this.scopeStack.length - 1];
}
```

### スコープの可視化（デバッグ用）

```typescript
/**
 * 現在のスコープ階層を文字列として表現
 */
public getScopeHierarchy(): string {
  const result: string[] = [];
  
  for (let i = 0; i < this.scopeStack.length; i++) {
    const scope = this.scopeStack[i];
    const indent = '  '.repeat(i);
    const variables = Array.from(scope.variables.keys()).join(', ');
    
    result.push(`${indent}Scope ${i}: [${variables}]`);
  }
  
  return result.join('\n');
}
```

## 💾 変数管理システム

### 変数の設定

```typescript
/**
 * 変数を現在のスコープに設定
 * @param name 変数名（$で始まる）
 * @param value 設定する値
 * @param readonly 読み取り専用フラグ
 */
public setVariable(name: string, value: any, readonly: boolean = false): void {
  if (!name.startsWith('$')) {
    throw new Error(`Invalid variable name: ${name}. Variables must start with '$'`);
  }
  
  const currentScope = this.getCurrentScope();
  
  // 読み取り専用変数のチェック
  if (this.isReadonly(name)) {
    throw new Error(`Cannot modify readonly variable: ${name}`);
  }
  
  // 変数を設定
  currentScope.variables.set(name, value);
  
  if (readonly) {
    currentScope.readonly.add(name);
  }
  
  console.log(`[Context] Set variable ${name} = ${JSON.stringify(value)} in scope ${this.scopeStack.length - 1}`);
}
```

### 変数の取得（スコープチェーン検索）

```typescript
/**
 * 変数値を取得（スコープチェーンを遡って検索）
 * @param name 変数名
 * @returns 変数の値
 */
public getVariable(name: string): any {
  // スコープスタックを上から下へ検索
  for (let i = this.scopeStack.length - 1; i >= 0; i--) {
    const scope = this.scopeStack[i];
    if (scope.variables.has(name)) {
      const value = scope.variables.get(name);
      console.log(`[Context] Get variable ${name} = ${JSON.stringify(value)} from scope ${i}`);
      return value;
    }
  }
  
  throw new Error(`Undefined variable: ${name}`);
}

/**
 * 変数の存在確認
 * @param name 変数名
 * @returns 変数が存在するかどうか
 */
public hasVariable(name: string): boolean {
  for (const scope of this.scopeStack.slice().reverse()) {
    if (scope.variables.has(name)) {
      return true;
    }
  }
  return false;
}
```

### 読み取り専用変数の管理

```typescript
/**
 * 変数が読み取り専用かチェック
 * @param name 変数名
 * @returns 読み取り専用フラグ
 */
private isReadonly(name: string): boolean {
  for (const scope of this.scopeStack.slice().reverse()) {
    if (scope.readonly.has(name)) {
      return true;
    }
  }
  return false;
}

/**
 * システム変数の初期化（読み取り専用）
 */
public initializeSystemVariables(): void {
  // ボット状態変数（読み取り専用）
  this.setVariable('$bot_health', 20, true);
  this.setVariable('$bot_food', 20, true);
  this.setVariable('$bot_x', 0, true);
  this.setVariable('$bot_y', 64, true);
  this.setVariable('$bot_z', 0, true);
  
  // 定数
  this.setVariable('$PI', Math.PI, true);
  this.setVariable('$E', Math.E, true);
}
```

## 📊 実行統計情報

### 統計データ構造

```typescript
export interface ExecutionStats {
  statementsExecuted: number;    // 実行された文の数
  commandsExecuted: number;      // 実行されたコマンドの数
  variablesCreated: number;      // 作成された変数の数
  scopesCreated: number;         // 作成されたスコープの数
  startTime: number;             // 実行開始時刻
  endTime?: number;              // 実行終了時刻
  peakMemoryUsage?: number;      // ピークメモリ使用量
}
```

### 統計情報の更新

```typescript
/**
 * 文実行数をインクリメント
 */
public incrementStatementsExecuted(): void {
  this.stats.statementsExecuted++;
}

/**
 * コマンド実行数をインクリメント
 */
public incrementCommandsExecuted(): void {
  this.stats.commandsExecuted++;
}

/**
 * 実行統計を取得
 */
public getStats(): ExecutionStats {
  return {
    ...this.stats,
    endTime: Date.now()
  };
}

/**
 * 詳細な実行レポートを生成
 */
public generateExecutionReport(): string {
  const duration = (this.stats.endTime || Date.now()) - this.stats.startTime;
  const totalVariables = this.getTotalVariableCount();
  
  return `
=== BotScript Execution Report ===
Duration: ${duration}ms
Statements Executed: ${this.stats.statementsExecuted}
Commands Executed: ${this.stats.commandsExecuted}
Variables Created: ${this.stats.variablesCreated}
Scopes Created: ${this.stats.scopesCreated}
Current Variables: ${totalVariables}
Memory Efficiency: ${(this.stats.variablesCreated / totalVariables * 100).toFixed(1)}%
`;
}
```

## 🧹 メモリ管理

### ガベージコレクション

```typescript
/**
 * 未使用変数のクリーンアップ
 */
public cleanup(): void {
  // グローバルスコープ以外の全スコープをクリア
  while (this.scopeStack.length > 1) {
    this.popScope();
  }
  
  // システム変数以外のグローバル変数をクリア
  const systemVars = ['$bot_health', '$bot_food', '$bot_x', '$bot_y', '$bot_z', '$PI', '$E'];
  const globalScope = this.globalScope;
  
  for (const [name] of globalScope.variables) {
    if (!systemVars.includes(name)) {
      globalScope.variables.delete(name);
      globalScope.readonly.delete(name);
    }
  }
}

/**
 * 現在のメモリ使用量を概算
 */
public getMemoryUsage(): number {
  let totalSize = 0;
  
  for (const scope of this.scopeStack) {
    for (const [name, value] of scope.variables) {
      totalSize += this.estimateSize(name) + this.estimateSize(value);
    }
  }
  
  return totalSize;
}

private estimateSize(value: any): number {
  if (typeof value === 'string') {
    return value.length * 2; // Unicode文字は2バイト
  } else if (typeof value === 'number') {
    return 8; // 64bit number
  } else if (typeof value === 'boolean') {
    return 1;
  } else {
    return JSON.stringify(value).length * 2;
  }
}
```

## 🔄 スコープの実際の動作例

### REPEAT文でのスコープ管理

```botscript
DEF $counter = 0

REPEAT 3
  DEF $iteration = $counter    # ← 新しいスコープで変数作成
  SET $counter = $counter + 1  # ← 親スコープの変数を変更
  
  IF $iteration < 2 THEN
    DEF $message = "Early"     # ← さらに新しいスコープ
    SAY $message               # ← 現在スコープの変数
  ELSE
    DEF $message = "Late"      # ← 別の新しいスコープ（同名だが異なる変数）
    SAY $message
  ENDIF
  # ← IF文のスコープ終了（$messageは削除）
ENDREPEAT
# ← REPEAT文のスコープ終了（$iterationは削除）

SAY $counter                   # ← グローバルスコープの変数は残存
```

### スコープスタックの変化

```
実行前:
Scope 0: [$counter]

REPEAT開始後:
Scope 0: [$counter]
Scope 1: [$iteration]

IF文開始後:
Scope 0: [$counter]
Scope 1: [$iteration]
Scope 2: [$message]

IF文終了後:
Scope 0: [$counter]
Scope 1: [$iteration]

REPEAT終了後:
Scope 0: [$counter]
```

## 🚀 パフォーマンス最適化

### 変数検索の最適化

```typescript
// 変数アクセス頻度に基づくキャッシュ
private variableCache = new Map<string, { scope: number, value: any }>();

public getVariableOptimized(name: string): any {
  // キャッシュから高速取得
  const cached = this.variableCache.get(name);
  if (cached && cached.scope < this.scopeStack.length && 
      this.scopeStack[cached.scope].variables.has(name)) {
    return cached.value;
  }
  
  // 通常の検索
  const value = this.getVariable(name);
  
  // キャッシュに保存
  for (let i = this.scopeStack.length - 1; i >= 0; i--) {
    if (this.scopeStack[i].variables.has(name)) {
      this.variableCache.set(name, { scope: i, value });
      break;
    }
  }
  
  return value;
}
```

### スコープ管理の最適化

```typescript
// 軽量スコープ（変数が少ない場合）
interface LightweightScope {
  variables: [string, any][];  // Mapより軽量
  readonly: string[];
}

// 大量変数用のスコープ（変数が多い場合）
interface HeavyweightScope {
  variables: Map<string, any>;
  readonly: Set<string>;
}

// 変数数に応じて適切なスコープ実装を選択
private createOptimalScope(expectedSize: number = 5): VariableScope {
  if (expectedSize <= 10) {
    return new LightweightScopeImpl();
  } else {
    return new HeavyweightScopeImpl();
  }
}
```

## 📝 練習問題

### 🟢 初級問題
**問題**: 以下のコードでスコープごとの変数を整理してください。

```botscript
DEF $a = 1
REPEAT 2
  DEF $b = 2
  IF TRUE THEN
    DEF $c = 3
    SAY $a + $b + $c
  ENDIF
ENDREPEAT
```

<details>
<summary>解答例</summary>

**スコープ階層**:
```
Scope 0 (Global): [$a = 1]
Scope 1 (REPEAT): [$b = 2]
Scope 2 (IF): [$c = 3]
```

**アクセス可能性**:
- IF文内では: `$a`, `$b`, `$c` 全てアクセス可能
- REPEAT文内（IF外）では: `$a`, `$b` アクセス可能、`$c` アクセス不可
- グローバルでは: `$a` のみアクセス可能

**テスト方法**:
```typescript
test('scope variable access', () => {
  const context = new ExecutionContext();
  
  context.setVariable('$a', 1);
  context.pushScope(); // REPEAT
  context.setVariable('$b', 2);
  context.pushScope(); // IF
  context.setVariable('$c', 3);
  
  // 全ての変数にアクセス可能
  expect(context.getVariable('$a')).toBe(1);
  expect(context.getVariable('$b')).toBe(2);
  expect(context.getVariable('$c')).toBe(3);
  
  context.popScope(); // IF終了
  
  // $cはアクセス不可
  expect(() => context.getVariable('$c')).toThrow('Undefined variable');
});
```
</details>

### 🟡 中級問題
**問題**: 以下のコードで同名変数の シャドーイング（隠蔽）がどのように動作するかを説明してください。

```botscript
DEF $x = "global"
REPEAT 1
  DEF $x = "loop"
  SAY $x          # 何が出力される？
  IF TRUE THEN
    DEF $x = "if"
    SAY $x        # 何が出力される？
  ENDIF
  SAY $x          # 何が出力される？
ENDREPEAT
SAY $x            # 何が出力される？
```

<details>
<summary>解答例</summary>

**出力順序**:
1. `"loop"` - REPEAT内の$xが有効
2. `"if"` - IF内の$xが有効（最も内側のスコープ）
3. `"loop"` - IF終了後、REPEAT内の$xが再び有効
4. `"global"` - REPEAT終了後、グローバルの$xが有効

**変数検索プロセス**:
```
Scope 0: [$x = "global"]
Scope 1: [$x = "loop"]     ← SAY時はこれが見つかる
Scope 2: [$x = "if"]       ← SAY時はこれが最初に見つかる
```

**テスト方法**:
```typescript
test('variable shadowing', async () => {
  const messages: string[] = [];
  const mockSay = jest.fn((msg) => messages.push(msg));
  
  // 実行後のメッセージ確認
  expect(messages).toEqual(['loop', 'if', 'loop', 'global']);
});
```
</details>

### 🔴 上級問題
**問題**: メモリ効率的なスコープ管理を実装してください。大量の変数を持つスコープと少数の変数を持つスコープで異なる実装を使い分けるシステムを設計してください。

<details>
<summary>解答例</summary>

```typescript
// 軽量スコープ実装（配列ベース）
class LightweightScope implements VariableScope {
  private vars: Array<[string, any]> = [];
  private readonlyVars: string[] = [];
  
  public variables = {
    has: (key: string) => this.vars.some(([k]) => k === key),
    get: (key: string) => {
      const entry = this.vars.find(([k]) => k === key);
      return entry ? entry[1] : undefined;
    },
    set: (key: string, value: any) => {
      const index = this.vars.findIndex(([k]) => k === key);
      if (index >= 0) {
        this.vars[index][1] = value;
      } else {
        this.vars.push([key, value]);
      }
    },
    size: this.vars.length
  };
  
  public readonly = {
    has: (key: string) => this.readonlyVars.includes(key),
    add: (key: string) => {
      if (!this.readonlyVars.includes(key)) {
        this.readonlyVars.push(key);
      }
    }
  };
}

// 重量スコープ実装（Map/Setベース）
class HeavyweightScope implements VariableScope {
  public variables = new Map<string, any>();
  public readonly = new Set<string>();
}

// 適応的スコープファクトリー
class AdaptiveScopeFactory {
  static create(expectedVariableCount: number = 5): VariableScope {
    const threshold = 10;
    
    if (expectedVariableCount <= threshold) {
      return new LightweightScope();
    } else {
      return new HeavyweightScope();
    }
  }
  
  // 既存スコープの最適化
  static optimize(scope: VariableScope): VariableScope {
    const varCount = scope.variables.size;
    
    // 閾値を超えた場合は重量版に移行
    if (varCount > 10 && scope instanceof LightweightScope) {
      const heavy = new HeavyweightScope();
      
      // データ移行
      for (const [key, value] of scope.vars) {
        heavy.variables.set(key, value);
      }
      for (const key of scope.readonlyVars) {
        heavy.readonly.add(key);
      }
      
      return heavy;
    }
    
    return scope;
  }
}

// 使用例とテスト
test('adaptive scope management', () => {
  const context = new ExecutionContext();
  
  // 少数変数の場合：軽量スコープ
  const lightScope = AdaptiveScopeFactory.create(3);
  expect(lightScope).toBeInstanceOf(LightweightScope);
  
  // 大量変数の場合：重量スコープ
  const heavyScope = AdaptiveScopeFactory.create(20);
  expect(heavyScope).toBeInstanceOf(HeavyweightScope);
  
  // パフォーマンステスト
  const startTime = performance.now();
  
  // 大量変数を軽量スコープで処理
  const scope = new LightweightScope();
  for (let i = 0; i < 1000; i++) {
    scope.variables.set(`$var${i}`, i);
  }
  
  const lightTime = performance.now() - startTime;
  
  // 最適化後の比較
  const optimizedScope = AdaptiveScopeFactory.optimize(scope);
  expect(optimizedScope).toBeInstanceOf(HeavyweightScope);
});
```
</details>

## 🏆 自己評価チェックリスト

- [ ] **初級**: スコープの概念と変数の可視性を理解している
- [ ] **中級**: 変数のシャドーイングとスコープチェーン検索を理解している
- [ ] **上級**: メモリ効率的なスコープ管理システムを設計できる

## 📚 次のステップ

実行コンテキストを理解したら、次は**[プロジェクト全体アーキテクチャ](./01_architecture.md)**でシステム全体の設計を学び、その後**[アビリティシステム](./08_ability_system.md)**でモジュラー設計の実装を学びましょう。