# Store and retrieve presets

[中文](PRESETS.md)

The resource table's preset page supports creation, editing, JSON import and export of one or all presets. A preset contains reusable `type / store / retrieve` combinations. It contains no content, resource identity, scope lists or nested preset reference. Select and save a preset in resource configuration. Its explicit fields continuously override local values; omitted fields still use source defaults or local values.

An adapter can declare several defaults in `optionCatalog.presets`. Custom default IDs become `adapter:<adapterId>:<presetId>`; supported built-in IDs retain their names. Reading defaults does not write files. Explicitly saving a resource reference persists only the selected new default definition. Editing a default saves a local override under the same ID. Editing a referenced preset affects its consumers and requires validation by all affected resources' sources before saving. Sources retain content, bindings, permissions and native execution.

## Portable files

```json
{
  "format": "dsh-memory-manager-presets",
  "version": 1,
  "presets": [{
    "id": "my-skill-read",
    "label": "Read skill before request",
    "description": "Read skills within an authorized scope",
    "adapterIds": ["dsh.skills"],
    "configuration": {
      "type": "skill",
      "retrieve": {
        "on": "before_model_request",
        "rule": true,
        "strategy": [{"operation": "memory.read_content"}, {"operation": "memory.to_text"}]
      }
    }
  }]
}
```

Files are limited to 2 MB and 1–200 items. Each item needs a unique nonempty ID, label and one or more target adapters; description is optional. Configuration must contain store or retrieve, whose only fields are `on / rule / strategy`. Unknown file/configuration fields, malformed rules or steps, unknown conditions/operations, undeclared parameters, unsupported types/modes/events, incompatible fixed order and missing/disabled adapters reject the entire batch. Fields are never silently stripped; partial imports never occur. Every target adapter must accept the combination. Parameters must match registered descriptors; source-owned strategies use only steps and parameters actually declared by the source.

Import never overwrites an existing ID, including defaults; use a new ID. Editing explicitly replaces a definition. Export includes only portable fields, without runtime origin/available/revision. Another environment validates the file against its current capabilities. Legacy local presets without adapter metadata remain readable, but editing requires explicit target adapters.

## Adapter and API integration

Add `presets: [{id, label, description?, configuration}]` to an existing option catalog. Definitions must satisfy this structure and the adapter's capabilities. Catalog declarations do not activate presets or grant scope/write permissions. Optional async `validatePreset(configuration)` adds resource-independent validation and throws on rejection; it must not read content or execute strategies.

- `presetLibrary()` returns defaults with local overrides.
- `validatePresets(bundle)` returns `{valid, presets, revision}` without writes, resource reads or rule execution.
- `savePresets({bundle, expectedRevision, replace?})` validates and atomically saves a batch. `replace` defaults to false; editing explicitly sets true.
- HTTP: `GET /api/dsh-memory-manager/presets`, `POST .../validate-presets` with `{bundle}`, and `POST .../save-presets` with save arguments. Existing Host authentication applies; POST requires same-origin JSON and `X-DSH-Memory-Manager: 1`.

Saves use the existing serialized configuration queue and compare revision, complete disk content and capability registrations throughout validation. Success updates only preset definitions and `presetMetadata`, increments revision once, syncs a temporary file and atomically replaces the original. Failure/conflict preserves the file and UI draft. Editing a referenced preset also validates every affected resource; an unavailable source rejects the save instead of bypassing its contract.

## Read states

Configuration and option catalog reads finish independently. A stalled catalog does not conceal loaded configuration. Browser GET reads exceeding 30 seconds display a read timeout with retry and cancel their request. Timeout does not mean resource absence or source removal. Session-reader initialization, confirmed absence and read failure remain distinct. Mutations do not use the GET timeout because cancelling transport cannot establish that the server did not write.
