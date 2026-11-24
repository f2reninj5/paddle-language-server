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

function isStringChar(char: string): boolean {
	return !["\r", "\n", '"', "{", "}"].includes(char);
}

export function tokenise(source: string): Token[] {
	const tokens: Token[] = [];
	const cursor = new Cursor(source);

	function tokeniseKeyword(): boolean {
		if (!isKeywordChar(cursor.current)) return false;
		const value = cursor.sliceWhile(isKeywordChar);
		const type = keywords.get(value);
		if (type === undefined) return false;

		tokens.push({
			type,
			value,
			line: cursor.line,
			column: cursor.column,
		});

		cursor.advance(value.length);
		return true;
	}

	function tokeniseIdentifier(): boolean {
		if (!isFirstIdentifierChar(cursor.current)) return false;
		const value = cursor.sliceWhile(isIdentifierChar);

		tokens.push({
			type: TokenType.Identifier,
			value,
			line: cursor.line,
			column: cursor.column,
		});

		cursor.advance(value.length);
		return true;
	}

	function tokeniseComponentIdentifier(): boolean {
		if (!isFirstComponentIdentifierChar(cursor.current)) return false;
		const value = cursor.sliceWhile(isComponentIdentifierChar);

		tokens.push({
			type: TokenType.ComponentIdentifier,
			value,
			line: cursor.line,
			column: cursor.column,
		});

		cursor.advance(value.length);
		return true;
	}

	while (!cursor.isAtEnd) {
		// whitespace
		if (isWhitespace(cursor.current)) {
			if (isNewLine(cursor.current)) {
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

		if (tokeniseKeyword()) continue;
		if (tokeniseIdentifier()) continue;
		if (tokeniseComponentIdentifier()) continue;

		// numbers
		if (isNumber(cursor.current)) {
			const value = cursor.sliceWhile(isKeywordChar);

			tokens.push({
				type: TokenType.Number,
				value,
				line: cursor.line,
				column: cursor.column,
			});

			cursor.advance(length);
			continue;
		}

		// strings
		if (cursor.current === '"') {
			tokens.push({
				type: TokenType.StringStart,
				value: '"',
				line: cursor.line,
				column: cursor.column,
			});

			cursor.advance();

			while (cursor.current !== '"') {
				if (isStringChar(cursor.current)) {
					const value = cursor.sliceWhile(isStringChar);

					tokens.push({
						type: TokenType.String,
						value,
						line: cursor.line,
						column: cursor.column,
					});

					cursor.advance(value.length);
					continue;
				}

				if (cursor.current === "{") {
					tokens.push({
						type: TokenType.ArgumentStart,
						value: "{",
						line: cursor.line,
						column: cursor.column,
					});

					cursor.advance();

					while (cursor.current !== "}") {
						if (isFirstIdentifierChar(cursor.current)) {
							const value = cursor.sliceWhile(isIdentifierChar);

							tokens.push({
								type: TokenType.Identifier,
								value,
								line: cursor.line,
								column: cursor.column,
							});

							cursor.advance(value.length);
							continue;
						}

						if (cursor.current === ":") {
							tokens.push({
								type: TokenType.Colon,
								value: ":",
								line: cursor.line,
								column: cursor.column,
							});

							cursor.advance();
							continue;
						}

						throw new Error("Unexpected character in argument");
					}

					tokens.push({
						type: TokenType.ArgumentEnd,
						value: "}",
						line: cursor.line,
						column: cursor.column,
					});

					cursor.advance();
					continue;
				}

				throw new Error("Unexpected character in string");
			}

			tokens.push({
				type: TokenType.StringEnd,
				value: '"',
				line: cursor.line,
				column: cursor.column,
			});

			cursor.advance();
			continue;
		}

		throw new Error("Unexpected character");
	}

	return tokens;
}
