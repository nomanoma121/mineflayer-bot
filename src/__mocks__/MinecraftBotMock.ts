import { IMinecraftBot } from "../interfaces/IMinecraftBot";
import { Vec3 } from "vec3";
import { Item } from "prismarine-item";
import { Entity } from "prismarine-entity";

/**
 * テスト用のMinecraftボットモック
 */
export class MinecraftBotMock implements IMinecraftBot {
  public username = "TestBot";
  public health = 20;
  public food = 20;
  public foodSaturation = 20;
  public oxygenLevel = 20;
  public isRaining = false;
  public experience = {
    level: 0,
    points: 0,
    total: 0,
  };
  public time = {
    timeOfDay: 1000,
    day: 1,
  };

  public entity = {
    position: new Vec3(0, 64, 0),
  };

  public entities: { [id: string]: Entity } = {};
  public heldItem: Item | null = null;

  public inventory = {
    items: jest.fn(() => [] as Item[]),
    emptySlotCount: jest.fn(() => 36),
    slots: new Array(45).fill(null),
  };

  public pathfinder = {
    setMovements: jest.fn(),
    goto: jest.fn().mockResolvedValue(undefined),
    isMoving: jest.fn(() => false),
    stop: jest.fn(),
  };

  public chat = jest.fn();
  public findBlock = jest.fn();
  public blockAt = jest.fn();
  public equip = jest.fn().mockResolvedValue(undefined);
  public consume = jest.fn().mockResolvedValue(undefined);
  public tossStack = jest.fn().mockResolvedValue(undefined);
  public on = jest.fn();
  public once = jest.fn();
  public loadPlugin = jest.fn();

  // Test helper methods
  public setHealth(health: number): void {
    this.health = health;
  }

  public setFood(food: number): void {
    this.food = food;
  }

  public setPosition(x: number, y: number, z: number): void {
    this.entity.position = new Vec3(x, y, z);
  }

  public setTime(timeOfDay: number, day: number = 1): void {
    this.time = { timeOfDay, day };
  }

  public setWeather(isRaining: boolean): void {
    this.isRaining = isRaining;
  }

  public addItem(name: string, count: number = 1): Item {
    const mockItem = {
      name,
      displayName: name,
      count,
      type: 1,
      metadata: 0,
      slot: 0,
    } as Item;
    
    const currentItems = (this.inventory.items as jest.Mock).getMockImplementation()?.() || [];
    this.inventory.items = jest.fn(() => [...currentItems, mockItem]);
    return mockItem;
  }

  public setHeldItem(item: Item | null): void {
    this.heldItem = item;
  }

  public addEntity(id: string, entity: Partial<Entity>): void {
    this.entities[id] = {
      id: parseInt(id),
      position: new Vec3(0, 64, 0),
      username: "TestPlayer",
      type: "player",
      name: "player",
      ...entity,
    } as Entity;
  }

  public reset(): void {
    this.health = 20;
    this.food = 20;
    this.foodSaturation = 20;
    this.oxygenLevel = 20;
    this.isRaining = false;
    this.experience = { level: 0, points: 0, total: 0 };
    this.time = { timeOfDay: 1000, day: 1 };
    this.entity.position = new Vec3(0, 64, 0);
    this.entities = {};
    this.heldItem = null;
    this.inventory.items = jest.fn(() => [] as Item[]);
    this.inventory.emptySlotCount = jest.fn(() => 36);
    
    // Reset all mocks
    jest.clearAllMocks();
  }
}