import { Cursor } from "./cursor.js";
import {
	keywords,
	maxOperatorLength,
	operators,
	type Token,
	TokenType,
} from "./token.js";

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

	function pushToken(
		type: TokenType,
		value: string,
		line: number | undefined = undefined,
		column: number | undefined = undefined,
	) {
		tokens.push({
			type,
			value,
			line: line ?? cursor.line,
			column: column ?? cursor.column,
		});
	}

	function tokeniseKeyword(): boolean {
		if (!isKeywordChar(cursor.current)) return false;
		const value = cursor.sliceWhile(isKeywordChar);
		const type = keywords.get(value);
		if (type === undefined) return false;

		pushToken(type, value);

		cursor.advance(value.length);
		return true;
	}

	function tokeniseIdentifier(): boolean {
		if (!isFirstIdentifierChar(cursor.current)) return false;
		const value = cursor.sliceWhile(isIdentifierChar);

		pushToken(TokenType.Identifier, value);

		cursor.advance(value.length);
		return true;
	}

	function tokeniseComponentIdentifier(): boolean {
		if (!isFirstComponentIdentifierChar(cursor.current)) return false;
		const value = cursor.sliceWhile(isComponentIdentifierChar);

		pushToken(TokenType.ComponentIdentifier, value);

		cursor.advance(value.length);
		return true;
	}

	function tokeniseNumber(): boolean {
		if (!isNumber(cursor.current)) return false;
		const value = cursor.sliceWhile(isKeywordChar);

		pushToken(TokenType.Number, value);

		cursor.advance(value.length);
		return true;
	}

	function tokeniseOperator(): boolean {
		let length = 0;
		while (length < maxOperatorLength && cursor.peek(length) !== undefined) {
			length++;
		}
		const value = cursor.slice(length);

		while (length > 0) {
			const operator = value.slice(0, length);
			const type = operators.get(operator);
			if (type !== undefined) {
				pushToken(type, operator);
				cursor.advance(operator.length);
				return true;
			}
			length--;
		}

		return false;
	}

	function tokeniseColon(): boolean {
		if (cursor.current !== ":") return false;
		pushToken(TokenType.Colon, ":");

		cursor.advance();
		return true;
	}

	function tokeniseStringArgument(): boolean {
		if (cursor.current !== "{") return false;
		pushToken(TokenType.ArgumentStart, "{");

		cursor.advance();

		// @ts-expect-error cursor.current updates with cursor.advance()
		while (cursor.current !== "}") {
			if (tokeniseIdentifier()) continue;
			if (tokeniseColon()) continue;
			throw new Error("Unexpected character in argument");
		}

		pushToken(TokenType.ArgumentEnd, "}");

		cursor.advance();
		return true;
	}

	function tokeniseStringContents(): boolean {
		if (!isStringChar(cursor.current)) return false;
		const value = cursor.sliceWhile(isStringChar);

		pushToken(TokenType.String, value);

		cursor.advance(value.length);
		return true;
	}

	function tokeniseString(): boolean {
		if (cursor.current !== '"') return false;
		pushToken(TokenType.StringStart, '"');

		cursor.advance();

		while (cursor.current !== '"') {
			if (tokeniseStringContents()) continue;
			if (tokeniseStringArgument()) continue;

			throw new Error("Unexpected character in string");
		}

		pushToken(TokenType.StringEnd, '"');

		cursor.advance();
		return true;
	}

	while (!cursor.isAtEnd) {
		// whitespace
		if (isWhitespace(cursor.current)) {
			if (isNewLine(cursor.current)) {
				pushToken(TokenType.NewLine, "\n");

				cursor.advanceLine();
			} else {
				cursor.advance();
			}

			continue;
		}

		if (tokeniseKeyword()) continue;
		if (tokeniseIdentifier()) continue;
		if (tokeniseComponentIdentifier()) continue;
		if (tokeniseNumber()) continue;
		if (tokeniseOperator()) continue;
		if (tokeniseString()) continue;

		throw new Error("Unexpected character");
	}

	return tokens;
}
