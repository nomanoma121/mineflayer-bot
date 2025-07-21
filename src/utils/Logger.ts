import path from "path";
import winston from "winston";

/**
 * 構造化ログシステム
 * Winstonを使用した階層的ログ管理
 */
export class Logger {
	private static instance: winston.Logger;
	private static initialized = false;

	/**
	 * ロガーインスタンスを取得
	 */
	public static getInstance(): winston.Logger {
		if (!Logger.initialized) {
			Logger.initialize();
		}
		return Logger.instance;
	}

	/**
	 * ロガーを初期化
	 */
	private static initialize(): void {
		const logLevel = process.env.MC_LOG_LEVEL || "info";
		const enableLogging = process.env.MC_ENABLE_LOGGING !== "false";

		// ログフォーマットの定義
		const logFormat = winston.format.combine(
			winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
			winston.format.errors({ stack: true }),
			winston.format.printf(({ timestamp, level, message, ...meta }) => {
				let output = `${timestamp} [${level.toUpperCase()}] ${message}`;

				if (Object.keys(meta).length > 0) {
					output += " " + JSON.stringify(meta);
				}

				return output;
			}),
		);

		// コンソール用カラーフォーマット
		const consoleFormat = winston.format.combine(
			winston.format.colorize(),
			winston.format.timestamp({ format: "HH:mm:ss" }),
			winston.format.printf(({ timestamp, level, message, ...meta }) => {
				let output = `${timestamp} ${level} ${message}`;

				if (Object.keys(meta).length > 0) {
					output += " " + JSON.stringify(meta);
				}

				return output;
			}),
		);

		const transports: winston.transport[] = [];

		// コンソール出力
		if (enableLogging) {
			transports.push(
				new winston.transports.Console({
					level: logLevel,
					format: consoleFormat,
				}),
			);
		}

		// ファイル出力
		const logsDir = path.join(process.cwd(), "logs");

		transports.push(
			// 全ログ
			new winston.transports.File({
				filename: path.join(logsDir, "bot.log"),
				level: logLevel,
				format: logFormat,
				maxsize: 10 * 1024 * 1024, // 10MB
				maxFiles: 5,
			}),

			// エラーログ
			new winston.transports.File({
				filename: path.join(logsDir, "error.log"),
				level: "error",
				format: logFormat,
				maxsize: 10 * 1024 * 1024, // 10MB
				maxFiles: 5,
			}),
		);

		Logger.instance = winston.createLogger({
			level: logLevel,
			transports,
			// 未処理例外とプロミス拒否をキャッチ
			exceptionHandlers: [
				new winston.transports.File({
					filename: path.join(logsDir, "exceptions.log"),
					format: logFormat,
				}),
			],
			rejectionHandlers: [
				new winston.transports.File({
					filename: path.join(logsDir, "rejections.log"),
					format: logFormat,
				}),
			],
		});

		Logger.initialized = true;
	}

	/**
	 * ボット専用のログメソッド
	 */
	public static bot = {
		// ボット状態関連
		stateChange: (from: string, to: string, botName: string) => {
			Logger.getInstance().info("Bot state changed", {
				from,
				to,
				botName,
				category: "state",
			});
		},

		commandExecuted: (
			command: string,
			username: string,
			botName: string,
			success: boolean,
		) => {
			Logger.getInstance().info("Command executed", {
				command,
				username,
				botName,
				success,
				category: "command",
			});
		},

		// 接続関連
		connected: (host: string, port: number, username: string) => {
			Logger.getInstance().info("Bot connected to server", {
				host,
				port,
				username,
				category: "connection",
			});
		},

		disconnected: (reason: string, username: string) => {
			Logger.getInstance().warn("Bot disconnected", {
				reason,
				username,
				category: "connection",
			});
		},

		connectionError: (error: Error, host: string, port: number) => {
			Logger.getInstance().error("Connection failed", {
				error: error.message,
				stack: error.stack,
				host,
				port,
				category: "connection",
			});
		},

		// アビリティ関連
		abilityUsed: (
			ability: string,
			method: string,
			botName: string,
			success: boolean,
		) => {
			Logger.getInstance().debug("Ability used", {
				ability,
				method,
				botName,
				success,
				category: "ability",
			});
		},

		abilityError: (
			ability: string,
			method: string,
			error: Error,
			botName: string,
		) => {
			Logger.getInstance().error("Ability error", {
				ability,
				method,
				error: error.message,
				stack: error.stack,
				botName,
				category: "ability",
			});
		},

		// 生存状態関連
		healthLow: (health: number, botName: string) => {
			Logger.getInstance().warn("Low health detected", {
				health,
				botName,
				category: "vitals",
			});
		},

		hungerLow: (food: number, botName: string) => {
			Logger.getInstance().warn("Low hunger detected", {
				food,
				botName,
				category: "vitals",
			});
		},

		eating: (item: string, botName: string) => {
			Logger.getInstance().debug("Bot eating", {
				item,
				botName,
				category: "vitals",
			});
		},

		// 環境関連
		entityDetected: (
			entityType: string,
			entityName: string,
			distance: number,
			botName: string,
		) => {
			Logger.getInstance().debug("Entity detected", {
				entityType,
				entityName,
				distance,
				botName,
				category: "sensing",
			});
		},

		blockFound: (blockType: string, position: string, botName: string) => {
			Logger.getInstance().debug("Block found", {
				blockType,
				position,
				botName,
				category: "sensing",
			});
		},

		// インベントリ関連
		itemUsed: (
			item: string,
			count: number,
			action: string,
			botName: string,
		) => {
			Logger.getInstance().debug("Item used", {
				item,
				count,
				action,
				botName,
				category: "inventory",
			});
		},

		inventoryFull: (botName: string) => {
			Logger.getInstance().warn("Inventory is full", {
				botName,
				category: "inventory",
			});
		},

		// チャット関連
		messageSent: (message: string, botName: string) => {
			Logger.getInstance().debug("Message sent", {
				message,
				botName,
				category: "chat",
			});
		},

		messageReceived: (username: string, message: string, botName: string) => {
			Logger.getInstance().debug("Message received", {
				username,
				message,
				botName,
				category: "chat",
			});
		},
	};

	/**
	 * パフォーマンス測定
	 */
	public static performance = {
		startTimer: (operation: string): (() => void) => {
			const start = Date.now();
			return () => {
				const duration = Date.now() - start;
				Logger.getInstance().debug("Performance measurement", {
					operation,
					duration,
					category: "performance",
				});
			};
		},

		measureAsync: async <T>(
			operation: string,
			fn: () => Promise<T>,
		): Promise<T> => {
			const endTimer = Logger.performance.startTimer(operation);
			try {
				const result = await fn();
				endTimer();
				return result;
			} catch (error) {
				endTimer();
				Logger.getInstance().error("Performance measurement failed", {
					operation,
					error: error instanceof Error ? error.message : String(error),
					category: "performance",
				});
				throw error;
			}
		},
	};

	/**
	 * 構造化ログ用のヘルパー
	 */
	public static structured = {
		debug: (message: string, meta: object = {}) => {
			Logger.getInstance().debug(message, meta);
		},

		info: (message: string, meta: object = {}) => {
			Logger.getInstance().info(message, meta);
		},

		warn: (message: string, meta: object = {}) => {
			Logger.getInstance().warn(message, meta);
		},

		error: (message: string, error?: Error, meta: object = {}) => {
			const logMeta = {
				...meta,
				...(error && {
					error: error.message,
					stack: error.stack,
				}),
			};
			Logger.getInstance().error(message, logMeta);
		},
	};

	/**
	 * ログレベルを動的に変更
	 */
	public static setLevel(level: string): void {
		if (Logger.initialized) {
			Logger.instance.level = level;
			Logger.instance.transports.forEach((transport) => {
				transport.level = level;
			});
			Logger.structured.info("Log level changed", { level });
		}
	}

	/**
	 * ログ統計を取得
	 */
	public static getStats(): {
		level: string;
		transports: number;
		recentErrors: number;
	} {
		// 簡単な統計（実際の実装では詳細な統計を収集可能）
		return {
			level: Logger.instance?.level || "unknown",
			transports: Logger.instance?.transports?.length || 0,
			recentErrors: 0, // TODO: エラー数の追跡実装
		};
	}
}
