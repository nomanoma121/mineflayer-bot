import { Lexer } from '../Lexer';
import { TokenType } from '../TokenType';

describe('Lexer Comment Support', () => {
  describe('Single line comments', () => {
    test('should ignore single line comment at start of line', () => {
      const input = '# This is a comment\nvar x = 10';
      const lexer = new Lexer(input);
      const tokens = lexer.tokenize();
      
      // コメントトークンは存在しないはず
      const commentTokens = tokens.filter(token => token.value.includes('#'));
      expect(commentTokens).toHaveLength(0);
      
      // varトークンは存在するはず
      const varToken = tokens.find(token => token.type === TokenType.VAR);
      expect(varToken).toBeDefined();
    });

    test('should ignore end-of-line comments', () => {
      const input = 'var x = 10  # This is an end-of-line comment';
      const lexer = new Lexer(input);
      const tokens = lexer.tokenize();
      
      // コメント部分は無視される
      const commentTokens = tokens.filter(token => token.value.includes('#'));
      expect(commentTokens).toHaveLength(0);
      
      // 通常のコードは解析される
      expect(tokens.some(token => token.type === TokenType.VAR)).toBe(true);
      expect(tokens.some(token => token.type === TokenType.IDENTIFIER && token.value === 'x')).toBe(true);
      expect(tokens.some(token => token.type === TokenType.NUMBER && token.value === '10')).toBe(true);
    });

    test('should handle multiple comment lines', () => {
      const input = `# First comment
# Second comment
var x = 5
# Third comment`;
      const lexer = new Lexer(input);
      const tokens = lexer.tokenize();
      
      // コメントは全て無視される
      const commentTokens = tokens.filter(token => token.value.includes('#'));
      expect(commentTokens).toHaveLength(0);
      
      // 実際のコードのみ残る
      expect(tokens.some(token => token.type === TokenType.VAR)).toBe(true);
      expect(tokens.some(token => token.value === 'x')).toBe(true);
      expect(tokens.some(token => token.value === '5')).toBe(true);
    });

    test('should handle comments in complex script', () => {
      const input = `# Test script with comments
var count = 0  # Initialize counter

if count > 5 {  # Check condition
  say "High value"  # Output message
} else {
  say "Low value"   # Alternative message
}

# Loop section
repeat 3 {
  say "Loop iteration"  # Loop body
}`;
      
      const lexer = new Lexer(input);
      const tokens = lexer.tokenize();
      
      // コメントは全て除去される
      const commentTokens = tokens.filter(token => token.value.includes('#'));
      expect(commentTokens).toHaveLength(0);
      
      // 無効なトークンが生成されない
      const invalidTokens = tokens.filter(token => token.type === TokenType.INVALID);
      expect(invalidTokens).toHaveLength(0);
      
      // 主要なトークンは存在する
      expect(tokens.some(token => token.type === TokenType.VAR)).toBe(true);
      expect(tokens.some(token => token.type === TokenType.IF)).toBe(true);
      expect(tokens.some(token => token.type === TokenType.REPEAT)).toBe(true);
      expect(tokens.some(token => token.type === TokenType.SAY)).toBe(true);
    });
  });

  describe('Comment edge cases', () => {
    test('should handle empty comment lines', () => {
      const input = `var x = 1
#
var y = 2`;
      const lexer = new Lexer(input);
      const tokens = lexer.tokenize();
      
      expect(tokens.filter(token => token.value.includes('#'))).toHaveLength(0);
      expect(tokens.filter(token => token.type === TokenType.INVALID)).toHaveLength(0);
    });

    test('should handle comment at end of file', () => {
      const input = `var x = 1
# End comment`;
      const lexer = new Lexer(input);
      const tokens = lexer.tokenize();
      
      expect(tokens.filter(token => token.value.includes('#'))).toHaveLength(0);
      expect(tokens.some(token => token.type === TokenType.VAR)).toBe(true);
    });

    test('should handle hash symbol in strings (not comments)', () => {
      const input = 'say "Hash symbol: #hashtag"';
      const lexer = new Lexer(input);
      const tokens = lexer.tokenize();
      
      // 文字列内の#はコメントとして扱われない
      const stringToken = tokens.find(token => token.type === TokenType.STRING);
      expect(stringToken).toBeDefined();
      expect(stringToken?.value).toBe('Hash symbol: #hashtag');
    });

    test('should handle multiple hashes in comment', () => {
      const input = 'var x = 1  # ## Multiple hashes ### in comment';
      const lexer = new Lexer(input);
      const tokens = lexer.tokenize();
      
      expect(tokens.filter(token => token.value.includes('#'))).toHaveLength(0);
      expect(tokens.some(token => token.type === TokenType.VAR)).toBe(true);
    });
  });

  describe('Line and column tracking with comments', () => {
    test('should maintain correct line numbers with comments', () => {
      const input = `# Line 1 comment
var x = 1  # Line 2 comment
# Line 3 comment
var y = 2`;
      
      const lexer = new Lexer(input);
      const tokens = lexer.tokenize();
      
      // 2行目のvarトークン
      const firstVar = tokens.find(token => token.type === TokenType.VAR);
      expect(firstVar?.line).toBe(2);
      
      // 4行目のvarトークン
      const varTokens = tokens.filter(token => token.type === TokenType.VAR);
      expect(varTokens[1]?.line).toBe(4);
    });
  });
});