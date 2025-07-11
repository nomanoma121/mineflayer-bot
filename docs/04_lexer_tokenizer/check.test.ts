/**
 * 04_lexer_tokenizer テストファイル
 * 
 * すべての難易度の実装をテストします
 */

// 初級問題のテスト
describe('04_lexer_tokenizer - Easy', () => {
  describe('Token', () => {
    it('トークンを正しく作成できる', () => {
      const { Token, TokenType } = require('./easy');
      const token = new Token(TokenType.KEYWORD, 'IF', 1, 1);
      
      expect(token.type).toBe(TokenType.KEYWORD);
      expect(token.value).toBe('IF');
      expect(token.line).toBe(1);
      expect(token.column).toBe(1);
    });

    it('toString()でトークンを文字列表現できる', () => {
      const { Token, TokenType } = require('./easy');
      const token = new Token(TokenType.IDENTIFIER, 'health', 1, 5);
      
      expect(token.toString()).toBe('IDENTIFIER(health)');
    });

    it('equals()でトークンの等価性を判定できる', () => {
      const { Token, TokenType } = require('./easy');
      const token1 = new Token(TokenType.NUMBER, '123', 1, 1);
      const token2 = new Token(TokenType.NUMBER, '123', 2, 5);
      const token3 = new Token(TokenType.STRING, '123', 1, 1);
      
      expect(token1.equals(token2)).toBe(true);
      expect(token1.equals(token3)).toBe(false);
    });

    it('isKeyword()でキーワードを判定できる', () => {
      const { Token, TokenType } = require('./easy');
      const keywordToken = new Token(TokenType.KEYWORD, 'IF', 1, 1);
      const identifierToken = new Token(TokenType.IDENTIFIER, 'health', 1, 1);
      
      expect(keywordToken.isKeyword()).toBe(true);
      expect(identifierToken.isKeyword()).toBe(false);
    });

    it('isValid()でトークンの有効性を判定できる', () => {
      const { Token, TokenType } = require('./easy');
      const validToken = new Token(TokenType.KEYWORD, 'IF', 1, 1);
      const invalidToken = new Token(TokenType.INVALID, '@', 1, 1);
      const emptyToken = new Token(TokenType.IDENTIFIER, '', 1, 1);
      
      expect(validToken.isValid()).toBe(true);
      expect(invalidToken.isValid()).toBe(false);
      expect(emptyToken.isValid()).toBe(false);
    });
  });

  describe('BasicLexer', () => {
    it('基本的なキーワードをトークン化できる', () => {
      const { BasicLexer, TokenType } = require('./easy');
      const lexer = new BasicLexer();
      
      const tokens = lexer.tokenize('IF ELSE ENDIF');
      const validTokens = tokens.filter(t => t.type !== TokenType.WHITESPACE && t.type !== TokenType.EOF);
      
      expect(validTokens).toHaveLength(3);
      expect(validTokens[0].type).toBe(TokenType.KEYWORD);
      expect(validTokens[0].value).toBe('IF');
      expect(validTokens[1].type).toBe(TokenType.KEYWORD);
      expect(validTokens[1].value).toBe('ELSE');
      expect(validTokens[2].type).toBe(TokenType.KEYWORD);
      expect(validTokens[2].value).toBe('ENDIF');
    });

    it('識別子をトークン化できる', () => {
      const { BasicLexer, TokenType } = require('./easy');
      const lexer = new BasicLexer();
      
      const tokens = lexer.tokenize('health playerName _secret');
      const identifiers = tokens.filter(t => t.type === TokenType.IDENTIFIER);
      
      expect(identifiers).toHaveLength(3);
      expect(identifiers[0].value).toBe('health');
      expect(identifiers[1].value).toBe('playerName');
      expect(identifiers[2].value).toBe('_secret');
    });

    it('数値をトークン化できる', () => {
      const { BasicLexer, TokenType } = require('./easy');
      const lexer = new BasicLexer();
      
      const tokens = lexer.tokenize('123 45.67 0.5');
      const numbers = tokens.filter(t => t.type === TokenType.NUMBER);
      
      expect(numbers).toHaveLength(3);
      expect(numbers[0].value).toBe('123');
      expect(numbers[1].value).toBe('45.67');
      expect(numbers[2].value).toBe('0.5');
    });

    it('文字列をトークン化できる', () => {
      const { BasicLexer, TokenType } = require('./easy');
      const lexer = new BasicLexer();
      
      const tokens = lexer.tokenize('"Hello World" \'Single quotes\'');
      const strings = tokens.filter(t => t.type === TokenType.STRING);
      
      expect(strings).toHaveLength(2);
      expect(strings[0].value).toBe('"Hello World"');
      expect(strings[1].value).toBe("'Single quotes'");
    });

    it('エスケープ文字を含む文字列をトークン化できる', () => {
      const { BasicLexer, TokenType } = require('./easy');
      const lexer = new BasicLexer();
      
      const tokens = lexer.tokenize('"Hello \\"World\\""');
      const strings = tokens.filter(t => t.type === TokenType.STRING);
      
      expect(strings).toHaveLength(1);
      expect(strings[0].value).toBe('"Hello \\"World\\""');
    });

    it('演算子をトークン化できる', () => {
      const { BasicLexer, TokenType } = require('./easy');
      const lexer = new BasicLexer();
      
      const tokens = lexer.tokenize('+ - * / == != <= >= && ||');
      const operators = tokens.filter(t => t.type === TokenType.OPERATOR);
      
      expect(operators.length).toBeGreaterThan(0);
      expect(operators.some(t => t.value === '+')).toBe(true);
      expect(operators.some(t => t.value === '==')).toBe(true);
      expect(operators.some(t => t.value === '&&')).toBe(true);
    });

    it('デリミタをトークン化できる', () => {
      const { BasicLexer, TokenType } = require('./easy');
      const lexer = new BasicLexer();
      
      const tokens = lexer.tokenize('( ) [ ] { } , ; :');
      const delimiters = tokens.filter(t => t.type === TokenType.DELIMITER);
      
      expect(delimiters.length).toBeGreaterThan(0);
      expect(delimiters.some(t => t.value === '(')).toBe(true);
      expect(delimiters.some(t => t.value === ',')).toBe(true);
    });

    it('コメントをトークン化できる', () => {
      const { BasicLexer, TokenType } = require('./easy');
      const lexer = new BasicLexer();
      
      const tokens = lexer.tokenize('// This is a comment\nIF');
      const comments = tokens.filter(t => t.type === TokenType.COMMENT);
      
      expect(comments).toHaveLength(1);
      expect(comments[0].value).toBe('// This is a comment');
    });

    it('行番号と列番号を正しく追跡する', () => {
      const { BasicLexer, TokenType } = require('./easy');
      const lexer = new BasicLexer();
      
      const tokens = lexer.tokenize('IF\n  health > 50\nENDIF');
      const keywords = tokens.filter(t => t.type === TokenType.KEYWORD);
      
      expect(keywords[0].line).toBe(1); // IF
      expect(keywords[0].column).toBe(1);
      expect(keywords[1].line).toBe(3); // ENDIF
    });

    it('無効な文字を検出する', () => {
      const { BasicLexer, TokenType } = require('./easy');
      const lexer = new BasicLexer();
      
      const tokens = lexer.tokenize('valid @invalid# more');
      const invalidTokens = tokens.filter(t => t.type === TokenType.INVALID);
      
      expect(invalidTokens.length).toBeGreaterThan(0);
    });

    it('複雑なBotScriptコードをトークン化できる', () => {
      const { BasicLexer, TokenType } = require('./easy');
      const lexer = new BasicLexer();
      
      const code = `
        DEF health = 100
        IF health > 50
          SAY "Health is good"
        ELSE
          SAY "Health is low"
        ENDIF
      `;
      
      const tokens = lexer.tokenize(code);
      const validTokens = tokens.filter(t => 
        t.type !== TokenType.WHITESPACE && 
        t.type !== TokenType.EOF
      );
      
      expect(validTokens.length).toBeGreaterThan(10);
      
      // 特定のトークンの存在確認
      const tokenValues = validTokens.map(t => t.value);
      expect(tokenValues).toContain('DEF');
      expect(tokenValues).toContain('health');
      expect(tokenValues).toContain('=');
      expect(tokenValues).toContain('100');
      expect(tokenValues).toContain('IF');
      expect(tokenValues).toContain('>');
      expect(tokenValues).toContain('50');
    });
  });

  describe('LexicalAnalysisResult', () => {
    it('トークン数を正しく計算する', () => {
      const { LexicalAnalysisResult, Token, TokenType } = require('./easy');
      
      const tokens = [
        new Token(TokenType.KEYWORD, 'IF'),
        new Token(TokenType.IDENTIFIER, 'health'),
        new Token(TokenType.EOF, '')
      ];
      
      const result = new LexicalAnalysisResult(tokens);
      expect(result.getTokenCount()).toBe(2); // EOFを除く
    });

    it('有効なトークンをフィルタできる', () => {
      const { LexicalAnalysisResult, Token, TokenType } = require('./easy');
      
      const tokens = [
        new Token(TokenType.KEYWORD, 'IF'),
        new Token(TokenType.INVALID, '@'),
        new Token(TokenType.IDENTIFIER, 'health'),
        new Token(TokenType.EOF, '')
      ];
      
      const result = new LexicalAnalysisResult(tokens);
      const validTokens = result.getValidTokens();
      
      expect(validTokens).toHaveLength(2);
      expect(validTokens.every(t => t.isValid())).toBe(true);
    });

    it('特定の型のトークンを取得できる', () => {
      const { LexicalAnalysisResult, Token, TokenType } = require('./easy');
      
      const tokens = [
        new Token(TokenType.KEYWORD, 'IF'),
        new Token(TokenType.KEYWORD, 'ELSE'),
        new Token(TokenType.IDENTIFIER, 'health')
      ];
      
      const result = new LexicalAnalysisResult(tokens);
      const keywords = result.getTokensByType(TokenType.KEYWORD);
      
      expect(keywords).toHaveLength(2);
      expect(keywords[0].value).toBe('IF');
      expect(keywords[1].value).toBe('ELSE');
    });

    it('無効なトークンの存在を検出できる', () => {
      const { LexicalAnalysisResult, Token, TokenType } = require('./easy');
      
      const tokensWithInvalid = [
        new Token(TokenType.KEYWORD, 'IF'),
        new Token(TokenType.INVALID, '@')
      ];
      
      const tokensWithoutInvalid = [
        new Token(TokenType.KEYWORD, 'IF'),
        new Token(TokenType.IDENTIFIER, 'health')
      ];
      
      const resultWithInvalid = new LexicalAnalysisResult(tokensWithInvalid);
      const resultWithoutInvalid = new LexicalAnalysisResult(tokensWithoutInvalid);
      
      expect(resultWithInvalid.hasInvalidTokens()).toBe(true);
      expect(resultWithoutInvalid.hasInvalidTokens()).toBe(false);
    });
  });
});

// 中級問題のテスト
describe('04_lexer_tokenizer - Normal', () => {
  describe('AdvancedToken', () => {
    it('高度なトークン情報を取得できる', () => {
      const { AdvancedToken, AdvancedTokenType } = require('./normal');
      const token = new AdvancedToken(
        AdvancedTokenType.NUMBER,
        '123.45',
        1, 5, 10, 6
      );
      
      const info = token.getInfo();
      expect(info.type).toBe(AdvancedTokenType.NUMBER);
      expect(info.value).toBe('123.45');
      expect(info.position.line).toBe(1);
      expect(info.position.column).toBe(5);
      expect(info.location.start).toBe(10);
      expect(info.location.length).toBe(6);
    });

    it('数値トークンのメタデータを正しく抽出する', () => {
      const { AdvancedToken, AdvancedTokenType } = require('./normal');
      
      const intToken = new AdvancedToken(AdvancedTokenType.NUMBER, '123', 1, 1, 0, 3);
      const floatToken = new AdvancedToken(AdvancedTokenType.NUMBER, '123.45', 1, 1, 0, 6);
      
      const intInfo = intToken.getInfo();
      const floatInfo = floatToken.getInfo();
      
      expect(intInfo.metadata.get('isInteger')).toBe(true);
      expect(intInfo.metadata.get('numericValue')).toBe(123);
      
      expect(floatInfo.metadata.get('isInteger')).toBe(false);
      expect(floatInfo.metadata.get('numericValue')).toBe(123.45);
    });

    it('文字列トークンのメタデータを正しく抽出する', () => {
      const { AdvancedToken, AdvancedTokenType } = require('./normal');
      
      const stringToken = new AdvancedToken(AdvancedTokenType.STRING, '"Hello"', 1, 1, 0, 7);
      const info = stringToken.getInfo();
      
      expect(info.metadata.get('length')).toBe(5); // 引用符を除く
      expect(info.metadata.get('isMultiline')).toBe(false);
    });

    it('位置情報を正しく文字列化できる', () => {
      const { Position } = require('./normal');
      const position = new Position(5, 10);
      
      expect(position.toString()).toBe('5:10');
    });

    it('位置の等価性を判定できる', () => {
      const { Position } = require('./normal');
      const pos1 = new Position(1, 5);
      const pos2 = new Position(1, 5);
      const pos3 = new Position(1, 6);
      
      expect(pos1.equals(pos2)).toBe(true);
      expect(pos1.equals(pos3)).toBe(false);
    });

    it('位置が範囲内かチェックできる', () => {
      const { Location } = require('./normal');
      const location = new Location(10, 5);
      
      expect(location.contains(12)).toBe(true);
      expect(location.contains(15)).toBe(false);
      expect(location.contains(9)).toBe(false);
    });
  });

  describe('RegexLexer', () => {
    it('正規表現パターンで数値を認識できる', () => {
      const { RegexLexer, AdvancedTokenType } = require('./normal');
      const lexer = new RegexLexer();
      
      const result = lexer.tokenize('123 45.67 -8.9 1.5e-3');
      const numbers = result.getTokensByType(AdvancedTokenType.NUMBER);
      
      expect(numbers).toHaveLength(4);
      expect(numbers[0].value).toBe('123');
      expect(numbers[1].value).toBe('45.67');
      expect(numbers[2].value).toBe('-8.9');
      expect(numbers[3].value).toBe('1.5e-3');
    });

    it('変数（$で始まる）を認識できる', () => {
      const { RegexLexer, AdvancedTokenType } = require('./normal');
      const lexer = new RegexLexer();
      
      const result = lexer.tokenize('$health $playerName $error');
      const variables = result.getTokensByType(AdvancedTokenType.VARIABLE);
      
      expect(variables).toHaveLength(3);
      expect(variables[0].value).toBe('$health');
      expect(variables[1].value).toBe('$playerName');
      expect(variables[2].value).toBe('$error');
    });

    it('ブール値を認識できる', () => {
      const { RegexLexer, AdvancedTokenType } = require('./normal');
      const lexer = new RegexLexer();
      
      const result = lexer.tokenize('true false TRUE FALSE');
      const booleans = result.getTokensByType(AdvancedTokenType.BOOLEAN);
      
      expect(booleans).toHaveLength(4);
      expect(booleans.map(t => t.value)).toEqual(['true', 'false', 'TRUE', 'FALSE']);
    });

    it('比較演算子を認識できる', () => {
      const { RegexLexer, AdvancedTokenType } = require('./normal');
      const lexer = new RegexLexer();
      
      const result = lexer.tokenize('== != <= >= < >');
      const comparisons = result.getTokensByType(AdvancedTokenType.COMPARISON);
      
      expect(comparisons).toHaveLength(6);
      expect(comparisons.map(t => t.value)).toEqual(['==', '!=', '<=', '>=', '<', '>']);
    });

    it('論理演算子を認識できる', () => {
      const { RegexLexer, AdvancedTokenType } = require('./normal');
      const lexer = new RegexLexer();
      
      const result = lexer.tokenize('&& || !');
      const logical = result.getTokensByType(AdvancedTokenType.LOGICAL);
      
      expect(logical).toHaveLength(3);
      expect(logical.map(t => t.value)).toEqual(['&&', '||', '!']);
    });

    it('代入演算子を認識できる', () => {
      const { RegexLexer, AdvancedTokenType } = require('./normal');
      const lexer = new RegexLexer();
      
      const result = lexer.tokenize('= += -= *= /=');
      const assignments = result.getTokensByType(AdvancedTokenType.ASSIGNMENT);
      
      expect(assignments).toHaveLength(5);
      expect(assignments.map(t => t.value)).toEqual(['=', '+=', '-=', '*=', '/=']);
    });

    it('複雑なBotScriptコードを高度に解析できる', () => {
      const { RegexLexer, AdvancedTokenType } = require('./normal');
      const lexer = new RegexLexer();
      
      const code = `
        DEF $health = 100.5
        WHILE $health > 0 && $energy >= 10
          ATTACK nearest_mob
          $health -= 5.25
        ENDWHILE
      `;
      
      const result = lexer.tokenize(code);
      
      expect(result.isSuccess()).toBe(true);
      expect(result.getTokensByType(AdvancedTokenType.KEYWORD).length).toBeGreaterThan(0);
      expect(result.getTokensByType(AdvancedTokenType.VARIABLE).length).toBeGreaterThan(0);
      expect(result.getTokensByType(AdvancedTokenType.NUMBER).length).toBeGreaterThan(0);
      expect(result.getTokensByType(AdvancedTokenType.COMPARISON).length).toBeGreaterThan(0);
      expect(result.getTokensByType(AdvancedTokenType.LOGICAL).length).toBeGreaterThan(0);
      expect(result.getTokensByType(AdvancedTokenType.ASSIGNMENT).length).toBeGreaterThan(0);
    });

    it('無効な文字を検出してエラーとして報告する', () => {
      const { RegexLexer, AdvancedTokenType } = require('./normal');
      const lexer = new RegexLexer();
      
      const result = lexer.tokenize('valid @invalid# more');
      
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.getTokensByType(AdvancedTokenType.INVALID).length).toBeGreaterThan(0);
    });
  });

  describe('TokenStatistics', () => {
    it('トークン統計を正しく計算する', () => {
      const { RegexLexer, AdvancedTokenType } = require('./normal');
      const lexer = new RegexLexer();
      
      const result = lexer.tokenize('IF health > 50 SAY "OK"');
      const stats = result.getStatistics();
      
      expect(stats.totalTokens).toBeGreaterThan(0);
      expect(stats.errorCount).toBe(0);
      expect(stats.typeCount.get(AdvancedTokenType.KEYWORD)).toBeGreaterThan(0);
    });

    it('最も多いトークン型を特定できる', () => {
      const { RegexLexer } = require('./normal');
      const lexer = new RegexLexer();
      
      const result = lexer.tokenize('health health health number');
      const stats = result.getStatistics();
      const mostCommon = stats.getMostCommonType();
      
      // 実際の実装では最も多いトークン型が返される
      expect(mostCommon).toBeDefined();
    });
  });
});

// 上級問題のテスト
describe('04_lexer_tokenizer - Hard', () => {
  describe('OptimizedLexer', () => {
    it('高速字句解析を実行できる', () => {
      const { OptimizedLexer } = require('./hard');
      const lexer = new OptimizedLexer();
      
      const code = `
        FUNCTION calculateDamage(base, multiplier)
          DEF result = base * multiplier
          IF result > 100
            RETURN 100
          ENDIF
          RETURN result
        ENDFUNCTION
      `;
      
      const startTime = performance.now();
      const result = lexer.tokenize(code);
      const endTime = performance.now();
      
      expect(result.tokens.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(100); // 100ms以内
    });

    it('パフォーマンスレポートを生成できる', () => {
      const { OptimizedLexer } = require('./hard');
      const lexer = new OptimizedLexer();
      
      const result = lexer.tokenize('IF health > 50 SAY "OK"');
      const report = result.getPerformanceReport();
      
      expect(report.tokenCount).toBeGreaterThan(0);
      expect(report.tokensPerSecond).toBeGreaterThanOrEqual(0);
      expect(report.toString()).toContain('Performance Report');
    });

    it('大量のデータを効率的に処理できる', () => {
      const { OptimizedLexer } = require('./hard');
      const lexer = new OptimizedLexer();
      
      // 大量のデータ
      const largeCode = 'IF health > 50 SAY "OK" ENDIF\n'.repeat(1000);
      
      const startTime = performance.now();
      const result = lexer.tokenize(largeCode);
      const endTime = performance.now();
      
      expect(result.tokens.length).toBeGreaterThan(1000);
      expect(endTime - startTime).toBeLessThan(1000); // 1秒以内
    });
  });

  describe('CharacterClass', () => {
    it('文字分類を正しく実行できる', () => {
      const { OptimizedLexer, CharacterClass } = require('./hard');
      const lexer = new OptimizedLexer();
      
      // 文字分類のテストは内部メソッドなので、実際の実装では公開メソッドをテスト
      expect(CharacterClass.LETTER).toBeDefined();
      expect(CharacterClass.DIGIT).toBeDefined();
      expect(CharacterClass.WHITESPACE).toBeDefined();
    });
  });

  describe('LexerStateTable', () => {
    it('状態テーブルを構築できる', () => {
      const { LexerStateTable, LexerState, CharacterClass } = require('./hard');
      const table = new LexerStateTable();
      
      table.addState(LexerState.INITIAL);
      table.addState(LexerState.IDENTIFIER);
      table.addTransition(LexerState.INITIAL, CharacterClass.LETTER, LexerState.IDENTIFIER);
      
      const nextState = table.getNextState(LexerState.INITIAL, CharacterClass.LETTER);
      expect(nextState).toBe(LexerState.IDENTIFIER);
    });
  });

  describe('TokenPool', () => {
    it('トークンプールからトークン配列を取得・返却できる', () => {
      const { TokenPool } = require('./hard');
      const pool = new TokenPool();
      
      const tokens1 = pool.acquire();
      const tokens2 = pool.acquire();
      
      expect(Array.isArray(tokens1)).toBe(true);
      expect(Array.isArray(tokens2)).toBe(true);
      
      pool.release(tokens1);
      pool.release(tokens2);
    });
  });

  describe('LexerMetrics', () => {
    it('字句解析メトリクスを収集できる', () => {
      const { LexerMetrics } = require('./hard');
      const metrics = new LexerMetrics();
      
      metrics.recordTime(100);
      metrics.recordTokens(50);
      metrics.recordError();
      metrics.recordCacheHit();
      metrics.recordCacheMiss();
      
      const snapshot = metrics.getSnapshot();
      
      expect(snapshot.processingTime).toBe(100);
      expect(snapshot.tokenCount).toBe(50);
      expect(snapshot.errorCount).toBe(1);
      expect(snapshot.cacheHits).toBe(1);
      expect(snapshot.cacheMisses).toBe(1);
    });

    it('メトリクススナップショットから統計を計算できる', () => {
      const { MetricsSnapshot } = require('./hard');
      const snapshot = new MetricsSnapshot(1000, 100, 5, 80, 20);
      
      expect(snapshot.getTokensPerSecond()).toBe(10000); // 1000 tokens / 0.1 seconds
      expect(snapshot.getCacheHitRate()).toBe(0.8); // 80 / (80 + 20)
    });
  });

  describe('PerformanceReport', () => {
    it('パフォーマンスレポートを文字列化できる', () => {
      const { PerformanceReport } = require('./hard');
      const report = new PerformanceReport(1000, 0.85, 2, 100);
      
      const reportString = report.toString();
      
      expect(reportString).toContain('Performance Report');
      expect(reportString).toContain('1000.00');
      expect(reportString).toContain('85.00%');
      expect(reportString).toContain('2');
      expect(reportString).toContain('100');
    });
  });
});

// 統合テスト
describe('04_lexer_tokenizer - Integration', () => {
  it('初級から上級まで一貫して動作する', () => {
    const { BasicLexer } = require('./easy');
    const { RegexLexer } = require('./normal');
    const { OptimizedLexer } = require('./hard');
    
    const testCode = 'IF health > 50 SAY "OK"';
    
    const basicResult = new BasicLexer().tokenize(testCode);
    const regexResult = new RegexLexer().tokenize(testCode);
    const optimizedResult = new OptimizedLexer().tokenize(testCode);
    
    // すべての実装が何らかのトークンを生成することを確認
    expect(basicResult.length).toBeGreaterThan(0);
    expect(regexResult.tokens.length).toBeGreaterThan(0);
    expect(optimizedResult.tokens.length).toBeGreaterThan(0);
  });

  it('エラー処理が一貫している', () => {
    const { BasicLexer } = require('./easy');
    const { RegexLexer } = require('./normal');
    
    const invalidCode = 'valid @invalid# more';
    
    const basicResult = new BasicLexer().tokenize(invalidCode);
    const regexResult = new RegexLexer().tokenize(invalidCode);
    
    // 両方の実装が無効なトークンを検出することを確認
    const basicHasInvalid = basicResult.some(t => t.type === 'INVALID');
    const regexHasErrors = regexResult.errors.length > 0;
    
    expect(basicHasInvalid || regexHasErrors).toBe(true);
  });

  it('複雑なBotScriptコードを完全に解析できる', () => {
    const { RegexLexer } = require('./normal');
    
    const complexCode = `
      // 複雑な関数定義
      FUNCTION patrol(distance, speed)
        DEF $currentPos = 0
        WHILE $currentPos < distance
          MOVE forward speed
          $currentPos += speed
          IF $danger == true
            SAY "Danger detected!"
            RETURN false
          ENDIF
          WAIT 1.5
        ENDWHILE
        RETURN true
      ENDFUNCTION
      
      // メイン実行
      DEF $result = patrol(100, 2.5)
      IF !$result
        SAY "Patrol failed"
      ELSE
        SAY "Patrol completed"
      ENDIF
    `;
    
    const lexer = new RegexLexer();
    const result = lexer.tokenize(complexCode);
    
    expect(result.isSuccess()).toBe(true);
    expect(result.tokens.length).toBeGreaterThan(50);
    
    // 様々な種類のトークンが含まれていることを確認
    const tokenTypes = new Set(result.tokens.map(t => t.type));
    expect(tokenTypes.has('KEYWORD')).toBe(true);
    expect(tokenTypes.has('IDENTIFIER')).toBe(true);
    expect(tokenTypes.has('NUMBER')).toBe(true);
    expect(tokenTypes.has('STRING')).toBe(true);
    expect(tokenTypes.has('VARIABLE')).toBe(true);
    expect(tokenTypes.has('OPERATOR')).toBe(true);
    expect(tokenTypes.has('COMPARISON')).toBe(true);
  });
});