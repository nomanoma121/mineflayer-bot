/**
 * BotScript言語のトークンタイプ定義
 */
export enum TokenType {
	// リテラル
	IDENTIFIER = "IDENTIFIER",
	NUMBER = "NUMBER",
	STRING = "STRING",

	// キーワード
	VAR = "VAR",
	SET = "SET",
	IF = "IF",
	ELSE = "ELSE",
	REPEAT = "REPEAT",
	TRUE = "TRUE",
	FALSE = "FALSE",

	// ボットコマンド
	SAY = "SAY",
	GOTO = "GOTO",
	ATTACK = "ATTACK",
	DIG = "DIG",
	PLACE = "PLACE",
	EQUIP = "EQUIP",
	DROP = "DROP",
	WAIT = "WAIT",

	// 演算子
	ASSIGN = "=",
	EQUALS = "==",
	NOT_EQUALS = "!=",
	LESS_THAN = "<",
	GREATER_THAN = ">",
	LESS_EQUALS = "<=",
	GREATER_EQUALS = ">=",
	PLUS = "+",
	MINUS = "-",
	MULTIPLY = "*",
	DIVIDE = "/",
	AND = "AND",
	OR = "OR",
	NOT = "NOT",

	// 区切り文字
	LPAREN = "(",
	RPAREN = ")",
	LBRACE = "{",
	RBRACE = "}",
	NEWLINE = "NEWLINE",

	// 特殊
	EOF = "EOF",
	INVALID = "INVALID",
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
	VAR: TokenType.VAR,
	SET: TokenType.SET,
	IF: TokenType.IF,
	ELSE: TokenType.ELSE,
	REPEAT: TokenType.REPEAT,
	TRUE: TokenType.TRUE,
	FALSE: TokenType.FALSE,
	AND: TokenType.AND,
	OR: TokenType.OR,
	NOT: TokenType.NOT,
	SAY: TokenType.SAY,
	GOTO: TokenType.GOTO,
	ATTACK: TokenType.ATTACK,
	DIG: TokenType.DIG,
	PLACE: TokenType.PLACE,
	EQUIP: TokenType.EQUIP,
	DROP: TokenType.DROP,
	WAIT: TokenType.WAIT,
};
