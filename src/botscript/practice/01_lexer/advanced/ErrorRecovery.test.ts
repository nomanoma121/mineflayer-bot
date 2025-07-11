import { ErrorRecoveryLexer, RecoveryTokenType } from './ErrorRecovery';

/**
 * 🔴 01_lexer 上級問題1: エラー回復機能 - テスト
 * 
 * このテストが全て通るように ErrorRecoveryLexer を実装してください。
 */
describe('01_lexer - 上級問題1: エラー回復機能', () => {
  
  describe('正常なケースのテスト', () => {
    test('エラーのないコードの処理', () => {
      const lexer = new ErrorRecoveryLexer('SAY "Hello" $x = 5');
      const result = lexer.tokenizeWithErrorRecovery();
      
      expect(result.hasErrors).toBe(false);
      expect(result.errors).toHaveLength(0);
      expect(result.tokens.filter(t => t.type !== RecoveryTokenType.EOF)).toHaveLength(5);
    });

    test('複数行の正常なコード', () => {
      const source = `SAY "Start"
      $health = 100
      IF $health == 100 THEN
        SAY "Full health"
      ENDIF`;
      
      const lexer = new ErrorRecoveryLexer(source);
      const result = lexer.tokenizeWithErrorRecovery();
      
      expect(result.hasErrors).toBe(false);
      expect(result.tokens.filter(t => t.type === RecoveryTokenType.SAY)).toHaveLength(2);
    });
  });

  describe('単一エラーの回復テスト', () => {
    test('不正な文字の処理', () => {
      const lexer = new ErrorRecoveryLexer('SAY "Hello" @ MOVE');
      const result = lexer.tokenizeWithErrorRecovery();
      
      expect(result.hasErrors).toBe(true);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatch(/@.*line 1.*column 13/i);
      
      // エラー後も解析継続
      const tokens = result.tokens.filter(t => t.type !== RecoveryTokenType.EOF && t.type !== RecoveryTokenType.ERROR);
      expect(tokens).toHaveLength(3); // SAY + STRING + MOVE
    });

    test('終端のない文字列の処理', () => {
      const lexer = new ErrorRecoveryLexer('SAY "unterminated\nMOVE');
      const result = lexer.tokenizeWithErrorRecovery();
      
      expect(result.hasErrors).toBe(true);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatch(/unterminated.*string/i);
      
      // エラー後も解析継続
      const moveToken = result.tokens.find(t => t.type === RecoveryTokenType.MOVE);
      expect(moveToken).toBeDefined();
      expect(moveToken?.line).toBe(2);
    });

    test('不正な変数名の処理', () => {
      const lexer = new ErrorRecoveryLexer('$\nSAY "OK"');
      const result = lexer.tokenizeWithErrorRecovery();
      
      expect(result.hasErrors).toBe(true);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatch(/invalid.*variable/i);
      
      // 次の行は正常に処理
      const sayToken = result.tokens.find(t => t.type === RecoveryTokenType.SAY);
      expect(sayToken).toBeDefined();
    });
  });

  describe('複数エラーの処理テスト', () => {
    test('複数の不正文字', () => {
      const lexer = new ErrorRecoveryLexer('SAY @ "Hello" # MOVE % "World"');
      const result = lexer.tokenizeWithErrorRecovery();
      
      expect(result.hasErrors).toBe(true);
      expect(result.errors).toHaveLength(3); // @, #, %
      
      // 正常なトークンも処理される
      const sayTokens = result.tokens.filter(t => t.type === RecoveryTokenType.SAY);
      const stringTokens = result.tokens.filter(t => t.type === RecoveryTokenType.STRING);
      const moveTokens = result.tokens.filter(t => t.type === RecoveryTokenType.MOVE);
      
      expect(sayTokens).toHaveLength(1);
      expect(stringTokens).toHaveLength(2);
      expect(moveTokens).toHaveLength(1);
    });

    test('各行にエラーがある場合', () => {
      const source = `SAY @
      MOVE #
      $ invalid
      "unterminated`;
      
      const lexer = new ErrorRecoveryLexer(source);
      const result = lexer.tokenizeWithErrorRecovery();
      
      expect(result.hasErrors).toBe(true);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
      
      // 各行のキーワードは認識される
      expect(result.tokens.find(t => t.type === RecoveryTokenType.SAY)).toBeDefined();
      expect(result.tokens.find(t => t.type === RecoveryTokenType.MOVE)).toBeDefined();
    });
  });

  describe('エラー回復の精度テスト', () => {
    test('エラー位置の正確性', () => {
      const lexer = new ErrorRecoveryLexer('SAY "OK" @ MOVE');
      const result = lexer.tokenizeWithErrorRecovery();
      
      expect(result.errors[0]).toMatch(/line 1.*column 10/i);
      
      const errorToken = result.tokens.find(t => t.type === RecoveryTokenType.ERROR);
      expect(errorToken?.line).toBe(1);
      expect(errorToken?.column).toBe(10);
    });

    test('複数行でのエラー位置', () => {
      const source = `SAY "Line 1"
      @ error on line 2
      MOVE`;
      
      const lexer = new ErrorRecoveryLexer(source);
      const result = lexer.tokenizeWithErrorRecovery();
      
      expect(result.errors[0]).toMatch(/line 2/i);
      
      const errorToken = result.tokens.find(t => t.type === RecoveryTokenType.ERROR);
      expect(errorToken?.line).toBe(2);
    });

    test('エラー後の位置情報継続', () => {
      const lexer = new ErrorRecoveryLexer('SAY @ "After error"');
      const result = lexer.tokenizeWithErrorRecovery();
      
      const stringToken = result.tokens.find(t => t.type === RecoveryTokenType.STRING);
      expect(stringToken?.value).toBe('After error');
      expect(stringToken?.column).toBeGreaterThan(5); // @の後に来る
    });
  });

  describe('エラートークンの詳細テスト', () => {
    test('エラートークンの情報', () => {
      const lexer = new ErrorRecoveryLexer('SAY @');
      const result = lexer.tokenizeWithErrorRecovery();
      
      const errorToken = result.tokens.find(t => t.type === RecoveryTokenType.ERROR);
      expect(errorToken).toBeDefined();
      expect(errorToken?.value).toBe('@');
      expect(errorToken?.error).toMatch(/unexpected/i);
    });

    test('複数のエラートークン', () => {
      const lexer = new ErrorRecoveryLexer('@ # %');
      const result = lexer.tokenizeWithErrorRecovery();
      
      const errorTokens = result.tokens.filter(t => t.type === RecoveryTokenType.ERROR);
      expect(errorTokens).toHaveLength(3);
      expect(errorTokens.map(t => t.value)).toEqual(['@', '#', '%']);
    });
  });

  describe('パニックモード回復のテスト', () => {
    test('長い不正シーケンスからの回復', () => {
      const lexer = new ErrorRecoveryLexer('SAY @@###%%%\nMOVE');
      const result = lexer.tokenizeWithErrorRecovery();
      
      expect(result.hasErrors).toBe(true);
      
      // 改行後のMOVEは正常に認識される
      const moveToken = result.tokens.find(t => t.type === RecoveryTokenType.MOVE);
      expect(moveToken).toBeDefined();
      expect(moveToken?.line).toBe(2);
    });

    test('ネストしたエラーからの回復', () => {
      const source = `IF $x == @#%
        SAY "Inside IF"
      ENDIF`;
      
      const lexer = new ErrorRecoveryLexer(source);
      const result = lexer.tokenizeWithErrorRecovery();
      
      expect(result.hasErrors).toBe(true);
      
      // IF文の構造は部分的に認識される
      expect(result.tokens.find(t => t.type === RecoveryTokenType.IF)).toBeDefined();
      expect(result.tokens.find(t => t.type === RecoveryTokenType.SAY)).toBeDefined();
      expect(result.tokens.find(t => t.type === RecoveryTokenType.ENDIF)).toBeDefined();
    });
  });

  describe('境界条件のテスト', () => {
    test('空文字列の処理', () => {
      const lexer = new ErrorRecoveryLexer('');
      const result = lexer.tokenizeWithErrorRecovery();
      
      expect(result.hasErrors).toBe(false);
      expect(result.tokens).toHaveLength(1); // EOF のみ
    });

    test('エラーのみの文字列', () => {
      const lexer = new ErrorRecoveryLexer('@#%');
      const result = lexer.tokenizeWithErrorRecovery();
      
      expect(result.hasErrors).toBe(true);
      expect(result.errors).toHaveLength(3);
      
      const errorTokens = result.tokens.filter(t => t.type === RecoveryTokenType.ERROR);
      expect(errorTokens).toHaveLength(3);
    });

    test('最後にエラーがある場合', () => {
      const lexer = new ErrorRecoveryLexer('SAY "Hello" @');
      const result = lexer.tokenizeWithErrorRecovery();
      
      expect(result.hasErrors).toBe(true);
      
      // 正常な部分は処理される
      expect(result.tokens.find(t => t.type === RecoveryTokenType.SAY)).toBeDefined();
      expect(result.tokens.find(t => t.type === RecoveryTokenType.STRING)).toBeDefined();
    });
  });

  describe('成功判定テスト', () => {
    test('🎉 複雑なエラー回復シナリオ', () => {
      const source = `SAY "Start"
      @ invalid char
      $bad_var
      "unterminated string
      MOVE "forward"
      IF $x == # THEN
        SAY "In IF"
      ENDIF
      % another error
      SAY "End"`;
      
      const lexer = new ErrorRecoveryLexer(source);
      const result = lexer.tokenizeWithErrorRecovery();
      
      // エラーが検出される
      expect(result.hasErrors).toBe(true);
      expect(result.errors.length).toBeGreaterThanOrEqual(4);
      
      // しかし正常な部分は処理される
      const sayTokens = result.tokens.filter(t => t.type === RecoveryTokenType.SAY);
      expect(sayTokens).toHaveLength(3); // "Start", "In IF", "End"
      
      const stringTokens = result.tokens.filter(t => t.type === RecoveryTokenType.STRING);
      expect(stringTokens.length).toBeGreaterThanOrEqual(3);
      
      // 制御構造も認識される
      expect(result.tokens.find(t => t.type === RecoveryTokenType.IF)).toBeDefined();
      expect(result.tokens.find(t => t.type === RecoveryTokenType.THEN)).toBeDefined();
      expect(result.tokens.find(t => t.type === RecoveryTokenType.ENDIF)).toBeDefined();
      expect(result.tokens.find(t => t.type === RecoveryTokenType.MOVE)).toBeDefined();
      
      // エラーの詳細が記録される
      expect(result.errors.some(e => e.includes('line'))).toBe(true);
      expect(result.errors.some(e => e.includes('column'))).toBe(true);
      
      console.log('🎉 01_lexer 上級問題1クリア！エラー回復機能が実装できました！');
      console.log(`📊 解析結果: ${result.tokens.length}個のトークン, ${result.errors.length}個のエラー`);
    });
  });
});