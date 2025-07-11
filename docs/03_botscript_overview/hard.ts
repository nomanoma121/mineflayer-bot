/**
 * 🔴 03_botscript_overview 上級問題: 最高度BotScript機能実装
 * 
 * 完全なBotScript言語実装の最高峰機能を実装してください。
 * この問題では、高度な制御構造、メタプログラミング、最適化機能を学びます。
 */

// ===== 高度な制御構造 =====

export class WhileStatement {
  type = 'WhileStatement';
  
  constructor(
    public condition: BotScriptExpression,
    public body: BotScriptStatement[],
    public content: string
  ) {}

  /**
   * WHILE文の妥当性をチェックします
   */
  isValid(): boolean {
    // TODO: WHILE文の妥当性チェック
    // ヒント1: 条件式が有効
    // ヒント2: 無限ループの検出
    // ヒント3: ボディが有効
    
    if (!this.condition.isValid()) {
      return false;
    }
    
    if (this.body.length === 0) {
      return false;
    }
    
    // 無限ループの簡易検出
    if (this.isInfiniteLoop()) {
      return false;
    }
    
    return this.body.every(stmt => stmt.isValid());
  }

  /**
   * 無限ループかチェックします
   */
  private isInfiniteLoop(): boolean {
    // TODO: 無限ループの検出
    // ヒント: 条件式が常にtrueの場合を検出
    return false; // 仮実装
  }

  /**
   * BotScriptコードを生成します
   */
  toBotScript(): string {
    // TODO: WHILE文の生成
    let code = `WHILE ${this.condition.toBotScript()}\n`;
    for (const stmt of this.body) {
      code += `  ${stmt.toBotScript()}\n`;
    }
    code += `ENDWHILE`;
    return code;
  }
}

export class SwitchStatement {
  type = 'SwitchStatement';
  
  constructor(
    public expression: BotScriptExpression,
    public cases: CaseClause[],
    public defaultCase: BotScriptStatement[] | null,
    public content: string
  ) {}

  /**
   * SWITCH文の妥当性をチェックします
   */
  isValid(): boolean {
    // TODO: SWITCH文の妥当性チェック
    // ヒント1: 式が有効
    // ヒント2: ケースが重複していない
    // ヒント3: 全てのケースが有効
    
    if (!this.expression.isValid()) {
      return false;
    }
    
    // ケースの重複チェック
    const values = new Set();
    for (const case_ of this.cases) {
      if (values.has(case_.value)) {
        return false; // 重複したケース
      }
      values.add(case_.value);
      
      if (!case_.isValid()) {
        return false;
      }
    }
    
    // デフォルトケースのチェック
    if (this.defaultCase && !this.defaultCase.every(stmt => stmt.isValid())) {
      return false;
    }
    
    return true;
  }

  /**
   * BotScriptコードを生成します
   */
  toBotScript(): string {
    // TODO: SWITCH文の生成
    let code = `SWITCH ${this.expression.toBotScript()}\n`;
    
    for (const case_ of this.cases) {
      code += case_.toBotScript() + '\n';
    }
    
    if (this.defaultCase) {
      code += `  DEFAULT\n`;
      for (const stmt of this.defaultCase) {
        code += `    ${stmt.toBotScript()}\n`;
      }
    }
    
    code += `ENDSWITCH`;
    return code;
  }
}

export class CaseClause {
  constructor(
    public value: string,
    public statements: BotScriptStatement[]
  ) {}

  isValid(): boolean {
    return this.statements.every(stmt => stmt.isValid());
  }

  toBotScript(): string {
    let code = `  CASE ${this.value}\n`;
    for (const stmt of this.statements) {
      code += `    ${stmt.toBotScript()}\n`;
    }
    return code;
  }
}

// ===== 式システム =====

export interface BotScriptExpression {
  type: string;
  isValid(): boolean;
  toBotScript(): string;
  evaluate(context: ExpressionContext): any;
}

export class BinaryExpression implements BotScriptExpression {
  type = 'BinaryExpression';
  
  constructor(
    public left: BotScriptExpression,
    public operator: string,
    public right: BotScriptExpression
  ) {}

  /**
   * 二項式の妥当性をチェックします
   */
  isValid(): boolean {
    // TODO: 二項式の妥当性チェック
    // ヒント1: 左右の式が有効
    // ヒント2: 演算子が有効
    // ヒント3: 型の互換性
    
    if (!this.left.isValid() || !this.right.isValid()) {
      return false;
    }
    
    const validOperators = ['+', '-', '*', '/', '==', '!=', '<', '>', '<=', '>=', '&&', '||'];
    return validOperators.includes(this.operator);
  }

  /**
   * BotScriptコードを生成します
   */
  toBotScript(): string {
    return `(${this.left.toBotScript()} ${this.operator} ${this.right.toBotScript()})`;
  }

  /**
   * 式を評価します
   */
  evaluate(context: ExpressionContext): any {
    // TODO: 二項式の評価
    const leftValue = this.left.evaluate(context);
    const rightValue = this.right.evaluate(context);
    
    switch (this.operator) {
      case '+': return leftValue + rightValue;
      case '-': return leftValue - rightValue;
      case '*': return leftValue * rightValue;
      case '/': return leftValue / rightValue;
      case '==': return leftValue === rightValue;
      case '!=': return leftValue !== rightValue;
      case '<': return leftValue < rightValue;
      case '>': return leftValue > rightValue;
      case '<=': return leftValue <= rightValue;
      case '>=': return leftValue >= rightValue;
      case '&&': return leftValue && rightValue;
      case '||': return leftValue || rightValue;
      default: throw new Error(`Unknown operator: ${this.operator}`);
    }
  }
}

export class VariableExpression implements BotScriptExpression {
  type = 'VariableExpression';
  
  constructor(public name: string) {}

  isValid(): boolean {
    return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(this.name);
  }

  toBotScript(): string {
    return this.name;
  }

  evaluate(context: ExpressionContext): any {
    return context.getVariable(this.name);
  }
}

export class LiteralExpression implements BotScriptExpression {
  type = 'LiteralExpression';
  
  constructor(public value: any) {}

  isValid(): boolean {
    return true;
  }

  toBotScript(): string {
    if (typeof this.value === 'string') {
      return `"${this.value}"`;
    }
    return String(this.value);
  }

  evaluate(context: ExpressionContext): any {
    return this.value;
  }
}

// ===== 式評価コンテキスト =====

export class ExpressionContext {
  private variables: Map<string, any> = new Map();
  private functions: Map<string, Function> = new Map();

  /**
   * 変数を設定します
   */
  setVariable(name: string, value: any): void {
    this.variables.set(name, value);
  }

  /**
   * 変数を取得します
   */
  getVariable(name: string): any {
    if (!this.variables.has(name)) {
      throw new Error(`Undefined variable: ${name}`);
    }
    return this.variables.get(name);
  }

  /**
   * 関数を登録します
   */
  registerFunction(name: string, func: Function): void {
    this.functions.set(name, func);
  }

  /**
   * 関数を呼び出します
   */
  callFunction(name: string, args: any[]): any {
    if (!this.functions.has(name)) {
      throw new Error(`Undefined function: ${name}`);
    }
    const func = this.functions.get(name)!;
    return func(...args);
  }
}

// ===== メタプログラミング機能 =====

export class MacroDefinition {
  type = 'MacroDefinition';
  
  constructor(
    public name: string,
    public parameters: string[],
    public body: string,
    public content: string
  ) {}

  /**
   * マクロ定義の妥当性をチェックします
   */
  isValid(): boolean {
    // TODO: マクロ定義の妥当性チェック
    // ヒント1: マクロ名が有効
    // ヒント2: パラメータが有効
    // ヒント3: 本体が有効
    
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(this.name)) {
      return false;
    }
    
    // パラメータの重複チェック
    const paramSet = new Set(this.parameters);
    if (paramSet.size !== this.parameters.length) {
      return false;
    }
    
    return this.body.trim().length > 0;
  }

  /**
   * マクロを展開します
   */
  expand(args: string[]): string {
    // TODO: マクロの展開
    // ヒント: パラメータを引数で置換
    
    if (args.length !== this.parameters.length) {
      throw new Error(`Macro ${this.name} expects ${this.parameters.length} arguments, got ${args.length}`);
    }
    
    let expanded = this.body;
    for (let i = 0; i < this.parameters.length; i++) {
      const param = this.parameters[i];
      const arg = args[i];
      expanded = expanded.replace(new RegExp(`\\$${param}\\b`, 'g'), arg);
    }
    
    return expanded;
  }

  toBotScript(): string {
    const params = this.parameters.join(', ');
    return `MACRO ${this.name}(${params})\n${this.body}\nENDMACRO`;
  }
}

export class CodeGenerator {
  private macros: Map<string, MacroDefinition> = new Map();

  /**
   * マクロを登録します
   */
  registerMacro(macro: MacroDefinition): void {
    if (!macro.isValid()) {
      throw new Error(`Invalid macro: ${macro.name}`);
    }
    this.macros.set(macro.name, macro);
  }

  /**
   * コードを前処理します（マクロ展開）
   */
  preprocess(code: string): string {
    // TODO: マクロ展開を含む前処理
    // ヒント1: マクロ呼び出しを検出
    // ヒント2: 引数を解析
    // ヒント3: マクロ本体を展開
    
    let processed = code;
    
    // マクロ呼び出しの検出と展開
    const macroCallRegex = /(\w+)\s*\(([^)]*)\)/g;
    processed = processed.replace(macroCallRegex, (match, name, argsStr) => {
      if (this.macros.has(name)) {
        const macro = this.macros.get(name)!;
        const args = argsStr ? argsStr.split(',').map(arg => arg.trim()) : [];
        return macro.expand(args);
      }
      return match;
    });
    
    return processed;
  }
}

// ===== 最適化エンジン =====

export class OptimizationEngine {
  /**
   * プログラムを最適化します
   */
  optimize(program: BotScriptProgram): BotScriptProgram {
    // TODO: プログラムの最適化
    // ヒント1: 定数畳み込み
    // ヒント2: デッドコード除去
    // ヒント3: 共通部分式の除去
    
    const optimized = new BotScriptProgram();
    
    for (const stmt of program.getStatements()) {
      const optimizedStmt = this.optimizeStatement(stmt);
      if (optimizedStmt) {
        optimized.addStatement(optimizedStmt);
      }
    }
    
    return optimized;
  }

  /**
   * 文を最適化します
   */
  private optimizeStatement(stmt: BotScriptStatement): BotScriptStatement | null {
    // TODO: 文の最適化
    // ヒント1: 到達不可能コードの除去
    // ヒント2: 冗長な処理の除去
    // ヒント3: ループの最適化
    
    // デッドコード除去の例
    if (stmt instanceof BotCommand && stmt.command === 'NOP') {
      return null; // NOP命令は除去
    }
    
    return stmt;
  }

  /**
   * 式を最適化します
   */
  optimizeExpression(expr: BotScriptExpression): BotScriptExpression {
    // TODO: 式の最適化
    // ヒント: 定数畳み込み
    
    if (expr instanceof BinaryExpression) {
      const left = this.optimizeExpression(expr.left);
      const right = this.optimizeExpression(expr.right);
      
      // 定数畳み込み
      if (left instanceof LiteralExpression && right instanceof LiteralExpression) {
        try {
          const context = new ExpressionContext();
          const result = new BinaryExpression(left, expr.operator, right).evaluate(context);
          return new LiteralExpression(result);
        } catch {
          // 評価に失敗した場合は元の式を返す
        }
      }
      
      return new BinaryExpression(left, expr.operator, right);
    }
    
    return expr;
  }
}

// ===== 高度なデバッグ機能 =====

export class DebugInfo {
  constructor(
    public line: number,
    public column: number,
    public sourceFile: string,
    public stackTrace: string[]
  ) {}
}

export class Breakpoint {
  constructor(
    public line: number,
    public condition?: BotScriptExpression
  ) {}

  /**
   * ブレークポイントが有効かチェックします
   */
  shouldBreak(context: ExpressionContext): boolean {
    if (!this.condition) {
      return true;
    }
    
    try {
      return Boolean(this.condition.evaluate(context));
    } catch {
      return false;
    }
  }
}

export class AdvancedDebugger {
  private breakpoints: Map<number, Breakpoint> = new Map();
  private callStack: DebugInfo[] = [];

  /**
   * ブレークポイントを設定します
   */
  setBreakpoint(line: number, condition?: BotScriptExpression): void {
    this.breakpoints.set(line, new Breakpoint(line, condition));
  }

  /**
   * ブレークポイントを削除します
   */
  removeBreakpoint(line: number): void {
    this.breakpoints.delete(line);
  }

  /**
   * 実行をステップ実行します
   */
  step(stmt: BotScriptStatement, context: ExpressionContext): boolean {
    // TODO: ステップ実行の実装
    // ヒント1: ブレークポイントのチェック
    // ヒント2: コールスタックの管理
    // ヒント3: デバッグ情報の収集
    
    const debugInfo = this.extractDebugInfo(stmt);
    this.callStack.push(debugInfo);
    
    // ブレークポイントのチェック
    const breakpoint = this.breakpoints.get(debugInfo.line);
    if (breakpoint && breakpoint.shouldBreak(context)) {
      return true; // ブレーク
    }
    
    return false; // 継続
  }

  /**
   * デバッグ情報を抽出します
   */
  private extractDebugInfo(stmt: BotScriptStatement): DebugInfo {
    // TODO: 文からデバッグ情報を抽出
    return new DebugInfo(
      1, // 仮の行番号
      1, // 仮の列番号
      'unknown',
      this.getStackTrace()
    );
  }

  /**
   * スタックトレースを取得します
   */
  private getStackTrace(): string[] {
    return this.callStack.map(info => `${info.sourceFile}:${info.line}:${info.column}`);
  }
}

// ===== 最高度BotScriptプログラム =====

export class MasterBotScriptProgram extends AdvancedBotScriptProgram {
  private macros: Map<string, MacroDefinition> = new Map();
  private debugger: AdvancedDebugger = new AdvancedDebugger();
  private optimizer: OptimizationEngine = new OptimizationEngine();

  /**
   * マクロを追加します
   */
  addMacro(macro: MacroDefinition): void {
    if (!macro.isValid()) {
      throw new Error(`Invalid macro: ${macro.name}`);
    }
    this.macros.set(macro.name, macro);
  }

  /**
   * プログラムを最適化します
   */
  optimize(): MasterBotScriptProgram {
    const optimized = new MasterBotScriptProgram();
    const baseOptimized = this.optimizer.optimize(this);
    
    for (const stmt of baseOptimized.getStatements()) {
      optimized.addStatement(stmt);
    }
    
    // マクロもコピー
    for (const [name, macro] of this.macros) {
      optimized.addMacro(macro);
    }
    
    return optimized;
  }

  /**
   * デバッグモードで実行します
   */
  executeWithDebug(context: ExpressionContext): void {
    // TODO: デバッグ実行の実装
    for (const stmt of this.getStatements()) {
      if (this.debugger.step(stmt, context)) {
        console.log(`Breakpoint hit at: ${stmt.toBotScript()}`);
        // デバッガーの処理
      }
    }
  }

  /**
   * 高度な静的解析を実行します
   */
  performStaticAnalysis(): AnalysisResult {
    // TODO: 静的解析の実装
    // ヒント1: 型チェック
    // ヒント2: 到達可能性解析
    // ヒント3: パフォーマンス解析
    
    const issues: AnalysisIssue[] = [];
    const metrics = this.calculateMetrics();
    
    // 基本的な問題の検出
    for (const stmt of this.getStatements()) {
      if (!stmt.isValid()) {
        issues.push(new AnalysisIssue('error', `Invalid statement: ${stmt.toBotScript()}`, 1));
      }
    }
    
    return new AnalysisResult(issues, metrics);
  }

  /**
   * メトリクスを計算します
   */
  private calculateMetrics(): ProgramMetrics {
    return new ProgramMetrics(
      this.getStatements().length,
      this.macros.size,
      this.calculateComplexity(),
      this.calculateMaxNesting()
    );
  }
}

// ===== 静的解析 =====

export class AnalysisIssue {
  constructor(
    public severity: 'error' | 'warning' | 'info',
    public message: string,
    public line: number
  ) {}
}

export class ProgramMetrics {
  constructor(
    public statements: number,
    public macros: number,
    public complexity: number,
    public maxNesting: number
  ) {}
}

export class AnalysisResult {
  constructor(
    public issues: AnalysisIssue[],
    public metrics: ProgramMetrics
  ) {}

  hasErrors(): boolean {
    return this.issues.some(issue => issue.severity === 'error');
  }

  getErrorCount(): number {
    return this.issues.filter(issue => issue.severity === 'error').length;
  }

  getWarningCount(): number {
    return this.issues.filter(issue => issue.severity === 'warning').length;
  }
}

// ===== デモクラス =====

export class MasterBotScriptDemo {
  /**
   * 最高度BotScript機能のデモを実行します
   */
  public static runDemo(): void {
    console.log('=== Master BotScript Demo ===');

    // 最高度プログラムの作成
    const program = new MasterBotScriptProgram();

    // マクロの定義
    const attackMacro = new MacroDefinition(
      'ATTACK_SEQUENCE',
      ['target', 'count'],
      `REPEAT $count
        ATTACK $target
        WAIT 1
      ENDREPEAT`,
      'MACRO ATTACK_SEQUENCE(target, count)'
    );
    
    program.addMacro(attackMacro);

    // 高度な制御構造の追加
    const whileStmt = new WhileStatement(
      new BinaryExpression(
        new VariableExpression('health'),
        '>',
        new LiteralExpression(50)
      ),
      [
        new BotCommand('MOVE', ['forward'], 'MOVE forward'),
        new BotCommand('ATTACK', ['nearest_mob'], 'ATTACK nearest_mob')
      ],
      'WHILE health > 50'
    );
    
    program.addStatement(whileStmt);

    // SWITCH文の追加
    const switchStmt = new SwitchStatement(
      new VariableExpression('gamemode'),
      [
        new CaseClause('creative', [
          new BotCommand('FLY', ['true'], 'FLY true')
        ]),
        new CaseClause('survival', [
          new BotCommand('GATHER', ['food'], 'GATHER food')
        ])
      ],
      [new BotCommand('SAY', ['"Unknown gamemode"'], 'SAY "Unknown gamemode"')],
      'SWITCH gamemode'
    );
    
    program.addStatement(switchStmt);

    // 静的解析の実行
    console.log('\n--- Static Analysis ---');
    const analysis = program.performStaticAnalysis();
    console.log('Analysis complete:');
    console.log(`- Errors: ${analysis.getErrorCount()}`);
    console.log(`- Warnings: ${analysis.getWarningCount()}`);
    console.log(`- Statements: ${analysis.metrics.statements}`);
    console.log(`- Complexity: ${analysis.metrics.complexity}`);

    // 最適化の実行
    console.log('\n--- Optimization ---');
    const optimized = program.optimize();
    console.log('Program optimized');

    // BotScriptコードの生成
    console.log('\n--- Generated Master BotScript ---');
    console.log(program.toBotScript());

    // 式評価のテスト
    console.log('\n--- Expression Evaluation Test ---');
    const context = new ExpressionContext();
    context.setVariable('health', 75);
    context.setVariable('gamemode', 'survival');
    
    const expr = new BinaryExpression(
      new VariableExpression('health'),
      '>',
      new LiteralExpression(50)
    );
    
    console.log(`Expression: ${expr.toBotScript()}`);
    console.log(`Result: ${expr.evaluate(context)}`);

    console.log('\nMaster demo completed');
  }
}

// 必要なインポート
import { 
  BotScriptStatement, 
  BotCommand, 
  BotScriptProgram 
} from './easy';
import { AdvancedBotScriptProgram } from './normal';