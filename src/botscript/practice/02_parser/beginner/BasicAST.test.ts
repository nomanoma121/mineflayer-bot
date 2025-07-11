import { BasicASTParser, BasicParserTokenType, BasicParserToken, ProgramNode, VariableDeclarationNode, SayCommandNode, NumberLiteralNode, StringLiteralNode, VariableNode } from './BasicAST';

/**
 * 🟢 02_parser 初級問題1: 基本的なAST構築 - テスト
 * 
 * このテストが全て通るように BasicASTParser を実装してください。
 */
describe('02_parser - 初級問題1: 基本的なAST構築', () => {
  
  // ヘルパー関数：トークンを簡単に作成
  function createToken(type: BasicParserTokenType, value: string, line = 1, column = 1): BasicParserToken {
    return { type, value, line, column };
  }

  function createTokens(tokenDefs: Array<[BasicParserTokenType, string, number?, number?]>): BasicParserToken[] {
    const tokens = tokenDefs.map(([type, value, line = 1, column = 1]) => 
      createToken(type, value, line, column)
    );
    tokens.push(createToken(BasicParserTokenType.EOF, '', 1, 100));
    return tokens;
  }

  describe('基本機能テスト', () => {
    test('空のプログラムの解析', () => {
      const tokens = [createToken(BasicParserTokenType.EOF, '')];
      const parser = new BasicASTParser(tokens);
      const ast = parser.parse();
      
      expect(ast.type).toBe('Program');
      expect(ast.statements).toHaveLength(0);
    });

    test('単一の変数宣言', () => {
      const tokens = createTokens([
        [BasicParserTokenType.DEF, 'DEF'],
        [BasicParserTokenType.VARIABLE, '$x'],
        [BasicParserTokenType.ASSIGN, '='],
        [BasicParserTokenType.NUMBER, '42']
      ]);
      
      const parser = new BasicASTParser(tokens);
      const ast = parser.parse();
      
      expect(ast.statements).toHaveLength(1);
      
      const decl = ast.statements[0] as VariableDeclarationNode;
      expect(decl.type).toBe('VariableDeclaration');
      expect(decl.name).toBe('$x');
      
      const init = decl.initializer as NumberLiteralNode;
      expect(init.type).toBe('NumberLiteral');
      expect(init.value).toBe(42);
    });

    test('単一のSAYコマンド', () => {
      const tokens = createTokens([
        [BasicParserTokenType.SAY, 'SAY'],
        [BasicParserTokenType.STRING, 'Hello World']
      ]);
      
      const parser = new BasicASTParser(tokens);
      const ast = parser.parse();
      
      expect(ast.statements).toHaveLength(1);
      
      const say = ast.statements[0] as SayCommandNode;
      expect(say.type).toBe('SayCommand');
      
      const message = say.message as StringLiteralNode;
      expect(message.type).toBe('StringLiteral');
      expect(message.value).toBe('Hello World');
    });
  });

  describe('複数文の解析', () => {
    test('変数宣言とSAYコマンドの組み合わせ', () => {
      const tokens = createTokens([
        [BasicParserTokenType.DEF, 'DEF'],
        [BasicParserTokenType.VARIABLE, '$message'],
        [BasicParserTokenType.ASSIGN, '='],
        [BasicParserTokenType.STRING, 'Hello'],
        [BasicParserTokenType.SAY, 'SAY'],
        [BasicParserTokenType.VARIABLE, '$message']
      ]);
      
      const parser = new BasicASTParser(tokens);
      const ast = parser.parse();
      
      expect(ast.statements).toHaveLength(2);
      
      // 1つ目: 変数宣言
      const decl = ast.statements[0] as VariableDeclarationNode;
      expect(decl.type).toBe('VariableDeclaration');
      expect(decl.name).toBe('$message');
      
      const init = decl.initializer as StringLiteralNode;
      expect(init.type).toBe('StringLiteral');
      expect(init.value).toBe('Hello');
      
      // 2つ目: SAYコマンド
      const say = ast.statements[1] as SayCommandNode;
      expect(say.type).toBe('SayCommand');
      
      const variable = say.message as VariableNode;
      expect(variable.type).toBe('Variable');
      expect(variable.name).toBe('$message');
    });

    test('複数の変数宣言', () => {
      const tokens = createTokens([
        [BasicParserTokenType.DEF, 'DEF'],
        [BasicParserTokenType.VARIABLE, '$health'],
        [BasicParserTokenType.ASSIGN, '='],
        [BasicParserTokenType.NUMBER, '100'],
        [BasicParserTokenType.DEF, 'DEF'],
        [BasicParserTokenType.VARIABLE, '$name'],
        [BasicParserTokenType.ASSIGN, '='],
        [BasicParserTokenType.STRING, 'Bot']
      ]);
      
      const parser = new BasicASTParser(tokens);
      const ast = parser.parse();
      
      expect(ast.statements).toHaveLength(2);
      
      // 1つ目: 数値の変数宣言
      const decl1 = ast.statements[0] as VariableDeclarationNode;
      expect(decl1.name).toBe('$health');
      expect((decl1.initializer as NumberLiteralNode).value).toBe(100);
      
      // 2つ目: 文字列の変数宣言
      const decl2 = ast.statements[1] as VariableDeclarationNode;
      expect(decl2.name).toBe('$name');
      expect((decl2.initializer as StringLiteralNode).value).toBe('Bot');
    });
  });

  describe('式の種類テスト', () => {
    test('数値リテラルの解析', () => {
      const tokens = createTokens([
        [BasicParserTokenType.DEF, 'DEF'],
        [BasicParserTokenType.VARIABLE, '$pi'],
        [BasicParserTokenType.ASSIGN, '='],
        [BasicParserTokenType.NUMBER, '3.14']
      ]);
      
      const parser = new BasicASTParser(tokens);
      const ast = parser.parse();
      
      const decl = ast.statements[0] as VariableDeclarationNode;
      const number = decl.initializer as NumberLiteralNode;
      expect(number.type).toBe('NumberLiteral');
      expect(number.value).toBe(3.14);
    });

    test('文字列リテラルの解析', () => {
      const tokens = createTokens([
        [BasicParserTokenType.SAY, 'SAY'],
        [BasicParserTokenType.STRING, 'Hello, Minecraft World!']
      ]);
      
      const parser = new BasicASTParser(tokens);
      const ast = parser.parse();
      
      const say = ast.statements[0] as SayCommandNode;
      const string = say.message as StringLiteralNode;
      expect(string.type).toBe('StringLiteral');
      expect(string.value).toBe('Hello, Minecraft World!');
    });

    test('変数参照の解析', () => {
      const tokens = createTokens([
        [BasicParserTokenType.SAY, 'SAY'],
        [BasicParserTokenType.VARIABLE, '$playerName']
      ]);
      
      const parser = new BasicASTParser(tokens);
      const ast = parser.parse();
      
      const say = ast.statements[0] as SayCommandNode;
      const variable = say.message as VariableNode;
      expect(variable.type).toBe('Variable');
      expect(variable.name).toBe('$playerName');
    });
  });

  describe('位置情報の正確性', () => {
    test('行番号と列番号の保持', () => {
      const tokens = [
        createToken(BasicParserTokenType.DEF, 'DEF', 1, 1),
        createToken(BasicParserTokenType.VARIABLE, '$x', 1, 5),
        createToken(BasicParserTokenType.ASSIGN, '=', 1, 8),
        createToken(BasicParserTokenType.NUMBER, '42', 1, 10),
        createToken(BasicParserTokenType.EOF, '', 1, 12)
      ];
      
      const parser = new BasicASTParser(tokens);
      const ast = parser.parse();
      
      const decl = ast.statements[0] as VariableDeclarationNode;
      expect(decl.line).toBe(1);
      expect(decl.column).toBe(5); // 変数名の位置
      
      const number = decl.initializer as NumberLiteralNode;
      expect(number.line).toBe(1);
      expect(number.column).toBe(10);
    });

    test('複数行での位置情報', () => {
      const tokens = [
        createToken(BasicParserTokenType.DEF, 'DEF', 1, 1),
        createToken(BasicParserTokenType.VARIABLE, '$message', 1, 5),
        createToken(BasicParserTokenType.ASSIGN, '=', 1, 13),
        createToken(BasicParserTokenType.STRING, 'Line 1', 1, 15),
        createToken(BasicParserTokenType.SAY, 'SAY', 2, 1),
        createToken(BasicParserTokenType.VARIABLE, '$message', 2, 5),
        createToken(BasicParserTokenType.EOF, '', 2, 13)
      ];
      
      const parser = new BasicASTParser(tokens);
      const ast = parser.parse();
      
      expect(ast.statements).toHaveLength(2);
      
      const decl = ast.statements[0] as VariableDeclarationNode;
      expect(decl.line).toBe(1);
      
      const say = ast.statements[1] as SayCommandNode;
      expect(say.line).toBe(2);
      expect(say.column).toBe(1);
    });
  });

  describe('エラーハンドリング', () => {
    test('不正なトークンでのエラー', () => {
      const tokens = createTokens([
        [BasicParserTokenType.NUMBER, '42'] // DEFやSAYでない
      ]);
      
      const parser = new BasicASTParser(tokens);
      
      expect(() => parser.parse()).toThrow(/unexpected token.*42/i);
    });

    test('不完全な変数宣言', () => {
      const tokens = createTokens([
        [BasicParserTokenType.DEF, 'DEF'],
        // VARIABLE がない
        [BasicParserTokenType.ASSIGN, '=']
      ]);
      
      const parser = new BasicASTParser(tokens);
      
      expect(() => parser.parse()).toThrow(/expected variable name/i);
    });

    test('代入演算子の不在', () => {
      const tokens = createTokens([
        [BasicParserTokenType.DEF, 'DEF'],
        [BasicParserTokenType.VARIABLE, '$x'],
        // ASSIGN がない
        [BasicParserTokenType.NUMBER, '42']
      ]);
      
      const parser = new BasicASTParser(tokens);
      
      expect(() => parser.parse()).toThrow(/expected.*=/i);
    });

    test('SAYコマンドの引数不足', () => {
      const tokens = [
        createToken(BasicParserTokenType.SAY, 'SAY'),
        createToken(BasicParserTokenType.EOF, '')
      ];
      
      const parser = new BasicASTParser(tokens);
      
      expect(() => parser.parse()).toThrow(/unexpected token/i);
    });
  });

  describe('境界条件テスト', () => {
    test('非常に長い変数名', () => {
      const longName = '$' + 'a'.repeat(100);
      const tokens = createTokens([
        [BasicParserTokenType.DEF, 'DEF'],
        [BasicParserTokenType.VARIABLE, longName],
        [BasicParserTokenType.ASSIGN, '='],
        [BasicParserTokenType.NUMBER, '1']
      ]);
      
      const parser = new BasicASTParser(tokens);
      const ast = parser.parse();
      
      const decl = ast.statements[0] as VariableDeclarationNode;
      expect(decl.name).toBe(longName);
    });

    test('ゼロと負数の処理', () => {
      const tokens = createTokens([
        [BasicParserTokenType.DEF, 'DEF'],
        [BasicParserTokenType.VARIABLE, '$zero'],
        [BasicParserTokenType.ASSIGN, '='],
        [BasicParserTokenType.NUMBER, '0']
      ]);
      
      const parser = new BasicASTParser(tokens);
      const ast = parser.parse();
      
      const decl = ast.statements[0] as VariableDeclarationNode;
      const number = decl.initializer as NumberLiteralNode;
      expect(number.value).toBe(0);
    });

    test('空文字列の処理', () => {
      const tokens = createTokens([
        [BasicParserTokenType.SAY, 'SAY'],
        [BasicParserTokenType.STRING, '']
      ]);
      
      const parser = new BasicASTParser(tokens);
      const ast = parser.parse();
      
      const say = ast.statements[0] as SayCommandNode;
      const string = say.message as StringLiteralNode;
      expect(string.value).toBe('');
    });
  });

  describe('成功判定テスト', () => {
    test('🎉 基本的なBotScriptプログラムの完全な解析', () => {
      const tokens = createTokens([
        [BasicParserTokenType.DEF, 'DEF'],
        [BasicParserTokenType.VARIABLE, '$botName'],
        [BasicParserTokenType.ASSIGN, '='],
        [BasicParserTokenType.STRING, 'MineBot'],
        
        [BasicParserTokenType.DEF, 'DEF'],
        [BasicParserTokenType.VARIABLE, '$health'],
        [BasicParserTokenType.ASSIGN, '='],
        [BasicParserTokenType.NUMBER, '100'],
        
        [BasicParserTokenType.SAY, 'SAY'],
        [BasicParserTokenType.STRING, 'Bot initialized!'],
        
        [BasicParserTokenType.SAY, 'SAY'],
        [BasicParserTokenType.VARIABLE, '$botName']
      ]);
      
      const parser = new BasicASTParser(tokens);
      const ast = parser.parse();
      
      // プログラム構造の検証
      expect(ast.type).toBe('Program');
      expect(ast.statements).toHaveLength(4);
      
      // 1つ目: 文字列変数宣言
      const decl1 = ast.statements[0] as VariableDeclarationNode;
      expect(decl1.type).toBe('VariableDeclaration');
      expect(decl1.name).toBe('$botName');
      expect((decl1.initializer as StringLiteralNode).value).toBe('MineBot');
      
      // 2つ目: 数値変数宣言
      const decl2 = ast.statements[1] as VariableDeclarationNode;
      expect(decl2.type).toBe('VariableDeclaration');
      expect(decl2.name).toBe('$health');
      expect((decl2.initializer as NumberLiteralNode).value).toBe(100);
      
      // 3つ目: 文字列リテラルのSAY
      const say1 = ast.statements[2] as SayCommandNode;
      expect(say1.type).toBe('SayCommand');
      expect((say1.message as StringLiteralNode).value).toBe('Bot initialized!');
      
      // 4つ目: 変数参照のSAY
      const say2 = ast.statements[3] as SayCommandNode;
      expect(say2.type).toBe('SayCommand');
      expect((say2.message as VariableNode).name).toBe('$botName');
      
      // AST構造の表示（デバッグ用）
      console.log('🎉 02_parser 初級問題1クリア！基本的なAST構築ができました！');
      console.log('📊 解析結果:');
      console.log(`  - プログラム: ${ast.statements.length}文`);
      console.log(`  - 変数宣言: ${ast.statements.filter(s => s.type === 'VariableDeclaration').length}個`);
      console.log(`  - SAYコマンド: ${ast.statements.filter(s => s.type === 'SayCommand').length}個`);
    });
  });
});