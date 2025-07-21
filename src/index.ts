import { config } from "dotenv";
import { AbilityTestCommand } from "./commands/AbilityTestCommand";
import { AttackCommand } from "./commands/AttackCommand";
import { ComeCommand } from "./commands/ComeCommand";
import { DigCommand } from "./commands/DigCommand";
import { DropCommand } from "./commands/DropCommand";
import { EquipCommand } from "./commands/EquipCommand";
import { ExplorerCommand } from "./commands/ExplorerCommand";
import { FarmerCommand } from "./commands/FarmerCommand";
import { GiveCommand } from "./commands/GiveCommand";
import { GotoCommand } from "./commands/GotoCommand";
import { HomeCommand } from "./commands/HomeCommand";
import { IdleCommand } from "./commands/IdleCommand";
import { InventoryCommand } from "./commands/InventoryCommand";
import { KillCommand } from "./commands/KillCommand";
import { LumberjackCommand } from "./commands/LumberjackCommand";
import { MinerCommand } from "./commands/MinerCommand";
import { PlaceCommand } from "./commands/PlaceCommand";
import { ScriptCommand } from "./commands/ScriptCommand";
import { ServantCommand } from "./commands/ServantCommand";
import { SetHomeCommand } from "./commands/SetHomeCommand";
import { SetRespawnCommand } from "./commands/SetRespawnCommand";
import { StopCommand } from "./commands/StopCommand";
import { WanderCommand } from "./commands/WanderCommand";
import { Bot, type BotOptions } from "./core/Bot";
import { CommandHandler } from "./core/CommandHandler";
import { ScriptManager } from "./interpreter/manager/ScriptManager";
import { IdleState } from "./states/IdleState";

// .envファイルから環境変数を読み込み
config();

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
		commandHandler.registerCommand("idle", new IdleCommand());
		commandHandler.registerCommand("servant", new ServantCommand());

		// 移動・ナビゲーション機能コマンドを登録
		commandHandler.registerCommand("come", new ComeCommand());
		commandHandler.registerCommand("goto", new GotoCommand());
		commandHandler.registerCommand("sethome", new SetHomeCommand());
		commandHandler.registerCommand("home", new HomeCommand());

		// 新しい高度なモードコマンドを登録
		commandHandler.registerCommand("wander", new WanderCommand());
		commandHandler.registerCommand("lumberjack", new LumberjackCommand());
		commandHandler.registerCommand("explorer", new ExplorerCommand());
		commandHandler.registerCommand("farmer", new FarmerCommand());
		commandHandler.registerCommand("miner", new MinerCommand());

		// ワールド操作・作業機能コマンドを登録
		commandHandler.registerCommand("dig", new DigCommand());
		commandHandler.registerCommand("place", new PlaceCommand());
		commandHandler.registerCommand("attack", new AttackCommand());
		commandHandler.registerCommand("kill", new KillCommand());
		commandHandler.registerCommand("setrespawn", new SetRespawnCommand());

		// インベントリ・アイテム管理機能コマンドを登録
		commandHandler.registerCommand("inventory", new InventoryCommand());
		commandHandler.registerCommand("give", new GiveCommand());
		commandHandler.registerCommand("drop", new DropCommand());
		commandHandler.registerCommand("equip", new EquipCommand());

		// アビリティテストコマンドを登録
		commandHandler.registerCommand("abilitytest", new AbilityTestCommand());

		// Scriptコマンドを登録
		commandHandler.registerCommand(
			"script",
			new ScriptCommand(new ScriptManager(bot)),
		);

		// チャットイベントリスナーを設定
		bot.mc.on("chat", async (username: string, message: string) => {
			// Scriptのチャットメッセージを処理
			await commandHandler.handleMessage(bot, username, message);
		});

		// スポーンイベントで初期状態を設定
		bot.mc.once("spawn", async () => {
			console.log(
				`Bot ${options.username} spawned. Setting initial state to Idle.`,
			);
			await bot.changeState(IdleState.getInstance(bot));
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
