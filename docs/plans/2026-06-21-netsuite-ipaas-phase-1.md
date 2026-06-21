# NetSuite iPaaS Phase 1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build and deploy a NetSuite-native visual workflow builder that creates, validates, tests, publishes, triggers, and executes internal NetSuite workflows.

**Architecture:** A React/TypeScript SPA runs from the NetSuite File Cabinet and communicates with SuiteScript 2.1 RESTlets. Published immutable workflow versions are stored in custom records; trigger scripts enqueue executions; a deterministic DAG engine executes registered node handlers and records sanitized traces.

**Tech Stack:** React, TypeScript, Vite, `@xyflow/react`, Zustand, Zod, Vitest, React Testing Library, SuiteScript 2.1, SuiteCloud Development Framework (SDF), Jest/SuiteCloud Unit Testing.

---

## Scope and completion criteria

Phase 1 includes:

- Visual workflow canvas with connectable trigger, action, and logic nodes.
- Draft save, schema validation, publish, versioning, and activation.
- Record-created, record-updated, and scheduled triggers.
- Send-email, load-record, update-field, saved-search, and invoice-status actions.
- If/Else, Switch/Router, and Loop/Map control flow with enforced iteration limits.
- Data mapping from previous node outputs into downstream inputs.
- Test runs with selected or mock records and inline execution traces.
- SDF deployment, role permissions, audit logs, governance limits, and operational documentation.

Phase 1 excludes external webhooks, OAuth, third-party connectors, and generic HTTP nodes.

Definition of done:

- A NetSuite administrator can build, save, validate, test, publish, activate, and deactivate a workflow without writing SuiteScript.
- A valid trigger starts the correct immutable workflow version exactly once for the same trigger event.
- Execution order is deterministic, cycles are rejected, node inputs are validated, and loop limits are enforced.
- Failures are visible in both NetSuite execution records and the editor without exposing secrets or sensitive record data.
- Automated tests pass and a sandbox deployment plus smoke test succeeds.

## Proposed repository layout

```text
netsuite-ipaas/
  package.json
  pnpm-workspace.yaml
  apps/builder/
    src/components/
    src/features/workflows/
    src/lib/
    src/stores/
    src/test/
  packages/workflow-schema/
    src/
    test/
  packages/suitescript/
    src/FileCabinet/SuiteScripts/iPaaS/
      restlets/
      suitelets/
      triggers/
      engine/
      nodes/
      repositories/
    test/
  suitecloud/
    objects/
    deploy.xml
    manifest.xml
  docs/
```

## Milestone 0: Resolve product and NetSuite decisions

### Task 1: Approve the Phase 1 contracts

**Files:**

- Create: `netsuite-ipaas/docs/architecture/phase-1-decisions.md`
- Create: `netsuite-ipaas/docs/architecture/workflow-lifecycle.md`

**Steps:**

1. Document supported NetSuite record types, roles, subsidiaries, and sandbox account.
2. Define workflow states: `DRAFT`, `PUBLISHED`, `ACTIVE`, `INACTIVE`, and `ARCHIVED`.
3. Decide that published versions are immutable and editing creates a new draft version.
4. Define trigger idempotency keys and behavior for concurrent record updates.
5. Define maximum nodes, execution duration, loop iterations, log size, and retention period.
6. Define what record data may appear in logs and establish redaction rules.
7. Review the decisions with the NetSuite administrator and product owner.
8. Commit: `docs: define phase one workflow contracts`.

**Acceptance:** No open decision can change the workflow JSON format, record model, or trigger semantics.

## Milestone 1: Project foundation

### Task 2: Scaffold the workspace and quality gates

**Files:**

- Create: `netsuite-ipaas/package.json`
- Create: `netsuite-ipaas/pnpm-workspace.yaml`
- Create: `netsuite-ipaas/tsconfig.base.json`
- Create: `netsuite-ipaas/apps/builder/vite.config.ts`
- Create: `netsuite-ipaas/packages/suitescript/suitecloud.config.js`
- Create: `netsuite-ipaas/.github/workflows/ci.yml`

**Steps:**

1. Initialize the pnpm workspace.
2. Install React, Vite, TypeScript, React Flow, Zustand, Zod, and test dependencies.
3. Install SuiteCloud CLI, unit-testing tools, and NetSuite type definitions.
4. Add scripts for `lint`, `typecheck`, `test`, `build`, and SDF validation.
5. Add a failing smoke test for the builder entry point.
6. Create the minimal application entry point and make the smoke test pass.
7. Run `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.
8. Commit: `chore: scaffold phase one workspace`.

**Acceptance:** A clean checkout installs and passes all local and CI checks.

### Task 3: Establish SDF sandbox deployment

**Files:**

- Create: `netsuite-ipaas/suitecloud/manifest.xml`
- Create: `netsuite-ipaas/suitecloud/deploy.xml`
- Create: `netsuite-ipaas/docs/runbooks/sandbox-deployment.md`

**Steps:**

1. Configure SuiteCloud CLI authentication for a sandbox without committing credentials.
2. Define File Cabinet destinations for SPA assets and SuiteScript files.
3. Add the Suitelet, RESTlet, User Event, Scheduled, and Map/Reduce script objects as disabled placeholders.
4. Run SDF project validation and capture required account features.
5. Deploy placeholders to sandbox.
6. Verify scripts and files appear with the intended IDs and deployments.
7. Document deploy, rollback, and credential setup commands.
8. Commit: `chore: establish sandbox sdf deployment`.

**Acceptance:** A repeatable command validates and deploys the empty application to sandbox.

## Milestone 2: Shared workflow contract

### Task 4: Define and test the workflow JSON schema

**Files:**

- Create: `netsuite-ipaas/packages/workflow-schema/src/workflow.ts`
- Create: `netsuite-ipaas/packages/workflow-schema/src/nodes.ts`
- Create: `netsuite-ipaas/packages/workflow-schema/src/index.ts`
- Test: `netsuite-ipaas/packages/workflow-schema/test/workflow.test.ts`

**Steps:**

1. Write failing tests for valid metadata, nodes, edges, positions, node configuration, and schema version.
2. Add failing tests for duplicate node IDs, dangling edges, multiple trigger nodes, unknown node types, and cycles.
3. Implement Zod schemas and serializable TypeScript types.
4. Implement graph validation separately from shape validation.
5. Add stable error codes such as `INVALID_NODE`, `DANGLING_EDGE`, and `CYCLE_DETECTED`.
6. Add fixtures for every Phase 1 node and a representative complete workflow.
7. Run schema tests and type checking.
8. Commit: `feat: define versioned workflow schema`.

**Acceptance:** Frontend and backend consume the same versioned contract and invalid graphs return field-addressable errors.

### Task 5: Define the node catalog and runtime interfaces

**Files:**

- Create: `netsuite-ipaas/packages/workflow-schema/src/catalog.ts`
- Create: `netsuite-ipaas/packages/suitescript/src/FileCabinet/SuiteScripts/iPaaS/engine/types.ts`
- Test: `netsuite-ipaas/packages/workflow-schema/test/catalog.test.ts`

**Steps:**

1. Write failing tests for catalog uniqueness and required trigger/action metadata.
2. Define each node's type, category, label, input schema, output schema, configuration fields, and allowed connections.
3. Define runtime `ExecutionContext`, `NodeResult`, `ExecutionTrace`, and `NodeHandler` interfaces.
4. Add catalog-to-handler completeness tests.
5. Run tests.
6. Commit: `feat: define phase one node catalog`.

**Acceptance:** Adding a node requires one catalog entry, one handler, and passing catalog completeness tests.

## Milestone 3: NetSuite persistence and API layer

### Task 6: Create custom records and permissions

**Files:**

- Create: `netsuite-ipaas/suitecloud/objects/customrecord_ipaas_workflow.xml`
- Create: `netsuite-ipaas/suitecloud/objects/customrecord_ipaas_workflow_version.xml`
- Create: `netsuite-ipaas/suitecloud/objects/customrecord_ipaas_execution.xml`
- Create: `netsuite-ipaas/suitecloud/objects/customrecord_ipaas_execution_step.xml`
- Create: `netsuite-ipaas/suitecloud/objects/customrecord_ipaas_trigger_binding.xml`
- Create: `netsuite-ipaas/suitecloud/objects/customrole_ipaas_admin.xml`

**Steps:**

1. Define workflow identity and lifecycle fields.
2. Store graph JSON on immutable version records, not the mutable workflow record.
3. Define execution status, correlation ID, idempotency key, timing, usage, and sanitized error fields.
4. Define step-level input/output summaries and governance usage.
5. Add indexes or searchable fields for active trigger lookup and idempotency checks.
6. Restrict records and scripts to the application administrator role.
7. Validate and deploy SDF objects.
8. Manually verify access with authorized and unauthorized test roles.
9. Commit: `feat: add workflow persistence records`.

**Acceptance:** Records enforce least privilege and support workflow versioning, trigger lookup, and execution audit queries.

### Task 7: Implement repository modules

**Files:**

- Create: `netsuite-ipaas/packages/suitescript/src/FileCabinet/SuiteScripts/iPaaS/repositories/workflowRepository.ts`
- Create: `netsuite-ipaas/packages/suitescript/src/FileCabinet/SuiteScripts/iPaaS/repositories/executionRepository.ts`
- Test: `netsuite-ipaas/packages/suitescript/test/repositories/*.test.ts`

**Steps:**

1. Write failing tests using mocked `N/record` and `N/search` modules.
2. Implement draft create/update with optimistic revision checking.
3. Implement publish as an immutable version transaction with compensating cleanup on failure.
4. Implement active workflow lookup by trigger type and record type.
5. Implement idempotent execution creation.
6. Implement sanitized step trace writes and retention search support.
7. Run tests.
8. Commit: `feat: implement workflow repositories`.

**Acceptance:** Concurrent draft saves are detected, published data is immutable, and duplicate execution keys do not create duplicate runs.

### Task 8: Implement RESTlet endpoints

**Files:**

- Create: `netsuite-ipaas/packages/suitescript/src/FileCabinet/SuiteScripts/iPaaS/restlets/workflowRestlet.ts`
- Create: `netsuite-ipaas/packages/suitescript/src/FileCabinet/SuiteScripts/iPaaS/restlets/apiResponse.ts`
- Test: `netsuite-ipaas/packages/suitescript/test/restlets/workflowRestlet.test.ts`

**Steps:**

1. Write failing tests for list, get, save draft, validate, publish, activate, deactivate, test-run, and execution-detail operations.
2. Require explicit operation names and validate every request body.
3. Enforce user/role authorization server-side.
4. Return consistent response envelopes, stable error codes, correlation IDs, and field errors.
5. Add pagination and result-size limits.
6. Ensure unexpected exceptions are logged but internal stack traces are not returned.
7. Run unit tests.
8. Commit: `feat: expose secured workflow restlet api`.

**Acceptance:** Every editor operation has a tested API, authorization check, validation, and predictable error contract.

## Milestone 4: Execution engine

### Task 9: Build deterministic graph traversal

**Files:**

- Create: `netsuite-ipaas/packages/suitescript/src/FileCabinet/SuiteScripts/iPaaS/engine/graph.ts`
- Test: `netsuite-ipaas/packages/suitescript/test/engine/graph.test.ts`

**Steps:**

1. Write failing tests for linear, branching, router, disconnected, and cyclic graphs.
2. Implement deterministic topological ordering with stable tie-breaking by node ID.
3. Reject unreachable action nodes and cycles before execution.
4. Return a compiled execution plan that identifies branch dependencies.
5. Run tests.
6. Commit: `feat: compile workflow graphs deterministically`.

**Acceptance:** The same graph always produces the same plan, and invalid graphs execute zero nodes.

### Task 10: Build expression and data-mapping evaluation

**Files:**

- Create: `netsuite-ipaas/packages/suitescript/src/FileCabinet/SuiteScripts/iPaaS/engine/dataMapping.ts`
- Create: `netsuite-ipaas/packages/suitescript/src/FileCabinet/SuiteScripts/iPaaS/engine/conditions.ts`
- Test: `netsuite-ipaas/packages/suitescript/test/engine/dataMapping.test.ts`

**Steps:**

1. Write failing tests for literals, previous-node references, nested paths, null values, comparisons, and type mismatches.
2. Define a small declarative expression format; do not evaluate JavaScript strings.
3. Implement safe path resolution and schema validation after mapping.
4. Implement comparison operators with explicit type behavior.
5. Reject unavailable outputs and unsafe property names.
6. Run tests.
7. Commit: `feat: add safe workflow data mapping`.

**Acceptance:** Users can map prior outputs without arbitrary code execution or silent type coercion.

### Task 11: Implement the execution coordinator

**Files:**

- Create: `netsuite-ipaas/packages/suitescript/src/FileCabinet/SuiteScripts/iPaaS/engine/executor.ts`
- Create: `netsuite-ipaas/packages/suitescript/src/FileCabinet/SuiteScripts/iPaaS/engine/nodeRegistry.ts`
- Test: `netsuite-ipaas/packages/suitescript/test/engine/executor.test.ts`

**Steps:**

1. Write failing tests for success, node failure, skipped branches, exhausted usage, timeout, and duplicate invocation.
2. Implement handler registration without dynamic script evaluation.
3. Execute compiled nodes with isolated validated inputs and immutable prior outputs.
4. Track remaining governance usage and stop before the configured safety threshold.
5. Record start, completion, skip, and failure traces with correlation IDs.
6. Implement continuation payloads for Map/Reduce processing when limits are reached.
7. Run tests.
8. Commit: `feat: execute workflows with governance controls`.

**Acceptance:** Execution is deterministic, auditable, idempotent, and stops safely before exceeding governance limits.

## Milestone 5: Phase 1 node handlers

### Task 12: Implement NetSuite action nodes

**Files:**

- Create: `netsuite-ipaas/packages/suitescript/src/FileCabinet/SuiteScripts/iPaaS/nodes/sendEmail.ts`
- Create: `netsuite-ipaas/packages/suitescript/src/FileCabinet/SuiteScripts/iPaaS/nodes/loadRecord.ts`
- Create: `netsuite-ipaas/packages/suitescript/src/FileCabinet/SuiteScripts/iPaaS/nodes/updateField.ts`
- Create: `netsuite-ipaas/packages/suitescript/src/FileCabinet/SuiteScripts/iPaaS/nodes/executeSavedSearch.ts`
- Create: `netsuite-ipaas/packages/suitescript/src/FileCabinet/SuiteScripts/iPaaS/nodes/checkInvoiceStatus.ts`
- Test: `netsuite-ipaas/packages/suitescript/test/nodes/*.test.ts`

**Steps:**

1. For each node, first write success, validation, permission, and NetSuite-error tests.
2. Implement `Load Record` with an explicit output-field allowlist.
3. Implement `Update Field` with record-type and field allowlists plus old/new values in the trace.
4. Implement `Send Email` with recipient validation and a test-mode adapter that never sends mail.
5. Implement `Execute Saved Search` with pagination and maximum-result limits.
6. Implement `Check Invoice Status` using documented status mappings.
7. Register handlers and satisfy catalog completeness tests.
8. Run all node tests.
9. Commit each handler separately using `feat(nodes): add <node name>`.

**Acceptance:** Every action has defined inputs/outputs, sandbox tests, usage estimates, permission behavior, and safe test-mode behavior.

### Task 13: Implement logic and flow nodes

**Files:**

- Create: `netsuite-ipaas/packages/suitescript/src/FileCabinet/SuiteScripts/iPaaS/nodes/ifElse.ts`
- Create: `netsuite-ipaas/packages/suitescript/src/FileCabinet/SuiteScripts/iPaaS/nodes/router.ts`
- Create: `netsuite-ipaas/packages/suitescript/src/FileCabinet/SuiteScripts/iPaaS/nodes/map.ts`
- Test: `netsuite-ipaas/packages/suitescript/test/nodes/logic.test.ts`

**Steps:**

1. Write failing tests for true/false branches and ordered router rules.
2. Implement If/Else and Router using the safe condition evaluator.
3. Write failing tests for empty arrays, maximum iterations, per-item failures, and output collection.
4. Implement Map with a hard iteration cap and governance checks.
5. Do not implement arbitrary graph cycles as loops; loops remain a bounded Map subflow.
6. Run tests.
7. Commit: `feat(nodes): add bounded logic and mapping nodes`.

**Acceptance:** Branch selection is deterministic and no workflow can create an unbounded loop.

## Milestone 6: Triggers and asynchronous execution

### Task 14: Implement record and schedule triggers

**Files:**

- Create: `netsuite-ipaas/packages/suitescript/src/FileCabinet/SuiteScripts/iPaaS/triggers/recordUserEvent.ts`
- Create: `netsuite-ipaas/packages/suitescript/src/FileCabinet/SuiteScripts/iPaaS/triggers/scheduledTrigger.ts`
- Create: `netsuite-ipaas/packages/suitescript/src/FileCabinet/SuiteScripts/iPaaS/triggers/executionMapReduce.ts`
- Test: `netsuite-ipaas/packages/suitescript/test/triggers/*.test.ts`

**Steps:**

1. Write failing tests distinguishing create, edit, and irrelevant User Event contexts.
2. Make User Event scripts perform only lookup, idempotency calculation, and queue submission; never run full workflows inline.
3. Compare configured watched fields before enqueueing updated-record workflows.
4. Implement scheduled trigger lookup with timezone and missed-run rules.
5. Implement Map/Reduce execution loading an immutable published version.
6. Add retry classification for transient versus permanent failures.
7. Run tests and deploy disabled scripts to sandbox.
8. Commit: `feat: add asynchronous phase one triggers`.

**Acceptance:** Record writes are not blocked by workflow execution, duplicate events are suppressed, and scheduled runs have explicit timezone semantics.

## Milestone 7: Visual builder

### Task 15: Implement the editor shell and workflow store

**Files:**

- Create: `netsuite-ipaas/apps/builder/src/features/workflows/WorkflowEditor.tsx`
- Create: `netsuite-ipaas/apps/builder/src/stores/workflowStore.ts`
- Create: `netsuite-ipaas/apps/builder/src/lib/workflowApi.ts`
- Test: `netsuite-ipaas/apps/builder/src/features/workflows/WorkflowEditor.test.tsx`

**Steps:**

1. Write failing tests for load, dirty state, save, conflict, and API errors.
2. Implement the RESTlet client with injected URL and CSRF/auth context from the Suitelet shell.
3. Implement normalized nodes/edges, undo/redo, dirty tracking, and optimistic revision state in Zustand.
4. Implement editor header actions: Save Draft, Validate, Run Test, Publish, Activate, and Deactivate.
5. Display lifecycle state and published version clearly.
6. Run component tests.
7. Commit: `feat(ui): add workflow editor shell`.

**Acceptance:** Draft edits are recoverable, concurrent-save conflicts are explicit, and publish/activation state cannot be confused with unsaved state.

### Task 16: Implement the canvas and node configuration forms

**Files:**

- Create: `netsuite-ipaas/apps/builder/src/features/workflows/WorkflowCanvas.tsx`
- Create: `netsuite-ipaas/apps/builder/src/features/workflows/NodePalette.tsx`
- Create: `netsuite-ipaas/apps/builder/src/features/workflows/NodeInspector.tsx`
- Create: `netsuite-ipaas/apps/builder/src/features/workflows/nodes/BaseNode.tsx`
- Test: `netsuite-ipaas/apps/builder/src/features/workflows/WorkflowCanvas.test.tsx`

**Steps:**

1. Write failing tests for adding, connecting, moving, selecting, configuring, and deleting nodes.
2. Implement the React Flow canvas, minimap, controls, keyboard navigation, and input/output handles.
3. Generate the palette and inspector forms from the shared node catalog.
4. Prevent invalid edge types and multiple trigger nodes while editing.
5. Highlight field-level and graph-level validation errors.
6. Add accessible labels, focus behavior, and keyboard deletion confirmation.
7. Run component and accessibility tests.
8. Commit: `feat(ui): add visual workflow canvas`.

**Acceptance:** All Phase 1 nodes can be configured without raw JSON and invalid connections receive immediate, understandable feedback.

### Task 17: Implement the data-mapping UI

**Files:**

- Create: `netsuite-ipaas/apps/builder/src/features/workflows/DataMappingEditor.tsx`
- Create: `netsuite-ipaas/apps/builder/src/features/workflows/AvailableOutputs.tsx`
- Test: `netsuite-ipaas/apps/builder/src/features/workflows/DataMappingEditor.test.tsx`

**Steps:**

1. Write failing tests for listing only upstream outputs and mapping them to compatible inputs.
2. Build the available-output tree from the compiled upstream graph and catalog schemas.
3. Support click-to-insert as the accessible baseline; add drag-and-drop as an enhancement.
4. Show source node, output path, expected type, and invalid/missing mappings.
5. Serialize mappings only in the shared declarative expression format.
6. Run tests.
7. Commit: `feat(ui): add typed node data mapping`.

**Acceptance:** A user can map `Customer Record -> Email` into an email recipient field and type errors are caught before publishing.

### Task 18: Implement test runs and execution traces

**Files:**

- Create: `netsuite-ipaas/apps/builder/src/features/workflows/TestRunDialog.tsx`
- Create: `netsuite-ipaas/apps/builder/src/features/workflows/ExecutionPanel.tsx`
- Test: `netsuite-ipaas/apps/builder/src/features/workflows/TestRunDialog.test.tsx`

**Steps:**

1. Write failing tests for record selection, mock input, pending state, polling, success, and failure.
2. Require an explicit real-record or mock-data selection before a test run.
3. Ensure test mode suppresses side effects by default; allow side effects only through an explicit sandbox-only control.
4. Poll execution status with backoff and a terminal timeout.
5. Render per-node state, duration, sanitized input/output summaries, and error messages.
6. Focus and highlight the failed node from an execution trace.
7. Run tests.
8. Commit: `feat(ui): add workflow testing and traces`.

**Acceptance:** Test runs cannot accidentally email or mutate production records, and failures identify the exact node and validation/runtime error.

## Milestone 8: NetSuite hosting and hardening

### Task 19: Serve the production SPA from a Suitelet

**Files:**

- Create: `netsuite-ipaas/packages/suitescript/src/FileCabinet/SuiteScripts/iPaaS/suitelets/builderSuitelet.ts`
- Modify: `netsuite-ipaas/apps/builder/vite.config.ts`
- Test: `netsuite-ipaas/packages/suitescript/test/suitelets/builderSuitelet.test.ts`

**Steps:**

1. Write failing tests for authorized access and environment configuration injection.
2. Configure Vite with relative/local assets and no external CDN dependencies.
3. Serve a fixed HTML shell and inject configuration as escaped JSON, not executable string concatenation.
4. Add cache-busted asset filenames and a deployment manifest.
5. Build, deploy, and open the SPA in sandbox.
6. Verify routing, assets, RESTlet access, and CSP behavior.
7. Commit: `feat: host builder through netsuite suitelet`.

**Acceptance:** The production build loads entirely from the NetSuite File Cabinet for an authorized role and has no external runtime asset dependency.

### Task 20: Security, governance, and operational hardening

**Files:**

- Create: `netsuite-ipaas/docs/security/phase-1-controls.md`
- Create: `netsuite-ipaas/docs/runbooks/execution-failures.md`
- Create: `netsuite-ipaas/packages/suitescript/src/FileCabinet/SuiteScripts/iPaaS/engine/redaction.ts`
- Test: `netsuite-ipaas/packages/suitescript/test/engine/redaction.test.ts`

**Steps:**

1. Add tests proving credentials, tokens, email bodies, and configured sensitive fields are redacted.
2. Enforce record-type, field, saved-search, and recipient allowlists.
3. Add workflow size, payload size, execution time, result count, and log size limits.
4. Add audit events for publish, activate, deactivate, and administrative test runs.
5. Add retention cleanup for execution and step records.
6. Review all RESTlet and Suitelet operations for authorization and injection risks.
7. Run dependency, static, unit, and sandbox permission tests.
8. Document triage, retry, disable, and rollback procedures.
9. Commit: `security: harden phase one execution`.

**Acceptance:** Security controls are tested, governance limits fail safely, and operators have a documented recovery path.

## Milestone 9: End-to-end validation and release

### Task 21: Complete sandbox acceptance testing

**Files:**

- Create: `netsuite-ipaas/docs/test-plans/phase-1-uat.md`
- Create: `netsuite-ipaas/docs/release/phase-1-checklist.md`

**Steps:**

1. Run all automated checks from a clean checkout.
2. Deploy the release candidate to sandbox through SDF.
3. Test a record-created workflow that loads a customer and sends a suppressed test email.
4. Test a record-updated workflow that checks watched fields and updates an allowed field.
5. Test a scheduled saved-search workflow with If/Else and Map processing.
6. Test validation failures: cycle, missing mapping, invalid field, excessive loop size, and unauthorized role.
7. Test retry, duplicate-trigger suppression, usage exhaustion, and disabled workflow behavior.
8. Confirm logs are complete, correlated, retained, and redacted.
9. Obtain product owner and NetSuite administrator sign-off.
10. Tag the release candidate and commit: `docs: complete phase one acceptance plan`.

**Acceptance:** All UAT cases pass with captured evidence and named sign-off owners.

### Task 22: Production rollout

**Files:**

- Modify: `netsuite-ipaas/docs/release/phase-1-checklist.md`
- Create: `netsuite-ipaas/docs/runbooks/production-rollout.md`

**Steps:**

1. Back up relevant customizations and export the production deployment state.
2. Validate the SDF project against production.
3. Deploy records, scripts, and SPA assets with triggers disabled.
4. Assign the application administrator role to the initial operators.
5. Run read-only smoke tests, then a controlled side-effect test.
6. Activate one low-risk pilot workflow.
7. Monitor execution volume, failures, latency, and governance usage through the agreed observation window.
8. Enable remaining approved workflows gradually.
9. Execute rollback if any release gate fails.
10. Record release evidence and ownership handoff.

**Acceptance:** The pilot workflow operates within defined error, latency, and governance limits, and rollback has been proven or rehearsed.

## Suggested delivery order and estimates

| Milestone | Deliverable | Estimate |
|---|---|---:|
| 0 | Decisions and contracts | 2-4 days |
| 1 | Workspace and SDF deployment | 3-5 days |
| 2 | Shared workflow schema and catalog | 4-6 days |
| 3 | Custom records, repositories, RESTlet | 7-10 days |
| 4 | Graph, mapping, and execution engine | 8-12 days |
| 5 | Phase 1 action and logic nodes | 8-12 days |
| 6 | Record/scheduled triggers and Map/Reduce | 5-8 days |
| 7 | Visual canvas, mapping, testing UI | 12-18 days |
| 8 | Hosting, security, and operations | 5-8 days |
| 9 | UAT and controlled rollout | 5-8 days |

Expected total: approximately 9-13 weeks for two experienced engineers plus part-time NetSuite administrator and product-owner support. Estimates should be recalibrated after Milestones 0-2.

## Release gates

- Gate A: Workflow lifecycle, limits, permissions, and JSON schema approved.
- Gate B: SDF deployment and shared schema working in sandbox.
- Gate C: Execution engine and all handlers pass unit tests.
- Gate D: Visual builder completes representative workflows end to end.
- Gate E: Security, governance, and operational review approved.
- Gate F: Sandbox UAT and production pilot approved.
