# 🎯 02_parser 練習問題ガイド

構文解析器（Parser）の実装を段階的に学習するための練習問題集です。

## 📚 学習目標

1. **AST（抽象構文木）の理解**: プログラムの構造をツリー形式で表現
2. **再帰下降パーサー**: 文法規則を再帰的な関数として実装
3. **演算子優先順位**: 数学的な演算順序をASTで正確に表現
4. **制御構造**: IF文、REPEAT文の入れ子解析
5. **エラーハンドリング**: 構文エラーの検出と回復

## 🗂️ ディレクトリ構造

```
02_parser/
├── README.md              # このファイル
├── beginner/              # 🟢 初級問題
│   ├── BasicAST.ts        # 基本的なAST構築
│   ├── BasicAST.test.ts
│   ├── ExpressionParsing.ts # 単純な式の解析
│   └── ExpressionParsing.test.ts
├── intermediate/          # 🟡 中級問題
│   ├── OperatorPrecedence.ts # 演算子優先順位
│   ├── OperatorPrecedence.test.ts
│   ├── ControlStructures.ts  # 制御構造（IF, REPEAT）
│   └── ControlStructures.test.ts
├── advanced/             # 🔴 上級問題
│   ├── NestedStructures.ts  # 複雑な入れ子構造
│   ├── NestedStructures.test.ts
│   ├── ErrorHandling.ts     # 構文エラーハンドリング
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
npm test -- src/botscript/practice/02_parser/beginner/BasicAST.test.ts

# 中級問題1のテスト
npm test -- src/botscript/practice/02_parser/intermediate/OperatorPrecedence.test.ts

# 全ての02_parserテスト
npm test -- src/botscript/practice/02_parser/
```

### ファイルの確認
```bash
# 問題ファイルを開く
code src/botscript/practice/02_parser/beginner/BasicAST.ts

# テストファイルを開く
code src/botscript/practice/02_parser/beginner/BasicAST.test.ts
```

## 📝 学習の進め方

### 🟢 初級レベル（基礎的なAST構築）

1. **BasicAST.ts**: 変数宣言、基本式、コマンドのAST構築
2. **ExpressionParsing.ts**: 数値、文字列、変数の式解析

**学習ポイント**:
- ASTノードの基本構造
- トークンからASTへの変換
- 位置情報の保持

### 🟡 中級レベル（構造化された解析）

1. **OperatorPrecedence.ts**: 演算子優先順位の正確な実装
2. **ControlStructures.ts**: IF文、REPEAT文の解析

**学習ポイント**:
- 再帰下降パーサーの実装
- 左結合性の処理
- ブロック構造の解析

### 🔴 上級レベル（複雑な構造とエラー処理）

1. **NestedStructures.ts**: 深い入れ子構造の解析
2. **ErrorHandling.ts**: 構文エラーの回復機能

**学習ポイント**:
- 複雑なスコープ管理
- パニックモード回復
- 詳細なエラー報告

## 🎯 問題の構成

各問題ファイルには以下が含まれています：

### 実装テンプレート
```typescript
/**
 * 🟢 問題のタイトル
 * 
 * 実装要件:
 * 1. 具体的な要件1
 * 2. 具体的な要件2
 */

public parse(): ProgramNode {
  // TODO: ここに実装してください
  // ヒント1: 具体的なヒント
  // ヒント2: 実装のガイダンス
  
  return /* 実装してください */;
}
```

### テストファイル
```typescript
describe('02_parser - 問題名', () => {
  test('具体的なテストケース', () => {
    const parser = new Parser(tokens);
    const ast = parser.parse();
    
    expect(ast.type).toBe('Program');
    // 詳細な検証...
  });
});
```

## 📊 成功判定

各レベルの問題をクリアすると以下のメッセージが表示されます：

```
🎉 02_parser 初級問題1クリア！基本的なAST構築ができました！
🎉 02_parser 中級問題1クリア！演算子優先順位が実装できました！
🎉 02_parser 上級問題1クリア！複雑な入れ子構造が解析できました！
```

## 🔍 デバッグのヒント

### AST構造の確認
```typescript
// 生成されたASTを可視化
console.log('Generated AST:', JSON.stringify(ast, null, 2));

// 特定のノードの確認
expect(ast.statements[0].type).toBe('IfStatement');
const ifStmt = ast.statements[0] as IfStatementNode;
expect(ifStmt.condition.type).toBe('BinaryExpression');
```

### よくあるエラー
1. **型の不一致**: ASTノードの型が期待と異なる
2. **構造の誤り**: 親子関係が正しく構築されていない
3. **位置情報**: 行番号・列番号が正確でない

### トラブルシューティング
```typescript
// トークンの確認
console.log('Input tokens:', tokens);

// パーサーの状態確認
console.log('Current token:', this.peek());
console.log('Position:', this.current);
```

## 📚 参考資料

### AST可視化ツール
練習問題には以下のような可視化支援が含まれています：

```typescript
// AST構造の表示
function printAST(node: ASTNode, indent = 0): void {
  const prefix = '  '.repeat(indent);
  console.log(`${prefix}${node.type}: ${node.value || ''}`);
  
  // 子ノードの再帰表示
  if ('children' in node) {
    node.children.forEach(child => printAST(child, indent + 1));
  }
}
```

### 期待されるAST例
```typescript
// 入力: "DEF $x = 5 + 3"
{
  type: 'Program',
  statements: [
    {
      type: 'VariableDeclaration',
      name: '$x',
      initializer: {
        type: 'BinaryExpression',
        left: { type: 'NumberLiteral', value: 5 },
        operator: '+',
        right: { type: 'NumberLiteral', value: 3 }
      }
    }
  ]
}
```

## 🏆 達成目標

- [ ] **初級**: 基本的なASTノードを正確に構築できる
- [ ] **中級**: 演算子優先順位を考慮したASTを構築できる  
- [ ] **上級**: 複雑な制御構造とエラー回復を実装できる

## 📋 次のステップ

02_parserをクリアしたら、**03_interpreter**でASTを実際に実行する方法を学びましょう。インタプリタでは、構築したASTをたどってボットの実際の動作を制御します。