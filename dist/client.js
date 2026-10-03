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
var import_react = require("react");
var name = "dsh-memory-manager";
var inject = ["slots"];
var root = "/api/dsh-memory-manager";
async function api(path, body, signal) {
  const r = await fetch(root + path, { signal, headers: body ? { "Content-Type": "application/json", "X-DSH-Memory-Manager": "1" } : void 0, method: body ? "POST" : "GET", body: body ? JSON.stringify(body) : void 0 });
  const data = await r.json();
  if (!r.ok) throw Object.assign(Error(data.error?.message ?? "\u8BF7\u6C42\u5931\u8D25"), { code: data.error?.code });
  return data;
}
var causeLabels = { "user-interaction": "\u7528\u6237\u4EA4\u4E92", "interval": "\u5B9A\u65F6\u5668", "script": "\u811A\u672C" };
var labels = { never: "\u672A\u89E6\u53D1", past: "\u66FE\u89E6\u53D1", running: "\u6B63\u5728\u89E6\u53D1" };
var css = `.dmm{font:13px/1.55 var(--dsw-font-family,system-ui);color:var(--dsw-alias-label-primary,#ddd);padding:18px;min-width:0}.dmm h2{font-size:19px;margin:0 0 4px}.dmm p{color:var(--dsw-alias-label-secondary,#aaa);margin:4px 0 16px}.dmm-toolbar{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}.dmm button,.dmm input,.dmm select,.dmm textarea{font:inherit;border:1px solid var(--dsw-alias-border-l2,#444);border-radius:7px;color:inherit;background:var(--dsw-alias-bg-base,#202125);padding:6px 9px}.dmm button{cursor:pointer}.dmm input{width:100px}.dmm textarea{box-sizing:border-box;min-height:170px;width:100%;font-family:monospace}.dmm-row{border:1px solid var(--dsw-alias-border-l2,#444);border-radius:9px;margin:8px 0;overflow:hidden}.dmm-row summary{display:flex;align-items:center;gap:9px;padding:11px;cursor:pointer}.dmm-dot{width:7px;height:7px;border-radius:50%;background:#8b929b}.dmm-row[data-state=past] .dmm-dot{background:#5fae88}.dmm-row[data-state=running] .dmm-dot{background:#e5b64e}.dmm-name{font-weight:600;flex:1}.dmm-meta{font-size:11px;color:var(--dsw-alias-label-secondary,#aaa)}.dmm-content{padding:12px;border-top:1px solid var(--dsw-alias-border-l2,#444)}.dmm pre{white-space:pre-wrap;overflow-wrap:anywhere;font:11px/1.6 monospace;max-height:260px;overflow:auto}.dmm-error{background:#9c363622;color:#dc8585;border:1px solid #9c3636;padding:10px;border-radius:7px;white-space:pre-wrap}.dmm-empty{padding:30px;border:1px dashed #666;border-radius:10px;text-align:center}.dmm-overlay{position:fixed;inset:65px 16px 20px auto;width:min(620px,calc(100vw - 32px));z-index:1000;overflow:auto;border:1px solid var(--dsw-alias-border-l2,#444);border-radius:12px;background:var(--dsw-alias-bg-base,#202125);box-shadow:0 15px 55px #0007}.dmm-close{float:right}.dmm-tag{border-radius:4px;padding:2px 6px;background:#ffffff0b;font-size:11px}.dmm-filter{border:1px solid var(--dsw-alias-border-l2,#444);border-radius:7px;align-self:flex-start;flex:0 1 210px;overflow-wrap:anywhere}.dmm-filter>summary{padding:6px 9px;cursor:pointer}.dmm-filter fieldset{border:0;margin:0;padding:8px;max-height:240px;overflow:auto}.dmm-filter legend{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}.dmm-filter label{display:flex;gap:8px;align-items:center;padding:7px 0;cursor:pointer}.dmm-filter input[type=checkbox]{width:16px;height:16px;margin:0;flex-shrink:0;accent-color:#66b4a0}.dmm-filter button{width:100%}.dmm-catalogs{margin:10px 0}.dmm-catalogs summary{cursor:pointer}.dmm-catalogs p{margin:6px 0;overflow-wrap:anywhere}.dmm-toolbar>*{box-sizing:border-box;max-width:100%;min-width:0}.dmm-name{min-width:0;overflow-wrap:anywhere}.dmm-row summary{flex-wrap:wrap}.dmm-row summary .dmm-dot{flex-shrink:0}@media(max-width:600px){[data-shortcut-modal="settings"]:has([data-slot="settings.section"]>.dmm){flex-direction:column}[data-shortcut-modal="settings"]:has([data-slot="settings.section"]>.dmm)>nav{width:auto;flex-basis:auto;flex-shrink:0;padding:12px;max-height:170px;overflow:auto}[data-shortcut-modal="settings"]:has([data-slot="settings.section"]>.dmm)>nav>div:last-child{display:flex;flex-direction:row;flex-wrap:wrap;gap:4px}[data-shortcut-modal="settings"]:has([data-slot="settings.section"]>.dmm)>nav button{width:auto;flex:0 0 auto}.dmm{padding:12px}.dmm-row summary{gap:6px}.dmm-name{flex-basis:55%}}`;
function Resource({ row, sessionId, onChange }) {
  const [record, setRecord] = (0, import_react.useState)(null), [text, setText] = (0, import_react.useState)(""), [error, setError] = (0, import_react.useState)(""), [busy, setBusy] = (0, import_react.useState)(false);
  const lifecycle = (0, import_react.useRef)(null);
  (0, import_react.useEffect)(() => {
    const controller = new AbortController();
    lifecycle.current = controller;
    return () => controller.abort();
  }, [sessionId, row.id, row.adapterId]);
  const query = new URLSearchParams({ adapterId: row.adapterId, id: row.id, ...sessionId ? { sessionId } : {} });
  const load = async () => {
    setBusy(true);
    try {
      const r = await api("/read?" + query, void 0, lifecycle.current?.signal);
      setRecord(r);
      setText(typeof r?.content === "string" ? r.content : JSON.stringify(r?.content, null, 2));
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const ownership = async () => {
    setBusy(true);
    try {
      await api("/management", { adapterId: row.adapterId, id: row.id, sessionId, expectedRevision: record.revision, operationId: crypto.randomUUID(), mode: row.managed ? "native" : "managed" }, lifecycle.current?.signal);
      await load();
      onChange();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const copy = async () => {
    setBusy(true);
    try {
      await api("/copy", { adapterId: row.adapterId, id: row.id, sessionId, newId: row.id + "-copy-" + crypto.randomUUID() }, lifecycle.current?.signal);
      onChange();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const save = async () => {
    setBusy(true);
    try {
      const content = typeof record.content === "string" ? text : JSON.parse(text);
      const r = await api("/update", { adapterId: row.adapterId, id: row.id, sessionId, expectedRevision: record.revision, operationId: crypto.randomUUID(), content }, lifecycle.current?.signal);
      setRecord(r);
      setError("");
      onChange();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (0, import_react.createElement)("details", { className: "dmm-row", "data-state": row.status }, (0, import_react.createElement)("summary", null, (0, import_react.createElement)("i", { className: "dmm-dot" }), (0, import_react.createElement)("span", { className: "dmm-name" }, row.name ?? row.id), (0, import_react.createElement)("span", { className: "dmm-tag" }, row.applied ? "\u5DF2\u5E94\u7528" : "\u65E0\u5E94\u7528\u8BC1\u636E"), (0, import_react.createElement)("span", { className: "dmm-meta" }, labels[row.status])), (0, import_react.createElement)(
    "div",
    { className: "dmm-content" },
    row.interrupted && (0, import_react.createElement)("p", null, "\u5148\u524D\u6267\u884C\u4E2D\u65AD\uFF0C\u7ED3\u679C\u672A\u786E\u8BA4"),
    (0, import_react.createElement)("div", { className: "dmm-meta" }, `${row.adapterId} \xB7 ${row.type ?? "\u672A\u77E5\u7C7B\u578B"} \xB7 ${row.missing ? "\u6765\u6E90\u4E0D\u53EF\u7528" : row.authority ?? ""}`),
    (0, import_react.createElement)("p", null, row.config ? row.managed ? row.applicable ? "\u5DF2\u6258\u7BA1 \xB7 \u5F53\u524D\u8303\u56F4\u9002\u7528" : "\u5DF2\u6258\u7BA1 \xB7 \u5F53\u524D\u8303\u56F4\u4E0D\u9002\u7528" : "\u6765\u6E90\u539F\u751F\u7BA1\u7406 \xB7 \u914D\u7F6E\u5C1A\u672A\u63A5\u7BA1" : "\u672A\u914D\u7F6E\u7BA1\u7406\u89C4\u5219\uFF1B\u6765\u6E90\u4FDD\u6301\u539F\u751F\u884C\u4E3A"),
    (0, import_react.createElement)("button", { onClick: load, disabled: busy || row.missing }, record ? "\u91CD\u65B0\u8BFB\u53D6" : "\u67E5\u770B\u5185\u5BB9"),
    record && (0, import_react.createElement)("div", null, row.missing && (0, import_react.createElement)("p", null, "\u4E0A\u6B21\u8BFB\u53D6\u7684\u5185\u5BB9\uFF1B\u6765\u6E90\u5F53\u524D\u4E0D\u53EF\u7528"), row.capabilities.edit ? (0, import_react.createElement)("textarea", { "aria-label": "\u8D44\u6E90\u5185\u5BB9", value: text, onChange: (e) => setText(e.target.value) }) : (0, import_react.createElement)("pre", null, text), (0, import_react.createElement)("div", { className: "dmm-meta" }, `\u7248\u672C ${record.revision ?? "\u6765\u6E90\u672A\u63D0\u4F9B"} \xB7 ${row.capabilities.edit ? "\u7F16\u8F91\u7531\u6765\u6E90\u6821\u9A8C\u548C\u4FDD\u5B58" : "\u6765\u6E90\u672A\u63D0\u4F9B\u7F16\u8F91\u80FD\u529B"}`), row.capabilities.edit && (0, import_react.createElement)("button", { onClick: save, disabled: busy }, "\u4FDD\u5B58\u5230\u6765\u6E90"), row.capabilities.copy && (0, import_react.createElement)("button", { onClick: copy, disabled: busy }, "\u590D\u5236\u4E3A\u65B0 ID"), row.capabilities.management && (0, import_react.createElement)("button", { onClick: ownership, disabled: busy }, row.managed ? "\u4EA4\u56DE\u6765\u6E90\u539F\u751F\u7BA1\u7406" : "\u59D4\u6258\u8BB0\u5FC6\u7BA1\u7406")),
    error && (0, import_react.createElement)("div", { className: "dmm-error", role: "alert" }, error),
    (0, import_react.createElement)("details", null, (0, import_react.createElement)("summary", null, "\u914D\u7F6E\u53CA\u5B57\u6BB5\u6765\u6E90"), (0, import_react.createElement)("pre", null, JSON.stringify({ effective: row.config, origins: row.origins }, null, 2))),
    (0, import_react.createElement)("details", { open: true }, (0, import_react.createElement)("summary", null, `\u5E94\u7528\u8BB0\u5F55 \xB7 ${row.facts.length}`), row.facts.length ? (0, import_react.createElement)("pre", null, row.facts.map((f) => `${f.phase}${f.on === "card_variable_update" ? " \xB7 \u5361\u7247\u53D8\u91CF\u66F4\u65B0" : ""}${f.cause ? " \xB7 " + (causeLabels[f.cause] ?? f.cause) : ""} \xB7 ${f.turnKind} ${f.turn ?? "\u2014"} \xB7 ${f.requestId ?? f.eventId}${f.detail || f.reason ? " \xB7 " + (f.detail ?? f.reason) : ""}`).join("\n")) : (0, import_react.createElement)("p", null, "\u6CA1\u6709\u5339\u914D\u7B5B\u9009\u6761\u4EF6\u7684\u6765\u6E90\u89E6\u53D1\u8BB0\u5F55\u3002\u53EF\u7528\u3001\u88AB\u8BFB\u53D6\u4E0D\u4EE3\u8868\u5DF2\u63D0\u4F9B\u7ED9\u6A21\u578B\u3002"))
  ));
}
function MultiFilter({ label, options, value, onChange }) {
  const choices = [...options, ...value.filter((v) => !options.some(([id]) => id === v)).map((v) => [v, v])];
  return (0, import_react.createElement)("details", { className: "dmm-filter" }, (0, import_react.createElement)("summary", null, `${label} \xB7 ${value.length ? `\u5DF2\u9009 ${value.length}` : "\u4E0D\u9650"}`), (0, import_react.createElement)("fieldset", null, (0, import_react.createElement)("legend", null, label), (0, import_react.createElement)("button", { type: "button", disabled: !value.length, onClick: () => onChange([]) }, "\u6E05\u7A7A\u9009\u62E9\uFF08\u4E0D\u9650\uFF09"), !choices.length && (0, import_react.createElement)("p", null, "\u5F53\u524D\u8303\u56F4\u6682\u65E0\u53EF\u9009\u9879"), ...choices.map(([id, text]) => (0, import_react.createElement)("label", { key: id }, (0, import_react.createElement)("input", { type: "checkbox", checked: value.includes(id), onChange: (e) => {
    const checked = e.target.checked;
    onChange((current) => checked ? [...current, id] : current.filter((v) => v !== id));
  } }), text))));
}
function configFailure(error) {
  const reasons = { ENOENT: "\u672A\u627E\u5230\u672C\u5730\u7BA1\u7406\u914D\u7F6E\u6587\u4EF6\u3002", EACCES: "\u6CA1\u6709\u8BFB\u53D6\u672C\u5730\u7BA1\u7406\u914D\u7F6E\u6587\u4EF6\u7684\u6743\u9650\u3002", REVISION_CONFLICT: "\u914D\u7F6E\u7248\u672C\u51B2\u7A81\u3002", INVALID_CONFIG: "\u914D\u7F6E\u683C\u5F0F\u6216\u5185\u5BB9\u6821\u9A8C\u5931\u8D25\u3002" };
  return (reasons[error.code] ?? "\u8BFB\u53D6\u6216\u6821\u9A8C\u914D\u7F6E\u5931\u8D25\u3002") + (error.message ?? "");
}
function Panel(props) {
  return (0, import_react.createElement)(ScopedPanel, { ...props, key: props.sessionId ?? "global" });
}
function ScopedPanel({ sessionId, onClose }) {
  const [data, setData] = (0, import_react.useState)(null), [error, setError] = (0, import_react.useState)(""), [turn, setTurn] = (0, import_react.useState)([]), [kind, setKind] = (0, import_react.useState)([]), [status, setStatus] = (0, import_react.useState)([]), [source, setSource] = (0, import_react.useState)([]), [version, setVersion] = (0, import_react.useState)(0), [notice, setNotice] = (0, import_react.useState)(""), [reloadError, setReloadError] = (0, import_react.useState)(null), [reloading, setReloading] = (0, import_react.useState)(false);
  const lifecycle = (0, import_react.useRef)(null);
  (0, import_react.useEffect)(() => {
    const ctrl = new AbortController();
    lifecycle.current = ctrl;
    return () => ctrl.abort();
  }, []);
  (0, import_react.useEffect)(() => {
    const ctrl = new AbortController();
    let timer;
    async function load() {
      try {
        const q = new URLSearchParams(sessionId ? { sessionId } : {});
        for (const [key, values] of Object.entries({ adapterId: source, ...sessionId ? { turn, turnKind: kind, status } : {} })) for (const value of values) q.append(key, value);
        const result = await api("/query?" + q, void 0, ctrl.signal);
        if (!ctrl.signal.aborted) {
          setData(result);
          setError("");
        }
      } catch (e) {
        if (!ctrl.signal.aborted) setError(e.message);
      }
      if (!ctrl.signal.aborted) timer = setTimeout(load, 2500);
    }
    load();
    return () => {
      ctrl.abort();
      clearTimeout(timer);
    };
  }, [sessionId, turn, kind, status, source, version]);
  const reload = async () => {
    setReloading(true);
    setNotice("");
    setReloadError(null);
    try {
      const result = await api("/reload", {}, lifecycle.current?.signal);
      if (lifecycle.current?.signal.aborted) return;
      setData((d) => d ? { ...d, configError: null, revision: result.revision } : d);
      setNotice(result.unchanged ? `\u914D\u7F6E\u5DF2\u662F\u6700\u65B0\uFF08\u7248\u672C ${result.revision}\uFF09\uFF0C\u65E0\u9700\u5207\u6362\u3002` : `\u5DF2\u8BFB\u53D6\u5E76\u542F\u7528\u672C\u5730\u7BA1\u7406\u914D\u7F6E\uFF0C\u5F53\u524D\u7248\u672C ${result.revision}\u3002`);
    } catch (e) {
      if (lifecycle.current?.signal.aborted) return;
      setReloadError(e);
    } finally {
      if (!lifecycle.current?.signal.aborted) {
        setReloading(false);
        setVersion((v) => v + 1);
      }
    }
  };
  const configurationError = reloadError ?? data?.configError;
  return (0, import_react.createElement)(
    "section",
    { className: "dmm", "aria-label": sessionId ? "\u4F1A\u8BDD\u8BB0\u5FC6\u7BA1\u7406" : "\u5168\u5C40\u8BB0\u5FC6\u7BA1\u7406" },
    onClose && (0, import_react.createElement)("button", { className: "dmm-close", onClick: onClose, "aria-label": "\u5173\u95ED\u8BB0\u5FC6\u7BA1\u7406" }, "\xD7"),
    (0, import_react.createElement)("h2", null, "\u8BB0\u5FC6\u7BA1\u7406"),
    (0, import_react.createElement)("p", null, sessionId ? "\u5F53\u524D\u4F1A\u8BDD \xB7 \u8D44\u6E90\u4F7F\u7528\u4E0E\u5E94\u7528\u8BC1\u636E" : "\u5168\u5C40\u8D44\u6E90 \xB7 \u7EDF\u4E00\u67E5\u770B\u3001\u914D\u7F6E\u4E0E\u6765\u6E90\u7F16\u8F91"),
    (0, import_react.createElement)("div", { className: "dmm-toolbar" }, sessionId && (0, import_react.createElement)(MultiFilter, { label: "\u8F6E\u6B21", options: (data?.facets?.turns ?? []).map((t) => [t, `\u7B2C ${t} \u8F6E`]), value: turn, onChange: setTurn }), sessionId && (0, import_react.createElement)(MultiFilter, { label: "\u8F6E\u6B21\u6765\u6E90", options: [["human", "\u4EBA\u7C7B\u8F93\u5165"], ["task", "\u4EFB\u52A1\u4E0A\u4E0B\u6587"], ["system", "\u7CFB\u7EDF"], ["unknown", "\u672A\u786E\u8BA4"]], value: kind, onChange: setKind }), sessionId && (0, import_react.createElement)(MultiFilter, { label: "\u89E6\u53D1\u72B6\u6001", options: Object.entries(labels), value: status, onChange: setStatus }), (0, import_react.createElement)(MultiFilter, { label: "\u8D44\u6E90\u63D0\u4F9B\u65B9", options: (data?.adapters ?? []).map((a) => [a.id, a.name ?? a.id]), value: source, onChange: setSource }), (0, import_react.createElement)("button", { onClick: reload, disabled: reloading }, reloading ? "\u6B63\u5728\u8BFB\u53D6\u2026" : "\u91CD\u65B0\u8BFB\u53D6\u7BA1\u7406\u914D\u7F6E")),
    (0, import_react.createElement)("p", { className: "dmm-meta" }, "\u7B5B\u9009\u53EF\u591A\u9009\uFF1A\u540C\u4E00\u9879\u5185\u6EE1\u8DB3\u4EFB\u4E00\u9009\u9879\uFF0C\u4E0D\u540C\u9879\u9700\u540C\u65F6\u6EE1\u8DB3\uFF1B\u4E0D\u9009\u8868\u793A\u4E0D\u9650\u3002\u8D44\u6E90\u63D0\u4F9B\u65B9\u8868\u793A\u63A5\u5165\u6765\u6E90\uFF0C\u4E0E\u914D\u7F6E\u9884\u8BBE\uFF08preset\uFF09\u65E0\u5173\u3002"),
    (0, import_react.createElement)("p", { className: "dmm-meta" }, "\u91CD\u65B0\u8BFB\u53D6\uFF1A\u8BFB\u53D6\u670D\u52A1\u7AEF\u78C1\u76D8\u4E0A\u5DF2\u4FDD\u5B58\u7684\u7BA1\u7406\u89C4\u5219\u4E0E\u9884\u8BBE\u3002\u5185\u5BB9\u672A\u53D8\u65F6\u4FDD\u6301\u5F53\u524D\u7248\u672C\uFF1B\u6B64\u64CD\u4F5C\u4E0D\u4F1A\u91CD\u65B0\u52A0\u8F7D\u4F1A\u8BDD\u6216\u8D44\u6E90\u5185\u5BB9\u3002"),
    notice && (0, import_react.createElement)("p", { role: "status" }, notice),
    error && (0, import_react.createElement)("div", { className: "dmm-error", role: "alert" }, error),
    configurationError && (0, import_react.createElement)("div", { className: "dmm-error", role: "alert" }, `\u914D\u7F6E\u672A\u5207\u6362\uFF1B\u6CBF\u7528\u7248\u672C ${data?.revision ?? "\u5F85\u786E\u8BA4"}\u3002${configFailure(configurationError)}`),
    ...(data?.diagnostics ?? []).map((d, i) => (0, import_react.createElement)("p", { key: i, role: "status" }, `${d.adapterId ?? ""}: ${d.message}`)),
    data && (0, import_react.createElement)("details", { className: "dmm-catalogs", open: !data.rows.length }, (0, import_react.createElement)("summary", null, `\u67E5\u8BE2\u8303\u56F4\uFF1A${sessionId ? "\u5F53\u524D\u4F1A\u8BDD" : "\u5168\u5C40"} \xB7 \u5DF2\u63A5\u5165 ${data.adapters.length} \u4E2A\u8D44\u6E90\u63D0\u4F9B\u65B9`), ...(data.catalogs ?? []).map((c) => (0, import_react.createElement)("p", { key: c.adapterId }, `${data.adapters.find((a) => a.id === c.adapterId)?.name ?? c.adapterId}\uFF1A${c.count === null ? "\u8BFB\u53D6\u5931\u8D25" : `\u8FD4\u56DE ${c.count} \u9879`}\u3002${c.description ?? ""}`))),
    !data ? (0, import_react.createElement)("p", null, "\u6B63\u5728\u8BFB\u53D6\u6765\u6E90\u2026") : !data.rows.length ? (0, import_react.createElement)("div", { className: "dmm-empty" }, "\u5F53\u524D\u8303\u56F4\u548C\u7B5B\u9009\u6761\u4EF6\u4E0B\u6CA1\u6709\u53EF\u89C1\u8D44\u6E90\u3002\u8BF7\u67E5\u770B\u4E0A\u65B9\u67E5\u8BE2\u8303\u56F4\u4E0E\u63D0\u4F9B\u65B9\u8FD4\u56DE\u7ED3\u679C\u3002") : data.rows.map((row) => (0, import_react.createElement)(Resource, { key: row.adapterId + row.id, row, sessionId, onChange: () => setVersion((v) => v + 1) }))
  );
}
function Header({ sessionId }) {
  const [open, setOpen] = (0, import_react.useState)(false);
  (0, import_react.useEffect)(() => setOpen(false), [sessionId]);
  return (0, import_react.createElement)("div", null, (0, import_react.createElement)("button", { onClick: () => setOpen(!open), "aria-label": "\u8BB0\u5FC6\u7BA1\u7406", "aria-expanded": open }, "\u8BB0\u5FC6"), open && (0, import_react.createElement)("div", { className: "dmm-overlay", role: "dialog", "aria-label": "\u4F1A\u8BDD\u8BB0\u5FC6\u7BA1\u7406" }, (0, import_react.createElement)(Panel, { key: sessionId, sessionId, onClose: () => setOpen(false) })));
}
function apply(ctx) {
  ctx.effect(() => {
    const style = document.createElement("style");
    style.textContent = css;
    document.head.append(style);
    return () => style.remove();
  });
  ctx.slots.inject("settings.section", () => ctx.slots.register({ name: "settings.section", id: "dsh-memory-manager", label: "\u8BB0\u5FC6\u7BA1\u7406", order: 70 }, Panel));
  ctx.slots.inject("conversation.session.header.actions", () => ctx.slots.register({ name: "conversation.session.header.actions", id: "dsh-memory-manager", order: 70 }, Header));
}

return module.exports;}});
