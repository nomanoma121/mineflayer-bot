import fs from "fs";
import path from "path";
import type { Bot } from "../core/Bot";
import { Logger } from "../utils/Logger";
import type { IPlugin, PluginMetadata } from "./IPlugin";

/**
 * プラグイン管理システム
 * プラグインの読み込み、初期化、ライフサイクル管理を行う
 */
export class PluginManager {
	private plugins: Map<string, IPlugin> = new Map();
	private enabledPlugins: Set<string> = new Set();
	private bot: Bot | null = null;
	private pluginsDirectory: string;

	constructor(pluginsDirectory?: string) {
		this.pluginsDirectory =
			pluginsDirectory || path.join(process.cwd(), "plugins");
	}

	/**
	 * ボットインスタンスを設定
	 */
	public setBotInstance(bot: Bot): void {
		this.bot = bot;
	}

	/**
	 * プラグインを登録
	 */
	public registerPlugin(plugin: IPlugin): void {
		const metadata = plugin.getMetadata();

		if (this.plugins.has(metadata.name)) {
			Logger.structured.warn(
				`Plugin ${metadata.name} is already registered, overwriting`,
			);
		}

		this.plugins.set(metadata.name, plugin);
		Logger.structured.info(
			`Plugin registered: ${metadata.name} v${metadata.version}`,
		);
	}

	/**
	 * プラグインディレクトリから自動読み込み
	 */
	public async loadPluginsFromDirectory(): Promise<void> {
		if (!fs.existsSync(this.pluginsDirectory)) {
			Logger.structured.info(
				`Plugins directory does not exist: ${this.pluginsDirectory}`,
			);
			return;
		}

		const pluginFiles = fs
			.readdirSync(this.pluginsDirectory)
			.filter((file) => file.endsWith(".js") || file.endsWith(".ts"))
			.filter((file) => !file.endsWith(".d.ts"));

		for (const file of pluginFiles) {
			try {
				const pluginPath = path.join(this.pluginsDirectory, file);
				const PluginClass = require(pluginPath).default || require(pluginPath);

				if (typeof PluginClass === "function") {
					const plugin: IPlugin = new PluginClass();
					this.registerPlugin(plugin);
				} else {
					Logger.structured.warn(`Invalid plugin format in ${file}`);
				}
			} catch (error) {
				Logger.structured.error(
					`Failed to load plugin from ${file}`,
					error as Error,
				);
			}
		}
	}

	/**
	 * プラグインを初期化
	 */
	public async initializePlugin(pluginName: string): Promise<void> {
		const plugin = this.plugins.get(pluginName);
		if (!plugin) {
			throw new Error(`Plugin ${pluginName} not found`);
		}

		if (!this.bot) {
			throw new Error("Bot instance not set");
		}

		try {
			// 依存関係チェック
			const metadata = plugin.getMetadata();
			if (metadata.dependencies) {
				for (const dep of metadata.dependencies) {
					if (!this.plugins.has(dep) || !this.enabledPlugins.has(dep)) {
						throw new Error(
							`Dependency ${dep} not available for plugin ${pluginName}`,
						);
					}
				}
			}

			await plugin.initialize(this.bot);
			Logger.structured.info(`Plugin initialized: ${pluginName}`);
		} catch (error) {
			Logger.structured.error(
				`Failed to initialize plugin ${pluginName}`,
				error as Error,
			);
			throw error;
		}
	}

	/**
	 * プラグインを有効化
	 */
	public async enablePlugin(pluginName: string): Promise<void> {
		const plugin = this.plugins.get(pluginName);
		if (!plugin) {
			throw new Error(`Plugin ${pluginName} not found`);
		}

		try {
			if (!plugin.isEnabled()) {
				await this.initializePlugin(pluginName);
				await plugin.enable();

				// イベントハンドラーの登録
				if (plugin.registerEventHandlers) {
					plugin.registerEventHandlers();
				}

				this.enabledPlugins.add(pluginName);
				Logger.structured.info(`Plugin enabled: ${pluginName}`);
			}
		} catch (error) {
			Logger.structured.error(
				`Failed to enable plugin ${pluginName}`,
				error as Error,
			);
			throw error;
		}
	}

	/**
	 * プラグインを無効化
	 */
	public async disablePlugin(pluginName: string): Promise<void> {
		const plugin = this.plugins.get(pluginName);
		if (!plugin) {
			throw new Error(`Plugin ${pluginName} not found`);
		}

		try {
			if (plugin.isEnabled()) {
				await plugin.disable();

				// クリーンアップ処理
				if (plugin.cleanup) {
					await plugin.cleanup();
				}

				this.enabledPlugins.delete(pluginName);
				Logger.structured.info(`Plugin disabled: ${pluginName}`);
			}
		} catch (error) {
			Logger.structured.error(
				`Failed to disable plugin ${pluginName}`,
				error as Error,
			);
			throw error;
		}
	}

	/**
	 * 全プラグインを有効化
	 */
	public async enableAllPlugins(): Promise<void> {
		// 依存関係順にソート
		const sortedPlugins = this.sortPluginsByDependencies();

		for (const pluginName of sortedPlugins) {
			try {
				await this.enablePlugin(pluginName);
			} catch (error) {
				Logger.structured.error(
					`Failed to enable plugin ${pluginName}, skipping`,
					error as Error,
				);
			}
		}
	}

	/**
	 * 全プラグインを無効化
	 */
	public async disableAllPlugins(): Promise<void> {
		const enabledPlugins = Array.from(this.enabledPlugins);

		// 有効化と逆順で無効化
		for (const pluginName of enabledPlugins.reverse()) {
			try {
				await this.disablePlugin(pluginName);
			} catch (error) {
				Logger.structured.error(
					`Failed to disable plugin ${pluginName}`,
					error as Error,
				);
			}
		}
	}

	/**
	 * プラグインを取得
	 */
	public getPlugin<T extends IPlugin>(pluginName: string): T | undefined {
		return this.plugins.get(pluginName) as T;
	}

	/**
	 * 登録されているプラグインの一覧を取得
	 */
	public getRegisteredPlugins(): PluginMetadata[] {
		return Array.from(this.plugins.values()).map((plugin) =>
			plugin.getMetadata(),
		);
	}

	/**
	 * 有効なプラグインの一覧を取得
	 */
	public getEnabledPlugins(): PluginMetadata[] {
		return Array.from(this.enabledPlugins)
			.map((name) => this.plugins.get(name))
			.filter((plugin) => plugin !== undefined)
			.map((plugin) => plugin!.getMetadata());
	}

	/**
	 * プラグインが有効かどうか確認
	 */
	public isPluginEnabled(pluginName: string): boolean {
		return this.enabledPlugins.has(pluginName);
	}

	/**
	 * プラグインの設定を取得
	 */
	public getPluginConfig(pluginName: string): any {
		const plugin = this.plugins.get(pluginName);
		if (!plugin || !plugin.getConfig) {
			return null;
		}
		return plugin.getConfig();
	}

	/**
	 * プラグインの設定を更新
	 */
	public updatePluginConfig(pluginName: string, config: any): void {
		const plugin = this.plugins.get(pluginName);
		if (!plugin || !plugin.updateConfig) {
			throw new Error(
				`Plugin ${pluginName} does not support configuration updates`,
			);
		}
		plugin.updateConfig(config);
		Logger.structured.info(`Plugin configuration updated: ${pluginName}`);
	}

	/**
	 * 依存関係に基づいてプラグインをソート
	 */
	private sortPluginsByDependencies(): string[] {
		const plugins = Array.from(this.plugins.keys());
		const sorted: string[] = [];
		const visited = new Set<string>();
		const visiting = new Set<string>();

		const visit = (pluginName: string) => {
			if (visiting.has(pluginName)) {
				throw new Error(`Circular dependency detected: ${pluginName}`);
			}

			if (visited.has(pluginName)) {
				return;
			}

			visiting.add(pluginName);

			const plugin = this.plugins.get(pluginName);
			const dependencies = plugin?.getMetadata().dependencies || [];

			for (const dep of dependencies) {
				if (this.plugins.has(dep)) {
					visit(dep);
				}
			}

			visiting.delete(pluginName);
			visited.add(pluginName);
			sorted.push(pluginName);
		};

		for (const pluginName of plugins) {
			if (!visited.has(pluginName)) {
				visit(pluginName);
			}
		}

		return sorted;
	}

	/**
	 * プラグインシステムの統計情報を取得
	 */
	public getStats(): {
		totalPlugins: number;
		enabledPlugins: number;
		disabledPlugins: number;
		pluginsWithErrors: number;
	} {
		let pluginsWithErrors = 0;

		for (const plugin of this.plugins.values()) {
			try {
				plugin.isEnabled();
			} catch {
				pluginsWithErrors++;
			}
		}

		return {
			totalPlugins: this.plugins.size,
			enabledPlugins: this.enabledPlugins.size,
			disabledPlugins: this.plugins.size - this.enabledPlugins.size,
			pluginsWithErrors,
		};
	}

	/**
	 * プラグインシステムのクリーンアップ
	 */
	public async cleanup(): Promise<void> {
		await this.disableAllPlugins();
		this.plugins.clear();
		this.enabledPlugins.clear();
		Logger.structured.info("Plugin system cleaned up");
	}
}
