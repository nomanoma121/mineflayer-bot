# 🎯 Mineflayer Bot プロジェクト練習ガイド

このガイドでは、Mineflayer Botプロジェクトの練習問題の使い方を説明します。

## 📋 練習問題の構成

各技術ディレクトリ（`01_architecture`, `02_design_patterns`など）には以下のファイルが含まれています：

### 🎯 難易度別練習問題
- **`easy.ts`** - 🟢 初級問題（基本的な実装）
- **`normal.ts`** - 🟡 中級問題（応用機能の実装）
- **`hard.ts`** - 🔴 上級問題（高度な機能・最適化）

### 📚 学習サポート
- **`answers.ts`** - 完全な解答実装
- **`check.test.ts`** - Jest テストスイート

## 🚀 練習の進め方

### 1. 📖 事前準備
```bash
# プロジェクトのクローンとセットアップ
git clone <repository-url>
cd mineflayer-bot
npm install

# 依存関係の確認
npm run build
```

### 2. 🎯 練習問題への取り組み

#### Step 1: 問題を選択
興味のある技術分野のディレクトリを選択します：
- `01_architecture` - システム設計の基礎
- `02_design_patterns` - デザインパターンの実装
- `03_botscript_overview` - 自作言語の基礎
- `04_lexer_tokenizer` - 字句解析器の実装
- `05_parser_ast` - 構文解析器とAST構築
- `06_interpreter_engine` - インタプリタエンジン
- `07_execution_context` - 実行コンテキスト
- `08_ability_system` - モジュラーシステム設計
- `11_testing_architecture` - テスト戦略

#### Step 2: 難易度を選択
自分のレベルに応じて練習問題を選択：

**🟢 初級者向け (`easy.ts`)**
- プログラミング基礎を理解している
- TypeScriptの基本構文がわかる
- 基本的なオブジェクト指向プログラミングの知識

**🟡 中級者向け (`normal.ts`)**
- デザインパターンの基本知識
- 非同期プログラミングの理解
- より複雑なアルゴリズムの実装経験

**🔴 上級者向け (`hard.ts`)**
- 高度なアーキテクチャ設計経験
- パフォーマンス最適化の知識
- 大規模システム開発経験

#### Step 3: 実装作業

1. **問題ファイルを開く**
   ```bash
   # 例: アーキテクチャの初級問題
   code docs/01_architecture/easy.ts
   ```

2. **TODOセクションを探す**
   各ファイルには `// TODO:` で始まるセクションがあります。これらを実装してください。

3. **ヒントを参考にする**
   各TODOには実装のヒントが含まれています：
   ```typescript
   /**
    * ユーザーを認証します
    */
   authenticate(username: string, password: string): boolean {
     // TODO: ユーザー認証の実装
     // ヒント1: パスワードハッシュの検証
     // ヒント2: セッション管理
     // ヒント3: エラーハンドリング
     
     return false; // 仮実装
   }
   ```

### 3. 🧪 テストによる確認

#### テストの実行
```bash
# 特定のディレクトリのテストを実行
npm test -- docs/01_architecture/check.test.ts

# すべての練習問題テストを実行
npm test -- docs/*/check.test.ts
```

#### テスト結果の理解
- ✅ **PASS** - 実装が正しい
- ❌ **FAIL** - 実装に問題がある
- 🔍 **詳細エラー** - どの部分が間違っているかを確認

#### 段階的な進め方
```typescript
// 1. まず基本的な実装
it('基本的な機能をテストする', () => {
  const result = yourImplementation();
  expect(result).toBeTruthy();
});

// 2. エッジケースのテスト
it('エラー処理をテストする', () => {
  expect(() => yourImplementation(null)).toThrow();
});

// 3. パフォーマンステスト
it('パフォーマンス要件を満たす', () => {
  const startTime = performance.now();
  yourImplementation();
  const endTime = performance.now();
  expect(endTime - startTime).toBeLessThan(100);
});
```

### 4. 📝 解答の確認

行き詰まった場合や実装を確認したい場合：

```bash
# 解答ファイルを参照
code docs/01_architecture/answers.ts
```

**⚠️ 学習効果を高めるために**
- まず自分で実装を試してください
- 解答は最後の手段として使用
- 解答を見た後は、理解した内容で再実装してみてください

## 🎓 学習パス推奨順序

### 👶 初心者向けパス
1. **01_architecture/easy.ts** - システム設計の基礎
2. **02_design_patterns/easy.ts** - 基本パターン
3. **08_ability_system/easy.ts** - モジュール設計
4. **11_testing_architecture/easy.ts** - テスト基礎

### 🎯 中級者向けパス
1. **03_botscript_overview/normal.ts** - 言語設計
2. **04_lexer_tokenizer/normal.ts** - 字句解析
3. **05_parser_ast/normal.ts** - 構文解析
4. **02_design_patterns/normal.ts** - 高度なパターン

### 🚀 上級者向けパス
1. **06_interpreter_engine/hard.ts** - 実行エンジン
2. **07_execution_context/hard.ts** - メモリ管理
3. **05_parser_ast/hard.ts** - 並列処理
4. **04_lexer_tokenizer/hard.ts** - 最適化

## 🔧 開発環境のセットアップ

### VSCode推奨設定
```json
{
  "typescript.preferences.includePackageJsonAutoImports": "auto",
  "typescript.suggest.completeFunctionCalls": true,
  "jest.jestCommandLine": "npm test --",
  "jest.autoRun": {
    "watch": false,
    "onStartup": ["all-tests"]
  }
}
```

### 便利なコマンド
```bash
# TypeScript型チェック
npm run typecheck

# コード整形
npm run format

# リント実行
npm run lint

# 特定のテストをwatch mode実行
npm test -- --watch docs/01_architecture/check.test.ts
```

## 📊 進捗追跡

### 完了チェックリスト
各ディレクトリの練習問題完了状況を追跡：

- [ ] 01_architecture
  - [ ] easy.ts
  - [ ] normal.ts
  - [ ] hard.ts
- [ ] 02_design_patterns
  - [ ] easy.ts
  - [ ] normal.ts
  - [ ] hard.ts
- [ ] 03_botscript_overview
  - [ ] easy.ts
  - [ ] normal.ts
  - [ ] hard.ts
- [ ] 04_lexer_tokenizer
  - [ ] easy.ts
  - [ ] normal.ts
  - [ ] hard.ts
- [ ] 05_parser_ast
  - [ ] easy.ts
  - [ ] normal.ts
  - [ ] hard.ts
- [ ] 06_interpreter_engine
  - [ ] easy.ts
  - [ ] normal.ts
  - [ ] hard.ts
- [ ] 07_execution_context
  - [ ] easy.ts
  - [ ] normal.ts
  - [ ] hard.ts
- [ ] 08_ability_system
  - [ ] easy.ts
  - [ ] normal.ts
  - [ ] hard.ts
- [ ] 11_testing_architecture
  - [ ] easy.ts
  - [ ] normal.ts
  - [ ] hard.ts

### 学習成果の確認
```bash
# 全テストの実行とカバレッジ確認
npm run test:coverage

# パフォーマンステストの実行
npm run test:performance
```

## 🤝 困った時のヒント

### 🐛 よくある問題と解決法

**Q: テストが通らない**
- エラーメッセージを詳しく読む
- 実装している関数のシグネチャを確認
- 戻り値の型が正しいかチェック

**Q: パフォーマンステストが失敗する**
- アルゴリズムの計算量を見直す
- 不要なループや処理を削除
- キャッシュやメモ化を活用

**Q: 型エラーが多数発生する**
- `npm run typecheck` で詳細確認
- インポート文の確認
- インターフェースの実装漏れをチェック

### 📚 追加学習リソース

- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **Jest Documentation**: https://jestjs.io/docs/getting-started
- **Node.js Documentation**: https://nodejs.org/en/docs/
- **Design Patterns**: GoFのデザインパターン書籍

## 🎉 学習完了後

### 次のステップ
1. **実際のMinecraftボット開発**: 学んだ知識を活用
2. **オープンソース貢献**: プロジェクトへの機能追加
3. **独自プロジェクト**: 自分なりのボットシステム構築

### 成果物の活用
- **ポートフォリオ**: 実装したコードをポートフォリオに追加
- **技術ブログ**: 学習過程や実装のポイントを記事化
- **チーム共有**: 学んだパターンやベストプラクティスを共有

---

**Happy Coding! 🚀**

このプロジェクトを通じて、実践的なソフトウェア開発スキルとアーキテクチャ設計能力を身につけましょう。