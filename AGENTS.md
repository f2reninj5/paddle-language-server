# AGENTS.md

## Project overview

**Paddle** is a machine description language. A `.pdl` file describes a machine's architecture, including its memory, devices, registers, instructions and instruction set.

This repository contains **paddle-language-server**, a language server for Paddle.

Its purpose is to provide static language analysis and IDE support for `.pdl` files. It is not a machine simulator.

### Scope and boundaries

The language server is responsible for:

- Lexing and parsing Paddle source files.
- Reporting lexical and syntactic errors.
- Eventually performing static semantic analysis.
- Providing language-server features such as completion, go-to-definition, hover and rename.
- Communicating with editors through the Language Server Protocol (LSP).

It must NOT:

- Execute or simulate described machines.
- Model machine execution, memory behaviour or instruction processing.
- Explain what a described machine computes or how it behaves.
- Implement functionality that requires understanding the runtime behaviour of a machine.

If a requested feature requires simulation or understanding what a machine does, it belongs in the machine project, not this repository.

**Always distinguish between describing a machine's structure and understanding its behaviour.** The former is this project's responsibility; the latter is not.

---

## The Paddle language

### Current specification

There is not yet a definitive, immutable language specification.

`tests/fixtures/lmc.pdl` is currently the best reference for the language's syntax and intended constructs. It describes a Little Man Computer, which is one example of a machine that Paddle can describe.

Treat this fixture as the current reference, not as an exhaustive or permanent specification.

The language is expected to evolve. The immediate priority is to build a working language server for the language as it currently exists, rather than delaying implementation to perfect the language design.

### Rules for language changes

- Do not invent syntax without a clear reason.
- Prefer consistency with existing syntax and conventions.
- Examine `tests/fixtures/lmc.pdl` and the existing lexer/parser implementation before making assumptions.
- When the intended syntax is genuinely ambiguous, make the smallest reasonable decision and explicitly document it.
- Do not treat the current LMC example as the only kind of machine Paddle can describe.
- Avoid introducing language features merely because they would be convenient to implement.

When introducing or changing a grammar rule:

1. Add or update a parser test covering the new syntax.
2. Update `tests/fixtures/lmc.pdl` if the grammar change affects the example.
3. Commit the tests before the implementation they verify.
4. Implement the grammar change.
5. Run the relevant validation.

The fixture and parser test should be committed together when they describe the same grammar change.

---

## Project architecture

The project is written in TypeScript and uses an editor-independent language-processing architecture.

The intended processing pipeline is:

Lexer → Parser → AST → Semantic Analysis → Language Features → LSP Server

The implementation is still in progress. Some directories and files described below may not exist yet. They represent the intended architecture, not a claim that the functionality is already implemented.

### Intended source structure

```text
src/
├── index.ts
├── lexer/
│   ├── cursor.ts
│   └── lexer.ts
├── parser/
│   ├── ast.ts
│   └── parser.ts
├── diagnostics/
│   └── diagnostics.ts
├── semantic/
│   └── ...
├── features/
│   ├── completion.ts
│   ├── definition.ts
│   ├── hover.ts
│   └── rename.ts
└── server/
    └── server.ts

tests/
├── fixtures/
│   └── lmc.pdl
├── lexer/
├── parser/
├── diagnostics/
├── semantic/
└── features/
```

This is an architectural guide, not a requirement to create every listed file immediately. Add files when the relevant functionality is requested.

Keep files small and focused. Prefer separate modules for distinct responsibilities rather than building large, general-purpose files.

### Architectural responsibilities

**Lexer (`src/lexer/`)**

Converts source text into tokens.

- Responsible for recognising lexical constructs.
- Must track source positions.
- Must report lexical errors with useful locations.
- Must not concern itself with parsing or machine semantics.

**Parser (`src/parser/`)**

Consumes lexer tokens and constructs an AST.

- Responsible for enforcing the Paddle grammar.
- Must preserve source positions on AST nodes.
- Must recover from malformed input wherever reasonably possible.
- Must report errors without unnecessarily abandoning the remainder of the document.
- Must not implement LSP protocol functionality.

**AST (`src/parser/ast.ts`)**

Defines the representation of Paddle source constructs.

- Provide appropriate node types for language constructs.
- Every node must carry source-position information.
- Prefer explicit, strongly typed node definitions over loosely typed objects.
- Keep the AST independent of LSP protocol types.

**Diagnostics (`src/diagnostics/`)**

Provides a consistent representation of errors and warnings.

- Centralise diagnostic kinds and their definitions.
- Diagnostics should be structured values, not ad-hoc strings.
- Preserve source positions through every processing stage.
- Provide consistent, user-facing diagnostic messages.

**Semantic analysis (`src/semantic/`)**

Will eventually analyse relationships and correctness beyond grammar.

Potential responsibilities include:

- Undefined references.
- Duplicate declarations.
- Invalid relationships between declared components.
- Type mismatches.
- Invalid instruction operand counts.
- Other statically detectable inconsistencies.

These checks are future ambitions, not immediate implementation priorities. Only implement them when requested.

**Language features (`src/features/`)**

Contains editor-facing language functionality.

Features should operate on the language's own structures and abstractions, not directly on LSP wire types.

The intended features include:

- Completion.
- Go-to-definition.
- Hover.
- Rename.
- Find references.
- Document symbols.
- Signature help.
- Semantic tokens.
- Code actions and quick fixes.
- Formatting.

Not all features need to exist immediately. Implement the specific feature requested without unnecessarily expanding scope.

**LSP server (`src/server/`)**

Handles communication with editors through the Language Server Protocol.

- Own protocol connections and event handlers.
- Translate between LSP types and internal project abstractions.
- Register and expose language features.
- Publish diagnostics.
- Keep protocol plumbing here rather than distributing it across the codebase.

The language-processing implementation should remain independently testable without an LSP connection.

---

## Diagnostics and error messages

High-quality diagnostics are one of the project's highest priorities.

A useful error should explain:

1. What processing stage encountered the problem.
2. What went wrong.
3. Where it happened.
4. What was expected, where applicable.
5. How the user could plausibly correct it.

For example, prefer:

`Parsing error at line 4, column 12: expected a number after 'base'.`

Over:

`Unexpected token.`

### Diagnostic requirements

- Include a stable source position.
- Use line and column information suitable for editor integration.
- Identify the offending token or source span where possible.
- Describe the expected construct, not merely that something was unexpected.
- Include a suggestion when the grammar provides a plausible explanation.
- Use consistent terminology from the Paddle grammar.
- Never expose raw JavaScript errors or implementation details to users.

Do not allow malformed input to produce unhandled exceptions or raw `undefined` access errors.

### Error recovery

Error recovery is a fundamental parser requirement.

A malformed document should not prevent the parser from identifying unrelated errors elsewhere in the document.

- Recover at appropriate grammar boundaries.
- Avoid infinite loops during recovery.
- Ensure the parser always makes progress after an error.
- Preserve as much valid AST information as possible.
- Report multiple independent errors in a single parsing pass.
- Do not silently discard malformed constructs without reporting them.

Recovery should favour useful diagnostics over attempting to construct a misleading AST from invalid input.

### Diagnostic architecture

Keep diagnostic kinds centralised in `src/diagnostics/`.

Do not scatter ad-hoc diagnostic types, codes or message formats throughout the lexer, parser and server.

Every new diagnostic kind must have a corresponding test.

---

## Testing

Testing is a first-class part of development, not something to add after implementation.

The existing test coverage is limited. Treat expanding it as part of every feature.

### Requirements

Every feature must have tests covering:

- At least one successful case.
- At least one failure or invalid-input case.

Add further tests for important edge cases, especially around parsing and error recovery.

Tests should be placed under `tests/` in directories corresponding to the functionality they exercise.

Keep fixtures under `tests/fixtures/`. Prefer small, focused fixtures over large examples when testing individual behaviours.

### Test quality

- Test observable behaviour rather than implementation details.
- Ensure error tests verify the actual diagnostic and its source position.
- Test recovery where relevant.
- Do not weaken tests merely to make an implementation pass.
- If a test fails, investigate whether the implementation or the test's assumption is wrong.
- Do not remove or relax existing coverage without a good reason.

A diagnostic without a test is unfinished.

### Running tests

Use:

```bash
pnpm test -- --run
```

This runs Vitest in non-interactive mode and provides an exit code suitable for automated validation.

---

## Code style and TypeScript

Follow the existing project conventions.

### Formatting

- Tabs for indentation.
- Double quotes for strings.
- Follow the existing Biome configuration.
- Keep imports organised.
- Do not introduce unnecessary formatting or stylistic changes outside the scope of the task.

`biome.json` uses the recommended linting preset and automatic import organisation.

### TypeScript

The project uses strict TypeScript.

Important compiler settings include:

- `strict`
- `noUncheckedIndexedAccess`
- `exactOptionalPropertyTypes`
- `verbatimModuleSyntax`
- `isolatedModules`

Do not weaken these settings to make code compile.

In particular:

- Treat indexed values as potentially `undefined`.
- Handle optional properties correctly.
- Avoid unnecessary non-null assertions.
- Prefer explicit types and well-defined interfaces.
- Avoid `any` unless there is a compelling reason.

The project uses Node.js ESM with `module: nodenext` and `"type": "module"`.

Use explicit `.js` extensions in relative imports:

```typescript
import { Cursor } from "./cursor.js";
```

Do not use extensionless relative imports.

### Dependencies

The developer manages dependency installation.

- Do not run `pnpm install` or independently install packages.
- Do not introduce new dependencies without first explaining why they are needed.
- If a task genuinely requires a new dependency, explain the requirement and wait for the developer to handle installation.
- Prefer existing project dependencies and native TypeScript/Node.js functionality where practical.
- Do not replace existing dependencies without an explicit reason.

---

## Development commands

The project uses pnpm, pinned to version `11.24.0`.

| Command | Purpose |
|---|---|
| `pnpm dev` | Run the server using tsx |
| `pnpm build` | Compile TypeScript |
| `pnpm test` | Run Vitest interactively |
| `pnpm test -- --run` | Run tests once |
| `pnpm lint` | Run Biome linting |
| `pnpm check` | Run Biome checks |
| `pnpm check:fix` | Automatically fix Biome issues |

### Validation after changes

The project is under active development and is not necessarily in a buildable state. Do not assume that the existing codebase compiles or that all tests pass.

After making changes:

1. Run relevant tests for the functionality being changed.
2. Run `pnpm test -- --run` where the existing test infrastructure permits.
3. Run `pnpm check` to catch linting and formatting issues.
4. Run `pnpm build` only when it is reasonably expected to succeed or when the requested task specifically requires build validation.

If a command fails:

- Determine whether the failure was introduced by your changes or already existed.
- Do not attempt unrelated fixes simply to make the entire project build.
- Do not let pre-existing failures prevent completion of the requested task.
- Report failures clearly in your final response.

**A task is not incomplete merely because unrelated parts of the project do not yet build or pass tests.**

Do not use `pnpm check:fix` unless explicitly requested. Fix formatting and lint issues manually.

### Build output

The TypeScript compiler emits JavaScript, declaration files and source maps alongside the source files.

Never commit generated build output.

In particular, do not commit:

- `src/**/*.js`
- `src/**/*.d.ts`
- `**/*.map`
- `dist/`
- `coverage/`

Check `git status` before committing.

---

## Git and commits

**Small, incremental commits are mandatory.**

Do not accumulate an entire task into one large commit.

### Commit workflow

- Always work on the current branch.
- Never create a new branch unless explicitly requested.
- Commit after every meaningful change.
- Prefer one file per commit.
- If multiple files are changed in one commit, they must be closely related parts of the same change.
- Commit tests before the implementation they verify.
- Do not amend existing commits.
- Do not rebase or rewrite history.

The commit author identity is configured by the development environment. Use the existing Git configuration.

### Commit messages

Use short, imperative, present-tense messages.

Examples:

- `Add remaining string token pushes`
- `Write tokeniser code for numbers`
- `Create operator map`
- `Test parser recovery after invalid declarations`
- `Add source positions to AST nodes`

Avoid vague messages such as `Update code`, `Fix stuff` or `Implement changes`.

### Protect existing work

Before making changes:

- Inspect `git status`.
- Inspect the current branch.
- Identify existing uncommitted changes.
- Do not overwrite, discard, reset or commit unrelated work.
- Do not assume that all uncommitted changes belong to you.

Never use destructive Git commands to clean up the working tree.

---

## Working with the developer

The developer will request specific features or tasks. Implement the requested scope rather than independently choosing the next item on a roadmap.

### Autonomy

Work pragmatically and independently.

- Investigate the existing implementation before making changes.
- Follow established conventions where possible.
- Make reasonable, reversible decisions without unnecessarily interrupting the developer.
- Avoid asking questions when the answer can be established by examining the codebase.
- Do not introduce unrelated improvements or speculative functionality.

When a decision is necessary but not explicitly specified, make the smallest reasonable decision consistent with the project's goals and architecture.

**Always disclose decisions that were made without explicit developer direction.**

This includes:

- Assumptions about language syntax.
- Architectural choices.
- Error-recovery strategies.
- Changes to existing behaviour.
- Trade-offs or limitations.
- Any deviation from the apparent intended design.

Explain the reasoning briefly in the final response.

If an ambiguity could fundamentally change the intended language, architecture or scope, ask before proceeding.

### Scope control

Do not:

- Implement unrelated features.
- Refactor working code without a clear benefit to the requested task.
- Change the language specification unnecessarily.
- Add dependencies without approval.
- Replace existing functionality when an additive change is possible.
- Create speculative abstractions for hypothetical future requirements.

Prefer the smallest complete implementation that satisfies the requested feature.

---

## Final checklist

Before considering a task complete, verify:

- [ ] The requested functionality is implemented.
- [ ] Existing functionality has not been unintentionally broken.
- [ ] Tests cover successful and failing behaviour.
- [ ] Parser recovery is tested where relevant.
- [ ] Diagnostics have appropriate source positions and useful messages.
- [ ] Relevant tests pass, or existing failures are documented.
- [ ] Lint and formatting checks pass for the changes made.
- [ ] Build validation is performed only when appropriate.
- [ ] No generated build output is committed.
- [ ] Changes have been committed incrementally.
- [ ] Commit messages follow the project's conventions.
- [ ] Unrequested changes have been avoided.

In the final response, briefly explain:

1. What was implemented.
2. Any important decisions or assumptions made.
3. Tests and checks performed, including any failures.
4. The commits created.
