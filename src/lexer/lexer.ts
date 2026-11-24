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
			const value = cursor.sliceWhile(isKeywordChar);
			const type = keywords.get(value);

			if (type !== undefined) {
				tokens.push({
					type,
					value,
					line: startLine,
					column: startColumn,
				});

				cursor.advance(value.length);
			}

			continue;
		}

		// identifiers
		if (isFirstIdentifierChar(char)) {
			const value = cursor.sliceWhile(isIdentifierChar);

			tokens.push({
				type: TokenType.Identifier,
				value,
				line: startLine,
				column: startColumn,
			});

			cursor.advance(value.length);
			continue;
		}

		// component identifiers
		if (isFirstComponentIdentifierChar(char)) {
			const value = cursor.sliceWhile(isComponentIdentifierChar);

			tokens.push({
				type: TokenType.ComponentIdentifier,
				value,
				line: startLine,
				column: startColumn,
			});

			cursor.advance(value.length);
			continue;
		}

		// numbers
		if (isNumber(char)) {
			const value = cursor.sliceWhile(isKeywordChar);

			tokens.push({
				type: TokenType.Number,
				value,
				line: startLine,
				column: startColumn,
			});

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
