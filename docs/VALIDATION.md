# Validation

Run `npm run check` and `npm run pack:check`. Tests use disposable directories and do not require credentials. The real-core test is opt-in:

```sh
DSH_MEMORY_RUNTIME=/path/to/request-assembly-enabled/runtime \
DSH_MEMORY_TAVERN=/path/to/tavern \
node --test test/host-integration.test.mjs
```

This loads actual DSH Cordis, Session, AgentLoop and Tavern modules. A synthetic provider captures the final request; assertions check content, resource/config revisions, source disposal and preserved native history. It is not an external-provider/network-delivery test. A stock core without request assembly protocol 1 does not satisfy this test.

For actual installation acceptance, use a separate `DSH_HOME`, install this package with `dsh plugin --profile web add`, and start a loopback Web Host. Install the official `dsh-skill-filesystem` provider against a disposable SKILL.md directory, then verify both catalog and exact body through `/api/dsh-memory-manager/query` and `/read`. Merely registering a fake adapter or seeing an empty catalog is insufficient.

For Tavern co-install acceptance, install the intended Tavern build in the same isolated profile, configure the optional loopback base URL, create/import a disposable world book through Tavern's public API, explicitly bind it to a disposable session, and read its body through the manager. Confirm that read-only capabilities, scope and the absence of unproven application events remain accurate. Do not use `/active` preview as historical evidence.

For browser acceptance, inspect the native Settings section and session header action in a real DSH browser: filters, empty/error states, resource reads, supported edits, configuration provenance, session switching and unload. Build success and server-rendered markup do not establish browser acceptance. If the browser tool denies the target URL, preserve that exact error and report the gap; do not bypass its access controls.

MVU acceptance requires the integrated source build exposing `tavernMvu` v1. Test shared IDs across sessions, copy/new IDs, source CAS/idempotency, management ownership loss/error/unload, completed-final-message gates and genuine request evidence. Adapter fixtures alone do not establish this integration. TaskSystem is not implemented by this package.

Keep run-specific logs, screenshots, local paths and private data in ignored `.local/`. Before publication, independently verify the current Awesome contribution rules and public repository age, real commit count, topic and description. Never manufacture commits to pass an external gate.
