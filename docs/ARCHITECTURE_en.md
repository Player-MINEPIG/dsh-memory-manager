# Memory Manager architecture

[中文](ARCHITECTURE.md) · [Interactive architecture](assets/architecture/memory-manager.en.html) · [Developer guide](DEVELOPER_GUIDE_en.md)

src/index.js mounts dshMemoryManager and optional source/scope services. Settings and conversation.view clients consume admitted HTTP query, detail, options and save primitives. Manager owns config.json and bounded observations.json; source bodies and authority ledgers stay with providers.

The main path is query/explicit save → identity and scoped configuration → adapter list/read or authorized source write. Usage applies frozen rules and registered capabilities; source-owned adapters execute their own fixed chains using revocable decisions. Configuration revision, source revision and catalogRevision are separate. Metadata-only bound catalogs and scope directories do not grant access or activate Agents.

The independent assembler owns the optional memory-manager.resources adapter. Its read-only retrieval excludes MVU and other source-owned execution. Request-included evidence requires verified actual request messages and matching source references; phase labels alone are insufficient. Tavern/assembler are not production dependencies. Manager unload preserves rules and observations and revokes current delegation; compatible Tavern sources recover defaults for new work, while reinstall reapplies preserved rules. Native card writes retain source binding/grants/CAS/schema independently.

Session headings independently read actual turn/start events through public sessionQuery. Native Skill hooks distinguish body-read and request-included receipts. Recorded DSH assemblies and exact Tavern v3 history restore verified per-turn source evidence without writing either journal or history. These observers never replace source execution or network delivery evidence.

Architecture JSON is beside the diagram. The [API](API_en.md), [option contract](OPTIONS_en.md), [presets](PRESETS_en.md) and [assembler integration](ASSEMBLER_en.md) define the composable interfaces.
