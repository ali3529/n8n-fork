# Phase 1 Architecture Decisions

Status: implementation baseline; NetSuite account identifiers remain environment configuration.

## Product boundary

Phase 1 automates internal NetSuite work only. It does not accept public webhooks, manage third-party OAuth credentials, or provide generic HTTP connector nodes.

The first supported trigger record types are Customer, Sales Order, and Invoice. The node registry is designed to add record types without changing the workflow schema. OneWorld subsidiaries are not hard-coded; NetSuite role and subsidiary permissions remain authoritative.

The application uses a dedicated `iPaaS Administrator` custom role. Workflow runtime scripts execute with deployment permissions constrained to the record types and fields approved for automation. NetSuite account and sandbox IDs are configured through SuiteCloud CLI authentication and are never committed.

## Workflow lifecycle

- `DRAFT`: mutable and owned by a revision number used for optimistic concurrency.
- `PUBLISHED`: immutable, validated workflow version.
- `ACTIVE`: published version eligible for trigger lookup.
- `INACTIVE`: published version retained but excluded from trigger lookup.
- `ARCHIVED`: retained for audit and unavailable for editing or activation.

Editing a published workflow creates a new draft. Activation always targets an explicit published version. At most one version of a workflow may be active for a given trigger binding.

## Trigger semantics

Record triggers run from `afterSubmit`. The User Event script only checks trigger bindings and enqueues asynchronous work; it does not execute the graph inline.

Updated-record triggers declare watched fields. A workflow is queued only when at least one watched value changed. The idempotency key is a SHA-256 hash of the workflow version, trigger binding, record type, record ID, operation, and normalized watched-field values. A custom-record external ID enforces uniqueness. An identical retry returns the existing execution rather than starting another.

Scheduled triggers store an IANA timezone and a schedule expression. Missed schedules do not backfill by default. A future version may add an explicit catch-up policy.

## Safety limits

| Limit | Phase 1 value |
|---|---:|
| Nodes per workflow | 100 |
| Edges per workflow | 200 |
| Serialized graph size | 1 MB |
| Map/loop items | 1,000 |
| Saved-search results per execution | 1,000 |
| Step input/output summary | 25 KB each |
| Maximum execution wall time | 15 minutes before continuation |
| Governance safety threshold | 200 remaining units |
| Execution log retention | 90 days |

The engine stops before the governance safety threshold and creates a continuation task when the current node supports continuation. Otherwise it fails with a stable `GOVERNANCE_LIMIT` error.

## Logging and redaction

Logs contain correlation IDs, workflow/version IDs, node IDs, status, duration, governance usage, and bounded input/output summaries. They must not contain credentials, tokens, session identifiers, complete email bodies, payment data, or unapproved record fields.

Fields named `authorization`, `token`, `secret`, `password`, `apikey`, or `cookie` are always redacted case-insensitively. Email addresses are masked in summaries. Raw NetSuite exception objects and stack traces remain in restricted script logs and are not returned to the browser.

## Decisions deferred to account configuration

- Sandbox and production account IDs.
- Internal IDs for approved saved searches.
- Final field allowlists per supported record type.
- Role assignment and subsidiary restrictions for each customer account.

These values do not change the workflow JSON schema or lifecycle semantics.
