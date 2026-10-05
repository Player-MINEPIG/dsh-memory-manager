# Prompt Assembler integration

[中文](ASSEMBLER.md) · [Manager API](API.md)

The Manager production package does not depend on assembler or Tavern. The optional request adapter lives in the independent assembler repository, `adapters/memory-manager.js`; third parties fork or submit PRs there. Configuration, resource authority and retrieval policies remain with Manager and the source.

`manager.requestAssemblyResources()` synchronously returns `{available,entries}`. Configuration errors return `available:false,entries:[]`, without falling back to stale configuration. Each entry contains `id,adapterId,configurationSnapshot`; the effective configuration and revision are detached from Manager state. Source-owned adapters, including MVU, are excluded from generic request assembly to prevent duplicate insertion.

The adapter calls public `manager.trigger()` in read-only preview mode with the actual session, cancellation signal and configuration snapshot. `connectMemoryManager(ctx,registry)` follows the Host `dshMemoryManager` lifecycle. Its assembler source ID is `memory-manager.resources`. Registration makes it selectable; users still add it to an assembly strategy.

Preview never records applied. The observer records applied only when durable request/assembly evidence, actual message hashes and matching source nodes agree with llm/stream. This proves inclusion in the DSH request, not network delivery. Adapter removal preserves durable evidence and native DSH execution.
