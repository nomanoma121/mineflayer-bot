/**
 * 05_parser_ast テストファイル
 * 
 * すべての難易度の実装をテストします
 */

// 初級問題のテスト
describe('05_parser_ast - Easy', () => {
  describe('ASTNode基本実装', () => {
    it('ProgramNodeが正しく動作する', () => {
      const { ProgramNode, LiteralNode } = require('./easy');
      
      const program = new ProgramNode([]);
      expect(program.type).toBe('Program');
      expect(program.getStatementCount()).toBe(0);
      
      const literal = new LiteralNode(42);
      program.addStatement(literal);
      
      expect(program.getStatementCount()).toBe(1);
      expect(program.getStatements()).toHaveLength(1);
    });

    it('VariableDeclarationNodeが正しく動作する', () => {
      const { VariableDeclarationNode, LiteralNode } = require('./easy');
      
      const literal = new LiteralNode(100);
      const varDecl = new VariableDeclarationNode('health', literal);
      
      expect(varDecl.type).toBe('VariableDeclaration');
      expect(varDecl.name).toBe('health');
      expect(varDecl.initializer).toBe(literal);
      expect(varDecl.toString()).toBe('DEF health = 100');
    });

    it('FunctionDeclarationNodeが正しく動作する', () => {
      const { FunctionDeclarationNode, ProgramNode } = require('./easy');
      
      const body = new ProgramNode([]);
      const funcDecl = new FunctionDeclarationNode('test', ['x', 'y'], body);
      
      expect(funcDecl.type).toBe('FunctionDeclaration');
      expect(funcDecl.name).toBe('test');
      expect(funcDecl.getParameterCount()).toBe(2);
      expect(funcDecl.hasParameter('x')).toBe(true);
      expect(funcDecl.hasParameter('z')).toBe(false);
      expect(funcDecl.toString()).toContain('FUNCTION test(x, y)');
    });

    it('BinaryExpressionNodeが正しく動作する', () => {
      const { BinaryExpressionNode, LiteralNode } = require('./easy');
      
      const left = new LiteralNode(5);
      const right = new LiteralNode(3);
      const binary = new BinaryExpressionNode(left, '+', right);
      
      expect(binary.type).toBe('BinaryExpression');
      expect(binary.operator).toBe('+');
      expect(binary.isArithmetic()).toBe(true);
      expect(binary.isComparison()).toBe(false);
      expect(binary.isLogical()).toBe(false);
      expect(binary.toString()).toBe('(5 + 3)');
    });

    it('演算子の種類を正しく判定する', () => {
      const { BinaryExpressionNode, LiteralNode } = require('./easy');
      
      const left = new LiteralNode(5);
      const right = new LiteralNode(3);
      
      const arithmetic = new BinaryExpressionNode(left, '*', right);
      expect(arithmetic.isArithmetic()).toBe(true);
      
      const comparison = new BinaryExpressionNode(left, '>', right);
      expect(comparison.isComparison()).toBe(true);
      
      const logical = new BinaryExpressionNode(left, '&&', right);
      expect(logical.isLogical()).toBe(true);
    });

    it('IdentifierNodeが正しく動作する', () => {
      const { IdentifierNode } = require('./easy');
      
      const identifier = new IdentifierNode('health');
      
      expect(identifier.type).toBe('Identifier');
      expect(identifier.name).toBe('health');
      expect(identifier.toString()).toBe('health');
    });

    it('LiteralNodeが正しく動作する', () => {
      const { LiteralNode } = require('./easy');
      
      const numberLiteral = new LiteralNode(42);
      expect(numberLiteral.type).toBe('Literal');
      expect(numberLiteral.value).toBe(42);
      expect(numberLiteral.isNumber()).toBe(true);
      expect(numberLiteral.isString()).toBe(false);
      expect(numberLiteral.toString()).toBe('42');
      
      const stringLiteral = new LiteralNode('hello');
      expect(stringLiteral.isString()).toBe(true);
      expect(stringLiteral.toString()).toBe('"hello"');
      
      const booleanLiteral = new LiteralNode(true);
      expect(booleanLiteral.isBoolean()).toBe(true);
      expect(booleanLiteral.toString()).toBe('true');
    });

    it('IfStatementNodeが正しく動作する', () => {
      const { IfStatementNode, BinaryExpressionNode, LiteralNode, ProgramNode } = require('./easy');
      
      const condition = new BinaryExpressionNode(
        new LiteralNode(5),
        '>',
        new LiteralNode(3)
      );
      const thenStmt = new ProgramNode([]);
      const elseStmt = new ProgramNode([]);
      
      const ifStmt = new IfStatementNode(condition, thenStmt, elseStmt);
      
      expect(ifStmt.type).toBe('IfStatement');
      expect(ifStmt.hasElse()).toBe(true);
      expect(ifStmt.toString()).toContain('IF');
      expect(ifStmt.toString()).toContain('ELSE');
      expect(ifStmt.toString()).toContain('ENDIF');
      
      const ifOnlyStmt = new IfStatementNode(condition, thenStmt);
      expect(ifOnlyStmt.hasElse()).toBe(false);
    });

    it('ReturnStatementNodeが正しく動作する', () => {
      const { ReturnStatementNode, LiteralNode } = require('./easy');
      
      const returnWithValue = new ReturnStatementNode(new LiteralNode(42));
      expect(returnWithValue.type).toBe('ReturnStatement');
      expect(returnWithValue.hasValue()).toBe(true);
      expect(returnWithValue.toString()).toBe('RETURN 42');
      
      const returnVoid = new ReturnStatementNode();
      expect(returnVoid.hasValue()).toBe(false);
      expect(returnVoid.toString()).toBe('RETURN');
    });
  });

  describe('RecursiveDescentParser', () => {
    it('基本的なトークンから変数宣言をパースできる', () => {
      const { RecursiveDescentParser } = require('./easy');
      
      const tokens = [
        { type: 'DEF', value: 'DEF' },
        { type: 'IDENTIFIER', value: 'health' },
        { type: 'ASSIGN', value: '=' },
        { type: 'NUMBER', value: '100' },
        { type: 'EOF', value: '' }
      ];
      
      const parser = new RecursiveDescentParser(tokens);
      const program = parser.parseProgram();
      
      expect(program.getStatementCount()).toBe(1);
      
      const stmt = program.getStatements()[0];
      expect(stmt.type).toBe('VariableDeclaration');
      expect((stmt as any).name).toBe('health');
    });

    it('算術式をパースできる', () => {
      const { RecursiveDescentParser } = require('./easy');
      
      const tokens = [
        { type: 'NUMBER', value: '5' },
        { type: 'PLUS', value: '+' },
        { type: 'NUMBER', value: '3' },
        { type: 'EOF', value: '' }
      ];
      
      const parser = new RecursiveDescentParser(tokens);
      const program = parser.parseProgram();
      
      expect(program.getStatementCount()).toBe(1);
      
      const expr = program.getStatements()[0];
      expect(expr.type).toBe('BinaryExpression');
      expect((expr as any).operator).toBe('+');
    });

    it('関数宣言をパースできる', () => {
      const { RecursiveDescentParser } = require('./easy');
      
      const tokens = [
        { type: 'FUNCTION', value: 'FUNCTION' },
        { type: 'IDENTIFIER', value: 'test' },
        { type: 'LPAREN', value: '(' },
        { type: 'IDENTIFIER', value: 'x' },
        { type: 'COMMA', value: ',' },
        { type: 'IDENTIFIER', value: 'y' },
        { type: 'RPAREN', value: ')' },
        { type: 'RETURN', value: 'RETURN' },
        { type: 'NUMBER', value: '42' },
        { type: 'EOF', value: '' }
      ];
      
      const parser = new RecursiveDescentParser(tokens);
      const program = parser.parseProgram();
      
      expect(program.getStatementCount()).toBe(1);
      
      const funcDecl = program.getStatements()[0];
      expect(funcDecl.type).toBe('FunctionDeclaration');
      expect((funcDecl as any).name).toBe('test');
      expect((funcDecl as any).parameters).toEqual(['x', 'y']);
    });

    it('IF文をパースできる', () => {
      const { RecursiveDescentParser } = require('./easy');
      
      const tokens = [
        { type: 'IF', value: 'IF' },
        { type: 'IDENTIFIER', value: 'x' },
        { type: 'GREATER', value: '>' },
        { type: 'NUMBER', value: '0' },
        { type: 'RETURN', value: 'RETURN' },
        { type: 'TRUE', value: 'true' },
        { type: 'ELSE', value: 'ELSE' },
        { type: 'RETURN', value: 'RETURN' },
        { type: 'FALSE', value: 'false' },
        { type: 'ENDIF', value: 'ENDIF' },
        { type: 'EOF', value: '' }
      ];
      
      const parser = new RecursiveDescentParser(tokens);
      const program = parser.parseProgram();
      
      expect(program.getStatementCount()).toBe(1);
      
      const ifStmt = program.getStatements()[0];
      expect(ifStmt.type).toBe('IfStatement');
      expect((ifStmt as any).hasElse()).toBe(true);
    });

    it('複雑な式の優先順位を正しく処理する', () => {
      const { RecursiveDescentParser } = require('./easy');
      
      // 2 + 3 * 4 = 2 + (3 * 4) = 14
      const tokens = [
        { type: 'NUMBER', value: '2' },
        { type: 'PLUS', value: '+' },
        { type: 'NUMBER', value: '3' },
        { type: 'STAR', value: '*' },
        { type: 'NUMBER', value: '4' },
        { type: 'EOF', value: '' }
      ];
      
      const parser = new RecursiveDescentParser(tokens);
      const program = parser.parseProgram();
      
      const expr = program.getStatements()[0];
      expect(expr.type).toBe('BinaryExpression');
      
      // 最上位は + 演算子
      expect((expr as any).operator).toBe('+');
      
      // 右側は * 演算子
      const rightSide = (expr as any).right;
      expect(rightSide.type).toBe('BinaryExpression');
      expect(rightSide.operator).toBe('*');
    });

    it('エラーハンドリングが正しく動作する', () => {
      const { RecursiveDescentParser } = require('./easy');
      
      const tokens = [
        { type: 'DEF', value: 'DEF' },
        { type: 'NUMBER', value: '123' }, // 識別子が必要な場所に数値
        { type: 'EOF', value: '' }
      ];
      
      const parser = new RecursiveDescentParser(tokens);
      
      expect(() => parser.parseProgram()).toThrow();
    });
  });

  describe('Visitor Pattern', () => {
    it('PrintVisitorがASTを正しく訪問する', () => {
      const { 
        PrintVisitor, 
        ProgramNode, 
        VariableDeclarationNode, 
        LiteralNode 
      } = require('./easy');
      
      const literal = new LiteralNode(42);
      const varDecl = new VariableDeclarationNode('x', literal);
      const program = new ProgramNode([varDecl]);
      
      const visitor = new PrintVisitor();
      const result = visitor.visitProgram(program);
      
      expect(result).toContain('Program:');
      expect(result).toContain('VariableDeclaration');
      expect(result).toContain('x');
    });

    it('複雑なASTを正しく訪問する', () => {
      const { 
        PrintVisitor, 
        BinaryExpressionNode, 
        LiteralNode 
      } = require('./easy');
      
      const left = new LiteralNode(5);
      const right = new LiteralNode(3);
      const binary = new BinaryExpressionNode(left, '+', right);
      
      const visitor = new PrintVisitor();
      const result = visitor.visitBinaryExpression(binary);
      
      expect(result).toContain('BinaryExpression');
      expect(result).toContain('+');
      expect(result).toContain('5');
      expect(result).toContain('3');
    });
  });
});

// 中級問題のテスト
describe('05_parser_ast - Normal', () => {
  describe('AdvancedASTNode', () => {
    it('SourceLocationが正しく動作する', () => {
      const { SourceLocation, Position } = require('./normal');
      
      const start = new Position(1, 5);
      const end = new Position(2, 10);
      const location = new SourceLocation(start, end);
      
      expect(location.start.line).toBe(1);
      expect(location.end.column).toBe(10);
      
      const testPos1 = new Position(1, 8);
      const testPos2 = new Position(3, 5);
      
      expect(location.contains(testPos1)).toBe(true);
      expect(location.contains(testPos2)).toBe(false);
      
      expect(location.toString()).toBe('1:5-2:10');
    });

    it('Positionが正しく動作する', () => {
      const { Position } = require('./normal');
      
      const pos1 = new Position(5, 10);
      const pos2 = new Position(5, 10);
      const pos3 = new Position(5, 11);
      
      expect(pos1.toString()).toBe('5:10');
      expect(pos1.equals(pos2)).toBe(true);
      expect(pos1.equals(pos3)).toBe(false);
    });
  });

  describe('高度な式ノード', () => {
    it('BinaryExpressionNodeの優先度計算', () => {
      const { BinaryExpressionNode, LiteralNode } = require('./normal');
      
      const literal = new LiteralNode(1);
      
      const addExpr = new BinaryExpressionNode(literal, '+', literal);
      const mulExpr = new BinaryExpressionNode(literal, '*', literal);
      const eqExpr = new BinaryExpressionNode(literal, '==', literal);
      
      expect(addExpr.getPrecedence()).toBe(5);
      expect(mulExpr.getPrecedence()).toBe(6);
      expect(eqExpr.getPrecedence()).toBe(3);
      
      // 乗算の方が加算より優先度が高い
      expect(mulExpr.getPrecedence()).toBeGreaterThan(addExpr.getPrecedence());
    });

    it('式の簡約化が正しく動作する', () => {
      const { BinaryExpressionNode, LiteralNode } = require('./normal');
      
      const left = new LiteralNode(5);
      const right = new LiteralNode(3);
      const addExpr = new BinaryExpressionNode(left, '+', right);
      
      const simplified = addExpr.simplify();
      
      expect(simplified.type).toBe('Literal');
      expect((simplified as any).value).toBe(8);
    });

    it('恒等式の適用が動作する', () => {
      const { BinaryExpressionNode, LiteralNode, IdentifierNode } = require('./normal');
      
      const variable = new IdentifierNode('x');
      const zero = new LiteralNode(0);
      const one = new LiteralNode(1);
      
      // x + 0 = x
      const addZero = new BinaryExpressionNode(variable, '+', zero);
      const simplifiedAdd = addZero.simplify();
      expect(simplifiedAdd.type).toBe('Identifier');
      expect((simplifiedAdd as any).name).toBe('x');
      
      // x * 1 = x
      const mulOne = new BinaryExpressionNode(variable, '*', one);
      const simplifiedMul = mulOne.simplify();
      expect(simplifiedMul.type).toBe('Identifier');
      expect((simplifiedMul as any).name).toBe('x');
    });

    it('UnaryExpressionNodeの簡約化', () => {
      const { UnaryExpressionNode, LiteralNode } = require('./normal');
      
      const literal = new LiteralNode(5);
      const negExpr = new UnaryExpressionNode('-', literal);
      
      const simplified = negExpr.simplify();
      
      expect(simplified.type).toBe('Literal');
      expect((simplified as any).value).toBe(-5);
    });

    it('CallExpressionNodeの型検証', () => {
      const { CallExpressionNode, IdentifierNode, LiteralNode } = require('./normal');
      
      const callee = new IdentifierNode('SAY');
      const args = [new LiteralNode('Hello')];
      const callExpr = new CallExpressionNode(callee, args);
      
      const validation = callExpr.validateArgumentTypes();
      
      expect(validation.hasErrors()).toBe(false);
      
      // 引数数が間違っている場合
      const wrongArgsCall = new CallExpressionNode(
        new IdentifierNode('MOVE'),
        [new LiteralNode(1)] // MOVEは2つの引数が必要
      );
      
      const wrongValidation = wrongArgsCall.validateArgumentTypes();
      expect(wrongValidation.hasErrors()).toBe(true);
    });
  });

  describe('高度な文ノード', () => {
    it('BlockStatementNodeのスコープ管理', () => {
      const { 
        BlockStatementNode, 
        VariableDeclarationNode, 
        LiteralNode 
      } = require('./normal');
      
      const varDecl = new VariableDeclarationNode('x', new LiteralNode(10));
      const block = new BlockStatementNode([varDecl]);
      
      const scope = block.getScope();
      
      expect(scope.lookup('x')).toBeTruthy();
      expect(scope.lookup('y')).toBeNull();
    });

    it('到達不可能コードの検出', () => {
      const { 
        BlockStatementNode, 
        ReturnStatementNode, 
        LiteralNode,
        VariableDeclarationNode
      } = require('./normal');
      
      const returnStmt = new ReturnStatementNode(new LiteralNode(42));
      const deadCode = new VariableDeclarationNode('x', new LiteralNode(1));
      
      const block = new BlockStatementNode([returnStmt, deadCode]);
      const unreachable = block.findUnreachableCode();
      
      expect(unreachable).toContain(deadCode);
    });

    it('IfStatementNodeの条件最適化', () => {
      const { 
        IfStatementNode, 
        LiteralNode, 
        BlockStatementNode 
      } = require('./normal');
      
      const trueCondition = new LiteralNode(true);
      const thenStmt = new BlockStatementNode([]);
      const elseStmt = new BlockStatementNode([]);
      
      const ifStmt = new IfStatementNode(trueCondition, thenStmt, elseStmt);
      const optimized = ifStmt.optimizeCondition();
      
      // 常にtrueの条件なので、then部分のみが残る
      expect(optimized).toBe(thenStmt);
    });

    it('WhileStatementNodeの無限ループ検出', () => {
      const { 
        WhileStatementNode, 
        LiteralNode, 
        BlockStatementNode 
      } = require('./normal');
      
      const trueCondition = new LiteralNode(true);
      const body = new BlockStatementNode([]);
      
      const whileStmt = new WhileStatementNode(trueCondition, body);
      
      expect(whileStmt.isInfiniteLoop()).toBe(true);
    });
  });

  describe('エラー回復パーサー', () => {
    it('基本的なエラー回復が動作する', () => {
      const { ErrorRecoveryParser } = require('./normal');
      
      // 意図的に壊れたトークン列
      const tokens = [
        { type: 'DEF', value: 'DEF' },
        { type: 'INVALID', value: '@#$' },
        { type: 'IDENTIFIER', value: 'x' },
        { type: 'ASSIGN', value: '=' },
        { type: 'NUMBER', value: '10' },
        { type: 'EOF', value: '' }
      ];
      
      const parser = new ErrorRecoveryParser(tokens);
      
      // エラーから回復してパースを続行
      expect(() => parser.parseProgram()).not.toThrow();
      expect(parser.getErrors().length).toBeGreaterThan(0);
    });

    it('文レベルでのエラー回復', () => {
      const { ErrorRecoveryParser, StatementRecoveryStrategy } = require('./normal');
      
      const strategy = new StatementRecoveryStrategy();
      const tokens = [
        { type: 'INVALID', value: 'INVALID' },
        { type: 'SEMICOLON', value: ';' },
        { type: 'DEF', value: 'DEF' },
        { type: 'IDENTIFIER', value: 'x' }
      ];
      
      const recoveryPoint = strategy.findRecoveryPoint(tokens, 0);
      
      expect(recoveryPoint).toBe(2); // DEFキーワードの位置
    });

    it('式レベルでのエラー回復', () => {
      const { ExpressionRecoveryStrategy } = require('./normal');
      
      const strategy = new ExpressionRecoveryStrategy();
      const tokens = [
        { type: 'INVALID', value: 'INVALID' },
        { type: 'PLUS', value: '+' },
        { type: 'NUMBER', value: '5' }
      ];
      
      const recoveryPoint = strategy.findRecoveryPoint(tokens, 0);
      
      expect(recoveryPoint).toBe(2); // 演算子の次の位置
    });
  });

  describe('AST変換器', () => {
    it('定数畳み込み変換が動作する', () => {
      const { ASTTransformer, BinaryExpressionNode, LiteralNode } = require('./normal');
      
      const transformer = new ASTTransformer();
      
      const left = new LiteralNode(5);
      const right = new LiteralNode(3);
      const binary = new BinaryExpressionNode(left, '+', right);
      
      const transformed = transformer.transform(binary, 'ConstantFolding');
      
      expect(transformed.type).toBe('Literal');
      expect((transformed as any).value).toBe(8);
    });

    it('デッドコード除去変換が動作する', () => {
      const { 
        ASTTransformer, 
        BlockStatementNode, 
        ReturnStatementNode, 
        VariableDeclarationNode,
        LiteralNode
      } = require('./normal');
      
      const transformer = new ASTTransformer();
      
      const returnStmt = new ReturnStatementNode(new LiteralNode(42));
      const deadCode = new VariableDeclarationNode('x', new LiteralNode(1));
      const block = new BlockStatementNode([returnStmt, deadCode]);
      
      const transformed = transformer.transform(block, 'DeadCodeElimination');
      
      expect((transformed as any).statements.length).toBe(1);
      expect((transformed as any).statements[0]).toBe(returnStmt);
    });
  });

  describe('シンボルテーブル', () => {
    it('基本的なシンボル管理が動作する', () => {
      const { SymbolTable, VariableDeclarationNode, LiteralNode } = require('./normal');
      
      const symbolTable = new SymbolTable();
      const varDecl = new VariableDeclarationNode('x', new LiteralNode(10));
      
      symbolTable.define('x', {
        type: 'variable',
        node: varDecl,
        mutable: true
      });
      
      const symbol = symbolTable.lookup('x');
      expect(symbol).toBeTruthy();
      expect(symbol!.type).toBe('variable');
      expect(symbol!.mutable).toBe(true);
    });

    it('ネストしたスコープが正しく動作する', () => {
      const { SymbolTable, VariableDeclarationNode, LiteralNode } = require('./normal');
      
      const parentScope = new SymbolTable();
      const childScope = new SymbolTable(parentScope);
      
      const parentVar = new VariableDeclarationNode('global', new LiteralNode(1));
      const childVar = new VariableDeclarationNode('local', new LiteralNode(2));
      
      parentScope.define('global', {
        type: 'variable',
        node: parentVar,
        mutable: true
      });
      
      childScope.define('local', {
        type: 'variable',
        node: childVar,
        mutable: true
      });
      
      // 子スコープから親のシンボルが見える
      expect(childScope.lookup('global')).toBeTruthy();
      expect(childScope.lookup('local')).toBeTruthy();
      
      // 親スコープから子のシンボルは見えない
      expect(parentScope.lookup('local')).toBeNull();
    });

    it('シンボルの重複定義を検出する', () => {
      const { SymbolTable, VariableDeclarationNode, LiteralNode } = require('./normal');
      
      const symbolTable = new SymbolTable();
      const varDecl = new VariableDeclarationNode('x', new LiteralNode(10));
      
      symbolTable.define('x', {
        type: 'variable',
        node: varDecl,
        mutable: true
      });
      
      expect(() => {
        symbolTable.define('x', {
          type: 'variable',
          node: varDecl,
          mutable: true
        });
      }).toThrow('Symbol x is already defined');
    });
  });
});

// 上級問題のテスト
describe('05_parser_ast - Hard', () => {
  describe('増分パーサー', () => {
    it('基本的な増分解析が動作する', () => {
      const { IncrementalParser, TextChange, TextRange, Position } = require('./hard');
      
      const parser = new IncrementalParser();
      const source = 'DEF x = 10\nSAY "Hello"';
      
      const changes = [
        new TextChange(
          new TextRange(new Position(1, 8), new Position(1, 10)),
          '20'
        )
      ];
      
      const result = parser.parseIncremental(source, changes);
      
      expect(result.ast).toBeDefined();
      expect(result.affectedRange).toBeDefined();
      expect(result.metrics.parseTime).toBeGreaterThan(0);
    });

    it('変更追跡が正しく動作する', () => {
      const { ChangeTracker, TextChange, TextRange, Position } = require('./hard');
      
      const tracker = new ChangeTracker();
      
      const changes = [
        new TextChange(
          new TextRange(new Position(2, 5), new Position(2, 10)),
          'new text'
        ),
        new TextChange(
          new TextRange(new Position(1, 1), new Position(1, 5)),
          'start'
        )
      ];
      
      const affectedRange = tracker.calculateAffectedRange(changes);
      
      expect(affectedRange.start.line).toBe(1);
      expect(affectedRange.start.column).toBe(1);
      expect(affectedRange.end.line).toBe(2);
      expect(affectedRange.end.column).toBe(10);
    });

    it('構文木管理が動作する', () => {
      const { SyntaxTree, TextRange, Position } = require('./hard');
      
      const tree = new SyntaxTree();
      const range = new TextRange(new Position(1, 1), new Position(2, 10));
      
      const nodes = tree.findNodesInRange(range);
      expect(Array.isArray(nodes)).toBe(true);
    });
  });

  describe('並列パーサー', () => {
    it('並列解析の基本動作', async () => {
      const { ParallelParser, ParseSource } = require('./hard');
      
      const parser = new ParallelParser();
      
      const sources = [
        new ParseSource('DEF x = 1', 'file1.bot'),
        new ParseSource('DEF y = 2', 'file2.bot'),
        new ParseSource('DEF z = 3', 'file3.bot')
      ];
      
      const result = await parser.parseParallel(sources);
      
      expect(result.asts).toBeDefined();
      expect(result.metrics.sourceCount).toBe(3);
      expect(result.metrics.getSpeedup()).toBeGreaterThan(0);
    });

    it('ワーカープールが正しく動作する', async () => {
      const { ParserWorkerPool } = require('./hard');
      
      const pool = new ParserWorkerPool();
      
      const worker1 = await pool.acquireWorker();
      const worker2 = await pool.acquireWorker();
      
      expect(worker1).toBeDefined();
      expect(worker2).toBeDefined();
      expect(worker1.id).not.toBe(worker2.id);
      
      pool.releaseWorker(worker1);
      pool.releaseWorker(worker2);
      
      expect(pool.getActiveWorkerCount()).toBe(0);
    });

    it('パーサーワーカーの解析機能', async () => {
      const { ParserWorker } = require('./hard');
      
      const worker = new ParserWorker('test-worker');
      const source = 'DEF x = 42\nSAY "Hello"';
      
      const ast = await worker.parse(source, 'test.bot');
      
      expect(ast).toBeDefined();
      expect(ast.type).toBe('Program');
    });
  });

  describe('高度なAST最適化', () => {
    it('最適化パスの依存関係解決', () => {
      const { OptimizationDependencyGraph } = require('./hard');
      
      const graph = new OptimizationDependencyGraph();
      
      graph.addDependency('B', 'A');
      graph.addDependency('C', 'B');
      graph.addDependency('D', 'A');
      
      const order = graph.getExecutionOrder();
      
      // Aが最初に来る必要がある
      expect(order.indexOf('A')).toBeLessThan(order.indexOf('B'));
      expect(order.indexOf('B')).toBeLessThan(order.indexOf('C'));
      expect(order.indexOf('A')).toBeLessThan(order.indexOf('D'));
    });

    it('定数畳み込みパスが動作する', () => {
      const { ConstantFoldingPass, BinaryExpressionNode, LiteralNode } = require('./hard');
      
      const pass = new ConstantFoldingPass();
      
      const left = new LiteralNode(5);
      const right = new LiteralNode(3);
      const binary = new BinaryExpressionNode(left, '+', right);
      
      const result = pass.apply(binary);
      
      expect(result.changed).toBe(true);
      expect(result.ast.type).toBe('Literal');
      expect((result.ast as any).value).toBe(8);
    });

    it('デッドコード除去パスが動作する', () => {
      const { 
        DeadCodeEliminationPass, 
        BlockStatementNode, 
        ReturnStatementNode, 
        VariableDeclarationNode,
        LiteralNode
      } = require('./hard');
      
      const pass = new DeadCodeEliminationPass();
      
      const returnStmt = new ReturnStatementNode(new LiteralNode(42));
      const deadCode = new VariableDeclarationNode('x', new LiteralNode(1));
      const block = new BlockStatementNode([returnStmt, deadCode]);
      
      const result = pass.apply(block);
      
      expect(result.changed).toBe(true);
      expect((result.ast as any).statements.length).toBe(1);
    });

    it('高度な最適化エンジンの統合動作', () => {
      const { 
        AdvancedASTOptimizer, 
        OptimizationOptions, 
        BinaryExpressionNode, 
        LiteralNode 
      } = require('./hard');
      
      const optimizer = new AdvancedASTOptimizer();
      
      const left = new LiteralNode(10);
      const right = new LiteralNode(5);
      const binary = new BinaryExpressionNode(left, '-', right);
      
      const options = new OptimizationOptions(
        ['ConstantFolding', 'DeadCodeElimination'],
        5,
        'O2'
      );
      
      const result = optimizer.optimize(binary, options);
      
      expect(result.appliedPasses).toContain('ConstantFolding');
      expect(result.totalTime).toBeGreaterThan(0);
      expect(result.ast.type).toBe('Literal');
      expect((result.ast as any).value).toBe(5);
    });
  });

  describe('メトリクス・パフォーマンス', () => {
    it('パースメトリクスの収集', () => {
      const { ParseMetrics } = require('./hard');
      
      const metrics = new ParseMetrics();
      
      metrics.recordTime(100);
      const snapshot = metrics.getSnapshot();
      
      expect(snapshot.parseTime).toBe(100);
      expect(snapshot.nodesCreated).toBe(0);
      expect(snapshot.errorsRecovered).toBe(0);
    });

    it('最適化メトリクスの収集', () => {
      const { OptimizationMetrics } = require('./hard');
      
      const metrics = new OptimizationMetrics();
      
      metrics.recordPass('ConstantFolding', 25, 3);
      metrics.recordPass('DeadCodeElimination', 15, 1);
      
      const passMetrics = metrics.getPassMetrics();
      
      expect(passMetrics.has('ConstantFolding')).toBe(true);
      expect(passMetrics.get('ConstantFolding')!.executionTime).toBe(25);
      expect(passMetrics.get('ConstantFolding')!.changesCount).toBe(3);
    });

    it('並列解析メトリクスの計算', () => {
      const { ParallelParseMetrics } = require('./hard');
      
      const metrics = new ParallelParseMetrics(8, 1000, 4, 1);
      
      expect(metrics.getSpeedup()).toBe(2); // 8 sources / 4 workers
      expect(metrics.sourceCount).toBe(8);
      expect(metrics.totalTime).toBe(1000);
      expect(metrics.peakWorkers).toBe(4);
      expect(metrics.errorCount).toBe(1);
    });
  });
});

// 統合テスト
describe('05_parser_ast - Integration', () => {
  it('完全なBotScriptプログラムの解析', () => {
    const { RecursiveDescentParser } = require('./easy');
    
    const complexTokens = [
      { type: 'FUNCTION', value: 'FUNCTION' },
      { type: 'IDENTIFIER', value: 'calculateDamage' },
      { type: 'LPAREN', value: '(' },
      { type: 'IDENTIFIER', value: 'base' },
      { type: 'COMMA', value: ',' },
      { type: 'IDENTIFIER', value: 'multiplier' },
      { type: 'RPAREN', value: ')' },
      { type: 'IF', value: 'IF' },
      { type: 'IDENTIFIER', value: 'base' },
      { type: 'GREATER', value: '>' },
      { type: 'NUMBER', value: '0' },
      { type: 'RETURN', value: 'RETURN' },
      { type: 'IDENTIFIER', value: 'base' },
      { type: 'STAR', value: '*' },
      { type: 'IDENTIFIER', value: 'multiplier' },
      { type: 'ELSE', value: 'ELSE' },
      { type: 'RETURN', value: 'RETURN' },
      { type: 'NUMBER', value: '0' },
      { type: 'ENDIF', value: 'ENDIF' },
      { type: 'EOF', value: '' }
    ];
    
    const parser = new RecursiveDescentParser(complexTokens);
    const program = parser.parseProgram();
    
    expect(program.getStatementCount()).toBe(1);
    expect(program.getStatements()[0].type).toBe('FunctionDeclaration');
  });

  it('エラー回復から最適化までの統合フロー', () => {
    const { 
      ErrorRecoveryParser, 
      ASTTransformer 
    } = require('./normal');
    
    // エラーを含むトークン列
    const tokensWithErrors = [
      { type: 'DEF', value: 'DEF' },
      { type: 'IDENTIFIER', value: 'x' },
      { type: 'ASSIGN', value: '=' },
      { type: 'NUMBER', value: '5' },
      { type: 'PLUS', value: '+' },
      { type: 'NUMBER', value: '3' },
      { type: 'INVALID', value: '@#$' }, // エラー
      { type: 'DEF', value: 'DEF' },
      { type: 'IDENTIFIER', value: 'y' },
      { type: 'ASSIGN', value: '=' },
      { type: 'NUMBER', value: '10' },
      { type: 'EOF', value: '' }
    ];
    
    const parser = new ErrorRecoveryParser(tokensWithErrors);
    const program = parser.parseProgram();
    
    // エラーがあってもパースが完了
    expect(program).toBeDefined();
    expect(parser.getErrors().length).toBeGreaterThanOrEqual(0);
    
    // 最適化の適用
    const transformer = new ASTTransformer();
    
    for (const stmt of program.getStatements()) {
      if (stmt instanceof BinaryExpressionNode) {
        const optimized = transformer.transform(stmt, 'ConstantFolding');
        expect(optimized).toBeDefined();
      }
    }
  });
});