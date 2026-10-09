# DSH Memory Manager v1.0.0

[中文](README.md) · [Installation](docs/INSTALLATION_en.md) · [Usage](docs/USAGE_en.md) · [API](docs/API_en.md) · [Changelog](CHANGELOG.md)

Discover resources, edit policies and inspect storage/retrieval triggers by session turn. Sources retain bodies, identities, revisions, permissions and writes; durable DSH history stays authoritative. Manager stores policies and bounded observations, without a second content database or task ledger.

## Installation

The target is DSH `0.2.0-rc.2` with Node.js `^22.19.0 || >=24`. Install from GitHub; restricted repositories require access.

```sh
dsh plugin --profile web add github:Player-MINEPIG/dsh-memory-manager#codex/assembler-integration
```

Restart the selected Host. Use Settings → Memory Manager for global administration, or the conversation tab for the current session. The package includes its DSH bundle and prebuilt client. Configuration defaults to `$DSH_HOME/dsh-memory-manager/config.json`; bodies remain at their sources. See [installation](docs/INSTALLATION_en.md) for upgrades and removal.

## Configuration and presets

Three columns show current value, follow source and source default, with spaced dividers. Untouched fields use source values directly; fields can explicitly follow their source. Source-maintained persistence changing with a fixed resource is described as storage.

Composition applies source default → local fields → referenced preset, then substitutes live defaults for explicitly followed fields. Other preset fields remain effective. Empty values differ from omitted fields. Policy saves are separate from content edits and use source validation, revision and disk CAS; conflicts preserve drafts.

Presets support create, edit, import, export and local overrides of adapter defaults. JSON rules/strategies select trusted Host capabilities without executing JavaScript. See [options](docs/OPTIONS_en.md), [presets](docs/PRESETS_en.md) and the [configuration example](examples/config.json).

## Per-turn activity

Actual DSH `turn/start` events establish headings. Turns remain with no activity, no resources or no rows after filtering; missing turns are never fabricated. Storage/retrieval are independent per turn, without an aggregate past-trigger state. Unknown turn initiators are hidden.

| Status | Evidence |
| --- | --- |
| Retrieval triggered | Content verified in this turn's actual DSH request |
| Storage triggered | Source confirms a committed write in this turn |
| Processing / skipped | Active execution or explicit skip receipt |
| Unrecorded | No matching operation record; not proof of non-use |
| Unconfirmed | Activity without sufficient evidence, or failure/interruption |

Body-read success, rule matches and previews alone do not establish retrieval. Details keep these separate facts. Request inclusion does not prove delivery or model use. Standard/native observes Skill tools and explicit invocations. World-books, MVU and templates use public source receipts and verified historical request references; absent references are never replaced with current previews.

## Optional sources

| Source | Capabilities and boundaries |
| --- | --- |
| DSH Skills | Host/loaded-Agent catalogs, actual session preset/cwd and preset-registry precedence. Read-only catalog/body access; unavailable Agents never fall back globally |
| Tavern world-books / Prompt Template | Optional `tavernMemorySources` v1 defaults, catalogs, bindings and fixed source chains; body access follows source capabilities |
| Tavern MVU | Optional `tavernMvu` v1 reads, CAS edits, decisions and observations; native card writes remain independently authorized by Tavern |
| Prompt Assembler | Independent repository owns optional `memory-manager.resources`; users explicitly select strategies, never automatically changed by Manager |
| Third-party resources | Public adapters, conditions, operations and source decision contracts; no TaskSystem adapter in this version |

Skill is the resource type; source describes loading channel/directory without requiring plugin ownership. The adapter identifies Skills through DSH's registry and retains `provider`; complete directory provenance is not yet exposed. File identity uses provider/path/name. Virtual Skills may declare `metadata.dshResourceIdentity`; unstable identities are view-only and cannot bind persistent policies.

Manager has no Tavern/assembler production dependency and runs with native DSH independently. Standard/native observation differs from optional request-assembly protocol 1: generic assembly requires explicitly prepared core support, while Manager installation never patches core. The legacy world-book HTTP bridge is disabled by default, explicitly loopback-only and read-only. Source failures expose diagnostics.

Removal preserves policies, source bodies and DSH history. Compatible sources revoke delegation and restore defaults for future operations; reinstall reapplies retained policies. No vector engine, summarizer or autonomous scheduler is included.

## Development and documentation

Place this repository and `dsh-prompt-assembler` in sibling directories, then run `npm ci`, `npm run check` and `npm run pack:check`. Assembler is a development dependency only. Real Host checks use synthetic providers; see [validation](docs/VALIDATION.md) for environment variables and browser checks.

- [Usage and status meanings](docs/USAGE_en.md)
- [Developer guide](docs/DEVELOPER_GUIDE_en.md) and [API](docs/API_en.md)
- [Architecture and interactive diagram](docs/ARCHITECTURE_en.md)
- [Assembler integration](docs/ASSEMBLER_en.md) and [sessionless previews](docs/SOURCE_PREVIEW_en.md)

MIT license.
