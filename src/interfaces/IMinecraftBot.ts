import { Bot as MineflayerBot } from "mineflayer";
import { Vec3 } from "vec3";
import { Item } from "prismarine-item";
import { Entity } from "prismarine-entity";

/**
 * Minecraftボットの基本的なインターフェース
 * テスト時のモック化を容易にするための抽象化
 */
export interface IMinecraftBot {
  // 基本情報
  readonly username: string;
  readonly health: number;
  readonly food: number;
  readonly foodSaturation: number;
  readonly oxygenLevel: number;
  readonly isRaining: boolean;
  readonly experience: {
    level: number;
    points: number;
    total?: number;
  };
  readonly time: {
    timeOfDay: number;
    day: number;
  };

  // エンティティ情報
  readonly entity: {
    position: Vec3;
  };

  // エンティティとアイテム
  readonly entities: { [id: string]: Entity };
  readonly heldItem: Item | null;

  // インベントリ
  readonly inventory: {
    items(): Item[];
    emptySlotCount(): number;
    slots: any[];
  };

  // パスファインダー
  readonly pathfinder: {
    setMovements(movements: any): void;
    goto(goal: any): Promise<void>;
    isMoving(): boolean;
    stop(): void;
  };

  // メソッド
  chat(message: string): void;
  findBlock(options: any): any;
  blockAt(position: Vec3): any;
  equip(item: Item, destination?: string): Promise<void>;
  consume(): Promise<void>;
  tossStack(item: Item): Promise<void>;
  on(event: string, callback: (...args: any[]) => void): void;
  once(event: string, callback: (...args: any[]) => void): void;
  loadPlugin(plugin: any): void;
}