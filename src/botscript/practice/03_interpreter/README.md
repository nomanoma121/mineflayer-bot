# 🎯 03_interpreter 練習問題ガイド

インタプリタエンジンの実装を段階的に学習するための練習問題集です。

## 📚 学習目標

1. **AST実行**: 構築されたASTを実際のプログラム動作に変換
2. **Visitorパターン**: ASTノードを効率的に処理する設計パターン
3. **環境管理**: 変数とスコープの管理
4. **制御フロー**: IF文、ループの実行制御
5. **ボット連携**: Minecraft ボットとの実際の連携

## 🗂️ ディレクトリ構造

```
03_interpreter/
├── README.md              # このファイル
├── beginner/              # 🟢 初級問題
│   ├── BasicExecution.ts  # 基本的なAST実行
│   ├── BasicExecution.test.ts
│   ├── VariableEnvironment.ts # 変数管理
│   └── VariableEnvironment.test.ts
├── intermediate/          # 🟡 中級問題
│   ├── ControlFlow.ts     # 制御フロー（IF, REPEAT）
│   ├── ControlFlow.test.ts
│   ├── ExpressionEvaluation.ts # 式評価
│   └── ExpressionEvaluation.test.ts
├── advanced/             # 🔴 上級問題
│   ├── BotIntegration.ts  # Minecraft ボット連携
│   ├── BotIntegration.test.ts
│   ├── ErrorHandling.ts   # 実行時エラー処理
│   └── ErrorHandling.test.ts
└── solutions/            # 解答例
    ├── beginner/
    ├── intermediate/
    └── advanced/
```

## 🚀 実行方法

### 個別のテスト実行
```bash
# 初級問題1のテスト
npm test -- src/botscript/practice/03_interpreter/beginner/BasicExecution.test.ts

# 中級問題1のテスト
npm test -- src/botscript/practice/03_interpreter/intermediate/ControlFlow.test.ts

# 全ての03_interpreterテスト
npm test -- src/botscript/practice/03_interpreter/
```

### ファイルの確認
```bash
# 問題ファイルを開く
code src/botscript/practice/03_interpreter/beginner/BasicExecution.ts

# テストファイルを開く
code src/botscript/practice/03_interpreter/beginner/BasicExecution.test.ts
```

## 📝 学習の進め方

### 🟢 初級レベル（基本的な実行機能）

1. **BasicExecution.ts**: 変数宣言、リテラル、SAYコマンドの実行
2. **VariableEnvironment.ts**: 変数の格納と参照の管理

**学習ポイント**:
- Visitorパターンの基本
- 環境（Environment）の概念
- 基本的なAST→値の変換

### 🟡 中級レベル（制御構造と式評価）

1. **ControlFlow.ts**: IF文、REPEAT文の実行制御
2. **ExpressionEvaluation.ts**: 算術・論理演算の評価

**学習ポイント**:
- 条件分岐の実装
- ループの実行制御
- 複雑な式の評価

### 🔴 上級レベル（実用的な連携とエラー処理）

1. **BotIntegration.ts**: 実際のMinecraftボットとの連携
2. **ErrorHandling.ts**: 実行時エラーの処理と回復

**学習ポイント**:
- 外部システムとの連携
- 非同期処理の管理
- エラー回復戦略

## 🎯 問題の構成

各問題ファイルには以下が含まれています：

### インタプリタテンプレート
```typescript
/**
 * 🟢 問題のタイトル
 * 
 * 実装要件:
 * 1. Visitorパターンでのノード処理
 * 2. 環境管理での変数操作
 */

export class BasicInterpreter implements ASTVisitor {
  private environment: Environment;

  public interpret(program: ProgramNode): void {
    // TODO: ここに実装してください
    // ヒント1: 各文を順次実行
    // ヒント2: visitStatement() を呼び出し
    
    this.execute(program);
  }

  // TODO: 各ノードタイプのvisitメソッドを実装
  visitVariableDeclaration(node: VariableDeclarationNode): any {
    // 実装してください
  }
}
```

### テストファイル
```typescript
describe('03_interpreter - 問題名', () => {
  test('具体的なテストケース', () => {
    const interpreter = new BasicInterpreter();
    const result = interpreter.interpret(ast);
    
    expect(result).toBeDefined();
    // 詳細な検証...
  });
});
```

## 📊 成功判定

各レベルの問題をクリアすると以下のメッセージが表示されます：

```
🎉 03_interpreter 初級問題1クリア！基本的なAST実行ができました！
🎉 03_interpreter 中級問題1クリア！制御フローが実装できました！
🎉 03_interpreter 上級問題1クリア！ボット連携が完了しました！
```

## 🔍 デバッグのヒント

### 実行状態の確認
```typescript
// 環境の状態を確認
console.log('Environment:', interpreter.getEnvironment().getAll());

// 実行の流れを追跡
console.log('Executing:', node.type, node);

// 値の評価結果を確認
console.log('Evaluated to:', result);
```

### よくあるエラー
1. **未定義変数**: 宣言されていない変数への参照
2. **型不一致**: 文字列に対する算術演算など
3. **無限ループ**: REPEAT文での条件設定ミス

### トラブルシューティング
```typescript
// AST構造の確認
console.log('AST:', JSON.stringify(ast, null, 2));

// 環境の変数確認
console.log('Variables:', environment.getAll());

// エラー位置の特定
try {
  interpreter.interpret(ast);
} catch (error) {
  console.log('Error at:', error.node?.line, error.node?.column);
}
```

## 📚 参考資料

### Visitorパターンの実装例
```typescript
export interface ASTVisitor {
  visitProgram(node: ProgramNode): any;
  visitVariableDeclaration(node: VariableDeclarationNode): any;
  visitSayCommand(node: SayCommandNode): any;
  visitNumberLiteral(node: NumberLiteralNode): any;
  visitStringLiteral(node: StringLiteralNode): any;
  visitVariable(node: VariableNode): any;
  visitBinaryExpression(node: BinaryExpressionNode): any;
}

export class Interpreter implements ASTVisitor {
  public visit(node: ASTNode): any {
    const method = `visit${node.type}` as keyof this;
    return (this[method] as Function)(node);
  }
}
```

### 環境管理の実装例
```typescript
export class Environment {
  private variables: Map<string, any> = new Map();

  public define(name: string, value: any): void {
    this.variables.set(name, value);
  }

  public get(name: string): any {
    if (this.variables.has(name)) {
      return this.variables.get(name);
    }
    throw new Error(`Undefined variable: ${name}`);
  }
}
```

## 🏆 達成目標

- [ ] **初級**: 基本的なAST実行と変数管理ができる
- [ ] **中級**: 制御構造と複雑な式評価ができる  
- [ ] **上級**: 実際のボット連携とエラー処理ができる

## 📋 次のステップ

03_interpreterをクリアしたら、**04_integration**で全体的な統合と高度な機能を学びましょう。統合では、字句解析→構文解析→実行の完全なパイプラインを構築します。