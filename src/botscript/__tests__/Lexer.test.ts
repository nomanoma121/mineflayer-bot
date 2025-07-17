import { Lexer } from '../lexer/Lexer';
import { TokenType, Token } from '../lexer/TokenType';

describe('BotScript Lexer', () => {
  let lexer: Lexer;

  beforeEach(() => {
    lexer = new Lexer('');
  });

  describe('Basic Tokens', () => {
    test('should tokenize identifiers', () => {
      lexer = new Lexer('hello world test123');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(4); // 3 identifiers + EOF
      expect(tokens[0]).toEqual({
        type: TokenType.IDENTIFIER,
        value: 'hello',
        line: 1,
        column: 1
      });
      expect(tokens[1]).toEqual({
        type: TokenType.IDENTIFIER,
        value: 'world',
        line: 1,
        column: 7
      });
      expect(tokens[2]).toEqual({
        type: TokenType.IDENTIFIER,
        value: 'test123',
        line: 1,
        column: 13
      });
      expect(tokens[3].type).toBe(TokenType.EOF);
    });

    test('should tokenize numbers', () => {
      lexer = new Lexer('123 456.78 0 999');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(5); // 4 numbers + EOF
      expect(tokens[0]).toEqual({
        type: TokenType.NUMBER,
        value: '123',
        line: 1,
        column: 1
      });
      expect(tokens[1]).toEqual({
        type: TokenType.NUMBER,
        value: '456.78',
        line: 1,
        column: 5
      });
      expect(tokens[2]).toEqual({
        type: TokenType.NUMBER,
        value: '0',
        line: 1,
        column: 12
      });
      expect(tokens[3]).toEqual({
        type: TokenType.NUMBER,
        value: '999',
        line: 1,
        column: 14
      });
    });

    test('should tokenize strings', () => {
      lexer = new Lexer('"hello world" "test string" "123"');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(4); // 3 strings + EOF
      expect(tokens[0]).toEqual({
        type: TokenType.STRING,
        value: 'hello world',
        line: 1,
        column: 1
      });
      expect(tokens[1]).toEqual({
        type: TokenType.STRING,
        value: 'test string',
        line: 1,
        column: 15
      });
      expect(tokens[2]).toEqual({
        type: TokenType.STRING,
        value: '123',
        line: 1,
        column: 29
      });
      expect(tokens[3].type).toBe(TokenType.EOF);
    });
  });

  describe('Keywords', () => {
    test('should tokenize control flow keywords', () => {
      lexer = new Lexer('if {} else {}');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(7); // 2 keywords + 2 braces + EOF
      expect(tokens[0].type).toBe(TokenType.IF);
      expect(tokens[1].type).toBe(TokenType.LBRACE);
      expect(tokens[2].type).toBe(TokenType.RBRACE);
      expect(tokens[3].type).toBe(TokenType.ELSE);
      expect(tokens[4].type).toBe(TokenType.LBRACE);
      expect(tokens[5].type).toBe(TokenType.RBRACE);
      expect(tokens[6].type).toBe(TokenType.EOF);
    });

    test('should tokenize loop keywords', () => {
      lexer = new Lexer('repeat {}');
      const tokens = lexer.tokenize();

      expect(tokens).toHaveLength(4); // 1 keyword + 2 braces + EOF
      expect(tokens[0].type).toBe(TokenType.REPEAT);
      expect(tokens[1].type).toBe(TokenType.LBRACE);
      expect(tokens[2].type).toBe(TokenType.RBRACE);
    });

    test('should tokenize variable keyword', () => {
      lexer = new Lexer('var');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(2); // 1 keyword + EOF
      expect(tokens[0].type).toBe(TokenType.VAR);
    });

    test("should tokenize set keyword", () => {
      lexer = new Lexer('set');
      const tokens = lexer.tokenize();

      expect(tokens).toHaveLength(2); // 1 keyword + EOF
      expect(tokens[0].type).toBe(TokenType.SET);
    });

    test('should tokenize boolean keywords', () => {
      lexer = new Lexer('true false');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(3); // 2 keywords + EOF
      expect(tokens[0].type).toBe(TokenType.TRUE);
      expect(tokens[1].type).toBe(TokenType.FALSE);
    });

    test('should tokenize bot command keywords', () => {
      lexer = new Lexer('say goto attack dig place equip drop wait');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(9); // 8 commands + EOF
      expect(tokens[0].type).toBe(TokenType.SAY);
      expect(tokens[1].type).toBe(TokenType.GOTO);
      expect(tokens[2].type).toBe(TokenType.ATTACK);
      expect(tokens[3].type).toBe(TokenType.DIG);
      expect(tokens[4].type).toBe(TokenType.PLACE);
      expect(tokens[5].type).toBe(TokenType.EQUIP);
      expect(tokens[6].type).toBe(TokenType.DROP);
      expect(tokens[7].type).toBe(TokenType.WAIT);
    });

    test('should tokenize logical operators', () => {
      lexer = new Lexer("and or not");
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(4); // 3 operators + EOF
      expect(tokens[0].type).toBe(TokenType.AND);
      expect(tokens[1].type).toBe(TokenType.OR);
      expect(tokens[2].type).toBe(TokenType.NOT);
    });
  });

  describe('Operators', () => {
    test('should tokenize assignment operators', () => {
      lexer = new Lexer('=');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(2); // 1 operator + EOF
      expect(tokens[0].type).toBe(TokenType.ASSIGN);
    });

    test('should tokenize comparison operators', () => {
      lexer = new Lexer('== != < > <= >=');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(7); // 6 operators + EOF
      expect(tokens[0].type).toBe(TokenType.EQUALS);
      expect(tokens[1].type).toBe(TokenType.NOT_EQUALS);
      expect(tokens[2].type).toBe(TokenType.LESS_THAN);
      expect(tokens[3].type).toBe(TokenType.GREATER_THAN);
      expect(tokens[4].type).toBe(TokenType.LESS_EQUALS);
      expect(tokens[5].type).toBe(TokenType.GREATER_EQUALS);
    });

    test('should tokenize arithmetic operators', () => {
      lexer = new Lexer('+ - * /');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(5); // 4 operators + EOF
      expect(tokens[0].type).toBe(TokenType.PLUS);
      expect(tokens[1].type).toBe(TokenType.MINUS);
      expect(tokens[2].type).toBe(TokenType.MULTIPLY);
      expect(tokens[3].type).toBe(TokenType.DIVIDE);
    });
  });

  describe('Delimiters', () => {
    test('should tokenize parentheses and braces', () => {
      lexer = new Lexer('() {}');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(5); // 4 delimiters + EOF
      expect(tokens[0].type).toBe(TokenType.LPAREN);
      expect(tokens[1].type).toBe(TokenType.RPAREN);
      expect(tokens[2].type).toBe(TokenType.LBRACE);
      expect(tokens[3].type).toBe(TokenType.RBRACE);
    });
  });

  describe('Line Tracking', () => {
    test('should handle newlines correctly', () => {
      lexer = new Lexer('first\nsecond\nthird');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(6); // 3 identifiers + 2 newlines + EOF
      expect(tokens[0]).toEqual({
        type: TokenType.IDENTIFIER,
        value: 'first',
        line: 1,
        column: 1
      });
      expect(tokens[1].type).toBe(TokenType.NEWLINE);
      expect(tokens[2]).toEqual({
        type: TokenType.IDENTIFIER,
        value: 'second',
        line: 2,
        column: 1
      });
      expect(tokens[3].type).toBe(TokenType.NEWLINE);
      expect(tokens[4]).toEqual({
        type: TokenType.IDENTIFIER,
        value: 'third',
        line: 3,
        column: 1
      });
    });

    test('should track column positions correctly', () => {
      lexer = new Lexer('hello world');
      const tokens = lexer.tokenize();
      
      expect(tokens[0].column).toBe(1);
      expect(tokens[1].column).toBe(7);
    });
  });

  describe('Complex Scripts', () => {
    test('should tokenize variable definition', () => {
      lexer = new Lexer('var health = 20');
      const tokens = lexer.tokenize();

      expect(tokens).toHaveLength(5); // var, health, =, 20, EOF
      expect(tokens[0].type).toBe(TokenType.VAR);
      expect(tokens[1].type).toBe(TokenType.IDENTIFIER);
      expect(tokens[2].type).toBe(TokenType.ASSIGN);
      expect(tokens[3].type).toBe(TokenType.NUMBER);
    });

    test('should tokenize conditional statement', () => {
      lexer = new Lexer('if health < 10 { say "Low health" }');
      const tokens = lexer.tokenize();
      
      const expectedTypes = [
        TokenType.IF,
        TokenType.IDENTIFIER,
        TokenType.LESS_THAN,
        TokenType.NUMBER,
        TokenType.LBRACE,
        TokenType.SAY,
        TokenType.STRING,
        TokenType.RBRACE,
        TokenType.EOF
      ];
      
      expect(tokens).toHaveLength(expectedTypes.length);
      tokens.forEach((token, index) => {
        expect(token.type).toBe(expectedTypes[index]);
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid characters', () => {
      lexer = new Lexer('hello @ world');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(4); // hello, @(invalid), world, EOF
      expect(tokens[0].type).toBe(TokenType.IDENTIFIER);
      expect(tokens[1].type).toBe(TokenType.INVALID);
      expect(tokens[2].type).toBe(TokenType.IDENTIFIER);
    });

    test('should handle unterminated strings', () => {
      lexer = new Lexer('"unterminated string');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(2); // invalid string + EOF
      expect(tokens[0].type).toBe(TokenType.INVALID);
    });
  });

  describe('Whitespace Handling', () => {
    test('should skip whitespace and tabs', () => {
      lexer = new Lexer('   hello\t\tworld   ');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(3); // hello, world, EOF
      expect(tokens[0].type).toBe(TokenType.IDENTIFIER);
      expect(tokens[1].type).toBe(TokenType.IDENTIFIER);
    });

    test('should preserve newlines as tokens', () => {
      lexer = new Lexer('hello\n\n\nworld');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(6); // hello, newline, newline, newline, world, EOF
      expect(tokens[0].type).toBe(TokenType.IDENTIFIER);
      expect(tokens[1].type).toBe(TokenType.NEWLINE);
      expect(tokens[2].type).toBe(TokenType.NEWLINE);
      expect(tokens[3].type).toBe(TokenType.NEWLINE);
      expect(tokens[4].type).toBe(TokenType.IDENTIFIER);
      expect(tokens[5].type).toBe(TokenType.EOF);
    });
  });
});
