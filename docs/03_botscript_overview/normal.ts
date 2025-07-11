/**
 * 🟡 03_botscript_overview 中級問題: 高度なBotScript機能実装
 * 
 * より複雑なBotScript機能を実装してください。
 * この問題では、ループ、関数、エラーハンドリングの実装を学びます。
 */

// ===== REPEAT文の実装 =====

export class RepeatStatement {
  type = 'RepeatStatement';
  
  constructor(
    public count: string,
    public body: BotScriptStatement[],
    public content: string
  ) {}

  /**
   * REPEAT文の妥当性をチェックします
   */
  isValid(): boolean {
    // TODO: REPEAT文の妥当性チェック
    // ヒント1: カウントが正の数値または変数
    // ヒント2: ボディが空でない
    // ヒント3: 全ての内部文が有効
    
    return true; // 仮実装
  }

  /**
   * BotScriptコードを生成します
   */
  toBotScript(): string {
    // TODO: REPEAT文の生成
    // 形式: REPEAT count ... ENDREPEAT
    
    let code = `REPEAT ${this.count}\n`;
    for (const stmt of this.body) {
      code += `  ${stmt.toBotScript()}\n`;
    }
    code += `ENDREPEAT`;
    return code;
  }
}

// ===== 関数定義と呼び出し =====

export class FunctionDefinition {
  type = 'FunctionDefinition';
  
  constructor(
    public name: string,
    public parameters: string[],
    public body: BotScriptStatement[],
    public content: string
  ) {}

  /**
   * 関数定義の妥当性をチェックします
   */
  isValid(): boolean {
    // TODO: 関数定義の妥当性チェック
    // ヒント1: 関数名が有効な識別子
    // ヒント2: パラメータ名が重複していない
    // ヒント3: 本体が空でない
    
    if (!this.isValidIdentifier(this.name)) {
      return false;
    }
    
    // パラメータの重複チェック
    const paramSet = new Set(this.parameters);
    if (paramSet.size !== this.parameters.length) {
      return false;
    }
    
    return this.body.length > 0 && this.body.every(stmt => stmt.isValid());
  }

  /**
   * 有効な識別子かチェックします
   */
  private isValidIdentifier(name: string): boolean {
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
  }

  /**
   * BotScriptコードを生成します
   */
  toBotScript(): string {
    // TODO: 関数定義の生成
    // 形式: FUNCTION name(param1, param2) ... ENDFUNCTION
    
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

  /**
   * 関数呼び出しの妥当性をチェックします
   */
  isValid(): boolean {
    // TODO: 関数呼び出しの妥当性チェック
    return this.name.trim() !== '';
  }

  /**
   * BotScriptコードを生成します
   */
  toBotScript(): string {
    // TODO: 関数呼び出しの生成
    // 形式: CALL name(arg1, arg2)
    const args = this.arguments.join(', ');
    return `CALL ${this.name}(${args})`;
  }
}

// ===== エラーハンドリング =====

export class TryStatement {
  type = 'TryStatement';
  
  constructor(
    public tryBody: BotScriptStatement[],
    public catchBody: BotScriptStatement[],
    public errorVariable: string,
    public content: string
  ) {}

  /**
   * TRY文の妥当性をチェックします
   */
  isValid(): boolean {
    // TODO: TRY文の妥当性チェック
    // ヒント1: TRY部分が空でない
    // ヒント2: エラー変数が有効
    // ヒント3: 全ての内部文が有効
    
    if (this.tryBody.length === 0) {
      return false;
    }
    
    if (this.errorVariable && !this.errorVariable.startsWith('$')) {
      return false;
    }
    
    const allStatements = [...this.tryBody, ...this.catchBody];
    return allStatements.every(stmt => stmt.isValid());
  }

  /**
   * BotScriptコードを生成します
   */
  toBotScript(): string {
    // TODO: TRY文の生成
    // 形式: TRY ... CATCH $error ... ENDTRY
    
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

// ===== 高度なBotScriptパーサー =====

export class AdvancedBotScriptParser {
  private tokens: string[] = [];
  private current: number = 0;

  /**
   * 高度なBotScriptコードを解析します
   */
  parse(code: string): BotScriptProgram {
    // TODO: 高度なパーサーの実装
    // ヒント1: ネストした構造の処理
    // ヒント2: ブロックの開始・終了の管理
    // ヒント3: 複数行にわたる構造の処理
    
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

  /**
   * コードを前処理します
   */
  private preprocessCode(code: string): string[] {
    // TODO: コードの前処理
    // ヒント1: コメントの除去
    // ヒント2: 行の正規化
    // ヒント3: インデントの処理
    
    return code.split('\n').map(line => line.trim());
  }

  /**
   * 複雑な文を解析します
   */
  private parseComplexStatement(line: string, lines: string[], startIndex: number): { statement: BotScriptStatement; nextLine: number } | null {
    // TODO: 複雑な文の解析
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

  /**
   * REPEAT文を解析します
   */
  private parseRepeatStatement(lines: string[], startIndex: number): { statement: RepeatStatement; nextLine: number } {
    // TODO: REPEAT文の解析
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

  /**
   * 関数定義を解析します
   */
  private parseFunctionDefinition(lines: string[], startIndex: number): { statement: FunctionDefinition; nextLine: number } {
    // TODO: 関数定義の解析
    const line = lines[startIndex];
    const match = line.match(/FUNCTION\s+(\w+)\s*\(([^)]*)\)/i);
    
    if (!match) {
      throw new Error(`Invalid function definition: ${line}`);
    }
    
    const name = match[1];
    const parameters = match[2] ? match[2].split(',').map(p => p.trim()) : [];
    
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

  /**
   * 関数呼び出しを解析します
   */
  private parseFunctionCall(line: string, startIndex: number): { statement: FunctionCall; nextLine: number } {
    // TODO: 関数呼び出しの解析
    const match = line.match(/CALL\s+(\w+)\s*\(([^)]*)\)/i);
    
    if (!match) {
      throw new Error(`Invalid function call: ${line}`);
    }
    
    const name = match[1];
    const args = match[2] ? match[2].split(',').map(a => a.trim()) : [];
    
    return {
      statement: new FunctionCall(name, args, line),
      nextLine: startIndex
    };
  }

  /**
   * TRY文を解析します
   */
  private parseTryStatement(lines: string[], startIndex: number): { statement: TryStatement; nextLine: number } {
    // TODO: TRY文の解析
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

  /**
   * 基本的な文を解析します
   */
  private parseBasicStatement(line: string): BotScriptStatement | null {
    // TODO: 基本文の解析（easyから移植）
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
        return new BotCommand(keyword, tokens.slice(1), line);
    }
    
    return null;
  }
}

// ===== スコープ管理 =====

export class Scope {
  private variables: Map<string, any> = new Map();
  private parent: Scope | null = null;

  constructor(parent: Scope | null = null) {
    this.parent = parent;
  }

  /**
   * 変数を定義します
   */
  define(name: string, value: any): void {
    // TODO: スコープでの変数定義
    this.variables.set(name, value);
  }

  /**
   * 変数を取得します
   */
  get(name: string): any {
    // TODO: スコープチェーンでの変数検索
    if (this.variables.has(name)) {
      return this.variables.get(name);
    }
    
    if (this.parent) {
      return this.parent.get(name);
    }
    
    throw new Error(`Undefined variable: ${name}`);
  }

  /**
   * 変数が存在するかチェックします
   */
  has(name: string): boolean {
    return this.variables.has(name) || (this.parent ? this.parent.has(name) : false);
  }

  /**
   * 子スコープを作成します
   */
  createChild(): Scope {
    return new Scope(this);
  }
}

// ===== 高度なプログラム管理 =====

export class AdvancedBotScriptProgram extends BotScriptProgram {
  private functions: Map<string, FunctionDefinition> = new Map();
  private globalScope: Scope = new Scope();

  /**
   * 関数を追加します
   */
  addFunction(func: FunctionDefinition): void {
    // TODO: 関数の追加と妥当性チェック
    if (!func.isValid()) {
      throw new Error(`Invalid function: ${func.name}`);
    }
    
    if (this.functions.has(func.name)) {
      throw new Error(`Function already defined: ${func.name}`);
    }
    
    this.functions.set(func.name, func);
  }

  /**
   * 関数を取得します
   */
  getFunction(name: string): FunctionDefinition | undefined {
    return this.functions.get(name);
  }

  /**
   * プログラムの高度な妥当性チェック
   */
  isAdvancedValid(): boolean {
    // TODO: 高度な妥当性チェック
    // ヒント1: 関数呼び出しが定義済み関数を参照している
    // ヒント2: 変数参照が適切なスコープ内
    // ヒント3: 再帰呼び出しの検出
    
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

  /**
   * 高度な統計情報を取得します
   */
  getAdvancedStatistics(): {
    functions: number;
    maxNestingLevel: number;
    cyclomaticComplexity: number;
  } {
    // TODO: 高度な統計情報の計算
    return {
      functions: this.functions.size,
      maxNestingLevel: this.calculateMaxNesting(),
      cyclomaticComplexity: this.calculateComplexity()
    };
  }

  /**
   * 最大ネストレベルを計算します
   */
  private calculateMaxNesting(): number {
    // TODO: ネストレベルの計算
    return 0; // 仮実装
  }

  /**
   * 循環的複雑度を計算します
   */
  private calculateComplexity(): number {
    // TODO: 複雑度の計算
    return 1; // 仮実装
  }
}

// ===== デモクラス =====

export class AdvancedBotScriptDemo {
  /**
   * 高度なBotScript機能のデモを実行します
   */
  public static runDemo(): void {
    console.log('=== Advanced BotScript Demo ===');

    // 高度なプログラムの作成
    const program = new AdvancedBotScriptProgram();

    // 関数定義の追加
    const moveFunction = new FunctionDefinition(
      'moveToTarget',
      ['x', 'y', 'z'],
      [
        new BotCommand('SAY', ['"Moving to target"'], 'SAY "Moving to target"'),
        new BotCommand('GOTO', ['$x', '$y', '$z'], 'GOTO $x $y $z')
      ],
      'FUNCTION moveToTarget(x, y, z)'
    );
    
    program.addFunction(moveFunction);

    // REPEAT文の追加
    const repeatStmt = new RepeatStatement(
      '3',
      [
        new BotCommand('SAY', ['"Loop iteration"'], 'SAY "Loop iteration"'),
        new FunctionCall('moveToTarget', ['10', '64', '20'], 'CALL moveToTarget(10, 64, 20)')
      ],
      'REPEAT 3'
    );
    
    program.addStatement(repeatStmt);

    // TRY文の追加
    const tryStmt = new TryStatement(
      [new BotCommand('ATTACK', ['zombie'], 'ATTACK zombie')],
      [new BotCommand('SAY', ['"Attack failed"'], 'SAY "Attack failed"')],
      '$error',
      'TRY'
    );
    
    program.addStatement(tryStmt);

    // プログラムの検証
    console.log('Advanced program valid:', program.isAdvancedValid());
    console.log('Advanced statistics:', program.getAdvancedStatistics());

    // BotScriptコードの生成
    console.log('\nGenerated Advanced BotScript:');
    console.log(program.toBotScript());

    // 高度なパーサーのテスト
    console.log('\n--- Advanced Parser Test ---');
    const parser = new AdvancedBotScriptParser();
    const complexCode = `
      FUNCTION greetPlayer(name)
        SAY "Hello " + name
        MOVE forward 1
      ENDFUNCTION
      
      REPEAT 5
        CALL greetPlayer("Steve")
        TRY
          ATTACK nearest_mob
        CATCH $err
          SAY "Combat failed: " + $err
        ENDTRY
      ENDREPEAT
    `;
    
    const parsedProgram = parser.parse(complexCode);
    console.log('Parsed advanced program valid:', parsedProgram.isValid());

    console.log('\nAdvanced demo completed');
  }
}

// 必要なインポート（easy.tsから）
import { BotScriptStatement, VariableDeclaration, BotCommand, BotScriptProgram } from './easy';