# DSH Memory Manager

[中文](README.md)

A DSH plugin for managing Skills, world-books, MVU state and prompt templates. Browse resources, configure when they are stored or retrieved, reuse presets and inspect which operations occurred in each conversation turn.

## Quick Start

Requires DSH `0.2.0-rc.2` and Node.js `^22.19.0 || >=24`.

### 1. Install

```sh
dsh plugin --profile web add github:Player-MINEPIG/dsh-memory-manager#codex/assembler-integration
```

Replace `web` if you use another profile. Restricted repositories require GitHub access.

### 2. Open the resource catalog

Restart DSH with that profile and open Memory Manager in Settings. Browse resources from connected sources, their current configuration and storage/retrieval presets.

DSH Skills are supported directly. World-books, MVU and templates require [DSH Tavern](https://github.com/Player-MINEPIG/dsh-tavern). Catalog contents depend on sources available to the Host and loaded sessions.

### 3. Inspect and configure session resources

Open an existing conversation, select the Memory Manager tab and expand a turn to inspect storage/retrieval status. Open a resource's management configuration, choose source defaults or local rules/presets, then save the configuration.

Turns remain visible even without resource activity. See the [usage guide](docs/USAGE_en.md) for more operations.

## Features

- **Browse resources**: global Settings administers catalogs; the conversation tab shows resources available to that session.
- **Configure operations**: choose timing, conditions and steps supported by each source, with field-level following of source defaults.
- **Reuse presets**: create, edit, import and export storage/retrieval combinations for multiple resources.
- **Inspect turn activity**: separate retrieval/storage triggers and details for skips, failures and body reads.

The editor compares current values with source defaults. Untouched fields inherit defaults; explicitly followed fields update when their source changes. Other preset fields remain effective. See [configuration](docs/USAGE_en.md#edit-policies).

## Resources

| Resource | Integration |
| --- | --- |
| Skill | Native DSH Skill registry; catalog and body reads |
| World-book, MVU state, prompt template | Tavern source services; operations follow source capabilities |
| Third-party resources | Public adapter interface; see the [developer guide](docs/DEVELOPER_GUIDE_en.md) |

The plugin uses existing source resources. Sources manage bodies, access and writes. Removal preserves management configuration, resource data and DSH session history.

## What triggered means

**Retrieval triggered** means resource content entered this turn's DSH request. **Storage triggered** means its source confirms a committed write in this turn. Successful body reads are recorded separately. Unrecorded means evidence is absent, not proof of non-use.

To provide generic resources to the model through management policies, select `memory-manager.resources` in [Prompt Assembler](https://github.com/Player-MINEPIG/dsh-prompt-assembler) and use a Host supporting request-assembly protocol 1. Native DSH Skill invocation does not require this step. See [assembler integration](docs/ASSEMBLER_en.md).

## Documentation

- [Install, upgrade and remove](docs/INSTALLATION_en.md)
- [Usage](docs/USAGE_en.md) and [presets](docs/PRESETS_en.md)
- [API](docs/API_en.md), [options](docs/OPTIONS_en.md) and [developer guide](docs/DEVELOPER_GUIDE_en.md)
- [Architecture](docs/ARCHITECTURE_en.md) and [compatibility validation](docs/VALIDATION.md)
- [Changelog](CHANGELOG.md)

[MIT License](LICENSE)
