import { config } from "dotenv";
import fs from "fs";
import path from "path";

/**
 * ボット設定のインターフェース
 */
export interface BotConfig {
	server: {
		host: string;
		port: number;
		version: string;
	};
	bot: {
		username: string;
		auth: "offline" | "microsoft";
		maxRetries: number;
		retryDelay: number;
	};
	features: {
		autoEat: boolean;
		autoRespawn: boolean;
		allowCommands: string[];
		enableLogging: boolean;
		logLevel: "debug" | "info" | "warn" | "error";
	};
	abilities: {
		enabled: string[];
		vitals: {
			healthThreshold: number;
			hungerThreshold: number;
		};
		sensing: {
			maxEntityDistance: number;
			updateInterval: number;
		};
		inventory: {
			keepValuableItems: boolean;
			autoDropJunk: boolean;
		};
		say: {
			maxHistorySize: number;
			enableTemplates: boolean;
		};
	};
	commands: {
		prefix: string;
		aliases: Record<string, string>;
		permissions: Record<string, string[]>;
	};
}

/**
 * 設定管理クラス
 * 環境変数、設定ファイル、デフォルト値の階層的な設定管理を提供
 */
export class ConfigManager {
	private config: BotConfig;
	private configPath: string;

	constructor(configPath?: string) {
		this.configPath = configPath || path.join(process.cwd(), "bot.config.json");
		this.config = this.loadConfig();
	}

	/**
	 * 設定を読み込み
	 * 優先順位: 環境変数 > 設定ファイル > デフォルト値
	 */
	private loadConfig(): BotConfig {
		// 環境変数を読み込み
		config();

		// デフォルト設定
		const defaultConfig: BotConfig = {
			server: {
				host: "localhost",
				port: 25565,
				version: "1.20.1",
			},
			bot: {
				username: "MinecraftBot",
				auth: "offline",
				maxRetries: 3,
				retryDelay: 5000,
			},
			features: {
				autoEat: true,
				autoRespawn: true,
				allowCommands: ["*"],
				enableLogging: true,
				logLevel: "info",
			},
			abilities: {
				enabled: ["Vitals", "Sensing", "Inventory", "Say"],
				vitals: {
					healthThreshold: 10,
					hungerThreshold: 10,
				},
				sensing: {
					maxEntityDistance: 64,
					updateInterval: 1000,
				},
				inventory: {
					keepValuableItems: true,
					autoDropJunk: false,
				},
				say: {
					maxHistorySize: 100,
					enableTemplates: true,
				},
			},
			commands: {
				prefix: "@",
				aliases: {
					status: "abilitytest status",
					health: "abilitytest vitals",
					pos: "abilitytest sensing",
				},
				permissions: {
					admin: ["*"],
					user: ["idle", "status", "health", "inventory"],
				},
			},
		};

		// 設定ファイルを読み込み
		let fileConfig: Partial<BotConfig> = {};
		if (fs.existsSync(this.configPath)) {
			try {
				const fileContent = fs.readFileSync(this.configPath, "utf8");
				fileConfig = JSON.parse(fileContent);
			} catch (error) {
				console.warn(`Failed to load config file ${this.configPath}:`, error);
			}
		}

		// 環境変数から設定を読み込み
		const envConfig: Partial<BotConfig> = {
			server: {
				host: process.env.MC_HOST || defaultConfig.server.host,
				port: parseInt(
					process.env.MC_PORT || String(defaultConfig.server.port),
					10,
				),
				version: process.env.MC_VERSION || defaultConfig.server.version,
			},
			bot: {
				username: process.env.MC_USERNAME || defaultConfig.bot.username,
				auth:
					(process.env.MC_AUTH as "offline" | "microsoft") ||
					defaultConfig.bot.auth,
				maxRetries: parseInt(
					process.env.MC_MAX_RETRIES || String(defaultConfig.bot.maxRetries),
					10,
				),
				retryDelay: parseInt(
					process.env.MC_RETRY_DELAY || String(defaultConfig.bot.retryDelay),
					10,
				),
			},
			features: {
				autoEat:
					process.env.MC_AUTO_EAT === "true" || defaultConfig.features.autoEat,
				autoRespawn:
					process.env.MC_AUTO_RESPAWN === "true" ||
					defaultConfig.features.autoRespawn,
				allowCommands:
					process.env.MC_ALLOW_COMMANDS?.split(",") ||
					defaultConfig.features.allowCommands,
				enableLogging: process.env.MC_ENABLE_LOGGING !== "false",
				logLevel:
					(process.env.MC_LOG_LEVEL as any) || defaultConfig.features.logLevel,
			},
		};

		// 設定をマージ（深いマージ）
		return this.deepMerge(defaultConfig, fileConfig, envConfig);
	}

	/**
	 * 深いオブジェクトマージ
	 */
	private deepMerge(...objects: any[]): BotConfig {
		const result = {};

		for (const obj of objects) {
			for (const key in obj) {
				if (
					obj[key] &&
					typeof obj[key] === "object" &&
					!Array.isArray(obj[key])
				) {
					(result as any)[key] = this.deepMerge(
						(result as any)[key] || {},
						obj[key],
					);
				} else {
					(result as any)[key] = obj[key];
				}
			}
		}

		return result as BotConfig;
	}

	/**
	 * 設定を取得
	 */
	public getConfig(): BotConfig {
		return this.config;
	}

	/**
	 * 特定の設定項目を取得
	 */
	public get<T extends keyof BotConfig>(key: T): BotConfig[T] {
		return this.config[key];
	}

	/**
	 * ネストされた設定項目を取得
	 */
	public getValue<T>(path: string, defaultValue?: T): T {
		const keys = path.split(".");
		let current: any = this.config;

		for (const key of keys) {
			if (current && typeof current === "object" && key in current) {
				current = current[key];
			} else {
				return defaultValue as T;
			}
		}

		return current as T;
	}

	/**
	 * 設定を更新
	 */
	public updateConfig(updates: Partial<BotConfig>): void {
		this.config = this.deepMerge(this.config, updates);
	}

	/**
	 * 設定をファイルに保存
	 */
	public saveConfig(): void {
		try {
			const configData = JSON.stringify(this.config, null, 2);
			fs.writeFileSync(this.configPath, configData, "utf8");
		} catch (error) {
			console.error(`Failed to save config to ${this.configPath}:`, error);
			throw error;
		}
	}

	/**
	 * 設定をリロード
	 */
	public reloadConfig(): void {
		this.config = this.loadConfig();
	}

	/**
	 * 設定の検証
	 */
	public validateConfig(): { isValid: boolean; errors: string[] } {
		const errors: string[] = [];

		// サーバー設定の検証
		if (!this.config.server.host) {
			errors.push("Server host is required");
		}

		if (this.config.server.port < 1 || this.config.server.port > 65535) {
			errors.push("Server port must be between 1 and 65535");
		}

		// ボット設定の検証
		if (!this.config.bot.username) {
			errors.push("Bot username is required");
		}

		if (!["offline", "microsoft"].includes(this.config.bot.auth)) {
			errors.push('Bot auth must be either "offline" or "microsoft"');
		}

		// 機能設定の検証
		if (
			!["debug", "info", "warn", "error"].includes(
				this.config.features.logLevel,
			)
		) {
			errors.push("Log level must be one of: debug, info, warn, error");
		}

		// アビリティ設定の検証
		if (
			this.config.abilities.vitals.healthThreshold < 0 ||
			this.config.abilities.vitals.healthThreshold > 20
		) {
			errors.push("Health threshold must be between 0 and 20");
		}

		if (
			this.config.abilities.vitals.hungerThreshold < 0 ||
			this.config.abilities.vitals.hungerThreshold > 20
		) {
			errors.push("Hunger threshold must be between 0 and 20");
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
	}

	/**
	 * 設定のサマリーを取得
	 */
	public getConfigSummary(): string {
		const summary = [
			`Server: ${this.config.server.host}:${this.config.server.port} (${this.config.server.version})`,
			`Bot: ${this.config.bot.username} (${this.config.bot.auth})`,
			`Abilities: ${this.config.abilities.enabled.join(", ")}`,
			`Features: AutoEat=${this.config.features.autoEat}, AutoRespawn=${this.config.features.autoRespawn}`,
			`Logging: ${this.config.features.logLevel} (${this.config.features.enableLogging ? "enabled" : "disabled"})`,
		];

		return summary.join("\n");
	}

	/**
	 * 設定を環境変数形式で出力
	 */
	public exportToEnv(): string {
		const envVars = [
			`MC_HOST=${this.config.server.host}`,
			`MC_PORT=${this.config.server.port}`,
			`MC_VERSION=${this.config.server.version}`,
			`MC_USERNAME=${this.config.bot.username}`,
			`MC_AUTH=${this.config.bot.auth}`,
			`MC_MAX_RETRIES=${this.config.bot.maxRetries}`,
			`MC_RETRY_DELAY=${this.config.bot.retryDelay}`,
			`MC_AUTO_EAT=${this.config.features.autoEat}`,
			`MC_AUTO_RESPAWN=${this.config.features.autoRespawn}`,
			`MC_ALLOW_COMMANDS=${this.config.features.allowCommands.join(",")}`,
			`MC_ENABLE_LOGGING=${this.config.features.enableLogging}`,
			`MC_LOG_LEVEL=${this.config.features.logLevel}`,
		];

		return envVars.join("\n");
	}

	/**
	 * デフォルト設定ファイルを作成
	 */
	public createDefaultConfig(): void {
		const defaultConfig = new ConfigManager().getConfig();
		const configData = JSON.stringify(defaultConfig, null, 2);

		fs.writeFileSync(this.configPath, configData, "utf8");
		console.log(`Default config created at: ${this.configPath}`);
	}
}
