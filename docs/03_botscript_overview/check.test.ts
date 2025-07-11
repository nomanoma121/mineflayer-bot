/**
 * 03_botscript_overview テストファイル
 * 
 * すべての難易度の実装をテストします
 */

// 初級問題のテスト
describe('03_botscript_overview - Easy', () => {
  describe('VariableDeclaration', () => {
    it('有効な変数宣言を作成できる', () => {
      const { VariableDeclaration } = require('./easy');
      const varDecl = new VariableDeclaration('health', '100', 'DEF health = 100');
      
      expect(varDecl.isValid()).toBe(true);
      expect(varDecl.toBotScript()).toBe('DEF health = 100');
    });

    it('無効な変数名を検出する', () => {
      const { VariableDeclaration } = require('./easy');
      
      // 数字で始まる変数名
      const invalidVar1 = new VariableDeclaration('1health', '100', 'DEF 1health = 100');
      expect(invalidVar1.isValid()).toBe(false);
      
      // 空の変数名
      const invalidVar2 = new VariableDeclaration('', '100', 'DEF  = 100');
      expect(invalidVar2.isValid()).toBe(false);
      
      // 特殊文字を含む変数名
      const invalidVar3 = new VariableDeclaration('health@', '100', 'DEF health@ = 100');
      expect(invalidVar3.isValid()).toBe(false);
    });

    it('空の値を検出する', () => {
      const { VariableDeclaration } = require('./easy');
      const emptyVar = new VariableDeclaration('health', '', 'DEF health = ');
      expect(emptyVar.isValid()).toBe(false);
    });
  });

  describe('BotCommand', () => {
    it('有効なコマンドを作成できる', () => {
      const { BotCommand } = require('./easy');
      const sayCmd = new BotCommand('SAY', ['"Hello World"'], 'SAY "Hello World"');
      
      expect(sayCmd.isValid()).toBe(true);
      expect(sayCmd.toBotScript()).toBe('SAY "Hello World"');
    });

    it('移動コマンドを正しく処理する', () => {
      const { BotCommand } = require('./easy');
      const moveCmd = new BotCommand('MOVE', ['forward', '5'], 'MOVE forward 5');
      
      expect(moveCmd.isValid()).toBe(true);
      expect(moveCmd.toBotScript()).toBe('MOVE forward 5');
    });

    it('無効なコマンドを検出する', () => {
      const { BotCommand } = require('./easy');
      const invalidCmd = new BotCommand('INVALID', ['test'], 'INVALID test');
      
      expect(invalidCmd.isValid()).toBe(false);
    });

    it('空のコマンドを検出する', () => {
      const { BotCommand } = require('./easy');
      const emptyCmd = new BotCommand('', ['test'], ' test');
      
      expect(emptyCmd.isValid()).toBe(false);
    });
  });

  describe('IfStatement', () => {
    it('有効なIF文を作成できる', () => {
      const { IfStatement, BotCommand } = require('./easy');
      
      const thenBody = [new BotCommand('SAY', ['"Health is high"'], 'SAY "Health is high"')];
      const elseBody = [new BotCommand('SAY', ['"Health is low"'], 'SAY "Health is low"')];
      
      const ifStmt = new IfStatement('health > 50', thenBody, elseBody, 'IF health > 50');
      
      expect(ifStmt.isValid()).toBe(true);
      expect(ifStmt.toBotScript()).toContain('IF health > 50');
      expect(ifStmt.toBotScript()).toContain('ELSE');
      expect(ifStmt.toBotScript()).toContain('ENDIF');
    });

    it('ELSE部分なしのIF文を処理できる', () => {
      const { IfStatement, BotCommand } = require('./easy');
      
      const thenBody = [new BotCommand('SAY', ['"Condition is true"'], 'SAY "Condition is true"')];
      const ifStmt = new IfStatement('x == 1', thenBody, [], 'IF x == 1');
      
      expect(ifStmt.isValid()).toBe(true);
      expect(ifStmt.toBotScript()).not.toContain('ELSE');
    });

    it('空の条件を検出する', () => {
      const { IfStatement, BotCommand } = require('./easy');
      
      const thenBody = [new BotCommand('SAY', ['"test"'], 'SAY "test"')];
      const ifStmt = new IfStatement('', thenBody, [], 'IF ');
      
      expect(ifStmt.isValid()).toBe(false);
    });

    it('空のTHEN部分を検出する', () => {
      const { IfStatement } = require('./easy');
      
      const ifStmt = new IfStatement('x > 0', [], [], 'IF x > 0');
      
      expect(ifStmt.isValid()).toBe(false);
    });
  });

  describe('SimpleBotScriptParser', () => {
    it('基本的なプログラムを解析できる', () => {
      const { SimpleBotScriptParser } = require('./easy');
      const parser = new SimpleBotScriptParser();
      
      const code = `
        DEF health = 100
        SAY "Starting bot"
        IF health > 50
          MOVE forward
        ENDIF
      `;
      
      const program = parser.parse(code);
      
      expect(program.isValid()).toBe(true);
      expect(program.getStatementCount()).toBe(3);
    });

    it('コメントと空行を正しく処理する', () => {
      const { SimpleBotScriptParser } = require('./easy');
      const parser = new SimpleBotScriptParser();
      
      const code = `
        // This is a comment
        DEF health = 100
        
        // Another comment
        SAY "Hello"
      `;
      
      const program = parser.parse(code);
      
      expect(program.getStatementCount()).toBe(2);
    });
  });

  describe('BotScriptProgram', () => {
    it('文を追加して管理できる', () => {
      const { BotScriptProgram, VariableDeclaration } = require('./easy');
      const program = new BotScriptProgram();
      
      const varDecl = new VariableDeclaration('x', '10', 'DEF x = 10');
      program.addStatement(varDecl);
      
      expect(program.getStatementCount()).toBe(1);
      expect(program.isValid()).toBe(true);
      expect(program.toBotScript()).toBe('DEF x = 10');
    });
  });
});

// 中級問題のテスト
describe('03_botscript_overview - Normal', () => {
  describe('RepeatStatement', () => {
    it('有効なREPEAT文を作成できる', () => {
      const { RepeatStatement, BotCommand } = require('./normal');
      
      const body = [new BotCommand('SAY', ['"Loop iteration"'], 'SAY "Loop iteration"')];
      const repeatStmt = new RepeatStatement('3', body, 'REPEAT 3');
      
      expect(repeatStmt.isValid()).toBe(true);
      expect(repeatStmt.toBotScript()).toContain('REPEAT 3');
      expect(repeatStmt.toBotScript()).toContain('ENDREPEAT');
    });

    it('変数をカウントとして使用できる', () => {
      const { RepeatStatement, BotCommand } = require('./normal');
      
      const body = [new BotCommand('MOVE', ['forward'], 'MOVE forward')];
      const repeatStmt = new RepeatStatement('count', body, 'REPEAT count');
      
      expect(repeatStmt.isValid()).toBe(true);
    });

    it('無効なカウントを検出する', () => {
      const { RepeatStatement, BotCommand } = require('./normal');
      
      const body = [new BotCommand('SAY', ['"test"'], 'SAY "test"')];
      
      // 負の数
      const invalidRepeat1 = new RepeatStatement('-1', body, 'REPEAT -1');
      expect(invalidRepeat1.isValid()).toBe(false);
      
      // ゼロ
      const invalidRepeat2 = new RepeatStatement('0', body, 'REPEAT 0');
      expect(invalidRepeat2.isValid()).toBe(false);
      
      // 無効な識別子
      const invalidRepeat3 = new RepeatStatement('1abc', body, 'REPEAT 1abc');
      expect(invalidRepeat3.isValid()).toBe(false);
    });
  });

  describe('FunctionDefinition', () => {
    it('有効な関数定義を作成できる', () => {
      const { FunctionDefinition, BotCommand } = require('./normal');
      
      const body = [
        new BotCommand('SAY', ['"Moving to target"'], 'SAY "Moving to target"'),
        new BotCommand('GOTO', ['$x', '$y', '$z'], 'GOTO $x $y $z')
      ];
      
      const funcDef = new FunctionDefinition('moveToTarget', ['x', 'y', 'z'], body, 'FUNCTION moveToTarget(x, y, z)');
      
      expect(funcDef.isValid()).toBe(true);
      expect(funcDef.toBotScript()).toContain('FUNCTION moveToTarget(x, y, z)');
      expect(funcDef.toBotScript()).toContain('ENDFUNCTION');
    });

    it('パラメータなしの関数を作成できる', () => {
      const { FunctionDefinition, BotCommand } = require('./normal');
      
      const body = [new BotCommand('SAY', ['"Hello"'], 'SAY "Hello"')];
      const funcDef = new FunctionDefinition('greet', [], body, 'FUNCTION greet()');
      
      expect(funcDef.isValid()).toBe(true);
    });

    it('重複するパラメータを検出する', () => {
      const { FunctionDefinition, BotCommand } = require('./normal');
      
      const body = [new BotCommand('SAY', ['"test"'], 'SAY "test"')];
      const funcDef = new FunctionDefinition('test', ['x', 'y', 'x'], body, 'FUNCTION test(x, y, x)');
      
      expect(funcDef.isValid()).toBe(false);
    });
  });

  describe('FunctionCall', () => {
    it('有効な関数呼び出しを作成できる', () => {
      const { FunctionCall } = require('./normal');
      
      const funcCall = new FunctionCall('moveToTarget', ['10', '64', '20'], 'CALL moveToTarget(10, 64, 20)');
      
      expect(funcCall.isValid()).toBe(true);
      expect(funcCall.toBotScript()).toBe('CALL moveToTarget(10, 64, 20)');
    });

    it('引数なしの関数呼び出しを作成できる', () => {
      const { FunctionCall } = require('./normal');
      
      const funcCall = new FunctionCall('greet', [], 'CALL greet()');
      
      expect(funcCall.isValid()).toBe(true);
      expect(funcCall.toBotScript()).toBe('CALL greet()');
    });
  });

  describe('TryStatement', () => {
    it('有効なTRY文を作成できる', () => {
      const { TryStatement, BotCommand } = require('./normal');
      
      const tryBody = [new BotCommand('ATTACK', ['zombie'], 'ATTACK zombie')];
      const catchBody = [new BotCommand('SAY', ['"Attack failed"'], 'SAY "Attack failed"')];
      
      const tryStmt = new TryStatement(tryBody, catchBody, '$error', 'TRY');
      
      expect(tryStmt.isValid()).toBe(true);
      expect(tryStmt.toBotScript()).toContain('TRY');
      expect(tryStmt.toBotScript()).toContain('CATCH $error');
      expect(tryStmt.toBotScript()).toContain('ENDTRY');
    });

    it('CATCH部分なしのTRY文を処理できる', () => {
      const { TryStatement, BotCommand } = require('./normal');
      
      const tryBody = [new BotCommand('MOVE', ['forward'], 'MOVE forward')];
      const tryStmt = new TryStatement(tryBody, [], '$error', 'TRY');
      
      expect(tryStmt.isValid()).toBe(true);
    });
  });

  describe('AdvancedBotScriptParser', () => {
    it('複雑なプログラムを解析できる', () => {
      const { AdvancedBotScriptParser } = require('./normal');
      const parser = new AdvancedBotScriptParser();
      
      const code = `
        FUNCTION greetPlayer(name)
          SAY "Hello " + name
        ENDFUNCTION
        
        REPEAT 3
          CALL greetPlayer("Steve")
        ENDREPEAT
      `;
      
      const program = parser.parse(code);
      
      expect(program.isValid()).toBe(true);
    });
  });

  describe('Scope', () => {
    it('変数の定義と取得ができる', () => {
      const { Scope } = require('./normal');
      const scope = new Scope();
      
      scope.define('x', 10);
      expect(scope.get('x')).toBe(10);
      expect(scope.has('x')).toBe(true);
    });

    it('スコープチェーンで変数を検索できる', () => {
      const { Scope } = require('./normal');
      const parentScope = new Scope();
      const childScope = new Scope(parentScope);
      
      parentScope.define('global', 'value');
      childScope.define('local', 'value');
      
      expect(childScope.get('global')).toBe('value');
      expect(childScope.get('local')).toBe('value');
    });

    it('未定義変数でエラーを投げる', () => {
      const { Scope } = require('./normal');
      const scope = new Scope();
      
      expect(() => scope.get('undefined')).toThrow('Undefined variable: undefined');
    });
  });

  describe('AdvancedBotScriptProgram', () => {
    it('関数を追加して管理できる', () => {
      const { AdvancedBotScriptProgram, FunctionDefinition, BotCommand } = require('./normal');
      const program = new AdvancedBotScriptProgram();
      
      const body = [new BotCommand('SAY', ['"Hello"'], 'SAY "Hello"')];
      const func = new FunctionDefinition('greet', [], body, 'FUNCTION greet()');
      
      program.addFunction(func);
      
      expect(program.getFunction('greet')).toBe(func);
    });

    it('高度な統計情報を取得できる', () => {
      const { AdvancedBotScriptProgram, FunctionDefinition, BotCommand } = require('./normal');
      const program = new AdvancedBotScriptProgram();
      
      const body = [new BotCommand('SAY', ['"Hello"'], 'SAY "Hello"')];
      const func = new FunctionDefinition('greet', [], body, 'FUNCTION greet()');
      
      program.addFunction(func);
      
      const stats = program.getAdvancedStatistics();
      expect(stats.functions).toBe(1);
      expect(stats.maxNestingLevel).toBeGreaterThanOrEqual(0);
      expect(stats.cyclomaticComplexity).toBeGreaterThanOrEqual(1);
    });
  });
});

// 上級問題のテスト
describe('03_botscript_overview - Hard', () => {
  describe('BinaryExpression', () => {
    it('算術式を評価できる', () => {
      const { BinaryExpression, LiteralExpression, ExpressionContext } = require('./hard');
      
      const expr = new BinaryExpression(
        new LiteralExpression(10),
        '+',
        new LiteralExpression(5)
      );
      
      const context = new ExpressionContext();
      
      expect(expr.isValid()).toBe(true);
      expect(expr.evaluate(context)).toBe(15);
      expect(expr.toBotScript()).toBe('(10 + 5)');
    });

    it('比較式を評価できる', () => {
      const { BinaryExpression, LiteralExpression, ExpressionContext } = require('./hard');
      
      const expr = new BinaryExpression(
        new LiteralExpression(10),
        '>',
        new LiteralExpression(5)
      );
      
      const context = new ExpressionContext();
      
      expect(expr.evaluate(context)).toBe(true);
    });

    it('論理式を評価できる', () => {
      const { BinaryExpression, LiteralExpression, ExpressionContext } = require('./hard');
      
      const expr = new BinaryExpression(
        new LiteralExpression(true),
        '&&',
        new LiteralExpression(false)
      );
      
      const context = new ExpressionContext();
      
      expect(expr.evaluate(context)).toBe(false);
    });
  });

  describe('VariableExpression', () => {
    it('変数を評価できる', () => {
      const { VariableExpression, ExpressionContext } = require('./hard');
      
      const expr = new VariableExpression('health');
      const context = new ExpressionContext();
      context.setVariable('health', 100);
      
      expect(expr.isValid()).toBe(true);
      expect(expr.evaluate(context)).toBe(100);
      expect(expr.toBotScript()).toBe('health');
    });

    it('未定義変数でエラーを投げる', () => {
      const { VariableExpression, ExpressionContext } = require('./hard');
      
      const expr = new VariableExpression('undefined');
      const context = new ExpressionContext();
      
      expect(() => expr.evaluate(context)).toThrow('Undefined variable: undefined');
    });
  });

  describe('WhileStatement', () => {
    it('有効なWHILE文を作成できる', () => {
      const { WhileStatement, BinaryExpression, VariableExpression, LiteralExpression, BotCommand } = require('./hard');
      
      const condition = new BinaryExpression(
        new VariableExpression('health'),
        '>',
        new LiteralExpression(0)
      );
      
      const body = [new BotCommand('MOVE', ['forward'], 'MOVE forward')];
      const whileStmt = new WhileStatement(condition, body, 'WHILE health > 0');
      
      expect(whileStmt.isValid()).toBe(true);
      expect(whileStmt.toBotScript()).toContain('WHILE');
      expect(whileStmt.toBotScript()).toContain('ENDWHILE');
    });
  });

  describe('SwitchStatement', () => {
    it('有効なSWITCH文を作成できる', () => {
      const { SwitchStatement, CaseClause, VariableExpression, BotCommand } = require('./hard');
      
      const expression = new VariableExpression('gamemode');
      const cases = [
        new CaseClause('creative', [new BotCommand('FLY', ['true'], 'FLY true')]),
        new CaseClause('survival', [new BotCommand('GATHER', ['food'], 'GATHER food')])
      ];
      const defaultCase = [new BotCommand('SAY', ['"Unknown mode"'], 'SAY "Unknown mode"')];
      
      const switchStmt = new SwitchStatement(expression, cases, defaultCase, 'SWITCH gamemode');
      
      expect(switchStmt.isValid()).toBe(true);
      expect(switchStmt.toBotScript()).toContain('SWITCH');
      expect(switchStmt.toBotScript()).toContain('CASE creative');
      expect(switchStmt.toBotScript()).toContain('DEFAULT');
      expect(switchStmt.toBotScript()).toContain('ENDSWITCH');
    });

    it('重複するケースを検出する', () => {
      const { SwitchStatement, CaseClause, VariableExpression, BotCommand } = require('./hard');
      
      const expression = new VariableExpression('mode');
      const cases = [
        new CaseClause('test', [new BotCommand('SAY', ['"1"'], 'SAY "1"')]),
        new CaseClause('test', [new BotCommand('SAY', ['"2"'], 'SAY "2"')])
      ];
      
      const switchStmt = new SwitchStatement(expression, cases, null, 'SWITCH mode');
      
      expect(switchStmt.isValid()).toBe(false);
    });
  });

  describe('MacroDefinition', () => {
    it('有効なマクロを作成できる', () => {
      const { MacroDefinition } = require('./hard');
      
      const macro = new MacroDefinition(
        'ATTACK_SEQUENCE',
        ['target', 'count'],
        'REPEAT $count\n  ATTACK $target\nENDREPEAT',
        'MACRO ATTACK_SEQUENCE(target, count)'
      );
      
      expect(macro.isValid()).toBe(true);
      expect(macro.toBotScript()).toContain('MACRO ATTACK_SEQUENCE');
    });

    it('マクロを展開できる', () => {
      const { MacroDefinition } = require('./hard');
      
      const macro = new MacroDefinition(
        'GREET',
        ['name'],
        'SAY "Hello $name"',
        'MACRO GREET(name)'
      );
      
      const expanded = macro.expand(['Steve']);
      expect(expanded).toBe('SAY "Hello Steve"');
    });

    it('引数の数が一致しない場合はエラーを投げる', () => {
      const { MacroDefinition } = require('./hard');
      
      const macro = new MacroDefinition(
        'TEST',
        ['x', 'y'],
        'SAY $x $y',
        'MACRO TEST(x, y)'
      );
      
      expect(() => macro.expand(['only_one_arg'])).toThrow();
    });
  });

  describe('OptimizationEngine', () => {
    it('デッドコードを除去できる', () => {
      const { OptimizationEngine, BotScriptProgram, BotCommand } = require('./hard');
      
      const program = new BotScriptProgram();
      program.addStatement(new BotCommand('SAY', ['"Hello"'], 'SAY "Hello"'));
      program.addStatement(new BotCommand('NOP', [], 'NOP')); // デッドコード
      program.addStatement(new BotCommand('MOVE', ['forward'], 'MOVE forward'));
      
      const optimizer = new OptimizationEngine();
      const optimized = optimizer.optimize(program);
      
      expect(optimized.getStatementCount()).toBe(2); // NOPが除去されている
    });

    it('定数畳み込みを実行できる', () => {
      const { OptimizationEngine, BinaryExpression, LiteralExpression } = require('./hard');
      
      const expr = new BinaryExpression(
        new LiteralExpression(5),
        '+',
        new LiteralExpression(3)
      );
      
      const optimizer = new OptimizationEngine();
      const optimized = optimizer.optimizeExpression(expr);
      
      expect(optimized instanceof LiteralExpression).toBe(true);
      expect((optimized as any).value).toBe(8);
    });
  });

  describe('ExpressionContext', () => {
    it('変数と関数を管理できる', () => {
      const { ExpressionContext } = require('./hard');
      
      const context = new ExpressionContext();
      context.setVariable('x', 10);
      context.registerFunction('add', (a: number, b: number) => a + b);
      
      expect(context.getVariable('x')).toBe(10);
      expect(context.callFunction('add', [5, 3])).toBe(8);
    });
  });
});

// 統合テスト
describe('03_botscript_overview - Integration', () => {
  it('複雑なプログラムを完全に処理できる', () => {
    const { AdvancedBotScriptParser } = require('./normal');
    const parser = new AdvancedBotScriptParser();
    
    const complexCode = `
      // 関数定義
      FUNCTION patrol(distance)
        REPEAT distance
          MOVE forward
          WAIT 1
        ENDREPEAT
        SAY "Patrol complete"
      ENDFUNCTION
      
      // メイン処理
      DEF patrolDistance = 5
      
      TRY
        CALL patrol(patrolDistance)
      CATCH $error
        SAY "Patrol failed: " + $error
      ENDTRY
    `;
    
    const program = parser.parse(complexCode);
    
    expect(program.isValid()).toBe(true);
    expect(program.getStatementCount()).toBeGreaterThan(0);
    
    const generated = program.toBotScript();
    expect(generated).toContain('FUNCTION');
    expect(generated).toContain('TRY');
    expect(generated).toContain('REPEAT');
  });

  it('エラーハンドリングが正しく動作する', () => {
    const { SimpleBotScriptParser } = require('./easy');
    const parser = new SimpleBotScriptParser();
    
    const invalidCode = `
      INVALID_COMMAND test
      DEF 123invalid = value
    `;
    
    const program = parser.parse(invalidCode);
    
    // パーサーは無効な文をスキップするため、空のプログラムになる
    expect(program.getStatementCount()).toBe(0);
  });
});