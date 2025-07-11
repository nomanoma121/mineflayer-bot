import { BasicLexer, BasicTokenType } from './BasicTokens';

/**
 * 🟢 01_lexer 初級問題1: 基本トークンの認識 - テスト
 * 
 * このテストが全て通るように BasicLexer を実装してください。
 */
describe('01_lexer - 初級問題1: 基本トークンの認識', () => {
  
  describe('基本機能テスト', () => {
    test('空文字列の処理', () => {
      const lexer = new BasicLexer('');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe(BasicTokenType.EOF);
    });

    test('SAYキーワードの認識', () => {
      const lexer = new BasicLexer('SAY');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(2); // SAY + EOF
      expect(tokens[0]).toEqual({
        type: BasicTokenType.SAY,
        value: 'SAY',
        line: 1,
        column: 1
      });
      expect(tokens[1].type).toBe(BasicTokenType.EOF);
    });

    test('MOVEキーワードの認識', () => {
      const lexer = new BasicLexer('MOVE');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(2); // MOVE + EOF
      expect(tokens[0]).toEqual({
        type: BasicTokenType.MOVE,
        value: 'MOVE',
        line: 1,
        column: 1
      });
    });

    test('文字列リテラルの認識', () => {
      const lexer = new BasicLexer('"Hello World"');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(2); // STRING + EOF
      expect(tokens[0]).toEqual({
        type: BasicTokenType.STRING,
        value: 'Hello World', // ダブルクォートは除去
        line: 1,
        column: 1
      });
    });
  });

  describe('組み合わせテスト', () => {
    test('SAYコマンドと文字列の組み合わせ', () => {
      const lexer = new BasicLexer('SAY "Hello"');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(3); // SAY + STRING + EOF
      
      expect(tokens[0]).toEqual({
        type: BasicTokenType.SAY,
        value: 'SAY',
        line: 1,
        column: 1
      });
      
      expect(tokens[1]).toEqual({
        type: BasicTokenType.STRING,
        value: 'Hello',
        line: 1,
        column: 5
      });
      
      expect(tokens[2].type).toBe(BasicTokenType.EOF);
    });

    test('複数のコマンドの組み合わせ', () => {
      const lexer = new BasicLexer('SAY "Test" MOVE');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(4); // SAY + STRING + MOVE + EOF
      expect(tokens.map(t => t.type)).toEqual([
        BasicTokenType.SAY,
        BasicTokenType.STRING,
        BasicTokenType.MOVE,
        BasicTokenType.EOF
      ]);
    });
  });

  describe('空白文字の処理', () => {
    test('スペースの無視', () => {
      const lexer = new BasicLexer('  SAY   "Hello"  ');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(3); // SAY + STRING + EOF
      expect(tokens[0].type).toBe(BasicTokenType.SAY);
      expect(tokens[1].type).toBe(BasicTokenType.STRING);
    });

    test('タブの無視', () => {
      const lexer = new BasicLexer('\tSAY\t"Test"\t');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(3); // SAY + STRING + EOF
      expect(tokens[0].value).toBe('SAY');
      expect(tokens[1].value).toBe('Test');
    });

    test('改行の処理', () => {
      const lexer = new BasicLexer('SAY\n"Hello"');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(3); // SAY + STRING + EOF
      expect(tokens[0].line).toBe(1);
      expect(tokens[1].line).toBe(2); // 改行後は2行目
    });
  });

  describe('位置情報の正確性', () => {
    test('列番号の追跡', () => {
      const lexer = new BasicLexer('SAY "Test" MOVE');
      const tokens = lexer.tokenize();
      
      expect(tokens[0].column).toBe(1);  // SAY
      expect(tokens[1].column).toBe(5);  // "Test"
      expect(tokens[2].column).toBe(12); // MOVE
    });

    test('複数行での行番号追跡', () => {
      const lexer = new BasicLexer('SAY\n"Hello"\nMOVE');
      const tokens = lexer.tokenize();
      
      expect(tokens[0].line).toBe(1); // SAY
      expect(tokens[1].line).toBe(2); // "Hello"
      expect(tokens[2].line).toBe(3); // MOVE
    });
  });

  describe('大文字小文字の処理', () => {
    test('小文字キーワードの認識', () => {
      const lexer = new BasicLexer('say');
      const tokens = lexer.tokenize();
      
      expect(tokens[0].type).toBe(BasicTokenType.SAY);
      expect(tokens[0].value).toBe('say'); // 元の大文字小文字を保持
    });

    test('混合ケースキーワードの認識', () => {
      const lexer = new BasicLexer('SaY MoVe');
      const tokens = lexer.tokenize();
      
      expect(tokens[0].type).toBe(BasicTokenType.SAY);
      expect(tokens[1].type).toBe(BasicTokenType.MOVE);
    });
  });

  describe('エラーハンドリング', () => {
    test('終端のない文字列', () => {
      const lexer = new BasicLexer('"unterminated string');
      
      expect(() => lexer.tokenize()).toThrow(/unterminated/i);
    });

    test('不正な文字', () => {
      const lexer = new BasicLexer('SAY @invalid');
      
      expect(() => lexer.tokenize()).toThrow(/unexpected character/i);
    });

    test('空の文字列リテラル', () => {
      const lexer = new BasicLexer('""');
      const tokens = lexer.tokenize();
      
      expect(tokens[0]).toEqual({
        type: BasicTokenType.STRING,
        value: '', // 空文字列
        line: 1,
        column: 1
      });
    });
  });

  describe('チャレンジテスト', () => {
    test('長い文字列の処理', () => {
      const longString = 'This is a very long string that should be processed correctly by the lexer';
      const lexer = new BasicLexer(`"${longString}"`);
      const tokens = lexer.tokenize();
      
      expect(tokens[0].value).toBe(longString);
    });

    test('複雑な組み合わせ', () => {
      const source = `SAY "Start"
      MOVE
      SAY "End"`;
      
      const lexer = new BasicLexer(source);
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(6); // SAY + STRING + MOVE + SAY + STRING + EOF
      expect(tokens.filter(t => t.type === BasicTokenType.SAY)).toHaveLength(2);
      expect(tokens.filter(t => t.type === BasicTokenType.STRING)).toHaveLength(2);
      expect(tokens.filter(t => t.type === BasicTokenType.MOVE)).toHaveLength(1);
    });
  });

  describe('成功判定テスト', () => {
    test('🎉 全ての基本機能が動作する', () => {
      const source = 'SAY "Hello World" MOVE say "goodbye"';
      const lexer = new BasicLexer(source);
      const tokens = lexer.tokenize();
      
      // 正確なトークン数
      expect(tokens).toHaveLength(6); // SAY + STRING + MOVE + SAY + STRING + EOF
      
      // 各トークンの正確性
      expect(tokens[0].type).toBe(BasicTokenType.SAY);
      expect(tokens[1].type).toBe(BasicTokenType.STRING);
      expect(tokens[1].value).toBe('Hello World');
      expect(tokens[2].type).toBe(BasicTokenType.MOVE);
      expect(tokens[3].type).toBe(BasicTokenType.SAY);
      expect(tokens[4].type).toBe(BasicTokenType.STRING);
      expect(tokens[4].value).toBe('goodbye');
      expect(tokens[5].type).toBe(BasicTokenType.EOF);
      
      console.log('🎉 01_lexer 初級問題1クリア！基本的な字句解析ができました！');
    });
  });
});