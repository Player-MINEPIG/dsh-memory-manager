# Compatibility verification

[中文](VALIDATION_zh-CN.md) · [Installation](INSTALLATION_en.md) · [Usage](USAGE_en.md)

Target DSH 0.2.0-rc.2. Use temporary profiles, synthetic resources and fake model providers through public plugin interfaces; durable DSH history stays authoritative. Installing Manager never patches core. Package v1.0.0, service protocol 1, configuration schema 1 and preset format 1 are independently versioned. Keep run-specific results, revisions, hashes and environments under Git-ignored `.local/`.

## Tests, build and package

Clone manager and assembler into sibling directories, then run:

```sh
npm ci
npm run check
npm run pack:check
npm pack --ignore-scripts
```

Check package.json/lockfile root versions are 1.0.0. Include Host source, prebuilt client, bundle, bilingual docs, CHANGELOG and LICENSE; exclude fixtures, node_modules, private records, user data and temporary paths. Assembler is a development dependency only. Default npm test skips optional Host/third-party checks when their environment variables are absent; skips do not establish integration acceptance.

## Official stock Host native path

Set `DSH_MEMORY_RUNTIME` to an official stock runtime and `DSH_MEMORY_TAVERN` to a Tavern checkout implementing the relevant source protocols. Run:

```sh
node --test test/native-skill-evidence-host.test.mjs test/native-mvu-history-host.test.mjs test/native-template-evidence-host.test.mjs
```

Skill checks cover catalog lookup versus invocation, tools/explicit instructions, reads versus inclusion, transformed output removing the body, and an empty first turn. MVU checks native world-book macros and exact historical references; templates cover successful self/dependency reads, actual inclusion and omission. These explicitly require stock behavior; prepared runtimes are not substitutes.

## Optional prepared assembly path

Set `DSH_MEMORY_RUNTIME` to a prepared protocol-1 runtime, `DSH_MEMORY_TAVERN` and `DSH_MEMORY_MVU` to current Tavern source, and `DSH_MEMORY_CORE` to assembler's `core-extension` directory. Run:

```sh
node --test test/host-integration.test.mjs test/world-book-observation-host.test.mjs test/native-worldbook-history-host.test.mjs test/mvu-integration.test.mjs
```

Check exact requests/version references, world-book defaults/denial, verified historical restoration, MVU writes/receipts, source CAS/grants, cancellation/reload/removal and native execution after Manager unload. The native-worldbook-history fixture exercises native history projection on a prepared Host, not stock. Do not run the whole npm test with one runtime expecting both groups to pass. Models are synthetic, without online requests. Enable optional independent MVU dependency checks separately with `DSH_MEMORY_MVU_DEPENDENCY`; they never replace current Tavern coverage.

## Source catalogs and bindings

Set `DSH_MEMORY_SOURCES` and `DSH_MEMORY_MVU` to current Tavern source and `DSH_MEMORY_RUNTIME` to stock runtime, then run:

```sh
node --test test/native-session-catalog.test.mjs test/managed-sources-runtime.test.mjs test/scope-session.test.mjs
```

This covers native Skill catalogs, source defaults/bindings, template CAS, preparation versus inclusion, and directory policies remaining independent of native card authorization.

## Browser and lifecycle

Use an authorized isolated profile for Settings/conversation views, details, options, presets, retry and navigation cancellation on desktop/narrow layouts. Distinguish loading, missing sessions, failed sources and empty catalogs.

- Current/follow/default columns with spaced dividers, immediate draft composition, source changes, retained preset fields, restore defaults and CAS conflicts.
- Fixed-resource persistence, preset-only Skills, per-turn trigger columns, policy skips, failures/interruption and independent concurrent storage/retrieval.
- Empty first turns, no resources and all rows filtered out still preserve headings; unknown initiators stay hidden and missing numbers are never fabricated.
- Preset create/edit, adapter-default overrides, export/reimport and atomic rejection of malformed/unsupported imports, preserving file, revision and drafts.

Lifecycle writes use separate synthetic fixtures. Compare source data, DSH history, assembler strategies and Manager policies across removal/reinstall. Removal revokes compatible delegation/generic contributions; reinstall reapplies retained rules. Never write user policies for acceptance tests. Record browser acceptance separately from synthetic Host passes. Do not send online requests without authorization; local tests do not establish external provider delivery, arbitrary third-party compatibility or unavailable desktop acceptance.
