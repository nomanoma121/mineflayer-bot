import { Vec3 } from "vec3";
import { MinecraftBotMock } from "../../__mocks__/MinecraftBotMock";
import type { Bot } from "../../core/Bot";
import { ExecutionContext } from "../interpreter/ExecutionContext";
import { ExecutionResultType, Interpreter } from "../interpreter/Interpreter";
import { Lexer } from "../lexer/Lexer";
import { Parser } from "../parser/Parser";

describe("BotScript Interpreter", () => {
	let interpreter: Interpreter;
	let context: ExecutionContext;
	let mockBot: Bot;

	beforeEach(() => {
		const botMock = new MinecraftBotMock();
		// ボットの位置をブロック位置に近づける
		botMock.entity.position = new Vec3(100, 64, -200);

		// モック用のBotオブジェクトを作成
		mockBot = {
			mc: botMock,
			getName: () => "TestBot",
			getPosition: () => ({ x: 100, y: 64, z: -200 }),
			getInventory: jest.fn().mockReturnValue([]),
			vitals: {
				getVitalStats: jest.fn().mockReturnValue({
					health: 20,
					hunger: 20,
					saturation: 20,
					oxygen: 20,
					experience: { level: 0, points: 0 },
					isInDanger: false,
				}),
				needsToEat: jest.fn().mockReturnValue(false),
				isHealthLow: jest.fn().mockReturnValue(false),
				isHungerLow: jest.fn().mockReturnValue(false),
			},
			sensing: {
				findNearestEntity: jest.fn().mockReturnValue(null),
				getEnvironmentInfo: jest.fn().mockReturnValue({
					position: { x: 100, y: 64, z: -200 },
					lightLevel: 15,
					time: { isNight: false, timeOfDay: 1000 },
					weather: { isRaining: false },
					nearbyPlayersCount: 0,
					nearbyHostileMobsCount: 0,
					nearbyAnimalsCount: 0,
				}),
				findNearestBlock: jest.fn().mockReturnValue(new Vec3(100, 63, -200)),
			},
			inventory: {
				hasItem: jest.fn().mockReturnValue(false),
				findItem: jest.fn().mockReturnValue(null),
				dropItem: jest.fn().mockResolvedValue(undefined),
				getInventoryInfo: jest.fn().mockReturnValue({
					usedSlots: 0,
					totalSlots: 36,
					emptySlots: 36,
					equippedItem: null,
				}),
				isFull: jest.fn().mockReturnValue(false),
				findBestTool: jest.fn().mockReturnValue(null),
			},
			say: {
				say: jest.fn(),
			},
			goto: jest.fn().mockResolvedValue(undefined),
			sendMessage: jest.fn(),
		} as any;

		// sensing能力にmockエンティティを追加してATTACKテストを成功させる
		mockBot.sensing.findNearestEntity = jest
			.fn()
			.mockImplementation((filter) => {
				const mockEntity = {
					id: 1,
					name: "zombie",
					type: "mob",
					displayName: "Zombie",
					username: "zombie",
				};

				// フィルター関数を呼び出してマッチするかチェック
				if (typeof filter === "function") {
					return filter(mockEntity) ? mockEntity : null;
				}
				return mockEntity;
			});

		// inventory能力でアイテムが見つかるようにmock
		mockBot.inventory.findItem = jest.fn().mockImplementation((itemName) => {
			// DROPコマンド用のアイテム（stoneなど）
			if (itemName === "stone") {
				return {
					name: "stone",
					type: 1,
					count: 64,
				};
			}
			// EQUIPコマンド用のアイテム（swordなど）
			return {
				name: itemName,
				type: 267,
				count: 1,
			};
		});

		mockBot.getInventory = jest.fn().mockReturnValue([]);

		// mineflayer Botに必要なプロパティを追加
		(mockBot.mc as any).registry = {
			blocksByName: {
				stone: { id: 1 },
				log: { id: 17 },
			},
		};
		(mockBot.mc as any).blockAtCursor = jest.fn().mockReturnValue({
			position: new Vec3(100, 63, -200),
			name: "stone",
		});
		(mockBot.mc as any).targetDigBlock = {
			position: new Vec3(100, 63, -200),
			name: "stone",
		};
		(mockBot.mc as any).dig = jest.fn().mockResolvedValue(undefined);
		(mockBot.mc as any).placeBlock = jest.fn().mockResolvedValue(undefined);
		(mockBot.mc as any).blockAt = jest.fn().mockReturnValue({
			position: new Vec3(100, 63, -200),
			name: "stone",
		});

		context = new ExecutionContext();
		interpreter = new Interpreter(mockBot, context);
	});

	const executeScript = async (script: string) => {
		const lexer = new Lexer(script);
		const tokens = lexer.tokenize();
		const parser = new Parser(tokens);
		const ast = parser.parse();
		return await interpreter.execute(ast);
	};

	describe("Expression Evaluation", () => {
		test("should evaluate number literals", async () => {
			const result = await executeScript("42");
			if (result.type === ExecutionResultType.ERROR) {
				console.log("Error details:", result.message);
			}
			expect(result.type).toBe(ExecutionResultType.SUCCESS);
		});

		test("should evaluate string literals", async () => {
			const result = await executeScript('"hello world"');
			expect(result.type).toBe(ExecutionResultType.SUCCESS);
		});

		test("should evaluate boolean literals", async () => {
			const result = await executeScript("true");
			expect(result.type).toBe(ExecutionResultType.SUCCESS);
		});

		test("should evaluate arithmetic expressions", async () => {
			const result = await executeScript("5 + 3 * 2");
			expect(result.type).toBe(ExecutionResultType.SUCCESS);
		});

		test("should evaluate comparison expressions", async () => {
			const result = await executeScript("5 > 3");
			expect(result.type).toBe(ExecutionResultType.SUCCESS);
		});

		test("should evaluate logical expressions", async () => {
			const result = await executeScript("true and false");
			expect(result.type).toBe(ExecutionResultType.SUCCESS);
		});

		test("should handle string concatenation", async () => {
			const result = await executeScript('"Hello" + " " + "World"');
			expect(result.type).toBe(ExecutionResultType.SUCCESS);
		});

		test("should throw error for division by zero", async () => {
			const result = await executeScript("10 / 0");
			expect(result.type).toBe(ExecutionResultType.ERROR);
			expect(result.message).toContain("Division by zero");
		});

		test("should throw error for invalid operations", async () => {
			const result = await executeScript('"hello" - 5');
			expect(result.type).toBe(ExecutionResultType.ERROR);
			expect(result.message).toContain("requires numbers");
		});
	});

	describe("Variable Management", () => {
		test("should define and use variables", async () => {
			const result = await executeScript(`
        var health = 20
        health
      `);

			expect(result.type).toBe(ExecutionResultType.SUCCESS);
			expect(context.getVariable("health")).toBe(20);
		});

		test("should assign values to variables", async () => {
			const result = await executeScript(`
        var counter = 0
        set counter = 5
      `);

			expect(result.type).toBe(ExecutionResultType.SUCCESS);
			expect(context.getVariable("counter")).toBe(5);
		});

		test("should use variables in expressions", async () => {
			const result = await executeScript(`
        var a = 10
        var b = 5
        var result = a + b * 2
      `);

			expect(result.type).toBe(ExecutionResultType.SUCCESS);
			expect(context.getVariable("result")).toBe(20);
		});

		test("should throw error for undefined variables", async () => {
			const result = await executeScript("undefined_var");
			expect(result.type).toBe(ExecutionResultType.ERROR);
			expect(result.message).toContain("Undefined variable: undefined_var");
		});

		test("should access built-in variables", async () => {
			const result = await executeScript("bot_name");
			expect(result.type).toBe(ExecutionResultType.SUCCESS);
			expect(context.getVariable("bot_name")).toBe("BotScript");
		});
	});

	describe("Control Flow", () => {
		test("should execute IF statement (true condition)", async () => {
			const result = await executeScript(`
        var executed = false
        if true {
          set executed = true
        }
      `);

			expect(result.type).toBe(ExecutionResultType.SUCCESS);
			expect(context.getVariable("executed")).toBe(true);
		});

		test("should skip IF statement (false condition)", async () => {
			const result = await executeScript(`
        var executed = false
        if false {
          set executed = true
        }
      `);

			expect(result.type).toBe(ExecutionResultType.SUCCESS);
			expect(context.getVariable("executed")).toBe(false);
		});

		test("should execute ELSE branch", async () => {
			const result = await executeScript(`
        var branch = "none"
        if false {
          set branch = "if"
        } else {
          set branch = "else"
        }
      `);

			expect(result.type).toBe(ExecutionResultType.SUCCESS);
			expect(context.getVariable("branch")).toBe("else");
		});

		test("should handle complex conditions", async () => {
			const result = await executeScript(`
        var a = 10
        var b = 5
        var result = false
        if a > b and b > 0 {
          set result = true
        }
      `);

			expect(result.type).toBe(ExecutionResultType.SUCCESS);
			expect(context.getVariable("result")).toBe(true);
		});

		test("should execute REPEAT statement", async () => {
			const result = await executeScript(`
        var counter = 0
        repeat 3 {
          set counter = counter + 1
        }
      `);

			expect(result.type).toBe(ExecutionResultType.SUCCESS);
			expect(context.getVariable("counter")).toBe(3);
		});

		test("should handle REPEAT with zero count", async () => {
			const result = await executeScript(`
        var counter = 0
        repeat 0 {
          set counter = 1
        }
      `);

			expect(result.type).toBe(ExecutionResultType.SUCCESS);
			expect(context.getVariable("counter")).toBe(0);
		});

		test("should handle REPEAT with variable count", async () => {
			const result = await executeScript(`
        var times = 4
        var sum = 0
        repeat times {
          set sum = sum + 1
        }
      `);

			expect(result.type).toBe(ExecutionResultType.SUCCESS);
			expect(context.getVariable("sum")).toBe(4);
		});

		test("should throw error for negative REPEAT count", async () => {
			const result = await executeScript(`
        repeat -1 {
          say "test"
        }
      `);

			expect(result.type).toBe(ExecutionResultType.ERROR);
			expect(result.message).toContain("must be non-negative");
		});

		test("should throw error for non-number REPEAT count", async () => {
			const result = await executeScript(`
        repeat "invalid" {
          say "test"
        }
      `);

			expect(result.type).toBe(ExecutionResultType.ERROR);
			expect(result.message).toContain("must be a number");
		});
	});

	describe("Bot Commands", () => {
		test("should execute SAY command", async () => {
			const result = await executeScript('say "Hello World"');

			expect(result.type).toBe(ExecutionResultType.SUCCESS);
			// Note: この時点では実際のボット動作のモックアップ
		});

		test("should execute SAY command with variable", async () => {
			const result = await executeScript(`
        var message = "Hello from variable"
        say message
      `);

			expect(result.type).toBe(ExecutionResultType.SUCCESS);
		});

		test("should execute GOTO command", async () => {
			const result = await executeScript("goto 100 64 200");

			expect(result.type).toBe(ExecutionResultType.SUCCESS);
		});

		test("should execute GOTO command with variables", async () => {
			const result = await executeScript(`
        var x = 150
        var y = 80
        var z = 250
        goto x y z
      `);

			expect(result.type).toBe(ExecutionResultType.SUCCESS);
		});

		test("should execute ATTACK command", async () => {
			const result = await executeScript('attack "zombie"');

			if (result.type === ExecutionResultType.ERROR) {
				console.log("ATTACK Error details:", result.message);
			}
			expect(result.type).toBe(ExecutionResultType.SUCCESS);
		});

		test("should execute DIG command", async () => {
			const result = await executeScript('dig "stone"');

			if (result.type === ExecutionResultType.ERROR) {
				console.log("DIG Error details:", result.message);
			}
			expect(result.type).toBe(ExecutionResultType.SUCCESS);
		});

		test("should execute DIG command without block type", async () => {
			const result = await executeScript("dig");

			if (result.type === ExecutionResultType.ERROR) {
				console.log("DIG without block Error details:", result.message);
			}
			expect(result.type).toBe(ExecutionResultType.SUCCESS);
		});

		test("should execute EQUIP command", async () => {
			const result = await executeScript('equip "sword"');

			expect(result.type).toBe(ExecutionResultType.SUCCESS);
		});

		test("should execute DROP command", async () => {
			const result = await executeScript('drop "stone" 10');

			expect(result.type).toBe(ExecutionResultType.SUCCESS);
		});

		test("should execute WAIT command", async () => {
			const startTime = Date.now();
			const result = await executeScript("wait 0.01"); // 10ms wait
			const endTime = Date.now();

			expect(result.type).toBe(ExecutionResultType.SUCCESS);
			expect(endTime - startTime).toBeGreaterThanOrEqual(5); // Allow some margin
		});
	});

	describe("Complex Scripts", () => {
		test("should execute health monitoring script", async () => {
			const result = await executeScript(`
        var health_threshold = 10
        if bot_health < health_threshold {
          say "Health is low!"
          say "Current health: " + bot_health
        } else {
          say "Health is good"
        } 
      `);

			expect(result.type).toBe(ExecutionResultType.SUCCESS);
		});

		test("should execute resource gathering script", async () => {
			const result = await executeScript(`
        var wood_needed = 5
        var wood_collected = 0

        repeat wood_needed {
          dig "log"
          set wood_collected = wood_collected + 1
          say "Collected " + wood_collected + " wood"
        }

        say "Finished collecting wood!"
      `);

			expect(result.type).toBe(ExecutionResultType.SUCCESS);
			expect(context.getVariable("wood_collected")).toBe(5);
		});

		test("should execute movement pattern script", async () => {
			const result = await executeScript(`
        var start_x = bot_x
        var start_y = bot_y
        var start_z = bot_z

        wait 0.01
        wait 0.01
        wait 0.01

        goto start_x start_y start_z
        say "Returned to starting position"
      `);

			expect(result.type).toBe(ExecutionResultType.SUCCESS);
		});

		test("should handle nested control structures", async () => {
			const result = await executeScript(`
        var total = 0
        repeat 3 {
          var inner_total = 0
          repeat 2 {
            set inner_total = inner_total + 1
            set total = total + 1
          }
          if inner_total == 2 {
            say "Inner loop completed correctly"
          }
        }
      `);

			expect(result.type).toBe(ExecutionResultType.SUCCESS);
			expect(context.getVariable("total")).toBe(6);
		});
	});

	describe("Error Handling", () => {
		test("should handle runtime errors gracefully", async () => {
			const result = await executeScript("undefined_variable + 5");

			expect(result.type).toBe(ExecutionResultType.ERROR);
			expect(result.message).toContain("Undefined variable");
		});

		test("should report line information in errors", async () => {
			const result = await executeScript(`
        var x = 10
        set undefined_var = 5
      `);

			expect(result.type).toBe(ExecutionResultType.ERROR);
			// エラーメッセージに行情報が含まれることを期待
		});

		test("should track execution statistics", async () => {
			await executeScript(`
        var var1 = 1
        var var2 = 2
        say "test"
        if true {
          say "inner"
        }
      `);

			const stats = context.getStats();
			expect(stats.statementsExecuted).toBeGreaterThan(0);
			expect(stats.commandsExecuted).toBeGreaterThan(0);
			expect(stats.variablesCreated).toBeGreaterThan(0);
		});
	});

	describe("Execution Control", () => {
		test("should support stopping execution", async () => {
			// 長時間実行されるスクリプトを開始
			const executePromise = executeScript(`
        repeat 1000000 {
          wait 0.0001
        }
      `);

			// 少し待ってから停止
			setTimeout(() => {
				interpreter.stop();
			}, 10);

			const result = await executePromise;
			expect(result.type).toBe(ExecutionResultType.SUCCESS);
		});

		test("should report execution status", () => {
			expect(interpreter.isExecuting()).toBe(false);
		});

		test("should allow context switching", () => {
			const newContext = new ExecutionContext();
			interpreter.setContext(newContext);

			expect(interpreter.getContext()).toBe(newContext);
		});
	});

	describe("System Integration", () => {
		test("should update system variables", async () => {
			await executeScript('say "Starting"');

			// システム変数が利用可能であることを確認
			expect(context.hasVariable("bot_health")).toBe(true);
			expect(context.hasVariable("bot_food")).toBe(true);
			expect(context.hasVariable("bot_x")).toBe(true);
			expect(context.hasVariable("bot_y")).toBe(true);
			expect(context.hasVariable("bot_z")).toBe(true);
		});

		test("should handle truthiness correctly", async () => {
			const result = await executeScript(`
        var result1 = false
        var result2 = false
        var result3 = false
        var result4 = false

        if 0 {
          set result1 = true
        }

        if 1 {
          set result2 = true
        }

        if "" {
          set result3 = true
        }

        if "hello" {
          set result4 = true
        }
      `);

			expect(result.type).toBe(ExecutionResultType.SUCCESS);
			expect(context.getVariable("result1")).toBe(false); // 0 is falsy
			expect(context.getVariable("result2")).toBe(true); // 1 is truthy
			expect(context.getVariable("result3")).toBe(false); // "" is falsy
			expect(context.getVariable("result4")).toBe(true); // "hello" is truthy
		});
	});
});
