# テストアーキテクチャ - 包括的品質保証戦略

## 📖 テストアーキテクチャ概要

このプロジェクトは、**312のテストケースによる包括的品質保証システム**を構築しています。単体テストから統合テスト、パフォーマンステストまで、多層的なテスト戦略により、高品質なソフトウェア開発を実現しています。

## 🎯 テスト戦略

### テスト階層構造

```
テスト階層                   テスト数    カバレッジ対象               責務
─────────────────────────────────────────────────────────────────────
Unit Tests              ~200     個別クラス・メソッド        機能の正確性
Integration Tests       ~50      コンポーネント間連携        相互作用の検証
System Tests           ~30      エンドツーエンド動作        全体動作の確認
Performance Tests      ~32      実行時間・メモリ効率        性能要件の検証
─────────────────────────────────────────────────────────────────────
合計                   312      全システム                  品質保証
```

### テスト分類マトリクス

| テスト種類 | 実行頻度 | 実行タイミング | フィードバック時間 | 目的 |
|-----------|---------|---------------|-----------------|------|
| **Unit Tests** | 毎コミット | 開発中 | 秒単位 | バグの早期発見 |
| **Integration Tests** | 毎プッシュ | CI/CD | 分単位 | 連携問題の検出 |
| **System Tests** | 毎リリース | リリース前 | 時間単位 | 全体動作確認 |
| **Performance Tests** | 週次 | 定期実行 | 時間単位 | 性能劣化の監視 |

## 🧪 モック戦略

### MinecraftBotMock（中央モック）

プロジェクト全体で使用される包括的なmineflayerボットモック：

```typescript
// src/__mocks__/MinecraftBotMock.ts
export const createMockBot = (): any => {
  const mockBot = {
    // 基本プロパティ
    username: 'TestBot',
    health: 20,
    food: 20,
    foodSaturation: 5,
    
    // 位置情報
    entity: {
      position: { x: 0, y: 64, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      yaw: 0,
      pitch: 0,
      onGround: true
    },
    
    // 時間システム
    time: {
      timeOfDay: 6000,
      day: 1,
      doDaylightCycle: true,
      bigTime: BigInt(6000),
      time: 6000,
      age: 1000,
      isDay: true,
      moonPhase: 0,
      bigAge: BigInt(1000)
    },
    
    // 経験値システム
    experience: {
      level: 30,
      points: 825,
      total: 1395 // レベル30の総経験値
    },
    
    // 環境状態
    isRaining: false,
    thunderState: 0,
    
    // プレイヤー管理
    players: new Map(),
    
    // エンティティ管理
    entities: {},
    
    // インベントリシステム
    inventory: {
      items: jest.fn(() => []),
      count: jest.fn(() => 0),
      findItem: jest.fn(() => null),
      findItems: jest.fn(() => []),
      slots: Array(45).fill(null)
    },
    
    // 装備システム
    equipment: Array(6).fill(null),
    
    // チャット機能
    chat: jest.fn(),
    
    // アクション機能
    attack: jest.fn().mockResolvedValue(undefined),
    dig: jest.fn().mockResolvedValue(undefined),
    placeBlock: jest.fn().mockResolvedValue(undefined),
    equip: jest.fn().mockResolvedValue(undefined),
    consume: jest.fn().mockResolvedValue(undefined),
    toss: jest.fn().mockResolvedValue(undefined),
    
    // ワールド情報
    world: {
      raycast: jest.fn(() => null)
    },
    
    // pathfinder機能（mineflayer-pathfinder）
    pathfinder: {
      setMovements: jest.fn(),
      setGoal: jest.fn(),
      goto: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn()
    },
    
    // ブロック情報
    blockAt: jest.fn().mockReturnValue({
      name: 'air',
      type: 0,
      position: { x: 0, y: 64, z: 0 },
      light: 15
    }),
    
    // イベントシステム
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    once: jest.fn(),
    
    // 接続状態
    _client: {
      state: 'play'
    }
  };
  
  return mockBot;
};

/**
 * 特定の状況をシミュレートするモック
 */
export const createLowHealthBot = (): any => {
  const bot = createMockBot();
  bot.health = 3;
  bot.food = 2;
  return bot;
};

export const createRichInventoryBot = (): any => {
  const bot = createMockBot();
  bot.inventory.items.mockReturnValue([
    { name: 'diamond_sword', count: 1, durabilityUsed: 0, maxDurability: 1561 },
    { name: 'bread', count: 64 },
    { name: 'iron_pickaxe', count: 1, durabilityUsed: 50, maxDurability: 250 }
  ]);
  return bot;
};

export const createNightTimeBot = (): any => {
  const bot = createMockBot();
  bot.time.timeOfDay = 18000; // 夜中
  bot.time.isDay = false;
  return bot;
};
```

### 階層別モック戦略

#### 1. Unit Test レベル

```typescript
// 最小限のモック：テスト対象のクラスのみ
describe('VitalsAbility', () => {
  let mockBot: any;
  let vitalsAbility: VitalsAbility;

  beforeEach(() => {
    mockBot = createMockBot();
    vitalsAbility = new VitalsAbility(mockBot);
  });

  test('should detect low health', () => {
    mockBot.health = 3;
    expect(vitalsAbility.isHealthLow()).toBe(true);
  });

  test('should detect normal health', () => {
    mockBot.health = 15;
    expect(vitalsAbility.isHealthLow()).toBe(false);
  });
});
```

#### 2. Integration Test レベル

```typescript
// 複数コンポーネントのモック：依存関係を含む
describe('Bot Integration', () => {
  let mockBot: any;
  let bot: Bot;
  let commandHandler: CommandHandler;

  beforeEach(() => {
    mockBot = createMockBot();
    bot = new Bot(mockBot);
    commandHandler = new CommandHandler(bot);
  });

  test('should handle go command with state change', async () => {
    commandHandler.registerCommand('go', new GoCommand());
    
    await commandHandler.handleMessage('player', '@bot go 100 64 200');
    
    expect(bot.getCurrentState().getName()).toBe('Moving');
    expect(mockBot.pathfinder.goto).toHaveBeenCalled();
  });
});
```

#### 3. System Test レベル

```typescript
// 全システムモック：実際の使用シナリオ
describe('BotScript System Tests', () => {
  let mockBot: any;
  let bot: Bot;
  let interpreter: Interpreter;

  beforeEach(() => {
    mockBot = createMockBot();
    bot = new Bot(mockBot);
    interpreter = new Interpreter(bot, new ExecutionContext());
  });

  test('complete farming scenario', async () => {
    const script = `
      DEF $crops_harvested = 0
      REPEAT 10
        DIG "wheat"
        SET $crops_harvested = $crops_harvested + 1
        SAY "Harvested: " + $crops_harvested
        WAIT 0.01
      ENDREPEAT
      SAY "Farming complete!"
    `;

    const result = await executeScript(interpreter, script);
    
    expect(result.type).toBe(ExecutionResultType.SUCCESS);
    expect(mockBot.chat).toHaveBeenCalledWith('Farming complete!');
    expect(mockBot.dig).toHaveBeenCalledTimes(10);
  });
});
```

## 🏗️ テストユーティリティ

### スクリプト実行ヘルパー

```typescript
// src/botscript/__tests__/utils/ScriptExecutor.ts
export async function executeScript(
  interpreter: Interpreter, 
  sourceCode: string,
  timeout = 5000
): Promise<ExecutionResult> {
  const lexer = new Lexer(sourceCode);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const ast = parser.parse();
  
  return await interpreter.executeWithTimeout(ast, timeout);
}

export function createTestAST(statements: StatementNode[]): ProgramNode {
  return {
    type: 'Program',
    statements
  };
}

export function createSayStatement(message: string): SayCommandNode {
  return {
    type: 'SayCommand',
    message: {
      type: 'StringLiteral',
      value: message
    }
  };
}

export function createVariableDeclaration(name: string, value: any): VariableDeclarationNode {
  return {
    type: 'VariableDeclaration',
    name,
    initializer: {
      type: typeof value === 'number' ? 'NumberLiteral' : 'StringLiteral',
      value
    }
  };
}
```

### アサーションヘルパー

```typescript
// src/__tests__/utils/Assertions.ts
export class BotAssertions {
  constructor(private mockBot: any) {}

  expectSaid(message: string): void {
    expect(this.mockBot.chat).toHaveBeenCalledWith(message);
  }

  expectSaidContaining(substring: string): void {
    const calls = this.mockBot.chat.mock.calls;
    const found = calls.some((call: any) => call[0].includes(substring));
    expect(found).toBe(true);
  }

  expectMovedTo(x: number, y: number, z: number): void {
    expect(this.mockBot.pathfinder.goto).toHaveBeenCalledWith(
      expect.objectContaining({
        x: expect.closeTo(x, 1),
        y: expect.closeTo(y, 1),
        z: expect.closeTo(z, 1)
      })
    );
  }

  expectEquipped(item: string, slot: string): void {
    expect(this.mockBot.equip).toHaveBeenCalledWith(
      expect.objectContaining({ name: item }),
      slot
    );
  }

  expectAttacked(target?: string): void {
    if (target) {
      expect(this.mockBot.attack).toHaveBeenCalledWith(
        expect.objectContaining({ name: target })
      );
    } else {
      expect(this.mockBot.attack).toHaveBeenCalled();
    }
  }
}

// 使用例
test('complex bot interaction', async () => {
  const mockBot = createMockBot();
  const assertions = new BotAssertions(mockBot);
  
  await executeComplexScenario(mockBot);
  
  assertions.expectSaid('Hello World');
  assertions.expectMovedTo(100, 64, 200);
  assertions.expectEquipped('diamond_sword', 'hand');
});
```

## 📊 パフォーマンステスト

### 実行時間測定

```typescript
// src/__tests__/performance/ExecutionTime.test.ts
describe('BotScript Performance Tests', () => {
  let interpreter: Interpreter;
  let mockBot: any;

  beforeEach(() => {
    mockBot = createMockBot();
    interpreter = new Interpreter(mockBot, new ExecutionContext());
  });

  test('simple script execution should be fast', async () => {
    const script = 'SAY "Hello World"';
    
    const startTime = performance.now();
    const result = await executeScript(interpreter, script);
    const executionTime = performance.now() - startTime;
    
    expect(result.type).toBe(ExecutionResultType.SUCCESS);
    expect(executionTime).toBeLessThan(50); // 50ms以内
  });

  test('complex script should complete within reasonable time', async () => {
    const script = `
      REPEAT 100
        DEF $temp = $loop_index * 2
        IF $temp > 50 THEN
          SAY "Large number: " + $temp
        ENDIF
      ENDREPEAT
    `;
    
    const startTime = performance.now();
    const result = await executeScript(interpreter, script);
    const executionTime = performance.now() - startTime;
    
    expect(result.type).toBe(ExecutionResultType.SUCCESS);
    expect(executionTime).toBeLessThan(200); // 200ms以内
  });

  test('lexer performance with large input', () => {
    const largeScript = 'SAY "test"\n'.repeat(1000);
    
    const startTime = performance.now();
    const lexer = new Lexer(largeScript);
    const tokens = lexer.tokenize();
    const lexingTime = performance.now() - startTime;
    
    expect(tokens.length).toBeGreaterThan(2000);
    expect(lexingTime).toBeLessThan(100); // 100ms以内
  });
});
```

### メモリ使用量テスト

```typescript
// src/__tests__/performance/Memory.test.ts
describe('Memory Usage Tests', () => {
  test('execution context should not leak memory', async () => {
    const measureMemory = () => {
      if (global.gc) {
        global.gc();
      }
      return process.memoryUsage().heapUsed;
    };

    const initialMemory = measureMemory();
    
    // 大量の変数を作成
    for (let i = 0; i < 1000; i++) {
      const context = new ExecutionContext();
      for (let j = 0; j < 100; j++) {
        context.setVariable(`$var${j}`, `value${j}`);
      }
      context.cleanup();
    }
    
    const finalMemory = measureMemory();
    const memoryIncrease = finalMemory - initialMemory;
    
    // メモリ増加が許容範囲内であることを確認
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB未満
  });

  test('state instances should be reused (singleton)', () => {
    const instance1 = IdleState.getInstance();
    const instance2 = IdleState.getInstance();
    const instance3 = IdleState.getInstance();
    
    expect(instance1).toBe(instance2);
    expect(instance2).toBe(instance3);
  });
});
```

## 🔧 テスト設定とCI/CD

### Jest設定

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // テストファイルパターン
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/*.test.ts'
  ],
  
  // カバレッジ設定
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // セットアップファイル
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  
  // モックファイル
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // テストタイムアウト
  testTimeout: 10000,
  
  // パフォーマンステスト用の設定
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json'
    }
  }
};
```

### テストセットアップ

```typescript
// src/__tests__/setup.ts
import 'jest-extended';

// グローバルモックの設定
jest.mock('mineflayer', () => ({
  createBot: jest.fn(() => createMockBot())
}));

// カスタムマッチャーの定義
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false
      };
    }
  },

  toHaveExecutedSuccessfully(received: ExecutionResult) {
    const pass = received.type === ExecutionResultType.SUCCESS;
    return {
      message: () => pass 
        ? `expected execution not to succeed`
        : `expected execution to succeed, but got: ${received.message}`,
      pass
    };
  }
});

// テストデータクリーンアップ
afterEach(() => {
  jest.clearAllMocks();
});

// パフォーマンステスト用のヘルパー
global.performance = global.performance || {
  now: () => Date.now()
};
```

### GitHub Actions CI/CD

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run type checking
      run: npm run type-check
    
    - name: Run unit tests
      run: npm run test:unit
    
    - name: Run integration tests
      run: npm run test:integration
    
    - name: Run performance tests
      run: npm run test:performance
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
    
    - name: Build project
      run: npm run build
```

## 📈 テストメトリクス監視

### カバレッジレポート

```typescript
// scripts/coverage-report.ts
export class CoverageAnalyzer {
  public static generateReport(): CoverageReport {
    const coverageData = require('../coverage/coverage-final.json');
    
    const summary = {
      totalFiles: Object.keys(coverageData).length,
      averageCoverage: this.calculateAverageCoverage(coverageData),
      uncoveredFiles: this.findUncoveredFiles(coverageData),
      hotspots: this.findComplexityHotspots(coverageData)
    };
    
    return summary;
  }
  
  private static calculateAverageCoverage(data: any): CoverageMetrics {
    let totalLines = 0;
    let coveredLines = 0;
    let totalFunctions = 0;
    let coveredFunctions = 0;
    
    Object.values(data).forEach((file: any) => {
      totalLines += Object.keys(file.s).length;
      coveredLines += Object.values(file.s).filter(hits => hits > 0).length;
      totalFunctions += Object.keys(file.f).length;
      coveredFunctions += Object.values(file.f).filter(hits => hits > 0).length;
    });
    
    return {
      lines: (coveredLines / totalLines) * 100,
      functions: (coveredFunctions / totalFunctions) * 100,
      branches: this.calculateBranchCoverage(data),
      statements: this.calculateStatementCoverage(data)
    };
  }
}
```

### テスト実行統計

```typescript
// src/__tests__/utils/TestMetrics.ts
export class TestMetrics {
  private static testResults: TestResult[] = [];
  
  public static recordTest(name: string, duration: number, status: 'pass' | 'fail'): void {
    this.testResults.push({
      name,
      duration,
      status,
      timestamp: Date.now()
    });
  }
  
  public static generateMetrics(): TestSuiteMetrics {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(t => t.status === 'pass').length;
    const averageDuration = this.testResults.reduce((sum, t) => sum + t.duration, 0) / totalTests;
    const slowestTests = this.testResults
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);
    
    return {
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      successRate: (passedTests / totalTests) * 100,
      averageDuration,
      totalDuration: this.testResults.reduce((sum, t) => sum + t.duration, 0),
      slowestTests
    };
  }
  
  public static findFlaky Tests(): TestResult[] {
    // 失敗率が10-90%のテストを不安定と判定
    const testGroups = this.groupTestsByName();
    const flakyTests: TestResult[] = [];
    
    Object.entries(testGroups).forEach(([name, results]) => {
      const failures = results.filter(r => r.status === 'fail').length;
      const failureRate = failures / results.length;
      
      if (failureRate > 0.1 && failureRate < 0.9) {
        flakyTests.push(...results);
      }
    });
    
    return flakyTests;
  }
}
```

## 📝 練習問題

### 🟢 初級問題
**問題**: VitalsAbility クラスの `eatFood()` メソッドのテストケースを作成してください。成功パターン、食べ物がない場合、装備に失敗した場合の3つのシナリオをテストしてください。

<details>
<summary>解答例</summary>

```typescript
describe('VitalsAbility.eatFood()', () => {
  let mockBot: any;
  let vitalsAbility: VitalsAbility;

  beforeEach(() => {
    mockBot = createMockBot();
    vitalsAbility = new VitalsAbility(mockBot);
  });

  test('should successfully eat food when available', async () => {
    // Arrange
    const breadItem = { name: 'bread', count: 1 };
    mockBot.inventory.findItem = jest.fn().mockReturnValue(breadItem);
    mockBot.equip = jest.fn().mockResolvedValue(undefined);
    mockBot.consume = jest.fn().mockResolvedValue(undefined);

    // Act
    const result = await vitalsAbility.eatFood();

    // Assert
    expect(result).toBe(true);
    expect(mockBot.equip).toHaveBeenCalledWith(breadItem, 'hand');
    expect(mockBot.consume).toHaveBeenCalled();
  });

  test('should return false when no food is available', async () => {
    // Arrange
    mockBot.inventory.findItem = jest.fn().mockReturnValue(null);

    // Act
    const result = await vitalsAbility.eatFood();

    // Assert
    expect(result).toBe(false);
    expect(mockBot.equip).not.toHaveBeenCalled();
    expect(mockBot.consume).not.toHaveBeenCalled();
  });

  test('should handle equipment failure gracefully', async () => {
    // Arrange
    const breadItem = { name: 'bread', count: 1 };
    mockBot.inventory.findItem = jest.fn().mockReturnValue(breadItem);
    mockBot.equip = jest.fn().mockRejectedValue(new Error('Cannot equip'));

    // Act
    const result = await vitalsAbility.eatFood();

    // Assert
    expect(result).toBe(false);
    expect(mockBot.equip).toHaveBeenCalledWith(breadItem, 'hand');
    expect(mockBot.consume).not.toHaveBeenCalled();
  });

  test('should handle consumption failure gracefully', async () => {
    // Arrange
    const breadItem = { name: 'bread', count: 1 };
    mockBot.inventory.findItem = jest.fn().mockReturnValue(breadItem);
    mockBot.equip = jest.fn().mockResolvedValue(undefined);
    mockBot.consume = jest.fn().mockRejectedValue(new Error('Cannot consume'));

    // Act
    const result = await vitalsAbility.eatFood();

    // Assert
    expect(result).toBe(false);
    expect(mockBot.equip).toHaveBeenCalled();
    expect(mockBot.consume).toHaveBeenCalled();
  });
});
```
</details>

### 🟡 中級問題
**問題**: BotScript の IF文の実行をテストする統合テストを作成してください。条件が真・偽の場合、ネストしたIF文、ELSE分岐を含む包括的なテストスイートを実装してください。

<details>
<summary>解答例</summary>

```typescript
describe('BotScript IF Statement Integration Tests', () => {
  let mockBot: any;
  let interpreter: Interpreter;
  let context: ExecutionContext;

  beforeEach(() => {
    mockBot = createMockBot();
    context = new ExecutionContext();
    interpreter = new Interpreter(mockBot, context);
  });

  describe('Simple IF statements', () => {
    test('should execute THEN branch when condition is true', async () => {
      const script = `
        DEF $health = 15
        IF $health > 10 THEN
          SAY "Health is good"
        ENDIF
      `;

      const result = await executeScript(interpreter, script);

      expect(result).toHaveExecutedSuccessfully();
      expect(mockBot.chat).toHaveBeenCalledWith('Health is good');
    });

    test('should skip THEN branch when condition is false', async () => {
      const script = `
        DEF $health = 5
        IF $health > 10 THEN
          SAY "Health is good"
        ENDIF
        SAY "End of script"
      `;

      const result = await executeScript(interpreter, script);

      expect(result).toHaveExecutedSuccessfully();
      expect(mockBot.chat).not.toHaveBeenCalledWith('Health is good');
      expect(mockBot.chat).toHaveBeenCalledWith('End of script');
    });
  });

  describe('IF-ELSE statements', () => {
    test('should execute ELSE branch when condition is false', async () => {
      const script = `
        DEF $health = 5
        IF $health > 10 THEN
          SAY "Health is good"
        ELSE
          SAY "Health is low"
        ENDIF
      `;

      const result = await executeScript(interpreter, script);

      expect(result).toHaveExecutedSuccessfully();
      expect(mockBot.chat).not.toHaveBeenCalledWith('Health is good');
      expect(mockBot.chat).toHaveBeenCalledWith('Health is low');
    });

    test('should execute THEN branch and skip ELSE when condition is true', async () => {
      const script = `
        DEF $health = 15
        IF $health > 10 THEN
          SAY "Health is good"
        ELSE
          SAY "Health is low"
        ENDIF
      `;

      const result = await executeScript(interpreter, script);

      expect(result).toHaveExecutedSuccessfully();
      expect(mockBot.chat).toHaveBeenCalledWith('Health is good');
      expect(mockBot.chat).not.toHaveBeenCalledWith('Health is low');
    });
  });

  describe('Nested IF statements', () => {
    test('should handle nested IF statements correctly', async () => {
      const script = `
        DEF $health = 15
        DEF $food = 8
        IF $health > 10 THEN
          SAY "Health is good"
          IF $food < 10 THEN
            SAY "But food is low"
          ELSE
            SAY "Food is also good"
          ENDIF
        ELSE
          SAY "Health is low"
        ENDIF
      `;

      const result = await executeScript(interpreter, script);

      expect(result).toHaveExecutedSuccessfully();
      expect(mockBot.chat).toHaveBeenCalledWith('Health is good');
      expect(mockBot.chat).toHaveBeenCalledWith('But food is low');
      expect(mockBot.chat).not.toHaveBeenCalledWith('Food is also good');
      expect(mockBot.chat).not.toHaveBeenCalledWith('Health is low');
    });

    test('should handle deeply nested IF statements', async () => {
      const script = `
        DEF $level = 3
        IF $level >= 1 THEN
          SAY "Level 1"
          IF $level >= 2 THEN
            SAY "Level 2"
            IF $level >= 3 THEN
              SAY "Level 3"
            ENDIF
          ENDIF
        ENDIF
      `;

      const result = await executeScript(interpreter, script);

      expect(result).toHaveExecutedSuccessfully();
      expect(mockBot.chat).toHaveBeenCalledWith('Level 1');
      expect(mockBot.chat).toHaveBeenCalledWith('Level 2');
      expect(mockBot.chat).toHaveBeenCalledWith('Level 3');
    });
  });

  describe('Complex conditions', () => {
    test('should handle AND conditions', async () => {
      const script = `
        DEF $health = 15
        DEF $food = 12
        IF $health > 10 AND $food > 10 THEN
          SAY "Both health and food are good"
        ELSE
          SAY "Something is low"
        ENDIF
      `;

      const result = await executeScript(interpreter, script);

      expect(result).toHaveExecutedSuccessfully();
      expect(mockBot.chat).toHaveBeenCalledWith('Both health and food are good');
    });

    test('should handle OR conditions', async () => {
      const script = `
        DEF $health = 5
        DEF $food = 15
        IF $health < 10 OR $food < 10 THEN
          SAY "Something needs attention"
        ELSE
          SAY "Everything is fine"
        ENDIF
      `;

      const result = await executeScript(interpreter, script);

      expect(result).toHaveExecutedSuccessfully();
      expect(mockBot.chat).toHaveBeenCalledWith('Something needs attention');
    });

    test('should handle complex expressions with parentheses', async () => {
      const script = `
        DEF $a = 5
        DEF $b = 10
        DEF $c = 15
        IF ($a + $b) > $c OR $a > $c THEN
          SAY "Complex condition met"
        ELSE
          SAY "Complex condition not met"
        ENDIF
      `;

      const result = await executeScript(interpreter, script);

      expect(result).toHaveExecutedSuccessfully();
      expect(mockBot.chat).toHaveBeenCalledWith('Complex condition not met');
    });
  });

  describe('Variable scope in IF statements', () => {
    test('should handle variable scope correctly', async () => {
      const script = `
        DEF $global_var = "global"
        IF TRUE THEN
          DEF $if_var = "if_scope"
          SAY $global_var
          SAY $if_var
        ENDIF
        SAY $global_var
      `;

      const result = await executeScript(interpreter, script);

      expect(result).toHaveExecutedSuccessfully();
      expect(mockBot.chat).toHaveBeenCalledWith('global');
      expect(mockBot.chat).toHaveBeenCalledWith('if_scope');
    });
  });
});
```
</details>

### 🔴 上級問題
**問題**: 全システムを対象とした負荷テストフレームワークを作成してください。同時実行、メモリリーク検出、パフォーマンス劣化の監視を含む包括的なテストスイートを実装してください。

<details>
<summary>解答例</summary>

```typescript
// src/__tests__/performance/LoadTest.framework.ts
export class LoadTestFramework {
  private scenarios: LoadTestScenario[] = [];
  private results: LoadTestResult[] = [];
  private monitoring = new PerformanceMonitor();

  /**
   * 負荷テストシナリオの登録
   */
  public addScenario(scenario: LoadTestScenario): void {
    this.scenarios.push(scenario);
  }

  /**
   * 全シナリオの実行
   */
  public async runAllScenarios(): Promise<LoadTestSummary> {
    console.log(`[LoadTest] Starting ${this.scenarios.length} scenarios...`);
    
    const summary: LoadTestSummary = {
      totalScenarios: this.scenarios.length,
      successfulScenarios: 0,
      failedScenarios: 0,
      totalDuration: 0,
      averageMemoryUsage: 0,
      peakMemoryUsage: 0,
      memoryLeaks: [],
      performanceDegradation: []
    };

    for (const scenario of this.scenarios) {
      try {
        const result = await this.runScenario(scenario);
        this.results.push(result);
        
        if (result.success) {
          summary.successfulScenarios++;
        } else {
          summary.failedScenarios++;
        }
        
        summary.totalDuration += result.duration;
        
      } catch (error) {
        console.error(`[LoadTest] Scenario ${scenario.name} failed: ${error}`);
        summary.failedScenarios++;
      }
    }

    summary.averageMemoryUsage = this.calculateAverageMemoryUsage();
    summary.peakMemoryUsage = this.monitoring.getPeakMemoryUsage();
    summary.memoryLeaks = this.detectMemoryLeaks();
    summary.performanceDegradation = this.detectPerformanceDegradation();

    return summary;
  }

  /**
   * 個別シナリオの実行
   */
  private async runScenario(scenario: LoadTestScenario): Promise<LoadTestResult> {
    console.log(`[LoadTest] Running scenario: ${scenario.name}`);
    
    const startTime = performance.now();
    const startMemory = this.monitoring.getCurrentMemoryUsage();
    
    try {
      // 同時実行のセットアップ
      const promises: Promise<any>[] = [];
      
      for (let i = 0; i < scenario.concurrentUsers; i++) {
        promises.push(this.simulateUser(scenario, i));
      }

      // 全ユーザーの完了を待機
      await Promise.all(promises);
      
      const endTime = performance.now();
      const endMemory = this.monitoring.getCurrentMemoryUsage();
      
      return {
        scenarioName: scenario.name,
        success: true,
        duration: endTime - startTime,
        memoryUsed: endMemory - startMemory,
        concurrentUsers: scenario.concurrentUsers,
        operationsCompleted: scenario.operationsPerUser * scenario.concurrentUsers,
        averageResponseTime: this.calculateAverageResponseTime(scenario.name),
        throughput: this.calculateThroughput(scenario),
        errors: []
      };
      
    } catch (error) {
      return {
        scenarioName: scenario.name,
        success: false,
        duration: performance.now() - startTime,
        memoryUsed: this.monitoring.getCurrentMemoryUsage() - startMemory,
        concurrentUsers: scenario.concurrentUsers,
        operationsCompleted: 0,
        averageResponseTime: 0,
        throughput: 0,
        errors: [error.message]
      };
    }
  }

  /**
   * ユーザー行動のシミュレーション
   */
  private async simulateUser(scenario: LoadTestScenario, userId: number): Promise<void> {
    const mockBot = createMockBot();
    const bot = new Bot(mockBot);
    const interpreter = new Interpreter(bot, new ExecutionContext());
    
    // ユーザー固有の遅延を追加
    await new Promise(resolve => setTimeout(resolve, userId * scenario.rampUpDelay));

    for (let operation = 0; operation < scenario.operationsPerUser; operation++) {
      const operationStart = performance.now();
      
      try {
        await scenario.operation(bot, interpreter, userId, operation);
        
        const operationEnd = performance.now();
        this.monitoring.recordOperation(scenario.name, operationEnd - operationStart);
        
        // 操作間隔の待機
        if (scenario.operationInterval > 0) {
          await new Promise(resolve => setTimeout(resolve, scenario.operationInterval));
        }
        
      } catch (error) {
        console.error(`[LoadTest] User ${userId} operation ${operation} failed: ${error}`);
        throw error;
      }
    }
  }

  /**
   * メモリリークの検出
   */
  private detectMemoryLeaks(): MemoryLeak[] {
    const leaks: MemoryLeak[] = [];
    const memorySnapshots = this.monitoring.getMemorySnapshots();
    
    // メモリ使用量の継続的増加を検出
    for (let i = 1; i < memorySnapshots.length; i++) {
      const previous = memorySnapshots[i - 1];
      const current = memorySnapshots[i];
      
      const increase = current.heapUsed - previous.heapUsed;
      const increasePercentage = (increase / previous.heapUsed) * 100;
      
      if (increasePercentage > 10) { // 10%以上の増加
        leaks.push({
          timestamp: current.timestamp,
          memoryIncrease: increase,
          increasePercentage,
          suspectedCause: this.identifySuspectedCause(current.timestamp)
        });
      }
    }
    
    return leaks;
  }

  /**
   * パフォーマンス劣化の検出
   */
  private detectPerformanceDegradation(): PerformanceDegradation[] {
    const degradations: PerformanceDegradation[] = [];
    
    for (const scenario of this.scenarios) {
      const responseTimes = this.monitoring.getResponseTimes(scenario.name);
      
      if (responseTimes.length < 2) continue;
      
      const initial = responseTimes.slice(0, Math.floor(responseTimes.length * 0.1)); // 最初の10%
      const final = responseTimes.slice(-Math.floor(responseTimes.length * 0.1)); // 最後の10%
      
      const initialAvg = initial.reduce((sum, time) => sum + time, 0) / initial.length;
      const finalAvg = final.reduce((sum, time) => sum + time, 0) / final.length;
      
      const degradation = ((finalAvg - initialAvg) / initialAvg) * 100;
      
      if (degradation > 20) { // 20%以上の劣化
        degradations.push({
          scenarioName: scenario.name,
          initialAverage: initialAvg,
          finalAverage: finalAvg,
          degradationPercentage: degradation,
          possibleCauses: this.analyzePossibleCauses(scenario.name)
        });
      }
    }
    
    return degradations;
  }
}

/**
 * パフォーマンス監視クラス
 */
class PerformanceMonitor {
  private memorySnapshots: MemorySnapshot[] = [];
  private operationTimes = new Map<string, number[]>();
  private gcRunCount = 0;

  constructor() {
    // ガベージコレクション監視
    if (global.gc) {
      const originalGC = global.gc;
      global.gc = () => {
        this.gcRunCount++;
        return originalGC();
      };
    }

    // 定期的なメモリスナップショット
    setInterval(() => {
      this.takeMemorySnapshot();
    }, 1000);
  }

  public takeMemorySnapshot(): void {
    const usage = process.memoryUsage();
    this.memorySnapshots.push({
      timestamp: Date.now(),
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      rss: usage.rss
    });
  }

  public recordOperation(scenarioName: string, responseTime: number): void {
    if (!this.operationTimes.has(scenarioName)) {
      this.operationTimes.set(scenarioName, []);
    }
    this.operationTimes.get(scenarioName)!.push(responseTime);
  }

  public getCurrentMemoryUsage(): number {
    return process.memoryUsage().heapUsed;
  }

  public getPeakMemoryUsage(): number {
    return Math.max(...this.memorySnapshots.map(s => s.heapUsed));
  }

  public getMemorySnapshots(): MemorySnapshot[] {
    return [...this.memorySnapshots];
  }

  public getResponseTimes(scenarioName: string): number[] {
    return [...(this.operationTimes.get(scenarioName) || [])];
  }
}

// 負荷テストの実行例
describe('System Load Tests', () => {
  let loadTest: LoadTestFramework;

  beforeEach(() => {
    loadTest = new LoadTestFramework();
  });

  test('concurrent BotScript execution stress test', async () => {
    // 同時実行シナリオ
    loadTest.addScenario({
      name: 'concurrent_botscript',
      concurrentUsers: 50,
      operationsPerUser: 20,
      rampUpDelay: 10, // 10ms間隔でユーザー追加
      operationInterval: 100, // 100ms間隔で操作実行
      operation: async (bot, interpreter, userId, operationId) => {
        const script = `
          DEF $user = ${userId}
          DEF $op = ${operationId}
          SAY "User " + $user + " operation " + $op
          REPEAT 10
            DEF $temp = $loop_index * $user
            IF $temp > 100 THEN
              SAY "Large value: " + $temp
            ENDIF
          ENDREPEAT
        `;
        
        const result = await executeScript(interpreter, script);
        if (result.type !== ExecutionResultType.SUCCESS) {
          throw new Error(`Script execution failed: ${result.message}`);
        }
      }
    });

    // メモリ集約的シナリオ
    loadTest.addScenario({
      name: 'memory_intensive',
      concurrentUsers: 10,
      operationsPerUser: 100,
      rampUpDelay: 50,
      operationInterval: 50,
      operation: async (bot, interpreter, userId, operationId) => {
        const context = new ExecutionContext();
        
        // 大量の変数を作成
        for (let i = 0; i < 1000; i++) {
          context.setVariable(`$var${i}`, `value${i}_${userId}_${operationId}`);
        }
        
        // 複雑な計算
        for (let i = 0; i < 100; i++) {
          const value = context.getVariable(`$var${i}`);
          context.setVariable(`$calculated${i}`, value + '_processed');
        }
        
        context.cleanup();
      }
    });

    const summary = await loadTest.runAllScenarios();

    // 結果の検証
    expect(summary.successfulScenarios).toBe(summary.totalScenarios);
    expect(summary.memoryLeaks).toHaveLength(0);
    expect(summary.performanceDegradation).toHaveLength(0);
    expect(summary.peakMemoryUsage).toBeLessThan(500 * 1024 * 1024); // 500MB未満
  }, 60000); // 60秒タイムアウト
});

// 型定義
interface LoadTestScenario {
  name: string;
  concurrentUsers: number;
  operationsPerUser: number;
  rampUpDelay: number;
  operationInterval: number;
  operation: (bot: Bot, interpreter: Interpreter, userId: number, operationId: number) => Promise<void>;
}

interface LoadTestResult {
  scenarioName: string;
  success: boolean;
  duration: number;
  memoryUsed: number;
  concurrentUsers: number;
  operationsCompleted: number;
  averageResponseTime: number;
  throughput: number;
  errors: string[];
}

interface LoadTestSummary {
  totalScenarios: number;
  successfulScenarios: number;
  failedScenarios: number;
  totalDuration: number;
  averageMemoryUsage: number;
  peakMemoryUsage: number;
  memoryLeaks: MemoryLeak[];
  performanceDegradation: PerformanceDegradation[];
}

interface MemoryLeak {
  timestamp: number;
  memoryIncrease: number;
  increasePercentage: number;
  suspectedCause: string;
}

interface PerformanceDegradation {
  scenarioName: string;
  initialAverage: number;
  finalAverage: number;
  degradationPercentage: number;
  possibleCauses: string[];
}

interface MemorySnapshot {
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
}
```
</details>

## 🏆 自己評価チェックリスト

- [ ] **初級**: 基本的な単体テストの作成とモックの使用方法を理解している
- [ ] **中級**: 統合テストとテストシナリオの設計ができる
- [ ] **上級**: 負荷テストとパフォーマンス監視システムを構築できる

## 📚 次のステップ

テストアーキテクチャを理解したら、実際のプロジェクトで：
1. **テストカバレッジの向上** - 未テスト部分の特定と追加テスト作成
2. **CI/CDパイプラインの最適化** - テスト実行時間の短縮と並列化
3. **監視システムの強化** - 本番環境でのパフォーマンス監視実装

これで、全ての解説ドキュメントが完成しました。包括的な技術資料として、自作言語開発からテスト戦略まで、プロフェッショナルレベルの知識を習得していただけます。