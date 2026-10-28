# Assessment save recovery

Timed practice, diagnostics, and assessment previews share one versioned, in-memory write queue per mounted account/assessment workspace. Server identity, ownership, scoring, deadlines and publication gates are unchanged.

## Behavior
- An edit updates the visible answer/flag/note immediately and records its latest complete payload. Notes are controlled inputs and enter the queue as they change, rather than waiting for blur.
- Writes are serialized. Superseded unsent edits are coalesced; an acknowledgement for an older edit never clears its newer replacement. “All changes saved” appears only after every current edit is acknowledged. Saving status remains visible on compact screens.
- Background reads overlay pending/failed work, and sequence/revision guards ignore out-of-order active frames. A locked or advanced server frame remains authoritative.
- A connection failure retains editable work in the open workspace. An explicit retry control and an online event can resend the latest failed payloads. Submission drains/retries the queue before locking and uses the latest local snapshot.
- Unsent changes from a server-locked module remain inspectable and explicitly ungraded; they do not block the next diagnostic module. Server-confirmed matching content is not falsely labelled unsent.
- A native before-unload prompt asks before closing/reloading with unresolved work. It is an interruption guard, not persistence: accepting the navigation, an internal route change, a crash, or closing the browser may lose unsaved changes. Durable owner-scoped offline storage and cross-device conflict resolution remain open acceptance work.

## Boundaries
The queue contains only the learner's own response strings, flags and notes. It never receives author answer keys or decides correctness. Server validation still rejects foreign assessments, wrong modules/questions, and late writes. No local retry can reopen a submitted module or count unreceived work as a learning attempt.

## Verification
Unit tests exercise acknowledgement order, queued-edit coalescing, failure/retry, drain races, scope checks, lock handling and retirement of old module changes. Browser tests use real assessment endpoints with selectively delayed/failed network requests; they inspect server state rather than inferring persistence from the UI. They cover delayed saves, failures, stale reads, final acknowledgements, native close cancellation, connection-restored retry, deadline expiry, and diagnostic advancement. Error/retry controls are checked for axe violations and overflow at 1440/820/390px. See ../evidence/assessment-sync/VERIFICATION.txt for observed commands/results, preserved failures and component-only rollback.
