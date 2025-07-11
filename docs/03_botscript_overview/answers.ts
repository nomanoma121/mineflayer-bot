/**
 * 03_botscript_overview 解答ファイル
 * 
 * すべての難易度レベルの完全な解答実装
 */

// ===== 初級解答 (easy.ts) =====

export class VariableDeclaration {
  type = 'VariableDeclaration';
  
  constructor(
    public name: string,
    public value: string,
    public content: string
  ) {}

  isValid(): boolean {
    // 変数名の妥当性チェック（英数字とアンダースコア）
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(this.name)) {
      return false;
    }
    
    // 値が空でないかチェック
    if (!this.value || this.value.trim() === '') {
      return false;
    }
    
    return true;
  }

  toBotScript(): string {
    return `DEF ${this.name} = ${this.value}`;
  }
}

export class BotCommand {
  type = 'BotCommand';
  
  constructor(
    public command: string,
    public args: string[],
    public content: string
  ) {}

  isValid(): boolean {
    // コマンド名が空でないかチェック
    if (!this.command || this.command.trim() === '') {
      return false;
    }
    
    // 有効なコマンドかチェック
    const validCommands = ['SAY', 'MOVE', 'GOTO', 'ATTACK', 'DIG', 'PLACE', 'WAIT'];
    if (!validCommands.includes(this.command.toUpperCase())) {
      return false;
    }
    
    return true;
  }

  toBotScript(): string {
    return `${this.command} ${this.args.join(' ')}`;
  }
}

export class IfStatement {
  type = 'IfStatement';
  
  constructor(
    public condition: string,
    public thenBody: BotScriptStatement[],
    public elseBody: BotScriptStatement[],
    public content: string
  ) {}

  isValid(): boolean {
    // 条件が空でないかチェック
    if (!this.condition || this.condition.trim() === '') {
      return false;
    }
    
    // then部分が空でないかチェック
    if (this.thenBody.length === 0) {
      return false;
    }
    
    // 全ての文が有効かチェック
    const allStatements = [...this.thenBody, ...this.elseBody];
    return allStatements.every(stmt => stmt.isValid());
  }

  toBotScript(): string {
    let code = `IF ${this.condition}\n`;
    
    for (const stmt of this.thenBody) {
      code += `  ${stmt.toBotScript()}\n`;
    }
    
    if (this.elseBody.length > 0) {
      code += `ELSE\n`;
      for (const stmt of this.elseBody) {
        code += `  ${stmt.toBotScript()}\n`;
      }
    }
    
    code += `ENDIF`;
    return code;
  }
}

export interface BotScriptStatement {
  type: string;
  content: string;
  isValid(): boolean;
  toBotScript(): string;
}

export class SimpleBotScriptParser {
  parse(code: string): BotScriptProgram {
    const program = new BotScriptProgram();
    const lines = code.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.length === 0 || line.startsWith('//')) {
        continue; // 空行とコメントをスキップ
      }
      
      const statement = this.parseLine(line, lines, i);
      if (statement.statement) {
        program.addStatement(statement.statement);
        i = statement.nextLine;
      }
    }
    
    return program;
  }

  private parseLine(line: string, lines: string[], startIndex: number): { statement: BotScriptStatement | null; nextLine: number } {
    const tokens = line.split(' ');
    const keyword = tokens[0].toUpperCase();
    
    switch (keyword) {
      case 'DEF':
        if (tokens.length >= 4 && tokens[2] === '=') {
          return {
            statement: new VariableDeclaration(tokens[1], tokens.slice(3).join(' '), line),
            nextLine: startIndex
          };
        }
        break;
        
      case 'SAY':
      case 'MOVE':
      case 'GOTO':
      case 'ATTACK':
      case 'DIG':
      case 'PLACE':
      case 'WAIT':
        return {
          statement: new BotCommand(keyword, tokens.slice(1), line),
          nextLine: startIndex
        };
        
      case 'IF':
        return this.parseIfStatement(lines, startIndex);
    }
    
    return { statement: null, nextLine: startIndex };
  }

  private parseIfStatement(lines: string[], startIndex: number): { statement: IfStatement; nextLine: number } {
    const line = lines[startIndex];
    const condition = line.substring(3).trim(); // "IF " を除去
    
    const thenBody: BotScriptStatement[] = [];
    const elseBody: BotScriptStatement[] = [];
    let currentBody = thenBody;
    let i = startIndex + 1;
    
    while (i < lines.length) {
      const currentLine = lines[i].trim();
      
      if (currentLine.toUpperCase() === 'ENDIF') {
        break;
      } else if (currentLine.toUpperCase() === 'ELSE') {
        currentBody = elseBody;
      } else if (currentLine.length > 0 && !currentLine.startsWith('//')) {
        const stmt = this.parseLine(currentLine, lines, i);
        if (stmt.statement) {
          currentBody.push(stmt.statement);
        }
      }
      
      i++;
    }
    
    return {
      statement: new IfStatement(condition, thenBody, elseBody, line),
      nextLine: i
    };
  }
}

export class BotScriptProgram {
  private statements: BotScriptStatement[] = [];

  addStatement(statement: BotScriptStatement): void {
    this.statements.push(statement);
  }

  getStatements(): BotScriptStatement[] {
    return [...this.statements];
  }

  isValid(): boolean {
    return this.statements.every(stmt => stmt.isValid());
  }

  getStatementCount(): number {
    return this.statements.length;
  }

  toBotScript(): string {
    return this.statements.map(stmt => stmt.toBotScript()).join('\n');
  }
}

// ===== 中級解答 (normal.ts) =====

export class RepeatStatement {
  type = 'RepeatStatement';
  
  constructor(
    public count: string,
    public body: BotScriptStatement[],
    public content: string
  ) {}

  isValid(): boolean {
    // カウントが正の数値または変数かチェック
    const isNumber = /^\d+$/.test(this.count);
    const isVariable = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(this.count);
    
    if (!isNumber && !isVariable) {
      return false;
    }
    
    // 数値の場合、正の値かチェック
    if (isNumber && parseInt(this.count) <= 0) {
      return false;
    }
    
    // ボディが空でないかチェック
    if (this.body.length === 0) {
      return false;
    }
    
    // 全ての内部文が有効かチェック
    return this.body.every(stmt => stmt.isValid());
  }

  toBotScript(): string {
    let code = `REPEAT ${this.count}\n`;
    for (const stmt of this.body) {
      code += `  ${stmt.toBotScript()}\n`;
    }
    code += `ENDREPEAT`;
    return code;
  }
}

export class FunctionDefinition {
  type = 'FunctionDefinition';
  
  constructor(
    public name: string,
    public parameters: string[],
    public body: BotScriptStatement[],
    public content: string
  ) {}

  isValid(): boolean {
    // 関数名が有効な識別子かチェック
    if (!this.isValidIdentifier(this.name)) {
      return false;
    }
    
    // パラメータの重複チェック
    const paramSet = new Set(this.parameters);
    if (paramSet.size !== this.parameters.length) {
      return false;
    }
    
    // 全てのパラメータが有効な識別子かチェック
    if (!this.parameters.every(param => this.isValidIdentifier(param))) {
      return false;
    }
    
    // 本体が空でないかチェック
    if (this.body.length === 0) {
      return false;
    }
    
    // 全ての文が有効かチェック
    return this.body.every(stmt => stmt.isValid());
  }

  private isValidIdentifier(name: string): boolean {
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
  }

  toBotScript(): string {
    const params = this.parameters.join(', ');
    let code = `FUNCTION ${this.name}(${params})\n`;
    
    for (const stmt of this.body) {
      code += `  ${stmt.toBotScript()}\n`;
    }
    
    code += `ENDFUNCTION`;
    return code;
  }
}

export class FunctionCall {
  type = 'FunctionCall';
  
  constructor(
    public name: string,
    public arguments: string[],
    public content: string
  ) {}

  isValid(): boolean {
    // 関数名が有効な識別子かチェック
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(this.name)) {
      return false;
    }
    
    return true;
  }

  toBotScript(): string {
    const args = this.arguments.join(', ');
    return `CALL ${this.name}(${args})`;
  }
}

export class TryStatement {
  type = 'TryStatement';
  
  constructor(
    public tryBody: BotScriptStatement[],
    public catchBody: BotScriptStatement[],
    public errorVariable: string,
    public content: string
  ) {}

  isValid(): boolean {
    // TRY部分が空でないかチェック
    if (this.tryBody.length === 0) {
      return false;
    }
    
    // エラー変数が有効かチェック（$で始まる）
    if (this.errorVariable && !this.errorVariable.startsWith('$')) {
      return false;
    }
    
    // 全ての内部文が有効かチェック
    const allStatements = [...this.tryBody, ...this.catchBody];
    return allStatements.every(stmt => stmt.isValid());
  }

  toBotScript(): string {
    let code = `TRY\n`;
    
    for (const stmt of this.tryBody) {
      code += `  ${stmt.toBotScript()}\n`;
    }
    
    if (this.catchBody.length > 0) {
      code += `CATCH ${this.errorVariable}\n`;
      for (const stmt of this.catchBody) {
        code += `  ${stmt.toBotScript()}\n`;
      }
    }
    
    code += `ENDTRY`;
    return code;
  }
}

export class AdvancedBotScriptParser {
  private tokens: string[] = [];
  private current: number = 0;

  parse(code: string): BotScriptProgram {
    const program = new BotScriptProgram();
    const lines = this.preprocessCode(code);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.length === 0) continue;
      
      const statement = this.parseComplexStatement(line, lines, i);
      if (statement) {
        program.addStatement(statement.statement);
        i = statement.nextLine;
      }
    }
    
    return program;
  }

  private preprocessCode(code: string): string[] {
    // コメントの除去と行の正規化
    return code.split('\n')
      .map(line => line.replace(/\/\/.*$/, '').trim())
      .filter(line => line.length > 0);
  }

  private parseComplexStatement(line: string, lines: string[], startIndex: number): { statement: BotScriptStatement; nextLine: number } | null {
    const tokens = line.split(' ');
    const keyword = tokens[0].toUpperCase();
    
    switch (keyword) {
      case 'REPEAT':
        return this.parseRepeatStatement(lines, startIndex);
      case 'FUNCTION':
        return this.parseFunctionDefinition(lines, startIndex);
      case 'CALL':
        return this.parseFunctionCall(line, startIndex);
      case 'TRY':
        return this.parseTryStatement(lines, startIndex);
      default:
        // 基本的な文として処理
        return { statement: this.parseBasicStatement(line), nextLine: startIndex };
    }
  }

  private parseRepeatStatement(lines: string[], startIndex: number): { statement: RepeatStatement; nextLine: number } {
    const line = lines[startIndex];
    const tokens = line.split(' ');
    const count = tokens[1];
    
    const body: BotScriptStatement[] = [];
    let i = startIndex + 1;
    
    // ENDREPEATまで読み取り
    while (i < lines.length && !lines[i].trim().toUpperCase().startsWith('ENDREPEAT')) {
      const stmt = this.parseBasicStatement(lines[i]);
      if (stmt) {
        body.push(stmt);
      }
      i++;
    }
    
    return {
      statement: new RepeatStatement(count, body, line),
      nextLine: i
    };
  }

  private parseFunctionDefinition(lines: string[], startIndex: number): { statement: FunctionDefinition; nextLine: number } {
    const line = lines[startIndex];
    const match = line.match(/FUNCTION\s+(\w+)\s*\(([^)]*)\)/i);
    
    if (!match) {
      throw new Error(`Invalid function definition: ${line}`);
    }
    
    const name = match[1];
    const parameters = match[2] ? match[2].split(',').map(p => p.trim()).filter(p => p) : [];
    
    const body: BotScriptStatement[] = [];
    let i = startIndex + 1;
    
    // ENDFUNCTIONまで読み取り
    while (i < lines.length && !lines[i].trim().toUpperCase().startsWith('ENDFUNCTION')) {
      const stmt = this.parseBasicStatement(lines[i]);
      if (stmt) {
        body.push(stmt);
      }
      i++;
    }
    
    return {
      statement: new FunctionDefinition(name, parameters, body, line),
      nextLine: i
    };
  }

  private parseFunctionCall(line: string, startIndex: number): { statement: FunctionCall; nextLine: number } {
    const match = line.match(/CALL\s+(\w+)\s*\(([^)]*)\)/i);
    
    if (!match) {
      throw new Error(`Invalid function call: ${line}`);
    }
    
    const name = match[1];
    const args = match[2] ? match[2].split(',').map(a => a.trim()).filter(a => a) : [];
    
    return {
      statement: new FunctionCall(name, args, line),
      nextLine: startIndex
    };
  }

  private parseTryStatement(lines: string[], startIndex: number): { statement: TryStatement; nextLine: number } {
    const tryBody: BotScriptStatement[] = [];
    const catchBody: BotScriptStatement[] = [];
    let errorVariable = '$error';
    
    let i = startIndex + 1;
    let inCatch = false;
    
    while (i < lines.length && !lines[i].trim().toUpperCase().startsWith('ENDTRY')) {
      const line = lines[i].trim();
      
      if (line.toUpperCase().startsWith('CATCH')) {
        inCatch = true;
        const match = line.match(/CATCH\s+(\$\w+)/i);
        if (match) {
          errorVariable = match[1];
        }
      } else {
        const stmt = this.parseBasicStatement(line);
        if (stmt) {
          if (inCatch) {
            catchBody.push(stmt);
          } else {
            tryBody.push(stmt);
          }
        }
      }
      i++;
    }
    
    return {
      statement: new TryStatement(tryBody, catchBody, errorVariable, lines[startIndex]),
      nextLine: i
    };
  }

  private parseBasicStatement(line: string): BotScriptStatement | null {
    const tokens = line.split(' ');
    const keyword = tokens[0].toUpperCase();
    
    switch (keyword) {
      case 'DEF':
        if (tokens.length >= 4 && tokens[2] === '=') {
          return new VariableDeclaration(tokens[1], tokens.slice(3).join(' '), line);
        }
        break;
      case 'SAY':
      case 'MOVE':
      case 'GOTO':
      case 'ATTACK':
      case 'DIG':
      case 'PLACE':
      case 'WAIT':
        return new BotCommand(keyword, tokens.slice(1), line);
    }
    
    return null;
  }
}

export class Scope {
  private variables: Map<string, any> = new Map();
  private parent: Scope | null = null;

  constructor(parent: Scope | null = null) {
    this.parent = parent;
  }

  define(name: string, value: any): void {
    this.variables.set(name, value);
  }

  get(name: string): any {
    if (this.variables.has(name)) {
      return this.variables.get(name);
    }
    
    if (this.parent) {
      return this.parent.get(name);
    }
    
    throw new Error(`Undefined variable: ${name}`);
  }

  has(name: string): boolean {
    return this.variables.has(name) || (this.parent ? this.parent.has(name) : false);
  }

  createChild(): Scope {
    return new Scope(this);
  }
}

export class AdvancedBotScriptProgram extends BotScriptProgram {
  private functions: Map<string, FunctionDefinition> = new Map();
  private globalScope: Scope = new Scope();

  addFunction(func: FunctionDefinition): void {
    if (!func.isValid()) {
      throw new Error(`Invalid function: ${func.name}`);
    }
    
    if (this.functions.has(func.name)) {
      throw new Error(`Function already defined: ${func.name}`);
    }
    
    this.functions.set(func.name, func);
  }

  getFunction(name: string): FunctionDefinition | undefined {
    return this.functions.get(name);
  }

  isAdvancedValid(): boolean {
    // 基本的な妥当性チェック
    if (!this.isValid()) {
      return false;
    }
    
    // 関数呼び出しのチェック
    for (const stmt of this.getStatements()) {
      if (stmt instanceof FunctionCall) {
        if (!this.functions.has(stmt.name)) {
          return false; // 未定義の関数呼び出し
        }
      }
    }
    
    return true;
  }

  getAdvancedStatistics(): {
    functions: number;
    maxNestingLevel: number;
    cyclomaticComplexity: number;
  } {
    return {
      functions: this.functions.size,
      maxNestingLevel: this.calculateMaxNesting(),
      cyclomaticComplexity: this.calculateComplexity()
    };
  }

  private calculateMaxNesting(): number {
    // 簡易実装：ネストレベルの計算
    let maxNesting = 0;
    const statements = this.getStatements();
    
    for (const stmt of statements) {
      maxNesting = Math.max(maxNesting, this.getStatementNesting(stmt));
    }
    
    return maxNesting;
  }

  private getStatementNesting(stmt: BotScriptStatement): number {
    if (stmt instanceof IfStatement) {
      return 1 + Math.max(
        this.getMaxNestingInBody(stmt.thenBody),
        this.getMaxNestingInBody(stmt.elseBody)
      );
    } else if (stmt instanceof RepeatStatement) {
      return 1 + this.getMaxNestingInBody(stmt.body);
    } else if (stmt instanceof TryStatement) {
      return 1 + Math.max(
        this.getMaxNestingInBody(stmt.tryBody),
        this.getMaxNestingInBody(stmt.catchBody)
      );
    }
    
    return 0;
  }

  private getMaxNestingInBody(body: BotScriptStatement[]): number {
    let maxNesting = 0;
    for (const stmt of body) {
      maxNesting = Math.max(maxNesting, this.getStatementNesting(stmt));
    }
    return maxNesting;
  }

  private calculateComplexity(): number {
    // 簡易実装：循環的複雑度の計算
    let complexity = 1; // 基本の複雑度
    const statements = this.getStatements();
    
    for (const stmt of statements) {
      complexity += this.getStatementComplexity(stmt);
    }
    
    return complexity;
  }

  private getStatementComplexity(stmt: BotScriptStatement): number {
    if (stmt instanceof IfStatement) {
      return 1 + this.getBodyComplexity(stmt.thenBody) + this.getBodyComplexity(stmt.elseBody);
    } else if (stmt instanceof RepeatStatement) {
      return 1 + this.getBodyComplexity(stmt.body);
    } else if (stmt instanceof TryStatement) {
      return 1 + this.getBodyComplexity(stmt.tryBody) + this.getBodyComplexity(stmt.catchBody);
    }
    
    return 0;
  }

  private getBodyComplexity(body: BotScriptStatement[]): number {
    let complexity = 0;
    for (const stmt of body) {
      complexity += this.getStatementComplexity(stmt);
    }
    return complexity;
  }
}

// ===== 上級解答 (hard.ts) =====

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

  isValid(): boolean {
    if (!this.left.isValid() || !this.right.isValid()) {
      return false;
    }
    
    const validOperators = ['+', '-', '*', '/', '==', '!=', '<', '>', '<=', '>=', '&&', '||'];
    return validOperators.includes(this.operator);
  }

  toBotScript(): string {
    return `(${this.left.toBotScript()} ${this.operator} ${this.right.toBotScript()})`;
  }

  evaluate(context: ExpressionContext): any {
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

export class ExpressionContext {
  private variables: Map<string, any> = new Map();
  private functions: Map<string, Function> = new Map();

  setVariable(name: string, value: any): void {
    this.variables.set(name, value);
  }

  getVariable(name: string): any {
    if (!this.variables.has(name)) {
      throw new Error(`Undefined variable: ${name}`);
    }
    return this.variables.get(name);
  }

  registerFunction(name: string, func: Function): void {
    this.functions.set(name, func);
  }

  callFunction(name: string, args: any[]): any {
    if (!this.functions.has(name)) {
      throw new Error(`Undefined function: ${name}`);
    }
    const func = this.functions.get(name)!;
    return func(...args);
  }
}

export class WhileStatement {
  type = 'WhileStatement';
  
  constructor(
    public condition: BotScriptExpression,
    public body: BotScriptStatement[],
    public content: string
  ) {}

  isValid(): boolean {
    if (!this.condition.isValid()) {
      return false;
    }
    
    if (this.body.length === 0) {
      return false;
    }
    
    return this.body.every(stmt => stmt.isValid());
  }

  toBotScript(): string {
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

  isValid(): boolean {
    if (!this.expression.isValid()) {
      return false;
    }
    
    // ケースの重複チェック
    const values = new Set();
    for (const case_ of this.cases) {
      if (values.has(case_.value)) {
        return false;
      }
      values.add(case_.value);
      
      if (!case_.isValid()) {
        return false;
      }
    }
    
    if (this.defaultCase && !this.defaultCase.every(stmt => stmt.isValid())) {
      return false;
    }
    
    return true;
  }

  toBotScript(): string {
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

export class MacroDefinition {
  type = 'MacroDefinition';
  
  constructor(
    public name: string,
    public parameters: string[],
    public body: string,
    public content: string
  ) {}

  isValid(): boolean {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(this.name)) {
      return false;
    }
    
    const paramSet = new Set(this.parameters);
    if (paramSet.size !== this.parameters.length) {
      return false;
    }
    
    return this.body.trim().length > 0;
  }

  expand(args: string[]): string {
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

export class OptimizationEngine {
  optimize(program: BotScriptProgram): BotScriptProgram {
    const optimized = new BotScriptProgram();
    
    for (const stmt of program.getStatements()) {
      const optimizedStmt = this.optimizeStatement(stmt);
      if (optimizedStmt) {
        optimized.addStatement(optimizedStmt);
      }
    }
    
    return optimized;
  }

  private optimizeStatement(stmt: BotScriptStatement): BotScriptStatement | null {
    // デッドコード除去
    if (stmt instanceof BotCommand && stmt.command === 'NOP') {
      return null;
    }
    
    return stmt;
  }

  optimizeExpression(expr: BotScriptExpression): BotScriptExpression {
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