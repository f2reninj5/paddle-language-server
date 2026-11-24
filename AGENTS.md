# AGENTS.md

## Project overview

**Paddle** is a machine description language. `.pdl` files describe a machine's architecture, including its memory, devices, registers and instructions.

This repository contains **paddle-language-server**, a language server providing static analysis and IDE support for Paddle.

### Scope

This project is responsible for:

- Lexing and parsing `.pdl` files.
- Reporting lexical and syntactic errors.
- Eventually performing static semantic analysis.
- Providing IDE features through the Language Server Protocol (LSP).

This project is **not a simulator**. It must not execute machines, model their runtime behaviour or explain what they compute. Such functionality belongs in the machine project.

The distinction is between understanding how a machine is described (in scope) and understanding what it does (out of scope).

---

## The Paddle language

There is not yet a definitive language specification. `tests/fixtures/lmc.pdl` is currently the best reference for the language's syntax, but it is not exhaustive or immutable.

The language is expected to evolve. The immediate priority is to build a working language server, not to perfect the language design.

- Examine the existing fixture and implementation before making assumptions about syntax.
- Prefer consistency with existing syntax and conventions.
- Do not invent or change syntax unless the requested task requires it.
- When an ambiguity must be resolved, make the smallest reasonable decision and explain it.

---

## Project architecture

The project uses TypeScript and aims to keep language processing independent of LSP protocol details.

The intended processing pipeline is:

**Lexer → Parser → AST → Semantic Analysis → Language Features → LSP Server**

The implementation is incomplete. Some of the following files or directories may not exist yet; they describe the intended architecture.

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
├── features/
│   ├── completion.ts
│   ├── definition.ts
│   ├── hover.ts
│   └── rename.ts
└── server/
    └── server.ts

tests/
└── fixtures/
    └── lmc.pdl
```

### Responsibilities

- **Lexer:** Converts source text into tokens and tracks source positions.
- **Parser:** Enforces the grammar and constructs the AST. Should recover from malformed input and report multiple independent errors where possible.
- **AST:** Defines strongly typed representations of language constructs, with source positions on every node.
- **Diagnostics:** Provides centralised, structured diagnostic types and consistent error messages.
- **Semantic analysis:** Will eventually check things such as undefined references, duplicate declarations and type mismatches. This is a future ambition, not an immediate priority.
- **Features:** Implements editor functionality such as completion, definition, hover and rename.
- **Server:** Handles LSP communication, event registration and publishing diagnostics. Protocol plumbing belongs here, not in individual features.

Keep files focused and maintain the separation of responsibilities. Do not introduce architectural changes unless requested.

---

## Diagnostics and error handling

Useful diagnostics are a high priority.

Errors should explain:

- What processing stage encountered the problem.
- What went wrong.
- Where it happened.
- What was expected, where applicable.
- How it might be corrected.

Prefer:

`Parsing error at line 4, column 12: expected a number after 'base'.`

Over:

`Unexpected token.`

Diagnostics should have stable source positions, use consistent grammar terminology and identify the expected construct where possible. Never expose raw JavaScript errors or unhandled exceptions to users.

Parser recovery is important. Malformed input should not prevent unrelated errors elsewhere in the document from being reported. Recovery must make progress, avoid infinite loops and preserve valid AST information where possible.

Keep diagnostic kinds centralised rather than scattering ad-hoc types and messages throughout the project.

---

## Development conventions

### TypeScript and formatting

Follow the existing code style.

- Tabs for indentation.
- Double quotes for strings.
- Explicit `.js` extensions in relative imports.
- Keep imports organised.
- Keep files and functions focused.
- Prefer explicit types and avoid unnecessary `any` or non-null assertions.

The project uses Node.js ESM (`module: nodenext`, `"type": "module"`) and strict TypeScript, including:

- `strict`
- `noUncheckedIndexedAccess`
- `exactOptionalPropertyTypes`
- `verbatimModuleSyntax`
- `isolatedModules`

Do not weaken compiler settings to make code compile. Handle potentially undefined indexed values and optional properties explicitly.

Biome uses its recommended linting preset and handles formatting and import organisation.

### Dependencies

The developer manages dependency installation.

- Do not install packages or run `pnpm install`.
- Do not introduce dependencies without first explaining why they are needed and waiting for approval.
- Prefer existing dependencies and native functionality.

---

## Development commands

The project uses pnpm, pinned to `11.24.0`.

| Command | Purpose |
|---|---|
| `pnpm dev` | Run the server using tsx |
| `pnpm build` | Compile TypeScript |
| `pnpm test -- --run` | Run tests once |
| `pnpm lint` | Run Biome linting |
| `pnpm check` | Run Biome checks |
| `pnpm check:fix` | Automatically fix Biome issues |

### Validation

The project is under active development and is not necessarily in a buildable state.

- Run relevant checks for the changes you make.
- Run `pnpm check` where possible.
- Run tests or builds only when appropriate for the requested task.
- Do not attempt unrelated fixes to resolve pre-existing failures.
- If a command fails, establish whether your changes caused it and report the result.
- A pre-existing build or test failure must not prevent completion of an otherwise successful task.

Do not use `pnpm check:fix` unless explicitly requested. Fix issues manually.

Never commit generated output, including:

- `src/**/*.js`
- `src/**/*.d.ts`
- `**/*.map`
- `dist/`
- `coverage/`

---

## Scope and working instructions

**Only do what the developer explicitly asks. Do not get ahead of yourself.**

This is one of the most important rules in this project.

- Implement only the requested functionality.
- Do not anticipate future features or implement things that might be useful later.
- Do not independently choose the next item on the roadmap.
- Do not add tests or modify existing tests unless explicitly asked.
- Do not refactor, reorganise, rename or clean up unrelated code.
- Do not introduce abstractions or infrastructure for hypothetical future requirements.
- Do not fix unrelated bugs or warnings.
- Do not change grammar or language behaviour unless the task requires it.

Prefer the smallest possible change. Typically, a task should only require editing one function or one file. If the requested change can be made in one function, do not modify the surrounding code unnecessarily.

Follow the existing implementation and coding style rather than rewriting things to match personal preferences. Only undertake larger rewrites or architectural changes when explicitly requested.

Before making changes:

1. Inspect the current Git status and branch.
2. Examine the relevant code and its surrounding conventions.
3. Identify the precise scope of the requested change.
4. Leave unrelated existing work untouched.

If something is ambiguous, make the smallest reasonable assumption and explain it. Ask before proceeding only when the ambiguity could fundamentally change the requested result.

**Do not interpret a request as permission to improve everything surrounding it.**

---

## Git and commits

Small, incremental commits are mandatory.

- Always work on the current branch.
- Never create a branch unless explicitly requested.
- Commit each meaningful change separately.
- Prefer one file per commit.
- Do not amend commits, rebase or rewrite history.
- Never overwrite, discard or commit unrelated existing work.

Commit tests before their implementation only when the developer has explicitly requested tests.

Use short, imperative, present-tense commit messages.

Examples:

- `Add remaining string token pushes`
- `Write tokeniser code for numbers`
- `Create operator map`
- `Improve parser error messages`

Check `git status` before committing. The development environment configures the commit author identity.

Never commit generated build output.

---

## Final response

Keep the final response brief. State:

1. What was changed.
2. Any assumptions or decisions made.
3. Checks performed and any failures.
4. The commit created.

Be explicit about decisions made without developer direction. Never claim a check passed unless it was actually run.
