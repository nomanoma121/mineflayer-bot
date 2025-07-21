import { ASTNodeType, BinaryOperator, UnaryOperator } from "../ast/ASTNode";
import { Lexer } from "../lexer/Lexer";
import { Parser } from "../parser/Parser";

describe("BotScript Parser", () => {
	let parser: Parser;

	const parseScript = (script: string) => {
		const lexer = new Lexer(script);
		const tokens = lexer.tokenize();
		parser = new Parser(tokens);
		return parser.parse();
	};

	describe("Literals", () => {
		test("should parse number literals", () => {
			const ast = parseScript("42");

			expect(ast.type).toBe(ASTNodeType.PROGRAM);
			expect(ast.statements).toHaveLength(1);

			const numberNode = ast.statements[0];
			expect(numberNode.type).toBe(ASTNodeType.NUMBER_LITERAL);
			expect((numberNode as any).value).toBe(42);
		});

		test("should parse decimal numbers", () => {
			const ast = parseScript("3.14");

			const numberNode = ast.statements[0];
			expect(numberNode.type).toBe(ASTNodeType.NUMBER_LITERAL);
			expect((numberNode as any).value).toBe(3.14);
		});

		test("should parse string literals", () => {
			const ast = parseScript('"hello world"');

			const stringNode = ast.statements[0];
			expect(stringNode.type).toBe(ASTNodeType.STRING_LITERAL);
			expect((stringNode as any).value).toBe("hello world");
		});

		test("should parse boolean literals", () => {
			const ast = parseScript("TRUE");

			const boolNode = ast.statements[0];
			expect(boolNode.type).toBe(ASTNodeType.BOOLEAN_LITERAL);
			expect((boolNode as any).value).toBe(true);
		});

		test("should parse variable references", () => {
			const ast = parseScript("health");

			const varNode = ast.statements[0];
			expect(varNode.type).toBe(ASTNodeType.VARIABLE_REFERENCE);
			expect((varNode as any).name).toBe("health");
		});
	});

	describe("Variable Declaration", () => {
		test("should parse simple variable declaration", () => {
			const ast = parseScript("var health = 20");

			expect(ast.statements).toHaveLength(1);
			const varDecl = ast.statements[0];
			expect(varDecl.type).toBe(ASTNodeType.VARIABLE_DECLARATION);
			expect((varDecl as any).name).toBe("health");
			expect((varDecl as any).initializer.type).toBe(
				ASTNodeType.NUMBER_LITERAL,
			);
			expect((varDecl as any).initializer.value).toBe(20);
		});

		test("should parse variable declaration with string", () => {
			const ast = parseScript('var message = "hello"');

			const varDecl = ast.statements[0];
			expect((varDecl as any).name).toBe("message");
			expect((varDecl as any).initializer.type).toBe(
				ASTNodeType.STRING_LITERAL,
			);
			expect((varDecl as any).initializer.value).toBe("hello");
		});

		test("should parse variable declaration with expression", () => {
			const ast = parseScript("var result = 5 + 3");

			const varDecl = ast.statements[0];
			expect((varDecl as any).name).toBe("result");
			expect((varDecl as any).initializer.type).toBe(
				ASTNodeType.BINARY_EXPRESSION,
			);
		});
	});

	describe("Binary Expressions", () => {
		test("should parse arithmetic expressions", () => {
			const ast = parseScript("5 + 3");

			const expr = ast.statements[0];
			expect(expr.type).toBe(ASTNodeType.BINARY_EXPRESSION);
			expect((expr as any).operator).toBe(BinaryOperator.ADD);
			expect((expr as any).left.type).toBe(ASTNodeType.NUMBER_LITERAL);
			expect((expr as any).left.value).toBe(5);
			expect((expr as any).right.type).toBe(ASTNodeType.NUMBER_LITERAL);
			expect((expr as any).right.value).toBe(3);
		});

		test("should parse comparison expressions", () => {
			const ast = parseScript(`health < 10`);

			const expr = ast.statements[0];
			expect(expr.type).toBe(ASTNodeType.BINARY_EXPRESSION);
			expect((expr as any).operator).toBe(BinaryOperator.LESS_THAN);
			expect((expr as any).left.type).toBe(ASTNodeType.VARIABLE_REFERENCE);
			expect((expr as any).right.type).toBe(ASTNodeType.NUMBER_LITERAL);
		});

		test("should parse logical expressions", () => {
			const ast = parseScript(`health > 10 and health < 20`);

			const expr = ast.statements[0];
			expect(expr.type).toBe(ASTNodeType.BINARY_EXPRESSION);
			expect((expr as any).operator).toBe(BinaryOperator.AND);
			expect((expr as any).left.type).toBe(ASTNodeType.BINARY_EXPRESSION);
			expect((expr as any).right.type).toBe(ASTNodeType.BINARY_EXPRESSION);
		});

		test("should respect operator precedence", () => {
			const ast = parseScript("2 + 3 * 4");

			const expr = ast.statements[0];
			expect(expr.type).toBe(ASTNodeType.BINARY_EXPRESSION);
			expect((expr as any).operator).toBe(BinaryOperator.ADD);
			expect((expr as any).left.value).toBe(2);
			expect((expr as any).right.type).toBe(ASTNodeType.BINARY_EXPRESSION);
			expect((expr as any).right.operator).toBe(BinaryOperator.MULTIPLY);
		});
	});

	describe("Unary Expressions", () => {
		test("should parse NOT expressions", () => {
			const ast = parseScript("not true");

			const expr = ast.statements[0];
			expect(expr.type).toBe(ASTNodeType.UNARY_EXPRESSION);
			expect((expr as any).operator).toBe(UnaryOperator.NOT);
			expect((expr as any).operand.type).toBe(ASTNodeType.BOOLEAN_LITERAL);
		});

		test("should parse negative numbers", () => {
			const ast = parseScript("-42");

			const expr = ast.statements[0];
			expect(expr.type).toBe(ASTNodeType.UNARY_EXPRESSION);
			expect((expr as any).operator).toBe(UnaryOperator.MINUS);
			expect((expr as any).operand.value).toBe(42);
		});
	});

	describe("Bot Commands", () => {
		test("should parse SAY command", () => {
			const ast = parseScript('say "hello world"');

			const stmt = ast.statements[0];
			expect(stmt.type).toBe(ASTNodeType.COMMAND_STATEMENT);
			expect((stmt as any).command.type).toBe(ASTNodeType.SAY_COMMAND);
			expect((stmt as any).command.message.type).toBe(
				ASTNodeType.STRING_LITERAL,
			);
			expect((stmt as any).command.message.value).toBe("hello world");
		});

		test("should parse SAY command with variable", () => {
			const ast = parseScript("say message");

			const stmt = ast.statements[0];
			expect((stmt as any).command.message.type).toBe(
				ASTNodeType.VARIABLE_REFERENCE,
			);
			expect((stmt as any).command.message.name).toBe("message");
		});

		test("should parse GOTO command", () => {
			const ast = parseScript("goto 100 64 200");

			const stmt = ast.statements[0];
			expect(stmt.type).toBe(ASTNodeType.COMMAND_STATEMENT);
			expect((stmt as any).command.type).toBe(ASTNodeType.GOTO_COMMAND);
			expect((stmt as any).command.x.value).toBe(100);
			expect((stmt as any).command.y.value).toBe(64);
			expect((stmt as any).command.z.value).toBe(200);
		});

		test("should parse ATTACK command", () => {
			const ast = parseScript('attack "zombie"');

			const stmt = ast.statements[0];
			expect((stmt as any).command.type).toBe(ASTNodeType.ATTACK_COMMAND);
			expect((stmt as any).command.target.value).toBe("zombie");
		});

		test("should parse DIG command", () => {
			const ast = parseScript('dig "stone"');

			const stmt = ast.statements[0];
			expect((stmt as any).command.type).toBe(ASTNodeType.DIG_COMMAND);
			expect((stmt as any).command.blockType.value).toBe("stone");
		});

		test("should parse DIG command without block type", () => {
			const ast = parseScript("dig");

			const stmt = ast.statements[0];
			expect((stmt as any).command.blockType).toBeUndefined();
		});

		test("should parse EQUIP command", () => {
			const ast = parseScript('equip "sword"');

			const stmt = ast.statements[0];
			expect((stmt as any).command.type).toBe(ASTNodeType.EQUIP_COMMAND);
			expect((stmt as any).command.item.value).toBe("sword");
		});

		test("should parse DROP command", () => {
			const ast = parseScript('drop "stone" 10');

			const stmt = ast.statements[0];
			expect((stmt as any).command.type).toBe(ASTNodeType.DROP_COMMAND);
			expect((stmt as any).command.item.value).toBe("stone");
			expect((stmt as any).command.count.value).toBe(10);
		});

		test("should parse WAIT command", () => {
			const ast = parseScript("wait 5");

			const stmt = ast.statements[0];
			expect((stmt as any).command.type).toBe(ASTNodeType.WAIT_COMMAND);
			expect((stmt as any).command.duration.value).toBe(5);
		});
	});

	describe("Control Flow", () => {
		test("should parse IF statement", () => {
			const ast = parseScript(`
        if health < 10 {
          say "Low health!"
        }
      `);

			const stmt = ast.statements[0];
			expect(stmt.type).toBe(ASTNodeType.IF_STATEMENT);
			expect((stmt as any).condition.type).toBe(ASTNodeType.BINARY_EXPRESSION);
			expect((stmt as any).thenStatements).toHaveLength(1);
			expect((stmt as any).elseStatements).toBeUndefined();
		});

		test("should parse IF-ELSE statement", () => {
			const ast = parseScript(`
        if health < 10 {
          say "Low health!"
        } else {
          say "Health is good"
        }
      `);

			const stmt = ast.statements[0];
			expect((stmt as any).elseStatements).toHaveLength(1);
		});

		test("should parse REPEAT statement", () => {
			const ast = parseScript(`
        repeat 3 {
          say "Hello"
        }
      `);

			const stmt = ast.statements[0];
			expect(stmt.type).toBe(ASTNodeType.REPEAT_STATEMENT);
			expect((stmt as any).count.value).toBe(3);
			expect((stmt as any).statements).toHaveLength(1);
		});

		test("should parse nested control structures", () => {
			const ast = parseScript(`
        if health < 10 {
          repeat 3 {
            say "Healing"
          }
        }
      `);

			const ifStmt = ast.statements[0];
			expect((ifStmt as any).thenStatements).toHaveLength(1);
			expect((ifStmt as any).thenStatements[0].type).toBe(
				ASTNodeType.REPEAT_STATEMENT,
			);
		});
	});

	describe("Assignment", () => {
		test("should parse variable assignment", () => {
			const ast = parseScript("set health = 15");

			const stmt = ast.statements[0];
			expect(stmt.type).toBe(ASTNodeType.ASSIGNMENT_STATEMENT);
			expect((stmt as any).target.name).toBe("health");
			expect((stmt as any).value.value).toBe(15);
		});

		test("should parse assignment with expression", () => {
			const ast = parseScript("set result = a + b");

			const stmt = ast.statements[0];
			expect((stmt as any).value.type).toBe(ASTNodeType.BINARY_EXPRESSION);
		});
	});

	describe("Multiple Statements", () => {
		test("should parse multiple statements", () => {
			const ast = parseScript(`
        var health = 20
        say "Bot started"
        if health > 15 {
          say "Feeling good!"
        }
      `);

			expect(ast.statements).toHaveLength(3);
			expect(ast.statements[0].type).toBe(ASTNodeType.VARIABLE_DECLARATION);
			expect(ast.statements[1].type).toBe(ASTNodeType.COMMAND_STATEMENT);
			expect(ast.statements[2].type).toBe(ASTNodeType.IF_STATEMENT);
		});

		test("should handle newlines correctly", () => {
			const ast = parseScript('say "first"\nsay "second"');

			expect(ast.statements).toHaveLength(2);
		});
	});

	describe("Error Handling", () => {
		test("should throw error for invalid syntax", () => {
			expect(() => parseScript("var = 20")).toThrow();
		});

		test("should throw error for unterminated IF", () => {
			expect(() => parseScript('if true then say "test"')).toThrow();
		});

		test("should throw error for unterminated REPEAT", () => {
			expect(() => parseScript('repeat 3 say "test"')).toThrow();
		});

		test("should throw error for missing LEFT BRACE", () => {
			expect(() => parseScript('if true say "test" }')).toThrow();
		});

		test("should provide meaningful error messages", () => {
			try {
				parseScript("var var");
			} catch (error) {
				expect((error as Error).message).toContain("Expected");
			}
		});
	});

	describe("Comments and Whitespace", () => {
		test("should handle extra whitespace", () => {
			const ast = parseScript('   say   "hello"   ');

			expect(ast.statements).toHaveLength(1);
			expect((ast.statements[0] as any).command.message.value).toBe("hello");
		});

		test("should handle empty lines", () => {
			const ast = parseScript('\n\nsay "hello"\n\n');

			expect(ast.statements).toHaveLength(1);
		});
	});
});
