import { Bot } from "../core/Bot";
import { Entity } from "prismarine-entity";

/**
 * エンティティ操作のユーティリティクラス
 * 共通のエンティティ検索や操作ロジックを提供
 */
export class EntityUtils {
  /**
   * 指定された名前に一致する近くのエンティティを検索
   * @param bot - ボットインスタンス
   * @param targetName - 検索対象の名前
   * @param maxDistance - 最大検索距離（ブロック数）
   * @returns 見つかったエンティティの配列
   */
  public static findNearbyEntitiesByName(
    bot: Bot,
    targetName: string,
    maxDistance: number = 20
  ): Entity[] {
    return Object.values(bot.mc.entities).filter(entity => {
      if (!entity || !entity.position) return false;
      
      // 距離チェック
      const distance = bot.mc.entity.position.distanceTo(entity.position);
      if (distance > maxDistance) return false;
      
      const lowerTargetName = targetName.toLowerCase();
      
      // 名前チェック
      if (entity.name && entity.name.toLowerCase().includes(lowerTargetName)) {
        return true;
      }
      
      // プレイヤー名チェック
      if (entity.username && entity.username.toLowerCase().includes(lowerTargetName)) {
        return true;
      }
      
      // エンティティタイプチェック
      if (entity.type && entity.type.toLowerCase().includes(lowerTargetName)) {
        return true;
      }
      
      return false;
    });
  }

  /**
   * エンティティリストから最も近いものを選択
   * @param bot - ボットインスタンス
   * @param entities - エンティティリスト
   * @returns 最も近いエンティティ、またはnull
   */
  public static findClosestEntity(bot: Bot, entities: Entity[]): Entity | null {
    if (entities.length === 0) return null;
    
    return entities.reduce((closest, current) => {
      if (!closest) return current;
      
      const closestDistance = bot.mc.entity.position.distanceTo(closest.position);
      const currentDistance = bot.mc.entity.position.distanceTo(current.position);
      
      return currentDistance < closestDistance ? current : closest;
    });
  }

  /**
   * エンティティの表示名を取得
   * @param entity - エンティティ
   * @returns 表示名
   */
  public static getEntityDisplayName(entity: Entity): string {
    return entity.name || entity.username || entity.type || 'unknown';
  }

  /**
   * ボットから指定エンティティまでの距離を計算
   * @param bot - ボットインスタンス
   * @param entity - 対象エンティティ
   * @returns 距離（ブロック数）
   */
  public static getDistanceToEntity(bot: Bot, entity: Entity): number {
    return bot.mc.entity.position.distanceTo(entity.position);
  }

  /**
   * 自分自身への攻撃を防ぐ検証
   * @param bot - ボットインスタンス
   * @param target - 攻撃対象
   * @returns 攻撃可能かどうか
   */
  public static canAttackTarget(bot: Bot, target: Entity): boolean {
    return target.username !== bot.getName();
  }

  /**
   * 敵対モブかどうかを判定
   * @param entity - 判定対象のエンティティ
   * @returns 敵対モブかどうか
   */
  public static isHostileMob(entity: Entity): boolean {
    if (!entity.type) return false;
    
    const hostileTypes = [
      'zombie', 'skeleton', 'creeper', 'spider', 'enderman', 'witch',
      'slime', 'magma_cube', 'blaze', 'ghast', 'wither_skeleton',
      'husk', 'stray', 'phantom', 'drowned', 'pillager', 'vindicator',
      'evoker', 'ravager', 'vex', 'silverfish', 'endermite',
      'guardian', 'elder_guardian', 'shulker', 'hoglin', 'zoglin',
      'piglin_brute', 'warden'
    ];
    
    const entityType = entity.type.toLowerCase();
    return hostileTypes.some(type => entityType.includes(type));
  }
}
