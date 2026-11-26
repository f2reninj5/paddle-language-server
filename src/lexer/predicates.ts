export function isWhitespace(char: string): boolean {
	return /\s/.test(char);
}

export function isIndentationWhitespace(char: string): boolean {
	return char === " " || char === "\t";
}

export function isNewLine(char: string): boolean {
	return char === "\r" || char === "\n";
}

export function isKeywordChar(char: string): boolean {
	return /[a-z]/.test(char);
}

export function isFirstIdentifierChar(char: string): boolean {
	return /[a-z_]/.test(char);
}

export function isIdentifierChar(char: string): boolean {
	return /[a-z0-9_]/.test(char);
}

export function isFirstComponentIdentifierChar(char: string): boolean {
	return /[A-Z]/.test(char);
}

export function isComponentIdentifierChar(char: string): boolean {
	return /[A-Z0-9_]/.test(char);
}

export function isNumber(char: string): boolean {
	return /[0-9]/.test(char);
}

export function isStringChar(char: string): boolean {
	return !["\r", "\n", '"', "{", "}"].includes(char);
}
