/**
 * BotScript言語のトークンタイプ定義
 */
export enum TokenType {
  // リテラル
  IDENTIFIER = 'IDENTIFIER',
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  VARIABLE = 'VARIABLE', // $で始まる変数

  // キーワード
  DEF = 'DEF',
  IF = 'IF',
  THEN = 'THEN',
  ELSE = 'ELSE',
  ENDIF = 'ENDIF',
  REPEAT = 'REPEAT',
  ENDREPEAT = 'ENDREPEAT',
  TRUE = 'TRUE',
  FALSE = 'FALSE',

  // ボットコマンド
  SAY = 'SAY',
  MOVE = 'MOVE',
  GOTO = 'GOTO',
  ATTACK = 'ATTACK',
  DIG = 'DIG',
  PLACE = 'PLACE',
  EQUIP = 'EQUIP',
  DROP = 'DROP',
  WAIT = 'WAIT',

  // 演算子
  ASSIGN = '=',
  EQUALS = '==',
  NOT_EQUALS = '!=',
  LESS_THAN = '<',
  GREATER_THAN = '>',
  LESS_EQUALS = '<=',
  GREATER_EQUALS = '>=',
  PLUS = '+',
  MINUS = '-',
  MULTIPLY = '*',
  DIVIDE = '/',
  AND = 'AND',
  OR = 'OR',
  NOT = 'NOT',

  // 区切り文字
  LPAREN = '(',
  RPAREN = ')',
  LBRACE = '{',
  RBRACE = '}',
  COMMA = ',',
  SEMICOLON = ';',
  NEWLINE = 'NEWLINE',

  // 特殊
  EOF = 'EOF',
  INVALID = 'INVALID',
}

/**
 * トークン構造体
 */
export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

/**
 * キーワードマッピング
 */
export const KEYWORDS: Record<string, TokenType> = {
  'DEF': TokenType.DEF,
  'IF': TokenType.IF,
  'THEN': TokenType.THEN,
  'ELSE': TokenType.ELSE,
  'ENDIF': TokenType.ENDIF,
  'REPEAT': TokenType.REPEAT,
  'ENDREPEAT': TokenType.ENDREPEAT,
  'TRUE': TokenType.TRUE,
  'FALSE': TokenType.FALSE,
  'AND': TokenType.AND,
  'OR': TokenType.OR,
  'NOT': TokenType.NOT,
  'SAY': TokenType.SAY,
  'MOVE': TokenType.MOVE,
  'GOTO': TokenType.GOTO,
  'ATTACK': TokenType.ATTACK,
  'DIG': TokenType.DIG,
  'PLACE': TokenType.PLACE,
  'EQUIP': TokenType.EQUIP,
  'DROP': TokenType.DROP,
  'WAIT': TokenType.WAIT,
};