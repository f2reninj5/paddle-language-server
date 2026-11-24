import { Cursor } from "./cursor.js";
import { keywords, type Token, TokenType } from "./token.js";

function isWhitespace(char: string): boolean {
	return /\s/.test(char);
}

function isNewLine(char: string): boolean {
	return char === "\r" || char === "\n";
}

function isKeywordChar(char: string): boolean {
	return /[a-z]/.test(char);
}

function isFirstIdentifierChar(char: string): boolean {
	return /[a-z]_/.test(char);
}

function isIdentifierChar(char: string): boolean {
	return /[a-z][0-9]_]/.test(char);
}

function isFirstComponentIdentifierChar(char: string): boolean {
	return /[A-Z]/.test(char);
}

function isComponentIdentifierChar(char: string): boolean {
	return /[A-Z][0-9]_]/.test(char);
}

function isNumber(char: string): boolean {
	return /[0-9]/.test(char);
}

function isInvalidStringChar(char: string): boolean {
	return ["\r", "\n"].includes(char);
}

export function tokenise(source: string): Token[] {
	const tokens: Token[] = [];
	const cursor = new Cursor(source);

	function consumeWhile(predicate: (char: string) => boolean): string {
		while (true) {
			let length = 0;
			const nextChar = cursor.peek(length);
			if (nextChar === undefined || !predicate(nextChar)) {
				break;
			}
			length++;
		}

		const value = cursor.slice(length);
		cursor.advance(length);
		return value;
	}

	while (!cursor.isAtEnd) {
		const char = cursor.current;

		// whitespace
		if (isWhitespace(char)) {
			if (isNewLine(char)) {
				tokens.push({
					type: TokenType.NewLine,
					value: "\n",
					...cursor.getLocation(),
				});

				cursor.advanceLine();
			} else {
				cursor.advance();
			}

			continue;
		}

		const startLine = cursor.line;
		const startColumn = cursor.column;

		// keywords
		if (isKeywordChar(char)) {
			let length = 1;

			while (true) {
				const nextChar = cursor.peek(length);
				if (nextChar === undefined) {
					throw new Error("Unexpected end of file");
				}
				if (!isKeywordChar(nextChar)) break;
				length++;
			}

			const value = cursor.slice(length);

			const type = keywords.get(value);
			if (type !== undefined) {
				tokens.push({
					type,
					value,
					line: startLine,
					column: startColumn,
				});
			}

			cursor.advance(length);
			continue;
		}

		// identifiers
		if (isFirstIdentifierChar(char)) {
			let length = 1;

			while (true) {
				const nextChar = cursor.peek(length);
				if (nextChar === undefined) {
					throw new Error("Unexpected end of file");
				}
				if (!isIdentifierChar(nextChar)) break;
				length++;
			}

			const value = cursor.slice(length);

			if (keywords.has(value)) {
				tokens.push({
					type: TokenType.Identifier,
					value,
					line: startLine,
					column: startColumn,
				});
			}

			cursor.advance(length);
			continue;
		}

		// component identifiers
		if (isFirstComponentIdentifierChar(char)) {
			let length = 1;

			while (true) {
				const nextChar = cursor.peek(length);
				if (nextChar === undefined) {
					throw new Error("Unexpected end of file");
				}
				if (!isComponentIdentifierChar(nextChar)) break;
				length++;
			}

			const value = cursor.slice(length);

			if (keywords.has(value)) {
				tokens.push({
					type: TokenType.ComponentIdentifier,
					value,
					line: startLine,
					column: startColumn,
				});
			}

			cursor.advance(length);
			continue;
		}

		// numbers
		if (isNumber(char)) {
			let length = 1;

			while (true) {
				const nextChar = cursor.peek(length);
				if (nextChar === undefined) {
					throw new Error("Unexpected end of file");
				}
				if (!isNumber(nextChar)) break;
				length++;
			}

			const value = cursor.slice(length);

			if (keywords.has(value)) {
				tokens.push({
					type: TokenType.Number,
					value,
					line: startLine,
					column: startColumn,
				});
			}

			cursor.advance(length);
			continue;
		}

		// strings
		if (char === '"') {
			cursor.advance();
			let length = 0;

			let nextChar = cursor.peek(length + 1);
			while (nextChar !== '"') {
				if (nextChar === undefined) {
					throw new Error("Unterminated string");
				}
				if (isInvalidStringChar(nextChar)) {
					throw new Error("Unexpected string character");
				}
				length++;
				nextChar = cursor.peek(length + 1);
			}

			const value = cursor.slice(length);

			tokens.push({
				type: TokenType.StringStart,
				value: '"',
				line: startLine,
				column: startColumn,
			});
			tokens.push({
				type: TokenType.String,
				value,
				line: startLine,
				column: startColumn + 1,
			});
			tokens.push({
				type: TokenType.StringEnd,
				value: '"',
				line: startLine,
				column: startColumn + length + 1,
			});

			cursor.advance(length + 1);
		}
	}

	return tokens;
}
