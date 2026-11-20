function isWindowsNewLine(chars: string): boolean {
	return chars === "\r\n";
}

export class Cursor {
	position: number = 0;
	line: number = 1;
	column: number = 1;

	constructor(private readonly source: string) {}

	get current(): string {
		if (this.isAtEnd) {
			throw new Error("Unexpected end of source");
		}

		return this.source[this.position]!;
	}

	get isAtEnd(): boolean {
		return this.position >= this.source.length;
	}

	slice(n: number): string {
		return this.source.slice(this.position, this.position + n);
	}

	advance(): void {
		this.position++;
		this.column++;
	}

	advanceLine(): void {
		if (isWindowsNewLine(this.slice(2))) {
			this.position += 2;
		} else {
			this.position++;
		}

		this.line++;
		this.column = 1;
	}

	getLocation() {
		return {
			line: this.line,
			column: this.column,
		};
	}
}
