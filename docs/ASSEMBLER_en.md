# Prompt Assembler integration

[中文](ASSEMBLER.md) · [Manager API](API_en.md)

To add Skills or third-party generic resources to requests through management policies, enable assembler's `memory-manager.resources` source. Native DSH Skill calls and Tavern's source-owned world-book, MVU and template contributions use their own paths.

## Configure integration

1. Configure retrieval rules and applicable scope for a generic resource in Manager, then save.
2. Select `memory-manager.resources` in the Prompt Assembler strategy.
3. Execute with a Host supporting request-assembly protocol 1. See the [assembler documentation](https://github.com/Player-MINEPIG/dsh-prompt-assembler) for Host preparation.

The Manager source appears when valid generic retrieval configuration exists. Source-owned resources are excluded from this path to avoid duplicate contributions.

## Adapter interface

The request adapter lives in assembler's `adapters/memory-manager.js`. `connectMemoryManager(ctx,registry)` registers or withdraws it with the Host `dshMemoryManager` service lifecycle.

`manager.requestAssemblyResources()` synchronously returns `{available,entries}` with `id,adapterId,configurationSnapshot` per entry. Snapshots contain detached effective configuration/revision; configuration errors return `available:false,entries:[]`. Source-owned adapters, including MVU, are excluded.

The adapter calls `manager.trigger()` in read-only preview mode with session, cancellation and configuration snapshot. Actual request preparation additionally passes `observeRead:true`, recording `content-read`. Matching `request/assembly`, message hashes and source nodes verified at `llm/stream` establish `request-included` for per-turn retrieval status. Preview never produces inclusion receipts.

## Session reads and removal

`withSessionRead({sessionId,signal},callback)` provides a read-only lease for cold persisted sessions. `SESSION_READER_NOT_READY` means initialization (503); `SESSION_NOT_FOUND` means absence (404). The lease neither creates Agents nor appends history.

Removing Manager withdraws its generic request source while preserving source resources and DSH history.
