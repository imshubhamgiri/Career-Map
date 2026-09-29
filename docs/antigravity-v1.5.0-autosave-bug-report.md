# Bug Report: `InlineDiffManager` Auto-Rejects All Agent Edits After 1 Second When `files.autoSave: "afterDelay"` Is Enabled

## 1. Environment & Version Info
- **Extension**: `google.google-antigravity` (`v1.5.0`)
- **CLI / Sidecar Binary**: `agy.exe` (`v1.2.12`)
- **Host IDE**: Microsoft VS Code (`win32-x64`)
- **Triggering Setting**: `"files.autoSave": "afterDelay"` (VS Code's most common auto-save mode, default delay `1000ms`) + `"antigravity.enableInlineDiff": true` (default in `v1.5.0`)

---

## 2. Summary of the Issue
When a user has `"files.autoSave": "afterDelay"` enabled in VS Code (which triggers an automatic save `1000ms` after any buffer modification) and `antigravity.enableInlineDiff` is enabled (the default in `v1.5.0`), **every file edit made by the Antigravity agent is automatically rejected and reverted to its original content after 1 second**.

From the user's perspective:
1. The agent finishes editing one or more files.
2. The **Accept / Reject** button pops up for `< 1 second` and immediately vanishes before the user can click it.
3. All modified files on disk are reverted back to their pre-edit contents.

---

## 3. Root Cause Analysis (`extension.js`)

In `google.google-antigravity@1.5.0/extension.js`, `InlineDiffZoneRenderer` delegates diff rendering to `InlineDiffManager`.

### Step 1: `registerDiff()` dirties the `TextDocument` buffer in memory
When an agent edit arrives (`AddAgentEdit`), `InlineDiffManager.registerDiff()` opens the target `TextDocument` and replaces its in-memory buffer with `activeDiff.combinedText` (which interleaves `originalText` deletions and `modifiedText` insertions so red/green line decorations can be drawn):

```javascript
// extension.js — InlineDiffManager.prototype.registerDiff
const document = await vscode.workspace.openTextDocument(uri);
const changes = new inline_diff_changes_1.InlineDiffChanges();
const activeDiff = {
    uri,
    originalText,
    modifiedText,
    combinedText: (0, diff_helper_1.getTextWithHunks)(originalText, hunks),
    changes,
    hasBeenShown: true,
};
this.activeDiffs.set(key, activeDiff);
await this.applyContentReplacement(document, activeDiff.combinedText);
```

Because `applyContentReplacement` uses `vscode.workspace.applyEdit` without saving the document, **VS Code marks `document.isDirty = true` and starts its `1000ms` `afterDelay` Auto-Save timer.**

### Step 2: `handleDocumentWillSave()` intercepts `AfterDelay` auto-save and reverts buffer to `originalText`
Exactly `1000ms` later, VS Code fires `vscode.workspace.onWillSaveTextDocument` with `event.reason = vscode.TextDocumentSaveReason.AfterDelay` (`2`).

`InlineDiffManager.handleDocumentWillSave(event)` intercepts this event and treats any non-manual save (`event.reason !== vscode.TextDocumentSaveReason.Manual`) as a revert:

```javascript
// extension.js — InlineDiffManager.prototype.handleDocumentWillSave
// Auto-saves (AfterDelay / FocusOut): revert buffer so disk remains clean and reject diff.
if (event.reason != null &&
    event.reason !== vscode.TextDocumentSaveReason.Manual) {
    this.pendingAutoSaveUris.add(normalizedKey);
    event.waitUntil(Promise.resolve([
        vscode.TextEdit.replace(fullRange, activeDiff.originalText),
    ]));
    return;
}
```

### Step 3: `handleDocumentDidSave()` calls `finalizeFile(key, false)`, rejecting the diff
Immediately after `onWillSaveTextDocument` completes, VS Code writes `originalText` to disk and fires `vscode.workspace.onDidSaveTextDocument`:

```javascript
// extension.js — InlineDiffManager.prototype.handleDocumentDidSave
const isManualSave = this.pendingManualSaveUris.delete(normalizedKey); // false
const isAutoSave = this.pendingAutoSaveUris.delete(normalizedKey);     // true
if (!isManualSave && !isAutoSave) {
    return;
}
const key = document.uri.toString();
const activeDiff = this.getActiveDiff(key);
if (activeDiff) {
    // BUG: passes isManualSave (false), which calls finalizeFile(key, false)
    // and fires onDidFinalizeFile({ uri, accepted: false }), rejecting the diff!
    this.finalizeFile(key, isManualSave).catch((e) => {
        console.error('[Antigravity] Error finalizing file on save:', e);
    });
}
```

Because `isManualSave` is `false`, `this.finalizeFile(key, false)` is called, which:
1. Deletes the active diff session (`this.activeDiffs.delete(key)`).
2. Clears all inline diff decorations and CodeLenses (`Accept` / `Reject`).
3. Fires `onDidFinalizeFileEmitter.fire({ uri: activeDiff.uri, accepted: false })`, which notifies `AgentEditManager.handleHunkResolved` that the user rejected the file, wiping out `fileDiffs` in the webview (`SetFileDiffs: []`).

---

## 4. Evidence from Extension Host RPC Logs (`2-Antigravity.log`)

When the agent edited 5 files sequentially, `SetFileDiffs` (`requestId: 6..10`) populated the diff list, and `1000ms` later `handleDocumentDidSave` triggered `SetFileDiffs` (`requestId: 12..16`) removing every file until `fileDiffs: []`:

```text
[main] => {"requestId":10,"rpcPath":"/gemini_coder.agent_ui_toolkit.iframe.AntigravityApi/SetFileDiffs","payload":{"fileDiffs":[ ... 5 files ... ]}}
[main] => {"requestId":24,"rpcPath":"/gemini_coder.agent_ui_toolkit.iframe.ExtensionApi/AddAgentEdit","payload":{}}
[main] => {"requestId":23,"rpcPath":"/gemini_coder.agent_ui_toolkit.iframe.ExtensionApi/AddAgentEdit","payload":{}}
[main] => {"requestId":25,"rpcPath":"/gemini_coder.agent_ui_toolkit.iframe.ExtensionApi/AddAgentEdit","payload":{}}
[main] => {"requestId":26,"rpcPath":"/gemini_coder.agent_ui_toolkit.iframe.ExtensionApi/AddAgentEdit","payload":{}}
[main] => {"requestId":12,"rpcPath":"/gemini_coder.agent_ui_toolkit.iframe.AntigravityApi/SetFileDiffs","payload":{"fileDiffs":[ ... 4 files ... ]}}
[main] => {"requestId":13,"rpcPath":"/gemini_coder.agent_ui_toolkit.iframe.AntigravityApi/SetFileDiffs","payload":{"fileDiffs":[ ... 3 files ... ]}}
[main] => {"requestId":14,"rpcPath":"/gemini_coder.agent_ui_toolkit.iframe.AntigravityApi/SetFileDiffs","payload":{"fileDiffs":[ ... 2 files ... ]}}
[main] => {"requestId":15,"rpcPath":"/gemini_coder.agent_ui_toolkit.iframe.AntigravityApi/SetFileDiffs","payload":{"fileDiffs":[ ... 1 file ... ]}}
[main] => {"requestId":16,"rpcPath":"/gemini_coder.agent_ui_toolkit.iframe.AntigravityApi/SetFileDiffs","payload":{"fileDiffs":[]}}
```

---

## 5. Proposed Fix for the Antigravity Extension Team

### Fix Option 1: Save `combinedText` in `registerDiff()` via `internalSaveUris` or restore `combinedText` after auto-save without finalizing
The reason `registerDiff` triggers `AfterDelay` auto-save is that `applyContentReplacement(document, activeDiff.combinedText)` leaves `document.isDirty === true`.
- Instead of calling `this.finalizeFile(key, false)` on `TextDocumentSaveReason.AfterDelay` / `FocusOut` (which destroys the review session), `handleDocumentWillSave` should write `activeDiff.modifiedText` (or `activeDiff.originalText`) to disk **and** `handleDocumentDidSave` should **re-apply `activeDiff.combinedText` decorations without calling `finalizeFile`**, or
- `InlineDiffManager` should temporarily suppress/defer auto-save on files in `this.activeDiffs`, or save during `applyContentReplacement` while `this.internalSaveUris.has(normalizedKey)` is active so the buffer is not left dirty after `registerDiff()`.

### Fix Option 2: Fall back to `SideBySideDiffZoneRenderer` when `files.autoSave === "afterDelay"`
In `extension.js` where `AgentEditManager` selects the renderer:
```javascript
const config = vscode.workspace.getConfiguration('antigravity');
const autoSave = vscode.workspace.getConfiguration('files').get('autoSave');
const useInline = config.get('enableInlineDiff', true) && autoSave !== 'afterDelay';
return useInline
    ? new inline_diff_zone_renderer_1.InlineDiffZoneRenderer()
    : new side_by_side_diff_zone_renderer_1.SideBySideDiffZoneRenderer();
```

---

## 6. Local Workaround Applied
Adding the following setting to VS Code's `settings.json` switches `AgentEditManager` to `SideBySideDiffZoneRenderer`, allowing `"files.autoSave": "afterDelay"` to stay enabled without auto-rejecting agent edits:

```json
"antigravity.enableInlineDiff": false
```
