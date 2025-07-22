import { MinecraftBotMock } from "../../__mocks__/MinecraftBotMock";
import type { Bot } from "../../core/Bot";
import { SayAbility } from "../SayAbility";

describe("SayAbility", () => {
	let sayAbility: SayAbility;
	let mockMinecraftBot: MinecraftBotMock;
	let bot: Bot;

	beforeEach(() => {
		sayAbility = new SayAbility();
		mockMinecraftBot = new MinecraftBotMock();

		bot = {
			mc: mockMinecraftBot as any,
			getName: () => "TestBot",
			sendMessage: jest.fn(),
		} as any;

		sayAbility.initialize(bot);
	});

	afterEach(() => {
		mockMinecraftBot.reset();
	});

	describe("initialization", () => {
		it("should have correct name", () => {
			expect(sayAbility.getName()).toBe("Say");
		});

		it("should have correct description", () => {
			expect(sayAbility.getDescription()).toBe(
				"チャットでの発言やメッセージ送信を管理します",
			);
		});

		it("should be available after initialization", () => {
			expect(sayAbility.isAvailable()).toBe(true);
		});
	});

	describe("basic messaging", () => {
		it("should send basic message", () => {
			sayAbility.say("Hello, world!");
			expect(bot.sendMessage).toHaveBeenCalledWith("Hello, world!", false);
		});

		it("should track message history", () => {
			sayAbility.say("First message");
			sayAbility.say("Second message");

			const history = sayAbility.getMessageHistory(2);
			expect(history).toHaveLength(2);
			expect(history[0].message).toBe("First message");
			expect(history[1].message).toBe("Second message");
		});

		it("should limit message history", () => {
			for (let i = 0; i < 105; i++) {
				sayAbility.say(`Message ${i}`);
			}

			const history = sayAbility.getMessageHistory();
			expect(history.length).toBeLessThanOrEqual(10);
		});
	});

	describe("structured messaging", () => {
		it("should send status report", () => {
			sayAbility.reportStatus("Operating normally");
			expect(bot.sendMessage).toHaveBeenCalledWith(
				"[状況報告] Operating normally",
				false,
			);
		});

		it("should send error report", () => {
			sayAbility.reportError("Something went wrong");
			expect(bot.sendMessage).toHaveBeenCalledWith(
				"[エラー] Something went wrong",
				false,
			);
		});

		it("should send success report", () => {
			sayAbility.reportSuccess("Task completed");
			expect(bot.sendMessage).toHaveBeenCalledWith(
				"[成功] Task completedが完了しました",
				false,
			);
		});

		it("should send warning report", () => {
			sayAbility.reportWarning("Low health");
			expect(bot.sendMessage).toHaveBeenCalledWith("[警告] Low health", false);
		});

		it("should send info report", () => {
			sayAbility.reportInfo("Current status");
			expect(bot.sendMessage).toHaveBeenCalledWith(
				"[情報] Current status",
				false,
			);
		});
	});

	describe("social interactions", () => {
		it("should greet specific player", () => {
			sayAbility.greet("Alice");
			expect(bot.sendMessage).toHaveBeenCalledWith(
				"こんにちは、Aliceさん！",
				false,
			);
		});

		it("should greet generally", () => {
			sayAbility.greet();
			expect(bot.sendMessage).toHaveBeenCalledWith("こんにちは！", false);
		});

		it("should say farewell to specific player", () => {
			sayAbility.farewell("Bob");
			expect(bot.sendMessage).toHaveBeenCalledWith(
				"さようなら、Bobさん！",
				false,
			);
		});

		it("should thank specific player", () => {
			sayAbility.thank("Charlie");
			expect(bot.sendMessage).toHaveBeenCalledWith(
				"ありがとう、Charlieさん！",
				false,
			);
		});

		it("should apologize to specific player", () => {
			sayAbility.apologize("Dave");
			expect(bot.sendMessage).toHaveBeenCalledWith(
				"すみません、Daveさん",
				false,
			);
		});
	});

	describe("random messages", () => {
		it("should send random encouragement", () => {
			sayAbility.encourage();
			expect(bot.sendMessage).toHaveBeenCalled();

			const callArgs = (bot.sendMessage as jest.Mock).mock.calls[0][0];
			const encouragements = [
				"頑張りましょう！",
				"一緒にがんばろう！",
				"きっとできる！",
				"諦めないで！",
				"応援しています！",
				"ファイト！",
				"その調子！",
				"素晴らしい！",
			];

			expect(encouragements).toContain(callArgs);
		});

		it("should send random greeting", () => {
			sayAbility.randomGreeting();
			expect(bot.sendMessage).toHaveBeenCalled();

			const callArgs = (bot.sendMessage as jest.Mock).mock.calls[0][0];
			const greetings = [
				"こんにちは！",
				"おはよう！",
				"こんばんは！",
				"お疲れ様！",
				"よろしくお願いします！",
				"元気ですか？",
				"調子はどうですか？",
				"今日もよろしく！",
			];

			expect(greetings).toContain(callArgs);
		});
	});

	describe("whisper functionality", () => {
		it("should send whisper message", () => {
			sayAbility.whisper("target_player", "secret message");
			expect(bot.sendMessage).toHaveBeenCalledWith(
				"/msg target_player secret message",
				false,
			);
		});

		it("should track whisper in history", () => {
			sayAbility.whisper("player", "secret");
			const history = sayAbility.getMessageHistory(1);
			expect(history[0].message).toBe("[Whisper to player] secret");
		});
	});

	describe("message history management", () => {
		it("should get last message", () => {
			sayAbility.say("First");
			sayAbility.say("Last");

			expect(sayAbility.getLastMessage()).toBe("Last");
		});

		it("should return null for empty history", () => {
			expect(sayAbility.getLastMessage()).toBeNull();
		});

		it("should clear history", () => {
			sayAbility.say("Message to clear");
			sayAbility.clearHistory();

			expect(sayAbility.getMessageHistory()).toHaveLength(0);
			expect(sayAbility.getLastMessage()).toBeNull();
		});

		it("should get recent messages by time", () => {
			const now = Date.now();
			jest
				.spyOn(Date, "now")
				.mockReturnValueOnce(now - 10 * 60 * 1000) // 10 minutes ago
				.mockReturnValueOnce(now - 5 * 60 * 1000) // 5 minutes ago
				.mockReturnValueOnce(now); // now

			sayAbility.say("Old message");
			sayAbility.say("Recent message");
			sayAbility.say("Very recent message");

			const recentMessages = sayAbility.getRecentMessages(7); // Last 7 minutes
			expect(recentMessages).toHaveLength(2);
			expect(recentMessages[0].message).toBe("Recent message");
			expect(recentMessages[1].message).toBe("Very recent message");
		});
	});

	describe("message templates", () => {
		it("should provide message templates", () => {
			const templates = sayAbility.getMessageTemplates();

			expect(templates).toHaveProperty("greetings");
			expect(templates).toHaveProperty("farewells");
			expect(templates).toHaveProperty("thanks");
			expect(templates).toHaveProperty("apologies");
			expect(templates).toHaveProperty("encouragements");

			expect(Array.isArray(templates.greetings)).toBe(true);
			expect(templates.greetings.length).toBeGreaterThan(0);
		});
	});

	describe("status reporting shortcuts", () => {
		beforeEach(() => {
			// Mock bot methods for position/health reporting
			bot.getPosition = jest.fn().mockReturnValue({ x: 100, y: 64, z: -200 });
			bot.mc.health = 15;
			bot.mc.food = 18;
			bot.getInventory = jest
				.fn()
				.mockReturnValue([{ name: "item1" }, { name: "item2" }]);
			bot.mc.inventory.emptySlotCount = jest.fn().mockReturnValue(5);
			bot.mc.time = {
				timeOfDay: 6000,
				day: 1,
				doDaylightCycle: true,
				bigTime: BigInt(6000),
				time: 6000,
				age: 1000,
				isDay: true,
				moonPhase: 0,
				bigAge: BigInt(1000),
			};
			bot.mc.isRaining = false;
		});

		it("should report position", () => {
			sayAbility.reportPosition();
			expect(bot.sendMessage).toHaveBeenCalledWith(
				"現在位置: X=100, Y=64, Z=-200",
				false,
			);
		});

		it("should report health", () => {
			sayAbility.reportHealth();
			expect(bot.sendMessage).toHaveBeenCalledWith(
				"体力: 15/20, 空腹度: 18/20",
				false,
			);
		});

		it("should report inventory", () => {
			sayAbility.reportInventory();
			expect(bot.sendMessage).toHaveBeenCalledWith(
				"インベントリ: 2個のアイテム, 空きスロット: 5",
				false,
			);
		});

		it("should report time", () => {
			sayAbility.reportTime();
			expect(bot.sendMessage).toHaveBeenCalledWith(
				"現在の時刻: 昼 (6000)",
				false,
			);
		});

		it("should report weather", () => {
			sayAbility.reportWeather();
			expect(bot.sendMessage).toHaveBeenCalledWith("天候: 晴れ", false);
		});
	});

	describe("edge cases", () => {
		it("should handle uninitialized bot gracefully", () => {
			const newAbility = new SayAbility();
			expect(() => newAbility.say("test")).not.toThrow();
		});

		it("should handle empty messages", () => {
			sayAbility.say("");
			expect(bot.sendMessage).toHaveBeenCalledWith("", false);
		});

		it("should handle very long messages", () => {
			const longMessage = "a".repeat(1000);
			sayAbility.say(longMessage);
			expect(bot.sendMessage).toHaveBeenCalledWith(longMessage, false);
		});
	});
});
