# アビリティシステム - モジュラー機能設計の詳細解説

## 📖 アビリティシステムとは

アビリティシステムは、**ボットの機能を独立したモジュールとして分離し、再利用可能で拡張性の高い設計を実現するアーキテクチャ**です。Composite パターンを中核として、単一責任原則と開放閉鎖原則を徹底した設計になっています。

## 🎯 設計思想

### 1. **単一責任原則（SRP）**
各アビリティは特定の責務のみを担当します：

```typescript
// ✅ 良い例：単一責任
class VitalsAbility {
  isHealthLow() { /* 体力関連のみ */ }
  isHungry() { /* 満腹度関連のみ */ }
}

class SensingAbility {
  findNearestEntity() { /* 感知関連のみ */ }
  isNight() { /* 環境認知のみ */ }
}

// ❌ 悪い例：複数責任
class MonolithicAbility {
  isHealthLow() { /* 体力 */ }
  findNearestEntity() { /* 感知 */ }
  hasItem() { /* インベントリ */ }
  say() { /* コミュニケーション */ }
}
```

### 2. **開放閉鎖原則（OCP）**
新機能追加時に既存コードを変更しません：

```typescript
// 新しいアビリティを追加
class CraftingAbility implements IAbility {
  // 既存のVitals, Sensing等を変更せずに追加
}

// AbilityManagerで自動認識
abilityManager.registerAbility(new CraftingAbility(bot));
```

### 3. **依存性逆転原則（DIP）**
高レベルモジュールは抽象に依存します：

```typescript
// Bot（高レベル）は IAbility（抽象）に依存
class Bot {
  constructor(private abilityManager: AbilityManager) {}
  
  get vitals(): IAbility {  // 具象クラスではなく抽象に依存
    return this.abilityManager.getAbility('vitals');
  }
}
```

## 🏗️ アーキテクチャ設計

### インターフェース階層

```typescript
// src/abilities/IAbility.ts
export interface IAbility {
  getName(): string;                    // 識別名
  getDescription(): string;             // 説明
  initialize(): Promise<void>;          // 初期化処理
  isAvailable(): boolean;               // 利用可能性チェック
  cleanup?(): void;                     // 任意のクリーンアップ
}

// 特化インターフェース例
export interface IVitalsAbility extends IAbility {
  isHealthLow(): boolean;
  isHungry(): boolean;
  eatFood(): Promise<boolean>;
  getVitalStats(): VitalStats;
}
```

### AbilityManager（Composite Root）

```typescript
// src/abilities/AbilityManager.ts
export class AbilityManager {
  private abilities: Map<string, IAbility> = new Map();
  private bot: Bot;
  private initialized = false;

  constructor(bot: Bot) {
    this.bot = bot;
  }

  /**
   * 全アビリティの一括初期化
   * システム起動時に一度だけ実行
   */
  public async initializeAll(): Promise<void> {
    if (this.initialized) {
      console.warn('[AbilityManager] Already initialized');
      return;
    }

    console.log('[AbilityManager] Starting ability initialization...');
    
    // コアアビリティを順序だてて初期化
    const coreAbilities = [
      new VitalsAbility(this.bot),
      new SensingAbility(this.bot),
      new InventoryAbility(this.bot),
      new SayAbility(this.bot)
    ];

    for (const ability of coreAbilities) {
      try {
        await this.registerAndInitialize(ability);
      } catch (error) {
        console.error(`[AbilityManager] Failed to initialize ${ability.getName()}: ${error}`);
        throw new Error(`Critical ability initialization failed: ${ability.getName()}`);
      }
    }

    this.initialized = true;
    console.log('[AbilityManager] All abilities initialized successfully');
  }

  /**
   * アビリティの動的登録と初期化
   */
  public async registerAndInitialize(ability: IAbility): Promise<void> {
    const name = ability.getName();
    
    if (this.abilities.has(name)) {
      throw new Error(`Ability ${name} is already registered`);
    }

    console.log(`[AbilityManager] Registering ability: ${name}`);
    
    // 初期化実行
    await ability.initialize();
    
    // 利用可能性確認
    if (!ability.isAvailable()) {
      throw new Error(`Ability ${name} is not available after initialization`);
    }

    this.abilities.set(name, ability);
    console.log(`[AbilityManager] Successfully registered: ${name}`);
  }

  /**
   * 型安全なアビリティ取得
   */
  public getAbility<T extends IAbility>(name: string): T | undefined {
    const ability = this.abilities.get(name);
    return ability as T | undefined;
  }

  /**
   * アビリティの存在確認
   */
  public hasAbility(name: string): boolean {
    return this.abilities.has(name) && this.abilities.get(name)!.isAvailable();
  }

  /**
   * 利用可能な全アビリティのリスト
   */
  public getAvailableAbilities(): AbilityInfo[] {
    return Array.from(this.abilities.values())
      .filter(ability => ability.isAvailable())
      .map(ability => ({
        name: ability.getName(),
        description: ability.getDescription(),
        available: ability.isAvailable()
      }));
  }

  /**
   * 便利なアクセサー（Facade パターンと連携）
   */
  public get vitals(): VitalsAbility {
    const ability = this.getAbility<VitalsAbility>('vitals');
    if (!ability) {
      throw new Error('VitalsAbility not available');
    }
    return ability;
  }

  public get sensing(): SensingAbility {
    const ability = this.getAbility<SensingAbility>('sensing');
    if (!ability) {
      throw new Error('SensingAbility not available');
    }
    return ability;
  }

  public get inventory(): InventoryAbility {
    const ability = this.getAbility<InventoryAbility>('inventory');
    if (!ability) {
      throw new Error('InventoryAbility not available');
    }
    return ability;
  }

  public get say(): SayAbility {
    const ability = this.getAbility<SayAbility>('say');
    if (!ability) {
      throw new Error('SayAbility not available');
    }
    return ability;
  }

  /**
   * 全アビリティのクリーンアップ
   */
  public cleanup(): void {
    console.log('[AbilityManager] Cleaning up all abilities...');
    
    for (const [name, ability] of this.abilities) {
      try {
        if (ability.cleanup) {
          ability.cleanup();
        }
        console.log(`[AbilityManager] Cleaned up: ${name}`);
      } catch (error) {
        console.error(`[AbilityManager] Cleanup failed for ${name}: ${error}`);
      }
    }
    
    this.abilities.clear();
    this.initialized = false;
  }
}
```

## 🧩 個別アビリティの詳細実装

### 1. VitalsAbility（生命維持システム）

```typescript
// src/abilities/VitalsAbility.ts
export class VitalsAbility implements IAbility {
  private bot: Bot;
  private healthThreshold = 6;     // 低体力判定閾値
  private hungerThreshold = 6;     // 空腹判定閾値
  private lastVitalUpdate = 0;     // 最後の更新時刻
  private vitalCache?: VitalStats; // キャッシュされた状態

  constructor(bot: Bot) {
    this.bot = bot;
  }

  public getName(): string {
    return 'vitals';
  }

  public getDescription(): string {
    return 'Manages bot health, hunger, and vital statistics monitoring';
  }

  public async initialize(): Promise<void> {
    console.log('[VitalsAbility] Initializing vital monitoring system...');
    
    // 初期状態の確認
    if (!this.bot.mc.health) {
      throw new Error('Bot health information not available');
    }

    // 自動食事システムの設定
    this.setupAutoEating();
    
    console.log('[VitalsAbility] Vital monitoring initialized');
  }

  public isAvailable(): boolean {
    return this.bot.mc && 
           this.bot.mc.health !== undefined && 
           this.bot.mc.food !== undefined;
  }

  /**
   * 体力が低いかどうかの判定
   */
  public isHealthLow(): boolean {
    return this.bot.mc.health < this.healthThreshold;
  }

  /**
   * 空腹かどうかの判定
   */
  public isHungry(): boolean {
    return this.bot.mc.food < this.hungerThreshold;
  }

  /**
   * 危険な状態かどうかの総合判定
   */
  public isInDanger(): boolean {
    const stats = this.getVitalStats();
    return stats.health < 4 || // 致命的低体力
           stats.food < 3 ||    // 致命的空腹
           this.hasNearbyEnemies();
  }

  /**
   * 自動食事機能
   */
  public async eatFood(): Promise<boolean> {
    try {
      const food = this.bot.inventory.findFood();
      if (!food) {
        console.log('[VitalsAbility] No food available');
        return false;
      }

      console.log(`[VitalsAbility] Eating ${food.name}`);
      
      // 装備して消費
      await this.bot.mc.equip(food, 'hand');
      await this.bot.mc.consume();
      
      console.log('[VitalsAbility] Food consumed successfully');
      return true;
      
    } catch (error) {
      console.error(`[VitalsAbility] Failed to eat food: ${error}`);
      return false;
    }
  }

  /**
   * 安全な場所を探す
   */
  public findSafeSpot(): { x: number; y: number; z: number } | null {
    const currentPos = this.bot.getPosition();
    
    // 周囲のエンティティをチェック
    const enemies = this.bot.sensing.findNearbyEntities('hostile');
    if (enemies.length === 0) {
      return currentPos; // 現在位置が安全
    }

    // 敵から最も遠い方向を計算
    let safestDirection = { x: 0, z: 0 };
    for (const enemy of enemies) {
      const dx = currentPos.x - enemy.position.x;
      const dz = currentPos.z - enemy.position.z;
      safestDirection.x += dx;
      safestDirection.z += dz;
    }

    // 正規化して安全な座標を算出
    const distance = Math.sqrt(safestDirection.x ** 2 + safestDirection.z ** 2);
    if (distance > 0) {
      safestDirection.x = (safestDirection.x / distance) * 10;
      safestDirection.z = (safestDirection.z / distance) * 10;
    }

    return {
      x: Math.floor(currentPos.x + safestDirection.x),
      y: currentPos.y,
      z: Math.floor(currentPos.z + safestDirection.z)
    };
  }

  /**
   * 詳細な生命状態情報を取得
   */
  public getVitalStats(): VitalStats {
    const now = Date.now();
    
    // キャッシュが有効な場合は再利用（100ms以内）
    if (this.vitalCache && (now - this.lastVitalUpdate) < 100) {
      return this.vitalCache;
    }

    this.vitalCache = {
      health: this.bot.mc.health,
      maxHealth: 20,
      food: this.bot.mc.food,
      maxFood: 20,
      saturation: this.bot.mc.foodSaturation,
      level: this.bot.mc.experience.level,
      experience: this.bot.mc.experience.points,
      totalExperience: this.bot.mc.experience.total,
      isHealthCritical: this.bot.mc.health < 4,
      isFoodCritical: this.bot.mc.food < 3,
      needsImmediate Care: this.isInDanger()
    };

    this.lastVitalUpdate = now;
    return this.vitalCache;
  }

  /**
   * 自動食事システムのセットアップ
   */
  private setupAutoEating(): void {
    // 定期的な空腹チェック
    setInterval(async () => {
      if (this.isHungry() && this.bot.getCurrentState().getName() === 'Idle') {
        console.log('[VitalsAbility] Auto-eating triggered');
        await this.eatFood();
      }
    }, 5000); // 5秒間隔
  }

  /**
   * 近くに敵がいるかチェック
   */
  private hasNearbyEnemies(): boolean {
    const enemies = this.bot.sensing.findNearbyEntities('hostile', 10);
    return enemies.length > 0;
  }

  public cleanup(): void {
    console.log('[VitalsAbility] Cleaning up vital monitoring...');
    this.vitalCache = undefined;
  }
}
```

### 2. SensingAbility（環境認知システム）

```typescript
// src/abilities/SensingAbility.ts
export class SensingAbility implements IAbility {
  private bot: Bot;
  private entityCache = new Map<string, any[]>();
  private blockCache = new Map<string, any[]>();
  private cacheExpiry = 1000; // 1秒でキャッシュ無効化

  constructor(bot: Bot) {
    this.bot = bot;
  }

  public getName(): string {
    return 'sensing';
  }

  public getDescription(): string {
    return 'Environmental perception and entity detection system';
  }

  public async initialize(): Promise<void> {
    console.log('[SensingAbility] Initializing perception systems...');
    
    // 基本的なワールド情報の確認
    if (!this.bot.mc.world) {
      throw new Error('World information not available');
    }

    // キャッシュクリーナーの設定
    this.setupCacheCleaner();
    
    console.log('[SensingAbility] Perception systems initialized');
  }

  public isAvailable(): boolean {
    return this.bot.mc && this.bot.mc.world !== undefined;
  }

  /**
   * 最も近いエンティティを検索
   */
  public findNearestEntity(filter: (entity: any) => boolean): any | null {
    const entities = Object.values(this.bot.mc.entities)
      .filter(entity => entity.position && filter(entity));

    if (entities.length === 0) {
      return null;
    }

    const botPos = this.bot.getPosition();
    
    return entities.reduce((nearest, current) => {
      const currentDistance = this.calculateDistance(botPos, current.position);
      const nearestDistance = this.calculateDistance(botPos, nearest.position);
      return currentDistance < nearestDistance ? current : nearest;
    });
  }

  /**
   * 指定範囲内のエンティティを検索
   */
  public findNearbyEntities(type: 'all' | 'player' | 'mob' | 'hostile' | 'passive', range = 20): any[] {
    const cacheKey = `${type}_${range}`;
    
    // キャッシュチェック
    if (this.entityCache.has(cacheKey)) {
      return this.entityCache.get(cacheKey)!;
    }

    const botPos = this.bot.getPosition();
    const entities = Object.values(this.bot.mc.entities).filter(entity => {
      if (!entity.position) return false;
      
      const distance = this.calculateDistance(botPos, entity.position);
      if (distance > range) return false;

      switch (type) {
        case 'all':
          return true;
        case 'player':
          return entity.type === 'player';
        case 'mob':
          return entity.type === 'mob';
        case 'hostile':
          return this.isHostileEntity(entity);
        case 'passive':
          return entity.type === 'mob' && !this.isHostileEntity(entity);
        default:
          return false;
      }
    });

    // キャッシュに保存
    this.entityCache.set(cacheKey, entities);
    
    return entities;
  }

  /**
   * 最も近いブロックを検索
   */
  public findNearestBlock(blockType: string, range = 20): any | null {
    const cacheKey = `block_${blockType}_${range}`;
    
    // キャッシュチェック
    if (this.blockCache.has(cacheKey)) {
      const blocks = this.blockCache.get(cacheKey)!;
      return blocks.length > 0 ? blocks[0] : null;
    }

    const botPos = this.bot.getPosition();
    const blocks: any[] = [];

    // 範囲内のブロックを検索
    for (let x = botPos.x - range; x <= botPos.x + range; x++) {
      for (let y = Math.max(0, botPos.y - range); y <= Math.min(255, botPos.y + range); y++) {
        for (let z = botPos.z - range; z <= botPos.z + range; z++) {
          const block = this.bot.mc.blockAt({ x, y, z });
          if (block && block.name === blockType) {
            const distance = this.calculateDistance(botPos, { x, y, z });
            blocks.push({ block, position: { x, y, z }, distance });
          }
        }
      }
    }

    // 距離でソート
    blocks.sort((a, b) => a.distance - b.distance);
    
    // キャッシュに保存
    this.blockCache.set(cacheKey, blocks);
    
    return blocks.length > 0 ? blocks[0] : null;
  }

  /**
   * 環境情報の取得
   */
  public getEnvironmentInfo(): EnvironmentInfo {
    const time = this.bot.mc.time;
    
    return {
      time: time.timeOfDay,
      day: time.day,
      isDay: time.timeOfDay >= 0 && time.timeOfDay < 12000,
      isNight: time.timeOfDay >= 12000,
      weather: this.bot.mc.isRaining ? 'rain' : 'clear',
      lightLevel: this.getLightLevel(),
      biome: this.getCurrentBiome(),
      nearbyPlayerCount: this.findNearbyEntities('player').length,
      nearbyMobCount: this.findNearbyEntities('mob').length
    };
  }

  /**
   * 夜かどうかの判定
   */
  public isNight(): boolean {
    return this.bot.mc.time.timeOfDay >= 12000;
  }

  /**
   * 雨が降っているかの判定
   */
  public isRaining(): boolean {
    return this.bot.mc.isRaining;
  }

  /**
   * プレイヤーを検出
   */
  public detectPlayers(range = 50): PlayerInfo[] {
    return this.findNearbyEntities('player', range).map(player => ({
      username: player.username,
      position: player.position,
      distance: this.calculateDistance(this.bot.getPosition(), player.position),
      health: player.health || 20,
      gamemode: player.gamemode || 'survival'
    }));
  }

  /**
   * 危険なエンティティを検出
   */
  public detectThreats(range = 15): ThreatInfo[] {
    return this.findNearbyEntities('hostile', range).map(entity => ({
      type: entity.name || entity.type,
      position: entity.position,
      distance: this.calculateDistance(this.bot.getPosition(), entity.position),
      threatLevel: this.calculateThreatLevel(entity),
      isAttacking: this.isEntityAttacking(entity)
    }));
  }

  /**
   * 距離計算
   */
  private calculateDistance(pos1: any, pos2: any): number {
    return Math.sqrt(
      Math.pow(pos1.x - pos2.x, 2) +
      Math.pow(pos1.y - pos2.y, 2) +
      Math.pow(pos1.z - pos2.z, 2)
    );
  }

  /**
   * 敵対的エンティティの判定
   */
  private isHostileEntity(entity: any): boolean {
    const hostileMobs = [
      'zombie', 'skeleton', 'creeper', 'spider', 'enderman',
      'witch', 'pillager', 'vindicator', 'evoker', 'ravager'
    ];
    return hostileMobs.includes(entity.name?.toLowerCase());
  }

  /**
   * 現在の光量レベル取得
   */
  private getLightLevel(): number {
    const pos = this.bot.getPosition();
    const block = this.bot.mc.blockAt(pos);
    return block ? (block.light || 0) : 0;
  }

  /**
   * 現在のバイオーム取得
   */
  private getCurrentBiome(): string {
    // バイオーム情報の取得（実装依存）
    return 'unknown';
  }

  /**
   * 脅威レベルの計算
   */
  private calculateThreatLevel(entity: any): number {
    const threatLevels: Record<string, number> = {
      'zombie': 3,
      'skeleton': 4,
      'creeper': 5,
      'spider': 2,
      'enderman': 4
    };
    return threatLevels[entity.name?.toLowerCase()] || 1;
  }

  /**
   * エンティティが攻撃しているかの判定
   */
  private isEntityAttacking(entity: any): boolean {
    // 攻撃状態の判定ロジック（実装依存）
    return false;
  }

  /**
   * キャッシュクリーナーの設定
   */
  private setupCacheCleaner(): void {
    setInterval(() => {
      this.entityCache.clear();
      this.blockCache.clear();
    }, this.cacheExpiry);
  }

  public cleanup(): void {
    console.log('[SensingAbility] Cleaning up perception systems...');
    this.entityCache.clear();
    this.blockCache.clear();
  }
}
```

### 3. InventoryAbility（所持品管理システム）

```typescript
// src/abilities/InventoryAbility.ts
export class InventoryAbility implements IAbility {
  private bot: Bot;
  private inventoryCache?: ItemInfo[];
  private lastInventoryUpdate = 0;

  constructor(bot: Bot) {
    this.bot = bot;
  }

  public getName(): string {
    return 'inventory';
  }

  public getDescription(): string {
    return 'Inventory management and item handling system';
  }

  public async initialize(): Promise<void> {
    console.log('[InventoryAbility] Initializing inventory management...');
    
    if (!this.bot.mc.inventory) {
      throw new Error('Inventory not available');
    }

    console.log('[InventoryAbility] Inventory management initialized');
  }

  public isAvailable(): boolean {
    return this.bot.mc && this.bot.mc.inventory !== undefined;
  }

  /**
   * アイテムの所持確認
   */
  public hasItem(itemName: string, quantity = 1): boolean {
    const items = this.getInventoryItems();
    const totalCount = items
      .filter(item => item.name === itemName)
      .reduce((sum, item) => sum + item.count, 0);
    
    return totalCount >= quantity;
  }

  /**
   * アイテム数のカウント
   */
  public countItems(itemName: string): number {
    const items = this.getInventoryItems();
    return items
      .filter(item => item.name === itemName)
      .reduce((sum, item) => sum + item.count, 0);
  }

  /**
   * 最適なツール選択
   */
  public selectBestTool(block: any): any | null {
    const items = this.getInventoryItems();
    
    // ブロックタイプに応じたツール優先度
    const toolPriorities = this.getToolPriorities(block.name);
    
    for (const toolType of toolPriorities) {
      const tool = items.find(item => 
        item.name.includes(toolType) && item.durability > 0
      );
      if (tool) {
        return tool.item;
      }
    }

    return null; // 素手
  }

  /**
   * 食べ物の検索
   */
  public findFood(): any | null {
    const items = this.getInventoryItems();
    const foodItems = ['bread', 'apple', 'cooked_beef', 'cooked_porkchop', 'cooked_chicken'];
    
    for (const foodName of foodItems) {
      const food = items.find(item => item.name === foodName);
      if (food) {
        return food.item;
      }
    }

    return null;
  }

  /**
   * インベントリが満杯かチェック
   */
  public isFull(): boolean {
    const items = this.bot.mc.inventory.items();
    return items.length >= 36; // プレイヤーインベントリのスロット数
  }

  /**
   * 空きスロット数の取得
   */
  public getEmptySlots(): number {
    const items = this.bot.mc.inventory.items();
    return 36 - items.length;
  }

  /**
   * アイテムの詳細情報を取得
   */
  public getInventoryItems(): ItemInfo[] {
    const now = Date.now();
    
    // キャッシュが有効な場合は再利用
    if (this.inventoryCache && (now - this.lastInventoryUpdate) < 500) {
      return this.inventoryCache;
    }

    const items = this.bot.mc.inventory.items();
    this.inventoryCache = items.map(item => ({
      name: item.name,
      count: item.count,
      durability: this.getItemDurability(item),
      maxDurability: this.getMaxDurability(item),
      enchantments: this.getEnchantments(item),
      item: item // 元のアイテムオブジェクト
    }));

    this.lastInventoryUpdate = now;
    return this.inventoryCache;
  }

  /**
   * アイテムの装備
   */
  public async equipItem(itemName: string, slot: 'hand' | 'head' | 'torso' | 'legs' | 'feet'): Promise<boolean> {
    try {
      const items = this.getInventoryItems();
      const item = items.find(i => i.name === itemName);
      
      if (!item) {
        console.log(`[InventoryAbility] Item not found: ${itemName}`);
        return false;
      }

      await this.bot.mc.equip(item.item, slot);
      console.log(`[InventoryAbility] Equipped ${itemName} to ${slot}`);
      return true;
      
    } catch (error) {
      console.error(`[InventoryAbility] Failed to equip ${itemName}: ${error}`);
      return false;
    }
  }

  /**
   * アイテムのドロップ
   */
  public async dropItem(itemName: string, quantity?: number): Promise<boolean> {
    try {
      const items = this.getInventoryItems();
      const item = items.find(i => i.name === itemName);
      
      if (!item) {
        console.log(`[InventoryAbility] Item not found: ${itemName}`);
        return false;
      }

      const dropCount = quantity || item.count;
      await this.bot.mc.toss(item.item.type, null, dropCount);
      
      console.log(`[InventoryAbility] Dropped ${dropCount}x ${itemName}`);
      this.invalidateCache();
      return true;
      
    } catch (error) {
      console.error(`[InventoryAbility] Failed to drop ${itemName}: ${error}`);
      return false;
    }
  }

  /**
   * インベントリの整理
   */
  public organizeInventory(): void {
    console.log('[InventoryAbility] Organizing inventory...');
    
    // 耐久度の低いアイテムを特定
    const damagedItems = this.getInventoryItems()
      .filter(item => item.durability < item.maxDurability * 0.1);
    
    if (damagedItems.length > 0) {
      console.log(`[InventoryAbility] Found ${damagedItems.length} damaged items`);
      // 耐久度の低いアイテムの処理ロジック
    }

    // スタック可能なアイテムの統合
    this.consolidateStackableItems();
  }

  /**
   * アイテム使用統計の取得
   */
  public getInventoryStats(): InventoryStats {
    const items = this.getInventoryItems();
    
    return {
      totalItems: items.length,
      totalSlots: 36,
      emptySlots: this.getEmptySlots(),
      uniqueItems: new Set(items.map(i => i.name)).size,
      toolCount: items.filter(i => this.isToolItem(i.name)).length,
      foodCount: items.filter(i => this.isFoodItem(i.name)).length,
      weaponCount: items.filter(i => this.isWeaponItem(i.name)).length,
      totalValue: this.calculateInventoryValue(items)
    };
  }

  /**
   * ツール優先度の取得
   */
  private getToolPriorities(blockName: string): string[] {
    const priorities: Record<string, string[]> = {
      'stone': ['pickaxe', 'axe'],
      'wood': ['axe', 'pickaxe'],
      'dirt': ['shovel'],
      'sand': ['shovel'],
      'gravel': ['shovel']
    };
    
    return priorities[blockName] || ['pickaxe', 'axe', 'shovel'];
  }

  /**
   * アイテムの耐久度取得
   */
  private getItemDurability(item: any): number {
    return item.durabilityUsed ? item.maxDurability - item.durabilityUsed : item.maxDurability || 0;
  }

  /**
   * 最大耐久度の取得
   */
  private getMaxDurability(item: any): number {
    return item.maxDurability || 0;
  }

  /**
   * エンチャントの取得
   */
  private getEnchantments(item: any): string[] {
    return item.enchants ? item.enchants.map((e: any) => e.name) : [];
  }

  /**
   * ツールアイテムの判定
   */
  private isToolItem(itemName: string): boolean {
    return itemName.includes('pickaxe') || 
           itemName.includes('axe') || 
           itemName.includes('shovel') || 
           itemName.includes('hoe');
  }

  /**
   * 食べ物アイテムの判定
   */
  private isFoodItem(itemName: string): boolean {
    const foodItems = ['bread', 'apple', 'beef', 'porkchop', 'chicken', 'fish'];
    return foodItems.some(food => itemName.includes(food));
  }

  /**
   * 武器アイテムの判定
   */
  private isWeaponItem(itemName: string): boolean {
    return itemName.includes('sword') || 
           itemName.includes('bow') || 
           itemName.includes('crossbow');
  }

  /**
   * スタック可能アイテムの統合
   */
  private consolidateStackableItems(): void {
    // スタック統合ロジック（実装依存）
    console.log('[InventoryAbility] Consolidating stackable items...');
  }

  /**
   * インベントリ価値の計算
   */
  private calculateInventoryValue(items: ItemInfo[]): number {
    // アイテム価値の計算ロジック
    return items.reduce((total, item) => total + (item.count * this.getItemValue(item.name)), 0);
  }

  /**
   * アイテム価値の取得
   */
  private getItemValue(itemName: string): number {
    const values: Record<string, number> = {
      'diamond': 100,
      'gold_ingot': 50,
      'iron_ingot': 25,
      // ... 他のアイテム価値
    };
    return values[itemName] || 1;
  }

  /**
   * キャッシュの無効化
   */
  private invalidateCache(): void {
    this.inventoryCache = undefined;
    this.lastInventoryUpdate = 0;
  }

  public cleanup(): void {
    console.log('[InventoryAbility] Cleaning up inventory management...');
    this.invalidateCache();
  }
}
```

### 4. SayAbility（コミュニケーションシステム）

```typescript
// src/abilities/SayAbility.ts
export class SayAbility implements IAbility {
  private bot: Bot;
  private messageHistory: MessageRecord[] = [];
  private messageQueue: string[] = [];
  private isProcessingQueue = false;
  private maxHistorySize = 100;
  private messageDelay = 1000; // 1秒間隔

  constructor(bot: Bot) {
    this.bot = bot;
  }

  public getName(): string {
    return 'say';
  }

  public getDescription(): string {
    return 'Communication and message management system';
  }

  public async initialize(): Promise<void> {
    console.log('[SayAbility] Initializing communication system...');
    
    if (!this.bot.mc.chat) {
      throw new Error('Chat system not available');
    }

    // メッセージキュー処理の開始
    this.startMessageQueueProcessor();
    
    console.log('[SayAbility] Communication system initialized');
  }

  public isAvailable(): boolean {
    return this.bot.mc && typeof this.bot.mc.chat === 'function';
  }

  /**
   * 基本的なメッセージ送信
   */
  public say(message: string): void {
    if (!message || message.trim().length === 0) {
      console.warn('[SayAbility] Empty message ignored');
      return;
    }

    // メッセージをキューに追加
    this.messageQueue.push(message.trim());
    console.log(`[SayAbility] Queued message: "${message}"`);
  }

  /**
   * エラーメッセージの報告
   */
  public reportError(error: string): void {
    const errorMessage = `❌ Error: ${error}`;
    this.say(errorMessage);
    
    // エラーログにも記録
    console.error(`[SayAbility] Error reported: ${error}`);
  }

  /**
   * 状態の報告
   */
  public reportStatus(): void {
    const vitals = this.bot.vitals.getVitalStats();
    const position = this.bot.getPosition();
    const state = this.bot.getCurrentState().getName();
    
    const statusMessage = `🤖 Status: ${state} | ❤️ ${vitals.health}/20 | 🍗 ${vitals.food}/20 | 📍 ${position.x},${position.y},${position.z}`;
    this.say(statusMessage);
  }

  /**
   * 成功メッセージの報告
   */
  public reportSuccess(message: string): void {
    const successMessage = `✅ ${message}`;
    this.say(successMessage);
  }

  /**
   * 警告メッセージの送信
   */
  public reportWarning(warning: string): void {
    const warningMessage = `⚠️ Warning: ${warning}`;
    this.say(warningMessage);
  }

  /**
   * 情報メッセージの送信
   */
  public reportInfo(info: string): void {
    const infoMessage = `ℹ️ ${info}`;
    this.say(infoMessage);
  }

  /**
   * 進捗の報告
   */
  public reportProgress(current: number, total: number, task: string): void {
    const percentage = Math.round((current / total) * 100);
    const progressBar = this.createProgressBar(percentage);
    const progressMessage = `📊 ${task}: ${progressBar} ${current}/${total} (${percentage}%)`;
    this.say(progressMessage);
  }

  /**
   * 複数行メッセージの送信
   */
  public sayMultiline(messages: string[]): void {
    messages.forEach(message => this.say(message));
  }

  /**
   * 定型メッセージの送信
   */
  public sayTemplate(template: MessageTemplate, params: Record<string, any> = {}): void {
    const templates: Record<MessageTemplate, string> = {
      'greeting': 'Hello! I\'m ready to help.',
      'goodbye': 'Goodbye! Thanks for using my services.',
      'ready': 'I\'m ready for commands.',
      'busy': 'I\'m currently busy with: {task}',
      'completed': 'Task completed: {task}',
      'failed': 'Task failed: {task} - {reason}',
      'health_low': '⚠️ My health is low: {health}/20',
      'hunger_low': '⚠️ I\'m getting hungry: {food}/20',
      'inventory_full': '📦 My inventory is full!',
      'item_needed': 'I need: {item} (have: {current}/{needed})',
      'moving_to': '🏃 Moving to {x}, {y}, {z}',
      'arrived_at': '📍 Arrived at {x}, {y}, {z}'
    };

    let message = templates[template] || template;
    
    // パラメータの置換
    Object.entries(params).forEach(([key, value]) => {
      message = message.replace(`{${key}}`, String(value));
    });

    this.say(message);
  }

  /**
   * メッセージ履歴の取得
   */
  public getMessageHistory(limit = 10): MessageRecord[] {
    return this.messageHistory.slice(-limit);
  }

  /**
   * 最後のメッセージの取得
   */
  public getLastMessage(): MessageRecord | null {
    return this.messageHistory.length > 0 ? 
           this.messageHistory[this.messageHistory.length - 1] : 
           null;
  }

  /**
   * メッセージ統計の取得
   */
  public getMessageStats(): MessageStats {
    const now = Date.now();
    const lastHour = now - (60 * 60 * 1000);
    const recentMessages = this.messageHistory.filter(m => m.timestamp > lastHour);

    return {
      totalMessages: this.messageHistory.length,
      messagesInLastHour: recentMessages.length,
      queuedMessages: this.messageQueue.length,
      averageMessageLength: this.calculateAverageMessageLength(),
      lastMessageTime: this.getLastMessage()?.timestamp || 0
    };
  }

  /**
   * メッセージキューの処理開始
   */
  private startMessageQueueProcessor(): void {
    if (this.isProcessingQueue) {
      return;
    }

    this.isProcessingQueue = true;
    this.processMessageQueue();
  }

  /**
   * メッセージキューの処理
   */
  private async processMessageQueue(): Promise<void> {
    while (this.isProcessingQueue) {
      if (this.messageQueue.length > 0) {
        const message = this.messageQueue.shift()!;
        
        try {
          // 実際のチャット送信
          this.bot.mc.chat(message);
          
          // 履歴に記録
          this.addToHistory(message);
          
          console.log(`[SayAbility] Sent: "${message}"`);
          
        } catch (error) {
          console.error(`[SayAbility] Failed to send message: ${error}`);
          
          // 失敗したメッセージをキューの先頭に戻す
          this.messageQueue.unshift(message);
        }
      }

      // 次のメッセージまで待機
      await new Promise(resolve => setTimeout(resolve, this.messageDelay));
    }
  }

  /**
   * 履歴への追加
   */
  private addToHistory(message: string): void {
    const record: MessageRecord = {
      message,
      timestamp: Date.now(),
      type: this.classifyMessage(message)
    };

    this.messageHistory.push(record);

    // 履歴サイズの制限
    if (this.messageHistory.length > this.maxHistorySize) {
      this.messageHistory.shift();
    }
  }

  /**
   * メッセージの分類
   */
  private classifyMessage(message: string): MessageType {
    if (message.startsWith('❌')) return 'error';
    if (message.startsWith('✅')) return 'success';
    if (message.startsWith('⚠️')) return 'warning';
    if (message.startsWith('ℹ️')) return 'info';
    if (message.startsWith('📊')) return 'progress';
    if (message.startsWith('🤖')) return 'status';
    return 'normal';
  }

  /**
   * プログレスバーの作成
   */
  private createProgressBar(percentage: number, length = 10): string {
    const filled = Math.round((percentage / 100) * length);
    const empty = length - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  }

  /**
   * 平均メッセージ長の計算
   */
  private calculateAverageMessageLength(): number {
    if (this.messageHistory.length === 0) return 0;
    
    const totalLength = this.messageHistory.reduce((sum, record) => sum + record.message.length, 0);
    return Math.round(totalLength / this.messageHistory.length);
  }

  public cleanup(): void {
    console.log('[SayAbility] Cleaning up communication system...');
    this.isProcessingQueue = false;
    this.messageQueue = [];
    this.messageHistory = [];
  }
}
```

## 🔗 アビリティ間の連携

### アビリティの相互依存関係

```typescript
// 高レベルアビリティの例：自動生存システム
export class SurvivalAbility implements IAbility {
  constructor(
    private vitals: VitalsAbility,
    private sensing: SensingAbility,
    private inventory: InventoryAbility,
    private say: SayAbility
  ) {}

  public async performSurvivalCheck(): Promise<void> {
    // 複数アビリティを組み合わせた高度な判断
    
    // 1. 体力チェック
    if (this.vitals.isHealthLow()) {
      this.say.reportWarning('Health is low');
      
      // 2. 食べ物チェック
      if (this.inventory.hasItem('bread')) {
        await this.vitals.eatFood();
        this.say.reportSuccess('Food consumed');
      } else {
        this.say.reportError('No food available');
        
        // 3. 安全な場所を探す
        const safeSpot = this.vitals.findSafeSpot();
        if (safeSpot) {
          this.say.reportInfo(`Moving to safe location: ${safeSpot.x}, ${safeSpot.y}, ${safeSpot.z}`);
        }
      }
    }

    // 4. 敵の脅威チェック
    const threats = this.sensing.detectThreats();
    if (threats.length > 0) {
      this.say.reportWarning(`${threats.length} threats detected`);
      
      // 5. 武器の準備
      const weapon = this.inventory.selectBestTool({ name: 'combat' });
      if (weapon) {
        await this.inventory.equipItem(weapon.name, 'hand');
      }
    }
  }
}
```

## 📝 練習問題

### 🟢 初級問題
**問題**: 新しいアビリティ `TimeAbility` を作成して、時間関連の機能（現在時刻、昼夜判定、時間経過計測）を実装してください。

<details>
<summary>解答例</summary>

```typescript
// src/abilities/TimeAbility.ts
export class TimeAbility implements IAbility {
  private bot: Bot;
  private startTime: number;

  constructor(bot: Bot) {
    this.bot = bot;
    this.startTime = Date.now();
  }

  public getName(): string {
    return 'time';
  }

  public getDescription(): string {
    return 'Time tracking and day/night cycle management';
  }

  public async initialize(): Promise<void> {
    console.log('[TimeAbility] Initializing time tracking...');
    
    if (!this.bot.mc.time) {
      throw new Error('Time information not available');
    }
    
    this.startTime = Date.now();
    console.log('[TimeAbility] Time tracking initialized');
  }

  public isAvailable(): boolean {
    return this.bot.mc && this.bot.mc.time !== undefined;
  }

  public getCurrentTime(): number {
    return this.bot.mc.time.timeOfDay;
  }

  public isDay(): boolean {
    const time = this.getCurrentTime();
    return time >= 0 && time < 12000;
  }

  public isNight(): boolean {
    return !this.isDay();
  }

  public getUptime(): number {
    return Date.now() - this.startTime;
  }

  public getFormattedUptime(): string {
    const uptime = this.getUptime();
    const hours = Math.floor(uptime / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((uptime % (1000 * 60)) / 1000);
    
    return `${hours}h ${minutes}m ${seconds}s`;
  }
}

// AbilityManager に追加
export class AbilityManager {
  public get time(): TimeAbility {
    return this.getAbility('time') as TimeAbility;
  }
}
```

**テスト方法**:
```typescript
test('time ability functionality', () => {
  const mockBot = createMockBot();
  mockBot.mc.time = { timeOfDay: 6000 };
  
  const timeAbility = new TimeAbility(mockBot);
  
  expect(timeAbility.getCurrentTime()).toBe(6000);
  expect(timeAbility.isDay()).toBe(true);
  expect(timeAbility.isNight()).toBe(false);
});
```
</details>

### 🟡 中級問題
**問題**: 複数のアビリティを組み合わせて `AutoFarmingAbility` を実装してください。この機能は、作物の成長状況をチェックし、収穫可能な作物を自動的に収穫する機能を持ちます。

<details>
<summary>解答例</summary>

```typescript
// src/abilities/AutoFarmingAbility.ts
export class AutoFarmingAbility implements IAbility {
  private bot: Bot;
  private abilityManager: AbilityManager;
  private farmingArea?: FarmingArea;
  private harvestedCount = 0;

  constructor(bot: Bot, abilityManager: AbilityManager) {
    this.bot = bot;
    this.abilityManager = abilityManager;
  }

  public getName(): string {
    return 'autofarming';
  }

  public getDescription(): string {
    return 'Automated farming system with crop detection and harvesting';
  }

  public async initialize(): Promise<void> {
    console.log('[AutoFarmingAbility] Initializing auto farming system...');
    
    // 依存アビリティの確認
    if (!this.abilityManager.hasAbility('sensing') || 
        !this.abilityManager.hasAbility('inventory') || 
        !this.abilityManager.hasAbility('say')) {
      throw new Error('Required abilities (sensing, inventory, say) not available');
    }
    
    console.log('[AutoFarmingAbility] Auto farming system initialized');
  }

  public isAvailable(): boolean {
    return this.abilityManager.hasAbility('sensing') && 
           this.abilityManager.hasAbility('inventory') && 
           this.abilityManager.hasAbility('say');
  }

  public setFarmingArea(area: FarmingArea): void {
    this.farmingArea = area;
    this.abilityManager.say.reportInfo(`Farming area set: ${area.width}x${area.height} at ${area.startX},${area.startZ}`);
  }

  public async startAutoFarming(): Promise<void> {
    if (!this.farmingArea) {
      throw new Error('Farming area not set');
    }

    this.abilityManager.say.reportInfo('Starting auto farming operation...');
    this.harvestedCount = 0;

    try {
      const matureCrops = await this.findMatureCrops();
      
      if (matureCrops.length === 0) {
        this.abilityManager.say.reportInfo('No mature crops found');
        return;
      }

      this.abilityManager.say.reportInfo(`Found ${matureCrops.length} mature crops`);

      for (const crop of matureCrops) {
        // インベントリ満杯チェック
        if (this.abilityManager.inventory.isFull()) {
          this.abilityManager.say.reportWarning('Inventory full, stopping farming');
          break;
        }

        await this.harvestCrop(crop);
        this.harvestedCount++;

        // 進捗報告
        if (this.harvestedCount % 10 === 0) {
          this.abilityManager.say.reportProgress(
            this.harvestedCount, 
            matureCrops.length, 
            'Farming'
          );
        }
      }

      this.abilityManager.say.reportSuccess(`Farming complete! Harvested ${this.harvestedCount} crops`);

    } catch (error) {
      this.abilityManager.say.reportError(`Farming failed: ${error}`);
      throw error;
    }
  }

  private async findMatureCrops(): Promise<CropInfo[]> {
    const crops: CropInfo[] = [];
    const farmableBlocks = ['wheat', 'carrots', 'potatoes', 'beetroots'];

    for (let x = this.farmingArea!.startX; x < this.farmingArea!.startX + this.farmingArea!.width; x++) {
      for (let z = this.farmingArea!.startZ; z < this.farmingArea!.startZ + this.farmingArea!.height; z++) {
        const y = this.farmingArea!.y;
        
        const block = this.bot.mc.blockAt({ x, y, z });
        if (block && farmableBlocks.includes(block.name)) {
          const isMature = this.isCropMature(block);
          if (isMature) {
            crops.push({
              position: { x, y, z },
              type: block.name,
              block: block
            });
          }
        }
      }
    }

    return crops;
  }

  private isCropMature(block: any): boolean {
    // 作物の成熟度チェック（メタデータ確認）
    // 小麦の場合、メタデータが7で完全成熟
    return block.metadata === 7;
  }

  private async harvestCrop(crop: CropInfo): Promise<void> {
    try {
      // 作物の位置に移動
      await this.bot.goto(crop.position.x, crop.position.y, crop.position.z);
      
      // 作物を収穫
      await this.bot.mc.dig(crop.block);
      
      // 再植え付け（種があれば）
      await this.replantCrop(crop);
      
      console.log(`[AutoFarmingAbility] Harvested ${crop.type} at ${crop.position.x}, ${crop.position.y}, ${crop.position.z}`);
      
    } catch (error) {
      console.error(`[AutoFarmingAbility] Failed to harvest crop: ${error}`);
      throw error;
    }
  }

  private async replantCrop(crop: CropInfo): Promise<void> {
    const seedName = this.getCropSeedName(crop.type);
    
    if (this.abilityManager.inventory.hasItem(seedName)) {
      try {
        // 種を手に装備
        await this.abilityManager.inventory.equipItem(seedName, 'hand');
        
        // 植え付け
        const soilBlock = this.bot.mc.blockAt({
          x: crop.position.x,
          y: crop.position.y - 1,
          z: crop.position.z
        });
        
        if (soilBlock) {
          await this.bot.mc.placeBlock(soilBlock, { x: 0, y: 1, z: 0 });
          console.log(`[AutoFarmingAbility] Replanted ${seedName}`);
        }
        
      } catch (error) {
        console.warn(`[AutoFarmingAbility] Failed to replant: ${error}`);
      }
    }
  }

  private getCropSeedName(cropType: string): string {
    const seedMap: Record<string, string> = {
      'wheat': 'wheat_seeds',
      'carrots': 'carrot',
      'potatoes': 'potato',
      'beetroots': 'beetroot_seeds'
    };
    
    return seedMap[cropType] || 'wheat_seeds';
  }

  public getFarmingStats(): FarmingStats {
    return {
      harvestedCount: this.harvestedCount,
      farmingArea: this.farmingArea,
      isActive: false // 実際の状態に応じて
    };
  }

  public cleanup(): void {
    console.log('[AutoFarmingAbility] Cleaning up auto farming system...');
    this.farmingArea = undefined;
    this.harvestedCount = 0;
  }
}

// 型定義
interface FarmingArea {
  startX: number;
  startZ: number;
  y: number;
  width: number;
  height: number;
}

interface CropInfo {
  position: { x: number; y: number; z: number };
  type: string;
  block: any;
}

interface FarmingStats {
  harvestedCount: number;
  farmingArea?: FarmingArea;
  isActive: boolean;
}
```

**使用例**:
```typescript
// 自動農業システムの使用
const autoFarming = new AutoFarmingAbility(bot, abilityManager);
await abilityManager.registerAndInitialize(autoFarming);

// 農業エリアの設定
autoFarming.setFarmingArea({
  startX: 100,
  startZ: 200,
  y: 64,
  width: 10,
  height: 10
});

// 自動農業の開始
await autoFarming.startAutoFarming();
```
</details>

### 🔴 上級問題
**問題**: アビリティシステムにプラグインアーキテクチャを追加してください。外部からアビリティを動的にロード・アンロードできるシステムを設計し、アビリティ間の依存関係解決とライフサイクル管理を実装してください。

<details>
<summary>解答例</summary>

```typescript
// アビリティプラグインシステム
export interface IAbilityPlugin {
  getName(): string;
  getVersion(): string;
  getDependencies(): string[];
  createAbility(bot: Bot, context: PluginContext): IAbility;
  onLoad?(): Promise<void>;
  onUnload?(): Promise<void>;
}

// プラグインコンテキスト
export interface PluginContext {
  abilityManager: AbilityManager;
  logger: Logger;
  config: any;
}

// 依存関係解決器
export class DependencyResolver {
  private dependencyGraph = new Map<string, string[]>();
  
  public addDependency(ability: string, dependencies: string[]): void {
    this.dependencyGraph.set(ability, dependencies);
  }
  
  public resolveDependencies(abilities: string[]): string[] {
    const resolved: string[] = [];
    const visiting = new Set<string>();
    const visited = new Set<string>();
    
    const visit = (ability: string) => {
      if (visited.has(ability)) return;
      if (visiting.has(ability)) {
        throw new Error(`Circular dependency detected: ${ability}`);
      }
      
      visiting.add(ability);
      
      const deps = this.dependencyGraph.get(ability) || [];
      for (const dep of deps) {
        if (!abilities.includes(dep)) {
          throw new Error(`Missing dependency: ${dep} for ${ability}`);
        }
        visit(dep);
      }
      
      visiting.delete(ability);
      visited.add(ability);
      resolved.push(ability);
    };
    
    for (const ability of abilities) {
      visit(ability);
    }
    
    return resolved;
  }
}

// 拡張されたAbilityManager
export class PluginableAbilityManager extends AbilityManager {
  private plugins = new Map<string, IAbilityPlugin>();
  private dependencyResolver = new DependencyResolver();
  private pluginContext: PluginContext;
  
  constructor(bot: Bot) {
    super(bot);
    this.pluginContext = {
      abilityManager: this,
      logger: new Logger(),
      config: {}
    };
  }
  
  /**
   * プラグインの動的ロード
   */
  public async loadPlugin(plugin: IAbilityPlugin): Promise<void> {
    const name = plugin.getName();
    
    if (this.plugins.has(name)) {
      throw new Error(`Plugin ${name} is already loaded`);
    }
    
    console.log(`[PluginManager] Loading plugin: ${name} v${plugin.getVersion()}`);
    
    try {
      // プラグインのonLoadコールバック
      if (plugin.onLoad) {
        await plugin.onLoad();
      }
      
      // 依存関係の登録
      this.dependencyResolver.addDependency(name, plugin.getDependencies());
      
      // アビリティの作成
      const ability = plugin.createAbility(this.bot, this.pluginContext);
      
      // アビリティの登録と初期化
      await this.registerAndInitialize(ability);
      
      // プラグインの登録
      this.plugins.set(name, plugin);
      
      console.log(`[PluginManager] Successfully loaded plugin: ${name}`);
      
    } catch (error) {
      console.error(`[PluginManager] Failed to load plugin ${name}: ${error}`);
      throw error;
    }
  }
  
  /**
   * プラグインのアンロード
   */
  public async unloadPlugin(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      throw new Error(`Plugin ${name} is not loaded`);
    }
    
    console.log(`[PluginManager] Unloading plugin: ${name}`);
    
    try {
      // 依存しているプラグインをチェック
      const dependents = this.findDependents(name);
      if (dependents.length > 0) {
        throw new Error(`Cannot unload ${name}: depended by ${dependents.join(', ')}`);
      }
      
      // アビリティのクリーンアップ
      const ability = this.getAbility(name);
      if (ability && ability.cleanup) {
        ability.cleanup();
      }
      
      // アビリティの登録解除
      this.abilities.delete(name);
      
      // プラグインのonUnloadコールバック
      if (plugin.onUnload) {
        await plugin.onUnload();
      }
      
      // プラグインの登録解除
      this.plugins.delete(name);
      
      console.log(`[PluginManager] Successfully unloaded plugin: ${name}`);
      
    } catch (error) {
      console.error(`[PluginManager] Failed to unload plugin ${name}: ${error}`);
      throw error;
    }
  }
  
  /**
   * 依存関係に基づくプラグインの一括ロード
   */
  public async loadPlugins(plugins: IAbilityPlugin[]): Promise<void> {
    const pluginNames = plugins.map(p => p.getName());
    
    // 依存関係の登録
    for (const plugin of plugins) {
      this.dependencyResolver.addDependency(plugin.getName(), plugin.getDependencies());
    }
    
    // 依存関係解決
    const loadOrder = this.dependencyResolver.resolveDependencies(pluginNames);
    
    // 解決順序でロード
    for (const name of loadOrder) {
      const plugin = plugins.find(p => p.getName() === name);
      if (plugin) {
        await this.loadPlugin(plugin);
      }
    }
  }
  
  /**
   * プラグイン情報の取得
   */
  public getPluginInfo(name: string): PluginInfo | null {
    const plugin = this.plugins.get(name);
    if (!plugin) return null;
    
    return {
      name: plugin.getName(),
      version: plugin.getVersion(),
      dependencies: plugin.getDependencies(),
      loaded: true,
      ability: this.getAbility(name) !== undefined
    };
  }
  
  /**
   * 全プラグイン情報の取得
   */
  public getAllPluginInfo(): PluginInfo[] {
    return Array.from(this.plugins.values()).map(plugin => ({
      name: plugin.getName(),
      version: plugin.getVersion(),
      dependencies: plugin.getDependencies(),
      loaded: true,
      ability: this.getAbility(plugin.getName()) !== undefined
    }));
  }
  
  /**
   * 依存しているプラグインを検索
   */
  private findDependents(targetName: string): string[] {
    const dependents: string[] = [];
    
    for (const [name, deps] of this.dependencyResolver.dependencyGraph) {
      if (deps.includes(targetName)) {
        dependents.push(name);
      }
    }
    
    return dependents;
  }
  
  /**
   * プラグインのホットリロード
   */
  public async reloadPlugin(name: string, newPlugin: IAbilityPlugin): Promise<void> {
    console.log(`[PluginManager] Reloading plugin: ${name}`);
    
    // 既存プラグインをアンロード
    if (this.plugins.has(name)) {
      await this.unloadPlugin(name);
    }
    
    // 新しいプラグインをロード
    await this.loadPlugin(newPlugin);
  }
}

// プラグイン実装例
export class AutoMiningPlugin implements IAbilityPlugin {
  public getName(): string {
    return 'automining';
  }
  
  public getVersion(): string {
    return '1.0.0';
  }
  
  public getDependencies(): string[] {
    return ['sensing', 'inventory', 'say'];
  }
  
  public createAbility(bot: Bot, context: PluginContext): IAbility {
    return new AutoMiningAbility(bot, context.abilityManager);
  }
  
  public async onLoad(): Promise<void> {
    console.log('[AutoMiningPlugin] Plugin loaded');
  }
  
  public async onUnload(): Promise<void> {
    console.log('[AutoMiningPlugin] Plugin unloaded');
  }
}

// 使用例
const pluginManager = new PluginableAbilityManager(bot);

// プラグインの個別ロード
await pluginManager.loadPlugin(new AutoMiningPlugin());

// プラグインの一括ロード（依存関係解決）
await pluginManager.loadPlugins([
  new AutoMiningPlugin(),
  new AutoFarmingPlugin(), 
  new AdvancedCombatPlugin()
]);

// プラグインのホットリロード
await pluginManager.reloadPlugin('automining', new UpdatedAutoMiningPlugin());

// プラグイン情報の確認
const pluginInfo = pluginManager.getAllPluginInfo();
console.log('Loaded plugins:', pluginInfo);
```

**テスト方法**:
```typescript
test('plugin system functionality', async () => {
  const manager = new PluginableAbilityManager(mockBot);
  const mockPlugin = new MockPlugin();
  
  // プラグインロード
  await manager.loadPlugin(mockPlugin);
  expect(manager.hasAbility('mock')).toBe(true);
  
  // 依存関係エラー
  const dependentPlugin = new DependentPlugin(['nonexistent']);
  await expect(manager.loadPlugin(dependentPlugin)).rejects.toThrow();
  
  // プラグインアンロード
  await manager.unloadPlugin('mock');
  expect(manager.hasAbility('mock')).toBe(false);
});
```
</details>

## 🏆 自己評価チェックリスト

- [ ] **初級**: アビリティシステムの基本概念と個別アビリティの実装を理解している
- [ ] **中級**: 複数アビリティを組み合わせた高レベル機能を実装できる
- [ ] **上級**: プラグインアーキテクチャと依存関係管理システムを設計できる

## 📚 次のステップ

アビリティシステムを理解したら、次は**[テストアーキテクチャ](./11_testing_architecture.md)**でモジュラー設計のテスト戦略を学び、品質保証の手法について学習しましょう。