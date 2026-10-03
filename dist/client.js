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
var import_react5 = require("react");

// src/client-session-entry.js
var import_react = require("react");
var import_react_dom = require("react-dom");
var import_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");

// src/session-entry.js
function currentSessionId(snapshot) {
  return Object.values(snapshot?.byId ?? {}).find((session) => (session.retainedBy?.mainView ?? 0) > 0)?.id ?? null;
}
function createSessionPanel() {
  let value = null;
  const listeners = /* @__PURE__ */ new Set(), publish = (next) => {
    if (value === next) return;
    value = next;
    for (const listener of listeners) listener();
  };
  return { getSnapshot: () => value, subscribe: (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, open: (sessionId, anchor) => publish({ sessionId, anchor }), close: () => publish(null) };
}
var intersects = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
function entryPlacement(anchor, header, controls, viewportWidth) {
  const inside = (rect) => rect.left >= Math.max(header.left, 0) && rect.right <= Math.min(header.right, viewportWidth) && rect.top >= header.top && rect.bottom <= header.bottom;
  if (inside(anchor) && !controls.some((rect) => intersects(anchor, rect))) return { mode: "normal" };
  const width = 28, height = 28, top = Math.max(header.top + 11, 0), left = Math.max(header.left + 8, 8), right = Math.min(header.right - 8, viewportWidth - 8);
  if (top + height > header.bottom || right - left < width) return { mode: "unavailable" };
  const blocks = controls.filter((rect) => rect.top < top + height + 4 && rect.bottom > top - 4).map((rect) => [Math.max(left, rect.left - 4), Math.min(right, rect.right + 4)]).filter(([a, b]) => a < b).sort((a, b) => a[0] - b[0]);
  const gaps = [];
  let cursor = left;
  for (const [a, b] of blocks) {
    if (a - cursor >= width) gaps.push([cursor, a]);
    cursor = Math.max(cursor, b);
  }
  if (right - cursor >= width) gaps.push([cursor, right]);
  if (!gaps.length) return { mode: "unavailable" };
  const candidates = gaps.map(([a, b]) => Math.max(a, Math.min(anchor.left, b - width))).sort((a, b) => Math.abs(a - anchor.left) - Math.abs(b - anchor.left));
  return { mode: "compact", left: candidates[0], top, width, height };
}

// src/client-session-entry.js
function visibleControlRects(anchor, control, header) {
  const viewport = { width: document.documentElement.clientWidth, height: document.documentElement.clientHeight };
  return [...document.querySelectorAll("button,a,[role=button],input,select")].flatMap((e) => {
    if (e === control || anchor.contains(e) || e.closest(".dmm-overlay,[role=tooltip]") || !e.getClientRects().length || getComputedStyle(e).visibility === "hidden") return [];
    const r = e.getBoundingClientRect();
    if (r.top >= header.top + 43 || r.bottom <= header.top + 7 || r.right <= 0 || r.left >= viewport.width) return [];
    const points = [[r.left + r.width / 2, r.top + r.height / 2], [r.left + 2, r.top + 2], [r.right - 2, r.top + 2], [r.left + 2, r.bottom - 2], [r.right - 2, r.bottom - 2]];
    return points.some(([x, y]) => x >= 0 && x < viewport.width && y >= 0 && y < viewport.height && document.elementsFromPoint(x, y).some((hit) => e.contains(hit))) ? [r] : [];
  });
}
function useEntryLayout(element, button, fallback) {
  const [layout, setLayout] = (0, import_react.useState)({ mode: "normal" }), size = (0, import_react.useRef)(null);
  (0, import_react.useLayoutEffect)(() => {
    const anchor = element.current, control = button.current, header = anchor?.closest("header");
    if (!anchor || !control || !fallback && !header) return;
    size.current = { width: parseFloat(getComputedStyle(anchor).width), height: parseFloat(getComputedStyle(anchor).height) };
    let frame = 0, settlingUntil = 0;
    const update = () => {
      frame = 0;
      const headerRect = fallback ? { left: 0, right: document.documentElement.clientWidth, top: 0, bottom: 50 } : header.getBoundingClientRect(), anchorRect = anchor.getBoundingClientRect();
      const controls = visibleControlRects(anchor, control, headerRect);
      let placement = entryPlacement(anchorRect, headerRect, controls, document.documentElement.clientWidth);
      for (let attempt = 0; attempt < 6 && placement.mode !== "unavailable"; attempt++) {
        const r = placement.mode === "compact" ? { left: placement.left, top: placement.top, width: placement.width, height: placement.height } : anchorRect;
        const points = [[r.left + r.width / 2, r.top + r.height / 2], [r.left + 1, r.top + 1], [r.left + r.width - 1, r.top + 1], [r.left + 1, r.top + r.height - 1], [r.left + r.width - 1, r.top + r.height - 1]];
        const hit = points.map(([x, y]) => document.elementsFromPoint(x, y).find((node) => !anchor.contains(node))).find((node) => {
          if (!node || node.contains(anchor) || node.closest(".dmm-overlay,[role=tooltip]")) return false;
          return !(fallback && node.closest('[data-slot="conversation.header"]') && !node.closest("button,a,[role=button],input,select"));
        });
        if (!hit) break;
        const obstacle = hit.getBoundingClientRect();
        if (!obstacle.width || !obstacle.height) {
          placement = { mode: "unavailable" };
          break;
        }
        controls.push(obstacle);
        placement = entryPlacement(anchorRect, headerRect, controls, document.documentElement.clientWidth);
        if (attempt === 5) placement = { mode: "unavailable" };
      }
      const zoom = Math.round(anchorRect.width / parseFloat(getComputedStyle(anchor).width) * 1e6) / 1e6 || 1;
      const next = placement.mode === "compact" ? { ...placement, zoom } : placement;
      setLayout((previous) => JSON.stringify(previous) === JSON.stringify(next) ? previous : next);
      if (performance.now() < settlingUntil) schedule();
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const settling = () => {
      settlingUntil = performance.now() + 750;
      schedule();
    };
    update();
    const resize = new ResizeObserver(schedule);
    resize.observe(header ?? document.documentElement);
    const observer = new MutationObserver(schedule);
    observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["style", "class", "hidden", "dir", "data-open", "data-state", "aria-expanded", "aria-hidden", "open"] });
    window.addEventListener("resize", schedule);
    const starts = ["transitionrun", "animationstart"], ends = ["transitionend", "transitioncancel", "animationend", "animationcancel"];
    for (const event of starts) document.addEventListener(event, settling, true);
    for (const event of ends) document.addEventListener(event, schedule, true);
    return () => {
      resize.disconnect();
      observer.disconnect();
      window.removeEventListener("resize", schedule);
      for (const event of starts) document.removeEventListener(event, settling, true);
      for (const event of ends) document.removeEventListener(event, schedule, true);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [fallback]);
  return { layout, size: size.current };
}
var memoryIcon = () => (0, import_react.createElement)("svg", { width: 16, height: 16, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", "aria-hidden": true }, (0, import_react.createElement)("rect", { x: 3, y: 2, width: 10, height: 12, rx: 1.5 }), (0, import_react.createElement)("path", { d: "M5.5 6h5M5.5 9h5" }));
function createSessionEntries(Panel2) {
  const panel = createSessionPanel();
  function Header2({ sessionId, fallback = false }) {
    const owner = (0, import_react.useSyncExternalStore)(panel.subscribe, panel.getSnapshot, panel.getSnapshot), open = owner?.sessionId === sessionId;
    const element = (0, import_react.useRef)(null), button = (0, import_react.useRef)(null), { layout, size } = useEntryLayout(element, button, fallback);
    const compact = layout.mode === "compact", label = layout.mode === "unavailable" ? "\u8BB0\u5FC6\u7BA1\u7406\uFF1B\u9876\u680F\u7A7A\u95F4\u4E0D\u8DB3\u6216\u88AB\u8986\u76D6\uFF0C\u8BF7\u5173\u95ED\u5F39\u51FA\u83DC\u5355\u3001\u6536\u8D77\u4FA7\u680F\u6216\u6269\u5927\u7A97\u53E3\u3002" : "\u8BB0\u5FC6\u7BA1\u7406";
    const toggle = () => {
      if (open) panel.close();
      else panel.open(sessionId, button.current);
    };
    return (0, import_react.createElement)("div", { ref: element, className: fallback ? "dmm-session-entry" : "dmm-header-entry", style: fallback && layout.mode === "unavailable" ? { visibility: "hidden" } : compact ? size : void 0 }, (0, import_react.createElement)(import_dsh_client_ui_primitives.Tooltip, { label, side: "bottom", portal: true, maxWidth: 260, disabled: open || layout.mode === "normal" }, (0, import_react.createElement)("button", { ref: button, type: "button", className: compact ? "dmm-entry-compact" : void 0, style: compact ? { position: "fixed", left: layout.left / layout.zoom, top: layout.top / layout.zoom, width: layout.width / layout.zoom, height: layout.height / layout.zoom } : void 0, "data-dmm-layout": layout.mode, "data-dmm-session-entry": sessionId, "data-dmm-native-entry": fallback ? void 0 : sessionId, onClick: toggle, "aria-label": "\u8BB0\u5FC6\u7BA1\u7406", "aria-expanded": open, "aria-haspopup": "dialog" }, compact ? memoryIcon() : "\u8BB0\u5FC6")));
  }
  function SessionEntry2({ useSessions }) {
    const sessionId = useSessions(currentSessionId), [visibility, setVisibility] = (0, import_react.useState)({ native: true, conversation: false });
    const owner = (0, import_react.useSyncExternalStore)(panel.subscribe, panel.getSnapshot, panel.getSnapshot);
    const close = () => {
      const previous = panel.getSnapshot();
      panel.close();
      const visible = (e) => e?.isConnected && e.getClientRects().length > 0 && getComputedStyle(e).visibility !== "hidden";
      const target = visible(previous?.anchor) ? previous.anchor : [...document.querySelectorAll("[data-dmm-session-entry]")].find((e) => e.dataset.dmmSessionEntry === sessionId && visible(e));
      target?.focus();
    };
    (0, import_react.useLayoutEffect)(() => {
      if (owner && (owner.sessionId !== sessionId || !visibility.conversation)) panel.close();
    }, [sessionId, visibility.conversation, owner]);
    (0, import_react.useEffect)(() => () => panel.close(), []);
    (0, import_react.useEffect)(() => {
      if (!owner) return;
      const key = (e) => {
        if (e.key === "Escape" && !document.querySelector("[role=tooltip]")) {
          e.preventDefault();
          close();
        }
      };
      document.addEventListener("keydown", key);
      return () => document.removeEventListener("keydown", key);
    }, [owner, sessionId]);
    (0, import_react.useLayoutEffect)(() => {
      if (!sessionId) return;
      const update = () => {
        const native = [...document.querySelectorAll("[data-dmm-native-entry]")].some((button) => button.dataset.dmmNativeEntry === sessionId && button.getClientRects().length > 0 && getComputedStyle(button).visibility !== "hidden");
        const conversation = [...document.querySelectorAll('[data-slot="main.conversation"]')].some((slot) => [...slot.children].some((e) => e.getBoundingClientRect().width > 0 && e.getBoundingClientRect().height > 0 && getComputedStyle(e).visibility !== "hidden"));
        setVisibility((previous) => previous.native === native && previous.conversation === conversation ? previous : { native, conversation });
      };
      update();
      const observer = new MutationObserver(update);
      observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["style", "class", "hidden", "data-dmm-native-entry"] });
      window.addEventListener("resize", update);
      return () => {
        observer.disconnect();
        window.removeEventListener("resize", update);
      };
    }, [sessionId]);
    const active = owner?.sessionId === sessionId && visibility.conversation;
    return (0, import_react.createElement)("div", { style: { display: "contents" } }, sessionId && visibility.conversation && !visibility.native ? (0, import_react.createElement)(Header2, { key: sessionId, sessionId, fallback: true }) : null, active && (0, import_react_dom.createPortal)((0, import_react.createElement)("div", { className: "dmm-overlay", role: "dialog", "aria-label": "\u4F1A\u8BDD\u8BB0\u5FC6\u7BA1\u7406" }, (0, import_react.createElement)(Panel2, { key: sessionId, sessionId, onClose: close })), document.body));
  }
  return { Header: Header2, SessionEntry: SessionEntry2 };
}

// src/client.js
var import_dsh_client_ui_primitives2 = require("@deepseek-ai/dsh-client-ui-primitives");

// src/client-adapters.js
var import_react2 = require("react");
function AdaptersPage({ onBack, onChange }) {
  const [data, setData] = (0, import_react2.useState)(null), [error, setError] = (0, import_react2.useState)(null), [busy, setBusy] = (0, import_react2.useState)(false);
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
  (0, import_react2.useEffect)(() => {
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
  return (0, import_react2.createElement)("div", { "data-page": "adapters" }, (0, import_react2.createElement)("div", { className: "dmm-page-top dmm-page-nav" }, (0, import_react2.createElement)("button", { className: "dmm-link", onClick: onBack }, "\u2190 \u8FD4\u56DE\u8D44\u6E90\u8868\u683C")), (0, import_react2.createElement)("h2", null, "Adapter"), (0, import_react2.createElement)("p", { className: "dmm-muted" }, "\u5F00\u5173\u7ACB\u5373\u5F71\u54CD\u5F53\u524D manager \u7684\u76EE\u5F55\u548C\u89C4\u5219\u8DEF\u7531\u3002\u89C4\u5219\u6587\u4EF6\u4E0E\u6B63\u6587\u5747\u4FDD\u7559\uFF1B\u91CD\u542F\u540E\u6062\u590D\u5DF2\u5B89\u88C5\u63D2\u4EF6\u7684\u9ED8\u8BA4\u542F\u7528\u72B6\u6001\u3002\u5378\u8F7D\u7531 Host \u7BA1\u7406\u3002"), error && (0, import_react2.createElement)("div", { className: "dmm-error", role: "alert" }, error), !data ? (0, import_react2.createElement)("p", null, "\u6B63\u5728\u8BFB\u53D6\u5DF2\u5B89\u88C5 adapter\u2026") : (0, import_react2.createElement)("div", null, ...[["\u8D44\u6E90\u4E0E\u89C4\u5219 adapter", data.adapters, "resource"], ["\u4F5C\u7528\u57DF\u76EE\u5F55 adapter", data.directories, "directory"]].map(([label, rows, kind]) => (0, import_react2.createElement)("section", { className: "dmm-card", key: kind }, (0, import_react2.createElement)("h3", null, label), ...rows.map((a) => (0, import_react2.createElement)("section", { className: "dmm-filter-card", key: a.id }, (0, import_react2.createElement)("div", { className: "dmm-section-head" }, (0, import_react2.createElement)("strong", null, a.label), a.installed !== false && (0, import_react2.createElement)("label", { className: "dmm-option" }, (0, import_react2.createElement)("input", { type: "checkbox", "aria-label": "\u542F\u7528 " + a.id, checked: a.enabled, disabled: busy, onChange: (e) => toggle(a.id, e.target.checked, kind) }), "\u542F\u7528")), (0, import_react2.createElement)("code", null, a.id), (0, import_react2.createElement)("p", { className: "dmm-muted" }, a.description ?? a.authority ?? (a.installed ? "\u6765\u6E90\u5DF2\u5B89\u88C5" : "\u672A\u5B89\u88C5")), a.installed === false && (0, import_react2.createElement)("p", null, a.installation), a.documentation && (0, import_react2.createElement)("a", { href: a.documentation, target: "_blank", rel: "noreferrer" }, "\u5B89\u88C5\u4E0E\u5951\u7EA6\u6587\u6863 \u2197"))))), (0, import_react2.createElement)("p", { className: "dmm-unconfigured" }, "\u6CA1\u6709\u76EE\u5F55 adapter \u65F6\u53EF\u67E5\u770B\u5DF2\u6709\u7A33\u5B9A ID \u914D\u7F6E\uFF1B\u9009\u62E9\u65B0\u5B9E\u4F53\u9700\u5B89\u88C5\u6765\u6E90\u652F\u6301\u7684\u76EE\u5F55\u63A5\u53E3\u3002")));
}

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
function effectiveDraftType(form, presets = []) {
  const preset = presets.find((p) => p.id === form.preset)?.configuration;
  return preset && Object.hasOwn(preset, "type") ? preset.type : form.type || void 0;
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
  if (value === void 0) return "\u672A\u914D\u7F6E";
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
  return (0, import_react4.createElement)("div", { className: "dmm-rule-node" }, (0, import_react4.createElement)("select", { "aria-label": `\u6761\u4EF6\u7EC4\u5408 ${depth + 1}`, value: kind, onChange: (e) => setKind(e.target.value) }, ...Object.entries({ unset: "\u672A\u914D\u7F6E", true: "\u59CB\u7EC8\u6EE1\u8DB3", false: "\u59CB\u7EC8\u4E0D\u6EE1\u8DB3", condition: "\u6CE8\u518C\u6761\u4EF6", all: "\u5168\u90E8\u6EE1\u8DB3 AND", any: "\u4EFB\u4E00\u6EE1\u8DB3 OR", not: "\u4E0D\u6EE1\u8DB3 NOT", at_least: "\u81F3\u5C11\u6EE1\u8DB3\u82E5\u5E72\u9879" }).map(([id, label]) => (0, import_react4.createElement)("option", { key: id, value: id }, label))), kind === "condition" && (0, import_react4.createElement)("div", null, (0, import_react4.createElement)("select", { "aria-label": "\u6CE8\u518C\u6761\u4EF6", value: conditionId ?? "", onChange: (e) => {
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
  const kinds = catalog.scopeKinds ?? {}, set = (i, next) => onChange(value.map((s, j) => i === j ? next : s));
  return (0, import_react4.createElement)("div", null, ...value.map((selector, i) => (0, import_react4.createElement)("section", { className: "dmm-card", key: i }, (0, import_react4.createElement)("h3", null, `\u8303\u56F4 ${i + 1}\uFF08\u672C\u9879\u5185\u540C\u65F6\u6EE1\u8DB3\uFF09`), ...Object.entries(selector).map(([key, v]) => (0, import_react4.createElement)("div", { className: "dmm-scope-row", key }, (0, import_react4.createElement)("select", { "aria-label": "\u8303\u56F4\u6761\u4EF6\u7C7B\u578B", value: key, onChange: (e) => {
    const next = { ...selector };
    delete next[key];
    next[e.target.value] = e.target.value === "global" ? true : "";
    set(i, next);
  } }, !Object.hasOwn(kinds, key) && (0, import_react4.createElement)("option", { value: key }, (scopeLabels[key] ?? key) + "\uFF08\u5DF2\u6709\u503C\uFF0C\u539F\u6837\u4FDD\u7559\uFF09"), ...Object.entries(kinds).map(([id, label]) => (0, import_react4.createElement)("option", { key: id, value: id, disabled: id !== key && Object.hasOwn(selector, id) }, label))), key !== "global" && (Object.hasOwn(kinds, key) ? (0, import_react4.createElement)(ScopeChoice, { kind: key, id: v, catalog, onChange: (next) => set(i, { ...selector, [key]: next }) }) : (0, import_react4.createElement)("code", null, String(v))), (0, import_react4.createElement)("button", { onClick: () => {
    const next = { ...selector };
    delete next[key];
    set(i, next);
  } }, "\u79FB\u9664\u6761\u4EF6"))), (0, import_react4.createElement)("div", { className: "dmm-actions" }, (0, import_react4.createElement)("button", { disabled: Object.keys(kinds).every((k) => Object.hasOwn(selector, k)), onClick: () => {
    const key = Object.keys(kinds).find((k) => !Object.hasOwn(selector, k));
    set(i, { ...selector, [key]: key === "global" ? true : "" });
  } }, "\u6DFB\u52A0\u8303\u56F4\u6761\u4EF6"), (0, import_react4.createElement)("button", { onClick: () => onChange(value.filter((_, j) => j !== i)) }, "\u79FB\u9664\u6B64\u8303\u56F4")))), (0, import_react4.createElement)("button", { onClick: () => onChange([...value, { sessionId: "" }]) }, "\u6DFB\u52A0\u8303\u56F4\uFF08\u6216\uFF09"), (0, import_react4.createElement)("p", { className: "dmm-muted" }, "\u4E0D\u540C\u8303\u56F4\u6EE1\u8DB3\u4EFB\u4E00\u5373\u53EF\uFF1B\u767D\u540D\u5355\u4E3A\u7A7A\u4E0D\u4F1A\u751F\u6548\uFF0C\u9ED1\u540D\u5355\u5339\u914D\u4F18\u5148\u3002\u8BF7\u9009\u62E9\u6765\u6E90\u5B9E\u4F53\uFF0C\u540D\u79F0\u4E0D\u662F\u8EAB\u4EFD\uFF1B\u540D\u5355\u4E0D\u6388\u4E88\u8BBF\u95EE\u6743\u3002"));
}
function OptionPage(props) {
  const [draft, setDraft] = (0, import_react4.useState)(() => structuredClone(props.value)), [selected, setSelected] = (0, import_react4.useState)(() => [...props.selected ?? []]), [missing, setMissing] = (0, import_react4.useState)(!!props.missing), [removeMode, setRemoveMode] = (0, import_react4.useState)(false), [error, setError] = (0, import_react4.useState)(null);
  const save = () => {
    try {
      if (props.filter) {
        for (const v of /* @__PURE__ */ new Set([...selected, ...props.selected ?? []])) if (selected.includes(v) !== (props.selected ?? []).includes(v)) props.onSelect(v);
        props.onMissing?.(missing);
      } else {
        if (removeMode) props.onRemoveMode?.();
        props.onChange(draft);
      }
      props.onBack();
    } catch (e) {
      setError(e);
    }
  };
  const dirty = removeMode || canonical(draft) !== canonical(props.value) || canonical(selected) !== canonical(props.selected ?? []) || missing !== !!props.missing;
  (0, import_react4.useEffect)(() => {
    props.onDirty?.(dirty);
    return () => props.onDirty?.(false);
  }, [dirty, props.onDirty]);
  return (0, import_react4.createElement)("div", null, (0, import_react4.createElement)("p", { className: "dmm-muted", role: "status" }, dirty ? "\u672C\u9875\u6709\u4FEE\u6539\uFF0C\u5C1A\u672A\u63D0\u4EA4\u7236\u8349\u7A3F\u3002" : "\u672C\u9875\u65E0\u4FEE\u6539\u3002"), error && (0, import_react4.createElement)("div", { className: "dmm-error", role: "alert" }, error.message), (0, import_react4.createElement)(OptionContents, { ...props, value: draft, selected, missing, onChange: setDraft, onSelect: (value) => setSelected((old) => old.includes(value) ? old.filter((v) => v !== value) : [...old, value]), onMissing: setMissing, onRemoveMode: props.onRemoveMode ? () => {
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
  return (0, import_react4.createElement)("div", { "data-page": "options", className: "dmm-options-page" }, (0, import_react4.createElement)("div", { className: "dmm-page-top dmm-page-nav" }, (0, import_react4.createElement)("button", { className: "dmm-link", onClick: onBack }, "\u2190 \u8FD4\u56DE" + (filter ? "\u7B5B\u9009" : "\u914D\u7F6E") + "\uFF08\u4E22\u5F03\u672C\u9875\u4FEE\u6539\uFF09"), (0, import_react4.createElement)("a", { href: catalog.documentation, target: "_blank", rel: "noreferrer" }, "\u6269\u5C55\u6587\u6863 \u2197")), (0, import_react4.createElement)("h2", null, (filter ? "\u7B5B\u9009 \xB7 " : "\u9009\u62E9 \xB7 ") + (fieldLabels[field] ?? ({ adapterId: "\u8D44\u6E90\u63D0\u4F9B\u65B9", turn: "\u8F6E\u6B21", turnKind: "\u8F6E\u6B21\u6765\u6E90", status: "\u89E6\u53D1\u72B6\u6001" }[field] ?? field))), (0, import_react4.createElement)("p", { className: "dmm-muted" }, filter ? "\u9009\u62E9\u7684\u503C\u5728\u672C\u5B57\u6BB5\u5185\u6EE1\u8DB3\u4EFB\u4E00\uFF1B\u4E0E\u5176\u4ED6\u5B57\u6BB5\u540C\u65F6\u6EE1\u8DB3\u3002" : "\u9009\u62E9\u53EA\u4FEE\u6539\u672C\u9875\u8349\u7A3F\u3002\u5DE6\u4E0A\u8FD4\u56DE\u4F1A\u4E22\u5F03\uFF1B\u4FDD\u5B58\u5E76\u8FD4\u56DE\u63D0\u4EA4\u5230\u7236\u8349\u7A3F\uFF0C\u6700\u7EC8\u4FDD\u5B58\u7BA1\u7406\u914D\u7F6E\u624D\u5199\u6587\u4EF6\u3002"), !filter && !catalog.requestSourceAvailable && mode === "retrieve" && (0, import_react4.createElement)("p", { className: "dmm-unconfigured" }, "\u8BF7\u6C42\u88C5\u914D\u670D\u52A1\u672A\u63A5\u5165\uFF1B\u4FDD\u5B58\u7BA1\u7406\u914D\u7F6E\u4E0D\u4F1A\u81EA\u52A8\u521B\u5EFA\u6216\u9009\u62E9\u6A21\u578B\u8BF7\u6C42\u6765\u6E90\u3002"), !filter && ["store", "retrieve"].includes(mode) && support?.supported !== true && (0, import_react4.createElement)("p", { className: "dmm-unconfigured" }, support?.reason ?? "\u5F53\u524D\u6765\u6E90\u672A\u58F0\u660E\u6B64\u6A21\u5F0F\u7684\u80FD\u529B\uFF1B\u5DF2\u6709\u914D\u7F6E\u4FDD\u7559\uFF0C\u53EF\u660E\u786E\u6E05\u7A7A\u6216\u66FF\u6362\u6765\u6E90\u540E\u914D\u7F6E\u3002"), (0, import_react4.createElement)("div", { className: "dmm-option-search" }, (0, import_react4.createElement)("input", { "aria-label": "\u641C\u7D22\u9009\u9879", placeholder: "\u641C\u7D22\u540D\u79F0\u6216\u8BF4\u660E", value: search, onChange: (e) => setSearch(e.target.value) }), (0, import_react4.createElement)("select", { "aria-label": "\u6309\u8D44\u6E90\u63D0\u4F9B\u65B9\u7B5B\u9009\u9009\u9879", value: provider, onChange: (e) => setProvider(e.target.value) }, (0, import_react4.createElement)("option", { value: "" }, "\u6240\u6709\u63D0\u4F9B\u65B9"), ...catalog.adapters.map((a) => (0, import_react4.createElement)("option", { key: a.id, value: a.id }, a.label))), (0, import_react4.createElement)("select", { "aria-label": "\u6309\u9884\u8BBE\u7B5B\u9009\u9009\u9879", value: preset, onChange: (e) => setPreset(e.target.value) }, (0, import_react4.createElement)("option", { value: "" }, "\u6240\u6709\u9884\u8BBE"), ...catalog.presets.map((p) => (0, import_react4.createElement)("option", { key: p.id, value: p.id }, p.label)))), !filter && (0, import_react4.createElement)("div", { className: "dmm-current-choice" }, (0, import_react4.createElement)("strong", null, "\u5F53\u524D\u8349\u7A3F"), (0, import_react4.createElement)("p", null, describeValue(value, field, catalog)), (0, import_react4.createElement)("button", { onClick: () => onChange(void 0) }, "\u6E05\u7A7A\u672C\u5730\u5B57\u6BB5"), field === "preset" && (0, import_react4.createElement)("button", { onClick: () => onChange(null) }, "\u4E0D\u5F15\u7528\u9884\u8BBE"), onRemoveMode && (0, import_react4.createElement)("button", { onClick: onRemoveMode }, mode === "store" ? "\u79FB\u9664\u672C\u5730\u5B58\u50A8\u914D\u7F6E" : "\u79FB\u9664\u672C\u5730\u8BFB\u53D6\u914D\u7F6E"), onRemoveMode && (0, import_react4.createElement)("p", { className: "dmm-muted" }, "\u53EA\u79FB\u9664\u672C\u5730\u89C4\u5219\u8986\u76D6\uFF0C\u56DE\u5230\u9884\u8BBE\u6216\u9ED8\u8BA4\u503C\uFF1B\u4E0D\u5220\u9664\u8D44\u6E90\u6B63\u6587\u3002\u6B64\u64CD\u4F5C\u4E5F\u53EA\u5728\u4FDD\u5B58\u5E76\u8FD4\u56DE\u540E\u63D0\u4EA4\u7236\u8349\u7A3F\u3002")), filter && onMissing && (0, import_react4.createElement)("label", { className: "dmm-option" }, (0, import_react4.createElement)("input", { type: "checkbox", checked: !!missing, onChange: (e) => onMissing(e.target.checked) }), "\u5305\u62EC\u672A\u914D\u7F6E / \u672A\u5F15\u7528 / \u4E0D\u53EF\u5224\u5B9A"), (0, import_react4.createElement)("div", { className: "dmm-option-list" }, visible.length ? visible.map((o, i) => (0, import_react4.createElement)("label", { key: o.id + ":" + i, className: "dmm-option-card" }, (0, import_react4.createElement)("input", { type: filter || field.endsWith(".on") && support?.onSelection === "multiple" ? "checkbox" : "radio", name: "field-option", checked: filter ? selected.includes(o.token ?? o.id) : field.endsWith(".on") && Array.isArray(value) ? value.includes(o.value) : equal(value, o.value), disabled: false, onChange: () => choose(o) }), (0, import_react4.createElement)("span", null, (0, import_react4.createElement)("strong", null, o.label), (0, import_react4.createElement)("small", null, o.description ?? describeValue(o.value, field, catalog)), o.available === false && (0, import_react4.createElement)("small", { className: "dmm-muted" }, o.reason ?? "\u5F53\u524D\u6765\u6E90\u4E0D\u652F\u6301"), o.presetIds?.length > 0 && (0, import_react4.createElement)("small", null, "\u6765\u81EA\u9884\u8BBE\uFF1A" + o.presetIds.map((id) => labelFor(catalog.presets, id)).join("\u3001"))))) : (0, import_react4.createElement)("p", { className: "dmm-muted" }, "\u6CA1\u6709\u5339\u914D\u9009\u9879\u3002")), !filter && editable && field.endsWith(".rule") && (0, import_react4.createElement)("section", { className: "dmm-card" }, (0, import_react4.createElement)("h3", null, "\u7EC4\u5408\u89C4\u5219"), (0, import_react4.createElement)(RuleEditor, { value, onChange, catalog: modeCatalog })), !filter && editable && field.endsWith(".strategy") && (0, import_react4.createElement)("section", { className: "dmm-card" }, (0, import_react4.createElement)("h3", null, "\u987A\u5E8F\u64CD\u4F5C\u94FE"), (0, import_react4.createElement)(StrategyEditor, { value, onChange, catalog: modeCatalog })), !filter && ["whitelist", "blacklist"].includes(field) && (0, import_react4.createElement)(ScopeEditor, { value: value ?? [], onChange, catalog }), filter && onAddValue && (field.endsWith(".rule") || field.endsWith(".strategy") || ["whitelist", "blacklist"].includes(field)) && (0, import_react4.createElement)("section", { className: "dmm-card" }, (0, import_react4.createElement)("h3", null, "\u6784\u9020\u5339\u914D\u503C"), field.endsWith(".rule") ? (0, import_react4.createElement)(RuleEditor, { value: composed, onChange: setComposed, catalog: modeCatalog }) : field.endsWith(".strategy") ? (0, import_react4.createElement)(StrategyEditor, { value: composed, onChange: setComposed, catalog: modeCatalog }) : (0, import_react4.createElement)(ScopeEditor, { value: composed ?? [], onChange: setComposed, catalog }), (0, import_react4.createElement)("button", { disabled: composed === void 0, onClick: () => onAddValue(composed) }, "\u52A0\u5165\u7B5B\u9009\u503C")), (0, import_react4.createElement)("div", { className: "dmm-sticky-actions" }, (0, import_react4.createElement)("button", { className: "dmm-primary", onClick: onSave }, "\u4FDD\u5B58\u5E76\u8FD4\u56DE")));
}

// src/client-style.js
var css = `
.dmm{--dmm-surface:var(--dsw-alias-bg-layer-2,#202125);font:13px/1.55 var(--dsw-font-family,system-ui);color:var(--dsw-alias-label-primary,#ddd);padding:20px;min-width:0;box-sizing:border-box}
.dmm *{box-sizing:border-box}.dmm h2{font-size:20px;margin:0}.dmm h3{font-size:15px;margin:0 0 12px}.dmm p{margin:6px 0 14px}.dmm .dmm-muted{color:var(--dsw-alias-label-secondary,#888)}
.dmm button,.dmm input,.dmm select,.dmm textarea{font:inherit;border:1px solid var(--dsw-alias-border-l2,#444);border-radius:7px;color:inherit;background:var(--dsw-alias-bg-base,#202125);padding:7px 10px}.dmm button{appearance:none;cursor:pointer;border:0;box-shadow:none;min-height:40px;padding:8px 14px;background:var(--dsw-alias-button-tool-bar-fill,#8882);scroll-margin-block:104px 120px}.dmm input:not([type=checkbox]):not([type=radio]),.dmm select{min-height:36px;height:36px}.dmm button:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,#8883)}.dmm button:disabled{cursor:default;opacity:.55}.dmm button:focus-visible,.dmm input:focus-visible,.dmm textarea:focus-visible,.dmm select:focus-visible,.dmm a:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#679eaf);outline-offset:3px}
.dmm .dmm-primary{background:#456f66;color:white;border:0}.dmm .dmm-primary:hover:not(:disabled){background:#527f74}.dmm .dmm-link{border:0;background:transparent;padding:8px 14px;color:var(--dsw-alias-label-primary,#ddd);text-align:left}.dmm input,.dmm textarea,.dmm select{max-width:100%}.dmm textarea{width:100%;min-height:90px;resize:vertical;font:12px/1.6 monospace}.dmm input:not([type=checkbox]):not([type=radio]),.dmm select{width:100%}.dmm input[readonly]{background:var(--dsw-alias-bg-l1,#8881)}.dmm input[type=checkbox],.dmm input[type=radio]{width:17px;height:17px;flex-shrink:0;accent-color:#456f66}
.dmm-heading,.dmm-toolbar,.dmm-actions,.dmm-title-line,.dmm-page-top{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.dmm-heading{justify-content:space-between;margin-bottom:6px}.dmm-toolbar{justify-content:space-between;margin:16px 0 12px}.dmm-actions{gap:6px}.dmm-page-top{justify-content:space-between;margin-bottom:18px}.dmm-page-nav{position:sticky;top:0;z-index:3;width:fit-content;max-width:100%;padding:8px 0;background:none;border:0;box-shadow:none;filter:none;backdrop-filter:none;pointer-events:none}.dmm .dmm-page-nav>.dmm-link,.dmm .dmm-sticky-actions .dmm-help{background:var(--dmm-surface)}.dmm-page-nav>a{display:inline-flex;align-items:center;min-height:40px;padding:8px 14px;border-radius:7px;background:var(--dmm-surface)}.dmm-page-nav>button,.dmm-page-nav>a,.dmm-sticky-actions button{pointer-events:auto}.dmm .dmm-sticky-actions button:not(.dmm-primary):not(.dmm-help),.dmm .dmm-page-nav>button:not(.dmm-link){background:linear-gradient(var(--dsw-alias-button-tool-bar-fill,#8882),var(--dsw-alias-button-tool-bar-fill,#8882)),var(--dmm-surface)}.dmm .dmm-sticky-actions button:hover:not(:disabled):not(.dmm-primary),.dmm .dmm-page-nav>button:hover:not(:disabled),.dmm-page-nav>a:hover{background:linear-gradient(var(--dsw-alias-interactive-bg-hover,#8883),var(--dsw-alias-interactive-bg-hover,#8883)),var(--dmm-surface)}.dmm .dmm-sticky-actions button:disabled,.dmm .dmm-page-nav>button:disabled{opacity:1;color:var(--dsw-alias-label-secondary,#888)}.dmm .dmm-sticky-actions .dmm-primary:disabled{background:color-mix(in srgb,#456f66 55%,var(--dmm-surface))}.dmm-close{margin-left:auto}.dmm .dmm-help{display:inline-flex;align-items:center;justify-content:center;flex:0 0 36px;width:36px;height:36px;min-height:36px;padding:0;border:0;background:transparent;color:var(--dsw-alias-label-secondary,#888);font-size:17px}.dmm-badge{font-size:11px;display:inline-block;padding:1px 7px;border-radius:12px;background:#6c9c8b22;color:inherit;margin-left:6px}
.dmm-table-wrap{width:100%;overflow:auto;border:1px solid var(--dsw-alias-border-l2,#444);border-radius:10px}.dmm table{width:100%;border-collapse:collapse;table-layout:fixed;min-width:560px}.dmm th{text-align:left;font-size:11px;font-weight:500;color:var(--dsw-alias-label-secondary,#888);padding:11px 9px;background:var(--dsw-alias-bg-l1,#8881)}.dmm td{vertical-align:top;padding:13px 9px;border-top:1px solid var(--dsw-alias-border-l2,#444);font-size:12px;overflow-wrap:anywhere}.dmm th:first-child{width:26%}.dmm th:nth-child(2){width:13%}.dmm th:nth-child(3){width:12%}.dmm th:last-child{width:13%}.dmm-resource-name{font-weight:600}.dmm-id{display:block;margin-top:4px;font:10px/1.45 monospace;color:var(--dsw-alias-label-secondary,#888);overflow-wrap:anywhere}.dmm-summary{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.55}.dmm-detail-link{white-space:normal}.dmm-table-caption{font-size:11px;margin-top:8px;color:var(--dsw-alias-label-secondary,#888)}
.dmm-card{border:1px solid var(--dsw-alias-border-l2,#444);border-radius:10px;padding:16px;margin:14px 0}.dmm-grid{display:grid;align-items:start;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.dmm-field{min-width:0}.dmm-field>label,.dmm-field-label{display:block;font-weight:600;margin-bottom:6px}.dmm-field small{display:block;font-size:11px;color:var(--dsw-alias-label-secondary,#888);margin:4px 0;overflow-wrap:anywhere}.dmm-field pre,.dmm-effective{white-space:pre-wrap;overflow-wrap:anywhere;font:11px/1.6 monospace;margin:6px 0 0;max-height:170px;overflow:auto;background:var(--dsw-alias-bg-l1,#8881);border-radius:6px;padding:8px}.dmm-effective{border-left:2px solid #679eaf}.dmm-field-wide{grid-column:1/-1}.dmm-code-editor{min-height:210px!important}.dmm-origin{font-size:10px;font-weight:400;color:var(--dsw-alias-label-secondary,#888);display:block;margin-top:3px}.dmm-section-head{display:flex;gap:8px;align-items:center;margin-bottom:12px}.dmm-section-head h3{margin:0}.dmm-unconfigured{border-left:3px solid #8b929b;padding:8px 12px;background:#8881}.dmm-status{padding:9px 12px;background:#6c9c8b16;border:1px solid #6c9c8b55;border-radius:7px;margin:10px 0;overflow-wrap:anywhere}.dmm-error{padding:10px 12px;border:1px solid #b45a5a;border-radius:7px;background:#9c363615;color:var(--dsw-alias-label-danger,#bc6666);margin:10px 0;white-space:pre-wrap;overflow-wrap:anywhere}.dmm-diagnostic{padding:8px 0;border-top:1px solid var(--dsw-alias-border-l2,#444);font-size:12px;overflow-wrap:anywhere}.dmm-diagnostic[data-level=error]{color:#bc6666}.dmm-diagnostic small{display:block;color:var(--dsw-alias-label-secondary,#888)}.dmm-diagnostics{margin-top:12px}.dmm pre{white-space:pre-wrap;overflow-wrap:anywhere;max-height:300px;overflow:auto}
.dmm-filter-card{border:1px solid var(--dsw-alias-border-l2,#444);border-radius:10px;padding:14px;min-width:0}.dmm-filter-card h3{display:flex;align-items:center;gap:5px;margin-bottom:8px}.dmm-options{max-height:180px;overflow:auto;margin-top:8px}.dmm-option{display:flex;align-items:flex-start;gap:7px;padding:6px 0;overflow-wrap:anywhere}.dmm-option span{min-width:0}.dmm-filter-add{display:flex;gap:6px;margin-top:8px}.dmm-filter-add input{min-width:0}.dmm-filter-add button{white-space:nowrap;flex-shrink:0}.dmm-tags{display:flex;gap:5px;flex-wrap:wrap;margin:8px 0}.dmm-tags button{max-width:100%;font-size:11px;overflow-wrap:anywhere;text-align:left}.dmm-empty{padding:26px;text-align:center;color:var(--dsw-alias-label-secondary,#888)}.dmm-catalogs{font-size:11px;margin:12px 0}.dmm-catalogs summary,.dmm-advanced summary{cursor:pointer}.dmm-catalogs p{margin:5px 0}.dmm-advanced{margin:14px 0}.dmm-advanced textarea{margin-top:10px}.dmm-sticky-actions{position:sticky;bottom:0;z-index:2;width:fit-content;max-width:100%;padding:12px 0 10px;background:none;border:0;box-shadow:none;filter:none;backdrop-filter:none;pointer-events:none;margin-top:22px}.dmm-source-content{margin-top:20px}.dmm-entry-compact{display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;padding:2px;border:1px solid var(--dsw-alias-border-l2,#444);border-radius:6px;background:var(--dsw-alias-bg-base,#202125);color:var(--dsw-alias-label-primary,#eee);cursor:pointer}.dmm-entry-compact:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#679eaf);outline-offset:2px}.dmm-session-entry{position:absolute;top:12px;right:72px;z-index:7;pointer-events:none;-webkit-app-region:no-drag}.dmm-session-entry>button{pointer-events:auto}.dmm-session-entry>button:not(.dmm-entry-compact){height:28px;padding:4px 10px;border:1px solid var(--dsw-alias-border-l2,#444);border-radius:7px;background:var(--dsw-alias-bg-base,#202125);color:var(--dsw-alias-label-primary,#eee);font:inherit;font-size:12px;cursor:pointer}.dmm-session-entry>button:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#679eaf);outline-offset:2px}.dmm-overlay{--dmm-surface:var(--dsw-alias-bg-layer-2,#202125);pointer-events:auto;position:fixed;inset:65px 16px 20px auto;width:min(790px,calc(100vw - 32px));z-index:1000;overflow:auto;border:1px solid var(--dsw-alias-border-l2,#444);border-radius:12px;background:var(--dmm-surface);box-shadow:0 15px 55px #0007}
.dmm input,.dmm select,.dmm textarea,.dmm a{scroll-margin-block:104px 120px}.dmm-section-head{flex-wrap:wrap}.dmm [hidden]{display:none!important}.dmm .dmm-field-choice{display:flex;flex-direction:column;align-items:flex-start;gap:7px;width:100%;text-align:left;padding:14px;overflow-wrap:anywhere;min-height:90px}.dmm-field-choice>small,.dmm-field-choice>span:last-child{color:var(--dsw-alias-label-secondary,#888)}.dmm-option-search{display:grid;grid-template-columns:2fr 1fr 1fr;gap:8px;margin:18px 0}.dmm-option-list{display:flex;flex-direction:column;gap:8px}.dmm-option-card{display:flex;align-items:flex-start;gap:10px;border:1px solid var(--dsw-alias-border-l2,#444);padding:12px;border-radius:8px;cursor:pointer}.dmm-option-card>span{flex:1;min-width:0}.dmm-option-card small{display:block;overflow-wrap:anywhere;margin-top:4px}.dmm-current-choice{padding:14px;background:var(--dsw-alias-bg-l1,#8881);border-radius:8px;margin:12px 0}.dmm-current-choice button{margin:4px}.dmm-rule-node{border-left:2px solid #679eaf55;padding:10px;margin:8px 0;min-width:0}.dmm-rule-child{margin-top:8px}.dmm-param{margin:8px 0}.dmm-param-label{display:flex;flex-direction:column;gap:5px;margin:8px 0}.dmm-param-label input[type=checkbox]{align-self:flex-start}.dmm-scope-row{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:8px 0}.dmm-scope-row>*{flex:1 1 160px}.dmm-scope-value{min-width:0}.dmm-scope-row>.dmm-scope-value:has([aria-label="\u9009\u62E9\u4F5C\u7528\u57DF\u5B9E\u4F53"]){flex-basis:100%;order:3}.dmm-scope-value>code{display:block;overflow-wrap:anywhere;margin-top:6px}.dmm-options-page{padding:4px 2px 12px}.dmm-option-list{margin-bottom:18px}.dmm-filter-card+.dmm-filter-card{margin-top:12px}.dmm-scope-row>select,.dmm-scope-row>button{align-self:flex-start}.dmm-scope-row>select{width:auto}.dmm-options-page a{color:inherit;font-size:12px}.dmm-options-page fieldset{min-width:0;border:1px solid var(--dsw-alias-border-l2,#444);border-radius:7px}
[data-shortcut-modal="settings"]:has([data-slot="settings.section"]>.dmm)>nav+div{min-height:0}[data-shortcut-modal="settings"]:has([data-slot="settings.section"]>.dmm)>nav+div>div:last-child{scroll-padding-block:104px 120px}.dmm-overlay{scroll-padding-block:104px 120px}
@media(min-width:601px){[data-shortcut-modal="settings"]:has([data-slot="settings.section"]>.dmm){width:min(1100px,calc(100vw - 40px));max-width:1100px}}
@media(max-width:600px){[data-shortcut-modal="settings"]:has([data-slot="settings.section"]>.dmm){flex-direction:column}[data-shortcut-modal="settings"]:has([data-slot="settings.section"]>.dmm)>nav{width:auto;flex-basis:auto;flex-shrink:0;padding:12px;max-height:170px;overflow:auto}[data-shortcut-modal="settings"]:has([data-slot="settings.section"]>.dmm)>nav>div:last-child{display:flex;flex-direction:row;flex-wrap:wrap;gap:4px}[data-shortcut-modal="settings"]:has([data-slot="settings.section"]>.dmm)>nav button{width:auto;flex:0 0 auto}.dmm{padding:12px}.dmm-grid{grid-template-columns:1fr}.dmm-option-search{grid-template-columns:1fr}.dmm-rule-node{padding:6px}.dmm-card{padding:12px}.dmm-toolbar{align-items:flex-start}.dmm table{min-width:610px}.dmm-page-top{gap:6px}.dmm-heading h2{font-size:19px}.dmm-sticky-actions .dmm-actions{gap:5px}.dmm-sticky-actions button:not(.dmm-help){flex:1 1 auto}}
`;

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
function HelpInfo({ label, text }) {
  return (0, import_react5.createElement)(import_dsh_client_ui_primitives2.Tooltip, { label: text, side: "bottom", portal: true, maxWidth: 340, openOnClick: true }, (0, import_react5.createElement)("button", { type: "button", className: "dmm-help", "aria-label": label }, "\u24D8"));
}
function ErrorBox({ error }) {
  return error && (0, import_react5.createElement)("div", { className: "dmm-error", role: "alert" }, error.message ?? error, ...(error.diagnostics ?? []).map((d, i) => (0, import_react5.createElement)("div", { key: i }, `${d.field ?? ""}\uFF1A${d.message}`)));
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
  (0, import_react5.useEffect)(() => {
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
  return (0, import_react5.createElement)("div", null, (0, import_react5.createElement)("div", { className: "dmm-table-wrap", tabIndex: 0, "aria-label": "\u8BB0\u5FC6\u8D44\u6E90\u8868\u683C\uFF0C\u53EF\u6A2A\u5411\u6EDA\u52A8" }, (0, import_react5.createElement)("table", null, (0, import_react5.createElement)("thead", null, (0, import_react5.createElement)("tr", null, ...["\u8D44\u6E90\u540D\u79F0 / ID", "\u7C7B\u578B", "\u9884\u8BBE", "\u5B58\u50A8", "\u8BFB\u53D6", "\u7BA1\u7406\u914D\u7F6E"].map((t) => (0, import_react5.createElement)("th", { key: t, scope: "col" }, t)))), (0, import_react5.createElement)("tbody", null, ...data.rows.map((row) => (0, import_react5.createElement)("tr", { key: JSON.stringify([row.adapterId, row.id]) }, (0, import_react5.createElement)("td", null, (0, import_react5.createElement)("div", { className: "dmm-resource-name" }, row.name ?? row.id), (0, import_react5.createElement)("code", { className: "dmm-id" }, row.id), row.missing && (0, import_react5.createElement)("span", { className: "dmm-badge" }, "\u6765\u6E90\u4E0D\u53EF\u7528")), (0, import_react5.createElement)("td", null, row.config?.type ?? row.type ?? "\u4E0D\u53EF\u5224\u5B9A", !row.config?.type && (0, import_react5.createElement)("small", { className: "dmm-id" }, row.type === void 0 ? "\u7C7B\u578B\u672A\u786E\u8BA4" : "\u6765\u6E90\u5143\u6570\u636E")), (0, import_react5.createElement)("td", null, row.config ? row.config.preset ?? "\u672A\u5F15\u7528" : "\u672A\u914D\u7F6E"), (0, import_react5.createElement)("td", null, (0, import_react5.createElement)("span", { className: "dmm-summary", title: summary(row.config?.store) }, summary(row.config?.store))), (0, import_react5.createElement)("td", null, (0, import_react5.createElement)("span", { className: "dmm-summary", title: summary(row.config?.retrieve) }, summary(row.config?.retrieve))), (0, import_react5.createElement)("td", null, (0, import_react5.createElement)("button", { className: "dmm-link dmm-detail-link", onClick: () => onDetail(row), "aria-label": `\u7BA1\u7406\u914D\u7F6E\uFF1A${row.name ?? row.id}` }, "\u7BA1\u7406\u914D\u7F6E \u2192"))))))), (0, import_react5.createElement)("p", { className: "dmm-table-caption" }, "\u8868\u683C\u663E\u793A\u751F\u6548\u914D\u7F6E\u3002\u7A84\u5C4F\u53EF\u6A2A\u5411\u6EDA\u52A8\u67E5\u770B\u6240\u6709\u5217\u3002"));
}
function FiltersPage({ data, sessionId, filters: applied, setFilters: setApplied, onBack }) {
  const [filters, setFilters] = (0, import_react5.useState)(() => structuredClone(applied)), [fieldDirty, setFieldDirty] = (0, import_react5.useState)(false);
  const [catalog, setCatalog] = (0, import_react5.useState)(null), [error, setError] = (0, import_react5.useState)(null), [field, setField] = (0, import_react5.useState)(null);
  const element = (0, import_react5.useRef)(null), position = (0, import_react5.useRef)([]);
  (0, import_react5.useEffect)(() => {
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
  const special = { adapterId: { label: "\u8D44\u6E90\u63D0\u4F9B\u65B9", values: (data?.adapters ?? []).map((a) => [a.id, a.name ?? a.id]) }, ...sessionId ? { turn: { label: "\u8F6E\u6B21", values: (data?.facets?.turns ?? []).map((v) => [v, `\u7B2C ${v} \u8F6E`]) }, turnKind: { label: "\u8F6E\u6B21\u6765\u6E90", values: [["human", "\u4EBA\u7C7B\u8F93\u5165"], ["task", "\u4EFB\u52A1\u4E0A\u4E0B\u6587"], ["system", "\u7CFB\u7EDF"], ["unknown", "\u672A\u786E\u8BA4"]] }, status: { label: "\u89E6\u53D1\u72B6\u6001", values: Object.entries(labels) } } : {} };
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
  return (0, import_react5.createElement)("div", { ref: element, "data-page": "filters" }, (0, import_react5.createElement)(ErrorBox, { error }), field && catalog ? (0, import_react5.createElement)(OptionPage, { key: field, field, filter: true, catalog, onDirty: setFieldDirty, onBack: back, options: special[field] ? special[field].values.map(([id, label]) => ({ id, token: id, label, value: id, adapterIds: [], presetIds: [], available: true })) : optionRows(field), selected: special[field] ? filters[field] : filters.fields[field]?.values ?? [], missing: !special[field] && filters.fields[field]?.missing, onMissing: special[field] ? void 0 : (v) => update({ missing: v }), onSelect: (value) => {
    if (special[field]) setFilters((previous) => ({ ...previous, [field]: previous[field].includes(value) ? previous[field].filter((v) => v !== value) : [...previous[field], value] }));
    else setFilters((previous) => {
      const old = previous.fields[field] ?? { mode: "exact", values: [], missing: false };
      return { ...previous, fields: { ...previous.fields, [field]: { ...old, values: old.values.includes(value) ? old.values.filter((v) => v !== value) : [...old.values, value] } } };
    });
  }, onAddValue: (value) => setFilters((previous) => {
    const old = previous.fields[field] ?? { mode: "exact", values: [], missing: false };
    return { ...previous, fields: { ...previous.fields, [field]: { ...old, values: [.../* @__PURE__ */ new Set([...old.values, token(value, field)])] } } };
  }) }) : (0, import_react5.createElement)("div", null, (0, import_react5.createElement)("div", { className: "dmm-page-top dmm-page-nav" }, (0, import_react5.createElement)("button", { className: "dmm-link", onClick: onBack }, "\u2190 \u8FD4\u56DE\u8D44\u6E90\u8868\u683C\uFF08\u4E22\u5F03\u672C\u9875\u4FEE\u6539\uFF09"), (0, import_react5.createElement)("button", { onClick: () => setFilters(emptyFilters()) }, "\u6E05\u7A7A\u5168\u90E8")), (0, import_react5.createElement)("h2", null, "\u7B5B\u9009\u8D44\u6E90"), (0, import_react5.createElement)("p", { role: "status", className: "dmm-muted" }, canonical(filters) === canonical(applied) ? "\u672C\u9875\u65E0\u4FEE\u6539\u3002" : "\u672C\u9875\u6709\u4FEE\u6539\uFF0C\u5C1A\u672A\u5E94\u7528\u7B5B\u9009\u3002"), (0, import_react5.createElement)("p", { className: "dmm-muted" }, "\u70B9\u51FB\u5B57\u6BB5\u9009\u62E9\u7B5B\u9009\u503C\u3002\u540C\u5B57\u6BB5 OR\uFF0C\u8DE8\u5B57\u6BB5 AND\uFF0C\u4E0D\u9009\u5373\u4E0D\u9650\uFF1B\u7B5B\u9009\u6309\u751F\u6548\u914D\u7F6E\uFF0C\u4E0D\u6267\u884C\u89C4\u5219\u3002"), !catalog ? (0, import_react5.createElement)("p", null, "\u6B63\u5728\u8BFB\u53D6\u9009\u9879\u76EE\u5F55\u2026") : (0, import_react5.createElement)("div", { className: "dmm-grid" }, ...Object.entries({ ...special, ...fieldLabels }).map(([key, definition]) => (0, import_react5.createElement)("button", { key, className: "dmm-field-choice", onClick: () => open(key) }, (0, import_react5.createElement)("strong", null, typeof definition === "string" ? definition : definition.label), (0, import_react5.createElement)("span", null, `${special[key] ? filters[key].length : filters.fields[key]?.values.length ?? 0} \u9879\u5DF2\u9009${filters.fields[key]?.missing ? " \xB7 \u542B\u672A\u914D\u7F6E" : ""}`), (0, import_react5.createElement)("span", null, "\u9009\u62E9\u9009\u9879 \u2192")))), (0, import_react5.createElement)("div", { className: "dmm-sticky-actions" }, (0, import_react5.createElement)("button", { className: "dmm-primary", onClick: () => {
    setApplied(filters);
    onBack();
  } }, "\u4FDD\u5B58\u5E76\u8FD4\u56DE"))));
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
  return report && (0, import_react5.createElement)("section", { className: "dmm-card dmm-diagnostics", "aria-label": "\u914D\u7F6E\u6821\u9A8C\u7ED3\u679C" }, (0, import_react5.createElement)("h3", null, report.valid ? "\u9759\u6001\u6821\u9A8C\u901A\u8FC7" : "\u914D\u7F6E\u6821\u9A8C\u672A\u901A\u8FC7"), ...report.diagnostics.map((d, i) => (0, import_react5.createElement)("div", { className: "dmm-diagnostic", key: i, "data-level": d.level }, (0, import_react5.createElement)("strong", null, ({ error: "\u9519\u8BEF", unknown: "\u672A\u9A8C\u8BC1", info: "\u4FE1\u606F" }[d.level] ?? d.level) + " \xB7 " + d.field), (0, import_react5.createElement)("div", null, d.message), (0, import_react5.createElement)("small", null, d.code))));
}
function ContentEditor({ row, sessionId, onChange, onDirty }) {
  const [record, setRecord] = (0, import_react5.useState)(null), [text, setText] = (0, import_react5.useState)(""), [saved, setSaved] = (0, import_react5.useState)(""), [error, setError] = (0, import_react5.useState)(null), [busy, setBusy] = (0, import_react5.useState)(false), [notice, setNotice] = (0, import_react5.useState)("");
  const ctrl = (0, import_react5.useRef)(null);
  (0, import_react5.useEffect)(() => {
    const c = new AbortController();
    ctrl.current = c;
    return () => c.abort();
  }, []);
  const dirty = text !== saved;
  (0, import_react5.useEffect)(() => onDirty(dirty), [dirty, onDirty]);
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
  return (0, import_react5.createElement)("section", { className: "dmm-card dmm-source-content" }, (0, import_react5.createElement)("div", { className: "dmm-section-head" }, (0, import_react5.createElement)("h3", null, "\u8D44\u6E90\u5185\u5BB9 content"), (0, import_react5.createElement)(HelpInfo, { label: "\u8D44\u6E90\u5185\u5BB9\u8BF4\u660E", text: "\u5185\u5BB9\u7531\u8D44\u6E90\u63D0\u4F9B\u65B9\u8BFB\u5199\uFF0C\u4E0E\u4E0A\u65B9\u7BA1\u7406\u914D\u7F6E\u5206\u5F00\u4FDD\u5B58\u3002\u4FDD\u5B58\u7BA1\u7406\u914D\u7F6E\u4E0D\u4F1A\u81EA\u52A8\u59D4\u6258\u7BA1\u7406\uFF1B\u5185\u5BB9\u7F16\u8F91\u548C\u89C4\u5219\u6267\u884C\u6A21\u5F0F\u53D8\u66F4\u4ECD\u7531\u6765\u6E90\u6821\u9A8C\u6743\u9650\u4E0E\u7248\u672C\u3002" })), (0, import_react5.createElement)("p", { className: "dmm-muted" }, `${row.missing ? "\u6765\u6E90\u4E0D\u53EF\u7528\uFF0C\u5F53\u524D\u80FD\u529B\u4E0D\u53EF\u5224\u5B9A" : (record?.managementMode ?? row.managementMode) === "managed" ? "\u89C4\u5219\u7531\u8BB0\u5FC6\u7BA1\u7406\u6267\u884C" : "\u89C4\u5219\u7531\u6765\u6E90\u6267\u884C"} \xB7 ${row.adapterId}`), (0, import_react5.createElement)("p", { className: "dmm-muted" }, row.capabilities.edit ? "\u6B63\u6587\u7F16\u8F91\uFF1A\u6765\u6E90\u652F\u6301\uFF0C\u5B9E\u9645\u5199\u5165\u4ECD\u9A8C\u8BC1\u6743\u9650\u4E0E\u7248\u672C\u3002" : `\u6B63\u6587\u53EA\u8BFB\uFF1A${row.capabilities.editReason ?? (row.missing ? "\u6765\u6E90\u5DF2\u5378\u8F7D\u6216\u505C\u7528\u3002" : "\u6765\u6E90\u672A\u63D0\u4F9B update \u63A5\u53E3\uFF0C\u6216\u660E\u786E\u5C06\u6B64\u8D44\u6E90\u6807\u4E3A\u53EA\u8BFB\u3002")} \u5207\u6362\u89C4\u5219\u6A21\u5F0F\u4E0D\u4F1A\u6388\u4E88\u6B63\u6587\u5199\u6743\u9650\u3002`), (0, import_react5.createElement)("div", { className: "dmm-actions" }, (0, import_react5.createElement)("button", { onClick: () => {
    if (!dirty || window.confirm("\u91CD\u65B0\u8BFB\u53D6\u4F1A\u4E22\u5F03\u672A\u4FDD\u5B58\u7684\u5185\u5BB9\uFF0C\u662F\u5426\u7EE7\u7EED\uFF1F")) load();
  }, disabled: busy || row.missing }, record ? "\u91CD\u65B0\u8BFB\u53D6\u5185\u5BB9" : "\u67E5\u770B\u8D44\u6E90\u5185\u5BB9"), row.capabilities.copy && (0, import_react5.createElement)("button", { disabled: busy || row.missing, onClick: () => mutate("copy") }, "\u590D\u5236\u8D44\u6E90\u4E3A\u65B0 ID")), record && (0, import_react5.createElement)("div", null, (0, import_react5.createElement)("p", { className: "dmm-muted" }, `\u8D44\u6E90\u7248\u672C ${record.revision ?? "\u6765\u6E90\u672A\u63D0\u4F9B"} \xB7 ${row.capabilities.edit ? "\u6765\u6E90\u5141\u8BB8\u7F16\u8F91" : "\u53EA\u8BFB\u5185\u5BB9"}`), row.capabilities.edit ? (0, import_react5.createElement)("textarea", { disabled: busy, "aria-label": "\u8D44\u6E90\u5185\u5BB9", value: text, onChange: (e) => setText(e.target.value), className: "dmm-code-editor" }) : (0, import_react5.createElement)("pre", null, text), (0, import_react5.createElement)("div", { className: "dmm-actions" }, row.capabilities.edit && (0, import_react5.createElement)("button", { disabled: busy || !dirty, onClick: () => mutate("update") }, "\u4FDD\u5B58\u8D44\u6E90\u5185\u5BB9"), row.capabilities.management && (0, import_react5.createElement)("button", { disabled: busy, onClick: () => mutate("management") }, (record?.managementMode ?? row.managementMode) === "managed" ? "\u89C4\u5219\u4EA4\u56DE\u6765\u6E90\u6267\u884C" : "\u89C4\u5219\u59D4\u6258\u8BB0\u5FC6\u7BA1\u7406\u6267\u884C"))), (0, import_react5.createElement)(ErrorBox, { error }), notice && (0, import_react5.createElement)("p", { className: "dmm-status", role: "status" }, notice));
}
function DetailPage({ row, sessionId, liveRevision, onBack, onChange }) {
  const [snapshot, setSnapshot] = (0, import_react5.useState)(null), [form, setForm] = (0, import_react5.useState)(null), [baseline, setBaseline] = (0, import_react5.useState)(""), [report, setReport] = (0, import_react5.useState)(null), [error, setError] = (0, import_react5.useState)(null), [busy, setBusy] = (0, import_react5.useState)(false), [notice, setNotice] = (0, import_react5.useState)(""), [contentDirty, setContentDirty] = (0, import_react5.useState)(false), [optionDirty, setOptionDirty] = (0, import_react5.useState)(false), [catalog, setCatalog] = (0, import_react5.useState)(null), [optionField, setOptionField] = (0, import_react5.useState)(null);
  const element = (0, import_react5.useRef)(null), ctrl = (0, import_react5.useRef)(null), detailScroll = (0, import_react5.useRef)([]);
  const dirty = !!form && JSON.stringify(form) !== baseline, anyDirty = dirty || contentDirty || optionDirty;
  useUnsaved(anyDirty, element);
  const install = (data) => {
    const next = formFrom(data.local);
    next.adapterId ||= row.adapterId;
    setSnapshot(data);
    setForm(next);
    setBaseline(JSON.stringify(next));
    setReport(null);
    setError(null);
  };
  const load = async () => {
    setBusy(true);
    const q = new URLSearchParams({ id: row.id, adapterId: row.adapterId });
    try {
      const [config, options] = await Promise.all([api("/configuration?" + q, void 0, ctrl.current.signal), api("/options?" + q + (sessionId ? "&sessionId=" + encodeURIComponent(sessionId) : ""), void 0, ctrl.current.signal)]);
      install(config);
      setCatalog(options);
    } catch (e) {
      if (e.name !== "AbortError") setError(e);
    } finally {
      setBusy(false);
    }
  };
  (0, import_react5.useEffect)(() => {
    const c = new AbortController();
    ctrl.current = c;
    load();
    return () => c.abort();
  }, []);
  (0, import_react5.useEffect)(() => {
    const c = new AbortController();
    let timer;
    const refresh = async () => {
      try {
        const q = new URLSearchParams({ id: row.id, adapterId: form?.adapterId || row.adapterId, ...sessionId ? { sessionId } : {} }), options = await api("/options?" + q, void 0, c.signal);
        if (!c.signal.aborted) setCatalog(options);
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
  }, [row.id, row.adapterId, sessionId, form?.adapterId]);
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
  const composed = report?.effective ?? snapshot?.config, origins = report?.origins ?? snapshot?.origins ?? {};
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
  const renderField = (field) => {
    const value = at2(composed, field), origin = fieldOrigin(composed, origins, field);
    return (0, import_react5.createElement)("div", { className: "dmm-field", key: field }, (0, import_react5.createElement)("label", null, fieldLabels[field], (0, import_react5.createElement)("span", { className: "dmm-origin" }, "\u672C\u5730\u503C \xB7 \u70B9\u51FB\u9009\u62E9")), (0, import_react5.createElement)("button", { className: "dmm-field-choice", disabled: busy || !catalog, "aria-label": `\u914D\u7F6E\u9009\u9879\uFF1A${fieldLabels[field]}`, onClick: () => openField(field) }, (0, import_react5.createElement)("span", null, describeValue(fieldValue(field), field, catalog)), (0, import_react5.createElement)("small", null, "\u9009\u62E9\u4E0E\u7EC4\u5408 \u2192")), (0, import_react5.createElement)("small", null, `${report?.effective ? "\u8349\u7A3F\u5408\u6210\u9884\u89C8 \xB7 \u672A\u4FDD\u5B58" : "\u6253\u5F00\u65F6\u751F\u6548\u503C \xB7 \u7248\u672C " + snapshot.revision} \xB7 ${originLabel(origin)}`), (0, import_react5.createElement)("div", { className: "dmm-effective", "data-field": field }, describeValue(value, field, catalog)), origin?.startsWith("preset:") && (0, import_react5.createElement)("small", null, "\u9884\u8BBE\u63D0\u4F9B\u7684\u503C\u4F18\u5148\uFF1B\u4FEE\u6539\u672C\u5730\u503C\u4E0D\u4F1A\u8986\u76D6\u8BE5\u9884\u8BBE\u3002"));
  };
  return (0, import_react5.createElement)("div", { ref: element, "data-page": "detail" }, optionField && catalog && (0, import_react5.createElement)(OptionPage, { key: optionField, field: optionField, value: fieldValue(optionField), catalog, onDirty: setOptionDirty, effectiveType: effectiveDraftType(form, catalog.presets), localType: form.type || void 0, onRemoveMode: ["store", "retrieve"].includes(optionField.split(".")[0]) ? () => removeMode(optionField.split(".")[0]) : void 0, onChange: (value) => updateField(optionField, value), onBack: closeField }), (0, import_react5.createElement)("div", { hidden: !!optionField }, (0, import_react5.createElement)("div", { className: "dmm-page-top dmm-page-nav" }, (0, import_react5.createElement)("button", { className: "dmm-link", onClick: back }, "\u2190 \u8FD4\u56DE\u8D44\u6E90\u8868\u683C\uFF08\u4E22\u5F03\u672C\u9875\u4FEE\u6539\uFF09")), (0, import_react5.createElement)("p", { className: "dmm-muted" }, dirty ? "\u6709\u672A\u4FDD\u5B58\u4FEE\u6539" : "\u7BA1\u7406\u914D\u7F6E"), (0, import_react5.createElement)("h2", null, row.name ?? row.id), (0, import_react5.createElement)("p", { className: "dmm-muted" }, "\u5B57\u6BB5\u9875\u4FDD\u5B58\u5E76\u8FD4\u56DE\u53EA\u63D0\u4EA4\u8349\u7A3F\uFF1B\u4E0B\u65B9\u4FDD\u5B58\u7BA1\u7406\u914D\u7F6E\u624D\u539F\u5B50\u5199\u5165\u672C\u5730\u89C4\u5219\u6587\u4EF6\u3002\u8D44\u6E90\u6B63\u6587\u5355\u72EC\u4FDD\u5B58\u3002"), (0, import_react5.createElement)(ErrorBox, { error }), !snapshot ? (0, import_react5.createElement)("p", null, "\u6B63\u5728\u8BFB\u53D6\u7BA1\u7406\u914D\u7F6E\u2026") : (0, import_react5.createElement)("div", null, !snapshot.local && (0, import_react5.createElement)("p", { className: "dmm-unconfigured" }, "\u6B64\u8D44\u6E90\u5C1A\u672A\u914D\u7F6E\u7BA1\u7406\u89C4\u5219\u3002\u4EE5\u4E0B\u5B57\u6BB5\u5747\u53EF\u586B\u5199\uFF1B\u672A\u914D\u7F6E\u4E0D\u4EE3\u8868\u5DF2\u505C\u7528\u6765\u6E90\u539F\u751F\u884C\u4E3A\u3002"), snapshot.revision !== liveRevision && (0, import_react5.createElement)("div", { className: "dmm-error", role: "alert" }, `\u5F53\u524D\u914D\u7F6E\u5DF2\u53D8\u5316\uFF08\u6253\u5F00\u65F6 ${snapshot.revision}\uFF0C\u5F53\u524D ${liveRevision}\uFF09\u3002\u8349\u7A3F\u4FDD\u7559\uFF1B\u8BF7\u91CD\u65B0\u8F7D\u5165\u540E\u5408\u5E76\u4FEE\u6539\u3002`, (0, import_react5.createElement)("button", { disabled: busy, onClick: () => {
    if (!dirty || window.confirm("\u91CD\u65B0\u8F7D\u5165\u4F1A\u4E22\u5F03\u7BA1\u7406\u914D\u7F6E\u8349\u7A3F\uFF0C\u662F\u5426\u7EE7\u7EED\uFF1F")) load();
  } }, "\u91CD\u65B0\u8F7D\u5165\u914D\u7F6E")), (0, import_react5.createElement)("section", { className: "dmm-card" }, (0, import_react5.createElement)("h3", null, "\u8D44\u6E90\u8EAB\u4EFD"), (0, import_react5.createElement)("div", { className: "dmm-grid" }, (0, import_react5.createElement)("div", { className: "dmm-field" }, (0, import_react5.createElement)("label", null, "\u8D44\u6E90 ID \xB7 \u53EA\u8BFB"), (0, import_react5.createElement)("input", { "aria-label": "\u8D44\u6E90 ID", readOnly: true, value: row.id }), (0, import_react5.createElement)("small", null, "\u540C\u4E00\u4E2A ID \u662F\u540C\u4E00\u4EFD\u5185\u5BB9\uFF1B\u9700\u8981\u72EC\u7ACB\u5185\u5BB9\u8BF7\u590D\u5236\u8D44\u6E90\u3002")), (0, import_react5.createElement)("div", { className: "dmm-field" }, (0, import_react5.createElement)("label", null, "\u6743\u5A01\u6B63\u6587\u6765\u6E90 \xB7 \u53EA\u8BFB"), (0, import_react5.createElement)("input", { "aria-label": "\u8D44\u6E90\u63D0\u4F9B\u65B9", readOnly: true, value: row.adapterId }), (0, import_react5.createElement)("small", null, `${row.missing ? "\u6765\u6E90\u4E0D\u53EF\u7528\uFF0C\u5F53\u524D\u80FD\u529B\u4E0D\u53EF\u5224\u5B9A" : "\u6765\u6E90\u5DF2\u63A5\u5165"} \xB7 \u6765\u6E90\u7C7B\u578B\uFF1A${row.type ?? "\u4E0D\u53EF\u5224\u5B9A"}`)))), (0, import_react5.createElement)("section", { className: "dmm-card" }, (0, import_react5.createElement)("h3", null, "\u89C4\u5219\u8DEF\u7531 adapter"), renderField("adapterId"), (0, import_react5.createElement)("p", { className: "dmm-muted" }, "\u53EF\u9009\u62E9\u4EFB\u610F\u5DF2\u6CE8\u518C adapter\u3002\u66F4\u6362\u53EA\u6539\u53D8\u89C4\u5219\u8DEF\u7531\uFF1B\u6821\u9A8C\u5FC5\u987B\u786E\u8BA4\u8BE5 adapter \u652F\u6301\u6B64\u7A33\u5B9A\u8D44\u6E90 ID \u4E0E\u539F\u6765\u6E90\uFF0C\u6B63\u6587\u4E0D\u4F1A\u8FC1\u79FB\uFF0C\u4E5F\u4E0D\u4F1A\u53D6\u5F97\u989D\u5916\u6743\u9650\u3002")), (0, import_react5.createElement)("section", { className: "dmm-card" }, (0, import_react5.createElement)("div", { className: "dmm-section-head" }, (0, import_react5.createElement)("h3", null, "\u7C7B\u578B\u4E0E\u9884\u8BBE"), (0, import_react5.createElement)(HelpInfo, { label: "\u672C\u5730\u4E0E\u9884\u8BBE\u8BF4\u660E", text: "\u672C\u5730\u5B57\u6BB5\u53EF\u81EA\u7531\u7EC4\u5408\uFF0C\u518D\u7531\u6765\u6E90\u6821\u9A8C\u3002\u9884\u8BBE\u660E\u786E\u63D0\u4F9B\u7684\u5B57\u6BB5\u8986\u76D6\u672C\u5730\u503C\uFF1B\u4FDD\u5B58\u53EA\u5199\u672C\u5730\u6761\u76EE\uFF0C\u4E0D\u4FEE\u6539\u9884\u8BBE\u5B9A\u4E49\uFF0C\u4E5F\u4E0D\u5C06\u751F\u6548\u503C\u53CD\u5199\u6210\u672C\u5730\u503C\u3002preset \u5F15\u7528\u672C\u8EAB\u6765\u81EA\u672C\u5730\uFF0C\u4E0D\u7EE7\u627F\u81EA\u8EAB\u3002" })), (0, import_react5.createElement)("div", { className: "dmm-grid" }, renderField("type"), renderField("preset"))), (0, import_react5.createElement)("section", { className: "dmm-card" }, (0, import_react5.createElement)("div", { className: "dmm-section-head" }, (0, import_react5.createElement)("h3", null, "\u9002\u7528\u8303\u56F4"), (0, import_react5.createElement)(HelpInfo, { label: "\u540D\u5355\u914D\u7F6E\u8BF4\u660E", text: "\u70B9\u51FB\u540D\u5355\u9009\u62E9\u4F5C\u7528\u57DF\uFF0C\u53EF\u7EC4\u5408\u591A\u4E2A\u8303\u56F4\uFF1B\u767D\u540D\u5355\u547D\u4E2D\u4EFB\u4E00\u9879\u4E14\u672A\u547D\u4E2D\u9ED1\u540D\u5355\u624D\u9002\u7528\u3002\u767D\u540D\u5355\u4E3A\u7A7A\u65F6\u4E0D\u9002\u7528\u4EFB\u4F55\u8303\u56F4\u3002" })), (0, import_react5.createElement)("div", { className: "dmm-grid" }, renderField("whitelist"), renderField("blacklist"))), ...["store", "retrieve"].map((mode) => (0, import_react5.createElement)("section", { className: "dmm-card", key: mode }, (0, import_react5.createElement)("div", { className: "dmm-section-head" }, (0, import_react5.createElement)("h3", null, mode === "store" ? "\u5B58\u50A8 store" : "\u8BFB\u53D6 retrieve"), (0, import_react5.createElement)("button", { disabled: busy, onClick: () => removeMode(mode) }, mode === "store" ? "\u79FB\u9664\u672C\u5730\u5B58\u50A8\u914D\u7F6E" : "\u79FB\u9664\u672C\u5730\u8BFB\u53D6\u914D\u7F6E"), (0, import_react5.createElement)(HelpInfo, { label: mode + "\u914D\u7F6E\u8BF4\u660E", text: "\u5206\u522B\u9009\u62E9\u65F6\u673A\u3001\u7EC4\u5408\u6761\u4EF6\u4E0E\u987A\u5E8F\u7B56\u7565\u3002\u9009\u9879\u76EE\u5F55\u6765\u81EA\u771F\u5B9E\u6CE8\u518C\u80FD\u529B\uFF1B\u6765\u6E90\u56FA\u5B9A\u7B56\u7565\u6309\u6574\u4F53\u9009\u62E9\u3002\u6821\u9A8C\u4E0D\u6267\u884C\u4E8B\u4EF6\u3001\u6761\u4EF6\u6216\u64CD\u4F5C\u3002" })), (0, import_react5.createElement)("p", { className: "dmm-muted" }, "\u79FB\u9664\u672C\u5730\u914D\u7F6E\u53EA\u79FB\u9664\u8BE5\u6A21\u5F0F\u7684\u89C4\u5219\u8986\u76D6\uFF0C\u56DE\u5230\u9884\u8BBE\u6216\u9ED8\u8BA4\u503C\uFF1B\u8D44\u6E90\u6B63\u6587\u4E0D\u4F1A\u5220\u9664\u3002"), (0, import_react5.createElement)("div", { className: "dmm-grid" }, ...["on", "rule", "strategy"].map((part) => renderField(mode + "." + part))))), (0, import_react5.createElement)(Diagnostics, { report }), notice && (0, import_react5.createElement)("div", { className: "dmm-status", role: "status" }, notice), (0, import_react5.createElement)("div", { className: "dmm-sticky-actions" }, (0, import_react5.createElement)("div", { className: "dmm-actions" }, (0, import_react5.createElement)("button", { disabled: busy, onClick: () => submit(false) }, busy ? "\u6B63\u5728\u5904\u7406\u2026" : "\u6821\u9A8C\u914D\u7F6E"), (0, import_react5.createElement)("button", { className: "dmm-primary", disabled: busy || !dirty, onClick: () => submit(true) }, "\u4FDD\u5B58\u7BA1\u7406\u914D\u7F6E\uFF08\u5199\u5165\u6587\u4EF6\uFF09"), (0, import_react5.createElement)(HelpInfo, { label: "\u4FDD\u5B58\u7BA1\u7406\u914D\u7F6E\u8BF4\u660E", text: "\u4FDD\u5B58\u4F1A\u91CD\u65B0\u6821\u9A8C\u5E76\u68C0\u67E5\u914D\u7F6E\u7248\u672C\u548C\u78C1\u76D8\u53D8\u5316\uFF0C\u901A\u8FC7\u540E\u539F\u5B50\u5199\u5165\u65B0\u7248\u672C\u3002\u6821\u9A8C\u4E0D\u6388\u4E88\u8D44\u6E90\u6743\u9650\uFF1B\u4E0D\u652F\u6301\u6216\u672A\u6CE8\u518C\u7684\u80FD\u529B\u4F1A\u660E\u786E\u62A5\u9519\uFF0C\u65E0\u6CD5\u9759\u6001\u786E\u8BA4\u7684\u4E8B\u4EF6\u4E0A\u4E0B\u6587\u4E0E\u6743\u9650\u6807\u8BB0\u4E3A\u672A\u9A8C\u8BC1\u3002\u5931\u8D25\u4FDD\u7559\u6709\u6548\u914D\u7F6E\u548C\u672C\u9875\u8349\u7A3F\u3002" }))), (0, import_react5.createElement)(ContentEditor, { row, sessionId, onChange, onDirty: setContentDirty }), sessionId && (0, import_react5.createElement)("section", { className: "dmm-card" }, (0, import_react5.createElement)("h3", null, "\u5E94\u7528\u8BB0\u5F55"), (0, import_react5.createElement)("p", { className: "dmm-muted" }, `${labels[row.status]} \xB7 ${row.applied ? "\u6709\u5E94\u7528\u8BC1\u636E" : "\u65E0\u5E94\u7528\u8BC1\u636E"}`), row.facts.length ? (0, import_react5.createElement)("pre", null, row.facts.map((f) => `${f.phase} \xB7 ${f.turnKind} ${f.turn ?? "\u2014"} \xB7 ${f.detail ?? f.reason ?? ""}`).join("\n")) : (0, import_react5.createElement)("p", null, "\u5F53\u524D\u7B5B\u9009\u8303\u56F4\u6CA1\u6709\u6765\u6E90\u89E6\u53D1\u8BB0\u5F55\u3002")))));
}
function Panel(props) {
  return (0, import_react5.createElement)(ScopedPanel, { ...props, key: JSON.stringify([props.sessionId ?? null]) });
}
function ScopedPanel({ sessionId, onClose }) {
  const [data, setData] = (0, import_react5.useState)(null), [error, setError] = (0, import_react5.useState)(null), [filters, setFilters] = (0, import_react5.useState)(emptyFilters), [page, setPage] = (0, import_react5.useState)("table"), [selected, setSelected] = (0, import_react5.useState)(null), [version, setVersion] = (0, import_react5.useState)(0), [notice, setNotice] = (0, import_react5.useState)(""), [reloadError, setReloadError] = (0, import_react5.useState)(null), [reloading, setReloading] = (0, import_react5.useState)(false);
  const lifecycle = (0, import_react5.useRef)(null), element = (0, import_react5.useRef)(null), tableScroll = (0, import_react5.useRef)([]), tableLeft = (0, import_react5.useRef)(0), filterData = (0, import_react5.useRef)(null);
  (0, import_react5.useEffect)(() => {
    const ctrl = new AbortController();
    lifecycle.current = ctrl;
    return () => ctrl.abort();
  }, []);
  (0, import_react5.useEffect)(() => {
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
  return (0, import_react5.createElement)("section", { ref: element, className: "dmm", "aria-label": sessionId ? "\u4F1A\u8BDD\u8BB0\u5FC6\u7BA1\u7406" : "\u5168\u5C40\u8BB0\u5FC6\u7BA1\u7406" }, onClose && (0, import_react5.createElement)("div", { className: "dmm-actions" }, (0, import_react5.createElement)("button", { className: "dmm-close", onClick: onClose, "aria-label": "\u5173\u95ED\u8BB0\u5FC6\u7BA1\u7406" }, "\xD7")), page === "detail" ? (0, import_react5.createElement)(DetailPage, { key: JSON.stringify([selected.adapterId, selected.id]), row: activeRow, sessionId, liveRevision: data?.revision, onBack: back, onChange: () => setVersion((v) => v + 1) }) : page === "adapters" ? (0, import_react5.createElement)(AdaptersPage, { onBack: back, onChange: () => setVersion((v) => v + 1) }) : page === "filters" ? (0, import_react5.createElement)(FiltersPage, { data: filterData.current, sessionId, filters, setFilters, onBack: back }) : (0, import_react5.createElement)("div", { "data-page": "table" }, (0, import_react5.createElement)("div", { className: "dmm-heading" }, (0, import_react5.createElement)("h2", null, "\u8BB0\u5FC6\u7BA1\u7406"), (0, import_react5.createElement)("span", { className: "dmm-muted" }, `${data?.rows.length ?? "\u2026"} \u9879\u8D44\u6E90`)), (0, import_react5.createElement)("p", { className: "dmm-muted" }, sessionId ? "\u5F53\u524D\u4F1A\u8BDD \xB7 \u8D44\u6E90\u4E0E\u7BA1\u7406\u914D\u7F6E" : "\u5168\u5C40\u8D44\u6E90 \xB7 \u7BA1\u7406\u914D\u7F6E\u6982\u89C8"), (0, import_react5.createElement)("div", { className: "dmm-toolbar" }, (0, import_react5.createElement)("div", { className: "dmm-actions" }, (0, import_react5.createElement)("button", { onClick: reload, disabled: reloading }, reloading ? "\u6B63\u5728\u8BFB\u53D6\u2026" : "\u91CD\u65B0\u8BFB\u53D6\u7BA1\u7406\u914D\u7F6E"), (0, import_react5.createElement)(HelpInfo, { label: "\u91CD\u65B0\u8BFB\u53D6\u7BA1\u7406\u914D\u7F6E\u8BF4\u660E", text: "\u8BFB\u53D6\u670D\u52A1\u7AEF\u5DF2\u4FDD\u5B58\u7684\u7BA1\u7406\u89C4\u5219\u4E0E\u9884\u8BBE\u3002\u6587\u4EF6\u5185\u5BB9\u672A\u53D8\u65F6\u4FDD\u6301\u5F53\u524D\u7248\u672C\uFF1B\u6B64\u64CD\u4F5C\u4E0D\u91CD\u65B0\u52A0\u8F7D\u4F1A\u8BDD\u6216\u8D44\u6E90\u5185\u5BB9\u3002" })), (0, import_react5.createElement)("div", { className: "dmm-actions" }, (0, import_react5.createElement)("button", { onClick: () => navigate("adapters") }, "Adapter"), (0, import_react5.createElement)("button", { onClick: () => navigate("filters"), "aria-label": `\u7B5B\u9009\u8D44\u6E90\uFF0C${count} \u9879\u5DF2\u542F\u7528` }, "\u7B5B\u9009", count > 0 && (0, import_react5.createElement)("span", { className: "dmm-badge" }, count)))), notice && (0, import_react5.createElement)("p", { className: "dmm-status", role: "status" }, notice), (0, import_react5.createElement)(ErrorBox, { error }), configurationError && (0, import_react5.createElement)(ErrorBox, { error: `\u914D\u7F6E\u672A\u5207\u6362\uFF1B\u6CBF\u7528\u7248\u672C ${data?.revision ?? "\u5F85\u786E\u8BA4"}\u3002${configFailure(configurationError)}` }), ...(data?.diagnostics ?? []).map((d, i) => (0, import_react5.createElement)("p", { key: i, className: "dmm-error", role: "status" }, `${d.adapterId ?? ""}\uFF1A${d.message}`)), !data ? (0, import_react5.createElement)("p", null, "\u6B63\u5728\u8BFB\u53D6\u6765\u6E90\u2026") : data.rows.length ? (0, import_react5.createElement)(Table, { data, onDetail: (row) => navigate("detail", row) }) : (0, import_react5.createElement)("div", { className: "dmm-empty" }, "\u5F53\u524D\u8303\u56F4\u548C\u7B5B\u9009\u6761\u4EF6\u4E0B\u6CA1\u6709\u53EF\u89C1\u8D44\u6E90\u3002"), data && (0, import_react5.createElement)("details", { className: "dmm-catalogs", open: !data.rows.length }, (0, import_react5.createElement)("summary", null, `\u67E5\u8BE2\u8303\u56F4\uFF1A${sessionId ? "\u5F53\u524D\u4F1A\u8BDD" : "\u5168\u5C40"} \xB7 \u5DF2\u63A5\u5165 ${data.adapters.length} \u4E2A\u8D44\u6E90\u63D0\u4F9B\u65B9`), ...(data.catalogs ?? []).map((c) => (0, import_react5.createElement)("p", { key: c.adapterId }, `${sourceName(data, c.adapterId)}\uFF1A${c.count === null ? "\u8BFB\u53D6\u5931\u8D25" : `\u8FD4\u56DE ${c.count} \u9879`}\u3002${c.description ?? ""}`)))));
}
var { Header, SessionEntry } = createSessionEntries(Panel);
function apply(ctx) {
  ctx.effect(() => {
    const style = document.createElement("style");
    style.textContent = css;
    document.head.append(style);
    return () => style.remove();
  });
  ctx.slots.inject("settings.section", () => ctx.slots.register({ name: "settings.section", id: "dsh-memory-manager", label: "\u8BB0\u5FC6\u7BA1\u7406", order: 70 }, Panel));
  ctx.slots.inject("conversation.session.header.actions", () => ctx.slots.register({ name: "conversation.session.header.actions", id: "dsh-memory-manager", order: 70 }, Header));
  ctx.slots.inject("shell.overlay", () => ctx.slots.register({ name: "shell.overlay", id: "dsh-memory-manager-session-entry", order: 70 }, SessionEntry));
}

return module.exports;}});
