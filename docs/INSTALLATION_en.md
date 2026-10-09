# Install and remove

[中文](INSTALLATION.md) · [README](../README_en.md)

Use DSH 0.2.0-rc.2 with Node ^22.19.0 or >=24, stop the selected Host and preserve data before installation. Install from the current branch; restricted repositories require access:

```sh
dsh plugin --profile web add github:Player-MINEPIG/dsh-memory-manager#codex/assembler-integration
```

Restart the same profile. cordis.patch.yml sets storageDir through dshHomePath('dsh-memory-manager'); absent config.json is exclusively created, an existing malformed/unreadable file is preserved and reported. Manager can run without Tavern or assembler. Their source services and the assembler request adapter are optional. No installation patches DSH core or activates a model request.

Settings provide global administration; a separate public conversation.view provides current-session resources and actual DSH turn headings and per-turn source observations. DSH may hide view tabs in blank sessions; Manager does not inject an alternate shell.

Stop Host and remove only the Manager bundle using the public DSH plugin manager. Plugin removal preserves config.json, observations.json, source bodies and native DSH history. Compatible lifecycle sources revoke delegation and recover source defaults; generic Manager assembly contributions disappear. Reinstallation reads saved policies and may deny previously permitted source use again. Do not delete/restore configuration or overwrite sessions as part of reinstall. Legacy source ownership follows its declared contract.

Development expects sibling dsh-memory-manager and dsh-prompt-assembler directories because the latter is a file development dependency. Run npm ci, npm run check and npm run pack:check. Host/browser verification is in [validation](VALIDATION.md); skipped fixture tests do not establish UI acceptance.

## Upgrade

Stop the selected Host, retain `$DSH_HOME/dsh-memory-manager` and update the plugin in the same profile using the command above. No schema migration is needed: configuration schema, service protocol and preset format remain version 1. Do not delete settings or session history to upgrade. Rebuild/restart the Host client as required by the DSH plugin manager.

Remove through the same profile:

```sh
dsh plugin --profile web remove dsh-memory-manager
```

## Optional integrations

Skills work through the existing DSH registry and native tool/request hooks. Tavern sources require their declared public protocols and evidence capabilities; version numbers alone do not establish these optional features. Native historical restoration requires exact request provenance. Generic assembler contributions additionally require explicit source selection and request-assembly protocol 1. Installing Manager does not install or prepare a core extension. See [usage](USAGE_en.md), [assembler integration](ASSEMBLER_en.md) and [validation](VALIDATION.md).
