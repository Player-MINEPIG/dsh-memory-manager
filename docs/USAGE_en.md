# Using Memory Manager

[中文](USAGE.md) · [README](../README_en.md) · [Installation](INSTALLATION_en.md)

## Open and query

Settings administers global catalogs/policies; the conversation tab uses actual session visibility. Skills follow Agent preset/cwd; card resources require current source bindings. Old policies, selectors and observations never establish bindings. Global Skills combine Host/loaded sessions without mounting Agents.

DSH may hide all tabs before a message; global Settings remains available. Read failure, missing session and empty catalogs are distinct. Query scope shows adapters/counts. GET reads can be retried after 30 seconds; saves do not use that timeout.

## Turns and triggers

Actual durable `turn/start` events establish headings even without activity. Expansion shows an activity-empty notice. Current catalogs/configuration may still appear; this does not imply those resources existed or were used historically. Filtering out all rows preserves headings. Missing turn numbers are never fabricated.

Retrieval requires actual request inclusion; storage requires a source-confirmed committed write in that turn. Each column is independent. Loading, evaluation, permission, starts and previews alone cannot establish retrieval; details keep separate facts. Inclusion does not prove delivery or model use.

Unrecorded is not proof of non-use; unconfirmed means activity without trigger evidence or failure/interruption. Bounded observations and verified historical references provide evidence; current previews never replace missing references. Human, task or system initiators appear only when explicitly recorded; unknown labels are hidden.

## Edit policies

Compare current value, follow source and source default. Untouched fields take defaults; field options select following or local values. Missing default contracts report reasons without inventing policies.

After source default → local → referenced preset composition, explicitly followed fields take live defaults. Selector lists, trees and chains replace whole fields; explicit empty values matter. Restore defaults changes only this resource's draft overrides/preset reference and persists after save. Safe unknown extensions remain; identity fields are read-only.

Options support search, trees, parameters and chains. Save-and-return only updates the parent draft; final save checks source capabilities, revision and disk contents. Conflicts retain drafts. Body edits use independent source permissions/CAS. See [presets](PRESETS_en.md).

## Skill type and source

DSH's Skill registry identifies resources, without name/body heuristics. `skill` is the type; providers such as `filesystem` describe loading channels. Workspace `.dsh/skills`, `.agents/skills`, user, custom and bundled roots describe actual origin without requiring plugin ownership. Current metadata retains provider, without complete directory provenance.

File identity uses provider/path/name. Virtual providers can declare stable identity; otherwise resources are view-only and cannot persistently bind policies. Bodies are read-only. Catalog visibility does not prove invocation, and reads do not prove inclusion. Native tools and explicit invocations distinguish these facts.

## Source execution and removal

Fixed-resource persistence is source-maintained storage without requiring a Manager write. Native MVU card operations use Tavern bindings, switches, grants, schema and CAS; Manager observes without granting permissions.

Preview emits no inclusion receipt. Generic assembler contributions require explicit source selection and Host capability. Removal preserves policies, source data and DSH history. Compatible sources restore defaults for future operations; reinstall reapplies retained policies.
