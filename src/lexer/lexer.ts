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

		const startLine = line;
		const startColumn = column;

		// keywords
		if (isKeywordChar(char)) {
			const length = 1;

			while (isKeywordChar(cursor.peek(length))) length++;

			const value = cursor.slice(length);

			if (keywords.has(value)) {
				tokens.push({
					type: keywords.get(value),
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
			const length = 1;

			while (isIdentifierChar(cursor.peek(length))) length++;

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

	return tokens;
}
