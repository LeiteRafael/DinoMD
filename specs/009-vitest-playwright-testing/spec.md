# Feature Specification: DinoMD — Complete Testing Infrastructure (Vitest + Playwright)

**Feature Branch**: `009-vitest-playwright-testing`
**Created**: 2026-03-17
**Status**: Clarified
**Input**: User description: "Configurar e implementar uma infraestrutura completa de testes para o DinoMD, utilizando Vitest para testes de integração e Playwright para testes de ponta a ponta (E2E), Desenvolver os teste com bases nas especificaçoes do projeto"

## Overview

DinoMD currently has a suite of unit tests using Jest and React Testing Library. This feature establishes a complete, two-tier testing infrastructure:

1. **Integration tests** — verify that application components and modules work correctly together (e.g., UI components interacting with state management, IPC layer, and the file system abstraction).
2. **End-to-end (E2E) tests** — validate complete user journeys through the live web-mode application, exercising the full stack from user interaction to visible output.

All tests must be derived from the acceptance scenarios and functional requirements defined in specs 001–008.

---

## Clarifications

### Session 2026-03-17

- Q: Should the existing Jest unit tests be kept alongside Vitest, migrated into Vitest, or frozen while new tests go to Vitest? → A: Migrate existing Jest unit tests into Vitest; one unified framework (Vitest) handles all unit and integration tests.
- Q: How should E2E tests achieve clean state isolation between tests without modifying production source files? → A: Use Playwright's per-test `browserContext` isolation; each test receives a fresh browser storage context (localStorage/sessionStorage/IndexedDB) with no production code changes required.
- Q: Should the 80% coverage threshold be enforced as a global average or a per-file minimum? → A: Global average ≥80% across the covered directories; any individual file below 50% is flagged as a non-blocking warning.
- Q: Should Playwright manage the web-mode dev server lifecycle automatically, or must the server be started externally before running E2E tests? → A: Playwright manages the server lifecycle automatically; the E2E command is fully self-contained (starts server before tests, stops it after).
- Q: What output format(s) should the E2E report produce? → A: HTML report (with embedded screenshots) and JUnit XML artifact; both generated on every E2E run.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Developers Can Run Integration Tests (Priority: P1)

A developer working on DinoMD wants to verify that feature modules interact correctly — for example, that importing a file updates the document list, that the editor's save shortcut triggers the correct persistence flow, or that the sidebar correctly reflects the file tree state. They run the integration test suite and receive a clear pass/fail report with actionable failure messages.

**Why this priority**: Integration tests catch regressions at the module boundary level faster than E2E tests. Without this layer a developer cannot confidently determine whether cross-module interactions still work after a change.

**Independent Test**: Can be fully verified by running the integration test command and confirming that tests covering document import, state management, editor interaction, and sidebar navigation all execute and report results — independently of the E2E suite.

**Acceptance Scenarios**:

1. **Given** the project has been checked out with dependencies installed, **When** the developer runs the integration test command, **Then** all integration tests execute and produce a human-readable pass/fail summary.
2. **Given** an integration test fails, **When** the developer reads the test output, **Then** they see the specific assertion that failed, the expected value, the actual value, and the file and line where the failure occurred.
3. **Given** the full integration suite passes, **When** the developer requests a coverage report, **Then** a report is generated showing per-file and overall coverage percentages.
4. **Given** a developer makes a change that breaks an integration point (e.g., renames a state field used by a component), **When** they run the suite, **Then** the affected integration test(s) fail and identify the broken boundary.

---

### User Story 2 - Developers Can Run E2E Tests (Priority: P2)

A developer wants to confirm that complete user journeys — importing a Markdown file, viewing it rendered, editing it, navigating the sidebar, and using save/copy shortcuts — work correctly in the running application. They run the E2E test suite and see a pass/fail result for each user journey, including visual evidence when a test fails.

**Why this priority**: E2E tests validate the product from the user's perspective, catching issues that unit and integration tests cannot: routing, rendering pipeline, keyboard shortcuts, and full-stack data flow. They are the final quality gate before a release.

**Independent Test**: Can be fully verified by running the E2E suite against the web-mode build and confirming that each major user journey (open app, import file, view document, edit document, use shortcuts, navigate sidebar) reports an independent result.

**Acceptance Scenarios**:

1. **Given** the application is built in web mode, **When** the developer runs the E2E test command, **Then** the suite launches the application, executes all journeys, and produces a structured report.
2. **Given** an E2E test fails, **When** the developer inspects the report, **Then** they see the failed step, a screenshot of the application at the moment of failure, and the error message.
3. **Given** all E2E tests pass, **When** the developer views the report, **Then** each primary user journey from specs 001–008 is listed as individually verified.
4. **Given** the application intentionally changes a UI element (e.g., a button label), **When** the E2E test that relied on that element runs, **Then** it fails with a message identifying which element was not found.

---

### User Story 3 - CI Pipeline Enforces Test Quality (Priority: P3)

A developer opens a pull request. The CI pipeline automatically runs both the integration and E2E test suites. If any test fails, the PR is blocked. If all tests pass, per-suite coverage is reported.

**Why this priority**: Automated enforcement ensures no regression is merged undetected, making the testing investment part of the daily workflow rather than an optional manual step.

**Independent Test**: Can be fully verified by running the documented CI entry-point command locally and confirming both suites execute in sequence, results are reported, and exit codes reflect pass or fail.

**Acceptance Scenarios**:

1. **Given** a CI run is triggered, **When** integration tests run, **Then** the suite exits with a non-zero code on any failure and zero on full pass.
2. **Given** the integration tests pass, **When** E2E tests run, **Then** the suite exits with a non-zero code on any failure and zero on full pass.
3. **Given** both suites pass, **When** the CI run completes, **Then** a combined coverage report is available as an artifact.

---

### User Story 4 - All Specs 001–008 Are Covered (Priority: P4)

A QA engineer or developer wants to confirm that every functional requirement from specs 001–008 is covered by at least one test. They review the test inventory and can trace each spec's core acceptance scenarios to a corresponding test case.

**Why this priority**: Traceability ensures the testing effort targets documented product behaviour. Without explicit mapping to specifications, coverage gaps can exist silently.

**Independent Test**: Can be verified by reviewing the test file organisation or annotations and confirming each spec (001–008) is referenced by at least one integration test and one E2E test.

**Acceptance Scenarios**:

1. **Given** the suites are complete, **When** a developer reviews the test inventory, **Then** each spec (001–008) contributes at least one integration test and one E2E test.
2. **Given** a new spec is added for a future feature, **When** no test references it, **Then** the gap is visible in the traceability index.

---

### Edge Cases

- What happens when the test suite runs in a headless CI environment without a display server? E2E tests must run in headless mode without requiring manual configuration.
- What happens when a test takes too long to complete? Each test must have a defined timeout; tests exceeding the limit must fail with a timeout error, not hang indefinitely.
- What happens when the application web-mode build fails before E2E tests run? The E2E suite must not start and must clearly report the build failure.
- What happens when two E2E tests both import files or mutate app state? Each E2E test must start the application in a clean isolated state to prevent cross-test interference.
- What happens when a source file changes but its tests are not updated? The coverage report must show the reduction in coverage for the affected file.

---

## Requirements *(mandatory)*

### Functional Requirements

#### Integration Test Suite

- **FR-001**: All existing Jest unit tests MUST be migrated to Vitest before new integration tests are added; Jest and its Babel transform configuration MUST be removed from the project upon completion.
- **FR-001b**: The unified test suite (unit + integration, both under Vitest) MUST execute without requiring a running application instance or a graphical display environment.
- **FR-002**: The integration test suite MUST include tests covering the core acceptance scenarios of each spec from 001 to 008, at the module-interaction level.
- **FR-003**: Each integration test MUST be independently executable — no test may depend on the side-effects of another test.
- **FR-004**: The integration test suite MUST produce a code-coverage report showing statement, branch, function, and line coverage per source file.
- **FR-005**: Integration test output MUST include, for each failed test: the test name, the failing assertion, the expected value, the actual value, and the source location.
- **FR-006**: The integration test suite MUST complete within 3 minutes on a standard developer machine.

#### E2E Test Suite

- **FR-007**: The E2E test suite MUST automatically start the web-mode dev server before tests begin and stop it after all tests complete; no manual server start step is required to run the E2E command.
- **FR-008**: The E2E test suite MUST include at least one complete happy-path user journey for each spec (001–008).
- **FR-009**: Each E2E test MUST run inside a dedicated Playwright `browserContext` so that browser storage (localStorage, sessionStorage, IndexedDB) is fully isolated from all other tests; no persisted state may carry over between tests.
- **FR-010**: E2E tests MUST capture a screenshot at the moment of any test failure and embed it in an HTML report generated at the end of each run.
- **FR-018**: The E2E suite MUST also produce a JUnit XML artifact on every run, enabling CI platforms (GitHub Actions, GitLab CI, Jenkins) to parse and display individual test results without additional configuration.
- **FR-011**: The E2E test suite MUST support headless execution suitable for CI environments with no display server.
- **FR-012**: Each E2E test MUST have a maximum execution timeout; tests exceeding the limit MUST be marked as failed rather than hanging.
- **FR-013**: The E2E test suite MUST complete within 10 minutes on a standard developer machine.

#### General Infrastructure

- **FR-014**: The project MUST expose a single documented command to run all Vitest tests (unit + integration) and a single documented command to run all E2E tests; the E2E command MUST be self-contained (server lifecycle included).
- **FR-015**: The project MUST expose a single command that runs integration tests then E2E tests sequentially, suitable for use as a CI pipeline step.
- **FR-016**: Test files MUST be organised in a directory structure that makes the relationship to the corresponding spec (001–008) evident.
- **FR-017**: The testing infrastructure MUST NOT require modifications to production source files in `src/` to enable test execution (no test-only flags or stubs embedded in production code). State isolation between E2E tests MUST be achieved exclusively through Playwright `browserContext` scoping, not through runtime URL parameters or conditional branches in production code.

### Key Entities

- **Integration Test**: A test that exercises one or more application modules working together (UI component + state, IPC handler + store) without running the full application binary.
- **E2E Test**: A test that drives a complete user journey through the running web-mode application by simulating real interactions and asserting on visible output.
- **Test Suite**: A logically grouped collection of tests executed via a single command; either the integration suite or the E2E suite.
- **Coverage Report**: A document listing, per source file, the percentage of code exercised by the test suite.
- **Test Inventory**: A mapping between spec requirements (FR-xxx from specs 001–008) and the test cases that verify them.
- **CI Entry Point**: The single command a continuous integration pipeline executes to verify both suites sequentially.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of specs 001–008 are referenced by at least one integration test and at least one E2E test.
- **SC-002**: The Vitest suite reports a **global average** code coverage of 80% or above across all files in `src/renderer/src/`, `src/main/`, and `src/preload/`. Any individual file with coverage below 50% MUST be surfaced as a non-blocking warning in the coverage report; no per-file minimum is enforced as a hard gate.
- **SC-003**: Every E2E test failure produces a screenshot captured within 5 seconds of the failure being detected and embedded in the HTML report; a JUnit XML artifact is also written before the process exits.
- **SC-004**: The full integration suite completes in under 3 minutes on a machine with 4 CPU cores and 8 GB RAM.
- **SC-005**: The full E2E suite completes in under 10 minutes on a machine with 4 CPU cores and 8 GB RAM.
- **SC-006**: A developer unfamiliar with the project can run both suites after reading the updated README in under 5 minutes.
- **SC-007**: Zero production source files in `src/` require modification to enable the test infrastructure.
- **SC-008**: All tests pass in a headless CI environment with no graphical display server.

---

## Assumptions

- The project will use the web-mode build (`npm run dev:web`) as the application target for E2E testing; full Electron binary E2E testing is out of scope for this feature.
- The existing Jest unit tests will be migrated to Vitest as part of this feature. After migration, Jest and its Babel configuration are removed. Vitest becomes the single framework for all unit and integration tests.
- Native OS file picker dialogs are not exercised in E2E; file import is simulated through the browser API mock already present in `src/web/browserApi.js`.
- Sample `.md` fixture files required by tests will be created within the test suite directory.
- The CI environment supports Node.js 20+ and a Chromium-compatible browser for headless E2E execution.
