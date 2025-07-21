import { Vec3 } from "vec3";
import { MinecraftBotMock } from "../../__mocks__/MinecraftBotMock";
import type { Bot } from "../../core/Bot";
import { VitalsAbility } from "../VitalsAbility";

describe("VitalsAbility", () => {
	let vitalsAbility: VitalsAbility;
	let mockMinecraftBot: MinecraftBotMock;
	let bot: Bot;

	beforeEach(() => {
		vitalsAbility = new VitalsAbility();
		mockMinecraftBot = new MinecraftBotMock();

		// Bot の mc プロパティをモックに置き換え
		bot = {
			mc: mockMinecraftBot as any,
			getName: () => "TestBot",
		} as Bot;

		vitalsAbility.initialize(bot);
	});

	afterEach(() => {
		mockMinecraftBot.reset();
	});

	describe("initialization", () => {
		it("should have correct name", () => {
			expect(vitalsAbility.getName()).toBe("Vitals");
		});

		it("should have correct description", () => {
			expect(vitalsAbility.getDescription()).toBe(
				"ボット自身の生存状態（体力、空腹度など）を管理します",
			);
		});

		it("should be available after initialization", () => {
			expect(vitalsAbility.isAvailable()).toBe(true);
		});

		it("should not be available without initialization", () => {
			const newAbility = new VitalsAbility();
			expect(newAbility.isAvailable()).toBe(false);
		});
	});

	describe("health monitoring", () => {
		it("should detect low health correctly", () => {
			mockMinecraftBot.setHealth(5);
			expect(vitalsAbility.isHealthLow(10)).toBe(true);
			expect(vitalsAbility.isHealthLow(3)).toBe(false);
		});

		it("should return current health", () => {
			mockMinecraftBot.setHealth(15);
			expect(vitalsAbility.getHealth()).toBe(15);
		});

		it("should use default threshold for health check", () => {
			mockMinecraftBot.setHealth(8);
			expect(vitalsAbility.isHealthLow()).toBe(true);

			mockMinecraftBot.setHealth(12);
			expect(vitalsAbility.isHealthLow()).toBe(false);
		});
	});

	describe("hunger monitoring", () => {
		it("should detect low hunger correctly", () => {
			mockMinecraftBot.setFood(5);
			expect(vitalsAbility.isHungerLow(10)).toBe(true);
			expect(vitalsAbility.isHungerLow(3)).toBe(false);
		});

		it("should return current hunger", () => {
			mockMinecraftBot.setFood(12);
			expect(vitalsAbility.getHunger()).toBe(12);
		});

		it("should detect when eating is needed", () => {
			mockMinecraftBot.setFood(16);
			expect(vitalsAbility.needsToEat()).toBe(true);

			mockMinecraftBot.setFood(18);
			expect(vitalsAbility.needsToEat()).toBe(false);
		});

		it("should use default threshold for hunger check", () => {
			mockMinecraftBot.setFood(8);
			expect(vitalsAbility.isHungerLow()).toBe(true);

			mockMinecraftBot.setFood(12);
			expect(vitalsAbility.isHungerLow()).toBe(false);
		});
	});

	describe("danger detection", () => {
		it("should detect danger when health is low", () => {
			mockMinecraftBot.setHealth(5);
			expect(vitalsAbility.isInDanger()).toBe(true);
		});

		it("should detect danger when food is low", () => {
			mockMinecraftBot.setFood(15);
			expect(vitalsAbility.isInDanger()).toBe(true);
		});

		it("should detect danger when oxygen is low", () => {
			mockMinecraftBot.oxygenLevel = 5;
			expect(vitalsAbility.isInDanger()).toBe(true);
		});

		it("should not detect danger in normal conditions", () => {
			mockMinecraftBot.setHealth(20);
			mockMinecraftBot.setFood(20);
			mockMinecraftBot.oxygenLevel = 20;
			expect(vitalsAbility.isInDanger()).toBe(false);
		});
	});

	describe("experience tracking", () => {
		it("should return experience level", () => {
			mockMinecraftBot.experience.level = 5;
			expect(vitalsAbility.getExperienceLevel()).toBe(5);
		});

		it("should return experience points", () => {
			mockMinecraftBot.experience.points = 150;
			expect(vitalsAbility.getExperiencePoints()).toBe(150);
		});

		it("should return total experience", () => {
			mockMinecraftBot.experience.total = 1000;
			expect(vitalsAbility.getTotalExperience()).toBe(1000);
		});

		it("should handle missing total experience", () => {
			mockMinecraftBot.experience = { level: 0, points: 0, total: 0 };
			expect(vitalsAbility.getTotalExperience()).toBe(0);
		});
	});

	describe("vital statistics", () => {
		it("should return complete vital stats", () => {
			mockMinecraftBot.setHealth(18);
			mockMinecraftBot.setFood(16);
			mockMinecraftBot.foodSaturation = 12.5;
			mockMinecraftBot.oxygenLevel = 19;
			mockMinecraftBot.experience = { level: 3, points: 75, total: 500 };

			const stats = vitalsAbility.getVitalStats();

			expect(stats).toEqual({
				health: 18,
				hunger: 16,
				saturation: 12.5,
				oxygen: 19,
				experience: {
					level: 3,
					points: 75,
					total: 500,
				},
				isInDanger: true,
			});
		});

		it("should indicate danger in vital stats", () => {
			mockMinecraftBot.setHealth(4);
			const stats = vitalsAbility.getVitalStats();
			expect(stats.isInDanger).toBe(true);
		});
	});

	describe("safe spot finding", () => {
		it("should return null when bot is not initialized", () => {
			const newAbility = new VitalsAbility();
			expect(newAbility.findSafeSpot()).toBeNull();
		});

		// Note: findSafeSpot implementation depends on complex world state
		// For now, we test the basic structure
		it("should handle safe spot search without errors", () => {
			expect(() => vitalsAbility.findSafeSpot(5)).not.toThrow();
		});
	});

	describe("edge cases", () => {
		it("should handle uninitialized bot gracefully", () => {
			const newAbility = new VitalsAbility();

			expect(newAbility.getHealth()).toBe(0);
			expect(newAbility.getHunger()).toBe(0);
			expect(newAbility.getSaturation()).toBe(0);
			expect(newAbility.getOxygen()).toBe(0);
			expect(newAbility.getExperienceLevel()).toBe(0);
			expect(newAbility.getExperiencePoints()).toBe(0);
			expect(newAbility.getTotalExperience()).toBe(0);
			expect(newAbility.isHealthLow()).toBe(false);
			expect(newAbility.isHungerLow()).toBe(false);
			expect(newAbility.needsToEat()).toBe(false);
			expect(newAbility.isInDanger()).toBe(true);
		});

		it("should handle extreme values", () => {
			mockMinecraftBot.setHealth(0);
			mockMinecraftBot.setFood(0);

			expect(vitalsAbility.isHealthLow(0)).toBe(true);
			expect(vitalsAbility.isHungerLow(0)).toBe(true);
			expect(vitalsAbility.isInDanger()).toBe(true);
		});
	});
});
