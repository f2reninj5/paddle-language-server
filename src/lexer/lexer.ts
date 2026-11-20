import { Cursor } from "./cursor.js";
import { type Token, TokenType } from "./token.js";

function isWhitespace(char: string): boolean {
	return /\s/.test(char);
}

function isNewLine(char: string): boolean {
	return char === "\r" || char === "\n";
}

export function tokenize(source: string): Token[] {
	const tokens: Token[] = [];
	const cursor = new Cursor(source);

	const keywords: Record<string, TokenType> = {
		base: TokenType.Base,
		unit: TokenType.Unit,
		memory: TokenType.Memory,
		device: TokenType.Device,
		register: TokenType.Register,
		instruction: TokenType.Instruction,
		fetch: TokenType.Fetch,
		decode: TokenType.Decode,
		execute: TokenType.Execute,
		halt: TokenType.Halt,
	};

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

	return tokens;
}
