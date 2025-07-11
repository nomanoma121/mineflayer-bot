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

### 🟢 初級問題
**問題**: 以下のBotScriptコードをトークン化したとき、生成されるトークンの種類と数を答えてください。

```botscript
SAY "Hello"
```

<details>
<summary>解答例</summary>

**トークン**:
1. `SAY` (TokenType.SAY)
2. `"Hello"` (TokenType.STRING) - 値は"Hello"（ダブルクォート除く）
3. EOF (TokenType.EOF)

**総数**: 3個

**テスト方法**:
```typescript
const lexer = new Lexer('SAY "Hello"');
const tokens = lexer.tokenize();
expect(tokens).toHaveLength(3);
expect(tokens[0].type).toBe(TokenType.SAY);
expect(tokens[1].type).toBe(TokenType.STRING);
expect(tokens[1].value).toBe('Hello');
```
</details>

### 🟡 中級問題
**問題**: 以下のエスケープシーケンスを含む文字列が正しくトークン化されることを確認してください。どのような値として解釈されるか答えてください。

```botscript
SAY "Line 1\nLine 2\tTabbed\"Quote\""
```

<details>
<summary>解答例</summary>

**STRINGトークンの値**:
```
Line 1
Line 2	Tabbed"Quote"
```

- `\n` → 改行文字
- `\t` → タブ文字  
- `\"` → ダブルクォート文字

**テスト方法**:
```typescript
const lexer = new Lexer('SAY "Line 1\\nLine 2\\tTabbed\\"Quote\\""');
const tokens = lexer.tokenize();
expect(tokens[1].value).toBe('Line 1\nLine 2\tTabbed"Quote"');
```
</details>

### 🔴 上級問題  
**問題**: 以下の複雑なBotScriptコードを完全にトークン化し、各演算子が正しく認識されることを確認するテストケースを作成してください。

```botscript
DEF $result = ($a + $b) * 2
IF $result >= 100 AND $status != "ready" THEN
  CALC $result = $result / 2
ENDIF
```

<details>
<summary>解答例</summary>

**期待されるトークン（主要部分）**:
```typescript
[
  { type: 'DEF', value: 'DEF' },
  { type: 'VARIABLE', value: '$result' },
  { type: 'ASSIGN', value: '=' },
  { type: 'LEFT_PAREN', value: '(' },
  { type: 'VARIABLE', value: '$a' },
  { type: 'PLUS', value: '+' },
  { type: 'VARIABLE', value: '$b' },
  { type: 'RIGHT_PAREN', value: ')' },
  { type: 'MULTIPLY', value: '*' },
  { type: 'NUMBER', value: '2' },
  // ... 他のトークン
  { type: 'GREATER_EQUAL', value: '>=' },
  { type: 'AND', value: 'AND' },
  { type: 'NOT_EQUAL', value: '!=' },
  // ...
]
```

**テストケース**:
```typescript
test('complex expression tokenization', () => {
  const source = `DEF $result = ($a + $b) * 2
IF $result >= 100 AND $status != "ready" THEN
  CALC $result = $result / 2
ENDIF`;
  
  const lexer = new Lexer(source);
  const tokens = lexer.tokenize();
  
  // 特定の演算子の存在確認
  const tokenTypes = tokens.map(t => t.type);
  expect(tokenTypes).toContain(TokenType.GREATER_EQUAL);
  expect(tokenTypes).toContain(TokenType.AND);
  expect(tokenTypes).toContain(TokenType.NOT_EQUAL);
  expect(tokenTypes).toContain(TokenType.LEFT_PAREN);
  expect(tokenTypes).toContain(TokenType.RIGHT_PAREN);
  
  // 行番号の正確性確認
  const ifToken = tokens.find(t => t.type === TokenType.IF);
  expect(ifToken?.line).toBe(2);
  
  // 文字列値の正確性確認
  const stringToken = tokens.find(t => t.type === TokenType.STRING);
  expect(stringToken?.value).toBe('ready');
});
```
</details>

## 🏆 自己評価チェックリスト

- [ ] **初級**: トークンの基本概念と種類を理解している
- [ ] **中級**: エスケープシーケンスの処理方法を理解している
- [ ] **上級**: 複雑な式の字句解析プロセスを追跡できる

## 📚 次のステップ

字句解析を理解したら、次は**[構文解析器](./05_parser_ast.md)**でトークン列をAST（抽象構文木）に変換する方法を学びましょう。構文解析では、トークンの意味的な関係を理解し、プログラムの構造を表現する木構造を構築します。