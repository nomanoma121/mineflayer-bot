import { ICommand } from "./ICommand";
import { Bot } from "../core/Bot";
import { LumberjackingState } from "../states/LumberjackingState";

/**
 * 木こりコマンドクラス
 * ボットを木こりモードに移行させる
 */
export class LumberjackCommand implements ICommand {
  /**
   * コマンドを実行
   * @param bot - 操作対象のボットインスタンス
   * @param username - コマンドを実行したプレイヤーのユーザー名
   * @param args - コマンドの引数配列
   */
  public async execute(bot: Bot, username: string, args: string[]): Promise<void> {
    try {
      // デフォルト値
      let treeType = "oak";
      let range = 30;
      
      // 引数の解析
      if (args.length > 0) {
        const validTreeTypes = ["oak", "birch", "spruce", "jungle", "acacia", "dark_oak"];
        if (validTreeTypes.includes(args[0])) {
          treeType = args[0];
        } else {
          bot.sendMessage(`エラー: 有効な木の種類を指定してください (${validTreeTypes.join(", ")})`);
          return;
        }
      }
      
      if (args.length > 1) {
        const parsedRange = parseInt(args[1], 10);
        if (!isNaN(parsedRange) && parsedRange > 0 && parsedRange <= 100) {
          range = parsedRange;
        } else {
          bot.sendMessage(`エラー: 範囲は1〜100の整数で指定してください。デフォルト値(30)を使用します。`);
        }
      }
      
      console.log(`[${bot.getName()}] Lumberjack command executed by ${username}, tree type: ${treeType}, range: ${range}`);
      
      // 現在の状態をログに出力
      const currentState = bot.getCurrentState();
      const currentStateName = currentState ? currentState.getName() : "Unknown";
      
      console.log(`[${bot.getName()}] Changing state from ${currentStateName} to Lumberjacking`);
      
      // 木こり状態に遷移
      bot.changeState(new LumberjackingState(bot, treeType, range));
      
      // 成功メッセージを送信
      bot.sendMessage(`${username}様の指示により、${treeType}の木こり作業を開始します。範囲: ${range}ブロック`);
      
    } catch (error) {
      console.error(`[${bot.getName()}] Error in lumberjack command:`, error);
      bot.sendMessage("木こりモードへの移行中にエラーが発生しました。");
    }
  }
  
  /**
   * コマンド名を取得
   * @returns コマンド名
   */
  public getName(): string {
    return "lumberjack";
  }
  
  /**
   * コマンドの説明を取得
   * @returns コマンドの説明
   */
  public getDescription(): string {
    return "木を伐採し、苗木を植える木こりモードに移行します";
  }
  
  /**
   * コマンドの使用法を取得
   * @returns コマンドの使用法
   */
  public getUsage(): string {
    return "@bot lumberjack [木の種類] [範囲] - 木こり作業開始 (例: @bot lumberjack oak 50)";
  }
}
