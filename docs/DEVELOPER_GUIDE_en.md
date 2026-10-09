# Third-party integration guide

[中文](DEVELOPER_GUIDE.md) · [API](API_en.md) · [Options](OPTIONS_en.md) · [Assembler](ASSEMBLER_en.md)

Choose the capability you need. A resource adapter makes an authoritative resource visible/readable/editable to Manager. Named conditions/operations expose trusted Host behavior for generic policies. A source-owned usage adapter delegates only a decision while retaining its own execution. An assembly adapter makes model-request contributions and belongs in the independent assembler repository. These are distinct registrations and IDs.

## Minimal read-only resource adapter

The [notes example](examples/notes-adapter.js) implements list/read/validateConfig and a JSON option catalog. The provider's notes service implements list({scope,signal}) → {id,name,revision}[] and read({id,scope,signal}) → {id,name,content,revision}|null, checking its own authorization. Prefix durable IDs, such as example.notes:scene; never derive identity from changing content or reinterpret session scope as a new instance.

```js
import { registerNotesAdapter } from './notes-adapter.js'
export function apply(ctx) {
  return ctx.inject(['dshMemoryManager', 'myNotes'], scope => {
    const manager = scope.get('dshMemoryManager')
    if (manager.protocolVersion !== 1) throw new Error('Unsupported manager protocol')
    scope.effect(() => registerNotesAdapter(manager, scope.get('myNotes')))
  })
}
```

myNotes belongs to the integrating plugin. Scoped injection is optional and lifetime-bound; an absent Manager cannot prevent native provider operation. Every registration returns a disposer. Unload cancels pending calls and observations; late callbacks cannot regain registration. The example has no body update/copy and advertises no unsupported write capability. `catalogScope:'all-sessions'` declares native default visibility, still constrained by provider scope/permissions. A source requiring actual bindings supplies metadata-only listBound and a synchronous revocable checkCurrent instead. Missing binding capability must not fall back to global enumeration.

## Configuration and generic retrieval

Registered resources appear without Manager rules. Visibility is not model use. In the Manager UI the user explicitly configures retrieve, selects the real scope and saves through validation/CAS. A generic note policy may use:

```json
{"id":"example.notes:scene","adapterId":"example.notes","type":"note",
 "whitelist":[{"sessionId":"example-session"}],"blacklist":[],
 "retrieve":{"on":"before_model_request","rule":true,
 "strategy":[{"operation":"memory.read_content"},{"operation":"memory.to_text"}]}}
```

Replace the example session ID with the actual authorized session. The source validates its settings; Manager checks named capabilities, typed params, revision and catalog generation. Save is explicit; no registration rewrites user configuration. For actual generic model provision, independently install assembler and explicitly select its memory-manager.resources rule. The adapter runs read-only preview retrieval and excludes source-owned adapters. No second request hook or direct history write belongs here.

## Conditions, operations and source-owned execution

registerCondition({id,test,label?,description?,adapterIds?,types?,modes?,parameters?}) and registerOperation({id,run,readOnly,...metadata}) return disposers. Conditions receive event/params. Operations receive id/value/event/config/params/preview/signal plus the generated operationId; writes forward stable source intent and enforce provider authorization/CAS/idempotency. Preview rejects non-readOnly operations. JSON config selects trusted registrations and never installs executable code. Missing registry entries fail closed.

For a provider that already performs ordered storage/retrieval, declare strategyOwner:'source' and implement the complete public source decision contract, validateConfig, observe and registerUsage. Manager's current Tavern adapters attach only to their named public services; they do not auto-discover arbitrary services. A third-party source must compose its own trusted usage handler or contribute a supported manager adapter. Merely adding registerUsage to a generic adapter does not automatically install source policy wiring. The source synchronously validates returned checkCurrent after the last await and before using/committing; Manager must never execute the same source chain again. See [API](API_en.md#source-defaults-and-effective-delegation).

Optional getManagementDefaults returns protocolVersion:1, revision, a body-free configuration, scopePolicy:'source-bound', and synchronous checkCurrent. A compatible source interprets trusted registerUsage(handler,{providerId:'dsh-memory-manager'}) as current delegation and restores source defaults on disposal. Configuration error while delegated denies; unload is distinct from permission or stored resource-mode transfer. Legacy providers keep their declared ownership semantics. Manager presets/local selectors cannot grant source authority. Native Tavern card-variable commits are observations independent of Manager policy.

## Editing, identity and observations

Optional update requires expectedRevision and operationId; source owns transactional commit/receipt. Optional copy requires a different newId; Manager reserves identities but is not the authority ledger. Precommit rejection must report committed:false where applicable; ambiguous failure remains MUTATION_OUTCOME_UNKNOWN until authoritative reconciliation. Do not relabel a postcommit error as a safe rejection.

observe(listener) emits started/triggered/applied/skipped/failed/completed with stable eventId and actual session/turn/request identity. Report source facts rather than UI assumptions. Include mode:store|retrieve and explicit evidence:content-read|request-included|write-committed|source-evaluated where supported. Retrieval triggers require request-included; storage triggers require write-committed. A phase such as applied is insufficient on its own. The bounded journal stores at most 2,000 observations; it is not durable idempotency or a replacement history. Applied from assembly requires exact durable request, messages and source nodes matching llm/stream; it does not prove network delivery. Preview produces no applied receipt.

For virtual Skills, metadata.dshResourceIdentity:{version:1,namespace,id} preserves identity through restarts/body changes; provider owns namespace and copy identity. Undeclared virtual Skills remain ephemeral skill-view handles with bind:false. Configuration cannot turn them into durable resources.

## Development setup

Keep Manager and assembler in sibling directories and install each checkout's development dependencies:

```sh
git clone https://github.com/Player-MINEPIG/dsh-prompt-assembler.git
git clone --branch codex/assembler-integration https://github.com/Player-MINEPIG/dsh-memory-manager.git
cd dsh-prompt-assembler
npm ci
cd ../dsh-memory-manager
npm ci
npm run check
```

Assembler is a Manager development dependency; plugin users receive the prebuilt client. See [validation](VALIDATION.md) for Host integration checks.

## Validation and packaging

Run npm run check and npm run pack:check. Test scoped read/list, missing/null resources, source errors, identity conflicts, pure validateConfig, preview writes refused, cancellation/unload, stale revision/catalog/default leases, and supported mutations at the authority. Host/browser acceptance remains separate. Library callers import MemoryManager from dsh-memory-manager/manager; the root export is the Host plugin. The package has no production dependency on Tavern/assembler; assembler is only a development fixture. Cross-repository assembly adapters use published services, not private files.
