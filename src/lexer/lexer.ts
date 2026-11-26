import { Cursor } from "./cursor.js";
import {
	isComponentIdentifierChar,
	isFirstComponentIdentifierChar,
	isFirstIdentifierChar,
	isIdentifierChar,
	isIndentationWhitespace,
	isKeywordChar,
	isNewLine,
	isNumber,
	isStringChar,
	isWhitespace,
} from "./predicates.js";
import {
	keywords,
	maxOperatorLength,
	operators,
	type Token,
	TokenType,
} from "./token.js";

export function tokenise(source: string): Token[] {
	const tokens: Token[] = [];
	const cursor = new Cursor(source);
	let currentDepth = 0;
	let indentationUnit: string | undefined;

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

	function matchesIndentationUnit(indentation: string): boolean {
		if (indentationUnit === undefined)
			throw Error("Indentation unit is undefined");

		if (indentation.length % indentationUnit.length !== 0) return false;

		for (let i = 0; i < indentation.length; i += indentationUnit.length) {
			if (indentation.slice(i, i + indentationUnit.length) !== indentationUnit)
				return false;
		}

		return true;
	}

	function getIndentationDepth(indentation: string): number {
		if (indentation.length === 0) return 0;

		if (indentationUnit === undefined) {
			indentationUnit = indentation;
		} else if (!matchesIndentationUnit(indentation)) {
			throw new Error("Inconsistent indentation");
		}

		return indentation.length / indentationUnit.length;
	}

	function tokeniseIndent(): boolean {
		const indentation = cursor.sliceWhile(isIndentationWhitespace);
		cursor.advance(indentation.length);

		if (cursor.isAtEnd || isNewLine(cursor.current)) {
			return indentation.length > 0;
		}
		const indentationDepth = getIndentationDepth(indentation);

		while (currentDepth > indentationDepth) {
			pushToken(TokenType.Dedent, "");
			currentDepth--;
		}

		while (currentDepth < indentationDepth) {
			pushToken(TokenType.Indent, "");
			currentDepth++;
		}

		return indentation.length > 0;
	}

	function consumeWhitespace({
		onNewline,
	}: {
		onNewline: () => boolean;
	}): boolean {
		if (!isWhitespace(cursor.current)) return false;

		if (isNewLine(cursor.current)) {
			pushToken(TokenType.NewLine, "\n");
			cursor.advanceLine();
			return onNewline() || cursor.isAtEnd || isWhitespace(cursor.current);
		} else {
			cursor.advance();
			return true;
		}
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
		const value = cursor.sliceWhile(isNumber);

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
			if (tokeniseOperator()) continue;
			if (tokeniseNumber()) continue;
			throw new Error("Unexpected character in argument");
		}

		pushToken(TokenType.ArgumentEnd, "}");

		cursor.advance();
		return true;
	}

	function tokeniseIndex(): boolean {
		if (cursor.current !== "[") return false;
		pushToken(TokenType.IndexStart, "[");

		cursor.advance();

		// @ts-expect-error cursor.current updates with cursor.advance()
		while (cursor.current !== "]") {
			if (tokeniseIdentifier()) continue;
			if (tokeniseComponentIdentifier()) continue;
			if (tokeniseNumber()) continue;
			throw new Error("Unexpected character in index");
		}

		pushToken(TokenType.IndexEnd, "]");

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

	tokeniseIndent();

	while (!cursor.isAtEnd) {
		if (consumeWhitespace({ onNewline: tokeniseIndent })) continue;
		if (tokeniseKeyword()) continue;
		if (tokeniseIdentifier()) continue;
		if (tokeniseComponentIdentifier()) continue;
		if (tokeniseNumber()) continue;
		if (tokeniseOperator()) continue;
		if (tokeniseColon()) continue;
		if (tokeniseIndex()) continue;
		if (tokeniseString()) continue;

		throw new Error("Unexpected character");
	}

	while (currentDepth > 0) {
		pushToken(TokenType.Dedent, "");
		currentDepth--;
	}

	pushToken(TokenType.EOF, "");
	return tokens;
}
