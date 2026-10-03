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
var import_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");

// src/client-style.js
var css = `
.dmm{font:13px/1.55 var(--dsw-font-family,system-ui);color:var(--dsw-alias-label-primary,#ddd);padding:20px;min-width:0;box-sizing:border-box}
.dmm *{box-sizing:border-box}.dmm h2{font-size:20px;margin:0}.dmm h3{font-size:15px;margin:0 0 12px}.dmm p{margin:6px 0 14px}.dmm .dmm-muted{color:var(--dsw-alias-label-secondary,#888)}
.dmm button,.dmm input,.dmm select,.dmm textarea{font:inherit;border:1px solid var(--dsw-alias-border-l2,#444);border-radius:7px;color:inherit;background:var(--dsw-alias-bg-base,#202125);padding:7px 10px}.dmm button{cursor:pointer}.dmm button:disabled{cursor:default;opacity:.55}.dmm button:focus-visible,.dmm input:focus-visible,.dmm textarea:focus-visible,.dmm select:focus-visible{outline:2px solid #679eaf;outline-offset:2px}
.dmm .dmm-primary{background:#456f66;color:white;border-color:#456f66}.dmm .dmm-link{border:0;background:transparent;padding:4px 0;color:var(--dsw-alias-label-primary,#ddd);text-align:left}.dmm input,.dmm textarea,.dmm select{max-width:100%}.dmm textarea{width:100%;min-height:90px;resize:vertical;font:12px/1.6 monospace}.dmm input:not([type=checkbox]),.dmm select{width:100%}.dmm input[readonly]{background:var(--dsw-alias-bg-l1,#8881)}.dmm input[type=checkbox]{width:17px;height:17px;flex-shrink:0;accent-color:#456f66}
.dmm-heading,.dmm-toolbar,.dmm-actions,.dmm-title-line,.dmm-page-top{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.dmm-heading{justify-content:space-between;margin-bottom:6px}.dmm-toolbar{justify-content:space-between;margin:16px 0 12px}.dmm-actions{gap:6px}.dmm-page-top{justify-content:space-between;margin-bottom:18px}.dmm-close{margin-left:auto}.dmm .dmm-help{display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;width:28px;height:28px;padding:0;border:0;background:transparent;color:var(--dsw-alias-label-secondary,#888);font-size:17px}.dmm-badge{font-size:11px;display:inline-block;padding:1px 7px;border-radius:12px;background:#6c9c8b22;color:inherit;margin-left:6px}
.dmm-table-wrap{width:100%;overflow:auto;border:1px solid var(--dsw-alias-border-l2,#444);border-radius:10px}.dmm table{width:100%;border-collapse:collapse;table-layout:fixed;min-width:560px}.dmm th{text-align:left;font-size:11px;font-weight:500;color:var(--dsw-alias-label-secondary,#888);padding:11px 9px;background:var(--dsw-alias-bg-l1,#8881)}.dmm td{vertical-align:top;padding:13px 9px;border-top:1px solid var(--dsw-alias-border-l2,#444);font-size:12px;overflow-wrap:anywhere}.dmm th:first-child{width:26%}.dmm th:nth-child(2){width:13%}.dmm th:nth-child(3){width:12%}.dmm th:last-child{width:13%}.dmm-resource-name{font-weight:600}.dmm-id{display:block;margin-top:4px;font:10px/1.45 monospace;color:var(--dsw-alias-label-secondary,#888);overflow-wrap:anywhere}.dmm-summary{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.55}.dmm-detail-link{white-space:normal}.dmm-table-caption{font-size:11px;margin-top:8px;color:var(--dsw-alias-label-secondary,#888)}
.dmm-card{border:1px solid var(--dsw-alias-border-l2,#444);border-radius:10px;padding:16px;margin:14px 0}.dmm-grid{display:grid;align-items:start;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.dmm-field{min-width:0}.dmm-field>label,.dmm-field-label{display:block;font-weight:600;margin-bottom:6px}.dmm-field small{display:block;font-size:11px;color:var(--dsw-alias-label-secondary,#888);margin:4px 0;overflow-wrap:anywhere}.dmm-field pre,.dmm-effective{white-space:pre-wrap;overflow-wrap:anywhere;font:11px/1.6 monospace;margin:6px 0 0;max-height:170px;overflow:auto;background:var(--dsw-alias-bg-l1,#8881);border-radius:6px;padding:8px}.dmm-effective{border-left:2px solid #679eaf}.dmm-field-wide{grid-column:1/-1}.dmm-code-editor{min-height:210px!important}.dmm-origin{font-size:10px;font-weight:400;color:var(--dsw-alias-label-secondary,#888);display:block;margin-top:3px}.dmm-section-head{display:flex;gap:8px;align-items:center;margin-bottom:12px}.dmm-section-head h3{margin:0}.dmm-unconfigured{border-left:3px solid #8b929b;padding:8px 12px;background:#8881}.dmm-status{padding:9px 12px;background:#6c9c8b16;border:1px solid #6c9c8b55;border-radius:7px;margin:10px 0;overflow-wrap:anywhere}.dmm-error{padding:10px 12px;border:1px solid #b45a5a;border-radius:7px;background:#9c363615;color:var(--dsw-alias-label-danger,#bc6666);margin:10px 0;white-space:pre-wrap;overflow-wrap:anywhere}.dmm-diagnostic{padding:8px 0;border-top:1px solid var(--dsw-alias-border-l2,#444);font-size:12px;overflow-wrap:anywhere}.dmm-diagnostic[data-level=error]{color:#bc6666}.dmm-diagnostic small{display:block;color:var(--dsw-alias-label-secondary,#888)}.dmm-diagnostics{margin-top:12px}.dmm pre{white-space:pre-wrap;overflow-wrap:anywhere;max-height:300px;overflow:auto}
.dmm-filter-card{border:1px solid var(--dsw-alias-border-l2,#444);border-radius:10px;padding:14px;min-width:0}.dmm-filter-card h3{display:flex;align-items:center;gap:5px;margin-bottom:8px}.dmm-options{max-height:180px;overflow:auto;margin-top:8px}.dmm-option{display:flex;align-items:flex-start;gap:7px;padding:6px 0;overflow-wrap:anywhere}.dmm-option span{min-width:0}.dmm-filter-add{display:flex;gap:6px;margin-top:8px}.dmm-filter-add input{min-width:0}.dmm-filter-add button{white-space:nowrap;flex-shrink:0}.dmm-tags{display:flex;gap:5px;flex-wrap:wrap;margin:8px 0}.dmm-tags button{max-width:100%;font-size:11px;overflow-wrap:anywhere;text-align:left}.dmm-empty{padding:26px;text-align:center;color:var(--dsw-alias-label-secondary,#888)}.dmm-catalogs{font-size:11px;margin:12px 0}.dmm-catalogs summary,.dmm-advanced summary{cursor:pointer}.dmm-catalogs p{margin:5px 0}.dmm-advanced{margin:14px 0}.dmm-advanced textarea{margin-top:10px}.dmm-sticky-actions{position:sticky;bottom:0;padding:12px 0 4px;background:var(--dsw-alias-bg-base,#202125);border-top:1px solid var(--dsw-alias-border-l2,#444);margin-top:18px}.dmm-source-content{margin-top:20px}.dmm-overlay{position:fixed;inset:65px 16px 20px auto;width:min(790px,calc(100vw - 32px));z-index:1000;overflow:auto;border:1px solid var(--dsw-alias-border-l2,#444);border-radius:12px;background:var(--dsw-alias-bg-base,#202125);box-shadow:0 15px 55px #0007}
@media(min-width:601px){[data-shortcut-modal="settings"]:has([data-slot="settings.section"]>.dmm){width:min(1100px,calc(100vw - 40px));max-width:1100px}}
@media(max-width:600px){[data-shortcut-modal="settings"]:has([data-slot="settings.section"]>.dmm){flex-direction:column}[data-shortcut-modal="settings"]:has([data-slot="settings.section"]>.dmm)>nav{width:auto;flex-basis:auto;flex-shrink:0;padding:12px;max-height:170px;overflow:auto}[data-shortcut-modal="settings"]:has([data-slot="settings.section"]>.dmm)>nav>div:last-child{display:flex;flex-direction:row;flex-wrap:wrap;gap:4px}[data-shortcut-modal="settings"]:has([data-slot="settings.section"]>.dmm)>nav button{width:auto;flex:0 0 auto}.dmm{padding:12px}.dmm-grid{grid-template-columns:1fr}.dmm-card{padding:12px}.dmm-toolbar{align-items:flex-start}.dmm table{min-width:610px}.dmm-page-top{gap:6px}.dmm-heading h2{font-size:19px}.dmm-sticky-actions .dmm-actions{gap:5px}.dmm-sticky-actions button{flex:1 1 auto}}
`;

// src/client-form.js
var fieldLabels = { id: "\u8D44\u6E90 ID", type: "\u7C7B\u578B", preset: "\u9884\u8BBE", whitelist: "\u767D\u540D\u5355", blacklist: "\u9ED1\u540D\u5355", "store.on": "\u5B58\u50A8 \xB7 \u65F6\u673A on", "store.rule": "\u5B58\u50A8 \xB7 \u6761\u4EF6 rule", "store.strategy": "\u5B58\u50A8 \xB7 \u7B56\u7565 strategy", "retrieve.on": "\u8BFB\u53D6 \xB7 \u65F6\u673A on", "retrieve.rule": "\u8BFB\u53D6 \xB7 \u6761\u4EF6 rule", "retrieve.strategy": "\u8BFB\u53D6 \xB7 \u7B56\u7565 strategy" };
var fields = Object.keys(fieldLabels).filter((k) => k !== "id");
var jsonFields = fields.filter((k) => !["type", "preset"].includes(k));
var stringify = (value) => value === void 0 ? "" : JSON.stringify(value, null, 2);
var at = (object, path) => path.split(".").reduce((v, key) => v?.[key], object);
function formFrom(local) {
  const form = { __presetPresent: Object.hasOwn(local ?? {}, "preset"), __storePresent: Object.hasOwn(local ?? {}, "store"), __retrievePresent: Object.hasOwn(local ?? {}, "retrieve") };
  for (const field of fields) form[field] = ["type", "preset"].includes(field) ? at(local, field) ?? "" : stringify(at(local, field));
  return form;
}
function entryFrom(form, row) {
  const entry = { id: row.id, adapterId: row.adapterId };
  for (const mode of ["store", "retrieve"]) if (form["__" + mode + "Present"]) entry[mode] = {};
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
function importEntry(raw, row) {
  const entry = JSON.parse(raw);
  if (!entry || typeof entry !== "object" || Array.isArray(entry) || entry.id !== row.id || entry.adapterId !== row.adapterId) throw Error("JSON \u5FC5\u987B\u4FDD\u7559\u672C\u8D44\u6E90 ID \u548C\u63D0\u4F9B\u65B9\u3002");
  if (Object.keys(entry).some((k) => !["id", "adapterId", "type", "preset", "whitelist", "blacklist", "store", "retrieve"].includes(k))) throw Error("JSON \u542B\u4E0D\u652F\u6301\u7684\u9876\u5C42\u5B57\u6BB5\u3002");
  if ("type" in entry && (typeof entry.type !== "string" || !entry.type)) throw Error("type \u5FC5\u987B\u662F\u975E\u7A7A\u6587\u672C\u3002");
  if ("preset" in entry && entry.preset !== null && (typeof entry.preset !== "string" || !entry.preset)) throw Error("preset \u5FC5\u987B\u662F\u975E\u7A7A\u6587\u672C\u6216 null\u3002");
  for (const mode of ["store", "retrieve"]) if (mode in entry) {
    const value = entry[mode];
    if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).some((k) => !["on", "rule", "strategy"].includes(k))) throw Error(`${mode} \u5FC5\u987B\u662F\u4EC5\u542B on\u3001rule\u3001strategy \u7684\u5BF9\u8C61\u3002`);
  }
  return formFrom(entry);
}
function fieldOrigin(config, origins, field) {
  return at(config, field) === void 0 ? void 0 : origins[field];
}

// src/client.js
var name = "dsh-memory-manager";
var inject = ["slots"];
var root = "/api/dsh-memory-manager";
async function api(path, body, signal) {
  const r = await fetch(root + path, { signal, headers: body ? { "Content-Type": "application/json", "X-DSH-Memory-Manager": "1" } : void 0, method: body ? "POST" : "GET", body: body ? JSON.stringify(body) : void 0 });
  const data = await r.json();
  if (!r.ok) throw Object.assign(Error(data.error?.message ?? "\u8BF7\u6C42\u5931\u8D25"), data.error);
  return data;
}
var labels = { never: "\u672A\u89E6\u53D1", past: "\u66FE\u89E6\u53D1", running: "\u6B63\u5728\u89E6\u53D1" };
var stringify2 = (value) => value === void 0 ? "" : JSON.stringify(value, null, 2);
var at2 = (object, path) => path.split(".").reduce((v, key) => v?.[key], object);
var shown = (value) => value === void 0 ? "\u672A\u914D\u7F6E" : value === null ? "\u672A\u5F15\u7528" : typeof value === "string" ? value : JSON.stringify(value);
function HelpInfo({ label, text }) {
  return (0, import_react.createElement)(import_dsh_client_ui_primitives.Tooltip, { label: text, side: "bottom", portal: true, maxWidth: 340, openOnClick: true }, (0, import_react.createElement)("button", { type: "button", className: "dmm-help", "aria-label": label }, "\u24D8"));
}
function ErrorBox({ error }) {
  return error && (0, import_react.createElement)("div", { className: "dmm-error", role: "alert" }, error.message ?? error, ...(error.diagnostics ?? []).map((d, i) => (0, import_react.createElement)("div", { key: i }, `${d.field ?? ""}\uFF1A${d.message}`)));
}
function configFailure(error) {
  return ({ ENOENT: "\u672A\u627E\u5230\u672C\u5730\u7BA1\u7406\u914D\u7F6E\u6587\u4EF6\u3002", EACCES: "\u6CA1\u6709\u8BFB\u53D6\u914D\u7F6E\u6587\u4EF6\u7684\u6743\u9650\u3002", REVISION_CONFLICT: "\u914D\u7F6E\u7248\u672C\u51B2\u7A81\u3002", INVALID_CONFIG: "\u914D\u7F6E\u683C\u5F0F\u6216\u5185\u5BB9\u6821\u9A8C\u5931\u8D25\u3002" }[error.code] ?? "\u8BFB\u53D6\u6216\u6821\u9A8C\u914D\u7F6E\u5931\u8D25\u3002") + (error.message ?? "");
}
function summary(behavior) {
  if (!behavior) return "\u672A\u914D\u7F6E";
  const on = behavior.on === void 0 ? "\u65F6\u673A\u672A\u914D\u7F6E" : Array.isArray(behavior.on) ? behavior.on.join(" / ") : behavior.on;
  const strategy = behavior.strategy === void 0 ? "\u7B56\u7565\u672A\u914D\u7F6E" : typeof behavior.strategy === "string" ? behavior.strategy : behavior.strategy.map((s) => s.operation).join(" \u2192 ");
  return `${on} \xB7 ${strategy}`;
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
  (0, import_react.useEffect)(() => {
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
function Table({ data, onDetail }) {
  return (0, import_react.createElement)("div", null, (0, import_react.createElement)("div", { className: "dmm-table-wrap", tabIndex: 0, "aria-label": "\u8BB0\u5FC6\u8D44\u6E90\u8868\u683C\uFF0C\u53EF\u6A2A\u5411\u6EDA\u52A8" }, (0, import_react.createElement)("table", null, (0, import_react.createElement)("thead", null, (0, import_react.createElement)("tr", null, ...["\u8D44\u6E90\u540D\u79F0 / ID", "\u7C7B\u578B", "\u9884\u8BBE", "\u5B58\u50A8", "\u8BFB\u53D6", "\u7BA1\u7406\u914D\u7F6E"].map((t) => (0, import_react.createElement)("th", { key: t, scope: "col" }, t)))), (0, import_react.createElement)("tbody", null, ...data.rows.map((row) => (0, import_react.createElement)("tr", { key: JSON.stringify([row.adapterId, row.id]) }, (0, import_react.createElement)("td", null, (0, import_react.createElement)("div", { className: "dmm-resource-name" }, row.name ?? row.id), (0, import_react.createElement)("code", { className: "dmm-id" }, row.id), row.missing && (0, import_react.createElement)("span", { className: "dmm-badge" }, "\u6765\u6E90\u4E0D\u53EF\u7528")), (0, import_react.createElement)("td", null, row.config?.type ?? row.type ?? "\u4E0D\u53EF\u5224\u5B9A", !row.config?.type && (0, import_react.createElement)("small", { className: "dmm-id" }, row.type === void 0 ? "\u7C7B\u578B\u672A\u786E\u8BA4" : "\u6765\u6E90\u5143\u6570\u636E")), (0, import_react.createElement)("td", null, row.config ? row.config.preset ?? "\u672A\u5F15\u7528" : "\u672A\u914D\u7F6E"), (0, import_react.createElement)("td", null, (0, import_react.createElement)("span", { className: "dmm-summary", title: summary(row.config?.store) }, summary(row.config?.store))), (0, import_react.createElement)("td", null, (0, import_react.createElement)("span", { className: "dmm-summary", title: summary(row.config?.retrieve) }, summary(row.config?.retrieve))), (0, import_react.createElement)("td", null, (0, import_react.createElement)("button", { className: "dmm-link dmm-detail-link", onClick: () => onDetail(row), "aria-label": `\u7BA1\u7406\u914D\u7F6E\uFF1A${row.name ?? row.id}` }, "\u7BA1\u7406\u914D\u7F6E \u2192"))))))), (0, import_react.createElement)("p", { className: "dmm-table-caption" }, "\u8868\u683C\u663E\u793A\u751F\u6548\u914D\u7F6E\u3002\u7A84\u5C4F\u53EF\u6A2A\u5411\u6EDA\u52A8\u67E5\u770B\u6240\u6709\u5217\u3002"));
}
function ChoiceFilter({ label, options, value, onChange }) {
  const choices = [...options, ...value.filter((v) => !options.some(([id]) => id === v)).map((v) => [v, v])];
  return (0, import_react.createElement)("section", { className: "dmm-filter-card" }, (0, import_react.createElement)("h3", null, label, value.length ? (0, import_react.createElement)("span", { className: "dmm-badge" }, value.length) : null), (0, import_react.createElement)("button", { className: "dmm-link", disabled: !value.length, onClick: () => onChange([]) }, "\u6E05\u7A7A\uFF08\u4E0D\u9650\uFF09"), (0, import_react.createElement)("div", { className: "dmm-options" }, !choices.length ? (0, import_react.createElement)("p", { className: "dmm-muted" }, "\u5F53\u524D\u8303\u56F4\u6682\u65E0\u53EF\u9009\u9879") : choices.map(([id, text]) => (0, import_react.createElement)("label", { className: "dmm-option", key: id }, (0, import_react.createElement)("input", { type: "checkbox", checked: value.includes(id), onChange: (e) => {
    const checked = e.target.checked;
    onChange((v) => checked ? [...v, id] : v.filter((x) => x !== id));
  } }), (0, import_react.createElement)("span", null, text)))));
}
function FieldFilter({ field, filter = { mode: "exact", values: [], missing: false }, options = [], onChange }) {
  const [term, setTerm] = (0, import_react.useState)(""), label = fieldLabels[field];
  const values = [.../* @__PURE__ */ new Set([...options, ...filter.values])];
  const change = (patch) => onChange({ ...filter, ...patch });
  return (0, import_react.createElement)("section", { className: "dmm-filter-card" }, (0, import_react.createElement)("h3", null, label, (0, import_react.createElement)(HelpInfo, { label: `${label}\u7B5B\u9009\u8BF4\u660E`, text: field.includes("rule") || field.includes("strategy") || ["whitelist", "blacklist"].includes(field) ? "\u5339\u914D\u751F\u6548\u914D\u7F6E\u7684\u89C4\u8303 JSON \u6587\u672C\uFF08\u5BF9\u8C61\u952E\u6309\u540D\u79F0\u6392\u5E8F\uFF09\uFF0C\u652F\u6301\u7CBE\u786E\u5339\u914D\u6216\u533A\u5206\u5927\u5C0F\u5199\u7684\u6587\u672C\u5305\u542B\uFF1B\u4E0D\u6267\u884C\u6761\u4EF6\u3001\u7B56\u7565\u6216\u540D\u5355\u9002\u7528\u6027\u5224\u65AD\u3002" : "\u5339\u914D\u8868\u683C\u4E0E\u8BE6\u60C5\u663E\u793A\u7684\u751F\u6548\u503C\u3002\u7CBE\u786E\u5339\u914D\u6216\u533A\u5206\u5927\u5C0F\u5199\u7684\u6587\u672C\u5305\u542B\uFF1B\u591A\u4E2A\u9009\u62E9\u6EE1\u8DB3\u4EFB\u4E00\u5373\u53EF\u3002" })), (0, import_react.createElement)("select", { "aria-label": `${label}\u5339\u914D\u65B9\u5F0F`, value: filter.mode, onChange: (e) => change({ mode: e.target.value }) }, (0, import_react.createElement)("option", { value: "exact" }, "\u7CBE\u786E\u5339\u914D"), (0, import_react.createElement)("option", { value: "contains" }, "\u6587\u672C\u5305\u542B")), (0, import_react.createElement)("div", { className: "dmm-filter-add" }, (0, import_react.createElement)("input", { "aria-label": `${label}\u7B5B\u9009\u6587\u672C`, value: term, placeholder: "\u6DFB\u52A0\u5339\u914D\u503C", onChange: (e) => setTerm(e.target.value), onKeyDown: (e) => {
    if (e.key === "Enter" && term) {
      e.preventDefault();
      change({ values: [.../* @__PURE__ */ new Set([...filter.values, term])] });
      setTerm("");
    }
  } }), (0, import_react.createElement)("button", { disabled: !term, onClick: () => {
    change({ values: [.../* @__PURE__ */ new Set([...filter.values, term])] });
    setTerm("");
  } }, "\u6DFB\u52A0")), (0, import_react.createElement)("label", { className: "dmm-option" }, (0, import_react.createElement)("input", { type: "checkbox", checked: !!filter.missing, onChange: (e) => change({ missing: e.target.checked }) }), (0, import_react.createElement)("span", null, field === "preset" ? "\u5305\u62EC\u672A\u5F15\u7528 / \u672A\u914D\u7F6E" : field === "type" ? "\u5305\u62EC\u672A\u914D\u7F6E / \u4E0D\u53EF\u5224\u5B9A" : "\u5305\u62EC\u672A\u914D\u7F6E")), (0, import_react.createElement)("div", { className: "dmm-options" }, ...values.map((value) => (0, import_react.createElement)("label", { key: value, className: "dmm-option" }, (0, import_react.createElement)("input", { type: "checkbox", checked: filter.values.includes(value), onChange: (e) => change({ values: e.target.checked ? [...filter.values, value] : filter.values.filter((v) => v !== value) }) }), (0, import_react.createElement)("span", null, value)))), (0, import_react.createElement)("button", { className: "dmm-link", disabled: !filter.values.length && !filter.missing, onClick: () => change({ values: [], missing: false }) }, "\u6E05\u7A7A\u6B64\u5B57\u6BB5"));
}
function FiltersPage({ data, sessionId, filters, setFilters, onBack }) {
  const update = (key, value) => setFilters((previous) => ({ ...previous, [key]: typeof value === "function" ? value(previous[key] ?? []) : value }));
  const fieldUpdate = (key, value) => setFilters((previous) => ({ ...previous, fields: { ...previous.fields, [key]: value } }));
  const providerOptions = [...(data?.adapters ?? []).map((a) => [a.id, a.name ?? a.id]), ...(data?.rows ?? []).filter((r) => !data.adapters.some((a) => a.id === r.adapterId)).map((r) => [r.adapterId, `${r.adapterId}\uFF08\u6765\u6E90\u4E0D\u53EF\u7528\uFF09`])].filter((v, i, a) => a.findIndex((x) => x[0] === v[0]) === i);
  return (0, import_react.createElement)("div", { "data-page": "filters" }, (0, import_react.createElement)("div", { className: "dmm-page-top" }, (0, import_react.createElement)("button", { className: "dmm-link", onClick: onBack }, "\u2190 \u8FD4\u56DE\u8D44\u6E90\u8868\u683C"), (0, import_react.createElement)("button", { onClick: () => setFilters(emptyFilters()) }, "\u6E05\u7A7A\u5168\u90E8")), (0, import_react.createElement)("div", { className: "dmm-title-line" }, (0, import_react.createElement)("h2", null, "\u7B5B\u9009\u8D44\u6E90"), (0, import_react.createElement)(HelpInfo, { label: "\u7B5B\u9009\u89C4\u5219\u8BF4\u660E", text: "\u6309\u751F\u6548\u914D\u7F6E\u7B5B\u9009\uFF08\u542B preset \u8986\u76D6\uFF09\uFF0C\u540C\u5B57\u6BB5\u5185 OR\u3001\u8DE8\u5B57\u6BB5 AND\u3001\u4E0D\u9009\u5373\u4E0D\u9650\u3002\u8FD9\u91CC\u7684\u7B5B\u9009\u4E0D\u4FEE\u6539\u914D\u7F6E\u6216\u6267\u884C\u89C4\u5219\u3002\u6765\u6E90\u4E0D\u53EF\u7528\u65F6\u4F1A\u663E\u793A\u72B6\u6001\uFF1B\u65E0\u6CD5\u83B7\u77E5\u7684\u8D44\u6E90\u5143\u6570\u636E\u4E0D\u4F2A\u88C5\u6210\u5DF2\u914D\u7F6E\u503C\u3002" })), (0, import_react.createElement)("p", { className: "dmm-muted" }, sessionId ? "\u5F53\u524D\u4F1A\u8BDD \xB7 \u914D\u7F6E\u5B57\u6BB5\u4E0E\u5E94\u7528\u8BB0\u5F55" : "\u5168\u5C40 \xB7 \u914D\u7F6E\u5B57\u6BB5"), (0, import_react.createElement)("div", { className: "dmm-grid" }, (0, import_react.createElement)(ChoiceFilter, { label: "\u8D44\u6E90\u63D0\u4F9B\u65B9", options: providerOptions, value: filters.adapterId, onChange: (v) => update("adapterId", v) }), sessionId && (0, import_react.createElement)(ChoiceFilter, { label: "\u8F6E\u6B21", options: (data?.facets?.turns ?? []).map((v) => [v, `\u7B2C ${v} \u8F6E`]), value: filters.turn, onChange: (v) => update("turn", v) }), sessionId && (0, import_react.createElement)(ChoiceFilter, { label: "\u8F6E\u6B21\u6765\u6E90", options: [["human", "\u4EBA\u7C7B\u8F93\u5165"], ["task", "\u4EFB\u52A1\u4E0A\u4E0B\u6587"], ["system", "\u7CFB\u7EDF"], ["unknown", "\u672A\u786E\u8BA4"]], value: filters.turnKind, onChange: (v) => update("turnKind", v) }), sessionId && (0, import_react.createElement)(ChoiceFilter, { label: "\u89E6\u53D1\u72B6\u6001", options: Object.entries(labels), value: filters.status, onChange: (v) => update("status", v) }), ...Object.keys(fieldLabels).map((field) => (0, import_react.createElement)(FieldFilter, { key: field, field, options: data?.facets?.fields?.[field] ?? [], filter: filters.fields[field], onChange: (v) => fieldUpdate(field, v) }))), (0, import_react.createElement)("div", { className: "dmm-sticky-actions" }, (0, import_react.createElement)("button", { className: "dmm-primary", onClick: onBack }, "\u67E5\u770B\u7B5B\u9009\u7ED3\u679C")));
}
function emptyFilters() {
  return { adapterId: [], turn: [], turnKind: [], status: [], fields: {} };
}
function filterCount(filters, sessionId) {
  return filters.adapterId.length > 0 ? 1 + other() : other();
  function other() {
    return (sessionId ? ["turn", "turnKind", "status"].filter((k) => filters[k].length).length : 0) + Object.values(filters.fields).filter((f) => f.values.length || f.missing).length;
  }
}
function originLabel(origin) {
  return origin === "default" ? "\u9ED8\u8BA4\u503C" : origin?.startsWith("preset:") ? "\u9884\u8BBE " + origin.slice(7) : origin === "local" ? "\u672C\u5730\u914D\u7F6E" : "\u672A\u914D\u7F6E";
}
function Diagnostics({ report }) {
  return report && (0, import_react.createElement)("section", { className: "dmm-card dmm-diagnostics", "aria-label": "\u914D\u7F6E\u6821\u9A8C\u7ED3\u679C" }, (0, import_react.createElement)("h3", null, report.valid ? "\u9759\u6001\u6821\u9A8C\u901A\u8FC7" : "\u914D\u7F6E\u6821\u9A8C\u672A\u901A\u8FC7"), ...report.diagnostics.map((d, i) => (0, import_react.createElement)("div", { className: "dmm-diagnostic", key: i, "data-level": d.level }, (0, import_react.createElement)("strong", null, ({ error: "\u9519\u8BEF", unknown: "\u672A\u9A8C\u8BC1", info: "\u4FE1\u606F" }[d.level] ?? d.level) + " \xB7 " + d.field), (0, import_react.createElement)("div", null, d.message), (0, import_react.createElement)("small", null, d.code))));
}
function ContentEditor({ row, sessionId, onChange, onDirty }) {
  const [record, setRecord] = (0, import_react.useState)(null), [text, setText] = (0, import_react.useState)(""), [saved, setSaved] = (0, import_react.useState)(""), [error, setError] = (0, import_react.useState)(null), [busy, setBusy] = (0, import_react.useState)(false), [notice, setNotice] = (0, import_react.useState)("");
  const ctrl = (0, import_react.useRef)(null);
  (0, import_react.useEffect)(() => {
    const c = new AbortController();
    ctrl.current = c;
    return () => c.abort();
  }, []);
  const dirty = text !== saved;
  (0, import_react.useEffect)(() => onDirty(dirty), [dirty, onDirty]);
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
      if (operation === "management") Object.assign(request, { expectedRevision: record.revision, operationId: crypto.randomUUID(), mode: row.managed ? "native" : "managed" });
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
        setNotice(operation === "update" ? "\u8D44\u6E90\u5185\u5BB9\u5DF2\u4FDD\u5B58\u3002" : "\u7BA1\u7406\u6743\u5DF2\u7531\u6765\u6E90\u66F4\u65B0\u3002");
      }
      onChange();
    } catch (e) {
      if (e.name !== "AbortError") setError(e);
    } finally {
      setBusy(false);
    }
  };
  return (0, import_react.createElement)("section", { className: "dmm-card dmm-source-content" }, (0, import_react.createElement)("div", { className: "dmm-section-head" }, (0, import_react.createElement)("h3", null, "\u8D44\u6E90\u5185\u5BB9 content"), (0, import_react.createElement)(HelpInfo, { label: "\u8D44\u6E90\u5185\u5BB9\u8BF4\u660E", text: "\u5185\u5BB9\u7531\u8D44\u6E90\u63D0\u4F9B\u65B9\u8BFB\u5199\uFF0C\u4E0E\u4E0A\u65B9\u7BA1\u7406\u914D\u7F6E\u5206\u5F00\u4FDD\u5B58\u3002\u4FDD\u5B58\u7BA1\u7406\u914D\u7F6E\u4E0D\u4F1A\u81EA\u52A8\u59D4\u6258\u7BA1\u7406\uFF1B\u5185\u5BB9\u7F16\u8F91\u548C\u7BA1\u7406\u6743\u53D8\u66F4\u4ECD\u7531\u6765\u6E90\u6821\u9A8C\u6743\u9650\u4E0E\u7248\u672C\u3002" })), (0, import_react.createElement)("p", { className: "dmm-muted" }, `${row.missing ? "\u6765\u6E90\u4E0D\u53EF\u7528\uFF0C\u5F53\u524D\u80FD\u529B\u4E0D\u53EF\u5224\u5B9A" : row.managed ? "\u5DF2\u59D4\u6258\u8BB0\u5FC6\u7BA1\u7406" : "\u6765\u6E90\u539F\u751F\u7BA1\u7406"} \xB7 ${row.adapterId}`), (0, import_react.createElement)("div", { className: "dmm-actions" }, (0, import_react.createElement)("button", { onClick: () => {
    if (!dirty || window.confirm("\u91CD\u65B0\u8BFB\u53D6\u4F1A\u4E22\u5F03\u672A\u4FDD\u5B58\u7684\u5185\u5BB9\uFF0C\u662F\u5426\u7EE7\u7EED\uFF1F")) load();
  }, disabled: busy || row.missing }, record ? "\u91CD\u65B0\u8BFB\u53D6\u5185\u5BB9" : "\u67E5\u770B\u8D44\u6E90\u5185\u5BB9"), row.capabilities.copy && (0, import_react.createElement)("button", { disabled: busy || row.missing, onClick: () => mutate("copy") }, "\u590D\u5236\u8D44\u6E90\u4E3A\u65B0 ID")), record && (0, import_react.createElement)("div", null, (0, import_react.createElement)("p", { className: "dmm-muted" }, `\u8D44\u6E90\u7248\u672C ${record.revision ?? "\u6765\u6E90\u672A\u63D0\u4F9B"} \xB7 ${row.capabilities.edit ? "\u6765\u6E90\u5141\u8BB8\u7F16\u8F91" : "\u53EA\u8BFB\u5185\u5BB9"}`), row.capabilities.edit ? (0, import_react.createElement)("textarea", { disabled: busy, "aria-label": "\u8D44\u6E90\u5185\u5BB9", value: text, onChange: (e) => setText(e.target.value), className: "dmm-code-editor" }) : (0, import_react.createElement)("pre", null, text), (0, import_react.createElement)("div", { className: "dmm-actions" }, row.capabilities.edit && (0, import_react.createElement)("button", { disabled: busy || !dirty, onClick: () => mutate("update") }, "\u4FDD\u5B58\u8D44\u6E90\u5185\u5BB9"), row.capabilities.management && (0, import_react.createElement)("button", { disabled: busy, onClick: () => mutate("management") }, row.managed ? "\u4EA4\u56DE\u6765\u6E90\u539F\u751F\u7BA1\u7406" : "\u59D4\u6258\u8BB0\u5FC6\u7BA1\u7406"))), (0, import_react.createElement)(ErrorBox, { error }), notice && (0, import_react.createElement)("p", { className: "dmm-status", role: "status" }, notice));
}
function DetailPage({ row, sessionId, liveRevision, onBack, onChange }) {
  const [snapshot, setSnapshot] = (0, import_react.useState)(null), [form, setForm] = (0, import_react.useState)(null), [baseline, setBaseline] = (0, import_react.useState)(""), [report, setReport] = (0, import_react.useState)(null), [error, setError] = (0, import_react.useState)(null), [busy, setBusy] = (0, import_react.useState)(false), [notice, setNotice] = (0, import_react.useState)(""), [raw, setRaw] = (0, import_react.useState)(""), [rawBaseline, setRawBaseline] = (0, import_react.useState)(""), [contentDirty, setContentDirty] = (0, import_react.useState)(false);
  const element = (0, import_react.useRef)(null), ctrl = (0, import_react.useRef)(null), prefix = (0, import_react.useId)();
  const dirty = !!form && (JSON.stringify(form) !== baseline || raw !== rawBaseline), anyDirty = dirty || contentDirty;
  useUnsaved(anyDirty, element);
  const install = (data) => {
    const next = formFrom(data.local);
    setSnapshot(data);
    setForm(next);
    setBaseline(JSON.stringify(next));
    setRaw("");
    setRawBaseline("");
    setReport(null);
    setError(null);
  };
  const load = async () => {
    setBusy(true);
    const q = new URLSearchParams({ id: row.id, adapterId: row.adapterId });
    try {
      install(await api("/configuration?" + q, void 0, ctrl.current.signal));
    } catch (e) {
      if (e.name !== "AbortError") setError(e);
    } finally {
      setBusy(false);
    }
  };
  (0, import_react.useEffect)(() => {
    const c = new AbortController();
    ctrl.current = c;
    load();
    return () => c.abort();
  }, []);
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
      if (raw !== rawBaseline) throw Error("\u5B8C\u6574 JSON \u5C1A\u672A\u8F7D\u5165\u8868\u5355\uFF0C\u8BF7\u5148\u8F7D\u5165\u6216\u653E\u5F03\u8BE5 JSON \u4FEE\u6539\u3002");
      const entry = entryFrom(form, row), args = { id: row.id, adapterId: row.adapterId, entry, expectedRevision: snapshot.revision };
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
  const composed = report?.effective ?? snapshot?.config, origins = report?.origins ?? snapshot?.origins ?? {};
  const renderField = (field) => {
    const id = prefix + "-" + field, value = at2(composed, field), origin = fieldOrigin(composed, origins, field);
    return (0, import_react.createElement)("div", { className: "dmm-field", key: field }, (0, import_react.createElement)("label", { htmlFor: id }, fieldLabels[field], (0, import_react.createElement)("span", { className: "dmm-origin" }, "\u672C\u5730\u503C \xB7 \u53EF\u7F16\u8F91")), ["type", "preset"].includes(field) ? (0, import_react.createElement)("input", { id, disabled: busy, value: form[field], placeholder: field === "preset" ? "\u672A\u5F15\u7528" : "\u672A\u914D\u7F6E", list: field === "preset" ? prefix + "-presets" : void 0, onChange: (e) => change(field, e.target.value) }) : (0, import_react.createElement)("textarea", { id, disabled: busy, "aria-label": `${fieldLabels[field]}\u672C\u5730\u914D\u7F6E`, value: form[field], placeholder: "\u672A\u914D\u7F6E\uFF08\u7559\u7A7A\u5373\u4E0D\u63D0\u4F9B\u6B64\u5B57\u6BB5\uFF09", onChange: (e) => change(field, e.target.value), rows: field.endsWith(".on") ? 2 : 4 }), (0, import_react.createElement)("small", null, `${report?.effective ? "\u8349\u7A3F\u5408\u6210\u9884\u89C8 \xB7 \u672A\u4FDD\u5B58" : "\u6253\u5F00\u65F6\u751F\u6548\u503C \xB7 \u7248\u672C " + snapshot.revision} \xB7 ${originLabel(origin)}`), (0, import_react.createElement)("pre", { className: "dmm-effective", "data-field": field }, shown(value)), origin?.startsWith("preset:") && (0, import_react.createElement)("small", null, "\u9884\u8BBE\u63D0\u4F9B\u7684\u503C\u4F18\u5148\uFF1B\u4FEE\u6539\u672C\u5730\u503C\u4E0D\u4F1A\u8986\u76D6\u8BE5\u9884\u8BBE\u3002"));
  };
  return (0, import_react.createElement)("div", { ref: element, "data-page": "detail" }, (0, import_react.createElement)("div", { className: "dmm-page-top" }, (0, import_react.createElement)("button", { className: "dmm-link", onClick: back }, "\u2190 \u8FD4\u56DE\u8D44\u6E90\u8868\u683C"), (0, import_react.createElement)("span", { className: "dmm-muted" }, dirty ? "\u6709\u672A\u4FDD\u5B58\u4FEE\u6539" : "\u7BA1\u7406\u914D\u7F6E")), (0, import_react.createElement)("h2", null, row.name ?? row.id), (0, import_react.createElement)("p", { className: "dmm-muted" }, "\u7BA1\u7406\u914D\u7F6E\u4E0E\u8D44\u6E90\u5185\u5BB9\u5206\u522B\u4FDD\u5B58"), (0, import_react.createElement)(ErrorBox, { error }), !snapshot ? (0, import_react.createElement)("p", null, "\u6B63\u5728\u8BFB\u53D6\u7BA1\u7406\u914D\u7F6E\u2026") : (0, import_react.createElement)("div", null, !snapshot.local && (0, import_react.createElement)("p", { className: "dmm-unconfigured" }, "\u6B64\u8D44\u6E90\u5C1A\u672A\u914D\u7F6E\u7BA1\u7406\u89C4\u5219\u3002\u4EE5\u4E0B\u5B57\u6BB5\u5747\u53EF\u586B\u5199\uFF1B\u672A\u914D\u7F6E\u4E0D\u4EE3\u8868\u5DF2\u505C\u7528\u6765\u6E90\u539F\u751F\u884C\u4E3A\u3002"), snapshot.revision !== liveRevision && (0, import_react.createElement)("div", { className: "dmm-error", role: "alert" }, `\u5F53\u524D\u914D\u7F6E\u5DF2\u53D8\u5316\uFF08\u6253\u5F00\u65F6 ${snapshot.revision}\uFF0C\u5F53\u524D ${liveRevision}\uFF09\u3002\u8349\u7A3F\u4FDD\u7559\uFF1B\u8BF7\u91CD\u65B0\u8F7D\u5165\u540E\u5408\u5E76\u4FEE\u6539\u3002`, (0, import_react.createElement)("button", { disabled: busy, onClick: () => {
    if (!dirty || window.confirm("\u91CD\u65B0\u8F7D\u5165\u4F1A\u4E22\u5F03\u7BA1\u7406\u914D\u7F6E\u8349\u7A3F\uFF0C\u662F\u5426\u7EE7\u7EED\uFF1F")) load();
  } }, "\u91CD\u65B0\u8F7D\u5165\u914D\u7F6E")), (0, import_react.createElement)("section", { className: "dmm-card" }, (0, import_react.createElement)("h3", null, "\u8D44\u6E90\u8EAB\u4EFD"), (0, import_react.createElement)("div", { className: "dmm-grid" }, (0, import_react.createElement)("div", { className: "dmm-field" }, (0, import_react.createElement)("label", null, "\u8D44\u6E90 ID \xB7 \u53EA\u8BFB"), (0, import_react.createElement)("input", { "aria-label": "\u8D44\u6E90 ID", readOnly: true, value: row.id }), (0, import_react.createElement)("small", null, "\u540C\u4E00\u4E2A ID \u662F\u540C\u4E00\u4EFD\u5185\u5BB9\uFF1B\u9700\u8981\u72EC\u7ACB\u5185\u5BB9\u8BF7\u590D\u5236\u8D44\u6E90\u3002")), (0, import_react.createElement)("div", { className: "dmm-field" }, (0, import_react.createElement)("label", null, "\u8D44\u6E90\u63D0\u4F9B\u65B9 \xB7 \u53EA\u8BFB"), (0, import_react.createElement)("input", { "aria-label": "\u8D44\u6E90\u63D0\u4F9B\u65B9", readOnly: true, value: row.adapterId }), (0, import_react.createElement)("small", null, `${row.missing ? "\u6765\u6E90\u4E0D\u53EF\u7528\uFF0C\u5F53\u524D\u80FD\u529B\u4E0D\u53EF\u5224\u5B9A" : "\u6765\u6E90\u5DF2\u63A5\u5165"} \xB7 \u6765\u6E90\u7C7B\u578B\uFF1A${row.type ?? "\u4E0D\u53EF\u5224\u5B9A"}`)))), (0, import_react.createElement)("section", { className: "dmm-card" }, (0, import_react.createElement)("div", { className: "dmm-section-head" }, (0, import_react.createElement)("h3", null, "\u7C7B\u578B\u4E0E\u9884\u8BBE"), (0, import_react.createElement)(HelpInfo, { label: "\u672C\u5730\u4E0E\u9884\u8BBE\u8BF4\u660E", text: "\u672C\u5730\u5B57\u6BB5\u53EF\u81EA\u7531\u7EC4\u5408\uFF0C\u518D\u7531\u6765\u6E90\u6821\u9A8C\u3002\u9884\u8BBE\u660E\u786E\u63D0\u4F9B\u7684\u5B57\u6BB5\u8986\u76D6\u672C\u5730\u503C\uFF1B\u4FDD\u5B58\u53EA\u5199\u672C\u5730\u6761\u76EE\uFF0C\u4E0D\u4FEE\u6539\u9884\u8BBE\u5B9A\u4E49\uFF0C\u4E5F\u4E0D\u5C06\u751F\u6548\u503C\u53CD\u5199\u6210\u672C\u5730\u503C\u3002preset \u5F15\u7528\u672C\u8EAB\u6765\u81EA\u672C\u5730\uFF0C\u4E0D\u7EE7\u627F\u81EA\u8EAB\u3002" })), (0, import_react.createElement)("datalist", { id: prefix + "-presets" }, ...Object.keys(snapshot.presets).map((p) => (0, import_react.createElement)("option", { key: p, value: p }))), (0, import_react.createElement)("div", { className: "dmm-grid" }, renderField("type"), renderField("preset"))), (0, import_react.createElement)("section", { className: "dmm-card" }, (0, import_react.createElement)("div", { className: "dmm-section-head" }, (0, import_react.createElement)("h3", null, "\u9002\u7528\u8303\u56F4"), (0, import_react.createElement)(HelpInfo, { label: "\u540D\u5355\u914D\u7F6E\u8BF4\u660E", text: '\u540D\u5355\u4F7F\u7528 JSON \u6570\u7EC4\u3002\u767D\u540D\u5355\u547D\u4E2D\u4EFB\u4E00\u9879\u4E14\u672A\u547D\u4E2D\u9ED1\u540D\u5355\u624D\u9002\u7528\uFF1B\u767D\u540D\u5355\u4E3A\u7A7A\u65F6\u4E0D\u9002\u7528\u4EFB\u4F55\u8303\u56F4\u3002\u4F8B\uFF1A[{"global":true}] \u6216 [{"sessionId":"\u4F1A\u8BDD ID"}]\u3002\u7A7A\u767D\u8868\u793A\u672A\u63D0\u4F9B\u672C\u5730\u5B57\u6BB5\uFF0C[] \u8868\u793A\u660E\u786E\u7A7A\u6570\u7EC4\u3002' })), (0, import_react.createElement)("div", { className: "dmm-grid" }, renderField("whitelist"), renderField("blacklist"))), ...["store", "retrieve"].map((mode) => (0, import_react.createElement)("section", { className: "dmm-card", key: mode }, (0, import_react.createElement)("div", { className: "dmm-section-head" }, (0, import_react.createElement)("h3", null, mode === "store" ? "\u5B58\u50A8 store" : "\u8BFB\u53D6 retrieve"), (0, import_react.createElement)(HelpInfo, { label: mode + "\u914D\u7F6E\u8BF4\u660E", text: "on\u3001rule\u3001strategy \u4F7F\u7528 JSON\u3002on \u662F\u5B57\u7B26\u4E32\u6216\u6570\u7EC4\uFF0Crule \u662F\u5E03\u5C14\u503C\u3001\u6CE8\u518C\u6761\u4EF6\u540D\u6216\u89C4\u5219\u6811\uFF0Cstrategy \u662F\u6CE8\u518C\u64CD\u4F5C\u540D\u6216\u64CD\u4F5C\u6570\u7EC4\u3002\u53EF\u81EA\u7531\u586B\u5199\u540E\u6821\u9A8C\uFF1B\u6821\u9A8C\u4E0D\u6267\u884C\u4E8B\u4EF6\u3001\u6761\u4EF6\u6216\u64CD\u4F5C\u3002\u7A7A\u767D\u8868\u793A\u672A\u63D0\u4F9B\u6B64\u672C\u5730\u5B57\u6BB5\u3002" })), (0, import_react.createElement)("div", { className: "dmm-grid" }, ...["on", "rule", "strategy"].map((part) => renderField(mode + "." + part))))), (0, import_react.createElement)("details", { className: "dmm-advanced", onToggle: (e) => {
    if (e.currentTarget.open && !raw) try {
      const text = stringify2(entryFrom(form, row));
      setRaw(text);
      setRawBaseline(text);
    } catch (err) {
      setError(err);
    }
  } }, (0, import_react.createElement)("summary", null, "\u5B8C\u6574\u672C\u5730\u914D\u7F6E JSON"), (0, import_react.createElement)("textarea", { disabled: busy, "aria-label": "\u5B8C\u6574\u672C\u5730\u914D\u7F6E JSON", className: "dmm-code-editor", value: raw, onChange: (e) => setRaw(e.target.value) }), (0, import_react.createElement)("div", { className: "dmm-actions" }, (0, import_react.createElement)("button", { disabled: busy, onClick: () => {
    try {
      setForm(importEntry(raw, row));
      setRawBaseline(raw);
      setReport(null);
      setError(null);
    } catch (e) {
      setError(e);
    }
  } }, "\u8F7D\u5165\u8868\u5355"), (0, import_react.createElement)("button", { disabled: busy || raw === rawBaseline, onClick: () => setRaw(rawBaseline) }, "\u653E\u5F03 JSON \u4FEE\u6539"))), (0, import_react.createElement)(Diagnostics, { report }), notice && (0, import_react.createElement)("div", { className: "dmm-status", role: "status" }, notice), (0, import_react.createElement)("div", { className: "dmm-sticky-actions" }, (0, import_react.createElement)("div", { className: "dmm-actions" }, (0, import_react.createElement)("button", { disabled: busy, onClick: () => submit(false) }, busy ? "\u6B63\u5728\u5904\u7406\u2026" : "\u6821\u9A8C\u914D\u7F6E"), (0, import_react.createElement)("button", { className: "dmm-primary", disabled: busy || !dirty, onClick: () => submit(true) }, "\u4FDD\u5B58\u7BA1\u7406\u914D\u7F6E"), (0, import_react.createElement)(HelpInfo, { label: "\u4FDD\u5B58\u7BA1\u7406\u914D\u7F6E\u8BF4\u660E", text: "\u4FDD\u5B58\u4F1A\u91CD\u65B0\u6821\u9A8C\u5E76\u68C0\u67E5\u914D\u7F6E\u7248\u672C\u548C\u78C1\u76D8\u53D8\u5316\uFF0C\u901A\u8FC7\u540E\u539F\u5B50\u5199\u5165\u65B0\u7248\u672C\u3002\u6821\u9A8C\u4E0D\u6388\u4E88\u8D44\u6E90\u6743\u9650\uFF1B\u4E0D\u652F\u6301\u6216\u672A\u6CE8\u518C\u7684\u80FD\u529B\u4F1A\u660E\u786E\u62A5\u9519\uFF0C\u65E0\u6CD5\u9759\u6001\u786E\u8BA4\u7684\u4E8B\u4EF6\u4E0A\u4E0B\u6587\u4E0E\u6743\u9650\u6807\u8BB0\u4E3A\u672A\u9A8C\u8BC1\u3002\u5931\u8D25\u4FDD\u7559\u6709\u6548\u914D\u7F6E\u548C\u672C\u9875\u8349\u7A3F\u3002" }))), (0, import_react.createElement)(ContentEditor, { row, sessionId, onChange, onDirty: setContentDirty }), sessionId && (0, import_react.createElement)("section", { className: "dmm-card" }, (0, import_react.createElement)("h3", null, "\u5E94\u7528\u8BB0\u5F55"), (0, import_react.createElement)("p", { className: "dmm-muted" }, `${labels[row.status]} \xB7 ${row.applied ? "\u6709\u5E94\u7528\u8BC1\u636E" : "\u65E0\u5E94\u7528\u8BC1\u636E"}`), row.facts.length ? (0, import_react.createElement)("pre", null, row.facts.map((f) => `${f.phase} \xB7 ${f.turnKind} ${f.turn ?? "\u2014"} \xB7 ${f.detail ?? f.reason ?? ""}`).join("\n")) : (0, import_react.createElement)("p", null, "\u5F53\u524D\u7B5B\u9009\u8303\u56F4\u6CA1\u6709\u6765\u6E90\u89E6\u53D1\u8BB0\u5F55\u3002"))));
}
function Panel(props) {
  return (0, import_react.createElement)(ScopedPanel, { ...props, key: JSON.stringify([props.sessionId ?? null]) });
}
function ScopedPanel({ sessionId, onClose }) {
  const [data, setData] = (0, import_react.useState)(null), [error, setError] = (0, import_react.useState)(null), [filters, setFilters] = (0, import_react.useState)(emptyFilters), [page, setPage] = (0, import_react.useState)("table"), [selected, setSelected] = (0, import_react.useState)(null), [version, setVersion] = (0, import_react.useState)(0), [notice, setNotice] = (0, import_react.useState)(""), [reloadError, setReloadError] = (0, import_react.useState)(null), [reloading, setReloading] = (0, import_react.useState)(false);
  const lifecycle = (0, import_react.useRef)(null), element = (0, import_react.useRef)(null), tableScroll = (0, import_react.useRef)([]), tableLeft = (0, import_react.useRef)(0), filterData = (0, import_react.useRef)(null);
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
        for (const [key, values] of Object.entries({ adapterId: filters.adapterId, ...sessionId ? { turn: filters.turn, turnKind: filters.turnKind, status: filters.status } : {} })) for (const value of values) q.append(key, value);
        q.set("filters", JSON.stringify(filters.fields));
        const result = await api("/query?" + q, void 0, ctrl.signal);
        if (!ctrl.signal.aborted) {
          setData(result);
          setError(null);
        }
      } catch (e) {
        if (!ctrl.signal.aborted) setError(e);
      }
      if (!ctrl.signal.aborted) timer = setTimeout(load, 2500);
    }
    load();
    return () => {
      ctrl.abort();
      clearTimeout(timer);
    };
  }, [sessionId, filters, version]);
  const reload = async () => {
    setReloading(true);
    setNotice("");
    setReloadError(null);
    try {
      const result = await api("/reload", {}, lifecycle.current.signal);
      if (lifecycle.current.signal.aborted) return;
      setData((d) => d ? { ...d, configError: null, revision: result.revision } : d);
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
  const navigate = (next, row) => {
    tableScroll.current = readScroll(element.current);
    tableLeft.current = element.current?.querySelector(".dmm-table-wrap")?.scrollLeft ?? 0;
    if (next === "filters") filterData.current = data;
    if (row) setSelected(row);
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
  const activeRow = data?.rows.find((r) => r.id === selected?.id && r.adapterId === selected?.adapterId) ?? selected;
  const configurationError = reloadError ?? data?.configError, count = filterCount(filters, sessionId);
  return (0, import_react.createElement)("section", { ref: element, className: "dmm", "aria-label": sessionId ? "\u4F1A\u8BDD\u8BB0\u5FC6\u7BA1\u7406" : "\u5168\u5C40\u8BB0\u5FC6\u7BA1\u7406" }, onClose && (0, import_react.createElement)("div", { className: "dmm-actions" }, (0, import_react.createElement)("button", { className: "dmm-close", onClick: onClose, "aria-label": "\u5173\u95ED\u8BB0\u5FC6\u7BA1\u7406" }, "\xD7")), page === "detail" ? (0, import_react.createElement)(DetailPage, { key: JSON.stringify([selected.adapterId, selected.id]), row: activeRow, sessionId, liveRevision: data?.revision, onBack: back, onChange: () => setVersion((v) => v + 1) }) : page === "filters" ? (0, import_react.createElement)(FiltersPage, { data: filterData.current, sessionId, filters, setFilters, onBack: back }) : (0, import_react.createElement)("div", { "data-page": "table" }, (0, import_react.createElement)("div", { className: "dmm-heading" }, (0, import_react.createElement)("h2", null, "\u8BB0\u5FC6\u7BA1\u7406"), (0, import_react.createElement)("span", { className: "dmm-muted" }, `${data?.rows.length ?? "\u2026"} \u9879\u8D44\u6E90`)), (0, import_react.createElement)("p", { className: "dmm-muted" }, sessionId ? "\u5F53\u524D\u4F1A\u8BDD \xB7 \u8D44\u6E90\u4E0E\u7BA1\u7406\u914D\u7F6E" : "\u5168\u5C40\u8D44\u6E90 \xB7 \u7BA1\u7406\u914D\u7F6E\u6982\u89C8"), (0, import_react.createElement)("div", { className: "dmm-toolbar" }, (0, import_react.createElement)("div", { className: "dmm-actions" }, (0, import_react.createElement)("button", { onClick: reload, disabled: reloading }, reloading ? "\u6B63\u5728\u8BFB\u53D6\u2026" : "\u91CD\u65B0\u8BFB\u53D6\u7BA1\u7406\u914D\u7F6E"), (0, import_react.createElement)(HelpInfo, { label: "\u91CD\u65B0\u8BFB\u53D6\u7BA1\u7406\u914D\u7F6E\u8BF4\u660E", text: "\u8BFB\u53D6\u670D\u52A1\u7AEF\u5DF2\u4FDD\u5B58\u7684\u7BA1\u7406\u89C4\u5219\u4E0E\u9884\u8BBE\u3002\u6587\u4EF6\u5185\u5BB9\u672A\u53D8\u65F6\u4FDD\u6301\u5F53\u524D\u7248\u672C\uFF1B\u6B64\u64CD\u4F5C\u4E0D\u91CD\u65B0\u52A0\u8F7D\u4F1A\u8BDD\u6216\u8D44\u6E90\u5185\u5BB9\u3002" })), (0, import_react.createElement)("button", { onClick: () => navigate("filters"), "aria-label": `\u7B5B\u9009\u8D44\u6E90\uFF0C${count} \u9879\u5DF2\u542F\u7528` }, "\u7B5B\u9009", count > 0 && (0, import_react.createElement)("span", { className: "dmm-badge" }, count))), notice && (0, import_react.createElement)("p", { className: "dmm-status", role: "status" }, notice), (0, import_react.createElement)(ErrorBox, { error }), configurationError && (0, import_react.createElement)(ErrorBox, { error: `\u914D\u7F6E\u672A\u5207\u6362\uFF1B\u6CBF\u7528\u7248\u672C ${data?.revision ?? "\u5F85\u786E\u8BA4"}\u3002${configFailure(configurationError)}` }), ...(data?.diagnostics ?? []).map((d, i) => (0, import_react.createElement)("p", { key: i, className: "dmm-error", role: "status" }, `${d.adapterId ?? ""}\uFF1A${d.message}`)), !data ? (0, import_react.createElement)("p", null, "\u6B63\u5728\u8BFB\u53D6\u6765\u6E90\u2026") : data.rows.length ? (0, import_react.createElement)(Table, { data, onDetail: (row) => navigate("detail", row) }) : (0, import_react.createElement)("div", { className: "dmm-empty" }, "\u5F53\u524D\u8303\u56F4\u548C\u7B5B\u9009\u6761\u4EF6\u4E0B\u6CA1\u6709\u53EF\u89C1\u8D44\u6E90\u3002"), data && (0, import_react.createElement)("details", { className: "dmm-catalogs", open: !data.rows.length }, (0, import_react.createElement)("summary", null, `\u67E5\u8BE2\u8303\u56F4\uFF1A${sessionId ? "\u5F53\u524D\u4F1A\u8BDD" : "\u5168\u5C40"} \xB7 \u5DF2\u63A5\u5165 ${data.adapters.length} \u4E2A\u8D44\u6E90\u63D0\u4F9B\u65B9`), ...(data.catalogs ?? []).map((c) => (0, import_react.createElement)("p", { key: c.adapterId }, `${sourceName(data, c.adapterId)}\uFF1A${c.count === null ? "\u8BFB\u53D6\u5931\u8D25" : `\u8FD4\u56DE ${c.count} \u9879`}\u3002${c.description ?? ""}`)))));
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
