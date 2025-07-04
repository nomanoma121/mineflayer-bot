import { Bot, BotOptions } from "./core/Bot";
import { CommandHandler } from "./core/CommandHandler";
import { StopCommand } from "./commands/StopCommand";
import { IdleState } from "./states/IdleState";

/**
 * アプリケーションのエントリーポイント
 * 環境変数から設定を読み込み、ボットを起動
 */
async function main(): Promise<void> {
  try {
    // 環境変数から設定を読み込み
    const options: BotOptions = {
      host: process.env.MC_HOST || "localhost",
      port: parseInt(process.env.MC_PORT || "25565", 10),
      username: process.env.MC_USERNAME || "Bot",
      auth: (process.env.MC_AUTH as "offline" | "microsoft") || "offline",
      version: process.env.MC_VERSION || "1.20.1",
    };

    console.log("Bot Options:", options);

    // ボットインスタンスを作成
    const bot = new Bot(options);

    // コマンドハンドラーを作成
    const commandHandler = new CommandHandler(options.username);

    // 基本コマンドを登録
    commandHandler.registerCommand("stop", new StopCommand());

    // チャットイベントリスナーを設定
    bot.mc.on("chat", async (username: string, message: string) => {
      await commandHandler.handleMessage(bot, username, message);
    });

    // スポーンイベントで初期状態を設定
    bot.mc.once("spawn", () => {
      console.log(
        `Bot ${options.username} spawned. Setting initial state to Idle.`
      );
      bot.changeState(IdleState.getInstance());
      bot.sendMessage("ボットが起動しました。コマンドをお待ちしています。");
    });

    // エラーハンドリング
    bot.mc.on("error", (error) => {
      console.error("Bot error:", error);
    });

    bot.mc.on("end", (reason) => {
      console.log(`Bot disconnected: ${reason}`);
      process.exit(0);
    });

    // 接続開始
    bot.connect();

    console.log(`Starting bot ${options.username}...`);
    console.log(`Connecting to ${options.host}:${options.port}`);
  } catch (error) {
    console.error("Failed to start bot:", error);
    process.exit(1);
  }
}

// プロセス終了時のクリーンアップ
process.on("SIGINT", () => {
  console.log("\nReceived SIGINT. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\nReceived SIGTERM. Shutting down gracefully...");
  process.exit(0);
});

// メイン関数を実行
main().catch((error) => {
  console.error("Unhandled error in main:", error);
  process.exit(1);
});
