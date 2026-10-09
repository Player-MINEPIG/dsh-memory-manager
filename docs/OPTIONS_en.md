# Option catalog protocol 1

[中文](OPTIONS.md) · [API](API_en.md) · [Presets](PRESETS_en.md)

GET /options describes registered capabilities as JSON and returns version:1 and catalogRevision. It never registers code, grants access, selects assembly sources, changes ownership or runs strategies. Resource IDs and assembly source IDs are distinct. Registrations, unload, same-function ABA registration, descriptor changes and enable state invalidate the catalog; editors may send expectedCatalogRevision separately from expectedRevision.

## Source declarations

optionCatalog has version/types/events/strategies/presets/modes. Types use id/label/description?; events additionally mode:store|retrieve; strategies use mode/events/value (a real operation chain); presets carry reusable configuration with type/store/retrieve only, excluding identity/content/provider/scopes. modes declare supported/reason?/onSelection:single|multiple/strategySelection:fixed|chain. Missing support is unknown. These are descriptors, not executable implementations; see the runnable [adapter example](examples/notes-adapter.js).

Source-owned adapters declare strategyOwner:'source', validateConfig and their actual fixed ordered chain. Usage decisions return enabled/reason?/configRevision/strategy/checkCurrent; the source must synchronously recheck the lease after its final await. Registration-based source defaults and legacy explicit ownership remain distinct. No generic execution may repeat a source-owned chain.

## Conditions, operations and parameters

Trusted Host registerCondition/registerOperation may declare label/description/adapterIds/types/modes/parameters. Parameters use string/number/integer/boolean/object/array, scalar enum, object properties/required and array items. Supported bounds include numeric minimum/maximum, string minLength/maxLength, array minItems/maxItems. No $ref, expressions, HTML components or unknown schema properties. Limits: depth 5, 300 schema nodes, 1000 expanded default items, default string 10000 characters/array 100 items, registration 64 KB/source catalog 256 KB, 200 entries per option class. Empty applicability arrays add no restriction. Undescribed legacy params remain preserved and explicitly uneditable rather than guessed. Validation/save and runtime check the same capabilities.

## Editing and local combinations

UI pages select registered options and expose applicability as a hint; final validation/save determines compatibility. Draft navigation and save-and-return modify only parent page memory. Explicit save writes configuration through revision/disk CAS and keeps drafts on conflict. Clearing a child differs from removing the entire store/retrieve mode; an explicit empty mode stays meaningful and preset overrides remain active. Unknown safe JSON extension members/condition params are preserved.

The local configuration catalog may contain arrays rules/strategies, with id/label/value and optional description/adapterIds/modes. These are named JSON combinations referencing trusted registrations, never code. Maintain them with a higher revision and reload; preserve existing entries/presets. Invalid descriptors reject publication and preserve the current valid document. Filters use canonical values, OR within fields, AND across, and do not evaluate conditions.

## Presets and routing

Builtins: builtin:skill-retrieve, builtin:mvu-managed, builtin:worldbook-retrieve, builtin:prompt-template-retrieve. No default native-card interaction preset is offered; unsupported old definitions are inspectable but cannot be imported/saved. User same-ID definitions override builtins. Adapter defaults use adapter:<adapterId>:<presetId>; explicit save materializes selected definitions. Reusable presets exclude whitelist/blacklist; user scope is local. See [portable preset format](PRESETS_en.md).

adapterId is a rule route, sourceAdapterId retains the authoritative body provider. A cross-route requires read-only validateResourceRoute confirming supported:true with exact id/sourceAdapterId; source-owned fixed strategies cannot be rerouted. No body migration, permission change or identity copy occurs. Optional body editing remains separate from configuration. Manager runtime resource/directory toggles revoke leases without deleting data; restart restores defaults.

## Scope and defaults

Scope choices are global/sessionId/workspaceId/characterId/presetId/userId. Labels are not identities or access grants; facts are resolved by trusted Host directory leases. DSH cold directories retain bounded public headers with zero-I/O cached titles; no body read or Agent activation. Defaults are 2000 records/1 MB/3-second wait/15-second TTL, configurable up to tenfold. Upstream enumeration is not paginated. Optional Tavern metadata catalogs provide character/ST preset/Persona IDs; missing capability never falls back to body lists.

getManagementDefaults supplies a versioned body-free source-bound policy, distinct from option presets. Effective precedence is source default → local → referenced preset, followed by live source defaults for explicitly followed fields; explicit empty scopes/modes and denial remain. Restore-source-defaults edits only this resource's known overrides/preset/alternate route in the draft, preserving opaque fields, body and global presets. It takes effect through normal validate/save CAS. Native card-variable authority stays source-owned.

## Rendered documentation and model use

GET /documentation?document=OPTIONS renders bundled Markdown with escaped inputs and a no-script CSP under Host admission. API/VALIDATION/README/PRESETS are also supported. Native Skill tools and explicit invocations remain available without assembler. Manager-driven generic resource provision, including configured Skill retrieval, requires the explicit assembler memory-manager.resources rule; world books, MVU and templates contribute through their own source-selected rules, without duplicate Manager provision. Template dependency decisions use the dependency's own scope/rule/strategy and a final source checkCurrent, not the consumer's policy. Detailed native acknowledgement and lifecycle rules are in [API](API_en.md).
