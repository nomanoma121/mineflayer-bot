import { KEYWORDS, type Token, TokenType } from "./TokenType";

/**
 * BotScript言語の字句解析器（レキサー）
 * 入力された文字列をトークンに分解する
 */
export class Lexer {
	private input: string;
	private position: number = 0;
	private line: number = 1;
	private column: number = 1;

	constructor(input: string) {
		this.input = input;
	}

	/**
	 * 入力文字列をトークンに分解
	 * @returns トークンの配列
	 */
	public tokenize(): Token[] {
		const tokens: Token[] = [];

		while (this.position < this.input.length) {
			const token = this.nextToken();
			if (token) {
				tokens.push(token);
			}
		}

		// EOF トークンを追加
		tokens.push({
			type: TokenType.EOF,
			value: "",
			line: this.line,
			column: this.column,
		});

		return tokens;
	}

	/**
	 * 次のトークンを取得
	 * @returns 次のトークン、またはnull（スキップされた場合）
	 */
	private nextToken(): Token | null {
		this.skipWhitespace();

		if (this.position >= this.input.length) {
			return null;
		}

		const startLine = this.line;
		const startColumn = this.column;
		const char = this.input[this.position];

		// 改行
		if (char === "\n") {
			this.advance();
			return {
				type: TokenType.NEWLINE,
				value: "\n",
				line: startLine,
				column: startColumn,
			};
		}

		// 文字列リテラル
		if (char === '"') {
			return this.readString(startLine, startColumn);
		}

		// 数値
		if (this.isDigit(char)) {
			return this.readNumber(startLine, startColumn);
		}

		// 識別子またはキーワード
		if (this.isLetter(char)) {
			return this.readIdentifierOrKeyword(startLine, startColumn);
		}

		// 二文字演算子をチェック
		if (this.position + 1 < this.input.length) {
			const twoChar = this.input.substr(this.position, 2);
			const twoCharToken = this.getTwoCharOperator(twoChar);
			if (twoCharToken) {
				this.advance();
				this.advance();
				return {
					type: twoCharToken,
					value: twoChar,
					line: startLine,
					column: startColumn,
				};
			}
		}

		// 一文字演算子・区切り文字
		const singleCharToken = this.getSingleCharToken(char);
		if (singleCharToken) {
			this.advance();
			return {
				type: singleCharToken,
				value: char,
				line: startLine,
				column: startColumn,
			};
		}

		// 無効な文字
		this.advance();
		return {
			type: TokenType.INVALID,
			value: char,
			line: startLine,
			column: startColumn,
		};
	}

	/**
	 * 空白文字をスキップ（改行以外）
	 */
	private skipWhitespace(): void {
		while (this.position < this.input.length) {
			const char = this.input[this.position];
			if (char === " " || char === "\t" || char === "\r") {
				this.advance();
			} else {
				break;
			}
		}
	}

	/**
	 * 文字列リテラルを読み取り
	 */
	private readString(startLine: number, startColumn: number): Token {
		this.advance(); // 開始の " をスキップ
		let value = "";

		while (this.position < this.input.length) {
			const char = this.input[this.position];

			if (char === '"') {
				this.advance(); // 終了の " をスキップ
				return {
					type: TokenType.STRING,
					value,
					line: startLine,
					column: startColumn,
				};
			}

			if (char === "\n") {
				// 未終了の文字列
				return {
					type: TokenType.INVALID,
					value: `"${value}`,
					line: startLine,
					column: startColumn,
				};
			}

			value += char;
			this.advance();
		}

		// 未終了の文字列
		return {
			type: TokenType.INVALID,
			value: `"${value}`,
			line: startLine,
			column: startColumn,
		};
	}

	/**
	 * 数値を読み取り
	 */
	private readNumber(startLine: number, startColumn: number): Token {
		let value = "";
		let hasDot = false;

		while (this.position < this.input.length) {
			const char = this.input[this.position];

			if (this.isDigit(char)) {
				value += char;
				this.advance();
			} else if (char === "." && !hasDot) {
				hasDot = true;
				value += char;
				this.advance();
			} else {
				break;
			}
		}

		return {
			type: TokenType.NUMBER,
			value,
			line: startLine,
			column: startColumn,
		};
	}

	/**
	 * 識別子またはキーワードを読み取り
	 */
	private readIdentifierOrKeyword(
		startLine: number,
		startColumn: number,
	): Token {
		let value = "";

		while (this.position < this.input.length) {
			const char = this.input[this.position];

			if (this.isLetter(char) || this.isDigit(char) || char === "_") {
				value += char;
				this.advance();
			} else {
				break;
			}
		}

		// キーワードチェック
		const upperValue = value.toUpperCase();
		const tokenType = KEYWORDS[upperValue];

		if (tokenType) {
			// キーワードの場合は大文字に正規化
			return {
				type: tokenType,
				value: upperValue,
				line: startLine,
				column: startColumn,
			};
		} else {
			// 識別子の場合は元の大文字小文字を保持
			return {
				type: TokenType.IDENTIFIER,
				value: value,
				line: startLine,
				column: startColumn,
			};
		}
	}

	/**
	 * 二文字演算子を取得
	 */
	private getTwoCharOperator(twoChar: string): TokenType | null {
		switch (twoChar) {
			case "==":
				return TokenType.EQUALS;
			case "!=":
				return TokenType.NOT_EQUALS;
			case "<=":
				return TokenType.LESS_EQUALS;
			case ">=":
				return TokenType.GREATER_EQUALS;
			default:
				return null;
		}
	}

	/**
	 * 一文字トークンを取得
	 */
	private getSingleCharToken(char: string): TokenType | null {
		switch (char) {
			case "=":
				return TokenType.ASSIGN;
			case "<":
				return TokenType.LESS_THAN;
			case ">":
				return TokenType.GREATER_THAN;
			case "+":
				return TokenType.PLUS;
			case "-":
				return TokenType.MINUS;
			case "*":
				return TokenType.MULTIPLY;
			case "/":
				return TokenType.DIVIDE;
			case "(":
				return TokenType.LPAREN;
			case ")":
				return TokenType.RPAREN;
			case "{":
				return TokenType.LBRACE;
			case "}":
				return TokenType.RBRACE;
			default:
				return null;
		}
	}

	/**
	 * 現在位置を進める
	 */
	private advance(): void {
		if (this.position < this.input.length) {
			if (this.input[this.position] === "\n") {
				this.line++;
				this.column = 1;
			} else {
				this.column++;
			}
			this.position++;
		}
	}

	/**
	 * 文字が英字かどうか判定
	 */
	private isLetter(char: string): boolean {
		return /[a-zA-Z]/.test(char);
	}

	/**
	 * 文字が数字かどうか判定
	 */
	private isDigit(char: string): boolean {
		return /[0-9]/.test(char);
	}
}
