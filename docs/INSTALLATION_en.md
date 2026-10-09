# Install, upgrade and remove

[中文](INSTALLATION.md) · [README](../README_en.md) · [Usage](USAGE_en.md)

## Install

Requires DSH `0.2.0-rc.2`, Node.js `^22.19.0 || >=24` and repository access. Stop the Host using the target profile, then run:

```sh
dsh plugin --profile web add github:Player-MINEPIG/dsh-memory-manager#codex/assembler-integration
```

Replace `web` with your profile name and restart DSH. Open Memory Manager in Settings to browse resources, or use the conversation tab to inspect turn activity.

The plugin includes a prebuilt client. Configuration defaults to `$DSH_HOME/dsh-memory-manager`. First startup creates empty configuration and uses source defaults. Errors reading existing configuration preserve the file and display a diagnostic.

## Optional integrations

DSH Skills use the Host/session Skill registry directly. Install Tavern to connect its world-book, MVU and template services. Supported operations appear in resource configuration.

To add generic resources to model requests through Manager policies, select `memory-manager.resources` in Prompt Assembler and provide request-assembly protocol 1. See [assembler integration](ASSEMBLER_en.md) for setup and interfaces.

## Upgrade

Stop the Host, update with the installation command in the same profile and restart. Retain `$DSH_HOME/dsh-memory-manager` to keep configuration. Version 1.0.0 uses configuration schema 1 and preset format 1 without a data migration.

## Remove

Stop the Host and remove the plugin from its original profile:

```sh
dsh plugin --profile web remove dsh-memory-manager
```

Removal preserves configuration, observations, source resources and DSH history. Sources supporting default delegation recover their own policies; reinstall reapplies retained management configuration.

For development setup, see the [developer guide](DEVELOPER_GUIDE_en.md) and [validation](VALIDATION.md).
