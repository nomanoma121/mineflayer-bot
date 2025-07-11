# インタプリタエンジン - 実行エンジンの核心

## 📖 インタプリタとは

インタプリタ（Interpreter）は、**AST（抽象構文木）を走査し、節点の種類に応じて実際の処理を実行するエンジン**です。これはコンパイラ・インタプリタシステムの最終段階で、プログラムの意味を実現し、実際のボット動作を制御します。

```
入力: AST { SayCommand { message: "Hello" } }
      ↓ インタプリタ実行
出力: ボットが実際に "Hello" とチャットで発言
```

## 🏗️ インタプリタアーキテクチャ

### クラス設計

```typescript
// src/botscript/interpreter/Interpreter.ts
export class Interpreter {
  private bot: Bot;                    // 制御対象のボット
  private context: ExecutionContext;   // 実行コンテキスト（変数管理）
  private isRunning: boolean;          // 実行状態フラグ
  private shouldStop: boolean;         // 停止要求フラグ

  constructor(bot: Bot, context: ExecutionContext) {
    this.bot = bot;
    this.context = context;
    this.isRunning = false;
    this.shouldStop = false;
  }
}
```

### 実行結果の型定義

```typescript
export enum ExecutionResultType {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  STOPPED = 'STOPPED'
}

export interface ExecutionResult {
  type: ExecutionResultType;
  message: string;
  duration: number;
  context?: ExecutionContext;
}

export interface CommandResult {
  success: boolean;
  message: string;
  duration: number;
}
```

## 🚀 核心メソッド: execute()

インタプリタの中核となるメソッドです：

```typescript
public async execute(ast: ProgramNode): Promise<ExecutionResult> {
  const startTime = Date.now();
  this.isRunning = true;
  this.shouldStop = false;

  try {
    // システム変数を更新
    this.updateSystemVariables();

    // 全ての文を順次実行
    for (const statement of ast.statements) {
      // 停止要求チェック
      if (this.shouldStop) {
        return {
          type: ExecutionResultType.STOPPED,
          message: 'Execution stopped by user',
          duration: Date.now() - startTime,
          context: this.context
        };
      }

      // 文を実行
      await this.executeStatement(statement);
      
      // 統計情報更新
      this.context.incrementStatementsExecuted();
    }

    return {
      type: ExecutionResultType.SUCCESS,
      message: 'Execution completed successfully',
      duration: Date.now() - startTime,
      context: this.context
    };

  } catch (error) {
    return {
      type: ExecutionResultType.ERROR,
      message: `Execution error: ${(error as Error).message}`,
      duration: Date.now() - startTime,
      context: this.context
    };
  } finally {
    this.isRunning = false;
  }
}
```

## 🎯 Visitor パターンによる AST 走査

インタプリタは **Visitor パターン** を使用してAST節点を処理します：

```typescript
private async executeStatement(statement: StatementNode): Promise<void> {
  switch (statement.type) {
    case 'VariableDeclaration':
      this.executeVariableDeclaration(statement as VariableDeclarationNode);
      break;
      
    case 'Assignment':
      this.executeAssignment(statement as AssignmentNode);
      break;
      
    case 'IfStatement':
      await this.executeIfStatement(statement as IfStatementNode);
      break;
      
    case 'RepeatStatement':
      await this.executeRepeatStatement(statement as RepeatStatementNode);
      break;
      
    // ボットコマンド
    case 'SayCommand':
      await this.executeSayCommand(statement as SayCommandNode);
      break;
      
    case 'MoveCommand':
      await this.executeMoveCommand(statement as MoveCommandNode);
      break;
      
    case 'GotoCommand':
      await this.executeGotoCommand(statement as GotoCommandNode);
      break;
      
    case 'AttackCommand':
      await this.executeAttackCommand(statement as AttackCommandNode);
      break;
      
    // その他のコマンド...
    
    default:
      throw new Error(`Unknown statement type: ${(statement as any).type}`);
  }
}
```

## 💻 式評価エンジン

式の評価は再帰的に行われます：

```typescript
private evaluateExpression(expression: ExpressionNode): any {
  switch (expression.type) {
    case 'NumberLiteral':
      return (expression as NumberLiteralNode).value;
      
    case 'StringLiteral':
      return (expression as StringLiteralNode).value;
      
    case 'BooleanLiteral':
      return (expression as BooleanLiteralNode).value;
      
    case 'Variable':
      const varName = (expression as VariableNode).name;
      if (!this.context.hasVariable(varName)) {
        throw new Error(`Undefined variable: ${varName}`);
      }
      return this.context.getVariable(varName);
      
    case 'BinaryExpression':
      return this.evaluateBinaryExpression(expression as BinaryExpressionNode);
      
    case 'UnaryExpression':
      return this.evaluateUnaryExpression(expression as UnaryExpressionNode);
      
    default:
      throw new Error(`Unknown expression type: ${(expression as any).type}`);
  }
}
```

### 二項演算の評価

```typescript
private evaluateBinaryExpression(expression: BinaryExpressionNode): any {
  const left = this.evaluateExpression(expression.left);
  const right = this.evaluateExpression(expression.right);
  
  switch (expression.operator) {
    // 算術演算
    case '+':
      // 文字列結合 または 数値加算
      if (typeof left === 'string' || typeof right === 'string') {
        return String(left) + String(right);
      }
      return Number(left) + Number(right);
      
    case '-':
      return Number(left) - Number(right);
      
    case '*':
      return Number(left) * Number(right);
      
    case '/':
      const rightNum = Number(right);
      if (rightNum === 0) {
        throw new Error('Division by zero');
      }
      return Number(left) / rightNum;
      
    case '%':
      return Number(left) % Number(right);
      
    // 比較演算
    case '<':
      return Number(left) < Number(right);
      
    case '>':
      return Number(left) > Number(right);
      
    case '<=':
      return Number(left) <= Number(right);
      
    case '>=':
      return Number(left) >= Number(right);
      
    case '==':
      return left == right;  // 型変換あり
      
    case '!=':
      return left != right;
      
    // 論理演算
    case 'AND':
      return this.isTruthy(left) && this.isTruthy(right);
      
    case 'OR':
      return this.isTruthy(left) || this.isTruthy(right);
      
    default:
      throw new Error(`Unknown binary operator: ${expression.operator}`);
  }
}
```

### 真偽値判定

BotScriptの真偽値判定ルール：

```typescript
private isTruthy(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') return value.length > 0;
  return true;
}
```

## 🎮 制御構造の実装

### IF文の実行

```typescript
private async executeIfStatement(statement: IfStatementNode): Promise<void> {
  const conditionValue = this.evaluateExpression(statement.condition);
  
  if (this.isTruthy(conditionValue)) {
    // THEN分岐を実行
    for (const stmt of statement.thenBranch) {
      if (this.shouldStop) break;
      await this.executeStatement(stmt);
    }
  } else if (statement.elseBranch) {
    // ELSE分岐を実行
    for (const stmt of statement.elseBranch) {
      if (this.shouldStop) break;
      await this.executeStatement(stmt);
    }
  }
}
```

### REPEAT文の実行

```typescript
private async executeRepeatStatement(statement: RepeatStatementNode): Promise<void> {
  const countValue = this.evaluateExpression(statement.count);
  const count = Number(countValue);
  
  if (!Number.isInteger(count) || count < 0) {
    throw new Error(`Invalid repeat count: ${count}. Must be a non-negative integer.`);
  }
  
  // スコープを作成してループ変数を管理
  this.context.pushScope();
  
  try {
    for (let i = 0; i < count; i++) {
      if (this.shouldStop) break;
      
      // ループインデックスを特別変数として提供
      this.context.setVariable('$loop_index', i);
      
      // ループ本体を実行
      for (const stmt of statement.body) {
        if (this.shouldStop) break;
        await this.executeStatement(stmt);
      }
    }
  } finally {
    this.context.popScope();
  }
}
```

## 🤖 ボットコマンドの実装

### SAY コマンド

```typescript
private async executeSayCommand(statement: SayCommandNode): Promise<void> {
  const startTime = Date.now();
  
  try {
    const message = String(this.evaluateExpression(statement.message));
    
    // ボットの say アビリティを使用
    this.bot.say.say(message);
    
    this.context.incrementCommandsExecuted();
    
    console.log(`[BotScript] SAY: "${message}" (${Date.now() - startTime}ms)`);
  } catch (error) {
    throw new Error(`SAY command failed: ${(error as Error).message}`);
  }
}
```

### MOVE コマンド

```typescript
private async executeMoveCommand(statement: MoveCommandNode): Promise<void> {
  const startTime = Date.now();
  
  try {
    const direction = String(this.evaluateExpression(statement.direction)).toLowerCase();
    const distance = statement.distance ? 
      Number(this.evaluateExpression(statement.distance)) : 1;
    
    // 現在位置を取得
    const currentPos = this.bot.getPosition();
    let targetPos = { ...currentPos };
    
    // 方向に応じて目標座標を計算
    switch (direction) {
      case 'forward':
      case 'north':
        targetPos.z -= distance;
        break;
      case 'backward':
      case 'south':
        targetPos.z += distance;
        break;
      case 'left':
      case 'west':
        targetPos.x -= distance;
        break;
      case 'right':
      case 'east':
        targetPos.x += distance;
        break;
      case 'up':
        targetPos.y += distance;
        break;
      case 'down':
        targetPos.y -= distance;
        break;
      default:
        throw new Error(`Invalid direction: ${direction}`);
    }
    
    // 移動実行（非同期）
    await this.bot.goto(targetPos.x, targetPos.y, targetPos.z);
    
    this.context.incrementCommandsExecuted();
    
    console.log(`[BotScript] MOVE: ${direction} ${distance} blocks (${Date.now() - startTime}ms)`);
  } catch (error) {
    throw new Error(`MOVE command failed: ${(error as Error).message}`);
  }
}
```

### ATTACK コマンド

```typescript
private async executeAttackCommand(statement: AttackCommandNode): Promise<void> {
  const startTime = Date.now();
  
  try {
    const target = String(this.evaluateExpression(statement.target));
    
    // エンティティを検索
    const entity = this.bot.sensing.findNearestEntity((entity) => {
      return (entity.name === target) || 
             (entity.displayName === target) || 
             (entity.type === target) ||
             (entity.username === target);
    });
    
    if (!entity) {
      throw new Error(`Target entity '${target}' not found`);
    }
    
    // 攻撃を実行
    this.bot.mc.attack(entity);
    
    this.context.incrementCommandsExecuted();
    
    console.log(`[BotScript] ATTACK: ${target} (${entity.type}) (${Date.now() - startTime}ms)`);
  } catch (error) {
    throw new Error(`ATTACK command failed: ${(error as Error).message}`);
  }
}
```

### WAIT コマンド

```typescript
private async executeWaitCommand(statement: WaitCommandNode): Promise<void> {
  const startTime = Date.now();
  
  try {
    const duration = Number(this.evaluateExpression(statement.duration));
    
    if (duration < 0) {
      throw new Error(`Invalid wait duration: ${duration}. Must be non-negative.`);
    }
    
    // 指定された秒数だけ待機
    await new Promise(resolve => setTimeout(resolve, duration * 1000));
    
    this.context.incrementCommandsExecuted();
    
    console.log(`[BotScript] WAIT: ${duration} seconds (${Date.now() - startTime}ms)`);
  } catch (error) {
    throw new Error(`WAIT command failed: ${(error as Error).message}`);
  }
}
```

## 🌍 システム変数の管理

ボットの状態を反映するシステム変数を自動更新：

```typescript
private updateSystemVariables(): void {
  try {
    // ボット位置
    const position = this.bot.getPosition();
    this.context.setVariable('$bot_x', position.x);
    this.context.setVariable('$bot_y', position.y);
    this.context.setVariable('$bot_z', position.z);
    
    // ボット状態
    this.context.setVariable('$bot_health', this.bot.mc.health);
    this.context.setVariable('$bot_food', this.bot.mc.food);
    this.context.setVariable('$bot_saturation', this.bot.mc.foodSaturation);
    
    // 環境情報
    this.context.setVariable('$bot_time', this.bot.mc.time.timeOfDay);
    this.context.setVariable('$bot_day', this.bot.mc.time.day);
    this.context.setVariable('$bot_weather', this.bot.mc.isRaining ? 'rain' : 'clear');
    
    // 経験値
    this.context.setVariable('$bot_level', this.bot.mc.experience.level);
    this.context.setVariable('$bot_exp', this.bot.mc.experience.points);
    
  } catch (error) {
    console.warn('Failed to update system variables:', error);
  }
}
```

## ⚡ 非同期実行制御

### 停止機能の実装

```typescript
public stop(): void {
  this.shouldStop = true;
  console.log('[BotScript] Stop requested');
}

public isExecuting(): boolean {
  return this.isRunning;
}

// 実行中の各所で停止チェック
private async executeStatement(statement: StatementNode): Promise<void> {
  if (this.shouldStop) {
    throw new Error('Execution stopped by user');
  }
  
  // 実際の文実行...
}
```

### タイムアウト機能

```typescript
public async executeWithTimeout(ast: ProgramNode, timeoutMs: number): Promise<ExecutionResult> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      this.stop();
      reject(new Error(`Execution timeout after ${timeoutMs}ms`));
    }, timeoutMs);
    
    this.execute(ast)
      .then(result => {
        clearTimeout(timeout);
        resolve(result);
      })
      .catch(error => {
        clearTimeout(timeout);
        reject(error);
      });
  });
}
```

## 🔧 エラーハンドリング戦略

### 詳細なエラー情報

```typescript
private createDetailedError(error: Error, statement: StatementNode): Error {
  const line = statement.line || 'unknown';
  const column = statement.column || 'unknown';
  return new Error(`${error.message} at line ${line}, column ${column}`);
}
```

### 部分実行の継続

```typescript
// 一部のコマンドが失敗しても実行を継続するオプション
public async executeWithErrorRecovery(ast: ProgramNode): Promise<ExecutionResult> {
  const errors: string[] = [];
  const startTime = Date.now();
  
  for (const statement of ast.statements) {
    try {
      await this.executeStatement(statement);
    } catch (error) {
      errors.push(`Line ${statement.line}: ${(error as Error).message}`);
      // エラーを記録して続行
    }
  }
  
  if (errors.length > 0) {
    return {
      type: ExecutionResultType.ERROR,
      message: `Execution completed with errors:\n${errors.join('\n')}`,
      duration: Date.now() - startTime,
      context: this.context
    };
  }
  
  return {
    type: ExecutionResultType.SUCCESS,
    message: 'Execution completed successfully',
    duration: Date.now() - startTime,
    context: this.context
  };
}
```

## 📊 パフォーマンス最適化

### 式評価の最適化

```typescript
// よく使用される式のキャッシュ
private expressionCache = new Map<string, any>();

private evaluateExpressionCached(expression: ExpressionNode): any {
  // リテラルは即座に返す
  if (['NumberLiteral', 'StringLiteral', 'BooleanLiteral'].includes(expression.type)) {
    return this.evaluateExpression(expression);
  }
  
  // 複雑な式のキャッシュ
  const key = this.serializeExpression(expression);
  if (this.expressionCache.has(key)) {
    return this.expressionCache.get(key);
  }
  
  const result = this.evaluateExpression(expression);
  this.expressionCache.set(key, result);
  return result;
}
```

### 非同期処理の最適化

```typescript
// 複数の独立したコマンドを並列実行
private async executeCommandsBatch(commands: CommandNode[]): Promise<void> {
  const promises = commands.map(cmd => this.executeStatement(cmd));
  await Promise.all(promises);
}
```

## 📝 練習問題

### 🟢 初級問題
**問題**: 以下のBotScriptコードを実行した時、各ステップでの変数の値の変化を追跡してください。

```botscript
DEF $x = 5
SET $x = $x + 3
SAY "Value: " + $x
```

<details>
<summary>解答例</summary>

**実行ステップ**:
1. `DEF $x = 5` → `$x = 5`
2. `SET $x = $x + 3` → `$x = 5 + 3 = 8`
3. `SAY "Value: " + $x` → `SAY "Value: 8"` → ボットが "Value: 8" と発言

**テスト方法**:
```typescript
test('variable tracking', async () => {
  const context = new ExecutionContext();
  const interpreter = new Interpreter(mockBot, context);
  
  await interpreter.execute(ast);
  
  expect(context.getVariable('$x')).toBe(8);
  expect(mockBot.say.say).toHaveBeenCalledWith('Value: 8');
});
```
</details>

### 🟡 中級問題
**問題**: 以下のIF文の条件評価を手動で実行し、どの分岐が実行されるかを判定してください。

```botscript
DEF $health = 15
DEF $food = 8
IF $health > 10 AND $food < 10 THEN
  SAY "Healthy but hungry"
ELSE
  SAY "Other condition"
ENDIF
```

<details>
<summary>解答例</summary>

**条件評価プロセス**:
1. `$health > 10` → `15 > 10` → `true`
2. `$food < 10` → `8 < 10` → `true`
3. `true AND true` → `true`
4. 条件が`true`なので、THEN分岐が実行される
5. ボットが "Healthy but hungry" と発言

**テスト方法**:
```typescript
test('conditional logic evaluation', async () => {
  const context = new ExecutionContext();
  const interpreter = new Interpreter(mockBot, context);
  
  // 事前に変数を設定
  context.setVariable('$health', 15);
  context.setVariable('$food', 8);
  
  await interpreter.execute(ast);
  
  expect(mockBot.say.say).toHaveBeenCalledWith('Healthy but hungry');
});
```
</details>

### 🔴 上級問題
**問題**: 以下のREPEAT文の実行中に`stop()`メソッドが呼ばれた場合の動作をテストケースとして実装してください。

```botscript
REPEAT 1000
  SAY "Loop " + $loop_index
  WAIT 0.1
ENDREPEAT
SAY "Completed"
```

<details>
<summary>解答例</summary>

```typescript
test('interpreter stop during repeat loop', async () => {
  const context = new ExecutionContext();
  const interpreter = new Interpreter(mockBot, context);
  
  // 大きなループを含むAST
  const ast = createRepeatAst(1000);
  
  // 実行を開始
  const executePromise = interpreter.execute(ast);
  
  // 少し待ってから停止
  setTimeout(() => {
    interpreter.stop();
  }, 50); // 50ms後に停止
  
  // 結果を確認
  const result = await executePromise;
  
  // 停止により中断されたことを確認
  expect(result.type).toBe(ExecutionResultType.STOPPED);
  expect(result.message).toContain('stopped');
  
  // 最後の"Completed"メッセージが実行されていないことを確認
  const sayCommands = mockBot.say.say.mock.calls;
  const lastCall = sayCommands[sayCommands.length - 1];
  expect(lastCall[0]).not.toBe('Completed');
  
  // 部分的に実行されたことを確認（いくつかのループは実行された）
  expect(sayCommands.length).toBeGreaterThan(0);
  expect(sayCommands.length).toBeLessThan(1000);
});
```

**停止時の内部状態確認**:
```typescript
test('interpreter state during stop', () => {
  const interpreter = new Interpreter(mockBot, context);
  
  expect(interpreter.isExecuting()).toBe(false);
  
  const executePromise = interpreter.execute(ast);
  expect(interpreter.isExecuting()).toBe(true);
  
  interpreter.stop();
  
  // 停止後も isExecuting は実行完了まで true のまま
  expect(interpreter.isExecuting()).toBe(true);
  
  // 実行完了を待つ
  await executePromise;
  expect(interpreter.isExecuting()).toBe(false);
});
```
</details>

## 🏆 自己評価チェックリスト

- [ ] **初級**: インタプリタの基本動作と変数管理を理解している
- [ ] **中級**: 条件分岐の評価プロセスを追跡できる
- [ ] **上級**: 非同期実行制御と停止機能の仕組みを理解している

## 📚 次のステップ

インタプリタエンジンを理解したら、次は**[実行コンテキスト](./07_execution_context.md)**でスコープ管理と変数のライフサイクルについて詳しく学びましょう。実行コンテキストは、変数の可視性やメモリ管理を担当する重要なコンポーネントです。