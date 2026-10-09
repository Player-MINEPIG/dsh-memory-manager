# Sessionless source previews

[简体中文](SOURCE_PREVIEW.md)

The managed-source bridge supports opening world-book previews before a DSH session exists. A source's `getManagementDefaults({id,scope})` may return an optional `previewScope: {characterId?,presetId?,userId?}` for a valid selected-resource binding. Each ID must be a nonempty string. This is a trusted Host receipt, not browser input or persisted configuration.

The snapshot's `checkCurrent()` must cover preview lifetime, draft revision, current selection and resource revision. The Manager uses these scope facts only for source callbacks marked `event.preview === true` without a sessionId. Ordinary sessionless source requests without binding proof retain their existing scope restrictions.

Source defaults authorize only the bound resource. Explicit empty whitelists, blacklists, disabled sources, empty retrieve policies and deny rules remain effective. Character, preset and Persona selectors use the IDs in the receipt. Changes or preview completion expire the lease. This field grants no generic usage permission, creates no session and stores no global grant. This preview feature requires the source to provide the binding information above.
