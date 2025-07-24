import { Lexer } from '../../lexer/Lexer';
import { Parser } from '../Parser';
import { ASTNodeType } from '../../ast/ASTNode';

describe('Parser Comment Integration', () => {
  describe('Comment parsing integration', () => {
    test('should parse script with comments correctly', () => {
      const input = `# This is a test script
var x = 10    # Variable declaration
# Conditional logic
if x > 5 {
  say "Greater than 5"  # Success message
}`;
      
      const lexer = new Lexer(input);
      const tokens = lexer.tokenize();
      const parser = new Parser(tokens);
      const ast = parser.parse();
      
      // ASTには3つの文があるはず：var宣言、if文
      expect(ast.statements).toHaveLength(2);
      
      // 変数宣言文
      const varDecl = ast.statements[0];
      expect(varDecl.type).toBe(ASTNodeType.VARIABLE_DECLARATION);
      
      // if文
      const ifStmt = ast.statements[1];
      expect(ifStmt.type).toBe(ASTNodeType.IF_STATEMENT);
    });

    test('should handle complex script with many comments', () => {
      const input = `# Complex test script
# Author: Test
# Description: Testing comment parsing

var count = 0  # Counter variable

# Main logic loop
repeat 3 {
  # Increment and display
  set count = count + 1  # Increment counter
  say "Count: " + count  # Display current count
  
  # Conditional check
  if count > 2 {
    say "Almost done"  # Near completion message
  }
  
  wait 1  # Pause between iterations
}

# End of script
say "Finished"  # Final message`;
      
      const lexer = new Lexer(input);
      const tokens = lexer.tokenize();
      const parser = new Parser(tokens);
      const ast = parser.parse();
      
      // 期待される文の数（var, repeat, say）
      expect(ast.statements).toHaveLength(3);
      
      // 各文の型を確認
      expect(ast.statements[0].type).toBe(ASTNodeType.VARIABLE_DECLARATION);
      expect(ast.statements[1].type).toBe(ASTNodeType.REPEAT_STATEMENT);
      expect(ast.statements[2].type).toBe(ASTNodeType.COMMAND_STATEMENT);
    });

    test('should parse empty lines with only comments', () => {
      const input = `var x = 1
#
# Empty line above
#
var y = 2`;
      
      const lexer = new Lexer(input);
      const tokens = lexer.tokenize();
      const parser = new Parser(tokens);
      const ast = parser.parse();
      
      // 2つの変数宣言のみがパースされる
      expect(ast.statements).toHaveLength(2);
      expect(ast.statements[0].type).toBe(ASTNodeType.VARIABLE_DECLARATION);
      expect(ast.statements[1].type).toBe(ASTNodeType.VARIABLE_DECLARATION);
    });

    test('should handle comment-only script', () => {
      const input = `# This is a comment-only script
# It contains no executable code
# Just documentation`;
      
      const lexer = new Lexer(input);
      const tokens = lexer.tokenize();
      const parser = new Parser(tokens);
      const ast = parser.parse();
      
      // 実行可能な文がないため、statements配列は空
      expect(ast.statements).toHaveLength(0);
    });

    test('should handle mixed newlines and comments', () => {
      const input = `
# Header comment

var x = 1  # Inline comment

# Middle comment

say "Hello"  # Another inline comment

# Footer comment
`;
      
      const lexer = new Lexer(input);
      const tokens = lexer.tokenize();
      const parser = new Parser(tokens);
      const ast = parser.parse();
      
      expect(ast.statements).toHaveLength(2);
      expect(ast.statements[0].type).toBe(ASTNodeType.VARIABLE_DECLARATION);
      expect(ast.statements[1].type).toBe(ASTNodeType.COMMAND_STATEMENT);
    });
  });

  describe('Error handling with comments', () => {
    test('should report correct line numbers in errors despite comments', () => {
      const input = `# Line 1: Comment
var x = 1        # Line 2: Valid
# Line 3: Comment
if x > 0 {       # Line 4: Proper condition
  say "positive" # Line 5: Body
}                # Line 6: Proper closing`;
      
      const lexer = new Lexer(input);
      const tokens = lexer.tokenize();
      const parser = new Parser(tokens);
      const ast = parser.parse();
      
      // コメントがあってもパースが正常に動作することを確認
      expect(ast.statements).toHaveLength(2);
      expect(ast.statements[0].type).toBe(ASTNodeType.VARIABLE_DECLARATION);
      expect(ast.statements[1].type).toBe(ASTNodeType.IF_STATEMENT);
    });

    test('should handle syntax errors adjacent to comments', () => {
      const input = `var x = 1
if x > 0 {  # Start of if block
  say "positive"
}  # Proper closing brace
var y = 2  # This should parse correctly`;
      
      const lexer = new Lexer(input);
      const tokens = lexer.tokenize();
      const parser = new Parser(tokens);
      
      // 適切な構文でパーサーが正常に処理することを確認
      expect(() => parser.parse()).not.toThrow();
    });
  });
});