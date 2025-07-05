# Mineflayer Bot リファクタリング記録
## 設計パターンと実装の学習ポイント

### 📋 目次
1. [リファクタリング概要](#リファクタリング概要)
2. [State Pattern の改良](#state-pattern-の改良)
3. [責任の分離（Separation of Concerns）](#責任の分離)
4. [Utility Classes の活用](#utility-classes-の活用)
5. [エラーハンドリング戦略](#エラーハンドリング戦略)
6. [シングルトンパターンの改善](#シングルトンパターンの改善)
7. [具体的な実装例と解説](#具体的な実装例と解説)
8. [学習のまとめ](#学習のまとめ)

---

## リファクタリング概要

### 🎯 目的
- **責任の分離**: 各クラスが単一の責任を持つように設計
- **コードの重複排除**: 共通ロジックをユーティリティクラスに集約
- **拡張性の向上**: 新しい機能を追加しやすい設計
- **メンテナンス性の改善**: 理解しやすく、修正しやすいコード

### 📊 変更前後の比較
| 項目 | 変更前 | 変更後 |
|------|--------|--------|
| 戦闘ロジック | ServantState に内蔵 | AttackingState に分離 |
| エンティティ検索 | 各クラスで重複実装 | EntityUtils で統一 |
| エラーハンドリング | 個別対応 | CommandUtils で統一 |
| 状態遷移 | 固定的 | 動的な親状態指定 |

---

## State Pattern の改良

### 🔧 改良前の問題点
```typescript
// 変更前：ServantState.ts
class ServantState {
  tick() {
    // フォロー処理
    this.followOwner();
    
    // 脅威検出
    const threat = this.detectThreat();
    
    // 戦闘処理（問題：責任が混在）
    if (threat) {
      this.attackTarget(threat);
    }
  }
}
```

### ✅ 改良後の設計
```typescript
// 変更後：ServantState.ts
class ServantState {
  tick() {
    // フォロー処理のみに集中
    this.followOwner();
    
    // 脅威検出のみ実行
    const threat = EntityUtils.findNearestHostileMob(this.bot);
    
    // 戦闘は AttackingState に委譲
    if (threat) {
      this.bot.stateManager.setState(new AttackingState(this.bot, threat, this));
    }
  }
}
```

### 📚 学習ポイント
1. **単一責任の原則**: 各状態クラスは1つの責任のみを持つ
2. **委譲パターン**: 複雑な処理は専用クラスに委譲
3. **状態遷移の明確化**: どの状態からどの状態に遷移するかが明確

---

## 責任の分離

### 🎯 分離の指針
```typescript
// 変更前：すべてが混在
class ServantState {
  tick() {
    // フォロー処理
    if (this.owner) {
      const distance = this.bot.entity.position.distanceTo(this.owner.position);
      if (distance > 5) {
        this.bot.pathfinder.setGoal(new GoalFollow(this.owner, 3));
      }
    }
    
    // 脅威検出
    const hostileMobs = this.bot.entities;
    let nearestThreat = null;
    let minDistance = Infinity;
    for (const entity of Object.values(hostileMobs)) {
      if (entity.type === 'mob' && entity.mobType && 
          ['zombie', 'skeleton', 'spider'].includes(entity.mobType)) {
        const distance = this.bot.entity.position.distanceTo(entity.position);
        if (distance < minDistance && distance < 10) {
          nearestThreat = entity;
          minDistance = distance;
        }
      }
    }
    
    // 戦闘処理
    if (nearestThreat) {
      this.bot.attack(nearestThreat);
    }
  }
}
```

### ✅ 分離後の設計
```typescript
// ServantState: フォロー専用
class ServantState {
  tick() {
    this.followOwner();
    const threat = EntityUtils.findNearestHostileMob(this.bot);
    if (threat) {
      this.bot.stateManager.setState(new AttackingState(this.bot, threat, this));
    }
  }
}

// AttackingState: 戦闘専用
class AttackingState {
  constructor(bot, target, parentState = null) {
    this.parentState = parentState;
    // 戦闘終了後に親状態に戻る
  }
}

// EntityUtils: エンティティ操作専用
class EntityUtils {
  static findNearestHostileMob(bot, range = 10) {
    // 敵対MOB検索ロジック
  }
}
```

### 📚 学習ポイント
1. **関心の分離**: 各クラスが特定の関心事のみを扱う
2. **再利用性**: 分離されたロジックは他の場所でも再利用可能
3. **テスト容易性**: 単一の責任なのでテストが簡単

---

## Utility Classes の活用

### 🔧 EntityUtils の設計
```typescript
export class EntityUtils {
  /**
   * 最も近い敵対MOBを検索
   * @param bot - Mineflayer Bot インスタンス
   * @param range - 検索範囲（デフォルト10ブロック）
   * @returns 最も近い敵対MOB または null
   */
  static findNearestHostileMob(bot, range = 10) {
    const hostileMobs = ['zombie', 'skeleton', 'spider', 'creeper', 'enderman'];
    let nearestMob = null;
    let minDistance = Infinity;

    for (const entity of Object.values(bot.entities)) {
      if (entity.type === 'mob' && entity.mobType && 
          hostileMobs.includes(entity.mobType)) {
        const distance = this.getDistance(bot.entity, entity);
        if (distance < minDistance && distance <= range) {
          nearestMob = entity;
          minDistance = distance;
        }
      }
    }

    return nearestMob;
  }

  /**
   * 指定した名前のエンティティを検索
   * @param bot - Mineflayer Bot インスタンス
   * @param name - 検索する名前
   * @returns 見つかったエンティティ配列
   */
  static findEntitiesByName(bot, name) {
    const results = [];
    for (const entity of Object.values(bot.entities)) {
      const displayName = this.getDisplayName(entity);
      if (displayName.toLowerCase().includes(name.toLowerCase())) {
        results.push(entity);
      }
    }
    return results;
  }
}
```

### 🔧 CommandUtils の設計
```typescript
export class CommandUtils {
  /**
   * 引数の検証
   * @param args - 検証する引数配列
   * @param minLength - 最小引数数
   * @param errorMessage - エラーメッセージ
   * @returns 検証結果
   */
  static validateArgs(args, minLength, errorMessage) {
    if (args.length < minLength) {
      throw new Error(errorMessage);
    }
    return true;
  }

  /**
   * 統一されたエラーハンドリング
   * @param bot - Mineflayer Bot インスタンス
   * @param error - エラーオブジェクト
   * @param context - エラーコンテキスト
   */
  static handleError(bot, error, context = '') {
    const errorMessage = `${context}でエラーが発生しました: ${error.message}`;
    console.error(errorMessage);
    bot.chat(errorMessage);
  }

  /**
   * 統一されたログ出力
   * @param bot - Mineflayer Bot インスタンス
   * @param message - ログメッセージ
   * @param level - ログレベル
   */
  static log(bot, message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;
    console.log(logMessage);
    
    if (level === 'ERROR') {
      bot.chat(message);
    }
  }
}
```

### 📚 学習ポイント
1. **DRY原則**: Don't Repeat Yourself - 重複コードの排除
2. **Static Methods**: インスタンス化不要な純粋関数
3. **パラメータ化**: 設定可能な引数で柔軟性を確保

---

## エラーハンドリング戦略

### 🔧 統一されたエラーハンドリング
```typescript
// 変更前：各コマンドで個別対応
class KillCommand {
  execute(bot, args) {
    try {
      // 処理
    } catch (error) {
      bot.chat(`エラー: ${error.message}`);
      console.error(error);
    }
  }
}

class AttackCommand {
  execute(bot, args) {
    try {
      // 処理
    } catch (error) {
      bot.chat(`攻撃エラー: ${error.message}`);
      console.error(error);
    }
  }
}
```

### ✅ 統一後の設計
```typescript
// 変更後：CommandUtils で統一
class KillCommand {
  execute(bot, args) {
    try {
      CommandUtils.validateArgs(args, 1, '使用方法: !kill <対象名>');
      // 処理
    } catch (error) {
      CommandUtils.handleError(bot, error, 'Kill command');
    }
  }
}

class AttackCommand {
  execute(bot, args) {
    try {
      CommandUtils.validateArgs(args, 1, '使用方法: !attack <対象名>');
      // 処理
    } catch (error) {
      CommandUtils.handleError(bot, error, 'Attack command');
    }
  }
}
```

### 📚 学習ポイント
1. **一貫性**: 全体で統一されたエラーハンドリング
2. **再利用性**: 共通のエラー処理ロジック
3. **保守性**: エラーハンドリングの変更が一箇所で済む

---

## シングルトンパターンの改善

### 🔧 変更前の問題
```typescript
// 変更前：グローバルシングルトン
class IdleState {
  private static instance: IdleState;
  
  static getInstance(bot: any): IdleState {
    if (!IdleState.instance) {
      IdleState.instance = new IdleState(bot);
    }
    return IdleState.instance;
  }
}
```

**問題点:**
- 複数のBotで同じインスタンスを共有
- Bot固有の状態が混在する可能性

### ✅ 改善後の設計
```typescript
// 変更後：Bot毎のシングルトン
class IdleState {
  private static instances: Map<string, IdleState> = new Map();
  
  static getInstance(bot: any): IdleState {
    const botId = bot.username || bot.id || 'default';
    
    if (!IdleState.instances.has(botId)) {
      IdleState.instances.set(botId, new IdleState(bot));
    }
    
    return IdleState.instances.get(botId);
  }
}
```

### 📚 学習ポイント
1. **適切なスコープ**: シングルトンの適用範囲を明確に
2. **マルチインスタンス対応**: 複数のBotに対応
3. **Map活用**: キーベースのインスタンス管理

---

## 具体的な実装例と解説

### 🎯 AttackingState の親状態管理
```typescript
export class AttackingState {
  constructor(bot, target, parentState = null) {
    this.bot = bot;
    this.target = target;
    this.parentState = parentState; // 親状態を保持
    this.attackStartTime = Date.now();
    this.maxAttackDuration = 30000; // 30秒でタイムアウト
  }

  tick() {
    // 戦闘処理
    if (this.shouldStopAttacking()) {
      this.returnToParentState();
      return;
    }
    
    this.performAttack();
  }

  private returnToParentState() {
    const nextState = this.parentState || IdleState.getInstance(this.bot);
    this.bot.stateManager.setState(nextState);
  }
}
```

**設計の特徴:**
1. **柔軟な状態遷移**: 親状態に戻るか、デフォルト状態に移行
2. **タイムアウト機能**: 無限ループを防ぐ安全機構
3. **責任の明確化**: 戦闘後の状態遷移を適切に管理

### 🎯 Command Pattern の活用
```typescript
// BaseCommand: 共通の基底クラス
export class BaseCommand {
  protected validateAndExecute(bot, args, minArgs, usage, executeLogic) {
    try {
      CommandUtils.validateArgs(args, minArgs, usage);
      return executeLogic();
    } catch (error) {
      CommandUtils.handleError(bot, error, this.constructor.name);
    }
  }
}

// KillCommand: 具体的な実装
export class KillCommand extends BaseCommand {
  execute(bot, args) {
    return this.validateAndExecute(
      bot, 
      args, 
      1, 
      '使用方法: !kill <対象名>',
      () => {
        const targetName = args[0];
        const targets = EntityUtils.findEntitiesByName(bot, targetName);
        
        if (targets.length === 0) {
          throw new Error(`対象 "${targetName}" が見つかりません`);
        }
        
        const target = targets[0];
        const currentState = bot.stateManager.getCurrentState();
        bot.stateManager.setState(new AttackingState(bot, target, currentState));
        
        CommandUtils.log(bot, `${EntityUtils.getDisplayName(target)} を攻撃開始`);
      }
    );
  }
}
```

**設計の特徴:**
1. **Template Method Pattern**: 共通処理を基底クラスに実装
2. **Higher-Order Functions**: 実行ロジックを関数として渡す
3. **一貫性**: 全コマンドで同じ処理フロー

---

## 学習のまとめ

### 🎯 重要な設計原則
1. **単一責任の原則 (SRP)**: 各クラスは1つの責任のみを持つ
2. **開放閉鎖の原則 (OCP)**: 拡張に開放的、修正に閉鎖的
3. **依存性逆転の原則 (DIP)**: 抽象に依存し、具象に依存しない

### 🔧 実践的なパターン
1. **State Pattern**: 状態管理の複雑さを解決
2. **Command Pattern**: 操作のカプセル化
3. **Utility Classes**: 共通機能の集約
4. **Template Method**: 共通処理の抽象化

### 📊 リファクタリングの効果
| 指標 | 改善度 | 説明 |
|------|--------|------|
| 可読性 | ⭐⭐⭐⭐⭐ | 各クラスの役割が明確 |
| 保守性 | ⭐⭐⭐⭐⭐ | 修正箇所が限定的 |
| 拡張性 | ⭐⭐⭐⭐⭐ | 新機能追加が容易 |
| テスト性 | ⭐⭐⭐⭐⭐ | 単体テストが書きやすい |

### 🚀 今後の改善点
1. **型安全性**: TypeScriptの型システムをより活用
2. **非同期処理**: Promise/async-awaitの適切な使用
3. **設定の外部化**: 設定ファイルによる動的な設定
4. **ログ機能**: より詳細なログ出力システム

---

## 実装時の注意点

### ⚠️ 注意すべきポイント
1. **循環参照**: モジュール間の相互依存を避ける
2. **メモリリーク**: 適切なリソース管理
3. **例外安全性**: すべての例外をキャッチ
4. **パフォーマンス**: 不要な処理の排除

### ✅ ベストプラクティス
1. **早期リターン**: ネストを浅く保つ
2. **命名規則**: 意図を明確に表現
3. **コメント**: なぜそうしたかを説明
4. **テスト**: 動作確認を怠らない

このリファクタリングを通じて、オブジェクト指向設計の重要性と実践的な設計パターンの活用方法を深く理解できました。特に、責任の分離と適切な抽象化により、コードの品質を大幅に向上させることができました。