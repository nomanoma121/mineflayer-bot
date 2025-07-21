import type { Entity } from "prismarine-entity";
import { Vec3 } from "vec3";
import { MinecraftBotMock } from "../../__mocks__/MinecraftBotMock";
import type { Bot } from "../../core/Bot";
import { SensingAbility } from "../SensingAbility";

describe("SensingAbility", () => {
	let sensingAbility: SensingAbility;
	let mockMinecraftBot: MinecraftBotMock;
	let bot: Bot;

	beforeEach(() => {
		sensingAbility = new SensingAbility();
		mockMinecraftBot = new MinecraftBotMock();

		bot = {
			mc: mockMinecraftBot as any,
			getName: () => "TestBot",
		} as Bot;

		sensingAbility.initialize(bot);
	});

	afterEach(() => {
		mockMinecraftBot.reset();
	});

	describe("initialization", () => {
		it("should have correct name", () => {
			expect(sensingAbility.getName()).toBe("Sensing");
		});

		it("should have correct description", () => {
			expect(sensingAbility.getDescription()).toBe(
				"周囲のワールドやエンティティの情報を取得します",
			);
		});

		it("should be available after initialization", () => {
			expect(sensingAbility.isAvailable()).toBe(true);
		});
	});

	describe("entity detection", () => {
		beforeEach(() => {
			// Add test entities
			mockMinecraftBot.addEntity("1", {
				username: "Player1",
				type: "player",
				position: new Vec3(5, 64, 0),
			});

			mockMinecraftBot.addEntity("2", {
				name: "zombie",
				type: "mob",
				position: new Vec3(10, 64, 0),
			});

			mockMinecraftBot.addEntity("3", {
				username: "Player2",
				type: "player",
				position: new Vec3(20, 64, 0),
			});
		});

		it("should find nearest entity with filter", () => {
			const nearestPlayer = sensingAbility.findNearestEntity(
				(e) => e.type === "player",
			);
			expect(nearestPlayer).toBeTruthy();
			expect(nearestPlayer?.username).toBe("Player1");
		});

		it("should return null when no entities match filter", () => {
			const dragon = sensingAbility.findNearestEntity(
				(e) => e.name === "ender_dragon",
			);
			expect(dragon).toBeNull();
		});

		it("should find nearest player excluding self", () => {
			mockMinecraftBot.username = "TestBot";
			mockMinecraftBot.addEntity("4", {
				username: "TestBot",
				type: "player",
				position: new Vec3(1, 64, 0),
			});

			const nearestPlayer = sensingAbility.findNearestPlayer(true);
			expect(nearestPlayer?.username).toBe("Player1");
		});

		it("should find nearest player including self", () => {
			mockMinecraftBot.username = "TestBot";
			mockMinecraftBot.addEntity("4", {
				username: "TestBot",
				type: "player",
				position: new Vec3(1, 64, 0),
			});

			const nearestPlayer = sensingAbility.findNearestPlayer(false);
			expect(nearestPlayer?.username).toBe("TestBot");
		});
	});

	describe("hostile mob detection", () => {
		beforeEach(() => {
			mockMinecraftBot.addEntity("1", {
				name: "zombie",
				type: "mob",
				position: new Vec3(5, 64, 0),
			});

			mockMinecraftBot.addEntity("2", {
				name: "skeleton",
				type: "mob",
				position: new Vec3(15, 64, 0),
			});

			mockMinecraftBot.addEntity("3", {
				name: "cow",
				type: "mob",
				position: new Vec3(3, 64, 0),
			});
		});

		it("should find nearest hostile mob", () => {
			const hostileMob = sensingAbility.findNearestHostileMob();
			expect(hostileMob).toBeTruthy();
			expect(["zombie", "skeleton"]).toContain(hostileMob?.name);
		});

		it("should not find peaceful mobs as hostile", () => {
			mockMinecraftBot.entities = {
				"3": {
					name: "cow",
					type: "mob",
					position: new Vec3(3, 64, 0),
				} as Entity,
			};

			const hostileMob = sensingAbility.findNearestHostileMob();
			expect(hostileMob).toBeNull();
		});
	});

	describe("animal detection", () => {
		beforeEach(() => {
			mockMinecraftBot.addEntity("1", {
				name: "cow",
				type: "mob",
				position: new Vec3(5, 64, 0),
			});

			mockMinecraftBot.addEntity("2", {
				name: "pig",
				type: "mob",
				position: new Vec3(10, 64, 0),
			});

			mockMinecraftBot.addEntity("3", {
				name: "zombie",
				type: "mob",
				position: new Vec3(3, 64, 0),
			});
		});

		it("should find nearest animal", () => {
			const animal = sensingAbility.findNearestAnimal();
			expect(animal).toBeTruthy();
			expect(["cow", "pig"]).toContain(animal?.name);
		});

		it("should not find hostile mobs as animals", () => {
			mockMinecraftBot.entities = {
				"3": {
					name: "zombie",
					type: "mob",
					position: new Vec3(3, 64, 0),
				} as Entity,
			};

			const animal = sensingAbility.findNearestAnimal();
			expect(animal).toBeNull();
		});
	});

	describe("entity counting", () => {
		beforeEach(() => {
			mockMinecraftBot.setPosition(0, 64, 0);

			// Add entities at various distances
			mockMinecraftBot.addEntity("1", {
				type: "player",
				position: new Vec3(5, 64, 0), // Distance: 5
			});

			mockMinecraftBot.addEntity("2", {
				type: "player",
				position: new Vec3(10, 64, 0), // Distance: 10
			});

			mockMinecraftBot.addEntity("3", {
				type: "player",
				position: new Vec3(20, 64, 0), // Distance: 20
			});
		});

		it("should count entities within radius", () => {
			const count = sensingAbility.countNearbyEntities(
				(e) => e.type === "player",
				12,
			);
			expect(count).toBe(2); // Only entities within 12 blocks
		});

		it("should use default radius", () => {
			const count = sensingAbility.countNearbyEntities(
				(e) => e.type === "player",
			);
			expect(count).toBe(2); // Default radius is 16, so entities at 5 and 10 blocks
		});

		it("should return zero for no matching entities", () => {
			const count = sensingAbility.countNearbyEntities(
				(e) => e.name === "dragon",
			);
			expect(count).toBe(0);
		});
	});

	describe("time detection", () => {
		it("should detect night time correctly", () => {
			mockMinecraftBot.setTime(14000); // Night time
			expect(sensingAbility.isNight()).toBe(true);

			mockMinecraftBot.setTime(18000); // Late night
			expect(sensingAbility.isNight()).toBe(true);

			mockMinecraftBot.setTime(500); // Very early morning
			expect(sensingAbility.isNight()).toBe(true);
		});

		it("should detect day time correctly", () => {
			mockMinecraftBot.setTime(6000); // Noon
			expect(sensingAbility.isNight()).toBe(false);

			mockMinecraftBot.setTime(3000); // Morning
			expect(sensingAbility.isNight()).toBe(false);

			mockMinecraftBot.setTime(10000); // Afternoon
			expect(sensingAbility.isNight()).toBe(false);
		});

		it("should provide detailed time information", () => {
			mockMinecraftBot.setTime(6000, 5);

			const timeInfo = sensingAbility.getTimeInfo();
			expect(timeInfo.timeOfDay).toBe(6000);
			expect(timeInfo.day).toBe(5);
			expect(timeInfo.isNight).toBe(false);
			expect(timeInfo.isDawn).toBe(false);
			expect(timeInfo.isDusk).toBe(false);
		});

		it("should detect dawn correctly", () => {
			mockMinecraftBot.setTime(23000); // Just before sunrise
			const timeInfo = sensingAbility.getTimeInfo();
			expect(timeInfo.isDawn).toBe(true);

			mockMinecraftBot.setTime(1000); // Just after sunrise
			const timeInfo2 = sensingAbility.getTimeInfo();
			expect(timeInfo2.isDawn).toBe(true);
		});

		it("should detect dusk correctly", () => {
			mockMinecraftBot.setTime(12000); // Sunset time
			const timeInfo = sensingAbility.getTimeInfo();
			expect(timeInfo.isDusk).toBe(true);
		});
	});

	describe("weather detection", () => {
		it("should detect rain correctly", () => {
			mockMinecraftBot.setWeather(true);
			expect(sensingAbility.isRaining()).toBe(true);

			mockMinecraftBot.setWeather(false);
			expect(sensingAbility.isRaining()).toBe(false);
		});

		it("should provide detailed weather information", () => {
			mockMinecraftBot.setWeather(true);

			const weatherInfo = sensingAbility.getWeatherInfo();
			expect(weatherInfo.isRaining).toBe(true);
			expect(weatherInfo.isThundering).toBe(false);
			expect(weatherInfo.rainLevel).toBe(0);
			expect(weatherInfo.thunderLevel).toBe(0);
		});
	});

	describe("block detection", () => {
		it("should find nearest block", () => {
			// Mock findBlock method
			const mockBlock = { position: new Vec3(5, 63, 0) };
			mockMinecraftBot.findBlock = jest.fn().mockReturnValue(mockBlock);

			const blockPos = sensingAbility.findNearestBlock({
				matching: [1], // Stone block ID
				maxDistance: 32,
			});

			expect(blockPos).toEqual(new Vec3(5, 63, 0));
			expect(mockMinecraftBot.findBlock).toHaveBeenCalledWith({
				matching: [1],
				maxDistance: 32,
				count: 1,
			});
		});

		it("should return null when block not found", () => {
			mockMinecraftBot.findBlock = jest.fn().mockReturnValue(null);

			const blockPos = sensingAbility.findNearestBlock({
				matching: [999], // Non-existent block
			});

			expect(blockPos).toBeNull();
		});

		it("should use default parameters", () => {
			mockMinecraftBot.findBlock = jest.fn().mockReturnValue(null);

			sensingAbility.findNearestBlock({ matching: [1] });

			expect(mockMinecraftBot.findBlock).toHaveBeenCalledWith({
				matching: [1],
				maxDistance: 64,
				count: 1,
			});
		});
	});

	describe("vision and line of sight", () => {
		it("should check if entity can be seen", () => {
			mockMinecraftBot.addEntity("1", {
				position: new Vec3(10, 64, 0),
			});
			const entity = mockMinecraftBot.entities["1"];

			const canSee = sensingAbility.canSee(entity);
			expect(canSee).toBe(true); // Within 16 block range
		});

		it("should return false for distant entities", () => {
			mockMinecraftBot.addEntity("1", {
				position: new Vec3(50, 64, 0),
			});
			const entity = mockMinecraftBot.entities["1"];

			const canSee = sensingAbility.canSee(entity);
			expect(canSee).toBe(false); // Beyond 16 block range
		});

		it("should check line of sight to position", () => {
			const nearPosition = new Vec3(5, 64, 0);
			const farPosition = new Vec3(50, 64, 0);

			// Mock the world raycast
			mockMinecraftBot.blockAt = jest.fn().mockReturnValue({ type: 0 }); // Air block

			expect(() => sensingAbility.canSeePosition(nearPosition)).not.toThrow();
			expect(() => sensingAbility.canSeePosition(farPosition)).not.toThrow();
		});
	});

	describe("light level detection", () => {
		it("should get light level", () => {
			const mockBlock = { light: 15 };
			mockMinecraftBot.blockAt = jest.fn().mockReturnValue(mockBlock);

			const lightLevel = sensingAbility.getLightLevel();
			expect(lightLevel).toBe(15);
		});

		it("should return 0 for no block", () => {
			mockMinecraftBot.blockAt = jest.fn().mockReturnValue(null);

			const lightLevel = sensingAbility.getLightLevel();
			expect(lightLevel).toBe(0);
		});
	});

	describe("block counting", () => {
		beforeEach(() => {
			mockMinecraftBot.setPosition(0, 64, 0);
		});

		it("should count nearby blocks", () => {
			// Mock blockAt to return stone blocks within radius
			mockMinecraftBot.blockAt = jest.fn((pos: Vec3) => {
				const distance = pos.distanceTo(new Vec3(0, 64, 0));
				if (distance <= 3) {
					return { type: 1 }; // Stone
				}
				return { type: 0 }; // Air
			});

			const count = sensingAbility.countNearbyBlocks(1, 3);
			expect(count).toBeGreaterThan(0);
		});

		it("should use default radius", () => {
			mockMinecraftBot.blockAt = jest.fn().mockReturnValue({ type: 0 });

			const count = sensingAbility.countNearbyBlocks(1);
			expect(count).toBe(0);
		});
	});

	describe("environment information", () => {
		beforeEach(() => {
			mockMinecraftBot.setPosition(100, 64, -200);
			mockMinecraftBot.setTime(12000, 10);
			mockMinecraftBot.setWeather(false);

			// Add some test entities
			mockMinecraftBot.addEntity("1", {
				type: "player",
				position: new Vec3(105, 64, -200),
			});

			mockMinecraftBot.addEntity("2", {
				name: "zombie",
				type: "mob",
				position: new Vec3(110, 64, -200),
			});
		});

		it("should provide complete environment information", () => {
			const envInfo = sensingAbility.getEnvironmentInfo();

			expect(envInfo.position.x).toBe(100);
			expect(envInfo.position.y).toBe(64);
			expect(envInfo.position.z).toBe(-200);

			expect(envInfo.time.timeOfDay).toBe(12000);
			expect(envInfo.time.day).toBe(10);
			expect(envInfo.time.isNight).toBe(false);

			expect(envInfo.weather.isRaining).toBe(false);

			expect(envInfo.nearbyPlayersCount).toBe(1);
			expect(envInfo.nearbyHostileMobsCount).toBe(1);
		});

		it("should handle empty environment", () => {
			mockMinecraftBot.entities = {};

			const envInfo = sensingAbility.getEnvironmentInfo();

			expect(envInfo.nearbyPlayersCount).toBe(0);
			expect(envInfo.nearbyHostileMobsCount).toBe(0);
			expect(envInfo.nearbyAnimalsCount).toBe(0);
		});
	});

	describe("edge cases", () => {
		it("should handle uninitialized bot gracefully", () => {
			const newAbility = new SensingAbility();

			expect(newAbility.findNearestEntity(() => true)).toBeNull();
			expect(newAbility.findNearestBlock({ matching: [1] })).toBeNull();
			expect(newAbility.isNight()).toBe(false);
			expect(newAbility.isRaining()).toBe(false);
			expect(newAbility.countNearbyEntities(() => true)).toBe(0);
			expect(newAbility.getLightLevel()).toBe(0);
		});

		it("should handle empty entity list", () => {
			mockMinecraftBot.entities = {};

			expect(sensingAbility.findNearestEntity(() => true)).toBeNull();
			expect(sensingAbility.findNearestPlayer()).toBeNull();
			expect(sensingAbility.findNearestHostileMob()).toBeNull();
			expect(sensingAbility.findNearestAnimal()).toBeNull();
		});

		it("should handle invalid filter functions", () => {
			mockMinecraftBot.addEntity("1", {
				type: "player",
				position: new Vec3(5, 64, 0),
			});

			expect(() => {
				sensingAbility.findNearestEntity(() => {
					throw new Error("Filter error");
				});
			}).toThrow("Filter error");
		});
	});
});
