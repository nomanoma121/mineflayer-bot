# 字句解析器（Lexer）- トークン化の仕組み

## 📖 字句解析とは

字句解析（Lexical Analysis）は、**プログラムのソースコードを意味のある単位（トークン）に分解する処理**です。これは、コンパイラやインタプリタの最初のステップであり、文字列として表現されたコードを、プログラムが理解できる構造化データに変換します。

```
入力: "SAY \"Hello World\""
      ↓ 字句解析
出力: [
  { type: 'SAY', value: 'SAY' },
  { type: 'STRING', value: 'Hello World' }
]
```

## 🏗️ BotScript Lexerの設計

### ファイル構成
```
src/botscript/lexer/
├── Lexer.ts        # メイン字句解析器
├── TokenType.ts    # トークン型定義
└── __tests__/
    └── Lexer.test.ts  # テストスイート
```

### トークン型の定義

`TokenType.ts`では、BotScriptで使用される全てのトークン型を定義しています：

```typescript
export enum TokenType {
  // リテラル
  NUMBER = 'NUMBER',           // 数値: 42, 3.14
  STRING = 'STRING',           // 文字列: "Hello"
  BOOLEAN = 'BOOLEAN',         // 真偽値: TRUE, FALSE
  VARIABLE = 'VARIABLE',       // 変数: $health, $pos_x
  
  // キーワード
  DEF = 'DEF',                // 変数宣言
  SET = 'SET',                // 変数代入
  CALC = 'CALC',              // 計算代入
  IF = 'IF',                  // 条件分岐
  THEN = 'THEN',
  ELSE = 'ELSE',
  ENDIF = 'ENDIF',
  REPEAT = 'REPEAT',          // ループ
  ENDREPEAT = 'ENDREPEAT',
  
  // ボットコマンド
  SAY = 'SAY',
  MOVE = 'MOVE',
  GOTO = 'GOTO',
  ATTACK = 'ATTACK',
  DIG = 'DIG',
  PLACE = 'PLACE',
  DROP = 'DROP',
  EQUIP = 'EQUIP',
  WAIT = 'WAIT',
  
  // 演算子
  PLUS = 'PLUS',              // +
  MINUS = 'MINUS',            // -
  MULTIPLY = 'MULTIPLY',      // *
  DIVIDE = 'DIVIDE',          // /
  MODULO = 'MODULO',          // %
  
  // 比較演算子
  EQUAL = 'EQUAL',            // ==
  NOT_EQUAL = 'NOT_EQUAL',    // !=
  LESS_THAN = 'LESS_THAN',    // <
  GREATER_THAN = 'GREATER_THAN', // >
  LESS_EQUAL = 'LESS_EQUAL',  // <=
  GREATER_EQUAL = 'GREATER_EQUAL', // >=
  
  // 論理演算子
  AND = 'AND',
  OR = 'OR',
  NOT = 'NOT',
  
  // 記号
  ASSIGN = 'ASSIGN',          // =
  LEFT_PAREN = 'LEFT_PAREN',  // (
  RIGHT_PAREN = 'RIGHT_PAREN', // )
  
  // 制御
  NEWLINE = 'NEWLINE',        // 改行
  EOF = 'EOF'                 // ファイル終端
}
```

### Token構造体

各トークンは以下の情報を持ちます：

```typescript
export interface Token {
  type: TokenType;      // トークンの種類
  value: string;        // 元の文字列値
  line: number;         // 行番号（エラー報告用）
  column: number;       // 列番号（エラー報告用）
}
```

## 🔧 Lexerクラスの実装

### 基本構造

```typescript
export class Lexer {
  private source: string;      // 解析対象の文字列
  private position: number;    // 現在の文字位置
  private line: number;        // 現在の行番号
  private column: number;      // 現在の列番号
  
  constructor(source: string) {
    this.source = source;
    this.position = 0;
    this.line = 1;
    this.column = 1;
  }
  
  public tokenize(): Token[] {
    const tokens: Token[] = [];
    
    while (!this.isAtEnd()) {
      const token = this.nextToken();
      if (token) {
        tokens.push(token);
      }
    }
    
    tokens.push(this.createToken(TokenType.EOF, ''));
    return tokens;
  }
}
```

### 核心メソッド: nextToken()

これが字句解析の中核となるメソッドです：

```typescript
private nextToken(): Token | null {
  this.skipWhitespace();
  
  if (this.isAtEnd()) {
    return null;
  }
  
  const start = this.position;
  const startColumn = this.column;
  const char = this.advance();
  
  switch (char) {
    // 単一文字トークン
    case '+': return this.createToken(TokenType.PLUS, '+');
    case '-': return this.createToken(TokenType.MINUS, '-');
    case '*': return this.createToken(TokenType.MULTIPLY, '*');
    case '/': return this.createToken(TokenType.DIVIDE, '/');
    case '%': return this.createToken(TokenType.MODULO, '%');
    case '(': return this.createToken(TokenType.LEFT_PAREN, '(');
    case ')': return this.createToken(TokenType.RIGHT_PAREN, ')');
    case '\n': return this.handleNewline();
    
    // 複合文字トークン
    case '=':
      if (this.match('=')) {
        return this.createToken(TokenType.EQUAL, '==');
      }
      return this.createToken(TokenType.ASSIGN, '=');
      
    case '!':
      if (this.match('=')) {
        return this.createToken(TokenType.NOT_EQUAL, '!=');
      }
      throw new Error(`Unexpected character: ${char}`);
      
    case '<':
      if (this.match('=')) {
        return this.createToken(TokenType.LESS_EQUAL, '<=');
      }
      return this.createToken(TokenType.LESS_THAN, '<');
      
    case '>':
      if (this.match('=')) {
        return this.createToken(TokenType.GREATER_EQUAL, '>=');
      }
      return this.createToken(TokenType.GREATER_THAN, '>');
    
    // 文字列リテラル
    case '"': return this.string();
    
    // 変数（$で始まる）
    case '$': return this.variable();
    
    default:
      // 数値
      if (this.isDigit(char)) {
        return this.number();
      }
      
      // 識別子・キーワード
      if (this.isAlpha(char)) {
        return this.identifier();
      }
      
      throw new Error(`Unexpected character: ${char} at line ${this.line}, column ${startColumn}`);
  }
}
```

### 文字列処理の詳細

#### 文字列リテラル解析
```typescript
private string(): Token {
  const startColumn = this.column - 1;
  let value = '';
  
  while (!this.isAtEnd() && this.peek() !== '"') {
    if (this.peek() === '\n') {
      this.line++;
      this.column = 0;
    }
    
    // エスケープシーケンス処理
    if (this.peek() === '\\') {
      this.advance(); // '\' をスキップ
      const escaped = this.advance();
      switch (escaped) {
        case 'n': value += '\n'; break;
        case 't': value += '\t'; break;
        case 'r': value += '\r'; break;
        case '\\': value += '\\'; break;
        case '"': value += '"'; break;
        default:
          throw new Error(`Invalid escape sequence: \\${escaped}`);
      }
    } else {
      value += this.advance();
    }
  }
  
  if (this.isAtEnd()) {
    throw new Error(`Unterminated string at line ${this.line}`);
  }
  
  this.advance(); // 終端の " を消費
  return this.createToken(TokenType.STRING, value, startColumn);
}
```

#### 数値リテラル解析
```typescript
private number(): Token {
  const startColumn = this.column - 1;
  let value = this.source[this.position - 1]; // 最初の桁
  
  // 整数部分
  while (!this.isAtEnd() && this.isDigit(this.peek())) {
    value += this.advance();
  }
  
  // 小数点がある場合
  if (!this.isAtEnd() && this.peek() === '.' && 
      this.position + 1 < this.source.length && 
      this.isDigit(this.source[this.position + 1])) {
    value += this.advance(); // '.' を追加
    
    // 小数部分
    while (!this.isAtEnd() && this.isDigit(this.peek())) {
      value += this.advance();
    }
  }
  
  return this.createToken(TokenType.NUMBER, value, startColumn);
}
```

#### 識別子・キーワード解析
```typescript
private identifier(): Token {
  const startColumn = this.column - 1;
  let value = this.source[this.position - 1]; // 最初の文字
  
  while (!this.isAtEnd() && this.isAlphaNumeric(this.peek())) {
    value += this.advance();
  }
  
  // キーワードチェック
  const type = this.getKeywordType(value.toUpperCase());
  return this.createToken(type, value, startColumn);
}

private getKeywordType(value: string): TokenType {
  const keywords: Record<string, TokenType> = {
    'DEF': TokenType.DEF,
    'SET': TokenType.SET,
    'CALC': TokenType.CALC,
    'IF': TokenType.IF,
    'THEN': TokenType.THEN,
    'ELSE': TokenType.ELSE,
    'ENDIF': TokenType.ENDIF,
    'REPEAT': TokenType.REPEAT,
    'ENDREPEAT': TokenType.ENDREPEAT,
    'SAY': TokenType.SAY,
    'MOVE': TokenType.MOVE,
    'GOTO': TokenType.GOTO,
    'ATTACK': TokenType.ATTACK,
    'DIG': TokenType.DIG,
    'PLACE': TokenType.PLACE,
    'DROP': TokenType.DROP,
    'EQUIP': TokenType.EQUIP,
    'WAIT': TokenType.WAIT,
    'TRUE': TokenType.BOOLEAN,
    'FALSE': TokenType.BOOLEAN,
    'AND': TokenType.AND,
    'OR': TokenType.OR,
    'NOT': TokenType.NOT
  };
  
  return keywords[value] || TokenType.IDENTIFIER;
}
```

## 🎯 エラーハンドリング戦略

### 位置情報の追跡
```typescript
private advance(): string {
  const char = this.source[this.position++];
  this.column++;
  return char;
}

private createToken(type: TokenType, value: string, column?: number): Token {
  return {
    type,
    value,
    line: this.line,
    column: column ?? this.column - value.length
  };
}
```

### エラーメッセージの詳細化
```typescript
// 悪い例
throw new Error("Invalid character");

// 良い例（実装している方法）
throw new Error(`Unexpected character: ${char} at line ${this.line}, column ${this.column}`);
```

## 🚀 パフォーマンス最適化

### 1. 事前計算によるキーワード検索
```typescript
// 静的なキーワードマップで O(1) 検索
private static readonly KEYWORDS = new Map([
  ['DEF', TokenType.DEF],
  ['SAY', TokenType.SAY],
  // ... 他のキーワード
]);
```

### 2. 文字分類の最適化
```typescript
private isDigit(char: string): boolean {
  return char >= '0' && char <= '9';
}

private isAlpha(char: string): boolean {
  return (char >= 'a' && char <= 'z') || 
         (char >= 'A' && char <= 'Z') || 
         char === '_';
}
```

### 3. 前方参照の効率化
```typescript
private peek(offset: number = 0): string {
  const pos = this.position + offset;
  if (pos >= this.source.length) return '\0';
  return this.source[pos];
}

private match(expected: string): boolean {
  if (this.isAtEnd() || this.source[this.position] !== expected) {
    return false;
  }
  this.position++;
  this.column++;
  return true;
}
```

## 📝 実際の動作例

以下のBotScriptコード：
```botscript
DEF $health = 100
IF $health < 50 THEN
  SAY "Health is low!"
ENDIF
```

は以下のトークン列に変換されます：

```typescript
[
  { type: 'DEF', value: 'DEF', line: 1, column: 1 },
  { type: 'VARIABLE', value: '$health', line: 1, column: 5 },
  { type: 'ASSIGN', value: '=', line: 1, column: 13 },
  { type: 'NUMBER', value: '100', line: 1, column: 15 },
  { type: 'NEWLINE', value: '\n', line: 1, column: 18 },
  
  { type: 'IF', value: 'IF', line: 2, column: 1 },
  { type: 'VARIABLE', value: '$health', line: 2, column: 4 },
  { type: 'LESS_THAN', value: '<', line: 2, column: 12 },
  { type: 'NUMBER', value: '50', line: 2, column: 14 },
  { type: 'THEN', value: 'THEN', line: 2, column: 17 },
  { type: 'NEWLINE', value: '\n', line: 2, column: 21 },
  
  { type: 'SAY', value: 'SAY', line: 3, column: 3 },
  { type: 'STRING', value: 'Health is low!', line: 3, column: 7 },
  { type: 'NEWLINE', value: '\n', line: 3, column: 23 },
  
  { type: 'ENDIF', value: 'ENDIF', line: 4, column: 1 },
  { type: 'EOF', value: '', line: 4, column: 6 }
]
```

## 📝 練習問題

字句解析器の実装練習は、以下のディレクトリで実際にコードを書いて学習できます：

### 🎯 練習問題ディレクトリ

```
src/botscript/practice/01_lexer/
├── beginner/              # 🟢 初級問題
│   ├── BasicTokens.ts     # 基本トークンの認識
│   ├── BasicTokens.test.ts
│   ├── NumbersAndStrings.ts # 数値と文字列の処理
│   └── NumbersAndStrings.test.ts
├── intermediate/          # 🟡 中級問題
│   ├── ComplexOperators.ts # 複合演算子の処理
│   └── EscapeSequences.ts  # エスケープシーケンス
├── advanced/             # 🔴 上級問題
│   ├── ErrorRecovery.ts   # エラー回復機能
│   └── Performance.ts     # パフォーマンス最適化
└── solutions/            # 解答例
```

### 🚀 実践的学習方法

1. **問題ファイルを開く**: `BasicTokens.ts` など
2. **TODOコメントを見つける**: 実装すべき箇所が明示されています
3. **実装する**: 段階的にコードを書いていきます
4. **テストを実行**: `npm test -- src/botscript/practice/01_lexer/beginner/BasicTokens.test.ts`
5. **✅ PASS が出るまで修正**: テストが通ると成功です！

### 🟢 初級問題の例

**BasicTokens.ts**: 基本的なキーワードと文字列の認識

```typescript
// 実装要件:
// 1. "SAY" キーワードをSAYトークンとして認識
// 2. "MOVE" キーワードをMOVEトークンとして認識  
// 3. "文字列" を STRING トークンとして認識
// 4. 最後にEOFトークンを追加
// 5. 空白文字は無視

public tokenize(): BasicToken[] {
  const tokens: BasicToken[] = [];
  
  // TODO: ここに実装してください
  // ヒント1: while (!this.isAtEnd()) でループ
  // ヒント2: this.skipWhitespace() で空白をスキップ
  // ヒント3: this.nextToken() で次のトークンを取得
  
  return tokens;
}
```

**テスト例**:
```typescript
test('SAYコマンドと文字列の組み合わせ', () => {
  const lexer = new BasicLexer('SAY "Hello"');
  const tokens = lexer.tokenize();
  
  expect(tokens).toHaveLength(3); // SAY + STRING + EOF
  expect(tokens[0].type).toBe(BasicTokenType.SAY);
  expect(tokens[1].value).toBe('Hello'); // クォート除去
});
```

### 🟡 中級問題の例

**ComplexOperators.ts**: 複合演算子（>=, <=, ==, !=）の処理

```typescript
// 実装要件:
// 1. 先読み処理で = と == を区別
// 2. 複合演算子の正確な認識
// 3. エラーメッセージの詳細化

case '=':
  // TODO: this.match('=') で次の文字が = かチェック
  // == なら EQUALS トークン、= なら ASSIGN トークン
  if (this.match('=')) {
    return this.createToken(TokenType.EQUALS, '==');
  }
  return this.createToken(TokenType.ASSIGN, '=');
```

### 🔴 上級問題の例

**ErrorRecovery.ts**: エラー回復機能の実装

```typescript
// 実装要件:
// 1. パニックモード回復
// 2. 詳細なエラー報告
// 3. 部分的な解析継続

public tokenizeWithErrorRecovery(): { tokens: Token[], errors: string[] } {
  // TODO: エラーが発生しても継続する仕組みを実装
}
```

### ✅ 成功判定

各問題のテストが通ると以下のようなメッセージが表示されます：

```
🎉 01_lexer 初級問題1クリア！基本的な字句解析ができました！
🎉 01_lexer 中級問題1クリア！複合演算子の処理ができました！
🎉 01_lexer 上級問題1クリア！エラー回復機能が実装できました！
```

### 📚 理論と実践の組み合わせ

この解説ドキュメントで理論を学んだ後、実際に練習問題でコードを書くことで：

- **理論の理解**: なぜそうするのかを理解
- **実装の経験**: 実際にコードを書く技術
- **テスト駆動**: 正確性を確認する習慣
- **段階的習得**: 基礎から応用への確実なステップアップ

が可能になります。ぜひ練習問題にチャレンジしてください！

## 🏆 自己評価チェックリスト

- [ ] **初級**: トークンの基本概念と種類を理解している
- [ ] **中級**: エスケープシーケンスの処理方法を理解している
- [ ] **上級**: 複雑な式の字句解析プロセスを追跡できる

## 📚 次のステップ

字句解析を理解したら、次は**[構文解析器](./05_parser_ast.md)**でトークン列をAST（抽象構文木）に変換する方法を学びましょう。構文解析では、トークンの意味的な関係を理解し、プログラムの構造を表現する木構造を構築します。