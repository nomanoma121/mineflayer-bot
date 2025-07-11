/**
 * 🟢 02_parser 初級問題1: 基本的なAST構築 - 解答例
 */

// ===== AST ノード定義 =====

export interface ASTNode {
  type: string;
  line?: number;
  column?: number;
}

export interface ProgramNode extends ASTNode {
  type: 'Program';
  statements: StatementNode[];
}

export interface StatementNode extends ASTNode {}

export interface ExpressionNode extends ASTNode {}

export interface VariableDeclarationNode extends StatementNode {
  type: 'VariableDeclaration';
  name: string;
  initializer: ExpressionNode;
}

export interface VariableNode extends ExpressionNode {
  type: 'Variable';
  name: string;
}

export interface NumberLiteralNode extends ExpressionNode {
  type: 'NumberLiteral';
  value: number;
}

export interface StringLiteralNode extends ExpressionNode {
  type: 'StringLiteral';
  value: string;
}

export interface SayCommandNode extends StatementNode {
  type: 'SayCommand';
  message: ExpressionNode;
}

// ===== トークン定義 =====

export enum BasicParserTokenType {
  DEF = 'DEF',
  SAY = 'SAY',
  VARIABLE = 'VARIABLE',
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  ASSIGN = 'ASSIGN',
  EOF = 'EOF'
}

export interface BasicParserToken {
  type: BasicParserTokenType;
  value: string;
  line: number;
  column: number;
}

// ===== パーサー実装 =====

export class BasicASTParser {
  private tokens: BasicParserToken[];
  private current: number = 0;

  constructor(tokens: BasicParserToken[]) {
    this.tokens = tokens;
  }

  public parse(): ProgramNode {
    const statements: StatementNode[] = [];
    
    while (!this.isAtEnd()) {
      const stmt = this.statement();
      statements.push(stmt);
    }
    
    return {
      type: 'Program',
      statements
    };
  }

  private statement(): StatementNode {
    if (this.check(BasicParserTokenType.DEF)) {
      return this.variableDeclaration();
    }
    
    if (this.check(BasicParserTokenType.SAY)) {
      return this.sayCommand();
    }
    
    throw new Error(`Unexpected token: ${this.peek().value} at line ${this.peek().line}`);
  }

  private variableDeclaration(): VariableDeclarationNode {
    this.consume(BasicParserTokenType.DEF, 'Expected DEF');
    const nameToken = this.consume(BasicParserTokenType.VARIABLE, 'Expected variable name');
    this.consume(BasicParserTokenType.ASSIGN, 'Expected =');
    
    const initializer = this.expression();
    
    return {
      type: 'VariableDeclaration',
      name: nameToken.value,
      initializer,
      line: nameToken.line,
      column: nameToken.column
    };
  }

  private sayCommand(): SayCommandNode {
    const sayToken = this.consume(BasicParserTokenType.SAY, 'Expected SAY');
    const message = this.expression();
    
    return {
      type: 'SayCommand',
      message,
      line: sayToken.line,
      column: sayToken.column
    };
  }

  private expression(): ExpressionNode {
    return this.primary();
  }

  private primary(): ExpressionNode {
    if (this.match(BasicParserTokenType.NUMBER)) {
      const token = this.previous();
      return {
        type: 'NumberLiteral',
        value: parseFloat(token.value),
        line: token.line,
        column: token.column
      };
    }
    
    if (this.match(BasicParserTokenType.STRING)) {
      const token = this.previous();
      return {
        type: 'StringLiteral',
        value: token.value,
        line: token.line,
        column: token.column
      };
    }
    
    if (this.match(BasicParserTokenType.VARIABLE)) {
      const token = this.previous();
      return {
        type: 'Variable',
        name: token.value,
        line: token.line,
        column: token.column
      };
    }
    
    throw new Error(`Unexpected token: ${this.peek().value} at line ${this.peek().line}`);
  }

  // ===== ヘルパーメソッド =====

  private match(...types: BasicParserTokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: BasicParserTokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): BasicParserToken {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === BasicParserTokenType.EOF;
  }

  private peek(): BasicParserToken {
    return this.tokens[this.current];
  }

  private previous(): BasicParserToken {
    return this.tokens[this.current - 1];
  }

  private consume(type: BasicParserTokenType, message: string): BasicParserToken {
    if (this.check(type)) return this.advance();

    const current = this.peek();
    throw new Error(`${message}. Got '${current.value}' at line ${current.line}, column ${current.column}`);
  }
}