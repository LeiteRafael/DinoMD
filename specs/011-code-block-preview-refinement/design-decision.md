# Design Decision: Code Block Preview Background Refinement

**Date**: 2026-03-28  
**Feature**: 011-code-block-preview-refinement  
**Decision Scope**: Snapshot container and modal overlay background styling  

## Decision: Alternative A — Theme-Aware Solid Background ✅ SELECTED

### Choice
Replace hard-coded `#1e2128` with the existing global theme CSS variables:
- **Light mode**: `background: var(--color-bg)` → `#f8f9fa`
- **Dark mode**: `background: var(--color-bg)` → `#1a1d23`

Affected surfaces:
- `SnapshotPane .container`
- `MarkdownViewer .snapshotModal`

### Rationale

| Criterion | Alternative A | Alternative B | Alternative C |
|-----------|---|---|---|
| **Implementation complexity** | ⚡ Minimal (2-line CSS change) | ⚡ Minimal (transparent) | 🔴 Complex (gradient tuning) |
| **Visual quality** | ✅ Clean, harmonious | ✅ Clean but card blends | ⭐ Best (depth + spotlight) |
| **Theme integration** | ✅ Full (reuses variables) | ⚠️ Partial (inherit only) | ⚠️ Partial (gradient override) |
| **Performance** | ✅ Zero overhead | ✅ Zero overhead | ⚠️ GPU composition needed |
| **Maintenance burden** | ✅ Zero (uses established vars) | ✅ Zero | 🔴 Medium (gradient params) |
| **Consistency with codebase** | ✅ Matches pattern | ⚠️ New pattern | 🔴 Breaks pattern |

**Winner**: Alternative A — Optimal balance of simplicity, quality, and consistency

### Deferred Alternatives

- **Alternative B** (Transparent): Implemented during initial exploration (Issue #12). Keep as fallback if A causes unexpected visual conflicts; no degradation in quality.
- **Alternative C** (Gradient vignette): Reserved for v2 polish phase. Requires deeper design system work and may not match all future themes; deferred to avoid scope creep.

## Implementation Impact

### Affected Files
1. `src/renderer/src/components/SnapshotPane/SnapshotPane.module.css`
   - Change: `.container { background: transparent }` → `.container { background: var(--color-bg) }`

2. `src/renderer/src/components/MarkdownViewer/MarkdownViewer.module.css`
   - Change: `.snapshotModal { background: #1e2128 }` → `.snapshotModal { background: var(--color-surface) }`

### Baseline State Behavior (Change Indicators)

**Initialization**: Baseline computes when file loads; stored from `session.content` at first render

**Update triggers**: Baseline resets after:
- ✅ Document save (`.save()` called)
- ✅ Discard changes (`.discard()` called)
- ✅ New file open (component unmount/remount)

**Non-triggers** (baseline persists):
- ❌ Theme switch (change indicators remain visible)
- ❌ Editor blur/focus
- ❌ Component rerender

### Quality Gate

✅ **Pass Criteria**:
- In dark mode, snapshot container background matches `--color-bg` (#1a1d23) — no visual mismatch
- In light mode, snapshot container background matches `--color-bg` (#f8f9fa) — no dark gray visible
- Theme switch updates background within 300ms, no flash of old color
- Card separation maintained via existing 5px border (#8f6533)
- Change indicators render without overlap or visual degradation
- PNG export remains unaffected (no background included)

## Sign-Off

**Decided by**: Rafael (User)  
**Date**: 2026-03-28  
**Approval**: ✅ Confirmed via interactive survey
