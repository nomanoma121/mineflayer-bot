/**
 * 🟢 03_botscript_overview 初級問題: BotScript言語の基本構文
 * 
 * BotScript言語の基本的な構文要素を理解し、簡単なプログラムを作成してください。
 * この問題では、変数、コマンド、基本的な制御構造の使用方法を学びます。
 */

// ===== BotScript基本構文の定義 =====

export interface BotScriptToken {
  type: string;
  value: string;
  line: number;
  column: number;
}

export interface BotScriptStatement {
  type: string;
  content: string;
  isValid(): boolean;
}

// ===== 変数宣言クラス =====

export class VariableDeclaration implements BotScriptStatement {
  type = 'VariableDeclaration';
  
  constructor(
    public variableName: string, 
    public value: string,
    public content: string
  ) {}

  /**
   * 変数宣言の妥当性をチェックします
   */
  isValid(): boolean {
    // TODO: 変数宣言の妥当性チェック
    // ヒント1: 変数名は$で始まる
    // ヒント2: 値が空でない
    // ヒント3: 予約語でない
    
    if (!this.variableName.startsWith('$')) {
      return false;
    }
    
    if (this.value.trim() === '') {
      return false;
    }
    
    const reservedWords = ['DEF', 'SET', 'CALC', 'IF', 'THEN', 'ELSE', 'ENDIF'];
    if (reservedWords.includes(this.variableName.toUpperCase())) {
      return false;
    }
    
    return true;
  }

  /**
   * BotScriptコードを生成します
   */
  toBotScript(): string {
    // TODO: DEF文の生成
    // 形式: DEF $変数名 = 値
    return `DEF ${this.variableName} = ${this.value}`;
  }
}

// ===== コマンドクラス =====

export class BotCommand implements BotScriptStatement {
  type = 'BotCommand';
  
  constructor(
    public commandType: string,
    public parameters: string[],
    public content: string
  ) {}

  /**
   * コマンドの妥当性をチェックします
   */
  isValid(): boolean {
    // TODO: コマンドの妥当性チェック
    // ヒント1: 有効なコマンドタイプかチェック
    // ヒント2: 必要なパラメータ数をチェック
    
    const validCommands = ['SAY', 'MOVE', 'GOTO', 'ATTACK', 'DIG', 'PLACE', 'WAIT'];
    
    if (!validCommands.includes(this.commandType.toUpperCase())) {
      return false;
    }
    
    // コマンド別のパラメータチェック
    switch (this.commandType.toUpperCase()) {
      case 'SAY':
        return this.parameters.length >= 1; // メッセージが必要
      case 'MOVE':
        return this.parameters.length >= 1; // 方向が必要
      case 'GOTO':
        return this.parameters.length >= 3; // x, y, z座標が必要
      case 'WAIT':
        return this.parameters.length >= 1; // 待機時間が必要
      default:
        return this.parameters.length >= 0;
    }
  }

  /**
   * BotScriptコードを生成します
   */
  toBotScript(): string {
    // TODO: コマンド文の生成
    return `${this.commandType} ${this.parameters.join(' ')}`;
  }
}

// ===== IF文クラス =====

export class IfStatement implements BotScriptStatement {
  type = 'IfStatement';
  
  constructor(
    public condition: string,
    public thenStatements: BotScriptStatement[],
    public elseStatements: BotScriptStatement[] = [],
    public content: string
  ) {}

  /**
   * IF文の妥当性をチェックします
   */
  isValid(): boolean {
    // TODO: IF文の妥当性チェック
    // ヒント1: 条件式が空でない
    // ヒント2: THEN部分に少なくとも1つの文がある
    // ヒント3: 全ての内部文が有効
    
    if (this.condition.trim() === '') {
      return false;
    }
    
    if (this.thenStatements.length === 0) {
      return false;
    }
    
    // 全ての文の妥当性をチェック
    const allStatements = [...this.thenStatements, ...this.elseStatements];
    return allStatements.every(stmt => stmt.isValid());
  }

  /**
   * BotScriptコードを生成します
   */
  toBotScript(): string {
    // TODO: IF文の生成
    // 形式: IF 条件 THEN ... ELSE ... ENDIF
    
    let code = `IF ${this.condition} THEN\n`;
    
    for (const stmt of this.thenStatements) {
      code += `  ${stmt.toBotScript()}\n`;
    }
    
    if (this.elseStatements.length > 0) {
      code += `ELSE\n`;
      for (const stmt of this.elseStatements) {
        code += `  ${stmt.toBotScript()}\n`;
      }
    }
    
    code += `ENDIF`;
    
    return code;
  }
}

// ===== BotScriptプログラムクラス =====

export class BotScriptProgram {
  private statements: BotScriptStatement[] = [];
  
  /**
   * 文を追加します
   */
  addStatement(statement: BotScriptStatement): void {
    // TODO: 文の追加と妥当性チェック
    if (statement.isValid()) {
      this.statements.push(statement);
    } else {
      throw new Error(`Invalid statement: ${statement.content}`);
    }
  }

  /**
   * 全ての文を取得します
   */
  getStatements(): BotScriptStatement[] {
    return [...this.statements];
  }

  /**
   * プログラム全体の妥当性をチェックします
   */
  isValid(): boolean {
    // TODO: プログラム全体の妥当性チェック
    // ヒント1: 全ての文が有効
    // ヒント2: 変数の重複定義チェック
    
    // 全ての文が有効かチェック
    if (!this.statements.every(stmt => stmt.isValid())) {
      return false;
    }
    
    // 変数の重複定義チェック
    const definedVariables = new Set<string>();
    for (const stmt of this.statements) {
      if (stmt instanceof VariableDeclaration) {
        if (definedVariables.has(stmt.variableName)) {
          return false; // 重複定義
        }
        definedVariables.add(stmt.variableName);
      }
    }
    
    return true;
  }

  /**
   * 完全なBotScriptコードを生成します
   */
  toBotScript(): string {
    // TODO: プログラム全体のコード生成
    return this.statements.map(stmt => stmt.toBotScript()).join('\n');
  }

  /**
   * プログラムの統計情報を取得します
   */
  getStatistics(): { 
    totalStatements: number;
    variableDeclarations: number;
    commands: number;
    ifStatements: number;
  } {
    // TODO: 統計情報の計算
    const stats = {
      totalStatements: this.statements.length,
      variableDeclarations: 0,
      commands: 0,
      ifStatements: 0
    };
    
    for (const stmt of this.statements) {
      switch (stmt.type) {
        case 'VariableDeclaration':
          stats.variableDeclarations++;
          break;
        case 'BotCommand':
          stats.commands++;
          break;
        case 'IfStatement':
          stats.ifStatements++;
          break;
      }
    }
    
    return stats;
  }
}

// ===== BotScriptパーサー（簡易版） =====

export class SimpleBotScriptParser {
  /**
   * 簡単なBotScriptコードを解析します
   */
  parse(code: string): BotScriptProgram {
    // TODO: 簡易パーサーの実装
    // ヒント1: 行ごとに分割
    // ヒント2: 各行のタイプを判定
    // ヒント3: 適切なクラスのインスタンスを作成
    
    const program = new BotScriptProgram();
    const lines = code.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    for (const line of lines) {
      const statement = this.parseLine(line);
      if (statement) {
        program.addStatement(statement);
      }
    }
    
    return program;
  }

  /**
   * 1行を解析します
   */
  private parseLine(line: string): BotScriptStatement | null {
    // TODO: 行の解析実装
    // ヒント: 先頭のキーワードで判定
    
    const tokens = line.split(' ');
    const keyword = tokens[0].toUpperCase();
    
    switch (keyword) {
      case 'DEF':
        if (tokens.length >= 4 && tokens[2] === '=') {
          const variableName = tokens[1];
          const value = tokens.slice(3).join(' ');
          return new VariableDeclaration(variableName, value, line);
        }
        break;
        
      case 'SAY':
      case 'MOVE':
      case 'GOTO':
      case 'ATTACK':
      case 'DIG':
      case 'PLACE':
      case 'WAIT':
        const parameters = tokens.slice(1);
        return new BotCommand(keyword, parameters, line);
        
      // IF文の処理は簡略化（実際にはより複雑）
      case 'IF':
        const condition = tokens.slice(1, tokens.indexOf('THEN')).join(' ');
        return new IfStatement(condition, [], [], line);
    }
    
    return null;
  }
}

// ===== デモとテスト =====

export class BotScriptDemo {
  /**
   * BotScript基本機能のデモを実行します
   */
  public static runDemo(): void {
    console.log('=== BotScript Overview Demo ===');

    // プログラムの作成
    const program = new BotScriptProgram();

    // 変数宣言の追加
    program.addStatement(new VariableDeclaration('$health', '100', 'DEF $health = 100'));
    program.addStatement(new VariableDeclaration('$name', '"MinecraftBot"', 'DEF $name = "MinecraftBot"'));

    // コマンドの追加
    program.addStatement(new BotCommand('SAY', ['"Hello World"'], 'SAY "Hello World"'));
    program.addStatement(new BotCommand('MOVE', ['north', '5'], 'MOVE north 5'));
    program.addStatement(new BotCommand('GOTO', ['10', '64', '20'], 'GOTO 10 64 20'));

    // IF文の追加
    const ifStmt = new IfStatement(
      '$health < 50',
      [new BotCommand('SAY', ['"Health is low!"'], 'SAY "Health is low!"')],
      [new BotCommand('SAY', ['"Health is good!"'], 'SAY "Health is good!"')],
      'IF $health < 50 THEN...'
    );
    program.addStatement(ifStmt);

    // プログラムの検証
    console.log('Program valid:', program.isValid());
    console.log('Statistics:', program.getStatistics());

    // BotScriptコードの生成
    console.log('\nGenerated BotScript:');
    console.log(program.toBotScript());

    // パーサーのテスト
    console.log('\n--- Parser Test ---');
    const parser = new SimpleBotScriptParser();
    const sampleCode = `
      DEF $x = 10
      DEF $message = "Hello"
      SAY $message
      MOVE forward 3
      WAIT 1
    `;
    
    const parsedProgram = parser.parse(sampleCode);
    console.log('Parsed program statistics:', parsedProgram.getStatistics());
    console.log('Parsed program valid:', parsedProgram.isValid());

    console.log('\nDemo completed');
  }
}