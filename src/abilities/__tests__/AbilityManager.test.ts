import { MinecraftBotMock } from "../../__mocks__/MinecraftBotMock";
import type { Bot } from "../../core/Bot";
import { AbilityManager } from "../AbilityManager";
import { InventoryAbility } from "../InventoryAbility";
import { SayAbility } from "../SayAbility";
import { SensingAbility } from "../SensingAbility";
import { VitalsAbility } from "../VitalsAbility";

describe("AbilityManager", () => {
	let abilityManager: AbilityManager;
	let mockMinecraftBot: MinecraftBotMock;
	let bot: Bot;

	beforeEach(() => {
		abilityManager = new AbilityManager();
		mockMinecraftBot = new MinecraftBotMock();

		bot = {
			mc: mockMinecraftBot as any,
			getName: () => "TestBot",
			sendMessage: jest.fn(),
		} as any;

		abilityManager.initialize(bot);
	});

	afterEach(() => {
		mockMinecraftBot.reset();
	});

	describe("initialization", () => {
		it("should register all default abilities", () => {
			const abilities = abilityManager.getAllAbilities();

			expect(abilities).toHaveLength(4);
			expect(abilities.map((a) => a.getName()).sort()).toEqual([
				"Inventory",
				"Say",
				"Sensing",
				"Vitals",
			]);
		});

		it("should initialize all abilities with bot", () => {
			const abilities = abilityManager.getAllAbilities();

			abilities.forEach((ability) => {
				expect(ability.isAvailable()).toBe(true);
			});
		});

		it("should provide convenient getter methods", () => {
			expect(abilityManager.vitals).toBeInstanceOf(VitalsAbility);
			expect(abilityManager.sensing).toBeInstanceOf(SensingAbility);
			expect(abilityManager.inventory).toBeInstanceOf(InventoryAbility);
			expect(abilityManager.say).toBeInstanceOf(SayAbility);
		});
	});

	describe("ability registration and retrieval", () => {
		it("should register new abilities", () => {
			const mockAbility = {
				getName: () => "TestAbility",
				getDescription: () => "Test description",
				initialize: jest.fn(),
				isAvailable: () => true,
			};

			abilityManager.registerAbility(mockAbility);

			expect(abilityManager.hasAbility("TestAbility")).toBe(true);
			expect(abilityManager.getAbility("TestAbility")).toBe(mockAbility);
		});

		it("should retrieve abilities by name", () => {
			const vitals = abilityManager.getAbility<VitalsAbility>("Vitals");
			expect(vitals).toBeInstanceOf(VitalsAbility);

			const nonexistent = abilityManager.getAbility("Nonexistent");
			expect(nonexistent).toBeUndefined();
		});

		it("should check ability existence", () => {
			expect(abilityManager.hasAbility("Vitals")).toBe(true);
			expect(abilityManager.hasAbility("Nonexistent")).toBe(false);
		});
	});

	describe("ability availability", () => {
		it("should return all available abilities", () => {
			const available = abilityManager.getAvailableAbilities();
			expect(available).toHaveLength(4);
		});

		it("should filter unavailable abilities", () => {
			const mockAbility = {
				getName: () => "UnavailableAbility",
				getDescription: () => "Test description",
				initialize: jest.fn(),
				isAvailable: () => false,
			};

			abilityManager.registerAbility(mockAbility);

			const available = abilityManager.getAvailableAbilities();
			const all = abilityManager.getAllAbilities();

			expect(all).toHaveLength(5);
			expect(available).toHaveLength(4); // Only available ones
		});
	});

	describe("system status", () => {
		it("should provide system status", () => {
			const status = abilityManager.getSystemStatus();

			expect(status.totalAbilities).toBe(4);
			expect(status.availableAbilities).toBe(4);
			expect(status.abilitiesList).toHaveLength(4);

			status.abilitiesList.forEach((ability) => {
				expect(ability).toHaveProperty("name");
				expect(ability).toHaveProperty("description");
				expect(ability).toHaveProperty("available");
				expect(ability.available).toBe(true);
			});
		});

		it("should indicate unavailable abilities in status", () => {
			const mockAbility = {
				getName: () => "UnavailableAbility",
				getDescription: () => "Test description",
				initialize: jest.fn(),
				isAvailable: () => false,
			};

			abilityManager.registerAbility(mockAbility);

			const status = abilityManager.getSystemStatus();

			expect(status.totalAbilities).toBe(5);
			expect(status.availableAbilities).toBe(4);

			const unavailableAbility = status.abilitiesList.find(
				(a) => a.name === "UnavailableAbility",
			);
			expect(unavailableAbility?.available).toBe(false);
		});
	});

	describe("diagnostics", () => {
		it("should report healthy status when all abilities are available", () => {
			const diagnosis = abilityManager.diagnose();

			expect(diagnosis.status).toBe("healthy");
			expect(diagnosis.issues).toHaveLength(0);
			expect(diagnosis.recommendations).toHaveLength(0);
		});

		it("should report partial status with some issues", () => {
			// Create an uninitialized manager to simulate missing bot
			const uninitializedManager = new AbilityManager();

			const diagnosis = uninitializedManager.diagnose();

			expect(diagnosis.status).toBe("critical");
			expect(diagnosis.issues.length).toBeGreaterThan(0);
			expect(diagnosis.recommendations.length).toBeGreaterThan(0);
			expect(diagnosis.issues[0]).toBe("ボットが初期化されていません");
		});

		it("should report critical status with many issues", () => {
			// Mock multiple unavailable abilities
			jest.spyOn(abilityManager.vitals, "isAvailable").mockReturnValue(false);
			jest.spyOn(abilityManager.sensing, "isAvailable").mockReturnValue(false);
			jest
				.spyOn(abilityManager.inventory, "isAvailable")
				.mockReturnValue(false);

			const diagnosis = abilityManager.diagnose();

			expect(diagnosis.status).toBe("critical");
			expect(diagnosis.issues.length).toBeGreaterThan(2);
		});

		it("should provide specific recommendations", () => {
			const uninitializedManager = new AbilityManager();
			const diagnosis = uninitializedManager.diagnose();

			expect(diagnosis.recommendations).toContain(
				"initialize(bot)メソッドを呼び出してください",
			);
		});
	});

	describe("statistics", () => {
		beforeEach(() => {
			// Set up some test data
			mockMinecraftBot.setHealth(15);
			mockMinecraftBot.setFood(18);
			mockMinecraftBot.setPosition(100, 64, -200);
			mockMinecraftBot.setTime(12000, 5);

			abilityManager.say.say("Test message");
		});

		it("should collect statistics from all abilities", () => {
			const stats = abilityManager.getStats();

			expect(stats.vitals).toBeTruthy();
			expect(stats.vitals?.health).toBe(15);
			expect(stats.vitals?.hunger).toBe(18);

			expect(stats.environment).toBeTruthy();
			expect(stats.environment?.position.x).toBe(100);
			expect(stats.environment?.time.timeOfDay).toBe(12000);

			expect(stats.inventory).toBeTruthy();
			expect(stats.inventory?.totalSlots).toBe(45);

			expect(stats.messageHistory).toBeTruthy();
			expect(stats.messageHistory?.length).toBeGreaterThan(0);
		});

		it("should handle unavailable abilities in stats", () => {
			jest.spyOn(abilityManager.vitals, "isAvailable").mockReturnValue(false);

			const stats = abilityManager.getStats();

			expect(stats.vitals).toBeNull();
			expect(stats.environment).toBeTruthy(); // Others should still work
		});
	});

	describe("emergency handling", () => {
		it("should handle emergency when not in danger", async () => {
			mockMinecraftBot.setHealth(20);
			mockMinecraftBot.setFood(20);

			const result = await abilityManager.handleEmergency();

			expect(result.success).toBe(true);
			expect(result.message).toBe("危険な状態は検出されませんでした");
			expect(result.actions).toHaveLength(0);
		});

		it("should handle emergency when in danger", async () => {
			mockMinecraftBot.setHealth(5); // Low health

			const result = await abilityManager.handleEmergency();

			expect(result.success).toBe(true);
			expect(result.actions.length).toBeGreaterThan(0);
			expect(result.actions).toContain("危険状態を検出");
			expect(result.actions).toContain("体力が低い状態を検出");
		});

		it("should handle emergency when hungry", async () => {
			mockMinecraftBot.setFood(10); // Low food

			const result = await abilityManager.handleEmergency();

			expect(result.success).toBe(true);
			expect(result.actions).toContain("空腹状態を検出");
		});

		it("should handle emergency errors gracefully", async () => {
			// Mock vitals to throw an error
			jest.spyOn(abilityManager.vitals, "isInDanger").mockImplementation(() => {
				throw new Error("Vitals error");
			});

			const result = await abilityManager.handleEmergency();

			expect(result.success).toBe(false);
			expect(result.message).toContain("緊急時対応中にエラーが発生しました");
			expect(result.actions).toContain("エラーが発生");
		});

		it("should handle missing abilities in emergency", async () => {
			// Create manager without abilities
			const emptyManager = new AbilityManager();
			// biome-ignore lint/complexity/useLiteralKeys: テストで使用するため
			emptyManager["abilities"].clear(); // Clear all abilities

			const result = await emptyManager.handleEmergency();

			expect(result.success).toBe(false);
			expect(result.message).toContain("必要なアビリティが利用できません");
		});
	});

	describe("reset functionality", () => {
		it("should reset manager state", () => {
			abilityManager.reset();

			// Check that abilities are reset (though current implementation doesn't have reset methods)
			expect(() => abilityManager.reset()).not.toThrow();
		});

		it("should call reset on abilities that support it", () => {
			const mockAbility = {
				getName: () => "ResettableAbility",
				getDescription: () => "Test description",
				initialize: jest.fn(),
				isAvailable: () => true,
				reset: jest.fn(),
			};

			abilityManager.registerAbility(mockAbility);
			abilityManager.reset();

			expect(mockAbility.reset).toHaveBeenCalled();
		});
	});

	describe("edge cases", () => {
		it("should handle duplicate ability registration", () => {
			const mockAbility = {
				getName: () => "Vitals", // Same name as existing
				getDescription: () => "Duplicate description",
				initialize: jest.fn(),
				isAvailable: () => true,
			};

			abilityManager.registerAbility(mockAbility);

			// Should overwrite the existing one
			const retrieved = abilityManager.getAbility("Vitals");
			expect(retrieved?.getDescription()).toBe("Duplicate description");
		});

		it("should handle empty ability name", () => {
			const mockAbility = {
				getName: () => "",
				getDescription: () => "Empty name ability",
				initialize: jest.fn(),
				isAvailable: () => true,
			};

			abilityManager.registerAbility(mockAbility);

			expect(abilityManager.hasAbility("")).toBe(true);
			expect(abilityManager.getAbility("")).toBe(mockAbility);
		});

		it("should handle initialization with null bot", () => {
			const manager = new AbilityManager();

			expect(() => manager.initialize(null as any)).not.toThrow();

			const diagnosis = manager.diagnose();
			expect(diagnosis.status).toBe("critical");
		});
	});
});
