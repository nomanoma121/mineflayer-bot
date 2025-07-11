# 構文解析器（Parser）- AST構築の詳細

## 📖 構文解析とは

構文解析（Syntax Analysis/Parsing）は、**字句解析器が生成したトークン列を、プログラムの構造を表現するAST（Abstract Syntax Tree：抽象構文木）に変換する処理**です。これはコンパイラ・インタプリタの第二段階で、プログラムの意味的構造を理解するための基盤となります。

```
入力: [SAY, STRING("Hello"), IF, VARIABLE($x), LESS_THAN, NUMBER(10)]
      ↓ 構文解析
出力: AST {
  statements: [
    SayCommand { message: "Hello" },
    IfStatement { 
      condition: BinaryExpression { 
        left: Variable($x), 
        operator: <, 
        right: Number(10) 
      }
    }
  ]
}
```

## 🌳 AST（抽象構文木）の設計

### AST節点の基本構造

全てのAST節点は共通のインターフェースを実装します：

```typescript
// src/botscript/ast/ASTNode.ts
export interface ASTNode {
  type: string;           // 節点の種類を示す識別子
  line?: number;          // ソースコードの行番号（デバッグ用）
  column?: number;        // ソースコードの列番号（デバッグ用）
}
```

### 式（Expression）の階層構造

```typescript
// 基底式インターフェース
export interface ExpressionNode extends ASTNode {}

// リテラル式
export interface NumberLiteralNode extends ExpressionNode {
  type: 'NumberLiteral';
  value: number;
}

export interface StringLiteralNode extends ExpressionNode {
  type: 'StringLiteral';
  value: string;
}

export interface BooleanLiteralNode extends ExpressionNode {
  type: 'BooleanLiteral';
  value: boolean;
}

// 変数参照
export interface VariableNode extends ExpressionNode {
  type: 'Variable';
  name: string;
}

// 二項演算
export interface BinaryExpressionNode extends ExpressionNode {
  type: 'BinaryExpression';
  left: ExpressionNode;
  operator: string;        // '+', '-', '*', '/', '<', '>', '==', etc.
  right: ExpressionNode;
}

// 単項演算
export interface UnaryExpressionNode extends ExpressionNode {
  type: 'UnaryExpression';
  operator: string;        // '-', 'NOT'
  operand: ExpressionNode;
}
```

### 文（Statement）の階層構造

```typescript
// 基底文インターフェース
export interface StatementNode extends ASTNode {}

// 変数宣言
export interface VariableDeclarationNode extends StatementNode {
  type: 'VariableDeclaration';
  name: string;
  initializer: ExpressionNode;
}

// 変数代入
export interface AssignmentNode extends StatementNode {
  type: 'Assignment';
  name: string;
  value: ExpressionNode;
}

// 条件分岐
export interface IfStatementNode extends StatementNode {
  type: 'IfStatement';
  condition: ExpressionNode;
  thenBranch: StatementNode[];
  elseBranch?: StatementNode[];
}

// ループ
export interface RepeatStatementNode extends StatementNode {
  type: 'RepeatStatement';
  count: ExpressionNode;
  body: StatementNode[];
}
```

### ボットコマンドの AST 節点

```typescript
// 基底コマンドインターフェース
export interface CommandNode extends StatementNode {}

// SAYコマンド
export interface SayCommandNode extends CommandNode {
  type: 'SayCommand';
  message: ExpressionNode;
}

// MOVEコマンド
export interface MoveCommandNode extends CommandNode {
  type: 'MoveCommand';
  direction: ExpressionNode;
  distance?: ExpressionNode;
}

// GOTOコマンド
export interface GotoCommandNode extends CommandNode {
  type: 'GotoCommand';
  x: ExpressionNode;
  y: ExpressionNode;
  z: ExpressionNode;
}

// ATTACKコマンド
export interface AttackCommandNode extends CommandNode {
  type: 'AttackCommand';
  target: ExpressionNode;
}
```

## 🔧 Parser クラスの実装

### 基本構造

```typescript
// src/botscript/parser/Parser.ts
export class Parser {
  private tokens: Token[];
  private current: number;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
    this.current = 0;
  }

  public parse(): ProgramNode {
    const statements: StatementNode[] = [];

    while (!this.isAtEnd()) {
      // 空行をスキップ
      if (this.match(TokenType.NEWLINE)) {
        continue;
      }

      const stmt = this.statement();
      if (stmt) {
        statements.push(stmt);
      }
    }

    return {
      type: 'Program',
      statements
    };
  }
}
```

### 再帰下降パーサー（Recursive Descent Parser）

BotScriptパーサーは**再帰下降パーサー**を採用しています。これは文法規則を再帰的な関数として実装する手法です。

#### 文法規則の階層
```
program        → statement*
statement      → declaration | assignment | ifStatement | repeatStatement | command
declaration    → "DEF" VARIABLE "=" expression
assignment     → ("SET" | "CALC") VARIABLE "=" expression
ifStatement    → "IF" expression "THEN" statement* ("ELSE" statement*)? "ENDIF"
command        → sayCommand | moveCommand | gotoCommand | ...
expression     → logical
logical        → equality ("AND" | "OR" equality)*
equality       → comparison ("==" | "!=" comparison)*
comparison     → term ("<" | ">" | "<=" | ">=" term)*
term           → factor ("+" | "-" factor)*
factor         → unary ("*" | "/" | "%" unary)*
unary          → ("!" | "-") unary | primary
primary        → NUMBER | STRING | BOOLEAN | VARIABLE | "(" expression ")"
```

#### 式解析の実装例

```typescript
// 式解析のエントリーポイント
private expression(): ExpressionNode {
  return this.logical();
}

// 論理演算子の解析（最も優先度が低い）
private logical(): ExpressionNode {
  let expr = this.equality();

  while (this.match(TokenType.AND, TokenType.OR)) {
    const operator = this.previous().value;
    const right = this.equality();
    expr = {
      type: 'BinaryExpression',
      left: expr,
      operator,
      right,
      line: this.previous().line,
      column: this.previous().column
    };
  }

  return expr;
}

// 等値演算子の解析
private equality(): ExpressionNode {
  let expr = this.comparison();

  while (this.match(TokenType.EQUAL, TokenType.NOT_EQUAL)) {
    const operator = this.previous().value;
    const right = this.comparison();
    expr = {
      type: 'BinaryExpression',
      left: expr,
      operator,
      right,
      line: this.previous().line,
      column: this.previous().column
    };
  }

  return expr;
}

// 比較演算子の解析
private comparison(): ExpressionNode {
  let expr = this.term();

  while (this.match(TokenType.GREATER_THAN, TokenType.GREATER_EQUAL, 
                    TokenType.LESS_THAN, TokenType.LESS_EQUAL)) {
    const operator = this.previous().value;
    const right = this.term();
    expr = {
      type: 'BinaryExpression',
      left: expr,
      operator,
      right,
      line: this.previous().line,
      column: this.previous().column
    };
  }

  return expr;
}

// 加算・減算の解析
private term(): ExpressionNode {
  let expr = this.factor();

  while (this.match(TokenType.PLUS, TokenType.MINUS)) {
    const operator = this.previous().value;
    const right = this.factor();
    expr = {
      type: 'BinaryExpression',
      left: expr,
      operator,
      right,
      line: this.previous().line,
      column: this.previous().column
    };
  }

  return expr;
}

// 乗算・除算の解析
private factor(): ExpressionNode {
  let expr = this.unary();

  while (this.match(TokenType.MULTIPLY, TokenType.DIVIDE, TokenType.MODULO)) {
    const operator = this.previous().value;
    const right = this.unary();
    expr = {
      type: 'BinaryExpression',
      left: expr,
      operator,
      right,
      line: this.previous().line,
      column: this.previous().column
    };
  }

  return expr;
}

// 単項演算子の解析
private unary(): ExpressionNode {
  if (this.match(TokenType.NOT, TokenType.MINUS)) {
    const operator = this.previous().value;
    const right = this.unary();
    return {
      type: 'UnaryExpression',
      operator,
      operand: right,
      line: this.previous().line,
      column: this.previous().column
    };
  }

  return this.primary();
}

// プライマリ式の解析（最も優先度が高い）
private primary(): ExpressionNode {
  if (this.match(TokenType.TRUE)) {
    return {
      type: 'BooleanLiteral',
      value: true,
      line: this.previous().line,
      column: this.previous().column
    };
  }

  if (this.match(TokenType.FALSE)) {
    return {
      type: 'BooleanLiteral',
      value: false,
      line: this.previous().line,
      column: this.previous().column
    };
  }

  if (this.match(TokenType.NUMBER)) {
    return {
      type: 'NumberLiteral',
      value: parseFloat(this.previous().value),
      line: this.previous().line,
      column: this.previous().column
    };
  }

  if (this.match(TokenType.STRING)) {
    return {
      type: 'StringLiteral',
      value: this.previous().value,
      line: this.previous().line,
      column: this.previous().column
    };
  }

  if (this.match(TokenType.VARIABLE)) {
    return {
      type: 'Variable',
      name: this.previous().value,
      line: this.previous().line,
      column: this.previous().column
    };
  }

  if (this.match(TokenType.LEFT_PAREN)) {
    const expr = this.expression();
    this.consume(TokenType.RIGHT_PAREN, "Expected ')' after expression");
    return expr;
  }

  throw new Error(`Unexpected token: ${this.peek().value} at line ${this.peek().line}`);
}
```

### 文の解析

```typescript
private statement(): StatementNode | null {
  try {
    // 変数宣言
    if (this.match(TokenType.DEF)) {
      return this.variableDeclaration();
    }

    // 変数代入
    if (this.match(TokenType.SET, TokenType.CALC)) {
      return this.assignment();
    }

    // 条件分岐
    if (this.match(TokenType.IF)) {
      return this.ifStatement();
    }

    // ループ
    if (this.match(TokenType.REPEAT)) {
      return this.repeatStatement();
    }

    // ボットコマンド
    if (this.match(TokenType.SAY)) {
      return this.sayCommand();
    }

    if (this.match(TokenType.MOVE)) {
      return this.moveCommand();
    }

    if (this.match(TokenType.GOTO)) {
      return this.gotoCommand();
    }

    // 他のコマンド...

    throw new Error(`Unexpected token: ${this.peek().value} at line ${this.peek().line}`);
  } catch (error) {
    this.synchronize(); // エラー回復
    throw error;
  }
}
```

### 具体的な構文解析例

#### IF文の解析
```typescript
private ifStatement(): IfStatementNode {
  const condition = this.expression();
  
  this.consume(TokenType.THEN, "Expected 'THEN' after if condition");
  this.consumeNewlines();

  const thenBranch: StatementNode[] = [];
  while (!this.check(TokenType.ELSE) && !this.check(TokenType.ENDIF) && !this.isAtEnd()) {
    if (this.match(TokenType.NEWLINE)) continue;
    
    const stmt = this.statement();
    if (stmt) thenBranch.push(stmt);
  }

  let elseBranch: StatementNode[] | undefined;
  if (this.match(TokenType.ELSE)) {
    this.consumeNewlines();
    elseBranch = [];
    
    while (!this.check(TokenType.ENDIF) && !this.isAtEnd()) {
      if (this.match(TokenType.NEWLINE)) continue;
      
      const stmt = this.statement();
      if (stmt) elseBranch.push(stmt);
    }
  }

  this.consume(TokenType.ENDIF, "Expected 'ENDIF' after if statement");

  return {
    type: 'IfStatement',
    condition,
    thenBranch,
    elseBranch,
    line: condition.line,
    column: condition.column
  };
}
```

#### REPEAT文の解析
```typescript
private repeatStatement(): RepeatStatementNode {
  const count = this.expression();
  this.consumeNewlines();

  const body: StatementNode[] = [];
  while (!this.check(TokenType.ENDREPEAT) && !this.isAtEnd()) {
    if (this.match(TokenType.NEWLINE)) continue;
    
    const stmt = this.statement();
    if (stmt) body.push(stmt);
  }

  this.consume(TokenType.ENDREPEAT, "Expected 'ENDREPEAT' after repeat body");

  return {
    type: 'RepeatStatement',
    count,
    body,
    line: count.line,
    column: count.column
  };
}
```

## 🎯 エラーハンドリング

### パニックモード回復

パーサーがエラーに遭遇した時、適切に回復してパースを続行する機能：

```typescript
private synchronize(): void {
  this.advance();

  while (!this.isAtEnd()) {
    if (this.previous().type === TokenType.NEWLINE) return;

    switch (this.peek().type) {
      case TokenType.DEF:
      case TokenType.SET:
      case TokenType.IF:
      case TokenType.REPEAT:
      case TokenType.SAY:
      case TokenType.MOVE:
        return;
    }

    this.advance();
  }
}
```

### 詳細なエラーメッセージ

```typescript
private consume(type: TokenType, message: string): Token {
  if (this.check(type)) return this.advance();

  const current = this.peek();
  throw new Error(`${message}. Got '${current.value}' at line ${current.line}, column ${current.column}`);
}
```

## 🏭 ASTFactoryパターン

ASTノードの生成を統一的に管理するファクトリーパターン：

```typescript
// src/botscript/ast/ASTFactory.ts
export class ASTFactory {
  static createNumberLiteral(value: number, line?: number, column?: number): NumberLiteralNode {
    return {
      type: 'NumberLiteral',
      value,
      line,
      column
    };
  }

  static createBinaryExpression(
    left: ExpressionNode, 
    operator: string, 
    right: ExpressionNode,
    line?: number,
    column?: number
  ): BinaryExpressionNode {
    return {
      type: 'BinaryExpression',
      left,
      operator,
      right,
      line,
      column
    };
  }

  static createIfStatement(
    condition: ExpressionNode,
    thenBranch: StatementNode[],
    elseBranch?: StatementNode[],
    line?: number,
    column?: number
  ): IfStatementNode {
    return {
      type: 'IfStatement',
      condition,
      thenBranch,
      elseBranch,
      line,
      column
    };
  }

  // 他のファクトリーメソッド...
}
```

## 📊 実際のAST構築例

以下のBotScriptコード：
```botscript
DEF $count = 5
IF $count > 0 THEN
  SAY "Count is: " + $count
  MOVE "forward" 1
ENDIF
```

は以下のASTに変換されます：

```typescript
{
  type: 'Program',
  statements: [
    {
      type: 'VariableDeclaration',
      name: '$count',
      initializer: {
        type: 'NumberLiteral',
        value: 5,
        line: 1,
        column: 15
      },
      line: 1,
      column: 1
    },
    {
      type: 'IfStatement',
      condition: {
        type: 'BinaryExpression',
        left: {
          type: 'Variable',
          name: '$count',
          line: 2,
          column: 4
        },
        operator: '>',
        right: {
          type: 'NumberLiteral',
          value: 0,
          line: 2,
          column: 13
        },
        line: 2,
        column: 11
      },
      thenBranch: [
        {
          type: 'SayCommand',
          message: {
            type: 'BinaryExpression',
            left: {
              type: 'StringLiteral',
              value: 'Count is: ',
              line: 3,
              column: 7
            },
            operator: '+',
            right: {
              type: 'Variable',
              name: '$count',
              line: 3,
              column: 21
            },
            line: 3,
            column: 19
          },
          line: 3,
          column: 3
        },
        {
          type: 'MoveCommand',
          direction: {
            type: 'StringLiteral',
            value: 'forward',
            line: 4,
            column: 8
          },
          distance: {
            type: 'NumberLiteral',
            value: 1,
            line: 4,
            column: 18
          },
          line: 4,
          column: 3
        }
      ],
      line: 2,
      column: 1
    }
  ]
}
```

## 📝 練習問題

構文解析器の実装練習は、以下のディレクトリで実際にコードを書いて学習できます：

### 🎯 練習問題ディレクトリ

```
src/botscript/practice/02_parser/
├── beginner/              # 🟢 初級問題
│   ├── BasicAST.ts        # 基本的なAST構築
│   ├── BasicAST.test.ts
│   ├── ExpressionParsing.ts # 式の解析
│   └── ExpressionParsing.test.ts
├── intermediate/          # 🟡 中級問題
│   ├── OperatorPrecedence.ts # 演算子優先順位
│   ├── ControlStructures.ts  # 制御構造
│   └── ErrorHandling.ts      # エラーハンドリング
├── advanced/             # 🔴 上級問題
│   ├── NestedStructures.ts  # 入れ子構造
│   ├── ASTOptimization.ts   # AST最適化
│   └── AdvancedFeatures.ts  # 高度な機能
└── solutions/            # 解答例
```

### 🚀 実践的学習方法

1. **問題ファイルを開く**: `BasicAST.ts` など
2. **TODO部分を実装**: パーサーの各メソッドを段階的に実装
3. **テストを実行**: `npm test -- src/botscript/practice/02_parser/beginner/BasicAST.test.ts`
4. **ASTを確認**: 生成されたASTが期待通りかテストで検証

### 🟢 初級問題の例

**BasicAST.ts**: 基本的なAST節点の構築

```typescript
// 実装要件:
// 1. 変数宣言のAST構築
// 2. 基本式のAST構築
// 3. コマンドのAST構築

private variableDeclaration(): VariableDeclarationNode {
  const name = this.consume(TokenType.VARIABLE, 'Expected variable name');
  this.consume(TokenType.ASSIGN, 'Expected "=" after variable');
  
  const initializer = this.expression();
  
  // TODO: VariableDeclarationNodeを作成して返す
  // ヒント: ASTFactory.createVariableDeclaration() を使用
  
  return /* 実装してください */;
}
```

**テスト例**:
```typescript
test('変数宣言のAST構築', () => {
  const tokens = tokenize('DEF $x = 10');
  const parser = new Parser(tokens);
  const ast = parser.parse();
  
  expect(ast.statements).toHaveLength(1);
  const decl = ast.statements[0] as VariableDeclarationNode;
  expect(decl.type).toBe('VariableDeclaration');
  expect(decl.name).toBe('$x');
  expect((decl.initializer as NumberLiteralNode).value).toBe(10);
});
```

### 🟡 中級問題の例

**OperatorPrecedence.ts**: 演算子優先順位の正確な実装

```typescript
// 実装要件:
// 1. 演算子優先順位の階層実装
// 2. 左結合性の処理
// 3. 括弧による優先順位変更

private term(): ExpressionNode {
  let expr = this.factor();
  
  while (this.match(TokenType.PLUS, TokenType.MINUS)) {
    const operator = this.previous().value;
    const right = this.factor();
    
    // TODO: BinaryExpressionNodeを作成
    // ヒント: 左結合性を考慮したAST構築
    
    expr = /* 実装してください */;
  }
  
  return expr;
}
```

**期待されるAST**: `2 + 3 * 4` → `2 + (3 * 4)`
```typescript
{
  type: 'BinaryExpression',
  left: { type: 'NumberLiteral', value: 2 },
  operator: '+',
  right: {
    type: 'BinaryExpression',
    left: { type: 'NumberLiteral', value: 3 },
    operator: '*',
    right: { type: 'NumberLiteral', value: 4 }
  }
}
```

### 🔴 上級問題の例

**NestedStructures.ts**: 複雑な入れ子構造の解析

```typescript
// 実装要件:
// 1. 入れ子になったIF文の正確な解析
// 2. REPEATとIFの組み合わせ
// 3. 深い階層でのスコープ管理

private ifStatement(): IfStatementNode {
  const condition = this.expression();
  this.consume(TokenType.THEN, 'Expected THEN');
  
  // TODO: THEN分岐の文リストを解析
  const thenBranch = this.statementBlock([TokenType.ELSE, TokenType.ENDIF]);
  
  let elseBranch: StatementNode[] | undefined;
  if (this.match(TokenType.ELSE)) {
    // TODO: ELSE分岐の解析
    elseBranch = /* 実装してください */;
  }
  
  this.consume(TokenType.ENDIF, 'Expected ENDIF');
  
  return /* 完全なIfStatementNodeを作成 */;
}
```

### ✅ 成功判定とAST可視化

各問題のテストが通ると、生成されたASTが表示されます：

```
🎉 02_parser 初級問題1クリア！基本的なAST構築ができました！

生成されたAST:
{
  type: 'Program',
  statements: [
    {
      type: 'VariableDeclaration',
      name: '$health',
      initializer: { type: 'NumberLiteral', value: 100 }
    }
  ]
}
```

### 📊 AST構造の理解

練習問題では以下を学習できます：

- **節点の階層関係**: 親子関係の正確な構築
- **演算子優先順位**: 数学的な優先順位のAST表現
- **制御構造**: IF文、REPEAT文の入れ子表現
- **エラー回復**: 構文エラー時の適切な処理

### 🔍 デバッグ支援

各練習問題には詳細なテストとデバッグ支援機能が含まれています：

```typescript
// AST構造の可視化
console.log('Generated AST:', JSON.stringify(ast, null, 2));

// 特定の節点の検証
expect(ast.statements[0].type).toBe('IfStatement');
const ifStmt = ast.statements[0] as IfStatementNode;
expect(ifStmt.condition.type).toBe('BinaryExpression');
```

### 📚 理論と実践の統合

この解説ドキュメントの理論を基に、実際の練習問題で：

- **再帰下降パーサー**: 実際の実装経験
- **AST設計**: 効率的な節点構造の理解
- **エラーハンドリング**: 堅牢なパーサーの構築
- **最適化技術**: パフォーマンスを考慮した実装

を身につけることができます。

## 🏆 自己評価チェックリスト

- [ ] **初級**: ASTの基本概念と節点の種類を理解している
- [ ] **中級**: 演算子優先度とAST構造の関係を理解している
- [ ] **上級**: 複雑な入れ子構造をAST で正確に表現できる

## 📚 次のステップ

構文解析を理解したら、次は**[インタプリタエンジン](./06_interpreter_engine.md)**でASTを実際に実行する方法を学びましょう。インタプリタでは、AST をたどりながらボットの実際の動作を制御します。