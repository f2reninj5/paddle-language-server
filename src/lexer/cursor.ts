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
		if (this.position + n > this.source.length) {
			throw new Error("Unexpected end of source");
		}

		return this.source.slice(this.position, this.position + n);
	}

	sliceWhile(predicate: (char: string) => boolean): string {
		let length = 0;

		while (true) {
			const nextChar = this.peek(length);
			if (nextChar === undefined || !predicate(nextChar)) {
				break;
			}
			length++;
		}

		return this.slice(length);
	}

	peek(n: number): string | undefined {
		const index = this.position + n;

		if (index >= this.source.length) {
			return undefined;
		}

		return this.source[index];
	}

	advance(n: number = 1): void {
		this.position += n;
		this.column += n;
	}

	advanceLine(): void {
		if (this.current === "\r" && this.peek(1) === "\n") {
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
