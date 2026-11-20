export enum TokenType {
	// keywords
	Base = "Base",
	Unit = "Unit",
	Memory = "Memory",
	Device = "Device",
	Register = "Register",
	Instruction = "Instruction",
	Fetch = "Fetch",
	Decode = "Decode",
	Execute = "Execute",
	Halt = "Halt",

	// literals
	UnitIdentifier = "UnitIdentifier",
	ComponentIdentifier = "ComponentIdentifier",
	FunctionIdentifier = "FunctionIdentifier",
	ArgumentIdentifier = "ArgumentIdentifier",
	String = "String",
	Number = "Number",

	// operators
	Write = "Write",
	EqualEqual = "EqualEqual",
	NotEqual = "NotEqual",
	LessThan = "LessThan",
	GreaterThan = "GreaterThan",
	LessThanOrEqual = "LessThanOrEqual",
	GreaterThanOrEqual = "GreaterThanOrEqual",
	Plus = "Plus",
	Minus = "Minus",
	Multiply = "Multiply",
	Divide = "Divide",
	Modulo = "Modulo",

	// punctuation
	NewLine = "NewLine",
	Indent = "Indent",
	Dedent = "Dedent",
	StringStart = "StringStart",
	StringEnd = "StringEnd",
	IndexStart = "IndexStart",
	IndexEnd = "IndexEnd",
	ArgumentStart = "ArgumentStart",
	ArgumentEnd = "ArgumentEnd",

	// special
	EOF = "EOF",
}

export interface Token {
	type: TokenType;
	value: string;
	line: number;
	column: number;
}

export const keywords = new Map<string, TokenType>([
	["base", TokenType.Base],
	["unit", TokenType.Unit],
	["memory", TokenType.Memory],
	["device", TokenType.Device],
	["register", TokenType.Register],
	["instruction", TokenType.Instruction],
	["fetch", TokenType.Fetch],
	["decode", TokenType.Decode],
	["execute", TokenType.Execute],
	["halt", TokenType.Halt],
]);
