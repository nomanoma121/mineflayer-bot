import { OperatorLexer, OperatorTokenType } from './ComplexOperators';

/**
 * 🟡 01_lexer 中級問題1: 複合演算子の処理 - テスト
 * 
 * このテストが全て通るように OperatorLexer を実装してください。
 */
describe('01_lexer - 中級問題1: 複合演算子の処理', () => {
  
  describe('基本演算子テスト', () => {
    test('単純な代入演算子', () => {
      const lexer = new OperatorLexer('=');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(2); // = + EOF
      expect(tokens[0]).toEqual({
        type: OperatorTokenType.ASSIGN,
        value: '=',
        line: 1,
        column: 1
      });
    });

    test('等値演算子の認識', () => {
      const lexer = new OperatorLexer('==');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(2); // == + EOF
      expect(tokens[0]).toEqual({
        type: OperatorTokenType.EQUAL,
        value: '==',
        line: 1,
        column: 1
      });
    });

    test('不等値演算子の認識', () => {
      const lexer = new OperatorLexer('!=');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(2); // != + EOF
      expect(tokens[0]).toEqual({
        type: OperatorTokenType.NOT_EQUAL,
        value: '!=',
        line: 1,
        column: 1
      });
    });
  });

  describe('比較演算子テスト', () => {
    test('小なり演算子', () => {
      const lexer = new OperatorLexer('<');
      const tokens = lexer.tokenize();
      
      expect(tokens[0]).toEqual({
        type: OperatorTokenType.LESS_THAN,
        value: '<',
        line: 1,
        column: 1
      });
    });

    test('以下演算子', () => {
      const lexer = new OperatorLexer('<=');
      const tokens = lexer.tokenize();
      
      expect(tokens[0]).toEqual({
        type: OperatorTokenType.LESS_EQUAL,
        value: '<=',
        line: 1,
        column: 1
      });
    });

    test('大なり演算子', () => {
      const lexer = new OperatorLexer('>');
      const tokens = lexer.tokenize();
      
      expect(tokens[0]).toEqual({
        type: OperatorTokenType.GREATER_THAN,
        value: '>',
        line: 1,
        column: 1
      });
    });

    test('以上演算子', () => {
      const lexer = new OperatorLexer('>=');
      const tokens = lexer.tokenize();
      
      expect(tokens[0]).toEqual({
        type: OperatorTokenType.GREATER_EQUAL,
        value: '>=',
        line: 1,
        column: 1
      });
    });
  });

  describe('演算子と数値の組み合わせ', () => {
    test('比較式の解析', () => {
      const lexer = new OperatorLexer('5 >= 3');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(4); // NUMBER + >= + NUMBER + EOF
      expect(tokens[0].type).toBe(OperatorTokenType.NUMBER);
      expect(tokens[0].value).toBe('5');
      expect(tokens[1].type).toBe(OperatorTokenType.GREATER_EQUAL);
      expect(tokens[2].type).toBe(OperatorTokenType.NUMBER);
      expect(tokens[2].value).toBe('3');
    });

    test('等値比較式', () => {
      const lexer = new OperatorLexer('10 == 10');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(4); // NUMBER + == + NUMBER + EOF
      expect(tokens[1].type).toBe(OperatorTokenType.EQUAL);
      expect(tokens[1].value).toBe('==');
    });

    test('不等値比較式', () => {
      const lexer = new OperatorLexer('7 != 8');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(4); // NUMBER + != + NUMBER + EOF
      expect(tokens[1].type).toBe(OperatorTokenType.NOT_EQUAL);
      expect(tokens[1].value).toBe('!=');
    });
  });

  describe('複数の演算子テスト', () => {
    test('連続する演算子', () => {
      const lexer = new OperatorLexer('= == != <= >=');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(6); // 5つの演算子 + EOF
      expect(tokens[0].type).toBe(OperatorTokenType.ASSIGN);
      expect(tokens[1].type).toBe(OperatorTokenType.EQUAL);
      expect(tokens[2].type).toBe(OperatorTokenType.NOT_EQUAL);
      expect(tokens[3].type).toBe(OperatorTokenType.LESS_EQUAL);
      expect(tokens[4].type).toBe(OperatorTokenType.GREATER_EQUAL);
    });

    test('演算子の組み合わせ式', () => {
      const lexer = new OperatorLexer('1 + 2 == 3');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(6); // NUMBER + + + NUMBER + == + NUMBER + EOF
      expect(tokens.map(t => t.type)).toEqual([
        OperatorTokenType.NUMBER,
        OperatorTokenType.PLUS,
        OperatorTokenType.NUMBER,
        OperatorTokenType.EQUAL,
        OperatorTokenType.NUMBER,
        OperatorTokenType.EOF
      ]);
    });
  });

  describe('位置情報の正確性', () => {
    test('複合演算子の列番号', () => {
      const lexer = new OperatorLexer('5 <= 10 >= 7');
      const tokens = lexer.tokenize();
      
      expect(tokens[0].column).toBe(1);  // 5
      expect(tokens[1].column).toBe(3);  // <=
      expect(tokens[2].column).toBe(6);  // 10
      expect(tokens[3].column).toBe(9);  // >=
      expect(tokens[4].column).toBe(12); // 7
    });

    test('複数行での演算子', () => {
      const lexer = new OperatorLexer('x = 5\ny != 0');
      const tokens = lexer.tokenize();
      
      expect(tokens.filter(t => t.line === 1)).toHaveLength(3); // x, =, 5
      expect(tokens.filter(t => t.line === 2)).toHaveLength(3); // y, !=, 0
    });
  });

  describe('エラーハンドリング', () => {
    test('単独の感嘆符エラー', () => {
      const lexer = new OperatorLexer('!');
      
      expect(() => lexer.tokenize()).toThrow(/unexpected character.*!/i);
    });

    test('無効な文字エラー', () => {
      const lexer = new OperatorLexer('5 @ 3');
      
      expect(() => lexer.tokenize()).toThrow(/unexpected character.*@/i);
    });

    test('エラーメッセージに位置情報が含まれる', () => {
      const lexer = new OperatorLexer('5 #');
      
      expect(() => lexer.tokenize()).toThrow(/line 1.*column 3/i);
    });
  });

  describe('エッジケーステスト', () => {
    test('連続する同じ演算子', () => {
      const lexer = new OperatorLexer('== == ==');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(4); // == + == + == + EOF
      expect(tokens.every(t => t.type === OperatorTokenType.EQUAL || t.type === OperatorTokenType.EOF)).toBe(true);
    });

    test('空白を挟まない演算子', () => {
      const lexer = new OperatorLexer('5<=10>=7!=8==9');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(10); // 5つの数値 + 4つの演算子 + EOF
      expect(tokens[1].type).toBe(OperatorTokenType.LESS_EQUAL);
      expect(tokens[3].type).toBe(OperatorTokenType.GREATER_EQUAL);
      expect(tokens[5].type).toBe(OperatorTokenType.NOT_EQUAL);
      expect(tokens[7].type).toBe(OperatorTokenType.EQUAL);
    });

    test('大きな数値の処理', () => {
      const lexer = new OperatorLexer('123456 == 789012');
      const tokens = lexer.tokenize();
      
      expect(tokens[0].value).toBe('123456');
      expect(tokens[2].value).toBe('789012');
    });
  });

  describe('成功判定テスト', () => {
    test('🎉 全ての複合演算子が正確に認識される', () => {
      const source = '10 >= 5 == 5 <= 10 != 7 < 8 > 3 = 42';
      const lexer = new OperatorLexer(source);
      const tokens = lexer.tokenize();
      
      // トークン数の確認
      expect(tokens).toHaveLength(16); // 8つの数値 + 7つの演算子 + EOF
      
      // 各演算子の正確性
      const operators = tokens.filter(t => t.type !== OperatorTokenType.NUMBER && t.type !== OperatorTokenType.EOF);
      expect(operators).toHaveLength(7);
      expect(operators[0].type).toBe(OperatorTokenType.GREATER_EQUAL);
      expect(operators[1].type).toBe(OperatorTokenType.EQUAL);
      expect(operators[2].type).toBe(OperatorTokenType.LESS_EQUAL);
      expect(operators[3].type).toBe(OperatorTokenType.NOT_EQUAL);
      expect(operators[4].type).toBe(OperatorTokenType.LESS_THAN);
      expect(operators[5].type).toBe(OperatorTokenType.GREATER_THAN);
      expect(operators[6].type).toBe(OperatorTokenType.ASSIGN);
      
      // 数値の正確性
      const numbers = tokens.filter(t => t.type === OperatorTokenType.NUMBER);
      expect(numbers.map(t => t.value)).toEqual(['10', '5', '5', '10', '7', '8', '3', '42']);
      
      console.log('🎉 01_lexer 中級問題1クリア！複合演算子の処理ができました！');
    });
  });
});