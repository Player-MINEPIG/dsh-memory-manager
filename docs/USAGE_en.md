# Using Memory Manager

[中文](USAGE.md) · [README](../README_en.md) · [Installation](INSTALLATION_en.md)

## Browse resources

Open Memory Manager in Settings for global catalogs, or select the conversation tab for that session's resources. Skills follow the Agent's preset/workspace; Tavern resources follow the conversation's character, world-book and template bindings.

Filter by provider, type, preset and configuration fields. Conversation filters also include turns and storage/retrieval status. Multiple selections within a field match any selection; different fields must all match. Clear filters to restore the full catalog.

For an empty catalog, check source plugins, Skill availability in the current session and Tavern bindings. Query scope shows sources and counts; retry failed reads through the reload controls. Use global Settings when a blank conversation has no view tabs.

## Edit policies

1. Open a resource's management configuration to compare current values and source defaults.
2. Choose follow source to use a field's default, or open its options to set a local value.
3. Save-and-return from the field page, then save management configuration on the parent page.

Untouched fields use source defaults. Referenced presets override their explicit fields. Fields individually set to follow source take live defaults, while other preset fields remain effective. Selector lists, condition trees and operation chains replace whole values; empty values may disable or deny behavior according to the source.

Restore source defaults removes this resource's local overrides and preset reference after save. Unavailable default rules display a reason. Body editing is separate and depends on source write support. Conflicts preserve drafts; reload configuration and merge changes.

Create reusable combinations in the preset page, then reference them in resource configuration. Editing a preset affects all consumers; see [presets](PRESETS_en.md).

## Inspect turn activity

Expand a conversation turn to inspect storage and retrieval separately. Turns remain even without resource activity. The table shows current configuration alongside activity for the selected turn.

| Status | Meaning |
| --- | --- |
| Retrieval triggered | Content entered this turn's actual DSH request |
| Storage triggered | Source confirms a committed write in this turn |
| Processing | Operation is still running |
| Skipped | Policy or source explicitly skipped it; details show reasons |
| Unrecorded | No corresponding record; not proof of non-use |
| Unconfirmed | Activity without trigger evidence, or failure/interruption |

Details show successful body reads, rule matches and previews separately. Loaded content may not enter the request; inclusion does not prove model use. Missing historical source references can leave status unrecorded.

## Skill type and source

`skill` is the resource type; providers such as `filesystem` describe loading channels. Skills may come from workspace, user, custom or bundled directories without belonging to a plugin. The current adapter exposes provider information without complete directory provenance.

Skill bodies are read-only. Virtual Skills without stable identity can be viewed but cannot persistently bind policies. Providers can declare identity as described in the [developer guide](DEVELOPER_GUIDE_en.md).

## Source persistence and assembly

Fixed-resource content changes with its source, which maintains persistence. Native Tavern MVU card operations follow Tavern execution switches and write grants; this plugin manages model reads and post-reply update policies.

To add generic resources to requests through management policies, select `memory-manager.resources` in Prompt Assembler. Saving policies does not automatically select a request source; see [integration](ASSEMBLER_en.md).
