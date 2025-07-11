# 01_lexer: 字句解析器の実装練習

## 📖 概要

字句解析器（Lexer）の実装を通して、プログラミング言語の最初の処理段階を学習します。

## 🎯 学習目標

- 文字列をトークンに分割する方法
- 字句解析のアルゴリズム
- エラーハンドリング
- パフォーマンス最適化

## 📂 ディレクトリ構成

```
01_lexer/
├── README.md              # このファイル
├── beginner/              # 🟢 初級問題
│   ├── BasicTokens.ts     # 基本トークンの認識
│   ├── BasicTokens.test.ts
│   ├── NumbersAndStrings.ts # 数値と文字列の処理
│   └── NumbersAndStrings.test.ts
├── intermediate/          # 🟡 中級問題
│   ├── ComplexOperators.ts # 複合演算子の処理
│   ├── ComplexOperators.test.ts
│   ├── EscapeSequences.ts  # エスケープシーケンス
│   └── EscapeSequences.test.ts
├── advanced/             # 🔴 上級問題
│   ├── ErrorRecovery.ts   # エラー回復機能
│   ├── ErrorRecovery.test.ts
│   ├── Performance.ts     # パフォーマンス最適化
│   └── Performance.test.ts
└── solutions/            # 解答例
    ├── beginner/
    ├── intermediate/
    └── advanced/
```

## 🚀 テスト実行方法

```bash
# 全ての01_lexer問題をテスト
npm test -- src/botscript/practice/01_lexer

# 特定の難易度のみ
npm test -- src/botscript/practice/01_lexer/beginner
npm test -- src/botscript/practice/01_lexer/intermediate
npm test -- src/botscript/practice/01_lexer/advanced

# 特定の問題のみ
npm test -- src/botscript/practice/01_lexer/beginner/BasicTokens.test.ts
```

## 📝 問題一覧

### 🟢 初級問題

#### BasicTokens.ts
基本的なトークン（キーワード、文字列、EOF）の認識を実装します。

**実装要件**:
- SAY, MOVEキーワードの認識
- 文字列リテラルの処理
- EOFトークンの追加
- 基本的なエラーハンドリング

#### NumbersAndStrings.ts
数値リテラルとより高度な文字列処理を実装します。

**実装要件**:
- 整数・小数の認識
- 変数（$variable）の処理
- エスケープシーケンス
- 演算子の認識

### 🟡 中級問題

#### ComplexOperators.ts
複合演算子（>=, <=, ==, !=, &&, ||）の処理を実装します。

**実装要件**:
- 先読み処理
- 複合演算子の区別
- 論理演算子の処理
- 詳細なエラーメッセージ

#### EscapeSequences.ts
高度なエスケープシーケンス処理を実装します。

**実装要件**:
- Unicode文字の処理
- 複雑なエスケープパターン
- エラー回復機能
- パフォーマンス最適化

### 🔴 上級問題

#### ErrorRecovery.ts
エラー回復機能とデバッグ機能を実装します。

**実装要件**:
- パニックモード回復
- 詳細なエラー報告
- デバッグ情報の保持
- 部分的な解析継続

#### Performance.ts
パフォーマンス最適化とメモリ効率化を実装します。

**実装要件**:
- キャッシュ機能
- メモリプールの使用
- ストリーミング処理
- プロファイリング機能

## ✅ 成功判定

各問題のテストがすべて通ると成功です！

```
✅ PASS src/botscript/practice/01_lexer/beginner/BasicTokens.test.ts
✅ PASS src/botscript/practice/01_lexer/beginner/NumbersAndStrings.test.ts
🎉 初級問題完了！
```

## 💡 実装のヒント

1. **段階的実装**: 簡単な機能から始める
2. **テスト駆動**: テストを読んで期待動作を理解
3. **デバッグ**: console.logで中間結果を確認
4. **ドキュメント**: [字句解析器の解説](/docs/04_lexer_tokenizer.md)を参照

## 📚 参考資料

- [字句解析器の詳細解説](/docs/04_lexer_tokenizer.md)
- [BotScript言語仕様](/docs/07_botscript_language_deep_dive.md)
- [エラーハンドリング戦略](/docs/06_interpreter_execution.md)

頑張って実装してください！🚀