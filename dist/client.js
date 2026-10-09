window.__ModuleLoader__.load({id:"dsh-memory-manager",factory:(require)=>{var module={exports:{}};var exports=module.exports;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client.js
var client_exports = {};
__export(client_exports, {
  apply: () => apply,
  inject: () => inject,
  name: () => name
});
module.exports = __toCommonJS(client_exports);
var import_react7 = require("react");

// src/client-conversation-view.js
var import_react = require("react");
function createConversationView(Panel2) {
  return function MemoryConversationView({ sessionId }) {
    const root2 = (0, import_react.useRef)(null);
    (0, import_react.useLayoutEffect)(() => {
      const content = root2.current?.closest("[data-conversation-content]");
      if (!content) return;
      content.classList.add("dmm-memory-content");
      return () => content.classList.remove("dmm-memory-content");
    }, []);
    return (0, import_react.createElement)("div", { ref: root2, className: "dmm-conversation-view" }, (0, import_react.createElement)(Panel2, { sessionId, sessionView: true }));
  };
}
function registerConversationView(ctx, View) {
  return ctx.slots.inject("conversation.view", () => {
    ctx.effect(() => {
      const marked = /* @__PURE__ */ new Set(), refresh = () => {
        for (const list of document.querySelectorAll("[data-conversation-tabs][role=tablist]")) {
          const present = [...list.querySelectorAll("[role=tab]")].some((tab) => tab.textContent.trim() === "\u8BB0\u5FC6\u7BA1\u7406");
          if (present && !marked.has(list)) {
            list.classList.add("dmm-conversation-tabs");
            marked.add(list);
          } else if (!present && marked.has(list)) {
            list.classList.remove("dmm-conversation-tabs");
            marked.delete(list);
          }
        }
        for (const list of marked) if (!list.isConnected) {
          list.classList.remove("dmm-conversation-tabs");
          marked.delete(list);
        }
      };
      const observer = new MutationObserver(refresh);
      observer.observe(document.body, { childList: true, subtree: true });
      refresh();
      return () => {
        observer.disconnect();
        for (const list of marked) list.classList.remove("dmm-conversation-tabs");
      };
    });
    return ctx.slots.register({ name: "conversation.view", id: "dsh-memory-manager", order: 30, label: "\u8BB0\u5FC6\u7BA1\u7406", inject: () => ({}) }, View);
  });
}

// src/client-round-table.js
var import_react2 = require("react");

// src/observation-modes.js
var eventModes = { assistant_message_committed: "store", card_variable_update: "store", manual_update: "store", before_model_request: "retrieve" };
function observationMode(fact) {
  if (["store", "retrieve"].includes(fact.mode)) return fact.mode;
  if (eventModes[fact.on]) return eventModes[fact.on];
  if (fact.detail === "\u5DF2\u8FDB\u5165 DSH \u8BF7\u6C42\uFF08llm/stream \u89C2\u5BDF\uFF1B\u4E0D\u4EE3\u8868\u7F51\u7EDC\u9001\u8FBE\uFF09" && fact.strategyRevision && fact.configRevision !== void 0) return "retrieve";
  if (fact.adapterId === "tavern.mvu") {
    if (fact.detail === "dsh-request-observed") return "retrieve";
    if (["state-committed", "manual-update"].includes(fact.detail)) return "store";
  }
  if (["tavern.world-books", "tavern.prompt-templates"].includes(fact.adapterId) && (fact.detail === "Observed in durable DSH request; provider delivery not established" || fact.code === "WORLD_BOOK_POLICY_SKIPPED")) return "retrieve";
  return null;
}
function observationEvidence(fact) {
  if (fact.evidence) return fact.evidence;
  const mode = observationMode(fact);
  if (mode === "retrieve" && ["triggered", "applied"].includes(fact.phase)) {
    if (["dsh-history", "tavern-history"].includes(fact.origin) || fact.detail === "dsh-request-observed" || fact.detail === "Observed in durable DSH request; provider delivery not established" || fact.detail === "\u5DF2\u8FDB\u5165 DSH \u8BF7\u6C42\uFF08llm/stream \u89C2\u5BDF\uFF1B\u4E0D\u4EE3\u8868\u7F51\u7EDC\u9001\u8FBE\uFF09") return "request-included";
  }
  if (mode === "store" && (fact.phase === "applied" || fact.on === "manual_update" && fact.phase === "completed" && fact.detail === "manual-update")) return "write-committed";
  return null;
}
function operationTriggered(fact, mode = observationMode(fact)) {
  return observationMode(fact) === mode && observationEvidence(fact) === (mode === "retrieve" ? "request-included" : "write-committed") && ["triggered", "applied", "completed"].includes(fact.phase);
}
var evidenceLabels = { "content-read": "\u6B63\u6587\u8BFB\u53D6\u6210\u529F", "request-included": "\u5DF2\u8FDB\u5165\u672C\u8F6E\u8BF7\u6C42", "write-committed": "\u6765\u6E90\u5199\u5165\u5DF2\u786E\u8BA4", "source-evaluated": "\u89C4\u5219\u547D\u4E2D\u6216\u6765\u6E90\u6C42\u503C" };
function evidenceLabel(fact) {
  return evidenceLabels[observationEvidence(fact)] ?? ({ started: "\u5F00\u59CB\u6267\u884C", triggered: "\u6267\u884C\u5DF2\u53D1\u8D77", applied: "\u6267\u884C\u56DE\u6267\uFF0C\u8BC1\u636E\u672A\u786E\u8BA4", completed: "\u6267\u884C\u7ED3\u675F", skipped: "\u5DF2\u8DF3\u8FC7", failed: "\u6267\u884C\u5931\u8D25" }[fact.phase] ?? "\u8BC1\u636E\u672A\u786E\u8BA4");
}
var triggerLabels = { triggered: "\u5DF2\u89E6\u53D1", processing: "\u5904\u7406\u4E2D", skipped: "\u5DF2\u8DF3\u8FC7", unrecorded: "\u672A\u8BB0\u5F55\u89E6\u53D1", unknown: "\u672A\u786E\u8BA4" };
function operationStatus(row, mode) {
  const facts = (row.facts ?? []).filter((f) => observationMode(f) === mode), active = (row.activeFacts ?? []).filter((f) => observationMode(f) === mode);
  if (facts.some((f) => operationTriggered(f, mode))) return "triggered";
  if (active.length) return "processing";
  if (facts.some((f) => f.phase === "failed" || f.interrupted)) return "unknown";
  if (facts.some((f) => f.phase === "skipped")) return "skipped";
  if (facts.length || [...row.facts ?? [], ...row.activeFacts ?? []].some((f) => !observationMode(f))) return "unknown";
  return "unrecorded";
}
function operationReasons(row, mode) {
  return [...new Set((row.facts ?? []).filter((f) => observationMode(f) === mode && ["skipped", "failed"].includes(f.phase)).map((f) => f.reason ?? f.detail).filter(Boolean))].join(" / ");
}
function matchesOperationFilters(row, filters = {}) {
  return ["store", "retrieve"].every((mode) => !filters[mode + "Status"]?.length || filters[mode + "Status"].includes(operationStatus(row, mode)));
}

// src/session-rounds.js
var triggered = /* @__PURE__ */ new Set(["started", "triggered", "applied"]);
var kinds = { human: "\u4EBA\u7C7B\u8F93\u5165", task: "\u4EFB\u52A1\u4E0A\u4E0B\u6587", system: "\u7CFB\u7EDF" };
var roundOf = (fact) => fact.turn == null ? null : String(fact.turn);
function sessionRounds(data, selected = []) {
  const turns = [...new Set(selected.length ? selected.map(String) : data.facets?.turns ?? [])].sort((a, b) => b.localeCompare(a, void 0, { numeric: true }));
  const unclassified = data.rows.some((row) => [...row.facts ?? [], ...row.activeFacts ?? []].some((fact) => roundOf(fact) === null));
  return [...turns, ...!selected.length && (unclassified || !turns.length) ? [null] : []].map((turn) => ({ turn, key: turn === null ? "unknown" : "turn:" + turn, label: turn === null ? unclassified ? "\u672A\u786E\u8BA4\u8F6E\u6B21" : "\u5C1A\u65E0\u8F6E\u6B21\u8BB0\u5F55" : `\u7B2C ${turn} \u8F6E` }));
}
function roundRows(data, turn, status = [], operationFilters = {}) {
  return data.rows.map((row) => {
    const facts = (row.facts ?? []).filter((f) => roundOf(f) === turn), activeFacts = (row.activeFacts ?? []).filter((f) => roundOf(f) === turn);
    const state = activeFacts.length ? "running" : facts.some((f) => triggered.has(f.phase)) ? "past" : "never";
    return { ...row, facts, activeFacts, status: state, applied: facts.some((f) => f.phase === "applied"), interrupted: facts.some((f) => f.interrupted) };
  }).filter((row) => (!status.length || status.includes(row.status)) && matchesOperationFilters(row, operationFilters));
}
function roundKinds(rows) {
  return [...new Set(rows.flatMap((row) => row.facts ?? []).map((f) => kinds[f.turnKind]).filter(Boolean))].join(" / ");
}
function roundVisibleCount(data, selected = [], status = [], operationFilters = {}) {
  const visible = new Set(sessionRounds(data, selected).flatMap((group) => roundRows(data, group.turn, status, operationFilters).map((row) => JSON.stringify([row.adapterId, row.id]))));
  return visible.size;
}

// src/client-round-table.js
var roundCss = `.dmm-memory-content>[data-width-handle]{display:none}.dmm-conversation-tabs{gap:16px;padding-right:28px;padding-bottom:8px;overflow-x:auto;overflow-y:hidden;overscroll-behavior-x:contain;scrollbar-width:thin}.dmm-conversation-tabs>[role=tab]{flex-shrink:0}.dmm-conversation-view{min-width:0;padding-bottom:calc(var(--dsh-composer-height,180px) + 12px)}.dmm-conversation-view .dmm-sticky-actions{bottom:calc(var(--dsh-composer-height,180px) + 12px)}.dmm .dmm-rounds{display:grid;gap:12px}.dmm .dmm-round{border:1px solid color-mix(in srgb,currentColor 15%,transparent);border-radius:8px;overflow:hidden}.dmm .dmm-round>summary{cursor:pointer;padding:12px 16px;display:flex;align-items:center;flex-wrap:wrap;gap:8px;min-height:44px;box-sizing:border-box}.dmm .dmm-round-title{font-weight:600}.dmm .dmm-round-body{padding:0 16px 12px}.dmm .dmm-round-counts{margin-left:auto;display:flex;gap:12px;flex-wrap:wrap;font-size:12px}.dmm table.dmm-trigger-table{min-width:880px}.dmm .dmm-trigger-table th:nth-child(6),.dmm .dmm-trigger-table th:nth-child(7){width:96px;white-space:nowrap}.dmm .dmm-resource-status{white-space:nowrap}.dmm .dmm-round-note{margin:0 0 12px}.dmm .dmm-round[open]>summary{border-bottom:1px solid color-mix(in srgb,currentColor 12%,transparent);margin-bottom:12px}@media(max-width:480px){.dmm .dmm-round>summary{padding:10px 12px}.dmm .dmm-round-body{padding:0 12px 10px}.dmm .dmm-round-counts{margin-left:0;flex-basis:100%;gap:10px}}`;
function RoundTable({ data, filters, Table: Table2, onDetail }) {
  const groups = sessionRounds(data, filters.turn), [open, setOpen] = (0, import_react2.useState)(() => /* @__PURE__ */ new Set([groups[0]?.key])), [visible, setVisible] = (0, import_react2.useState)(20);
  const keys = groups.map((group) => group.key).join("\0");
  (0, import_react2.useEffect)(() => {
    setOpen((previous) => groups.some((group) => previous.has(group.key)) ? previous : /* @__PURE__ */ new Set([groups[0]?.key]));
  }, [keys]);
  return (0, import_react2.createElement)("div", { className: "dmm-rounds", "aria-label": "\u6309\u8F6E\u6B21\u5206\u7C7B\u7684\u8BB0\u5FC6\u8D44\u6E90" }, (0, import_react2.createElement)("p", { className: "dmm-muted dmm-round-note" }, "\u8BFB\u53D6\u5DF2\u89E6\u53D1\u8868\u793A\u5185\u5BB9\u8FDB\u5165\u672C\u8F6E\u8BF7\u6C42\uFF1B\u5B58\u50A8\u5DF2\u89E6\u53D1\u8868\u793A\u6765\u6E90\u786E\u8BA4\u5199\u5165\u3002\u6B63\u6587\u8BFB\u53D6\u6210\u529F\u5355\u5217\u5728\u8BE6\u60C5\u3002\u672A\u8BB0\u5F55\u4E0D\u4EE3\u8868\u672A\u4F7F\u7528\uFF1B\u914D\u7F6E\u663E\u793A\u5F53\u524D\u503C\u3002"), ...groups.slice(0, visible).map((group) => {
    const rows = roundRows(data, group.turn, [], filters), types = roundKinds(rows);
    const counts = Object.fromEntries(["store", "retrieve"].map((mode) => [mode, rows.filter((row) => operationStatus(row, mode) === "triggered").length]));
    return (0, import_react2.createElement)("details", { key: group.key, className: "dmm-round", open: open.has(group.key), "data-round": group.turn ?? "unknown", onToggle: (e) => {
      const next = e.currentTarget.open;
      setOpen((previous) => {
        if (previous.has(group.key) === next) return previous;
        const value = new Set(previous);
        if (next) value.add(group.key);
        else value.delete(group.key);
        return value;
      });
    } }, (0, import_react2.createElement)("summary", null, (0, import_react2.createElement)("span", { "aria-hidden": true }, open.has(group.key) ? "\u25BE" : "\u25B8"), (0, import_react2.createElement)("span", { className: "dmm-round-title" }, group.label), types && (0, import_react2.createElement)("span", { className: "dmm-muted" }, types), (0, import_react2.createElement)("span", { className: "dmm-round-counts" }, ...["store", "retrieve"].map((mode) => (0, import_react2.createElement)("span", { key: mode, "data-trigger-mode": mode }, `${mode === "store" ? "\u5B58\u50A8" : "\u8BFB\u53D6"}\u5DF2\u89E6\u53D1 ${counts[mode]}`)))), open.has(group.key) && (0, import_react2.createElement)("div", { className: "dmm-round-body" }, rows.length > 0 && rows.every((row) => !row.facts?.length && !row.activeFacts?.length) && (0, import_react2.createElement)("p", { className: "dmm-muted" }, "\u672C\u8F6E\u672A\u8BB0\u5F55\u8D44\u6E90\u6D3B\u52A8\u3002"), rows.length ? (0, import_react2.createElement)(Table2, { data: { ...data, rows }, showStatus: true, onDetail: (row) => onDetail(row, group.turn, group.label) }) : (0, import_react2.createElement)("p", { className: "dmm-empty" }, "\u672C\u8F6E\u6B21\u548C\u7B5B\u9009\u6761\u4EF6\u4E0B\u6CA1\u6709\u53EF\u89C1\u8D44\u6E90\u3002")));
  }), groups.length > visible && (0, import_react2.createElement)("button", { onClick: () => setVisible((count) => count + 20) }, `\u663E\u793A\u66F4\u591A\u8F6E\u6B21\uFF08\u5269\u4F59 ${groups.length - visible}\uFF09`));
}

// src/client.js
var import_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");

// src/client-presets.js
var import_react5 = require("react");

// src/client-options.js
var import_react4 = require("react");

// src/option-schema.js
function parameterDefault(schema) {
  if (schema.default !== void 0) return structuredClone(schema.default);
  if (schema.enum) return schema.enum[0];
  if (schema.type === "object") return Object.fromEntries((schema.required ?? []).map((key) => [key, parameterDefault(schema.properties[key])]));
  if (schema.type === "array") return Array.from({ length: schema.minItems ?? 0 }, () => parameterDefault(schema.items));
  return schema.type === "boolean" ? false : ["number", "integer"].includes(schema.type) ? Math.max(schema.minimum ?? -Infinity, Math.min(schema.maximum ?? Infinity, 0)) : "";
}

// src/client-form.js
var fieldLabels = { adapterId: "\u89C4\u5219\u8DEF\u7531 adapter", id: "\u8D44\u6E90 ID", type: "\u7C7B\u578B", preset: "\u9884\u8BBE", whitelist: "\u767D\u540D\u5355", blacklist: "\u9ED1\u540D\u5355", "store.on": "\u5B58\u50A8 \xB7 \u65F6\u673A on", "store.rule": "\u5B58\u50A8 \xB7 \u6761\u4EF6 rule", "store.strategy": "\u5B58\u50A8 \xB7 \u7B56\u7565 strategy", "retrieve.on": "\u8BFB\u53D6 \xB7 \u65F6\u673A on", "retrieve.rule": "\u8BFB\u53D6 \xB7 \u6761\u4EF6 rule", "retrieve.strategy": "\u8BFB\u53D6 \xB7 \u7B56\u7565 strategy" };
var fields = Object.keys(fieldLabels).filter((k) => !["id", "adapterId"].includes(k));
var jsonFields = fields.filter((k) => !["type", "preset"].includes(k));
var stringify = (value) => value === void 0 ? "" : JSON.stringify(value, null, 2);
var at = (object, path) => path.split(".").reduce((v, key) => v?.[key], object);
function formFrom(local) {
  const form = { __base: structuredClone(local ?? {}), adapterId: local?.adapterId ?? "", __presetPresent: Object.hasOwn(local ?? {}, "preset"), __storePresent: Object.hasOwn(local ?? {}, "store"), __retrievePresent: Object.hasOwn(local ?? {}, "retrieve") };
  for (const field of fields) form[field] = ["type", "preset"].includes(field) ? at(local, field) ?? "" : stringify(at(local, field));
  return form;
}
function entryFrom(form, row) {
  const entry = { ...structuredClone(form.__base ?? {}), id: row.id, adapterId: form.adapterId || row.adapterId };
  if (entry.adapterId !== row.adapterId) entry.sourceAdapterId = row.adapterId;
  else delete entry.sourceAdapterId;
  for (const field of fields) if (!field.includes(".")) delete entry[field];
  for (const mode of ["store", "retrieve"]) {
    const extra = Object.fromEntries(Object.entries(entry[mode] ?? {}).filter(([k]) => !["on", "rule", "strategy"].includes(k)));
    delete entry[mode];
    if (form["__" + mode + "Present"] || Object.keys(extra).length) entry[mode] = extra;
  }
  for (const field of fields) {
    const value = form[field];
    if (field === "preset") {
      if (value || form.__presetPresent) entry.preset = value || null;
      continue;
    }
    if (value === "") continue;
    let parsed;
    try {
      parsed = jsonFields.includes(field) ? JSON.parse(value) : value;
    } catch {
      throw Error(`${fieldLabels[field]}\u4E0D\u662F\u6709\u6548 JSON\u3002`);
    }
    const [key, child] = field.split(".");
    if (child) (entry[key] ??= {})[child] = parsed;
    else entry[key] = parsed;
  }
  return entry;
}
function fieldOrigin(config, origins, field) {
  return at(config, field) === void 0 ? void 0 : origins[field];
}
function removeModeFrom(form, mode) {
  if (!["store", "retrieve"].includes(mode)) throw Error("Unknown configuration mode");
  return { ...form, ["__" + mode + "Present"]: false, ...Object.fromEntries(["on", "rule", "strategy"].map((child) => [mode + "." + child, ""])) };
}
function restoreSourceDefaults(form, row) {
  const restored = removeModeFrom(removeModeFrom(form, "store"), "retrieve");
  const base = { ...restored.__base };
  delete base.followSource;
  return { ...restored, __base: base, adapterId: row.adapterId, __presetPresent: false, type: "", preset: "", whitelist: "", blacklist: "" };
}
function followField(form, field, following, value) {
  const next = { ...form, __base: structuredClone(form.__base) }, markers = new Set(next.__base.followSource ?? []);
  if (following) {
    markers.add(field);
    next[field] = "";
    const mode = field.split(".")[0];
    if (["store", "retrieve"].includes(mode)) next["__" + mode + "Present"] = false;
  } else {
    markers.delete(field);
    next[field] = value === void 0 ? "" : field === "type" ? value : JSON.stringify(value);
  }
  if (markers.size) next.__base.followSource = [...markers];
  else delete next.__base.followSource;
  return next;
}

// src/canonical.js
function canonical(value) {
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (value && typeof value === "object") return "{" + Object.keys(value).sort().map((k) => JSON.stringify(k) + ":" + canonical(value[k])).join(",") + "}";
  return JSON.stringify(value);
}

// src/client-directory.js
var import_react3 = require("react");
function DirectoryPicker({ kind, catalog, onSelect, onBack }) {
  const providers = (catalog.directories ?? []).filter((p) => p.kinds.includes(kind)), [provider, setProvider] = (0, import_react3.useState)(providers[0]?.id ?? ""), [query, setQuery] = (0, import_react3.useState)(""), [workspace, setWorkspace] = (0, import_react3.useState)(""), [items, setItems] = (0, import_react3.useState)([]), [spaces, setSpaces] = (0, import_react3.useState)([]), [cursor, setCursor] = (0, import_react3.useState)(void 0), [error, setError] = (0, import_react3.useState)(null), [busy, setBusy] = (0, import_react3.useState)(false);
  const selected = providers.find((p) => p.id === provider);
  const [requests] = (0, import_react3.useState)(() => ({ key: null, generation: 0, serial: 0, busyId: null, lastConsumed: null, lastRefresh: 0, controllers: /* @__PURE__ */ new Set() }));
  const [refreshVersion, setRefreshVersion] = (0, import_react3.useState)(0), [range, setRange] = (0, import_react3.useState)(null);
  const key = JSON.stringify([provider, kind, query, workspace, !!selected?.enabled, refreshVersion]);
  if (requests.key !== key) {
    requests.key = key;
    requests.generation++;
    requests.busyId = null;
    requests.lastConsumed = null;
    for (const c of requests.controllers) c.abort();
    requests.controllers.clear();
  }
  const load = async (next) => {
    const generation = requests.generation;
    if (!selected?.enabled || requests.key !== key || requests.busyId !== null || next && requests.lastConsumed === next) return;
    const c = new AbortController(), id = ++requests.serial, current = () => requests.key === key && requests.generation === generation && !c.signal.aborted;
    requests.controllers.add(c);
    requests.busyId = id;
    requests.lastConsumed = next ?? null;
    setBusy(true);
    try {
      const refresh = refreshVersion !== requests.lastRefresh;
      requests.lastRefresh = refreshVersion;
      const q = new URLSearchParams({ ...refresh ? { refresh: "1" } : {}, providerId: provider, kind, query, limit: "30", ...next ? { cursor: next } : {}, ...workspace ? { workspaceId: workspace } : {} }), r = await fetch("/api/dsh-memory-manager/scope-directory?" + q, { signal: c.signal }), result = await r.json();
      if (!current()) return;
      if (!r.ok) throw Error(result.error?.message ?? "\u76EE\u5F55\u8BFB\u53D6\u5931\u8D25");
      setItems((old) => next ? [...old, ...result.items] : result.items);
      setCursor(result.nextCursor);
      setRange(result.range ?? null);
      setError(null);
    } catch (e) {
      if (current() && e.name !== "AbortError") {
        requests.lastConsumed = null;
        setError(e.message);
      }
    } finally {
      requests.controllers.delete(c);
      if (current() && requests.busyId === id) {
        requests.busyId = null;
        setBusy(false);
      }
    }
  };
  (0, import_react3.useEffect)(() => {
    setItems([]);
    setCursor(void 0);
    setError(null);
    setRange(null);
    setBusy(false);
    const timer = setTimeout(() => load(void 0), 200);
    return () => {
      clearTimeout(timer);
      for (const c of requests.controllers) c.abort();
      requests.controllers.clear();
      requests.busyId = null;
    };
  }, [key]);
  (0, import_react3.useEffect)(() => {
    if (kind !== "sessionId") return;
    const p = (catalog.directories ?? []).find((p2) => p2.enabled && p2.kinds.includes("workspaceId"));
    if (!p) return;
    const c = new AbortController();
    let active = true;
    fetch("/api/dsh-memory-manager/scope-directory?" + new URLSearchParams({ providerId: p.id, kind: "workspaceId", query: "", limit: "50" }), { signal: c.signal }).then(async (r) => {
      const result = await r.json();
      if (active && !c.signal.aborted && r.ok) setSpaces(result.items);
    }).catch(() => {
    });
    return () => {
      active = false;
      c.abort();
    };
  }, [kind, catalog.directories]);
  return (0, import_react3.createElement)("section", { className: "dmm-card", "aria-label": "\u9009\u62E9\u4F5C\u7528\u57DF\u5B9E\u4F53" }, (0, import_react3.createElement)("div", { className: "dmm-page-top" }, (0, import_react3.createElement)("h3", null, "\u9009\u62E9 " + (catalog.scopeKinds?.[kind] ?? kind)), (0, import_react3.createElement)("div", { className: "dmm-actions" }, (0, import_react3.createElement)("button", { disabled: busy, onClick: () => setRefreshVersion((v) => v + 1) }, "\u5237\u65B0\u76EE\u5F55"), (0, import_react3.createElement)("button", { onClick: onBack }, "\u53D6\u6D88\u9009\u62E9"))), (0, import_react3.createElement)("p", { className: "dmm-muted" }, "\u6309\u540D\u79F0\u67E5\u627E\uFF0C\u4FDD\u5B58\u6765\u6E90\u7684\u7A33\u5B9A ID\u3002\u663E\u793A\u540D\u4E0D\u662F\u8EAB\u4EFD\uFF1B\u76EE\u5F55\u53EF\u89C1\u6027\u4E0D\u6388\u4E88\u8D44\u6E90\u6743\u9650\u3002"), providers.length ? (0, import_react3.createElement)("div", null, (0, import_react3.createElement)("div", { className: "dmm-option-search" }, (0, import_react3.createElement)("input", { "aria-label": "\u641C\u7D22\u4F5C\u7528\u57DF", value: query, placeholder: "\u641C\u7D22\u6807\u9898\u3001\u540D\u79F0\u6216 Workspace", onChange: (e) => setQuery(e.target.value) }), (0, import_react3.createElement)("select", { "aria-label": "\u4F5C\u7528\u57DF\u76EE\u5F55 adapter", value: provider, onChange: (e) => setProvider(e.target.value) }, ...providers.map((p) => (0, import_react3.createElement)("option", { key: p.id, value: p.id }, p.label))), kind === "sessionId" && (0, import_react3.createElement)("select", { "aria-label": "\u6309 Workspace \u9009\u62E9\u4F1A\u8BDD", value: workspace, onChange: (e) => setWorkspace(e.target.value) }, (0, import_react3.createElement)("option", { value: "" }, "\u6240\u6709 Workspace"), ...spaces.map((w) => (0, import_react3.createElement)("option", { key: w.id, value: w.id }, w.label)))), !selected?.enabled && (0, import_react3.createElement)("p", { className: "dmm-unconfigured" }, "\u8BE5\u76EE\u5F55 adapter \u5DF2\u505C\u7528\u3002\u8BF7\u5728 Adapter \u9875\u91CD\u65B0\u542F\u7528\u3002"), (0, import_react3.createElement)("p", { className: "dmm-muted" }, selected?.description), range && (0, import_react3.createElement)("p", { className: range.limited ? "dmm-unconfigured" : "dmm-muted", role: "status" }, range.message), error && (0, import_react3.createElement)("p", { className: "dmm-error", role: "alert" }, error), (0, import_react3.createElement)("div", { className: "dmm-option-list" }, ...items.map((item) => (0, import_react3.createElement)("button", { className: "dmm-field-choice", key: item.id, onClick: () => onSelect(item.id) }, (0, import_react3.createElement)("strong", null, item.label), item.labelState === "cached" && (0, import_react3.createElement)("span", null, "\u7F13\u5B58\u6807\u9898"), item.labelState === "unnamed" && (0, import_react3.createElement)("span", null, "\u6807\u9898\u5C1A\u672A\u7F13\u5B58"), item.workspaceLabel && (0, import_react3.createElement)("span", null, item.workspaceLabel), (0, import_react3.createElement)("code", null, item.id)))), busy && (0, import_react3.createElement)("p", { role: "status" }, "\u6B63\u5728\u641C\u7D22\u76EE\u5F55\u2026"), !busy && !items.length && selected?.enabled && (0, import_react3.createElement)("p", null, "\u6CA1\u6709\u5339\u914D\u7684\u53EF\u89C1\u5B9E\u4F53\u3002"), cursor && (0, import_react3.createElement)("button", { disabled: busy, onClick: () => load(cursor) }, "\u52A0\u8F7D\u4E0B\u4E00\u9875")) : (0, import_react3.createElement)("div", { className: "dmm-unconfigured" }, (0, import_react3.createElement)("p", null, "\u5C1A\u672A\u5B89\u88C5\u652F\u6301\u6B64\u5B9E\u4F53\u7684\u5206\u9875\u76EE\u5F55 adapter\u3002"), (0, import_react3.createElement)("a", { href: catalog.documentation + "#scope", target: "_blank", rel: "noreferrer" }, "\u67E5\u770B\u53EF\u4FE1 adapter \u5B89\u88C5\u4E0E\u7248\u672C\u8BF4\u660E \u2197")));
}

// src/capabilities.js
function conditionReferences(rule) {
  if (typeof rule === "string") return [{ id: rule, params: {} }];
  if (!rule || typeof rule !== "object") return [];
  if (rule.condition) return [{ id: rule.condition.id, params: rule.condition.params ?? {} }];
  if (rule.not !== void 0) return conditionReferences(rule.not);
  return (rule.all ?? rule.any ?? rule.at_least?.conditions ?? []).flatMap(conditionReferences);
}

// src/option-availability.js
function descriptorStatus(option, { adapterId, mode, type }) {
  if (option.available === false) return { available: false, reason: option.reason ?? "\u5F53\u524D\u6765\u6E90\u4E0D\u652F\u6301" };
  if (adapterId && option.adapterIds?.length && !option.adapterIds.includes(adapterId)) return { available: false, reason: "\u6B64\u80FD\u529B\u4E0D\u9002\u7528\u4E8E\u5F53\u524D\u6765\u6E90\u3002" };
  if (option.modes?.length && !option.modes.includes(mode)) return { available: false, reason: "\u6B64\u80FD\u529B\u4E0D\u9002\u7528\u4E8E\u5F53\u524D\u6A21\u5F0F\u3002" };
  if (option.types?.length && !option.types.includes(type)) return { available: false, reason: type ? "\u6B64\u80FD\u529B\u4E0D\u9002\u7528\u4E8E\u5F53\u524D\u751F\u6548\u7C7B\u578B\uFF1A" + type : "\u8BF7\u5148\u9009\u62E9\u517C\u5BB9\u7684\u7C7B\u578B\u6216\u9884\u8BBE\u3002" };
  return { available: true };
}
function contextualCatalog(catalog, { mode, type, filter = false } = {}) {
  const context = { adapterId: catalog.adapterId, mode, type };
  const adjust = (options) => options.map((o) => ({ ...o, ...filter ? { available: true } : descriptorStatus(o, context) }));
  return { ...catalog, conditions: adjust(catalog.conditions), operations: adjust(catalog.operations) };
}
function optionAvailability(option, field, catalog, { type, localType } = {}) {
  const mode = field.split(".")[0], context = { adapterId: catalog.adapterId, mode, type };
  const status = descriptorStatus(option, context);
  if (!status.available) return status;
  const references = (value, child, ctx) => {
    const refs = child === "rule" ? conditionReferences(value) : child === "strategy" ? (typeof value === "string" ? [{ operation: value }] : value ?? []).map((s) => ({ id: s.operation })) : [];
    if (child === "strategy" && catalog.adapters.find((a) => a.id === catalog.adapterId)?.strategyOwner === "source") return { available: true };
    for (const ref of refs) {
      const descriptor = (child === "rule" ? catalog.conditions : catalog.operations).find((o) => o.id === ref.id);
      if (!descriptor) return { available: false, reason: "\u5F15\u7528\u7684\u80FD\u529B\u5C1A\u672A\u6CE8\u518C\uFF1A" + ref.id };
      const result = descriptorStatus(descriptor, ctx);
      if (!result.available) return result;
    }
    return { available: true };
  };
  if (field === "preset") {
    const config = option.configuration ?? {}, presetType = Object.hasOwn(config, "type") ? config.type : localType;
    for (const m of ["store", "retrieve"]) for (const child of ["rule", "strategy"]) {
      const result = references(config[m]?.[child], child, { ...context, mode: m, type: presetType });
      if (!result.available) return result;
    }
    return status;
  }
  return references(option.value, field.split(".")[1], context);
}

// src/client-options.js
var equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
var labelFor = (options, id) => options?.find((o) => o.id === id)?.label ?? id;
function describeValue(value, field, catalog) {
  if (value === void 0) return "\u8DDF\u968F\u6765\u6E90 / \u9ED8\u8BA4\u884C\u4E3A";
  if (value === null) return "\u672A\u5F15\u7528";
  if (field === "preset") return labelFor(catalog?.presets, value);
  if (field === "adapterId") return labelFor(catalog?.adapters, value);
  if (field === "type") return labelFor(catalog?.fields?.type, value);
  if (field.endsWith(".on")) return (Array.isArray(value) ? value : [value]).map((v) => labelFor(catalog?.fields?.[field], v)).join("\u3001") || "\u6CA1\u6709\u65F6\u673A";
  if (["whitelist", "blacklist"].includes(field)) return value.length ? value.map((selector) => Object.entries(selector).map(([k, v]) => k === "global" ? "\u6240\u6709\u4F5C\u7528\u57DF" : `${scopeLabels[k] ?? k}\uFF1A${v}`).join(" \u4E14 ")).join("\uFF1B\u6216 ") : "\u7A7A\u540D\u5355";
  if (field.endsWith(".rule")) {
    if (typeof value === "boolean") return value ? "\u59CB\u7EC8\u6EE1\u8DB3" : "\u59CB\u7EC8\u4E0D\u6EE1\u8DB3";
    if (typeof value === "string") return labelFor(catalog?.conditions, value);
    if (value.condition) return labelFor(catalog?.conditions, value.condition.id) + (Object.keys(value.condition.params ?? {}).length ? "\uFF08\u5DF2\u8BBE\u7F6E\u53C2\u6570\uFF09" : "");
    if (value.not !== void 0) return "\u4E0D\u6EE1\u8DB3\uFF1A" + describeValue(value.not, field, catalog);
    const children = value.all ?? value.any ?? value.at_least?.conditions ?? [];
    return `${value.all ? "\u5168\u90E8\u6EE1\u8DB3" : value.any ? "\u4EFB\u4E00\u6EE1\u8DB3" : `\u81F3\u5C11\u6EE1\u8DB3 ${value.at_least?.count ?? 0} \u9879`}\uFF08${children.map((v) => describeValue(v, field, catalog)).join("\uFF1B")}\uFF09`;
  }
  if (field.endsWith(".strategy")) {
    const known = catalog?.fields?.[field]?.find((o) => o.available !== false && equal(o.value, value));
    if (known) return known.label;
    return (typeof value === "string" ? [{ operation: value }] : value).map((step) => labelFor(catalog?.operations, step.operation)).join(" \u2192 ") || "\u7A7A\u64CD\u4F5C\u94FE";
  }
  return typeof value === "string" ? value : String(value);
}
var scopeLabels = { global: "\u6240\u6709\u4F5C\u7528\u57DF", sessionId: "\u4F1A\u8BDD", workspaceId: "Workspace", characterId: "\u89D2\u8272\u5361", presetId: "Tavern \u9884\u8BBE", userId: "Persona / \u7528\u6237\u89D2\u8272", branchId: "\u5206\u652F ID", authority: "\u6743\u9650\u57DF", taskId: "\u4EFB\u52A1 ID", runId: "\u8FD0\u884C ID", attemptId: "\u5C1D\u8BD5 ID" };
function Parameters({ schema, value, onChange, path = "\u53C2\u6570" }) {
  if (!schema) return (0, import_react4.createElement)("p", { className: "dmm-muted" }, "\u6B64\u6269\u5C55\u6CA1\u6709\u58F0\u660E\u53C2\u6570\u63A7\u4EF6\uFF1B\u73B0\u6709\u53C2\u6570\u539F\u6837\u4FDD\u7559\u3002\u8BF7\u67E5\u770B\u672C\u5730\u6269\u5C55\u6587\u6863\u3002");
  const matches = value === void 0 || (schema.type === "array" ? Array.isArray(value) : schema.type === "object" ? value !== null && typeof value === "object" && !Array.isArray(value) : schema.type === "integer" ? Number.isInteger(value) : typeof value === schema.type);
  if (!matches) return (0, import_react4.createElement)("div", { className: "dmm-unconfigured" }, (0, import_react4.createElement)("p", null, path + "\uFF1A\u5DF2\u6709\u53C2\u6570\u7C7B\u578B\u4E0E\u5F53\u524D\u63CF\u8FF0\u4E0D\u7B26\uFF0C\u539F\u503C\u5DF2\u4FDD\u7559\u3002"), (0, import_react4.createElement)("button", { onClick: () => onChange(parameterDefault(schema)) }, "\u66FF\u6362\u4E3A\u5F53\u524D\u53C2\u6570\u7C7B\u578B"));
  if (schema.type === "object") return (0, import_react4.createElement)("div", { className: "dmm-parameters" }, ...Object.entries(schema.properties ?? {}).map(([key, child]) => {
    const present = Object.hasOwn(value ?? {}, key), required = schema.required?.includes(key);
    return (0, import_react4.createElement)("div", { key, className: "dmm-param" }, !required && (0, import_react4.createElement)("label", { className: "dmm-option" }, (0, import_react4.createElement)("input", { type: "checkbox", checked: present, onChange: (e) => {
      const next = { ...value };
      if (e.target.checked) next[key] = parameterDefault(child);
      else delete next[key];
      onChange(next);
    } }), `\u8BBE\u7F6E ${child.label ?? key}`), (present || required) && (0, import_react4.createElement)(Parameters, { schema: child, value: value?.[key], path: path + " \xB7 " + (child.label ?? key), onChange: (v) => onChange({ ...value, [key]: v }) }));
  }), Object.keys(value ?? {}).filter((k) => !Object.hasOwn(schema.properties ?? {}, k)).length > 0 && (0, import_react4.createElement)("p", { className: "dmm-muted" }, "\u672A\u63CF\u8FF0\u7684\u53C2\u6570\u5DF2\u4FDD\u7559\uFF1A" + Object.keys(value).filter((k) => !Object.hasOwn(schema.properties ?? {}, k)).join("\u3001")));
  if (schema.type === "array") return (0, import_react4.createElement)("fieldset", null, (0, import_react4.createElement)("legend", null, path), ...(value ?? []).map((v, i) => (0, import_react4.createElement)("div", { className: "dmm-card", key: i }, (0, import_react4.createElement)(Parameters, { schema: schema.items, value: v, path: `${path} ${i + 1}`, onChange: (next) => onChange(value.map((old, j) => j === i ? next : old)) }), (0, import_react4.createElement)("button", { onClick: () => onChange(value.filter((_, j) => j !== i)) }, "\u79FB\u9664\u6B64\u9879"))), (0, import_react4.createElement)("button", { onClick: () => onChange([...value ?? [], parameterDefault(schema.items)]) }, "\u6DFB\u52A0\u53C2\u6570\u9879"));
  const input = schema.enum ? (0, import_react4.createElement)("select", { "aria-label": path, value: String(value ?? ""), onChange: (e) => onChange(schema.enum.find((v) => String(v) === e.target.value)) }, value === void 0 && (0, import_react4.createElement)("option", { value: "" }, "\u8BF7\u9009\u62E9"), ...schema.enum.map((v) => (0, import_react4.createElement)("option", { key: String(v), value: String(v) }, String(v)))) : schema.type === "boolean" ? (0, import_react4.createElement)("input", { "aria-label": path, type: "checkbox", checked: value === true, onChange: (e) => onChange(e.target.checked) }) : (0, import_react4.createElement)("input", { "aria-label": path, type: ["integer", "number"].includes(schema.type) ? "number" : "text", value: value ?? "", min: schema.minimum, max: schema.maximum, minLength: schema.minLength, maxLength: schema.maxLength, step: schema.type === "integer" ? 1 : void 0, onChange: (e) => onChange(["integer", "number"].includes(schema.type) ? e.target.value === "" ? void 0 : Number(e.target.value) : e.target.value) });
  return (0, import_react4.createElement)("label", { className: "dmm-param-label" }, (0, import_react4.createElement)("span", null, path), input, schema.description && (0, import_react4.createElement)("small", null, schema.description));
}
var conditionDefault = (c) => c?.parameters ? { condition: { id: c.id, params: parameterDefault(c.parameters) } } : c?.id ?? "";
function RuleEditor({ value, onChange, catalog, depth = 0 }) {
  const kind = value === void 0 ? "unset" : typeof value === "boolean" ? value ? "true" : "false" : typeof value === "string" || value.condition ? "condition" : value.not !== void 0 ? "not" : value.all ? "all" : value.any ? "any" : "at_least";
  const conditionId = typeof value === "string" ? value : value?.condition?.id, condition = catalog.conditions.find((c) => c.id === conditionId);
  const setKind = (kind2) => onChange(kind2 === "unset" ? void 0 : kind2 === "true" ? true : kind2 === "false" ? false : kind2 === "condition" ? conditionDefault(catalog.conditions[0]) : kind2 === "not" ? { not: true } : kind2 === "at_least" ? { at_least: { count: 1, conditions: [true] } } : { [kind2]: [true] });
  const children = value?.all ?? value?.any ?? value?.at_least?.conditions ?? [];
  const setChildren = (next) => onChange(kind === "at_least" ? { at_least: { ...value.at_least, conditions: next } } : { [kind]: next });
  return (0, import_react4.createElement)("div", { className: "dmm-rule-node" }, (0, import_react4.createElement)("select", { "aria-label": `\u6761\u4EF6\u7EC4\u5408 ${depth + 1}`, value: kind, onChange: (e) => setKind(e.target.value) }, ...Object.entries({ unset: "\u8DDF\u968F\u6765\u6E90 / \u9ED8\u8BA4\u6761\u4EF6", true: "\u59CB\u7EC8\u6EE1\u8DB3", false: "\u59CB\u7EC8\u4E0D\u6EE1\u8DB3", condition: "\u6CE8\u518C\u6761\u4EF6", all: "\u5168\u90E8\u6EE1\u8DB3 AND", any: "\u4EFB\u4E00\u6EE1\u8DB3 OR", not: "\u4E0D\u6EE1\u8DB3 NOT", at_least: "\u81F3\u5C11\u6EE1\u8DB3\u82E5\u5E72\u9879" }).map(([id, label]) => (0, import_react4.createElement)("option", { key: id, value: id }, label))), kind === "condition" && (0, import_react4.createElement)("div", null, (0, import_react4.createElement)("select", { "aria-label": "\u6CE8\u518C\u6761\u4EF6", value: conditionId ?? "", onChange: (e) => {
    const c = catalog.conditions.find((c2) => c2.id === e.target.value);
    onChange(c?.parameters ? { condition: { id: c.id, params: parameterDefault(c.parameters) } } : c.id);
  } }, !condition && (0, import_react4.createElement)("option", { value: conditionId ?? "" }, conditionId || "\u8BF7\u9009\u62E9\u6761\u4EF6"), ...catalog.conditions.map((c) => (0, import_react4.createElement)("option", { key: c.id, value: c.id }, c.label + (c.available ? "" : `\uFF08${c.reason ?? "\u5F53\u524D\u914D\u7F6E\u4E0D\u517C\u5BB9"}\uFF09`)))), (0, import_react4.createElement)(Parameters, { schema: condition?.parameters, value: typeof value === "object" ? value.condition.params ?? {} : {}, path: condition?.label ?? "\u6761\u4EF6\u53C2\u6570", onChange: (params) => onChange({ condition: { ...typeof value === "object" ? value.condition : {}, id: conditionId, params } }) })), kind === "not" && depth < 8 && (0, import_react4.createElement)(RuleEditor, { value: value.not, onChange: (v) => onChange({ not: v ?? true }), catalog, depth: depth + 1 }), ["all", "any", "at_least"].includes(kind) && (0, import_react4.createElement)("div", null, kind === "at_least" && (0, import_react4.createElement)("label", null, "\u81F3\u5C11\u6EE1\u8DB3\u9879\u76EE\u6570", (0, import_react4.createElement)("input", { type: "number", min: 0, max: children.length, value: value.at_least.count, onChange: (e) => onChange({ at_least: { ...value.at_least, count: Number(e.target.value) } }) })), ...children.map((child, i) => (0, import_react4.createElement)("div", { key: i, className: "dmm-rule-child" }, depth < 8 ? (0, import_react4.createElement)(RuleEditor, { value: child, onChange: (v) => setChildren(children.map((old, j) => i === j ? v ?? true : old)), catalog, depth: depth + 1 }) : (0, import_react4.createElement)("p", null, "\u5D4C\u5957\u8F83\u6DF1\uFF0C\u4FDD\u7559\u539F\u503C\uFF1B\u53EF\u660E\u786E\u66FF\u6362\u6216\u79FB\u9664\u6B64\u7EC4\u5408\u3002"), (0, import_react4.createElement)("button", { onClick: () => setChildren(children.filter((_, j) => j !== i)) }, "\u79FB\u9664\u6761\u4EF6"))), (0, import_react4.createElement)("button", { onClick: () => setChildren([...children, true]) }, "\u6DFB\u52A0\u6761\u4EF6")));
}
function StrategyEditor({ value, onChange, catalog }) {
  const steps = typeof value === "string" ? [{ operation: value }] : value ?? [];
  const set = (i, next) => onChange(steps.map((s, j) => j === i ? next : s));
  return (0, import_react4.createElement)("div", null, ...steps.map((step, i) => {
    const operation = catalog.operations.find((o) => o.id === step.operation);
    return (0, import_react4.createElement)("section", { className: "dmm-card", key: i }, (0, import_react4.createElement)("h3", null, `\u7B2C ${i + 1} \u6B65`), (0, import_react4.createElement)("select", { "aria-label": `\u7B2C ${i + 1} \u6B65\u64CD\u4F5C`, value: step.operation, onChange: (e) => {
      const op = catalog.operations.find((o) => o.id === e.target.value);
      set(i, { operation: op.id, ...op.parameters ? { params: parameterDefault(op.parameters) } : {} });
    } }, !operation && (0, import_react4.createElement)("option", { value: step.operation }, step.operation + "\uFF08\u672A\u6CE8\u518C\uFF09"), ...catalog.operations.map((op) => (0, import_react4.createElement)("option", { key: op.id, value: op.id }, op.label))), (0, import_react4.createElement)(Parameters, { schema: operation?.parameters, value: step.params ?? {}, path: operation?.label ?? "\u64CD\u4F5C\u53C2\u6570", onChange: (params) => set(i, { ...step, params }) }), (0, import_react4.createElement)("div", { className: "dmm-actions" }, (0, import_react4.createElement)("button", { disabled: i === 0, onClick: () => {
      const next = [...steps];
      [next[i - 1], next[i]] = [next[i], next[i - 1]];
      onChange(next);
    } }, "\u4E0A\u79FB"), (0, import_react4.createElement)("button", { disabled: i === steps.length - 1, onClick: () => {
      const next = [...steps];
      [next[i + 1], next[i]] = [next[i], next[i + 1]];
      onChange(next);
    } }, "\u4E0B\u79FB"), (0, import_react4.createElement)("button", { onClick: () => onChange(steps.filter((_, j) => j !== i)) }, "\u79FB\u9664\u64CD\u4F5C")));
  }), (0, import_react4.createElement)("button", { disabled: !catalog.operations.length, onClick: () => {
    const op = catalog.operations[0];
    onChange([...steps, { operation: op.id, ...op.parameters ? { params: parameterDefault(op.parameters) } : {} }]);
  } }, "\u6DFB\u52A0\u64CD\u4F5C"));
}
function ScopeChoice({ kind, id, catalog, onChange }) {
  const [open, setOpen] = (0, import_react4.useState)(false);
  return (0, import_react4.createElement)("div", { className: "dmm-scope-value" }, (0, import_react4.createElement)("button", { onClick: () => setOpen(true) }, id ? "\u66F4\u6362\u6240\u9009\u5B9E\u4F53" : "\u9009\u62E9\u5177\u4F53\u5B9E\u4F53"), id && (0, import_react4.createElement)("code", null, id), open && (0, import_react4.createElement)(DirectoryPicker, { kind, catalog, onBack: () => setOpen(false), onSelect: (next) => {
    onChange(next);
    setOpen(false);
  } }));
}
function ScopeEditor({ value = [], onChange, catalog }) {
  const kinds2 = catalog.scopeKinds ?? {}, set = (i, next) => onChange(value.map((s, j) => i === j ? next : s));
  return (0, import_react4.createElement)("div", null, ...value.map((selector, i) => (0, import_react4.createElement)("section", { className: "dmm-card", key: i }, (0, import_react4.createElement)("h3", null, `\u8303\u56F4 ${i + 1}\uFF08\u672C\u9879\u5185\u540C\u65F6\u6EE1\u8DB3\uFF09`), ...Object.entries(selector).map(([key, v]) => (0, import_react4.createElement)("div", { className: "dmm-scope-row", key }, (0, import_react4.createElement)("select", { "aria-label": "\u8303\u56F4\u6761\u4EF6\u7C7B\u578B", value: key, onChange: (e) => {
    const next = { ...selector };
    delete next[key];
    next[e.target.value] = e.target.value === "global" ? true : "";
    set(i, next);
  } }, !Object.hasOwn(kinds2, key) && (0, import_react4.createElement)("option", { value: key }, (scopeLabels[key] ?? key) + "\uFF08\u5DF2\u6709\u503C\uFF0C\u539F\u6837\u4FDD\u7559\uFF09"), ...Object.entries(kinds2).map(([id, label]) => (0, import_react4.createElement)("option", { key: id, value: id, disabled: id !== key && Object.hasOwn(selector, id) }, label))), key !== "global" && (Object.hasOwn(kinds2, key) ? (0, import_react4.createElement)(ScopeChoice, { kind: key, id: v, catalog, onChange: (next) => set(i, { ...selector, [key]: next }) }) : (0, import_react4.createElement)("code", null, String(v))), (0, import_react4.createElement)("button", { onClick: () => {
    const next = { ...selector };
    delete next[key];
    set(i, next);
  } }, "\u79FB\u9664\u6761\u4EF6"))), (0, import_react4.createElement)("div", { className: "dmm-actions" }, (0, import_react4.createElement)("button", { disabled: Object.keys(kinds2).every((k) => Object.hasOwn(selector, k)), onClick: () => {
    const key = Object.keys(kinds2).find((k) => !Object.hasOwn(selector, k));
    set(i, { ...selector, [key]: key === "global" ? true : "" });
  } }, "\u6DFB\u52A0\u8303\u56F4\u6761\u4EF6"), (0, import_react4.createElement)("button", { onClick: () => onChange(value.filter((_, j) => j !== i)) }, "\u79FB\u9664\u6B64\u8303\u56F4")))), (0, import_react4.createElement)("button", { onClick: () => onChange([...value, { sessionId: "" }]) }, "\u6DFB\u52A0\u8303\u56F4\uFF08\u6216\uFF09"), (0, import_react4.createElement)("p", { className: "dmm-muted" }, "\u4E0D\u540C\u8303\u56F4\u6EE1\u8DB3\u4EFB\u4E00\u5373\u53EF\uFF1B\u767D\u540D\u5355\u4E3A\u7A7A\u4E0D\u4F1A\u751F\u6548\uFF0C\u9ED1\u540D\u5355\u5339\u914D\u4F18\u5148\u3002\u8BF7\u9009\u62E9\u6765\u6E90\u5B9E\u4F53\uFF0C\u540D\u79F0\u4E0D\u662F\u8EAB\u4EFD\uFF1B\u540D\u5355\u4E0D\u6388\u4E88\u8BBF\u95EE\u6743\u3002"));
}
function OptionPage(props) {
  const [following, setFollowing] = (0, import_react4.useState)(!!props.followingSource), [draft, setDraft] = (0, import_react4.useState)(() => structuredClone(props.value)), [selected, setSelected] = (0, import_react4.useState)(() => [...props.selected ?? []]), [missing, setMissing] = (0, import_react4.useState)(!!props.missing), [removeMode, setRemoveMode] = (0, import_react4.useState)(false), [error, setError] = (0, import_react4.useState)(null);
  const save = () => {
    try {
      if (props.filter) {
        for (const v of /* @__PURE__ */ new Set([...selected, ...props.selected ?? []])) if (selected.includes(v) !== (props.selected ?? []).includes(v)) props.onSelect(v);
        props.onMissing?.(missing);
      } else {
        if (removeMode) props.onRemoveMode?.();
        if (following && props.onFollowSource) props.onFollowSource();
        else props.onChange(draft);
      }
      props.onBack();
    } catch (e) {
      setError(e);
    }
  };
  const dirty = following !== !!props.followingSource || removeMode || canonical(draft) !== canonical(props.value) || canonical(selected) !== canonical(props.selected ?? []) || missing !== !!props.missing;
  (0, import_react4.useEffect)(() => {
    props.onDirty?.(dirty);
    return () => props.onDirty?.(false);
  }, [dirty, props.onDirty]);
  return (0, import_react4.createElement)("div", null, !props.filter && props.onFollowSource && (0, import_react4.createElement)("div", { className: "dmm-current-choice" }, (0, import_react4.createElement)("label", null, (0, import_react4.createElement)("input", { type: "checkbox", "aria-label": "\u8DDF\u968F\u6765\u6E90\u9ED8\u8BA4\u503C", checked: following, onChange: (e) => {
    setFollowing(e.target.checked);
    if (e.target.checked) setDraft(void 0);
  } }), "\u8DDF\u968F\u6765\u6E90"), (0, import_react4.createElement)("p", null, "\u6765\u6E90\u9ED8\u8BA4\uFF1A" + props.sourceText + " \xB7 \u5F53\u524D" + (following ? "\u8DDF\u968F\u6765\u6E90" : "\u81EA\u5B9A\u4E49\u914D\u7F6E"))), (0, import_react4.createElement)("p", { className: "dmm-muted", role: "status" }, dirty ? "\u672C\u9875\u6709\u4FEE\u6539\uFF0C\u5C1A\u672A\u63D0\u4EA4\u7236\u8349\u7A3F\u3002" : "\u672C\u9875\u65E0\u4FEE\u6539\u3002"), error && (0, import_react4.createElement)("div", { className: "dmm-error", role: "alert" }, error.message), (0, import_react4.createElement)(OptionContents, { ...props, value: draft, selected, missing, onChange: (value) => {
    setDraft(value);
    setFollowing(value === void 0 && !!props.onFollowSource);
  }, onSelect: (value) => setSelected((old) => old.includes(value) ? old.filter((v) => v !== value) : [...old, value]), onMissing: props.onMissing ? setMissing : void 0, onRemoveMode: props.onRemoveMode ? () => {
    setRemoveMode(true);
    setDraft(void 0);
  } : void 0, onAddValue: props.onAddValue ? (value) => {
    const token = canonical(value);
    setSelected((old) => [.../* @__PURE__ */ new Set([...old, token])]);
  } : void 0, onSave: save }));
}
function OptionContents({ field, value, onChange, catalog, onBack, filter = false, options: givenOptions, selected = [], onSelect, missing, onMissing, onAddValue, effectiveType, localType, onRemoveMode, onSave }) {
  const [search, setSearch] = (0, import_react4.useState)(""), [provider, setProvider] = (0, import_react4.useState)(""), [preset, setPreset] = (0, import_react4.useState)(""), [composed, setComposed] = (0, import_react4.useState)(void 0);
  const mode = field.split(".")[0], support = catalog?.modes?.[mode], options = givenOptions ?? catalog?.fields?.[field] ?? [];
  const modeCatalog = contextualCatalog(catalog, { mode, type: effectiveType, filter });
  const choices = filter ? options : options.map((o) => ({ ...o, ...optionAvailability(o, field, catalog, { type: effectiveType, localType }) }));
  const visible = choices.filter((o) => (!provider || !o.adapterIds?.length || o.adapterIds.includes(provider)) && (!preset || o.presetIds?.includes(preset)) && (!search || (o.label + " " + o.id + " " + (o.description ?? "") + " " + describeValue(o.value, field, catalog)).toLocaleLowerCase().includes(search.toLocaleLowerCase())));
  const editable = true;
  const choose = (o) => {
    if (filter) return onSelect(o.token ?? o.id);
    if (field.endsWith(".on") && support?.onSelection === "multiple") {
      const prior = value === void 0 ? [] : Array.isArray(value) ? value : [value];
      onChange(prior.includes(o.value) ? prior.filter((v) => v !== o.value) : [...prior, o.value]);
    } else onChange(o.kind === "condition" && o.parameters ? { condition: { id: o.id, params: parameterDefault(o.parameters) } } : structuredClone(o.value));
  };
  return (0, import_react4.createElement)("div", { "data-page": "options", className: "dmm-options-page" }, (0, import_react4.createElement)("div", { className: "dmm-page-top dmm-page-nav" }, (0, import_react4.createElement)("button", { className: "dmm-link", onClick: onBack }, "\u2190 \u8FD4\u56DE" + (filter ? "\u7B5B\u9009" : "\u914D\u7F6E") + "\uFF08\u4E22\u5F03\u672C\u9875\u4FEE\u6539\uFF09"), (0, import_react4.createElement)("a", { href: catalog.documentation, target: "_blank", rel: "noreferrer" }, "\u6269\u5C55\u6587\u6863 \u2197")), (0, import_react4.createElement)("h2", null, (filter ? "\u7B5B\u9009 \xB7 " : "\u9009\u62E9 \xB7 ") + (fieldLabels[field] ?? ({ adapterId: "\u8D44\u6E90\u63D0\u4F9B\u65B9", turn: "\u8F6E\u6B21", turnKind: "\u8F6E\u6B21\u6765\u6E90", storeStatus: "\u5B58\u50A8\u89E6\u53D1", retrieveStatus: "\u8BFB\u53D6\u89E6\u53D1" }[field] ?? field))), (0, import_react4.createElement)("p", { className: "dmm-muted" }, filter ? "\u9009\u62E9\u7684\u503C\u5728\u672C\u5B57\u6BB5\u5185\u6EE1\u8DB3\u4EFB\u4E00\uFF1B\u4E0E\u5176\u4ED6\u5B57\u6BB5\u540C\u65F6\u6EE1\u8DB3\u3002" : "\u9009\u62E9\u53EA\u4FEE\u6539\u672C\u9875\u8349\u7A3F\u3002\u5DE6\u4E0A\u8FD4\u56DE\u4F1A\u4E22\u5F03\uFF1B\u4FDD\u5B58\u5E76\u8FD4\u56DE\u63D0\u4EA4\u5230\u7236\u8349\u7A3F\uFF0C\u6700\u7EC8\u4FDD\u5B58\u7BA1\u7406\u914D\u7F6E\u624D\u5199\u6587\u4EF6\u3002"), !filter && !catalog.requestSourceAvailable && mode === "retrieve" && (0, import_react4.createElement)("p", { className: "dmm-unconfigured" }, "\u8BF7\u6C42\u88C5\u914D\u670D\u52A1\u672A\u63A5\u5165\uFF1B\u4FDD\u5B58\u7BA1\u7406\u914D\u7F6E\u4E0D\u4F1A\u81EA\u52A8\u521B\u5EFA\u6216\u9009\u62E9\u6A21\u578B\u8BF7\u6C42\u6765\u6E90\u3002"), !filter && ["store", "retrieve"].includes(mode) && support?.supported !== true && (0, import_react4.createElement)("p", { className: "dmm-unconfigured" }, support?.reason ?? "\u5F53\u524D\u6765\u6E90\u672A\u58F0\u660E\u6B64\u6A21\u5F0F\u7684\u80FD\u529B\uFF1B\u5DF2\u6709\u914D\u7F6E\u4FDD\u7559\uFF0C\u53EF\u660E\u786E\u6E05\u7A7A\u6216\u66FF\u6362\u6765\u6E90\u540E\u914D\u7F6E\u3002"), (0, import_react4.createElement)("div", { className: "dmm-option-search" }, (0, import_react4.createElement)("input", { "aria-label": "\u641C\u7D22\u9009\u9879", placeholder: "\u641C\u7D22\u540D\u79F0\u6216\u8BF4\u660E", value: search, onChange: (e) => setSearch(e.target.value) }), (0, import_react4.createElement)("select", { "aria-label": "\u6309\u8D44\u6E90\u63D0\u4F9B\u65B9\u7B5B\u9009\u9009\u9879", value: provider, onChange: (e) => setProvider(e.target.value) }, (0, import_react4.createElement)("option", { value: "" }, "\u6240\u6709\u63D0\u4F9B\u65B9"), ...catalog.adapters.map((a) => (0, import_react4.createElement)("option", { key: a.id, value: a.id }, a.label))), (0, import_react4.createElement)("select", { "aria-label": "\u6309\u9884\u8BBE\u7B5B\u9009\u9009\u9879", value: preset, onChange: (e) => setPreset(e.target.value) }, (0, import_react4.createElement)("option", { value: "" }, "\u6240\u6709\u9884\u8BBE"), ...catalog.presets.map((p) => (0, import_react4.createElement)("option", { key: p.id, value: p.id }, p.label)))), !filter && (0, import_react4.createElement)("div", { className: "dmm-current-choice" }, (0, import_react4.createElement)("strong", null, "\u5F53\u524D\u8349\u7A3F"), (0, import_react4.createElement)("p", null, describeValue(value, field, catalog)), (0, import_react4.createElement)("button", { onClick: () => onChange(void 0) }, "\u6E05\u7A7A\u672C\u5730\u5B57\u6BB5"), field === "preset" && (0, import_react4.createElement)("button", { onClick: () => onChange(null) }, "\u4E0D\u5F15\u7528\u9884\u8BBE"), onRemoveMode && (0, import_react4.createElement)("button", { onClick: onRemoveMode }, mode === "store" ? "\u79FB\u9664\u672C\u5730\u5B58\u50A8\u914D\u7F6E" : "\u79FB\u9664\u672C\u5730\u8BFB\u53D6\u914D\u7F6E"), onRemoveMode && (0, import_react4.createElement)("p", { className: "dmm-muted" }, "\u53EA\u79FB\u9664\u672C\u5730\u89C4\u5219\u8986\u76D6\uFF0C\u56DE\u5230\u9884\u8BBE\u6216\u9ED8\u8BA4\u503C\uFF1B\u4E0D\u5220\u9664\u8D44\u6E90\u6B63\u6587\u3002\u6B64\u64CD\u4F5C\u4E5F\u53EA\u5728\u4FDD\u5B58\u5E76\u8FD4\u56DE\u540E\u63D0\u4EA4\u7236\u8349\u7A3F\u3002")), filter && onMissing && (0, import_react4.createElement)("label", { className: "dmm-option" }, (0, import_react4.createElement)("input", { type: "checkbox", checked: !!missing, onChange: (e) => onMissing(e.target.checked) }), "\u5305\u62EC\u672A\u914D\u7F6E / \u672A\u5F15\u7528 / \u4E0D\u53EF\u5224\u5B9A"), (0, import_react4.createElement)("div", { className: "dmm-option-list" }, visible.length ? visible.map((o, i) => (0, import_react4.createElement)("label", { key: o.id + ":" + i, className: "dmm-option-card" }, (0, import_react4.createElement)("input", { type: filter || field.endsWith(".on") && support?.onSelection === "multiple" ? "checkbox" : "radio", name: "field-option", checked: filter ? selected.includes(o.token ?? o.id) : field.endsWith(".on") && Array.isArray(value) ? value.includes(o.value) : equal(value, o.value), disabled: false, onChange: () => choose(o) }), (0, import_react4.createElement)("span", null, (0, import_react4.createElement)("strong", null, o.label), (0, import_react4.createElement)("small", null, o.description ?? describeValue(o.value, field, catalog)), o.available === false && (0, import_react4.createElement)("small", { className: "dmm-muted" }, o.reason ?? "\u5F53\u524D\u6765\u6E90\u4E0D\u652F\u6301"), o.presetIds?.length > 0 && (0, import_react4.createElement)("small", null, "\u6765\u81EA\u9884\u8BBE\uFF1A" + o.presetIds.map((id) => labelFor(catalog.presets, id)).join("\u3001"))))) : (0, import_react4.createElement)("p", { className: "dmm-muted" }, "\u6CA1\u6709\u5339\u914D\u9009\u9879\u3002")), !filter && editable && field.endsWith(".rule") && (0, import_react4.createElement)("section", { className: "dmm-card" }, (0, import_react4.createElement)("h3", null, "\u7EC4\u5408\u89C4\u5219"), (0, import_react4.createElement)(RuleEditor, { value, onChange, catalog: modeCatalog })), !filter && editable && field.endsWith(".strategy") && (0, import_react4.createElement)("section", { className: "dmm-card" }, (0, import_react4.createElement)("h3", null, "\u987A\u5E8F\u64CD\u4F5C\u94FE"), (0, import_react4.createElement)(StrategyEditor, { value, onChange, catalog: modeCatalog })), !filter && ["whitelist", "blacklist"].includes(field) && (0, import_react4.createElement)(ScopeEditor, { value: value ?? [], onChange, catalog }), filter && onAddValue && (field.endsWith(".rule") || field.endsWith(".strategy") || ["whitelist", "blacklist"].includes(field)) && (0, import_react4.createElement)("section", { className: "dmm-card" }, (0, import_react4.createElement)("h3", null, "\u6784\u9020\u5339\u914D\u503C"), field.endsWith(".rule") ? (0, import_react4.createElement)(RuleEditor, { value: composed, onChange: setComposed, catalog: modeCatalog }) : field.endsWith(".strategy") ? (0, import_react4.createElement)(StrategyEditor, { value: composed, onChange: setComposed, catalog: modeCatalog }) : (0, import_react4.createElement)(ScopeEditor, { value: composed ?? [], onChange: setComposed, catalog }), (0, import_react4.createElement)("button", { disabled: composed === void 0, onClick: () => onAddValue(composed) }, "\u52A0\u5165\u7B5B\u9009\u503C")), (0, import_react4.createElement)("div", { className: "dmm-sticky-actions" }, (0, import_react4.createElement)("button", { className: "dmm-primary", onClick: onSave }, "\u4FDD\u5B58\u5E76\u8FD4\u56DE")));
}

// src/client-presets.js
var format = "dsh-memory-manager-presets";
var fields2 = ["type", ...["store", "retrieve"].flatMap((m) => ["on", "rule", "strategy"].map((p) => m + "." + p))];
var at2 = (x, path) => path.split(".").reduce((v, k) => v?.[k], x);
var portable = (p) => Object.fromEntries(["id", "label", "description", "adapterIds", "configuration"].filter((k) => p[k] !== void 0).map((k) => [k, p[k]]));
var bundle = (presets) => ({ format, version: 1, presets: presets.map(portable) });
function download(presets) {
  const blob = new Blob([JSON.stringify(bundle(presets), null, 2) + "\n"], { type: "application/json" }), url = URL.createObjectURL(blob), a = document.createElement("a");
  a.href = url;
  a.download = "memory-presets.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
function PresetsPage({ api: api2, onBack, onChange }) {
  const [library, setLibrary] = (0, import_react5.useState)(null), [draft, setDraft] = (0, import_react5.useState)(null), [saved, setSaved] = (0, import_react5.useState)(""), [catalog, setCatalog] = (0, import_react5.useState)(null), [field, setField] = (0, import_react5.useState)(null), [fieldDirty, setFieldDirty] = (0, import_react5.useState)(false), [error, setError] = (0, import_react5.useState)(null), [busy, setBusy] = (0, import_react5.useState)(false), [notice, setNotice] = (0, import_react5.useState)(""), [editing, setEditing] = (0, import_react5.useState)(false);
  const file = (0, import_react5.useRef)(null), ctrl = (0, import_react5.useRef)(null), request = (0, import_react5.useRef)(null);
  const dirty = !!draft && JSON.stringify(draft) !== saved;
  const load = async () => {
    setError(null);
    try {
      const x = await api2("/presets", void 0, ctrl.current.signal);
      if (!ctrl.current.signal.aborted) setLibrary(x);
    } catch (e) {
      if (!ctrl.current.signal.aborted) setError(e);
    }
  };
  (0, import_react5.useEffect)(() => {
    const c = new AbortController();
    ctrl.current = c;
    load();
    return () => {
      c.abort();
      request.current?.abort();
    };
  }, []);
  (0, import_react5.useEffect)(() => {
    if (!draft) return;
    const c = new AbortController();
    request.current = c;
    setCatalog(null);
    const q = new URLSearchParams(draft.adapterIds[0] ? { adapterId: draft.adapterIds[0] } : {});
    api2("/options?" + q, void 0, c.signal).then((x) => {
      if (!c.signal.aborted) setCatalog(x);
    }).catch((e) => {
      if (!c.signal.aborted) setError(e);
    });
    return () => c.abort();
  }, [draft?.adapterIds.join("\0")]);
  (0, import_react5.useEffect)(() => {
    if (!dirty && !fieldDirty) return;
    const f = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", f);
    return () => window.removeEventListener("beforeunload", f);
  }, [dirty, fieldDirty]);
  const discard = () => !(dirty || fieldDirty) || window.confirm("\u4E22\u5F03\u672A\u4FDD\u5B58\u7684\u9884\u8BBE\u8349\u7A3F\uFF1F");
  const open = (p, edit) => {
    if (!discard()) return;
    const next = portable(p);
    setDraft(next);
    setSaved(edit ? JSON.stringify(next) : "");
    setEditing(edit);
    setField(null);
    setError(null);
    setNotice("");
  };
  const update = (key, value) => setDraft((x) => ({ ...x, [key]: value }));
  const changeField = (value) => {
    setDraft((x) => {
      const configuration = structuredClone(x.configuration), [mode, part] = field.split(".");
      if (part) {
        configuration[mode] ??= {};
        if (value === void 0) delete configuration[mode][part];
        else configuration[mode][part] = value;
      } else if (value === void 0) delete configuration[mode];
      else configuration[mode] = value;
      return { ...x, configuration };
    });
    setNotice("");
  };
  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const x = await api2("/save-presets", { bundle: bundle([draft]), expectedRevision: library.revision, replace: editing }, ctrl.current.signal);
      setLibrary({ ...library, ...x });
      setSaved(JSON.stringify(draft));
      setEditing(true);
      setNotice("\u9884\u8BBE\u5DF2\u4FDD\u5B58\u3002\u5F15\u7528\u6B64\u9884\u8BBE\u7684\u8D44\u6E90\u4F1A\u4F7F\u7528\u65B0\u7EC4\u5408\uFF1B\u6CA1\u6709\u66F4\u6539\u6B63\u6587\u6216\u6388\u4E88\u8303\u56F4\u6743\u9650\u3002");
      onChange();
    } catch (e) {
      if (!ctrl.current.signal.aborted) setError(e);
    } finally {
      if (!ctrl.current.signal.aborted) setBusy(false);
    }
  };
  const importFile = async (e) => {
    const selected = e.target.files[0];
    e.target.value = "";
    if (!selected || !discard()) return;
    setBusy(true);
    setError(null);
    try {
      if (selected.size > 2e6) throw Error("\u5BFC\u5165\u6587\u4EF6\u8D85\u8FC7 2 MB\u3002");
      const imported = JSON.parse(await selected.text()), x = await api2("/save-presets", { bundle: imported, expectedRevision: library.revision, replace: false }, ctrl.current.signal);
      setLibrary({ ...library, ...x });
      setDraft(null);
      setNotice(`\u5DF2\u6574\u6279\u5BFC\u5165 ${imported.presets.length} \u9879\u9884\u8BBE\u3002`);
      onChange();
    } catch (e2) {
      if (!ctrl.current.signal.aborted) setError(e2);
    } finally {
      if (!ctrl.current.signal.aborted) setBusy(false);
    }
  };
  return (0, import_react5.createElement)("div", { "data-page": "presets" }, (0, import_react5.createElement)("div", { className: "dmm-page-top dmm-page-nav" }, (0, import_react5.createElement)("button", { className: "dmm-link", onClick: () => {
    if (discard()) onBack();
  } }, "\u2190 \u8FD4\u56DE\u8D44\u6E90\u8868\u683C")), (0, import_react5.createElement)("h2", null, "\u5B58\u53D6\u9884\u8BBE"), (0, import_react5.createElement)("a", { href: "/api/dsh-memory-manager/documentation?document=PRESETS", target: "_blank", rel: "noreferrer" }, "\u9884\u8BBE\u8BF4\u660E \u2197"), (0, import_react5.createElement)("p", { className: "dmm-muted" }, "\u9884\u8BBE\u662F\u53EF\u590D\u7528\u7684\u5B58\u50A8\u4E0E\u8BFB\u53D6\u7EC4\u5408\uFF0C\u4E0D\u4FDD\u5B58\u8D44\u6E90\u6B63\u6587\u3001\u8D44\u6E90 ID \u6216\u767D\u9ED1\u540D\u5355\u3002\u9ED8\u8BA4\u9884\u8BBE\u53EF\u7F16\u8F91\uFF1B\u4FDD\u5B58\u4E3A\u672C\u5730\u8986\u76D6\u540E\u4FDD\u7559\u4F60\u7684\u4FEE\u6539\u3002"), error && (0, import_react5.createElement)("div", { className: "dmm-error", role: "alert" }, error.message, ...(error.diagnostics ?? []).map((d, i) => (0, import_react5.createElement)("p", { key: i }, d.field + "\uFF1A" + d.message))), error && (0, import_react5.createElement)("button", { disabled: busy, onClick: load }, "\u91CD\u65B0\u8BFB\u53D6\u9884\u8BBE"), notice && (0, import_react5.createElement)("p", { role: "status", className: "dmm-status" }, notice), !library && !error && (0, import_react5.createElement)("p", { role: "status" }, "\u6B63\u5728\u8BFB\u53D6\u9884\u8BBE\u2026"), library && (0, import_react5.createElement)("div", null, (0, import_react5.createElement)("div", { className: "dmm-actions" }, (0, import_react5.createElement)("button", { disabled: busy, onClick: () => open({ id: "preset-" + crypto.randomUUID(), label: "\u65B0\u5B58\u53D6\u9884\u8BBE", description: "", adapterIds: [], configuration: { retrieve: {} } }, false) }, "\u65B0\u5EFA\u9884\u8BBE"), (0, import_react5.createElement)("button", { disabled: busy, onClick: () => file.current.click() }, "\u5BFC\u5165\u9884\u8BBE"), (0, import_react5.createElement)("button", { disabled: busy || !library.presets.length, onClick: () => download(library.presets) }, "\u5BFC\u51FA\u5168\u90E8\u9884\u8BBE"), (0, import_react5.createElement)("input", { ref: file, type: "file", accept: ".json,application/json", hidden: true, onChange: importFile, "aria-label": "\u5BFC\u5165\u9884\u8BBE\u6587\u4EF6" })), (0, import_react5.createElement)("div", { className: "dmm-option-list" }, ...library.presets.map((p) => (0, import_react5.createElement)("div", { key: p.id, className: "dmm-card" }, (0, import_react5.createElement)("strong", null, p.label), (0, import_react5.createElement)("p", null, p.origin === "local" ? "\u672C\u5730\u9884\u8BBE" : p.origin === "adapter" ? "adapter \u9ED8\u8BA4\u9884\u8BBE" : "\u5185\u7F6E\u9ED8\u8BA4\u9884\u8BBE"), (0, import_react5.createElement)("code", null, p.id), p.description && (0, import_react5.createElement)("p", null, p.description), (0, import_react5.createElement)("p", { className: "dmm-muted" }, "\u9002\u7528 adapter\uFF1A" + p.adapterIds.join("\u3001")), (0, import_react5.createElement)("div", { className: "dmm-actions" }, (0, import_react5.createElement)("button", { disabled: busy, onClick: () => open(p, true) }, "\u7F16\u8F91 " + p.label), (0, import_react5.createElement)("button", { disabled: busy, onClick: () => download([p]) }, "\u5BFC\u51FA " + p.label))))), draft && (0, import_react5.createElement)("section", { className: "dmm-card", "aria-label": "\u9884\u8BBE\u7F16\u8F91\u5668" }, (0, import_react5.createElement)("h3", null, editing ? "\u7F16\u8F91\u9884\u8BBE" : "\u65B0\u5EFA\u9884\u8BBE"), (0, import_react5.createElement)("label", null, "\u9884\u8BBE ID", (0, import_react5.createElement)("input", { "aria-label": "\u9884\u8BBE ID", readOnly: editing, value: draft.id, onChange: (e) => update("id", e.target.value) })), (0, import_react5.createElement)("label", null, "\u540D\u79F0", (0, import_react5.createElement)("input", { "aria-label": "\u9884\u8BBE\u540D\u79F0", value: draft.label, onChange: (e) => update("label", e.target.value) })), (0, import_react5.createElement)("label", null, "\u8BF4\u660E", (0, import_react5.createElement)("textarea", { "aria-label": "\u9884\u8BBE\u8BF4\u660E", value: draft.description ?? "", onChange: (e) => update("description", e.target.value) })), !catalog ? (0, import_react5.createElement)("p", { role: "status" }, "\u6B63\u5728\u8BFB\u53D6 adapter \u80FD\u529B\u2026") : (0, import_react5.createElement)("div", null, (0, import_react5.createElement)("fieldset", null, (0, import_react5.createElement)("legend", null, "\u9002\u7528 adapter\uFF08\u4FDD\u5B58\u65F6\u9010\u4E2A\u4E25\u683C\u6821\u9A8C\uFF09"), ...catalog.adapters.map((a) => (0, import_react5.createElement)("label", { key: a.id }, (0, import_react5.createElement)("input", { type: "checkbox", checked: draft.adapterIds.includes(a.id), onChange: (e) => update("adapterIds", e.target.checked ? [...draft.adapterIds, a.id] : draft.adapterIds.filter((id) => id !== a.id)) }), a.label + (a.enabled ? "" : "\uFF08\u5DF2\u505C\u7528\uFF09")))), field ? (0, import_react5.createElement)(OptionPage, { key: field, field, value: at2(draft.configuration, field), catalog, effectiveType: draft.configuration.type, localType: draft.configuration.type, onDirty: setFieldDirty, onChange: changeField, onBack: () => {
    setField(null);
    setFieldDirty(false);
  }, onRemoveMode: field.includes(".") ? () => {
    const mode = field.split(".")[0];
    setDraft((x) => {
      const configuration = { ...x.configuration };
      delete configuration[mode];
      return { ...x, configuration };
    });
  } : void 0 }) : (0, import_react5.createElement)("div", { className: "dmm-grid" }, ...fields2.map((key) => (0, import_react5.createElement)("button", { key, className: "dmm-field-choice", onClick: () => setField(key) }, (0, import_react5.createElement)("strong", null, fieldLabels[key]), (0, import_react5.createElement)("span", null, describeValue(at2(draft.configuration, key), key, catalog))))), (0, import_react5.createElement)("div", { className: "dmm-sticky-actions" }, (0, import_react5.createElement)("button", { className: "dmm-primary", disabled: busy || !dirty || fieldDirty, onClick: save }, busy ? "\u6B63\u5728\u6821\u9A8C\u2026" : "\u4FDD\u5B58\u9884\u8BBE"), (0, import_react5.createElement)("button", { disabled: busy, onClick: () => {
    if (discard()) setDraft(null);
  } }, "\u5173\u95ED\u7F16\u8F91\u5668"))))));
}

// src/client-adapters.js
var import_react6 = require("react");
function AdaptersPage({ onBack, onChange }) {
  const [data, setData] = (0, import_react6.useState)(null), [error, setError] = (0, import_react6.useState)(null), [busy, setBusy] = (0, import_react6.useState)(false);
  const load = async (signal) => {
    try {
      const r = await fetch("/api/dsh-memory-manager/adapters", { signal }), result = await r.json();
      if (!r.ok) throw Error(result.error?.message);
      setData(result);
      setError(null);
    } catch (e) {
      if (e.name !== "AbortError") setError(e.message);
    }
  };
  (0, import_react6.useEffect)(() => {
    const c = new AbortController();
    let timer;
    const refresh = async () => {
      await load(c.signal);
      if (!c.signal.aborted) timer = setTimeout(refresh, 2500);
    };
    refresh();
    return () => {
      c.abort();
      clearTimeout(timer);
    };
  }, []);
  const toggle = async (id, enabled, kind) => {
    setBusy(true);
    try {
      const r = await fetch("/api/dsh-memory-manager/adapter-enabled", { method: "POST", headers: { "Content-Type": "application/json", "X-DSH-Memory-Manager": "1" }, body: JSON.stringify({ id, enabled, kind }) }), result = await r.json();
      if (!r.ok) throw Error(result.error?.message);
      setData(result);
      setError(null);
      onChange();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (0, import_react6.createElement)("div", { "data-page": "adapters" }, (0, import_react6.createElement)("div", { className: "dmm-page-top dmm-page-nav" }, (0, import_react6.createElement)("button", { className: "dmm-link", onClick: onBack }, "\u2190 \u8FD4\u56DE\u8D44\u6E90\u8868\u683C")), (0, import_react6.createElement)("h2", null, "Adapter"), (0, import_react6.createElement)("p", { className: "dmm-muted" }, "\u5F00\u5173\u7ACB\u5373\u5F71\u54CD\u5F53\u524D manager \u7684\u76EE\u5F55\u548C\u89C4\u5219\u8DEF\u7531\u3002\u89C4\u5219\u6587\u4EF6\u4E0E\u6B63\u6587\u5747\u4FDD\u7559\uFF1B\u91CD\u542F\u540E\u6062\u590D\u5DF2\u5B89\u88C5\u63D2\u4EF6\u7684\u9ED8\u8BA4\u542F\u7528\u72B6\u6001\u3002\u5378\u8F7D\u7531 Host \u7BA1\u7406\u3002"), error && (0, import_react6.createElement)("div", { className: "dmm-error", role: "alert" }, error), !data ? (0, import_react6.createElement)("p", null, "\u6B63\u5728\u8BFB\u53D6\u5DF2\u5B89\u88C5 adapter\u2026") : (0, import_react6.createElement)("div", null, ...[["\u8D44\u6E90\u4E0E\u89C4\u5219 adapter", data.adapters, "resource"], ["\u4F5C\u7528\u57DF\u76EE\u5F55 adapter", data.directories, "directory"]].map(([label, rows, kind]) => (0, import_react6.createElement)("section", { className: "dmm-card", key: kind }, (0, import_react6.createElement)("h3", null, label), ...rows.map((a) => (0, import_react6.createElement)("section", { className: "dmm-filter-card", key: a.id }, (0, import_react6.createElement)("div", { className: "dmm-section-head" }, (0, import_react6.createElement)("strong", null, a.label), a.installed !== false && (0, import_react6.createElement)("label", { className: "dmm-option" }, (0, import_react6.createElement)("input", { type: "checkbox", "aria-label": "\u542F\u7528 " + a.id, checked: a.enabled, disabled: busy, onChange: (e) => toggle(a.id, e.target.checked, kind) }), "\u542F\u7528")), (0, import_react6.createElement)("code", null, a.id), (0, import_react6.createElement)("p", { className: "dmm-muted" }, a.description ?? a.authority ?? (a.installed ? "\u6765\u6E90\u5DF2\u5B89\u88C5" : "\u672A\u5B89\u88C5")), a.installed === false && (0, import_react6.createElement)("p", null, a.installation), a.documentation && (0, import_react6.createElement)("a", { href: a.documentation, target: "_blank", rel: "noreferrer" }, "\u5B89\u88C5\u4E0E\u5951\u7EA6\u6587\u6863 \u2197"))))), (0, import_react6.createElement)("p", { className: "dmm-unconfigured" }, "\u6CA1\u6709\u76EE\u5F55 adapter \u65F6\u53EF\u67E5\u770B\u5DF2\u6709\u7A33\u5B9A ID \u914D\u7F6E\uFF1B\u9009\u62E9\u65B0\u5B9E\u4F53\u9700\u5B89\u88C5\u6765\u6E90\u652F\u6301\u7684\u76EE\u5F55\u63A5\u53E3\u3002")));
}

// src/client-style.js
var css = `
.dmm{--dmm-button-fill:var(--dsw-alias-bg-module-platform,color-mix(in srgb,currentColor 5%,transparent));--dmm-surface:var(--dsw-alias-bg-layer-2,Canvas);font:13px/1.55 var(--dsw-font-family,system-ui);color:var(--dsw-alias-label-primary,#ddd);padding:20px;min-width:0;box-sizing:border-box}
.dmm *{box-sizing:border-box}.dmm h2{font-size:20px;margin:0}.dmm h3{font-size:15px;margin:0 0 12px}.dmm p{margin:6px 0 14px}.dmm .dmm-muted{color:var(--dsw-alias-label-secondary,#888)}
.dmm button,.dmm input,.dmm select,.dmm textarea{font:inherit;border:1px solid var(--dsw-alias-border-l2,#444);border-radius:7px;color:inherit;background:var(--dsw-alias-bg-base,#202125);padding:7px 10px}.dmm button{appearance:none;cursor:pointer;border:0;box-shadow:none;min-height:40px;padding:8px 14px;background:var(--dmm-button-fill);scroll-margin-block:104px 120px}.dmm input:not([type=checkbox]):not([type=radio]),.dmm select{min-height:36px;height:36px}.dmm button:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,#8883)}.dmm button:disabled{cursor:default;opacity:.55}.dmm button:focus-visible,.dmm input:focus-visible,.dmm textarea:focus-visible,.dmm select:focus-visible,.dmm a:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#679eaf);outline-offset:3px}
.dmm .dmm-primary{background:#456f66;color:white;border:0}.dmm .dmm-primary:hover:not(:disabled){background:#527f74}.dmm .dmm-link{border:0;background:transparent;padding:8px 14px;color:var(--dsw-alias-label-primary,#ddd);text-align:left}.dmm input,.dmm textarea,.dmm select{max-width:100%}.dmm textarea{width:100%;min-height:90px;resize:vertical;font:12px/1.6 monospace}.dmm input:not([type=checkbox]):not([type=radio]),.dmm select{width:100%}.dmm input[readonly]{background:var(--dsw-alias-bg-l1,#8881)}.dmm input[type=checkbox],.dmm input[type=radio]{width:17px;height:17px;flex-shrink:0;accent-color:#456f66}
.dmm-heading,.dmm-toolbar,.dmm-actions,.dmm-title-line,.dmm-page-top{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.dmm-heading{justify-content:space-between;margin-bottom:6px}.dmm-toolbar{justify-content:space-between;margin:16px 0 12px}.dmm-actions{gap:6px}.dmm-page-top{justify-content:space-between;margin-bottom:18px}.dmm-page-nav{position:sticky;top:0;z-index:3;width:fit-content;max-width:100%;padding:8px 0;background:none;border:0;box-shadow:none;filter:none;backdrop-filter:none;pointer-events:none}.dmm .dmm-page-nav>.dmm-link,.dmm .dmm-sticky-actions .dmm-help{background:var(--dmm-surface)}.dmm-page-nav>a{display:inline-flex;align-items:center;min-height:40px;padding:8px 14px;border-radius:7px;background:var(--dmm-surface)}.dmm-page-nav>button,.dmm-page-nav>a,.dmm-sticky-actions button{pointer-events:auto}.dmm .dmm-sticky-actions button:not(.dmm-primary):not(.dmm-help),.dmm .dmm-page-nav>button:not(.dmm-link){background:linear-gradient(var(--dmm-button-fill),var(--dmm-button-fill)),var(--dmm-surface)}.dmm .dmm-sticky-actions button:hover:not(:disabled):not(.dmm-primary),.dmm .dmm-page-nav>button:hover:not(:disabled),.dmm-page-nav>a:hover{background:linear-gradient(var(--dsw-alias-interactive-bg-hover,#8883),var(--dsw-alias-interactive-bg-hover,#8883)),var(--dmm-surface)}.dmm .dmm-sticky-actions button:disabled,.dmm .dmm-page-nav>button:disabled{opacity:1;color:var(--dsw-alias-label-secondary,#888)}.dmm .dmm-sticky-actions .dmm-primary:disabled{background:color-mix(in srgb,#456f66 55%,var(--dmm-surface))}.dmm-close{margin-left:auto}.dmm .dmm-help{display:inline-flex;align-items:center;justify-content:center;flex:0 0 36px;width:36px;height:36px;min-height:36px;padding:0;border:0;background:transparent;color:var(--dsw-alias-label-secondary,#888);font-size:17px}.dmm-badge{font-size:11px;display:inline-block;padding:1px 7px;border-radius:12px;background:#6c9c8b22;color:inherit;margin-left:6px}
.dmm-table-wrap{width:100%;overflow:auto;border:1px solid var(--dsw-alias-border-l2,#444);border-radius:10px}.dmm table{width:100%;border-collapse:collapse;table-layout:fixed;min-width:560px}.dmm th{text-align:left;font-size:11px;font-weight:500;color:var(--dsw-alias-label-secondary,#888);padding:11px 9px;background:var(--dsw-alias-bg-l1,#8881)}.dmm td{vertical-align:top;padding:13px 9px;border-top:1px solid var(--dsw-alias-border-l2,#444);font-size:12px;overflow-wrap:anywhere}.dmm th:first-child{width:26%}.dmm th:nth-child(2){width:13%}.dmm th:nth-child(3){width:12%}.dmm th:last-child{width:13%}.dmm-resource-status .dmm-id{white-space:normal}.dmm-resource-name{font-weight:600}.dmm-id{display:block;margin-top:4px;font:10px/1.45 monospace;color:var(--dsw-alias-label-secondary,#888);overflow-wrap:anywhere}.dmm-summary{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.55}.dmm-detail-link{white-space:normal}.dmm-table-caption{font-size:11px;margin-top:8px;color:var(--dsw-alias-label-secondary,#888)}
.dmm-card{border:1px solid var(--dsw-alias-border-l2,#444);border-radius:10px;padding:16px;margin:14px 0}.dmm-grid{display:grid;align-items:start;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.dmm-field{min-width:0}.dmm-field>label,.dmm-field-label{display:block;font-weight:600;margin-bottom:6px}.dmm-field small{display:block;font-size:11px;color:var(--dsw-alias-label-secondary,#888);margin:4px 0;overflow-wrap:anywhere}.dmm-field pre,.dmm-effective{white-space:pre-wrap;overflow-wrap:anywhere;font:11px/1.6 monospace;margin:6px 0 0;max-height:170px;overflow:auto;background:var(--dsw-alias-bg-l1,#8881);border-radius:6px;padding:8px}.dmm-effective{border-left:2px solid #679eaf}.dmm-field-wide{grid-column:1/-1}.dmm-code-editor{min-height:210px!important}.dmm-origin{font-size:10px;font-weight:400;color:var(--dsw-alias-label-secondary,#888);display:block;margin-top:3px}.dmm-section-head{display:flex;gap:8px;align-items:center;margin-bottom:12px}.dmm-section-head h3{margin:0}.dmm-unconfigured{border-left:3px solid #8b929b;padding:8px 12px;background:#8881}.dmm-status{padding:9px 12px;background:#6c9c8b16;border:1px solid #6c9c8b55;border-radius:7px;margin:10px 0;overflow-wrap:anywhere}.dmm-error{padding:10px 12px;border:1px solid #b45a5a;border-radius:7px;background:#9c363615;color:var(--dsw-alias-label-danger,#bc6666);margin:10px 0;white-space:pre-wrap;overflow-wrap:anywhere}.dmm-diagnostic{padding:8px 0;border-top:1px solid var(--dsw-alias-border-l2,#444);font-size:12px;overflow-wrap:anywhere}.dmm-diagnostic[data-level=error]{color:#bc6666}.dmm-diagnostic small{display:block;color:var(--dsw-alias-label-secondary,#888)}.dmm-diagnostics{margin-top:12px}.dmm pre{white-space:pre-wrap;overflow-wrap:anywhere;max-height:300px;overflow:auto}
.dmm-filter-card{border:1px solid var(--dsw-alias-border-l2,#444);border-radius:10px;padding:14px;min-width:0}.dmm-filter-card h3{display:flex;align-items:center;gap:5px;margin-bottom:8px}.dmm-options{max-height:180px;overflow:auto;margin-top:8px}.dmm-option{display:flex;align-items:flex-start;gap:7px;padding:6px 0;overflow-wrap:anywhere}.dmm-option span{min-width:0}.dmm-filter-add{display:flex;gap:6px;margin-top:8px}.dmm-filter-add input{min-width:0}.dmm-filter-add button{white-space:nowrap;flex-shrink:0}.dmm-tags{display:flex;gap:5px;flex-wrap:wrap;margin:8px 0}.dmm-tags button{max-width:100%;font-size:11px;overflow-wrap:anywhere;text-align:left}.dmm-empty{padding:26px;text-align:center;color:var(--dsw-alias-label-secondary,#888)}.dmm-catalogs{font-size:11px;margin:12px 0}.dmm-catalogs summary,.dmm-advanced summary{cursor:pointer}.dmm-catalogs p{margin:5px 0}.dmm-advanced{margin:14px 0}.dmm-advanced textarea{margin-top:10px}.dmm-sticky-actions{position:sticky;bottom:0;z-index:2;width:fit-content;max-width:100%;padding:12px 0 10px;background:none;border:0;box-shadow:none;filter:none;backdrop-filter:none;pointer-events:none;margin-top:22px}.dmm-source-content{margin-top:20px}.dmm-entry-compact{display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;padding:2px;border:1px solid var(--dsw-alias-border-l2,#444);border-radius:6px;background:var(--dsw-alias-bg-base,#202125);color:var(--dsw-alias-label-primary,#eee);cursor:pointer}.dmm-entry-compact:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#679eaf);outline-offset:2px}.dmm-session-entry{position:absolute;top:12px;right:72px;z-index:7;pointer-events:none;-webkit-app-region:no-drag}.dmm-session-entry>button{pointer-events:auto}.dmm-session-entry>button:not(.dmm-entry-compact){height:28px;padding:4px 10px;border:1px solid var(--dsw-alias-border-l2,#444);border-radius:7px;background:var(--dsw-alias-bg-base,#202125);color:var(--dsw-alias-label-primary,#eee);font:inherit;font-size:12px;cursor:pointer}.dmm-session-entry>button:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#679eaf);outline-offset:2px}.dmm-overlay{--dmm-surface:var(--dsw-alias-bg-layer-2,Canvas);pointer-events:auto;position:fixed;inset:65px 16px 20px auto;width:min(790px,calc(100vw - 32px));z-index:1000;overflow:auto;border:1px solid var(--dsw-alias-border-l2,#444);border-radius:12px;background:var(--dmm-surface);box-shadow:0 15px 55px #0007}
.dmm input,.dmm select,.dmm textarea,.dmm a{scroll-margin-block:104px 120px}.dmm-section-head{flex-wrap:wrap}.dmm [hidden]{display:none!important}.dmm .dmm-field-choice{display:flex;flex-direction:column;align-items:flex-start;gap:7px;width:100%;text-align:left;padding:14px;overflow-wrap:anywhere;min-height:90px}.dmm-field-choice>small,.dmm-field-choice>span:last-child{color:var(--dsw-alias-label-secondary,#888)}.dmm-option-search{display:grid;grid-template-columns:2fr 1fr 1fr;gap:8px;margin:18px 0}.dmm-option-list{display:flex;flex-direction:column;gap:8px}.dmm-option-card{display:flex;align-items:flex-start;gap:10px;border:1px solid var(--dsw-alias-border-l2,#444);padding:12px;border-radius:8px;cursor:pointer}.dmm-option-card>span{flex:1;min-width:0}.dmm-option-card small{display:block;overflow-wrap:anywhere;margin-top:4px}.dmm-current-choice{padding:14px;background:var(--dsw-alias-bg-l1,#8881);border-radius:8px;margin:12px 0}.dmm-current-choice button{margin:4px}.dmm-rule-node{border-left:2px solid #679eaf55;padding:10px;margin:8px 0;min-width:0}.dmm-rule-child{margin-top:8px}.dmm-param{margin:8px 0}.dmm-param-label{display:flex;flex-direction:column;gap:5px;margin:8px 0}.dmm-param-label input[type=checkbox]{align-self:flex-start}.dmm-scope-row{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:8px 0}.dmm-scope-row>*{flex:1 1 160px}.dmm-scope-value{min-width:0}.dmm-scope-row>.dmm-scope-value:has([aria-label="\u9009\u62E9\u4F5C\u7528\u57DF\u5B9E\u4F53"]){flex-basis:100%;order:3}.dmm-scope-value>code{display:block;overflow-wrap:anywhere;margin-top:6px}.dmm-options-page{padding:4px 2px 12px}.dmm-option-list{margin-bottom:18px}.dmm-filter-card+.dmm-filter-card{margin-top:12px}.dmm-scope-row>select,.dmm-scope-row>button{align-self:flex-start}.dmm-scope-row>select{width:auto}.dmm-options-page a{color:inherit;font-size:12px}.dmm-options-page fieldset{min-width:0;border:1px solid var(--dsw-alias-border-l2,#444);border-radius:7px}
[data-shortcut-modal="settings"]:has([data-slot="settings.section"]>.dmm)>nav+div{min-height:0}[data-shortcut-modal="settings"]:has([data-slot="settings.section"]>.dmm)>nav+div>div:last-child{scroll-padding-block:104px 120px}.dmm-overlay{scroll-padding-block:104px 120px}
.dmm-comparison-field{margin:18px 0}.dmm-field-columns{display:grid;grid-template-columns:minmax(0,1fr) 132px minmax(0,1fr);gap:24px;align-items:start}.dmm-follow-cell label{display:flex;align-items:center;gap:6px;min-height:60px}.dmm-field-columns>div{min-width:0;position:relative;align-self:stretch}.dmm-field-columns>div+div::before{content:"";position:absolute;top:0;bottom:0;margin:12px 0;left:-13px;border-left:1px solid var(--dsw-alias-border-l2,#555)}.dmm-field-columns .dmm-effective{min-height:90px;margin-top:0}.dmm-field-columns .dmm-field-choice{min-height:90px}@media(max-width:600px){.dmm-field-columns{grid-template-columns:minmax(0,1fr) 108px minmax(0,1fr);gap:16px;min-width:490px}.dmm-field-columns>div+div::before{left:-9px}.dmm-comparison-field{overflow-x:auto}}
@media(min-width:601px){[data-shortcut-modal="settings"]:has([data-slot="settings.section"]>.dmm){width:min(1100px,calc(100vw - 40px));max-width:1100px}}
@media(max-width:600px){[data-shortcut-modal="settings"]:has([data-slot="settings.section"]>.dmm){flex-direction:column}[data-shortcut-modal="settings"]:has([data-slot="settings.section"]>.dmm)>nav{width:auto;flex-basis:auto;flex-shrink:0;padding:12px;max-height:170px;overflow:auto}[data-shortcut-modal="settings"]:has([data-slot="settings.section"]>.dmm)>nav>div:last-child{display:flex;flex-direction:row;flex-wrap:wrap;gap:4px}[data-shortcut-modal="settings"]:has([data-slot="settings.section"]>.dmm)>nav button{width:auto;flex:0 0 auto}.dmm{padding:12px}.dmm-grid{grid-template-columns:1fr}.dmm-option-search{grid-template-columns:1fr}.dmm-rule-node{padding:6px}.dmm-card{padding:12px}.dmm-toolbar{align-items:flex-start}.dmm table{min-width:610px}.dmm-page-top{gap:6px}.dmm-heading h2{font-size:19px}.dmm-sticky-actions .dmm-actions{gap:5px}.dmm-sticky-actions button:not(.dmm-help){flex:1 1 auto}}
`;

// src/client-request.js
async function requestJson(fetcher, url, { body, signal, readTimeoutMs = 3e4 } = {}) {
  const controller = new AbortController(), read = body === void 0;
  let timer, timedOut = false, rejectAbort;
  const aborted = new Promise((resolve, reject) => {
    rejectAbort = reject;
  });
  const onAbort = () => rejectAbort(controller.signal.reason ?? Object.assign(Error("\u8BF7\u6C42\u5DF2\u53D6\u6D88"), { name: "AbortError" }));
  controller.signal.addEventListener("abort", onAbort, { once: true });
  const cancel = () => controller.abort(signal.reason);
  if (signal?.aborted) cancel();
  else signal?.addEventListener("abort", cancel, { once: true });
  if (read) timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, readTimeoutMs);
  try {
    const r = await Promise.race([fetcher(url, { signal: controller.signal, headers: read ? void 0 : { "Content-Type": "application/json", "X-DSH-Memory-Manager": "1" }, method: read ? "GET" : "POST", body: read ? void 0 : JSON.stringify(body) }), aborted]);
    const data = await Promise.race([r.json(), aborted]);
    if (!r.ok) throw Object.assign(Error(data.error?.message ?? "\u8BF7\u6C42\u5931\u8D25"), data.error);
    return data;
  } catch (e) {
    if (timedOut && !signal?.aborted) throw Object.assign(Error(`\u6765\u6E90\u8BFB\u53D6\u8D85\u8FC7 ${Math.round(readTimeoutMs / 1e3)} \u79D2\uFF0C\u5C1A\u672A\u8FD4\u56DE\u3002\u8BF7\u91CD\u65B0\u8BFB\u53D6\uFF1B\u8FD9\u4E0D\u8868\u793A\u8D44\u6E90\u4E0D\u5B58\u5728\u6216\u6765\u6E90\u5DF2\u5378\u8F7D\u3002`), { code: "READ_TIMEOUT" });
    throw e;
  } finally {
    controller.signal.removeEventListener("abort", onAbort);
    clearTimeout(timer);
    signal?.removeEventListener("abort", cancel);
  }
}

// src/builtin-presets.js
var builtinPresets = {
  "builtin:skill-retrieve": { label: "Skill \xB7 \u8BF7\u6C42\u524D\u8BFB\u53D6\u6B63\u6587", adapterIds: ["dsh.skills"], configuration: { type: "skill", retrieve: { on: "before_model_request", rule: true, strategy: [{ operation: "memory.read_content" }, { operation: "memory.to_text" }] } } },
  "builtin:mvu-managed": { label: "MVU \xB7 \u66F4\u65B0\u4E0E\u8BFB\u53D6", adapterIds: ["tavern.mvu"], configuration: { type: "mvu-state", store: { on: "assistant_message_committed", rule: "contains_mvu_update", strategy: [{ operation: "parse_mvu_update" }, { operation: "validate_update" }, { operation: "apply_update" }] }, retrieve: { on: "before_model_request", rule: true, strategy: [{ operation: "read_content" }, { operation: "render_state_and_update_instructions" }, { operation: "provide_to_model" }] } } },
  "builtin:mvu-card-interaction": { legacy: true, label: "MVU \xB7 \u4EA4\u4E92\u66F4\u65B0\u7B56\u7565", description: "\u4EC5\u9009\u62E9\u6765\u6E90\u62A5\u544A\u7684\u4EA4\u4E92\u539F\u56E0\uFF1B\u4E0D\u6388\u4E88\u5361\u7247\u5199\u6743\u9650\u3002", adapterIds: ["tavern.mvu"], configuration: { type: "mvu-state", store: { on: "card_variable_update", rule: { condition: { id: "mvu_card_write_cause", params: { cause: "user-interaction" } } }, strategy: [{ operation: "validate_card_update" }, { operation: "apply_card_update" }] } } },
  "builtin:worldbook-retrieve": { label: "\u4E16\u754C\u4E66 \xB7 \u539F\u751F\u6FC0\u6D3B\u4E0E\u8F93\u51FA", adapterIds: ["tavern.world-books"], requiresSourcePolicy: true, configuration: { type: "world-book", retrieve: { on: "before_model_request", rule: true, strategy: [{ operation: "worldbook.activate" }, { operation: "worldbook.emit" }] } } },
  "builtin:prompt-template-retrieve": { label: "\u63D0\u793A\u8BCD\u6A21\u677F \xB7 \u5C55\u5F00\u4E0E\u8F93\u51FA", adapterIds: ["tavern.prompt-templates"], requiresSourcePolicy: true, configuration: { type: "prompt-template", retrieve: { on: "before_model_request", rule: true, strategy: [{ operation: "prompt_template.expand" }, { operation: "prompt_template.emit" }] } } }
};
var presetDefinitions = (doc) => ({ ...Object.fromEntries(Object.entries(builtinPresets).map(([id, p]) => [id, p.configuration])), ...doc.presets });

// src/config-composition.js
var clone = (value) => structuredClone(value);
function composeConfiguration(doc, id, sourceDefault = null) {
  const local = doc.entries.find((e) => e.id === id);
  if (!local && !sourceDefault) return { config: null, origins: {}, revision: doc.revision };
  const config = { whitelist: [], blacklist: [], preset: null }, origins = { whitelist: "default", blacklist: "default", preset: "default" };
  for (const [values, origin] of [[sourceDefault, "source-default"], [local, "local"]]) for (const [key, value] of Object.entries(values ?? {})) {
    if (["store", "retrieve"].includes(key)) {
      if (origin === "local" && !Object.keys(value).length) {
        config[key] = {};
        for (const field of Object.keys(origins)) if (field.startsWith(key + ".")) delete origins[field];
      } else config[key] = { ...config[key], ...clone(value) };
      for (const child of Object.keys(value)) origins[`${key}.${child}`] = origin;
    } else config[key] = clone(value);
    origins[key] = origin;
  }
  const preset = local?.preset == null ? null : presetDefinitions(doc)[local.preset];
  for (const [k, v] of Object.entries(preset ?? {})) {
    if (["store", "retrieve"].includes(k)) {
      config[k] = { ...config[k], ...clone(v) };
      for (const child of Object.keys(v)) origins[`${k}.${child}`] = `preset:${local.preset}`;
    } else {
      config[k] = clone(v);
      origins[k] = `preset:${local.preset}`;
    }
  }
  for (const field of local?.followSource ?? []) {
    const [key, child] = field.split("."), value = child ? sourceDefault?.[key]?.[child] : sourceDefault?.[key];
    if (child) {
      if (value === void 0) {
        if (config[key]) delete config[key][child];
      } else (config[key] ??= {})[child] = clone(value);
    } else config[key] = value === void 0 ? key === "type" ? void 0 : [] : clone(value);
    if (config.type === void 0) delete config.type;
    origins[field] = sourceDefault ? "source-default" : "default";
  }
  return { config, origins, revision: doc.revision };
}

// src/client-values.js
function draftConfiguration(form, row, snapshot) {
  const entry = entryFrom(form, row), source = snapshot.sourceDefault?.available && entry.adapterId === row.adapterId ? { id: row.id, adapterId: row.adapterId, ...snapshot.sourceDefault.configuration } : null;
  const composed = composeConfiguration({ revision: snapshot.revision, entries: [entry], presets: snapshot.presets ?? {} }, row.id, source);
  return { ...composed, scopePolicy: source && ["default", "source-default"].includes(composed.origins.whitelist) ? "source-bound" : "whitelist" };
}
function followsSource(form, field, origins) {
  if (field === "adapterId") return form.adapterId === form.__base.sourceAdapterId || !form.__base.sourceAdapterId && form.adapterId === form.__base.adapterId;
  if (field === "preset") return !form.__presetPresent;
  return form.__base.followSource?.includes(field) || !["local"].includes(origins[field]) && !origins[field]?.startsWith("preset:") && !(["store", "retrieve"].includes(field.split(".")[0]) && form["__" + field.split(".")[0] + "Present"] && ["on", "rule", "strategy"].every((part) => form[field.split(".")[0] + "." + part] === ""));
}
function fieldDescription(value, field, { row, catalog, scopePolicy, source = false } = {}) {
  if (field === "whitelist" && scopePolicy === "source-bound") return "\u8DDF\u968F\u6765\u6E90\u7684\u5F53\u524D\u7ED1\u5B9A\u8303\u56F4";
  if (value !== void 0) return describeValue(value, field, catalog);
  if (field === "adapterId") return describeValue(row.adapterId, field, catalog);
  if (field === "type") return row.type === void 0 ? "\u6765\u6E90\u672A\u58F0\u660E\u7C7B\u578B" : describeValue(row.type, field, catalog);
  if (field === "preset") return "\u4E0D\u5F15\u7528\u9884\u8BBE";
  if (field === "blacklist") return "\u4E0D\u989D\u5916\u6392\u9664\u8303\u56F4";
  if (field === "whitelist") return source ? "\u7531\u6765\u6E90\u786E\u8BA4\u7ED1\u5B9A\u4E0E\u6743\u9650" : "\u7A7A\u767D\u540D\u5355\uFF0C\u4E0D\u9002\u7528\u4EFB\u4F55\u8303\u56F4";
  const mode = field.split(".")[0];
  if (!source && ["store", "retrieve"].includes(mode) && row.config?.[mode] && Object.keys(row.config[mode]).length === 0) return mode === "store" ? "\u672A\u542F\u7528\u989D\u5916\u6258\u7BA1\u5B58\u50A8\uFF1B\u5185\u5BB9\u4ECD\u7531\u6765\u6E90\u4FDD\u5B58" : "\u672A\u542F\u7528\u6258\u7BA1\u8BFB\u53D6";
  if (row.missing) return "\u6765\u6E90\u4E0D\u53EF\u7528\uFF0C\u5F53\u524D\u884C\u4E3A\u672A\u786E\u8BA4";
  if (field.startsWith("store.") && ["dsh.skills", "tavern.world-books", "tavern.prompt-templates"].includes(row.adapterId)) return { "store.on": "\u56FA\u5B9A\u8D44\u6E90\u53D8\u52A8\u65F6", "store.rule": "\u9075\u5FAA\u6765\u6E90\u7684\u4FDD\u5B58\u4E0E\u6743\u9650\u89C4\u5219", "store.strategy": "\u7531\u6765\u6E90\u4FDD\u5B58\uFF0C\u5185\u5BB9\u968F\u56FA\u5B9A\u8D44\u6E90\u53D8\u52A8" }[field];
  if (field.startsWith("store.") && row.adapterId === "tavern.mvu") return "\u7531\u6765\u6E90\u7EF4\u62A4\u72B6\u6001\uFF1B\u539F\u751F\u5361\u7247\u5199\u5165\u9075\u5FAA\u7ED1\u5B9A\u4E0E\u6743\u9650";
  if (field.startsWith("retrieve.") && row.adapterId === "dsh.skills") return { "retrieve.on": "DSH \u8C03\u7528\u6280\u80FD\u65F6", "retrieve.rule": "\u7531 DSH \u6280\u80FD\u53EF\u89C1\u6027\u4E0E\u8C03\u7528\u89C4\u5219\u51B3\u5B9A", "retrieve.strategy": "\u4ECE\u6280\u80FD\u6765\u6E90\u8BFB\u53D6\u5F53\u524D\u6B63\u6587" }[field];
  return field.startsWith("store.") ? "\u7531\u6765\u6E90\u7EF4\u62A4\uFF1B\u672A\u542F\u7528\u989D\u5916\u6258\u7BA1\u5B58\u50A8" : field.startsWith("retrieve.") ? "\u672A\u542F\u7528\u989D\u5916\u6258\u7BA1\u8BFB\u53D6" : "\u6765\u6E90\u672A\u58F0\u660E\u9ED8\u8BA4\u503C";
}
function behaviorSummary(row, mode) {
  const behavior = row.config?.[mode];
  if (!behavior?.on && !behavior?.strategy) return fieldDescription(void 0, mode + ".strategy", { row });
  return [fieldDescription(behavior.on, mode + ".on", { row }), fieldDescription(behavior.strategy, mode + ".strategy", { row })].join(" \xB7 ");
}

// src/client-history.js
function nativeResourceObservations(record, sessionId) {
  if (record?.sessionId !== sessionId || record.status !== "request-observed" || record.requestContentStatus !== "available" || record.nativeProvenance?.provenance !== "recorded-references") return [];
  const nodes = [], facts = [], seen = /* @__PURE__ */ new Set();
  const flatten = (items) => {
    for (const node of items ?? []) {
      nodes.push(node);
      flatten(node.children);
    }
  };
  flatten(record.nativeProvenance.nodes);
  const requestId = Number.isSafeInteger(record.requestAssemblyRef?.seq) ? `${sessionId}:${record.requestAssemblyRef.seq}` : Number.isSafeInteger(record.nativeRequestRef?.stepStartSeq) ? `${sessionId}:native:${record.nativeRequestRef.stepStartSeq}` : `tavern:${sessionId}:${record.id}`;
  for (const node of nodes) {
    for (const read of [...node.memoryReads ?? [], ...node.mvuReads ?? []]) {
      if (typeof read.adapterId !== "string" || typeof read.id !== "string" || typeof read.blockId !== "string" || seen.has(read.adapterId + ":" + read.id)) continue;
      seen.add(read.adapterId + ":" + read.id);
      facts.push({ ...read, evidence: "request-included", mode: "retrieve", on: "before_model_request", eventId: `${requestId}:native-memory:${read.blockId}`, requestId, sessionId, turn: record.turn, turnKind: "unknown", phase: "triggered", at: record.recordedAt, origin: "tavern-history", detail: "Tavern \u5DF2\u6838\u9A8C\u7684\u5F53\u6B21\u8BF7\u6C42\u6765\u6E90\u786E\u8BA4\u8D44\u6E90\u5185\u5BB9\u8FDB\u5165\u672C\u8F6E\u8BF7\u6C42\uFF1B\u6A21\u578B\u63D0\u4F9B\u65B9\u9001\u8FBE\u672A\u786E\u8BA4\u3002" });
    }
    const source = node.source;
    if (source?.plugin !== "pmp-dsh-tavern" || source.sourceId !== "worldbook" || typeof source.resourceId !== "string" || !source.resourceId || seen.has("tavern.world-books:world-book:" + source.resourceId)) continue;
    seen.add("tavern.world-books:world-book:" + source.resourceId);
    facts.push({ evidence: "request-included", mode: "retrieve", on: "before_model_request", id: "world-book:" + source.resourceId, adapterId: "tavern.world-books", eventId: `${requestId}:native-worldbook:${source.resourceId}`, requestId, sessionId, turn: record.turn, turnKind: "unknown", phase: "triggered", at: record.recordedAt, origin: "tavern-history", detail: "Tavern \u5DF2\u6838\u9A8C\u7684\u5F53\u6B21\u8BF7\u6C42\u6765\u6E90\u786E\u8BA4\u4E16\u754C\u4E66\u8BFB\u53D6\u5DF2\u89E6\u53D1\uFF1B\u6A21\u578B\u63D0\u4F9B\u65B9\u9001\u8FBE\u672A\u786E\u8BA4\u3002" });
  }
  return facts;
}
function withHistoryFacts(data, history, { turn = [], turnKind = [], status = [] } = {}) {
  const matches = (values, value) => !values.length || values.includes(String(value));
  const rows = data.rows.map((row) => {
    const original = row.facts ?? [], additional = history.filter((f) => f.adapterId === row.adapterId && f.id === row.id && !original.some((old) => old.requestId === f.requestId && observationMode(old) === observationMode(f) && (observationMode(f) !== "retrieve" || f.phase === "skipped" && old.phase === "skipped" || operationTriggered(old, "retrieve"))));
    const facts = [...original, ...additional].filter((f) => matches(turn, f.turn) && matches(turnKind, f.turnKind)), activeFacts = (row.activeFacts ?? []).filter((f) => matches(turn, f.turn) && matches(turnKind, f.turnKind));
    const state = activeFacts.length ? "running" : facts.some((f) => ["started", "triggered", "applied"].includes(f.phase)) ? "past" : "never";
    return { ...row, facts, activeFacts, status: state, applied: facts.some((f) => f.phase === "applied"), interrupted: facts.some((f) => f.interrupted) };
  });
  const turns = [.../* @__PURE__ */ new Set([...data.facets?.turns ?? [], ...history.filter((f) => data.rows.some((row) => row.id === f.id && row.adapterId === f.adapterId)).filter((f) => f.turn != null).map((f) => String(f.turn))])].sort((a, b) => a.localeCompare(b, void 0, { numeric: true }));
  return { ...data, rows: rows.filter((row) => matches(status, row.status)), facets: { ...data.facets, turns } };
}
function createTavernHistoryReader(read) {
  const cache = /* @__PURE__ */ new Map();
  return async (sessionId, signal) => {
    const base = "/pmp-dsh-tavern/api/v3/sessions/" + encodeURIComponent(sessionId) + "/assemblies";
    const index = await read(base, signal);
    if (index?.ok !== true || index.sessionId !== sessionId || !Array.isArray(index.records)) throw Error("Tavern \u8D44\u6E90\u5386\u53F2\u7D22\u5F15\u4E0D\u53EF\u7528\u3002");
    const records = index.records.filter((row) => row.sessionId === sessionId && row.status === "request-observed" && row.nativeRequestRef).slice(-256);
    const keep = new Set(records.map((row) => sessionId + ":" + row.id));
    for (const key of cache.keys()) if (!keep.has(key)) cache.delete(key);
    const result = [], errors = [];
    let cursor = 0;
    const worker = async () => {
      while (cursor < records.length) {
        const summary = records[cursor++], key = sessionId + ":" + summary.id, token = JSON.stringify([summary.requestAssemblyRef, summary.nativeRequestRef, summary.sessionRef]);
        try {
          let saved = cache.get(key);
          if (saved?.token !== token) {
            const response = await read(base + "/" + encodeURIComponent(summary.id), signal);
            if (response?.ok !== true || response.record?.id !== summary.id || response.record.sessionId !== sessionId) throw Error("Tavern \u8D44\u6E90\u5386\u53F2\u8BE6\u60C5\u4E0D\u53EF\u7528\u3002");
            const record = response.record;
            if (record.requestContentStatus !== "available" || !record.nativeProvenance) throw Error("\u8D44\u6E90\u5386\u53F2\u8BF7\u6C42\u7684\u6765\u6E90\u5F15\u7528\u672A\u80FD\u6838\u9A8C\u3002");
            saved = { token, facts: nativeResourceObservations(record, sessionId) };
            cache.set(key, saved);
          }
          result.push(...saved.facts);
        } catch (error) {
          signal?.throwIfAborted();
          errors.push(error);
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(4, records.length) }, worker));
    return { facts: result, diagnostics: errors.length ? [{ code: "TAVERN_HISTORY_UNAVAILABLE", message: `${errors.length} \u6761\u8D44\u6E90\u5386\u53F2\u8BB0\u5F55\u6682\u65E0\u6CD5\u6838\u9A8C\uFF0C\u89E6\u53D1\u72B6\u6001\u53EF\u80FD\u4E0D\u5B8C\u6574\u3002` }] : [] };
  };
}

// src/client-management.js
var reasons = { SOURCE_DEFAULTS_UNSUPPORTED: "\u6765\u6E90\u7248\u672C\u672A\u63D0\u4F9B\u9ED8\u8BA4\u89C4\u5219\u63A5\u53E3", SOURCE_DEFAULTS_UNAVAILABLE: "\u6765\u6E90\u6CA1\u6709\u786E\u8BA4\u8BE5\u8D44\u6E90\u4E0E\u8303\u56F4\u7684\u9ED8\u8BA4\u89C4\u5219", SOURCE_UNAVAILABLE: "\u6765\u6E90\u672A\u6CE8\u518C", SOURCE_DISABLED: "\u6765\u6E90\u5DF2\u505C\u7528", SOURCE_DEFAULTS_CHANGED: "\u6765\u6E90\u9ED8\u8BA4\u89C4\u5219\u6216\u7ED1\u5B9A\u5DF2\u53D8\u5316", INVALID_SOURCE_DEFAULTS: "\u6765\u6E90\u9ED8\u8BA4\u89C4\u5219\u5408\u540C\u65E0\u6548" };
function managementStatus(row, { loading = false } = {}) {
  if (loading) return "\u5F53\u524D\u6258\u7BA1\uFF1A\u52A0\u8F7D\u4E2D\u2026";
  if (row.missing || row.sourceAvailable === false) return "\u5F53\u524D\u6258\u7BA1\uFF1A\u6765\u6E90\u4E0D\u53EF\u7528\uFF0C\u7BA1\u7406\u65B9\u672A\u786E\u8BA4";
  const owner = row.managementMode === "managed" ? "\u8BB0\u5FC6\u7BA1\u7406" : row.managementMode === "native" ? row.adapterId?.startsWith("tavern.") ? "Tavern" : "\u6765\u6E90" : "\u6765\u6E90\u672A\u786E\u8BA4\u7BA1\u7406\u65B9";
  const prefix = `\u5F53\u524D\u6258\u7BA1\uFF1A${owner}`;
  if (row.configError) return `${prefix} \xB7 \u7BA1\u7406\u914D\u7F6E\u9519\u8BEF\uFF0C\u59D4\u6258\u51B3\u7B56\u88AB\u963B\u6B62\uFF08${row.configError.code}\uFF09`;
  if (row.sourceDefault?.available) {
    const overridden = Object.entries(row.origins ?? {}).some(([field, origin]) => (["type", "preset", "whitelist", "blacklist"].includes(field) || /^(store|retrieve)\.(on|rule|strategy)$/.test(field)) && (origin === "local" || origin?.startsWith("preset:"))) || ["store", "retrieve"].some((mode) => row.origins?.[mode] === "local" && row.config?.[mode] && Object.keys(row.config[mode]).length === 0);
    return `${prefix} \xB7 ${overridden ? "\u6765\u6E90\u9ED8\u8BA4 + \u672C\u5730 / \u9884\u8BBE\u8986\u76D6" : "\u6765\u6E90\u9ED8\u8BA4\u89C4\u5219"}`;
  }
  if (!row.sourceDefault) return `${prefix} \xB7 \u7BA1\u7406\u89C4\u5219\u52A0\u8F7D\u4E2D\u2026`;
  const reason = row.sourceDefault.message ?? reasons[row.sourceDefault.reason] ?? row.sourceDefault.reason ?? "\u6765\u6E90\u9ED8\u8BA4\u89C4\u5219\u4E0D\u53EF\u7528";
  return `${prefix} \xB7 ${row.config ? "\u672C\u5730\u89C4\u5219\uFF1B" : "\u7F3A\u5C11\u6709\u6548\u7BA1\u7406\u914D\u7F6E\uFF1B"}${reason}`;
}

// src/client.js
var name = "dsh-memory-manager";
var inject = ["slots"];
var root = "/api/dsh-memory-manager";
var api = (path, body, signal) => requestJson(fetch, root + path, { body, signal });
var stringify2 = (value) => value === void 0 ? "" : JSON.stringify(value, null, 2);
var at3 = (object, path) => path.split(".").reduce((v, key) => v?.[key], object);
function HelpInfo({ label, text }) {
  return (0, import_react7.createElement)(import_dsh_client_ui_primitives.Tooltip, { label: text, side: "bottom", portal: true, maxWidth: 340, openOnClick: true }, (0, import_react7.createElement)("button", { type: "button", className: "dmm-help", "aria-label": label }, "\u24D8"));
}
function ErrorBox({ error }) {
  return error && (0, import_react7.createElement)("div", { className: "dmm-error", role: "alert" }, error.message ?? error, ...(error.diagnostics ?? []).map((d, i) => (0, import_react7.createElement)("div", { key: i }, `${d.field ?? ""}\uFF1A${d.message}`)));
}
function configFailure(error) {
  return ({ ENOENT: "\u672A\u627E\u5230\u672C\u5730\u7BA1\u7406\u914D\u7F6E\u6587\u4EF6\u3002", EACCES: "\u6CA1\u6709\u8BFB\u53D6\u914D\u7F6E\u6587\u4EF6\u7684\u6743\u9650\u3002", REVISION_CONFLICT: "\u914D\u7F6E\u7248\u672C\u51B2\u7A81\u3002", INVALID_CONFIG: "\u914D\u7F6E\u683C\u5F0F\u6216\u5185\u5BB9\u6821\u9A8C\u5931\u8D25\u3002" }[error.code] ?? "\u8BFB\u53D6\u6216\u6821\u9A8C\u914D\u7F6E\u5931\u8D25\u3002") + (error.message ?? "");
}
function sourceName(data, id) {
  return data?.adapters.find((a) => a.id === id)?.name ?? id;
}
function readScroll(element) {
  const rows = [];
  for (let e = element; e; e = e.parentElement) if (e.scrollHeight > e.clientHeight) rows.push([e, e.scrollTop]);
  return rows;
}
function topOfPage(element) {
  for (let e = element?.parentElement; e; e = e.parentElement) if (e.scrollHeight > e.clientHeight) e.scrollTop = 0;
}
function useUnsaved(dirty, element) {
  (0, import_react7.useEffect)(() => {
    if (!dirty) return;
    const message = "\u6709\u5C1A\u672A\u4FDD\u5B58\u7684\u4FEE\u6539\u3002\u79BB\u5F00\u4F1A\u4E22\u5931\u672C\u9875\u8349\u7A3F\uFF0C\u662F\u5426\u7EE7\u7EED\uFF1F";
    const before = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    const click = (e) => {
      if (e.target.closest?.("button,a,[role=tab]") && !element.current?.contains(e.target) && !e.target.closest?.("[role=tooltip]") && !window.confirm(message)) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    };
    const key = (e) => {
      if (e.key === "Escape" && !document.querySelector("[role=tooltip]") && !window.confirm(message)) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    };
    window.addEventListener("beforeunload", before);
    document.addEventListener("click", click, true);
    document.addEventListener("keydown", key, true);
    return () => {
      window.removeEventListener("beforeunload", before);
      document.removeEventListener("click", click, true);
      document.removeEventListener("keydown", key, true);
    };
  }, [dirty, element]);
}
function Table({ data, onDetail, showStatus = false }) {
  return (0, import_react7.createElement)("div", null, (0, import_react7.createElement)("div", { className: "dmm-table-wrap", tabIndex: 0, "aria-label": "\u8BB0\u5FC6\u8D44\u6E90\u8868\u683C\uFF0C\u53EF\u6A2A\u5411\u6EDA\u52A8" }, (0, import_react7.createElement)("table", { className: showStatus ? "dmm-trigger-table" : void 0 }, (0, import_react7.createElement)("thead", null, (0, import_react7.createElement)("tr", null, ...["\u8D44\u6E90\u540D\u79F0 / ID", "\u7C7B\u578B", "\u9884\u8BBE", "\u5B58\u50A8", "\u8BFB\u53D6", ...showStatus ? ["\u5B58\u50A8\u89E6\u53D1", "\u8BFB\u53D6\u89E6\u53D1"] : [], "\u7BA1\u7406\u914D\u7F6E"].map((t) => (0, import_react7.createElement)("th", { key: t, scope: "col" }, t)))), (0, import_react7.createElement)("tbody", null, ...data.rows.map((row) => (0, import_react7.createElement)("tr", { key: JSON.stringify([row.adapterId, row.id]) }, (0, import_react7.createElement)("td", null, (0, import_react7.createElement)("div", { className: "dmm-resource-name" }, row.name ?? row.id), (0, import_react7.createElement)("code", { className: "dmm-id" }, row.id), row.missing && (0, import_react7.createElement)("span", { className: "dmm-badge" }, "\u6765\u6E90\u4E0D\u53EF\u7528"), (0, import_react7.createElement)("small", { className: "dmm-id", "data-management-status": true }, managementStatus(row))), (0, import_react7.createElement)("td", null, row.config?.type ?? row.type ?? "\u4E0D\u53EF\u5224\u5B9A", !row.config?.type && (0, import_react7.createElement)("small", { className: "dmm-id" }, row.type === void 0 ? "\u7C7B\u578B\u672A\u786E\u8BA4" : "\u6765\u6E90\u5143\u6570\u636E")), (0, import_react7.createElement)("td", null, row.config?.preset ?? "\u4E0D\u5F15\u7528\u9884\u8BBE"), (0, import_react7.createElement)("td", null, (0, import_react7.createElement)("span", { className: "dmm-summary", title: behaviorSummary(row, "store") }, behaviorSummary(row, "store"))), (0, import_react7.createElement)("td", null, (0, import_react7.createElement)("span", { className: "dmm-summary", title: behaviorSummary(row, "retrieve") }, behaviorSummary(row, "retrieve"))), ...showStatus ? ["store", "retrieve"].map((mode) => (0, import_react7.createElement)("td", { key: mode, className: "dmm-resource-status", "data-trigger-mode": mode, "data-trigger-status": operationStatus(row, mode), title: operationStatus(row, mode) === "unrecorded" ? "\u672C\u8F6E\u6CA1\u6709\u6B64\u64CD\u4F5C\u7684\u89E6\u53D1\u8BB0\u5F55\uFF0C\u4E0D\u80FD\u636E\u6B64\u5224\u65AD\u672A\u4F7F\u7528\u3002" : operationStatus(row, mode) === "unknown" ? "\u8BFB\u53D6\u9700\u786E\u8BA4\u5185\u5BB9\u8FDB\u5165\u672C\u8F6E\u8BF7\u6C42\uFF0C\u5B58\u50A8\u9700\u6765\u6E90\u5199\u5165\u56DE\u6267\uFF1B\u5F00\u59CB\u6267\u884C\u6216\u8BFB\u53D6\u6210\u529F\u4E0D\u8DB3\u4EE5\u786E\u8BA4\u89E6\u53D1\u3002" : void 0 }, triggerLabels[operationStatus(row, mode)], operationReasons(row, mode) && (0, import_react7.createElement)("small", { className: "dmm-id" }, operationReasons(row, mode)))) : [], (0, import_react7.createElement)("td", null, (0, import_react7.createElement)("button", { className: "dmm-link dmm-detail-link", onClick: () => onDetail(row), "aria-label": `\u7BA1\u7406\u914D\u7F6E\uFF1A${row.name ?? row.id}` }, "\u7BA1\u7406\u914D\u7F6E \u2192"))))))), (0, import_react7.createElement)("p", { className: "dmm-table-caption" }, "\u8868\u683C\u663E\u793A\u751F\u6548\u914D\u7F6E\u3002\u7A84\u5C4F\u53EF\u6A2A\u5411\u6EDA\u52A8\u67E5\u770B\u6240\u6709\u5217\u3002"));
}
function FiltersPage({ data, sessionId, filters: applied, setFilters: setApplied, onBack }) {
  const [filters, setFilters] = (0, import_react7.useState)(() => structuredClone(applied)), [fieldDirty, setFieldDirty] = (0, import_react7.useState)(false);
  const [catalog, setCatalog] = (0, import_react7.useState)(null), [error, setError] = (0, import_react7.useState)(null), [field, setField] = (0, import_react7.useState)(null);
  const element = (0, import_react7.useRef)(null), position = (0, import_react7.useRef)([]);
  (0, import_react7.useEffect)(() => {
    const c = new AbortController();
    let timer;
    const refresh = async () => {
      try {
        const result = await api("/options" + (sessionId ? "?sessionId=" + encodeURIComponent(sessionId) : ""), void 0, c.signal);
        if (!c.signal.aborted) setCatalog(result);
      } catch (e) {
        if (e.name !== "AbortError") setError(e);
      }
      if (!c.signal.aborted) timer = setTimeout(refresh, 2500);
    };
    refresh();
    return () => {
      c.abort();
      clearTimeout(timer);
    };
  }, [sessionId]);
  useUnsaved(fieldDirty || canonical(filters) !== canonical(applied), element);
  const special = { adapterId: { label: "\u8D44\u6E90\u63D0\u4F9B\u65B9", values: (data?.adapters ?? []).map((a) => [a.id, a.name ?? a.id]) }, ...sessionId ? { turn: { label: "\u8F6E\u6B21", values: (data?.facets?.turns ?? []).map((v) => [v, `\u7B2C ${v} \u8F6E`]) }, turnKind: { label: "\u8F6E\u6B21\u6765\u6E90", values: [["human", "\u4EBA\u7C7B\u8F93\u5165"], ["task", "\u4EFB\u52A1\u4E0A\u4E0B\u6587"], ["system", "\u7CFB\u7EDF"], ["unknown", "\u672A\u786E\u8BA4"]] }, storeStatus: { label: "\u5B58\u50A8\u89E6\u53D1", values: Object.entries(triggerLabels) }, retrieveStatus: { label: "\u8BFB\u53D6\u89E6\u53D1", values: Object.entries(triggerLabels) } } : {} };
  const open = (key) => {
    position.current = readScroll(element.current);
    setField(key);
    requestAnimationFrame(() => topOfPage(element.current));
  };
  const back = () => {
    setField(null);
    requestAnimationFrame(() => position.current.forEach(([node, top]) => {
      if (node.isConnected) node.scrollTop = top;
    }));
  };
  const update = (patch) => setFilters((previous) => ({ ...previous, fields: { ...previous.fields, [field]: { mode: "exact", values: [], missing: false, ...previous.fields[field], ...patch } } }));
  const token = (value, key) => typeof value === "string" && !["whitelist", "blacklist"].includes(key) && !key.endsWith(".rule") && !key.endsWith(".strategy") ? value : canonical(value);
  const optionRows = (key) => {
    const options = (catalog?.fields[key] ?? []).map((o) => ({ ...o, token: token(o.value, key) }));
    for (const text of /* @__PURE__ */ new Set([...data?.facets?.fields?.[key] ?? [], ...filters.fields[key]?.values ?? []])) if (!options.some((o) => o.token === text)) {
      let value = text;
      if (["whitelist", "blacklist"].includes(key) || key.endsWith(".rule") || key.endsWith(".strategy")) try {
        value = JSON.parse(text);
      } catch {
      }
      options.push({ id: "value:" + text, token: text, value, label: describeValue(value, key, catalog), adapterIds: [], presetIds: [], available: true });
    }
    return options;
  };
  return (0, import_react7.createElement)("div", { ref: element, "data-page": "filters" }, (0, import_react7.createElement)(ErrorBox, { error }), field && catalog ? (0, import_react7.createElement)(OptionPage, { key: field, field, filter: true, catalog, onDirty: setFieldDirty, onBack: back, options: special[field] ? special[field].values.map(([id, label]) => ({ id, token: id, label, value: id, adapterIds: [], presetIds: [], available: true })) : optionRows(field), selected: special[field] ? filters[field] : filters.fields[field]?.values ?? [], missing: !special[field] && filters.fields[field]?.missing, onMissing: special[field] ? void 0 : (v) => update({ missing: v }), onSelect: (value) => {
    if (special[field]) setFilters((previous) => ({ ...previous, [field]: previous[field].includes(value) ? previous[field].filter((v) => v !== value) : [...previous[field], value] }));
    else setFilters((previous) => {
      const old = previous.fields[field] ?? { mode: "exact", values: [], missing: false };
      return { ...previous, fields: { ...previous.fields, [field]: { ...old, values: old.values.includes(value) ? old.values.filter((v) => v !== value) : [...old.values, value] } } };
    });
  }, onAddValue: (value) => setFilters((previous) => {
    const old = previous.fields[field] ?? { mode: "exact", values: [], missing: false };
    return { ...previous, fields: { ...previous.fields, [field]: { ...old, values: [.../* @__PURE__ */ new Set([...old.values, token(value, field)])] } } };
  }) }) : (0, import_react7.createElement)("div", null, (0, import_react7.createElement)("div", { className: "dmm-page-top dmm-page-nav" }, (0, import_react7.createElement)("button", { className: "dmm-link", onClick: onBack }, "\u2190 \u8FD4\u56DE\u8D44\u6E90\u8868\u683C\uFF08\u4E22\u5F03\u672C\u9875\u4FEE\u6539\uFF09"), (0, import_react7.createElement)("button", { onClick: () => setFilters(emptyFilters()) }, "\u6E05\u7A7A\u5168\u90E8")), (0, import_react7.createElement)("h2", null, "\u7B5B\u9009\u8D44\u6E90"), (0, import_react7.createElement)("p", { role: "status", className: "dmm-muted" }, canonical(filters) === canonical(applied) ? "\u672C\u9875\u65E0\u4FEE\u6539\u3002" : "\u672C\u9875\u6709\u4FEE\u6539\uFF0C\u5C1A\u672A\u5E94\u7528\u7B5B\u9009\u3002"), (0, import_react7.createElement)("p", { className: "dmm-muted" }, "\u70B9\u51FB\u5B57\u6BB5\u9009\u62E9\u7B5B\u9009\u503C\u3002\u540C\u5B57\u6BB5 OR\uFF0C\u8DE8\u5B57\u6BB5 AND\uFF0C\u4E0D\u9009\u5373\u4E0D\u9650\uFF1B\u7B5B\u9009\u6309\u751F\u6548\u914D\u7F6E\uFF0C\u4E0D\u6267\u884C\u89C4\u5219\u3002"), !catalog ? (0, import_react7.createElement)("p", null, "\u6B63\u5728\u8BFB\u53D6\u9009\u9879\u76EE\u5F55\u2026") : (0, import_react7.createElement)("div", { className: "dmm-grid" }, ...Object.entries({ ...special, ...fieldLabels }).map(([key, definition]) => (0, import_react7.createElement)("button", { key, className: "dmm-field-choice", onClick: () => open(key) }, (0, import_react7.createElement)("strong", null, typeof definition === "string" ? definition : definition.label), (0, import_react7.createElement)("span", null, `${special[key] ? filters[key].length : filters.fields[key]?.values.length ?? 0} \u9879\u5DF2\u9009${filters.fields[key]?.missing ? " \xB7 \u542B\u672A\u914D\u7F6E" : ""}`), (0, import_react7.createElement)("span", null, "\u9009\u62E9\u9009\u9879 \u2192")))), (0, import_react7.createElement)("div", { className: "dmm-sticky-actions" }, (0, import_react7.createElement)("button", { className: "dmm-primary", onClick: () => {
    setApplied(filters);
    onBack();
  } }, "\u4FDD\u5B58\u5E76\u8FD4\u56DE"))));
}
function emptyFilters() {
  return { adapterId: [], turn: [], turnKind: [], storeStatus: [], retrieveStatus: [], fields: {} };
}
function filterCount(filters, sessionId) {
  return filters.adapterId.length > 0 ? 1 + other() : other();
  function other() {
    return (sessionId ? ["turn", "turnKind", "storeStatus", "retrieveStatus"].filter((k) => filters[k].length).length : 0) + Object.values(filters.fields).filter((f) => f.values.length || f.missing).length;
  }
}
function originLabel(origin) {
  return origin === "source-default" ? "\u6765\u6E90\u9ED8\u8BA4\u89C4\u5219" : origin === "default" ? "\u9ED8\u8BA4\u503C" : origin?.startsWith("preset:") ? "\u9884\u8BBE " + origin.slice(7) : origin === "local" ? "\u672C\u5730\u914D\u7F6E" : "\u6765\u6E90\u9ED8\u8BA4\u884C\u4E3A";
}
function Diagnostics({ report }) {
  return report && (0, import_react7.createElement)("section", { className: "dmm-card dmm-diagnostics", "aria-label": "\u914D\u7F6E\u6821\u9A8C\u7ED3\u679C" }, (0, import_react7.createElement)("h3", null, report.valid ? "\u9759\u6001\u6821\u9A8C\u901A\u8FC7" : "\u914D\u7F6E\u6821\u9A8C\u672A\u901A\u8FC7"), ...report.diagnostics.map((d, i) => (0, import_react7.createElement)("div", { className: "dmm-diagnostic", key: i, "data-level": d.level }, (0, import_react7.createElement)("strong", null, ({ error: "\u9519\u8BEF", unknown: "\u672A\u9A8C\u8BC1", info: "\u4FE1\u606F" }[d.level] ?? d.level) + " \xB7 " + d.field), (0, import_react7.createElement)("div", null, d.message), (0, import_react7.createElement)("small", null, d.code))));
}
function ContentEditor({ row, sessionId, onChange, onDirty }) {
  const [record, setRecord] = (0, import_react7.useState)(null), [text, setText] = (0, import_react7.useState)(""), [saved, setSaved] = (0, import_react7.useState)(""), [error, setError] = (0, import_react7.useState)(null), [busy, setBusy] = (0, import_react7.useState)(false), [notice, setNotice] = (0, import_react7.useState)("");
  const ctrl = (0, import_react7.useRef)(null);
  (0, import_react7.useEffect)(() => {
    const c = new AbortController();
    ctrl.current = c;
    return () => c.abort();
  }, []);
  const dirty = text !== saved;
  (0, import_react7.useEffect)(() => onDirty(dirty), [dirty, onDirty]);
  const load = async () => {
    setBusy(true);
    try {
      const q = new URLSearchParams({ id: row.id, adapterId: row.adapterId, ...sessionId ? { sessionId } : {} }), value = await api("/read?" + q, void 0, ctrl.current.signal);
      if (!value) throw Error("\u6765\u6E90\u6CA1\u6709\u8FD4\u56DE\u6B64\u8D44\u6E90\u3002");
      const body = typeof value.content === "string" ? value.content : stringify2(value.content);
      setRecord(value);
      setText(body);
      setSaved(body);
      setError(null);
    } catch (e) {
      if (e.name !== "AbortError") setError(e);
    } finally {
      setBusy(false);
    }
  };
  const mutate = async (operation) => {
    setBusy(true);
    setNotice("");
    try {
      const request = { id: row.id, adapterId: row.adapterId, sessionId };
      if (operation === "update") Object.assign(request, { expectedRevision: record.revision, operationId: crypto.randomUUID(), content: typeof record.content === "string" ? text : JSON.parse(text) });
      if (operation === "management") Object.assign(request, { expectedRevision: record.revision, operationId: crypto.randomUUID(), mode: (record?.managementMode ?? row.managementMode) === "managed" ? "native" : "managed" });
      if (operation === "copy") request.newId = row.id + "-copy-" + crypto.randomUUID();
      const result = await api("/" + operation, request, ctrl.current.signal);
      setError(null);
      if (operation === "copy") setNotice(`\u5DF2\u590D\u5236\u8D44\u6E90\uFF0C\u65B0 ID\uFF1A${result.id}\u3002\u7BA1\u7406\u914D\u7F6E\u8BF7\u5355\u72EC\u8BBE\u7F6E\u3002`);
      else {
        setRecord(result);
        if (operation === "update") {
          const body = typeof result.content === "string" ? result.content : stringify2(result.content);
          setText(body);
          setSaved(body);
        }
        setNotice(operation === "update" ? "\u8D44\u6E90\u5185\u5BB9\u5DF2\u4FDD\u5B58\u3002" : "\u89C4\u5219\u6267\u884C\u6A21\u5F0F\u5DF2\u7531\u6765\u6E90\u66F4\u65B0\uFF1B\u6B63\u6587\u6240\u6709\u6743\u4E0E\u7F16\u8F91\u6743\u9650\u4E0D\u53D8\u3002");
      }
      onChange();
    } catch (e) {
      if (e.name !== "AbortError") setError(e);
    } finally {
      setBusy(false);
    }
  };
  return (0, import_react7.createElement)("section", { className: "dmm-card dmm-source-content" }, (0, import_react7.createElement)("div", { className: "dmm-section-head" }, (0, import_react7.createElement)("h3", null, "\u8D44\u6E90\u5185\u5BB9 content"), (0, import_react7.createElement)(HelpInfo, { label: "\u8D44\u6E90\u5185\u5BB9\u8BF4\u660E", text: "\u5185\u5BB9\u7531\u8D44\u6E90\u63D0\u4F9B\u65B9\u8BFB\u5199\uFF0C\u4E0E\u7BA1\u7406\u89C4\u5219\u5206\u5F00\u4FDD\u5B58\u3002\u5F53\u524D\u6258\u7BA1\u65B9\u7531\u6765\u6E90\u6CE8\u518C\u751F\u547D\u5468\u671F\u62A5\u544A\uFF1B\u7F16\u8F91\u6B63\u6587\u4E0D\u4F1A\u4FEE\u6539\u6258\u7BA1\u89C4\u5219\u6216\u5361\u7247\u6743\u9650\u3002" })), (0, import_react7.createElement)("p", { className: "dmm-muted" }, managementStatus({ ...row, ...record ? { managementMode: record.managementMode ?? row.managementMode } : {} }) + " \xB7 " + row.adapterId), (0, import_react7.createElement)("p", { className: "dmm-muted" }, row.capabilities.edit ? "\u6B63\u6587\u7F16\u8F91\uFF1A\u6765\u6E90\u652F\u6301\uFF0C\u5B9E\u9645\u5199\u5165\u4ECD\u9A8C\u8BC1\u6743\u9650\u4E0E\u7248\u672C\u3002" : `\u6B63\u6587\u53EA\u8BFB\uFF1A${row.capabilities.editReason ?? (row.missing ? "\u6765\u6E90\u5DF2\u5378\u8F7D\u6216\u505C\u7528\u3002" : "\u6765\u6E90\u672A\u63D0\u4F9B update \u63A5\u53E3\uFF0C\u6216\u660E\u786E\u5C06\u6B64\u8D44\u6E90\u6807\u4E3A\u53EA\u8BFB\u3002")} \u5207\u6362\u89C4\u5219\u6A21\u5F0F\u4E0D\u4F1A\u6388\u4E88\u6B63\u6587\u5199\u6743\u9650\u3002`), (0, import_react7.createElement)("div", { className: "dmm-actions" }, (0, import_react7.createElement)("button", { onClick: () => {
    if (!dirty || window.confirm("\u91CD\u65B0\u8BFB\u53D6\u4F1A\u4E22\u5F03\u672A\u4FDD\u5B58\u7684\u5185\u5BB9\uFF0C\u662F\u5426\u7EE7\u7EED\uFF1F")) load();
  }, disabled: busy || row.missing }, record ? "\u91CD\u65B0\u8BFB\u53D6\u5185\u5BB9" : "\u67E5\u770B\u8D44\u6E90\u5185\u5BB9"), row.capabilities.copy && (0, import_react7.createElement)("button", { disabled: busy || row.missing, onClick: () => mutate("copy") }, "\u590D\u5236\u8D44\u6E90\u4E3A\u65B0 ID")), record && (0, import_react7.createElement)("div", null, (0, import_react7.createElement)("p", { className: "dmm-muted" }, `\u8D44\u6E90\u7248\u672C ${record.revision ?? "\u6765\u6E90\u672A\u63D0\u4F9B"} \xB7 ${row.capabilities.edit ? "\u6765\u6E90\u5141\u8BB8\u7F16\u8F91" : "\u53EA\u8BFB\u5185\u5BB9"}`), row.capabilities.edit ? (0, import_react7.createElement)("textarea", { disabled: busy, "aria-label": "\u8D44\u6E90\u5185\u5BB9", value: text, onChange: (e) => setText(e.target.value), className: "dmm-code-editor" }) : (0, import_react7.createElement)("pre", null, text), (0, import_react7.createElement)("div", { className: "dmm-actions" }, row.capabilities.edit && (0, import_react7.createElement)("button", { disabled: busy || !dirty, onClick: () => mutate("update") }, "\u4FDD\u5B58\u8D44\u6E90\u5185\u5BB9"), row.sourceDefault?.reason === "SOURCE_DEFAULTS_UNSUPPORTED" && row.capabilities.management && (0, import_react7.createElement)("button", { disabled: busy, onClick: () => mutate("management") }, (record?.managementMode ?? row.managementMode) === "managed" ? "\u89C4\u5219\u4EA4\u56DE\u6765\u6E90\u6267\u884C" : "\u89C4\u5219\u59D4\u6258\u8BB0\u5FC6\u7BA1\u7406\u6267\u884C"))), (0, import_react7.createElement)(ErrorBox, { error }), notice && (0, import_react7.createElement)("p", { className: "dmm-status", role: "status" }, notice));
}
function DetailPage(props) {
  return (0, import_react7.createElement)(ScopedDetailPage, { ...props, key: JSON.stringify([props.row.adapterId, props.row.id, props.sessionId ?? null]) });
}
function ScopedDetailPage({ row, sessionId, liveRevision, onBack, onChange, roundLabel }) {
  const [snapshot, setSnapshot] = (0, import_react7.useState)(null), [loading, setLoading] = (0, import_react7.useState)(true), [form, setForm] = (0, import_react7.useState)(null), [baseline, setBaseline] = (0, import_react7.useState)(""), [report, setReport] = (0, import_react7.useState)(null), [error, setError] = (0, import_react7.useState)(null), [busy, setBusy] = (0, import_react7.useState)(false), [notice, setNotice] = (0, import_react7.useState)(""), [contentDirty, setContentDirty] = (0, import_react7.useState)(false), [optionDirty, setOptionDirty] = (0, import_react7.useState)(false), [catalog, setCatalog] = (0, import_react7.useState)(null), [optionField, setOptionField] = (0, import_react7.useState)(null);
  const element = (0, import_react7.useRef)(null), ctrl = (0, import_react7.useRef)(null), loadRequest = (0, import_react7.useRef)(null), detailScroll = (0, import_react7.useRef)([]), sourceVersion = (0, import_react7.useRef)(row.sourceDefault);
  const dirty = !!form && JSON.stringify(form) !== baseline, anyDirty = dirty || contentDirty || optionDirty;
  (0, import_react7.useEffect)(() => {
    if (sourceVersion.current === row.sourceDefault) return;
    sourceVersion.current = row.sourceDefault;
    if (row.sourceDefault) setSnapshot((previous) => previous ? { ...previous, sourceDefault: row.sourceDefault } : previous);
  }, [row.sourceDefault]);
  useUnsaved(anyDirty, element);
  const install = (data) => {
    const next = formFrom(data.local);
    next.adapterId ||= row.adapterId;
    setSnapshot(data);
    setForm(next);
    setBaseline(JSON.stringify(next));
    setReport(null);
  };
  const load = async () => {
    loadRequest.current?.abort();
    const c = new AbortController();
    loadRequest.current = c;
    const signal = AbortSignal.any([c.signal, ctrl.current.signal]);
    setLoading(true);
    setBusy(true);
    setError(null);
    setSnapshot(null);
    setCatalog(null);
    const q = new URLSearchParams({ id: row.id, adapterId: row.adapterId, ...sessionId ? { sessionId } : {} });
    try {
      await Promise.all([
        api("/configuration?" + q, void 0, signal).then((config) => {
          if (!signal.aborted) install(config);
        }).finally(() => {
          if (!signal.aborted) {
            setLoading(false);
            setBusy(false);
          }
        }),
        api("/options?" + q, void 0, signal).then((options) => {
          if (!signal.aborted) setCatalog(options);
        })
      ]);
    } catch (e) {
      if (!signal.aborted && e.name !== "AbortError") setError(e);
    }
  };
  (0, import_react7.useEffect)(() => {
    const c = new AbortController();
    ctrl.current = c;
    load();
    return () => {
      c.abort();
      loadRequest.current?.abort();
    };
  }, []);
  (0, import_react7.useEffect)(() => {
    if (!snapshot || !catalog) return;
    const c = new AbortController();
    let timer;
    const refresh = async () => {
      try {
        const q = new URLSearchParams({ id: row.id, adapterId: form?.adapterId || row.adapterId, ...sessionId ? { sessionId } : {} }), options = await api("/options?" + q, void 0, c.signal);
        if (!c.signal.aborted) setCatalog(options);
      } catch (e) {
        if (!c.signal.aborted && e.name !== "AbortError") setError(e);
      }
      if (!c.signal.aborted) timer = setTimeout(refresh, 2500);
    };
    refresh();
    return () => {
      c.abort();
      clearTimeout(timer);
    };
  }, [row.id, row.adapterId, sessionId, form?.adapterId, !!snapshot, !!catalog]);
  const change = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value, ...field === "preset" ? { __presetPresent: true } : {} }));
    setReport(null);
    setNotice("");
  };
  const submit = async (save) => {
    setError(null);
    setNotice("");
    setBusy(true);
    try {
      const entry = entryFrom(form, row), args = { sessionId, id: row.id, adapterId: row.adapterId, entry, expectedRevision: snapshot.revision, expectedCatalogRevision: catalog?.catalogRevision };
      if (save) {
        const result = await api("/save-configuration", args, ctrl.current.signal);
        install(result);
        setNotice(result.unchanged ? "\u914D\u7F6E\u672A\u53D8\u5316\u3002" : `\u7BA1\u7406\u914D\u7F6E\u5DF2\u4FDD\u5B58\uFF0C\u7248\u672C ${result.revision}\u3002`);
        onChange();
      } else {
        const result = await api("/validate-configuration", args, ctrl.current.signal);
        setReport(result);
      }
    } catch (e) {
      if (e.name !== "AbortError") {
        setError(e);
        if (e.diagnostics) setReport({ valid: false, diagnostics: e.diagnostics });
      }
    } finally {
      setBusy(false);
    }
  };
  const back = () => {
    if (!anyDirty || window.confirm("\u6709\u5C1A\u672A\u4FDD\u5B58\u7684\u4FEE\u6539\u3002\u653E\u5F03\u672C\u9875\u8349\u7A3F\u5E76\u8FD4\u56DE\u8868\u683C\uFF1F")) onBack();
  };
  const draft = form && snapshot ? draftConfiguration(form, row, snapshot) : null, composed = draft?.config, origins = draft?.origins ?? {};
  const openField = (field) => {
    detailScroll.current = readScroll(element.current);
    setOptionField(field);
    requestAnimationFrame(() => topOfPage(element.current));
  };
  const closeField = () => {
    setOptionField(null);
    requestAnimationFrame(() => detailScroll.current.forEach(([node, top]) => {
      if (node.isConnected) node.scrollTop = top;
    }));
  };
  const fieldValue = (field) => {
    if (!form || form[field] === "") return field === "preset" && form?.__presetPresent ? null : void 0;
    return ["type", "preset", "adapterId"].includes(field) ? form[field] || (field === "adapterId" ? row.adapterId : "") : JSON.parse(form[field]);
  };
  const updateField = (field, value) => {
    setForm((previous) => {
      const next = { ...previous, __base: structuredClone(previous.__base) };
      if (next.__base.followSource) {
        next.__base.followSource = next.__base.followSource.filter((v) => v !== field);
        if (!next.__base.followSource.length) delete next.__base.followSource;
      }
      return next;
    });
    if (field === "preset") setForm((previous) => ({ ...previous, preset: value ?? "", __presetPresent: value !== void 0 }));
    else change(field, value === void 0 ? "" : ["type", "adapterId"].includes(field) ? value : JSON.stringify(value));
    setReport(null);
    setNotice("");
  };
  const removeMode = (mode) => {
    if (busy) return;
    setForm((previous) => removeModeFrom(previous, mode));
    setReport(null);
    setNotice("\u5DF2\u5728\u8349\u7A3F\u79FB\u9664\u672C\u5730" + (mode === "store" ? "\u5B58\u50A8" : "\u8BFB\u53D6") + "\u89C4\u5219\u8986\u76D6\uFF0C\u5C06\u56DE\u5230\u9884\u8BBE\u6216\u9ED8\u8BA4\u503C\uFF1B\u8D44\u6E90\u6B63\u6587\u4E0D\u53D8\u3002");
  };
  const restoreDefaults = async () => {
    if (busy || !snapshot?.sourceDefault?.available) return;
    const next = restoreSourceDefaults(form, row);
    setForm(next);
    setReport(null);
    setError(null);
    setBusy(true);
    try {
      const result = await api("/validate-configuration", { sessionId, id: row.id, adapterId: row.adapterId, entry: entryFrom(next, row), expectedRevision: snapshot.revision, expectedCatalogRevision: catalog?.catalogRevision }, ctrl.current.signal);
      setReport(result);
      setNotice("\u5DF2\u5728\u8349\u7A3F\u6E05\u9664\u672C\u8D44\u6E90\u7684\u672C\u5730\u89C4\u5219\u3001\u8303\u56F4\u8986\u76D6\u548C\u9884\u8BBE\u5F15\u7528\uFF0C\u6062\u590D\u6765\u6E90\u9ED8\u8BA4\u9884\u89C8\uFF1B\u4E0B\u65B9\u4FDD\u5B58\u7BA1\u7406\u914D\u7F6E\u540E\u751F\u6548\u3002\u672A\u77E5\u5B57\u6BB5\u3001\u5168\u5C40\u9884\u8BBE\u548C\u8D44\u6E90\u6B63\u6587\u4FDD\u7559\uFF1B\u5F53\u524D\u59D4\u6258\u4E0D\u53D8\u3002");
    } catch (e) {
      if (e.name !== "AbortError") setError(e);
    } finally {
      setBusy(false);
    }
  };
  const setFollowing = (field, checked) => {
    setForm((previous) => followField(previous, field, checked, at3(composed, field)));
    setReport(null);
    setNotice("");
  };
  const sourceValue = (field) => field === "adapterId" ? row.adapterId : field === "type" ? snapshot?.sourceDefault?.configuration?.type ?? row.type : field === "preset" ? null : field === "blacklist" ? snapshot?.sourceDefault?.configuration?.blacklist ?? [] : at3(snapshot?.sourceDefault?.configuration, field);
  const sourceText = (field) => fieldDescription(sourceValue(field), field, { row, catalog, source: true, scopePolicy: field === "whitelist" ? "source-bound" : void 0 });
  const isFollowing = (field) => field === "adapterId" ? form.adapterId === row.adapterId : followsSource(form, field, origins);
  const renderField = (field) => {
    const value = at3(composed, field), origin = field === "whitelist" && draft?.scopePolicy === "source-bound" ? "source-default" : fieldOrigin(composed, origins, field), following = isFollowing(field), canFollow = !["adapterId", "preset"].includes(field) && form.adapterId === row.adapterId;
    return (0, import_react7.createElement)("div", { className: "dmm-field dmm-comparison-field", key: field }, (0, import_react7.createElement)("label", null, fieldLabels[field]), (0, import_react7.createElement)("div", { className: "dmm-field-columns" }, (0, import_react7.createElement)("div", null, (0, import_react7.createElement)("small", null, "\u5F53\u524D\u503C"), (0, import_react7.createElement)("button", { className: "dmm-field-choice", disabled: busy || !catalog, "aria-label": `\u914D\u7F6E\u9009\u9879\uFF1A${fieldLabels[field]}`, onClick: () => openField(field) }, (0, import_react7.createElement)("span", { "data-field": field }, fieldDescription(value, field, { row: { ...row, config: composed }, catalog, scopePolicy: draft?.scopePolicy })), (0, import_react7.createElement)("small", null, "\u9009\u62E9\u4E0E\u7EC4\u5408 \u2192")), (0, import_react7.createElement)("small", null, originLabel(origin))), (0, import_react7.createElement)("div", { className: "dmm-follow-cell" }, (0, import_react7.createElement)("small", null, "\u662F\u5426\u8DDF\u968F\u6765\u6E90"), canFollow ? (0, import_react7.createElement)("label", null, (0, import_react7.createElement)("input", { type: "checkbox", "aria-label": `\u8DDF\u968F\u6765\u6E90\uFF1A${fieldLabels[field]}`, checked: following, disabled: busy, onChange: (e) => setFollowing(field, e.target.checked) }), "\u8DDF\u968F\u6765\u6E90") : (0, import_react7.createElement)("span", null, field === "preset" ? "\u6765\u6E90\u4E0D\u63D0\u4F9B\u9884\u8BBE" : following ? "\u6765\u6E90\u8DEF\u7531" : "\u81EA\u5B9A\u4E49\u8DEF\u7531")), (0, import_react7.createElement)("div", null, (0, import_react7.createElement)("small", null, "\u6765\u6E90\u9ED8\u8BA4\u503C"), (0, import_react7.createElement)("div", { className: "dmm-effective", "data-source-field": field }, sourceText(field)))), (0, import_react7.createElement)("small", null, `\u6765\u6E90\u9ED8\u8BA4\uFF1A${sourceText(field)} \xB7 ${field === "preset" ? value ? "\u5F53\u524D\u5F15\u7528\u9884\u8BBE" : "\u5F53\u524D\u4E0D\u5F15\u7528\u9884\u8BBE" : "\u5F53\u524D" + (following ? "\u8DDF\u968F\u6765\u6E90" : "\u4F7F\u7528\u672C\u5730\u6216\u9884\u8BBE\u914D\u7F6E")}${dirty ? " \xB7 \u8349\u7A3F\u672A\u4FDD\u5B58" : ""}`), origin?.startsWith("preset:") && (0, import_react7.createElement)("small", null, "\u6B64\u5B57\u6BB5\u7531\u9884\u8BBE\u63D0\u4F9B\uFF1B\u9009\u62E9\u8DDF\u968F\u6765\u6E90\u53EA\u6062\u590D\u6B64\u5B57\u6BB5\uFF0C\u5176\u4ED6\u9884\u8BBE\u5B57\u6BB5\u4FDD\u7559\u3002"));
  };
  return (0, import_react7.createElement)("div", { ref: element, "data-page": "detail" }, optionField && catalog && (0, import_react7.createElement)(OptionPage, { key: optionField, field: optionField, value: fieldValue(optionField), followingSource: isFollowing(optionField), sourceText: sourceText(optionField), onFollowSource: !["adapterId", "preset"].includes(optionField) && form.adapterId === row.adapterId ? () => setFollowing(optionField, true) : void 0, catalog, onDirty: setOptionDirty, effectiveType: composed?.type ?? row.type, localType: form.type || void 0, onRemoveMode: ["store", "retrieve"].includes(optionField.split(".")[0]) ? () => removeMode(optionField.split(".")[0]) : void 0, onChange: (value) => updateField(optionField, value), onBack: closeField }), (0, import_react7.createElement)("div", { hidden: !!optionField }, (0, import_react7.createElement)("div", { className: "dmm-page-top dmm-page-nav" }, (0, import_react7.createElement)("button", { className: "dmm-link", onClick: back }, "\u2190 \u8FD4\u56DE\u8D44\u6E90\u8868\u683C\uFF08\u4E22\u5F03\u672C\u9875\u4FEE\u6539\uFF09")), (0, import_react7.createElement)("p", { className: "dmm-muted" }, dirty ? "\u6709\u672A\u4FDD\u5B58\u4FEE\u6539" : "\u7BA1\u7406\u914D\u7F6E"), (0, import_react7.createElement)("h2", null, row.name ?? row.id), (0, import_react7.createElement)("p", { className: "dmm-muted" }, "\u5B57\u6BB5\u9875\u4FDD\u5B58\u5E76\u8FD4\u56DE\u53EA\u63D0\u4EA4\u8349\u7A3F\uFF1B\u4E0B\u65B9\u4FDD\u5B58\u7BA1\u7406\u914D\u7F6E\u624D\u539F\u5B50\u5199\u5165\u672C\u5730\u89C4\u5219\u6587\u4EF6\u3002\u8D44\u6E90\u6B63\u6587\u5355\u72EC\u4FDD\u5B58\u3002"), (0, import_react7.createElement)(ErrorBox, { error }), loading ? (0, import_react7.createElement)("p", { role: "status", "data-management-status": true }, managementStatus(row, { loading: true })) : !snapshot ? (0, import_react7.createElement)("div", null, (0, import_react7.createElement)("p", { role: "status" }, "\u672A\u80FD\u8BFB\u53D6\u5F53\u524D\u8303\u56F4\u7684\u7BA1\u7406\u914D\u7F6E\u3002"), (0, import_react7.createElement)("button", { onClick: load }, "\u91CD\u65B0\u8BFB\u53D6\u7BA1\u7406\u914D\u7F6E")) : (0, import_react7.createElement)("div", null, (0, import_react7.createElement)("section", { className: "dmm-card", "aria-label": "\u5F53\u524D\u6258\u7BA1\u72B6\u6001" }, (0, import_react7.createElement)("h3", null, "\u5F53\u524D\u6258\u7BA1\u72B6\u6001"), (0, import_react7.createElement)("p", { "data-management-status": true }, managementStatus({ ...row, ...snapshot })), snapshot.sourceDefault?.available && (0, import_react7.createElement)("p", { className: "dmm-muted" }, "\u6765\u6E90\u9ED8\u8BA4\u7248\u672C " + snapshot.sourceDefault.revision + " \xB7 \u6062\u590D\u53EA\u5F71\u54CD\u672C\u8D44\u6E90\u89C4\u5219\uFF0C\u4FDD\u5B58\u540E\u4ECD\u7531\u5F53\u524D\u7BA1\u7406\u65B9\u6267\u884C\u3002"), (0, import_react7.createElement)("button", { disabled: busy || !snapshot.sourceDefault?.available, onClick: restoreDefaults }, "\u6062\u590D\u6765\u6E90\u9ED8\u8BA4\u914D\u7F6E"), !snapshot.sourceDefault?.available && (0, import_react7.createElement)("p", { className: "dmm-muted" }, "\u6765\u6E90\u672A\u63D0\u4F9B\u5F53\u524D\u8D44\u6E90\u7684\u6709\u6548\u9ED8\u8BA4\u89C4\u5219\uFF0C\u65E0\u6CD5\u9884\u89C8\u6062\u590D\uFF1B\u8BF7\u5148\u68C0\u67E5\u6765\u6E90\u7248\u672C\u3001\u7ED1\u5B9A\u6216\u53EF\u7528\u72B6\u6001\u3002")), !catalog && (0, import_react7.createElement)("div", null, (0, import_react7.createElement)("p", { role: "status" }, "\u7BA1\u7406\u914D\u7F6E\u5DF2\u8BFB\u53D6\uFF1B\u9009\u9879\u76EE\u5F55\u5C1A\u672A\u8FD4\u56DE\u3002"), (0, import_react7.createElement)("button", { onClick: () => {
    if (!anyDirty || window.confirm("\u91CD\u65B0\u8BFB\u53D6\u4F1A\u4E22\u5F03\u7BA1\u7406\u914D\u7F6E\u8349\u7A3F\uFF0C\u662F\u5426\u7EE7\u7EED\uFF1F")) load();
  } }, "\u91CD\u65B0\u8BFB\u53D6\u7BA1\u7406\u914D\u7F6E\u4E0E\u9009\u9879\u76EE\u5F55")), !snapshot.local && (0, import_react7.createElement)("p", { className: "dmm-unconfigured" }, snapshot.sourceDefault?.available ? "\u5F53\u524D\u4F7F\u7528\u6765\u6E90\u9ED8\u8BA4\u7BA1\u7406\u89C4\u5219\uFF1B\u672C\u5730\u6CA1\u6709\u89C4\u5219\u8986\u76D6\u3002" : "\u6B64\u8D44\u6E90\u7F3A\u5C11\u672C\u5730\u89C4\u5219\uFF0C\u4E14\u6765\u6E90\u9ED8\u8BA4\u4E0D\u53EF\u7528\uFF1B\u5F53\u524D\u7BA1\u7406\u65B9\u4E0E\u5B9E\u9645\u62D2\u7EDD\u539F\u56E0\u89C1\u4E0A\u65B9\u3002"), liveRevision !== void 0 && liveRevision > snapshot.revision && (0, import_react7.createElement)("div", { className: "dmm-error", role: "alert" }, `\u5F53\u524D\u914D\u7F6E\u5DF2\u53D8\u5316\uFF08\u6253\u5F00\u65F6 ${snapshot.revision}\uFF0C\u5F53\u524D ${liveRevision}\uFF09\u3002\u8349\u7A3F\u4FDD\u7559\uFF1B\u8BF7\u91CD\u65B0\u8F7D\u5165\u540E\u5408\u5E76\u4FEE\u6539\u3002`, (0, import_react7.createElement)("button", { disabled: busy, onClick: () => {
    if (!dirty || window.confirm("\u91CD\u65B0\u8F7D\u5165\u4F1A\u4E22\u5F03\u7BA1\u7406\u914D\u7F6E\u8349\u7A3F\uFF0C\u662F\u5426\u7EE7\u7EED\uFF1F")) load();
  } }, "\u91CD\u65B0\u8F7D\u5165\u914D\u7F6E")), (0, import_react7.createElement)("section", { className: "dmm-card" }, (0, import_react7.createElement)("h3", null, "\u8D44\u6E90\u8EAB\u4EFD"), (0, import_react7.createElement)("div", { className: "dmm-grid" }, (0, import_react7.createElement)("div", { className: "dmm-field" }, (0, import_react7.createElement)("label", null, "\u8D44\u6E90 ID \xB7 \u53EA\u8BFB"), (0, import_react7.createElement)("input", { "aria-label": "\u8D44\u6E90 ID", readOnly: true, value: row.id }), (0, import_react7.createElement)("small", null, "\u540C\u4E00\u4E2A ID \u662F\u540C\u4E00\u4EFD\u5185\u5BB9\uFF1B\u9700\u8981\u72EC\u7ACB\u5185\u5BB9\u8BF7\u590D\u5236\u8D44\u6E90\u3002")), (0, import_react7.createElement)("div", { className: "dmm-field" }, (0, import_react7.createElement)("label", null, "\u6743\u5A01\u6B63\u6587\u6765\u6E90 \xB7 \u53EA\u8BFB"), (0, import_react7.createElement)("input", { "aria-label": "\u8D44\u6E90\u63D0\u4F9B\u65B9", readOnly: true, value: row.adapterId }), (0, import_react7.createElement)("small", null, `${row.missing ? "\u6765\u6E90\u4E0D\u53EF\u7528\uFF0C\u5F53\u524D\u80FD\u529B\u4E0D\u53EF\u5224\u5B9A" : "\u6765\u6E90\u5DF2\u63A5\u5165"} \xB7 \u6765\u6E90\u7C7B\u578B\uFF1A${row.type ?? "\u4E0D\u53EF\u5224\u5B9A"}`)))), (0, import_react7.createElement)("section", { className: "dmm-card" }, (0, import_react7.createElement)("h3", null, "\u89C4\u5219\u8DEF\u7531 adapter"), renderField("adapterId"), (0, import_react7.createElement)("p", { className: "dmm-muted" }, "\u53EF\u9009\u62E9\u4EFB\u610F\u5DF2\u6CE8\u518C adapter\u3002\u66F4\u6362\u53EA\u6539\u53D8\u89C4\u5219\u8DEF\u7531\uFF1B\u6821\u9A8C\u5FC5\u987B\u786E\u8BA4\u8BE5 adapter \u652F\u6301\u6B64\u7A33\u5B9A\u8D44\u6E90 ID \u4E0E\u539F\u6765\u6E90\uFF0C\u6B63\u6587\u4E0D\u4F1A\u8FC1\u79FB\uFF0C\u4E5F\u4E0D\u4F1A\u53D6\u5F97\u989D\u5916\u6743\u9650\u3002")), (0, import_react7.createElement)("section", { className: "dmm-card" }, (0, import_react7.createElement)("div", { className: "dmm-section-head" }, (0, import_react7.createElement)("h3", null, "\u7C7B\u578B\u4E0E\u9884\u8BBE"), (0, import_react7.createElement)(HelpInfo, { label: "\u672C\u5730\u4E0E\u9884\u8BBE\u8BF4\u660E", text: "\u672C\u5730\u5B57\u6BB5\u53EF\u81EA\u7531\u7EC4\u5408\uFF0C\u518D\u7531\u6765\u6E90\u6821\u9A8C\u3002\u9884\u8BBE\u660E\u786E\u63D0\u4F9B\u7684\u5B57\u6BB5\u8986\u76D6\u672C\u5730\u503C\uFF1B\u9010\u5B57\u6BB5\u9009\u62E9\u8DDF\u968F\u6765\u6E90\u65F6\uFF0C\u8BE5\u5B57\u6BB5\u6700\u7EC8\u91C7\u7528\u6765\u6E90\u503C\uFF0C\u5176\u4ED6\u9884\u8BBE\u5B57\u6BB5\u4FDD\u7559\u3002\u4FDD\u5B58\u53EA\u5199\u672C\u5730\u6761\u76EE\uFF0C\u4E0D\u4FEE\u6539\u9884\u8BBE\u5B9A\u4E49\uFF0C\u4E5F\u4E0D\u5C06\u751F\u6548\u503C\u53CD\u5199\u6210\u672C\u5730\u503C\u3002preset \u5F15\u7528\u672C\u8EAB\u6765\u81EA\u672C\u5730\uFF0C\u4E0D\u7EE7\u627F\u81EA\u8EAB\u3002" })), (0, import_react7.createElement)("div", null, renderField("type"), renderField("preset"))), (0, import_react7.createElement)("section", { className: "dmm-card" }, (0, import_react7.createElement)("div", { className: "dmm-section-head" }, (0, import_react7.createElement)("h3", null, "\u9002\u7528\u8303\u56F4"), (0, import_react7.createElement)(HelpInfo, { label: "\u540D\u5355\u914D\u7F6E\u8BF4\u660E", text: "\u70B9\u51FB\u540D\u5355\u9009\u62E9\u4F5C\u7528\u57DF\uFF0C\u53EF\u7EC4\u5408\u591A\u4E2A\u8303\u56F4\uFF1B\u7EE7\u627F\u6765\u6E90\u9ED8\u8BA4\u65F6\u4ECD\u7531\u6765\u6E90\u7ED1\u5B9A\u548C\u6743\u9650\u51B3\u5B9A\u9002\u7528\u8303\u56F4\uFF1B\u672C\u5730\u663E\u5F0F\u767D\u540D\u5355\u547D\u4E2D\u4EFB\u4E00\u9879\u4E14\u672A\u547D\u4E2D\u9ED1\u540D\u5355\u624D\u9002\u7528\uFF0C\u663E\u5F0F\u7A7A\u767D\u540D\u5355\u4E0D\u9002\u7528\u4EFB\u4F55\u8303\u56F4\u3002" })), (0, import_react7.createElement)("div", null, renderField("whitelist"), renderField("blacklist"))), ...["store", "retrieve"].map((mode) => (0, import_react7.createElement)("section", { className: "dmm-card", key: mode }, (0, import_react7.createElement)("div", { className: "dmm-section-head" }, (0, import_react7.createElement)("h3", null, mode === "store" ? "\u5B58\u50A8 store" : "\u8BFB\u53D6 retrieve"), (0, import_react7.createElement)("button", { disabled: busy, onClick: () => removeMode(mode) }, mode === "store" ? "\u79FB\u9664\u672C\u5730\u5B58\u50A8\u914D\u7F6E" : "\u79FB\u9664\u672C\u5730\u8BFB\u53D6\u914D\u7F6E"), (0, import_react7.createElement)(HelpInfo, { label: mode + "\u914D\u7F6E\u8BF4\u660E", text: "\u5206\u522B\u9009\u62E9\u65F6\u673A\u3001\u7EC4\u5408\u6761\u4EF6\u4E0E\u987A\u5E8F\u7B56\u7565\u3002\u9009\u9879\u76EE\u5F55\u6765\u81EA\u771F\u5B9E\u6CE8\u518C\u80FD\u529B\uFF1B\u6765\u6E90\u56FA\u5B9A\u7B56\u7565\u6309\u6574\u4F53\u9009\u62E9\u3002\u6821\u9A8C\u4E0D\u6267\u884C\u4E8B\u4EF6\u3001\u6761\u4EF6\u6216\u64CD\u4F5C\u3002" })), (0, import_react7.createElement)("p", { className: "dmm-muted" }, "\u79FB\u9664\u672C\u5730\u914D\u7F6E\u53EA\u79FB\u9664\u8BE5\u6A21\u5F0F\u7684\u89C4\u5219\u8986\u76D6\uFF0C\u56DE\u5230\u9884\u8BBE\u6216\u9ED8\u8BA4\u503C\uFF1B\u8D44\u6E90\u6B63\u6587\u4E0D\u4F1A\u5220\u9664\u3002"), (0, import_react7.createElement)("div", null, ...["on", "rule", "strategy"].map((part) => renderField(mode + "." + part))))), (0, import_react7.createElement)(Diagnostics, { report }), notice && (0, import_react7.createElement)("div", { className: "dmm-status", role: "status" }, notice), (0, import_react7.createElement)("div", { className: "dmm-sticky-actions" }, (0, import_react7.createElement)("div", { className: "dmm-actions" }, (0, import_react7.createElement)("button", { disabled: busy, onClick: () => submit(false) }, busy ? "\u6B63\u5728\u5904\u7406\u2026" : "\u6821\u9A8C\u914D\u7F6E"), (0, import_react7.createElement)("button", { className: "dmm-primary", disabled: busy || !dirty, onClick: () => submit(true) }, "\u4FDD\u5B58\u7BA1\u7406\u914D\u7F6E\uFF08\u5199\u5165\u6587\u4EF6\uFF09"), (0, import_react7.createElement)(HelpInfo, { label: "\u4FDD\u5B58\u7BA1\u7406\u914D\u7F6E\u8BF4\u660E", text: "\u4FDD\u5B58\u4F1A\u91CD\u65B0\u6821\u9A8C\u5E76\u68C0\u67E5\u914D\u7F6E\u7248\u672C\u548C\u78C1\u76D8\u53D8\u5316\uFF0C\u901A\u8FC7\u540E\u539F\u5B50\u5199\u5165\u65B0\u7248\u672C\u3002\u6821\u9A8C\u4E0D\u6388\u4E88\u8D44\u6E90\u6743\u9650\uFF1B\u4E0D\u652F\u6301\u6216\u672A\u6CE8\u518C\u7684\u80FD\u529B\u4F1A\u660E\u786E\u62A5\u9519\uFF0C\u65E0\u6CD5\u9759\u6001\u786E\u8BA4\u7684\u4E8B\u4EF6\u4E0A\u4E0B\u6587\u4E0E\u6743\u9650\u6807\u8BB0\u4E3A\u672A\u9A8C\u8BC1\u3002\u5931\u8D25\u4FDD\u7559\u6709\u6548\u914D\u7F6E\u548C\u672C\u9875\u8349\u7A3F\u3002" }))), (0, import_react7.createElement)(ContentEditor, { row: { ...row, ...snapshot }, sessionId, onChange, onDirty: setContentDirty }), sessionId && (0, import_react7.createElement)("section", { className: "dmm-card" }, (0, import_react7.createElement)("h3", null, "\u89E6\u53D1\u8BB0\u5F55" + (roundLabel ? " \xB7 " + roundLabel : "")), (0, import_react7.createElement)("p", { className: "dmm-muted" }, ["store", "retrieve"].map((mode) => `${mode === "store" ? "\u5B58\u50A8" : "\u8BFB\u53D6"}\uFF1A${triggerLabels[operationStatus(row, mode)]}`).join(" \xB7 ")), row.facts.length ? (0, import_react7.createElement)("pre", null, row.facts.map((f) => `${observationMode(f) === "store" ? "\u5B58\u50A8" : observationMode(f) === "retrieve" ? "\u8BFB\u53D6" : "\u64CD\u4F5C\u7C7B\u578B\u672A\u786E\u8BA4"} \xB7 ${evidenceLabel(f)} \xB7 ${f.turnKind} ${f.turn ?? "\u2014"} \xB7 ${f.detail ?? f.reason ?? ""}`).join("\n")) : (0, import_react7.createElement)("p", null, "\u5F53\u524D\u7B5B\u9009\u8303\u56F4\u6CA1\u6709\u6765\u6E90\u89E6\u53D1\u8BB0\u5F55\uFF0C\u65E0\u6CD5\u636E\u6B64\u5224\u65AD\u8D44\u6E90\u672A\u4F7F\u7528\u3002")))));
}
function Panel(props) {
  return (0, import_react7.createElement)(ScopedPanel, { ...props, key: JSON.stringify([props.sessionId ?? null]) });
}
function ScopedPanel({ sessionId, onClose, sessionView = false }) {
  const [query, setQuery] = (0, import_react7.useState)(null), [filters, setFilters] = (0, import_react7.useState)(emptyFilters), [page, setPage] = (0, import_react7.useState)("table"), [selected, setSelected] = (0, import_react7.useState)(null), [selectedRound, setSelectedRound] = (0, import_react7.useState)(void 0), [roundLabel, setRoundLabel] = (0, import_react7.useState)(void 0), [version, setVersion] = (0, import_react7.useState)(0), [notice, setNotice] = (0, import_react7.useState)(""), [reloadError, setReloadError] = (0, import_react7.useState)(null), [reloading, setReloading] = (0, import_react7.useState)(false);
  const historyReader = (0, import_react7.useRef)(null);
  if (!historyReader.current) historyReader.current = createTavernHistoryReader((path, signal) => requestJson(fetch, path, { signal }));
  const lifecycle = (0, import_react7.useRef)(null), element = (0, import_react7.useRef)(null), tableScroll = (0, import_react7.useRef)([]), tableLeft = (0, import_react7.useRef)(0), filterData = (0, import_react7.useRef)(null);
  const queryKey = canonical([sessionId ?? null, filters, version, sessionView]), data = query?.key === queryKey ? query.data : null, error = query?.key === queryKey ? query.error : null;
  (0, import_react7.useEffect)(() => {
    const ctrl = new AbortController();
    lifecycle.current = ctrl;
    return () => ctrl.abort();
  }, []);
  (0, import_react7.useEffect)(() => {
    const ctrl = new AbortController();
    let timer;
    async function load() {
      try {
        const q = new URLSearchParams(sessionId ? { sessionId } : {});
        for (const [key, values] of Object.entries({ adapterId: filters.adapterId })) for (const value of values) q.append(key, value);
        q.set("filters", JSON.stringify(filters.fields));
        let result = await api("/query?" + q, void 0, ctrl.signal);
        if (sessionId) {
          let history = { facts: [], diagnostics: [] };
          if (result.rows.some((row) => ["tavern.world-books", "tavern.mvu", "tavern.prompt-templates", "dsh.skills"].includes(row.adapterId) || row.facts?.some((f) => f.evidence === "content-read"))) try {
            history = await historyReader.current(sessionId, ctrl.signal);
          } catch (error2) {
            ctrl.signal.throwIfAborted();
            history.diagnostics.push({ code: "TAVERN_HISTORY_UNAVAILABLE", message: "\u8D44\u6E90\u5386\u53F2\u8BFB\u53D6\u5931\u8D25\uFF0C\u89E6\u53D1\u72B6\u6001\u53EF\u80FD\u4E0D\u5B8C\u6574\u3002" + error2.message });
          }
          result = withHistoryFacts(result, history.facts, { turn: filters.turn, turnKind: filters.turnKind, status: [] });
          if (!sessionView) result.rows = result.rows.filter((row) => matchesOperationFilters(row, filters));
          result.diagnostics = [...result.diagnostics ?? [], ...history.diagnostics];
        }
        if (!ctrl.signal.aborted) {
          setQuery({ key: queryKey, data: result, error: null });
        }
      } catch (e) {
        if (!ctrl.signal.aborted) setQuery((previous) => ({ key: queryKey, data: previous?.key === queryKey ? previous.data : null, error: e }));
      }
      if (!ctrl.signal.aborted) timer = setTimeout(load, 2500);
    }
    load();
    return () => {
      ctrl.abort();
      clearTimeout(timer);
    };
  }, [queryKey]);
  const reload = async () => {
    setReloading(true);
    setNotice("");
    setReloadError(null);
    try {
      const result = await api("/reload", {}, lifecycle.current.signal);
      if (lifecycle.current.signal.aborted) return;
      setQuery((q) => q?.key === queryKey && q.data ? { ...q, data: { ...q.data, configError: null, revision: result.revision } } : q);
      setNotice(result.unchanged ? `\u914D\u7F6E\u5DF2\u662F\u6700\u65B0\uFF08\u7248\u672C ${result.revision}\uFF09\uFF0C\u65E0\u9700\u5207\u6362\u3002` : `\u5DF2\u8BFB\u53D6\u5E76\u542F\u7528\u7BA1\u7406\u914D\u7F6E\uFF0C\u7248\u672C ${result.revision}\u3002`);
    } catch (e) {
      if (!lifecycle.current.signal.aborted) setReloadError(e);
    } finally {
      if (!lifecycle.current.signal.aborted) {
        setReloading(false);
        setVersion((v) => v + 1);
      }
    }
  };
  const navigate = (next, row, round, label) => {
    tableScroll.current = readScroll(element.current);
    tableLeft.current = element.current?.querySelector(".dmm-table-wrap")?.scrollLeft ?? 0;
    if (next === "filters") filterData.current = data;
    if (row) {
      setSelected(row);
      setSelectedRound(round);
      setRoundLabel(label);
    }
    setPage(next);
    requestAnimationFrame(() => topOfPage(element.current));
  };
  const back = () => {
    setPage("table");
    requestAnimationFrame(() => {
      for (const [node, top] of tableScroll.current) if (node.isConnected) node.scrollTop = top;
      const table = element.current?.querySelector(".dmm-table-wrap");
      if (table) table.scrollLeft = tableLeft.current;
    });
  };
  const activeRow = (data ? sessionView && selectedRound !== void 0 ? roundRows(data, selectedRound) : data.rows : []).find((r) => r.id === selected?.id && r.adapterId === selected?.adapterId) ?? selected;
  const sessionLoading = error?.code === "SESSION_READER_NOT_READY", configurationError = reloadError ?? data?.configError, count = filterCount(filters, sessionId), resourceCount = data ? sessionView && sessionId ? roundVisibleCount(data, filters.turn, [], filters) : data.rows.length : "\u2026";
  return (0, import_react7.createElement)("section", { ref: element, className: "dmm", "aria-label": sessionId ? "\u4F1A\u8BDD\u8BB0\u5FC6\u7BA1\u7406" : "\u5168\u5C40\u8BB0\u5FC6\u7BA1\u7406" }, onClose && (0, import_react7.createElement)("div", { className: "dmm-actions" }, (0, import_react7.createElement)("button", { className: "dmm-close", onClick: onClose, "aria-label": "\u5173\u95ED\u8BB0\u5FC6\u7BA1\u7406" }, "\xD7")), page === "detail" ? (0, import_react7.createElement)(DetailPage, { key: JSON.stringify([selected.adapterId, selected.id, selectedRound]), row: activeRow, sessionId, roundLabel, liveRevision: data?.revision, onBack: back, onChange: () => setVersion((v) => v + 1) }) : page === "presets" ? (0, import_react7.createElement)(PresetsPage, { api, onBack: back, onChange: () => setVersion((v) => v + 1) }) : page === "adapters" ? (0, import_react7.createElement)(AdaptersPage, { onBack: back, onChange: () => setVersion((v) => v + 1) }) : page === "filters" ? (0, import_react7.createElement)(FiltersPage, { data: filterData.current, sessionId, filters, setFilters, onBack: back }) : (0, import_react7.createElement)("div", { "data-page": "table" }, (0, import_react7.createElement)("div", { className: "dmm-heading" }, (0, import_react7.createElement)("h2", null, "\u8BB0\u5FC6\u7BA1\u7406"), (0, import_react7.createElement)("span", { className: "dmm-muted" }, `${resourceCount} \u9879\u8D44\u6E90`)), (0, import_react7.createElement)("p", { className: "dmm-muted" }, sessionId ? sessionView ? "\u5F53\u524D\u4F1A\u8BDD\u8D44\u6E90 \xB7 \u6309\u8F6E\u6B21\u67E5\u770B\u5B58\u50A8\u4E0E\u8BFB\u53D6\u89E6\u53D1" : "\u5F53\u524D\u4F1A\u8BDD\u8D44\u6E90 \xB7 \u7BA1\u7406\u914D\u7F6E" : "\u5168\u5C40\u8D44\u6E90 \xB7 \u7BA1\u7406\u914D\u7F6E\u6982\u89C8"), (0, import_react7.createElement)("div", { className: "dmm-toolbar" }, (0, import_react7.createElement)("div", { className: "dmm-actions" }, (0, import_react7.createElement)("button", { onClick: reload, disabled: reloading }, reloading ? "\u6B63\u5728\u8BFB\u53D6\u2026" : "\u91CD\u65B0\u8BFB\u53D6\u7BA1\u7406\u914D\u7F6E"), (0, import_react7.createElement)(HelpInfo, { label: "\u91CD\u65B0\u8BFB\u53D6\u7BA1\u7406\u914D\u7F6E\u8BF4\u660E", text: "\u8BFB\u53D6\u670D\u52A1\u7AEF\u5DF2\u4FDD\u5B58\u7684\u7BA1\u7406\u89C4\u5219\u4E0E\u9884\u8BBE\u3002\u6587\u4EF6\u5185\u5BB9\u672A\u53D8\u65F6\u4FDD\u6301\u5F53\u524D\u7248\u672C\uFF1B\u6B64\u64CD\u4F5C\u4E0D\u91CD\u65B0\u52A0\u8F7D\u4F1A\u8BDD\u6216\u8D44\u6E90\u5185\u5BB9\u3002" })), (0, import_react7.createElement)("div", { className: "dmm-actions" }, (0, import_react7.createElement)("button", { onClick: () => navigate("presets") }, "\u5B58\u53D6\u9884\u8BBE"), (0, import_react7.createElement)("button", { onClick: () => navigate("adapters") }, "Adapter"), (0, import_react7.createElement)("button", { onClick: () => navigate("filters"), "aria-label": `\u7B5B\u9009\u8D44\u6E90\uFF0C${count} \u9879\u5DF2\u542F\u7528` }, "\u7B5B\u9009", count > 0 && (0, import_react7.createElement)("span", { className: "dmm-badge" }, count)))), notice && (0, import_react7.createElement)("p", { className: "dmm-status", role: "status" }, notice), (0, import_react7.createElement)(ErrorBox, { error: sessionLoading ? null : error }), configurationError && (0, import_react7.createElement)(ErrorBox, { error: `\u914D\u7F6E\u672A\u5207\u6362\uFF1B\u6CBF\u7528\u7248\u672C ${data?.revision ?? "\u5F85\u786E\u8BA4"}\u3002${configFailure(configurationError)}` }), ...(data?.diagnostics ?? []).map((d, i) => (0, import_react7.createElement)("p", { key: i, className: "dmm-error", role: "status" }, `${d.adapterId ?? ""}\uFF1A${d.message}`)), !data ? (0, import_react7.createElement)("p", { role: "status" }, sessionLoading ? "\u4F1A\u8BDD\u8BFB\u53D6\u670D\u52A1\u6B63\u5728\u521D\u59CB\u5316\u2026" : error?.code === "SESSION_NOT_FOUND" ? "\u4F1A\u8BDD\u4E0D\u5B58\u5728\u3002" : error ? "\u6765\u6E90\u8BFB\u53D6\u5931\u8D25\uFF0C\u8BF7\u91CD\u65B0\u8BFB\u53D6\u3002" : sessionId ? "\u4F1A\u8BDD\u8D44\u6E90\u52A0\u8F7D\u4E2D\u2026" : "\u8BB0\u5FC6\u7BA1\u7406\u52A0\u8F7D\u4E2D\u2026") : sessionView && sessionId ? (0, import_react7.createElement)(RoundTable, { data, filters, Table, onDetail: (row, round, label) => navigate("detail", row, round, label) }) : data.rows.length ? (0, import_react7.createElement)(Table, { data, showStatus: !!sessionId, onDetail: (row) => navigate("detail", row) }) : (0, import_react7.createElement)("div", { className: "dmm-empty" }, "\u5F53\u524D\u8303\u56F4\u548C\u7B5B\u9009\u6761\u4EF6\u4E0B\u6CA1\u6709\u53EF\u89C1\u8D44\u6E90\u3002"), data && (0, import_react7.createElement)("details", { className: "dmm-catalogs", open: !data.rows.length }, (0, import_react7.createElement)("summary", null, `\u67E5\u8BE2\u8303\u56F4\uFF1A${sessionId ? "\u5F53\u524D\u4F1A\u8BDD" : "\u5168\u5C40"} \xB7 \u5DF2\u63A5\u5165 ${data.adapters.length} \u4E2A\u8D44\u6E90\u63D0\u4F9B\u65B9`), ...(data.catalogs ?? []).map((c) => (0, import_react7.createElement)("p", { key: c.adapterId }, `${sourceName(data, c.adapterId)}\uFF1A${c.count === null ? c.binding === "unconfirmed" ? "\u7ED1\u5B9A\u672A\u786E\u8BA4" : "\u8BFB\u53D6\u5931\u8D25" : `\u8FD4\u56DE ${c.count} \u9879`}\u3002${c.description ?? ""}`)))));
}
var ConversationView = createConversationView(Panel);
function apply(ctx) {
  ctx.effect(() => {
    const style = document.createElement("style");
    style.textContent = css + roundCss;
    document.head.append(style);
    return () => style.remove();
  });
  registerConversationView(ctx, ConversationView);
  ctx.slots.inject("settings.section", () => ctx.slots.register({ name: "settings.section", id: "dsh-memory-manager", label: "\u8BB0\u5FC6\u7BA1\u7406", order: 70 }, Panel));
}

return module.exports;}});
