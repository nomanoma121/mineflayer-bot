# Mineflayer Bot プロジェクト解説ドキュメント

このディレクトリには、Mineflayer Botプロジェクトの詳細な技術解説が含まれています。

## 📚 ドキュメント構成

### 🏗️ アーキテクチャ・設計
- **[01_architecture/](./01_architecture/)** - プロジェクト全体のアーキテクチャ概要
- **[02_design_patterns/](./02_design_patterns/)** - 実装されているデザインパターンの詳細解説

### 🤖 BotScript言語システム (重点解説)
- **[03_botscript_overview/](./03_botscript_overview/)** - BotScript言語の概要と特徴
- **[04_lexer_tokenizer/](./04_lexer_tokenizer/)** - 字句解析器の実装詳細
- **[05_parser_ast/](./05_parser_ast/)** - 構文解析器とAST生成
- **[06_interpreter_engine/](./06_interpreter_engine/)** - インタプリタエンジンの核心部分
- **[07_execution_context/](./07_execution_context/)** - 実行コンテキストとスコープ管理

### 🎯 コア機能
- **[08_ability_system/](./08_ability_system/)** - モジュラーアビリティシステム

### 🧪 品質・テスト
- **[11_testing_architecture/](./11_testing_architecture/)** - テストアーキテクチャとモック戦略

## 🎯 学習の進め方

### 初心者向け推奨順序
1. [プロジェクト全体アーキテクチャ](./01_architecture/) - 全体像を把握
2. [BotScript言語概要](./03_botscript_overview/) - 自作言語の基礎概念
3. [字句解析器](./04_lexer_tokenizer/) - トークン化の仕組み
4. [構文解析器](./05_parser_ast/) - ASTの構築方法
5. [インタプリタエンジン](./06_interpreter_engine/) - 実行エンジンの核心

### 上級者向け
- [デザインパターン](./02_design_patterns/) - 高度な設計パターン
- [実行コンテキスト](./07_execution_context/) - スコープとメモリ管理
- [アビリティシステム](./08_ability_system/) - モジュラーコンポーネント設計

## 🔧 技術スタック

- **言語**: TypeScript
- **フレームワーク**: Node.js
- **Minecraft API**: Mineflayer
- **テスト**: Jest
- **設計パターン**: State, Command, Singleton, Facade
- **自作言語**: BotScript (完全実装)

## 📖 特に注目すべき技術的特徴

1. **完全な自作プログラミング言語** - 字句解析から実行まで全て自前実装
2. **型安全なAST設計** - TypeScriptの型システムを活用した堅牢な構文木
3. **モジュラーアビリティシステム** - 再利用可能なコンポーネント設計
4. **包括的テストスイート** - 312テストによる品質保証
5. **リアルタイムチャット統合** - Minecraftチャット経由での言語実行

## 🚀 このドキュメントの活用方法

各ドキュメントは以下の構成になっています：
- **概要**: 機能・目的の説明
- **技術詳細**: 実装の仕組み
- **コード解説**: 重要な箇所の詳細分析
- **設計判断**: なぜそのような実装にしたかの理由
- **学習ポイント**: 学習者が注目すべき点

自作言語やインタプリタ開発に興味がある方は、特にBotScript関連のドキュメント（03-07）に注目してください。