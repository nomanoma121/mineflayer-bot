/**
 * BotScript実行コンテキスト
 * 変数の管理とスコープ制御を行う
 */

/**
 * BotScriptの値の型
 */
export type BotScriptValue = number | string | boolean;

/**
 * 変数のスコープ
 */
export enum VariableScope {
	GLOBAL = "GLOBAL",
	LOCAL = "LOCAL",
}

/**
 * 変数情報
 */
export interface VariableInfo {
	name: string;
	value: BotScriptValue;
	scope: VariableScope;
	readonly: boolean;
	line: number;
	column: number;
}

/**
 * 実行統計
 */
export interface ExecutionStats {
	statementsExecuted: number;
	variablesCreated: number;
	commandsExecuted: number;
	startTime: number;
	endTime?: number;
	errors: string[];
}

/**
 * BotScript実行コンテキスト
 * 変数管理、スコープ制御、実行統計を提供
 */
export class ExecutionContext {
	private globalVariables: Map<string, VariableInfo> = new Map();
	private localScopes: Map<string, VariableInfo>[] = [];
	private stats: ExecutionStats;

	constructor() {
		this.stats = {
			statementsExecuted: 0,
			variablesCreated: 0,
			commandsExecuted: 0,
			startTime: Date.now(),
			errors: [],
		};

		// デフォルトの組み込み変数を設定
		this.initializeBuiltinVariables();
	}

	// ===== 変数管理 =====

	/**
	 * 変数を定義
	 */
	defineVariable(
		name: string,
		value: BotScriptValue,
		scope: VariableScope = VariableScope.LOCAL,
		readonly: boolean = false,
		line: number = 0,
		column: number = 0,
	): void {
		const variableInfo: VariableInfo = {
			name,
			value,
			scope,
			readonly,
			line,
			column,
		};

		if (scope === VariableScope.GLOBAL) {
			this.globalVariables.set(name, variableInfo);
		} else {
			// ローカルスコープがない場合はグローバルスコープに設定
			if (this.localScopes.length === 0) {
				this.globalVariables.set(name, {
					...variableInfo,
					scope: VariableScope.GLOBAL,
				});
			} else {
				const currentScope = this.getCurrentScope();
				currentScope.set(name, variableInfo);
			}
		}

		this.stats.variablesCreated++;
	}

	/**
	 * 変数の値を取得
	 */
	getVariable(name: string): BotScriptValue {
		// ローカルスコープから検索
		for (let i = this.localScopes.length - 1; i >= 0; i--) {
			const scope = this.localScopes[i];
			if (scope.has(name)) {
				return scope.get(name)!.value;
			}
		}

		// グローバルスコープから検索
		if (this.globalVariables.has(name)) {
			return this.globalVariables.get(name)!.value;
		}

		throw new Error(`Undefined variable: ${name}`);
	}

	/**
	 * 変数の値を設定
	 */
	setVariable(name: string, value: BotScriptValue): void {
		// ローカルスコープから検索
		for (let i = this.localScopes.length - 1; i >= 0; i--) {
			const scope = this.localScopes[i];
			if (scope.has(name)) {
				const variableInfo = scope.get(name)!;
				if (variableInfo.readonly) {
					throw new Error(`Cannot modify readonly variable: ${name}`);
				}
				variableInfo.value = value;
				return;
			}
		}

		// グローバルスコープから検索
		if (this.globalVariables.has(name)) {
			const variableInfo = this.globalVariables.get(name)!;
			if (variableInfo.readonly) {
				throw new Error(`Cannot modify readonly variable: ${name}`);
			}
			variableInfo.value = value;
			return;
		}

		throw new Error(`Undefined variable: ${name}`);
	}

	/**
	 * 変数が存在するかチェック
	 */
	hasVariable(name: string): boolean {
		// ローカルスコープから検索
		for (let i = this.localScopes.length - 1; i >= 0; i--) {
			if (this.localScopes[i].has(name)) {
				return true;
			}
		}

		// グローバルスコープから検索
		return this.globalVariables.has(name);
	}

	/**
	 * 変数情報を取得
	 */
	getVariableInfo(name: string): VariableInfo | undefined {
		// ローカルスコープから検索
		for (let i = this.localScopes.length - 1; i >= 0; i--) {
			const scope = this.localScopes[i];
			if (scope.has(name)) {
				return scope.get(name);
			}
		}

		// グローバルスコープから検索
		return this.globalVariables.get(name);
	}

	/**
	 * 全変数のリストを取得
	 */
	getAllVariables(): VariableInfo[] {
		const variables: VariableInfo[] = [];

		// グローバル変数を追加
		for (const variable of this.globalVariables.values()) {
			variables.push(variable);
		}

		// ローカル変数を追加（スコープ順で上書き）
		const localVars = new Map<string, VariableInfo>();
		for (const scope of this.localScopes) {
			for (const [name, variable] of scope) {
				localVars.set(name, variable);
			}
		}

		for (const variable of localVars.values()) {
			// グローバル変数と重複しない場合のみ追加
			if (!this.globalVariables.has(variable.name)) {
				variables.push(variable);
			}
		}

		return variables;
	}

	// ===== スコープ管理 =====

	/**
	 * 新しいローカルスコープを開始
	 */
	enterScope(): void {
		this.localScopes.push(new Map());
	}

	/**
	 * 現在のローカルスコープを終了
	 */
	exitScope(): void {
		if (this.localScopes.length > 0) {
			this.localScopes.pop();
		}
	}

	/**
	 * 現在のスコープ深度を取得
	 */
	getScopeDepth(): number {
		return this.localScopes.length;
	}

	/**
	 * 現在のスコープを取得
	 */
	private getCurrentScope(): Map<string, VariableInfo> {
		if (this.localScopes.length === 0) {
			throw new Error("No local scope available");
		}
		return this.localScopes[this.localScopes.length - 1];
	}

	// ===== 実行統計 =====

	/**
	 * 文の実行をカウント
	 */
	incrementStatementCount(): void {
		this.stats.statementsExecuted++;
	}

	/**
	 * コマンドの実行をカウント
	 */
	incrementCommandCount(): void {
		this.stats.commandsExecuted++;
	}

	/**
	 * エラーを記録
	 */
	recordError(error: string): void {
		this.stats.errors.push(error);
	}

	/**
	 * 実行統計を取得
	 */
	getStats(): ExecutionStats {
		return {
			...this.stats,
			endTime: this.stats.endTime || Date.now(),
		};
	}

	/**
	 * 実行時間を計算
	 */
	getExecutionTime(): number {
		const endTime = this.stats.endTime || Date.now();
		return endTime - this.stats.startTime;
	}

	/**
	 * 実行完了をマーク
	 */
	markExecutionComplete(): void {
		this.stats.endTime = Date.now();
	}

	// ===== 組み込み変数 =====

	/**
	 * 組み込み変数を初期化
	 */
	private initializeBuiltinVariables(): void {
		// システム変数（読み取り専用）
		this.defineVariable("bot_name", "BotScript", VariableScope.GLOBAL, true);
		this.defineVariable("version", "1.0.0", VariableScope.GLOBAL, true);
		this.defineVariable("pi", Math.PI, VariableScope.GLOBAL, true);

		// 動的システム変数（読み取り専用、実行時に更新される）
		this.defineVariable("timestamp", Date.now(), VariableScope.GLOBAL, true);
	}

	/**
	 * システム変数を更新
	 */
	updateSystemVariables(botData?: {
		health?: number;
		food?: number;
		saturation?: number;
		oxygen?: number;
		experience_level?: number;
		experience_points?: number;
		position?: { x: number; y: number; z: number };
		x?: number;
		y?: number;
		z?: number;
		light_level?: number;
		is_night?: boolean;
		is_raining?: boolean;
		time_of_day?: number;
		inventory_count?: number;
		inventory_slots_total?: number;
		inventory_slots_empty?: number;
		equipped_item?: string;
		nearby_players?: number;
		nearby_mobs?: number;
		nearby_animals?: number;
		is_in_danger?: boolean;
		needs_food?: boolean;
		health_low?: boolean;
		hunger_low?: boolean;
		inventory_full?: boolean;
	}): void {
		// タイムスタンプを更新
		this.globalVariables.get("timestamp")!.value = Date.now();

		// ボットデータがある場合は関連変数を更新
		if (botData) {
			if (botData.health !== undefined) {
				if (this.hasVariable("bot_health")) {
					this.globalVariables.get("bot_health")!.value = botData.health;
				} else {
					this.defineVariable(
						"bot_health",
						botData.health,
						VariableScope.GLOBAL,
						true,
					);
				}
			}

			if (botData.food !== undefined) {
				if (this.hasVariable("bot_food")) {
					this.globalVariables.get("bot_food")!.value = botData.food;
				} else {
					this.defineVariable(
						"bot_food",
						botData.food,
						VariableScope.GLOBAL,
						true,
					);
				}
			}

			if (botData.position) {
				if (this.hasVariable("bot_x")) {
					this.globalVariables.get("bot_x")!.value = botData.position.x;
					this.globalVariables.get("bot_y")!.value = botData.position.y;
					this.globalVariables.get("bot_z")!.value = botData.position.z;
				} else {
					this.defineVariable(
						"bot_x",
						botData.position.x,
						VariableScope.GLOBAL,
						true,
					);
					this.defineVariable(
						"bot_y",
						botData.position.y,
						VariableScope.GLOBAL,
						true,
					);
					this.defineVariable(
						"bot_z",
						botData.position.z,
						VariableScope.GLOBAL,
						true,
					);
				}
			}

			if (botData.inventory_count !== undefined) {
				if (this.hasVariable("bot_inventory_count")) {
					this.globalVariables.get("bot_inventory_count")!.value =
						botData.inventory_count;
				} else {
					this.defineVariable(
						"bot_inventory_count",
						botData.inventory_count,
						VariableScope.GLOBAL,
						true,
					);
				}
			}
		}
	}

	// ===== デバッグ・ユーティリティ =====

	/**
	 * コンテキストの状態をダンプ
	 */
	dump(): string {
		const output: string[] = [];

		output.push("=== Execution Context ===");
		output.push(`Scope Depth: ${this.getScopeDepth()}`);
		output.push(
			`Variables: ${this.globalVariables.size + this.localScopes.reduce((total, scope) => total + scope.size, 0)}`,
		);
		output.push("");

		output.push("Global Variables:");
		for (const [name, info] of this.globalVariables) {
			output.push(
				`  ${name} = ${info.value} (${typeof info.value}${info.readonly ? ", readonly" : ""})`,
			);
		}

		if (this.localScopes.length > 0) {
			output.push("");
			this.localScopes.forEach((scope, index) => {
				output.push(`Local Scope ${index}:`);
				for (const [name, info] of scope) {
					output.push(
						`  ${name} = ${info.value} (${typeof info.value}${info.readonly ? ", readonly" : ""})`,
					);
				}
			});
		}

		output.push("");
		output.push("Execution Stats:");
		output.push(`  Statements: ${this.stats.statementsExecuted}`);
		output.push(`  Commands: ${this.stats.commandsExecuted}`);
		output.push(`  Variables Created: ${this.stats.variablesCreated}`);
		output.push(`  Execution Time: ${this.getExecutionTime()}ms`);
		output.push(`  Errors: ${this.stats.errors.length}`);

		return output.join("\n");
	}

	/**
	 * コンテキストをリセット
	 */
	reset(): void {
		this.globalVariables.clear();
		this.localScopes = [];
		this.stats = {
			statementsExecuted: 0,
			variablesCreated: 0,
			commandsExecuted: 0,
			startTime: Date.now(),
			errors: [],
		};

		this.initializeBuiltinVariables();
	}
}
