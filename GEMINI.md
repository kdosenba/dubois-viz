# Engineering Rules (`dubois-viz`)

1. **Strict TypeScript — Zero `any`:** Every file must pass `tsc --noEmit` with `strict`, `noImplicitAny`, `noUncheckedIndexedAccess`, and `verbatimModuleSyntax`. Never use `any`.
2. **Zero `zod`:** Never install or import `zod`. Validate boundaries with pure TypeScript types and small deterministic helpers.
3. **Branded IDs:** Use branded nominal string types (`ChartId`, `PlateId`, `SeriesId`, `ItemId`, `GroupId`, `StepId`, `TierId`, `PanelId`, `VolumeId`) to prevent cross-ID bugs.
4. **100% Self-Contained Single-File Charts (`src/charts/*.ts`):**
   - Every chart file (except the consumer barrel `src/charts/index.ts`) MUST have **zero local imports**—it may only import from `'d3'` and use standard Web APIs.
   - Structural conformance to `src/contracts/` is proven at compile time by `src/contracts/chart-conformance.test-d.ts` and verified by `scripts/verify-conformance.ts`.
5. **100% Domain-Agnostic:** No domain-specific terms, calendars, geographies, or business hierarchies anywhere in `src/charts/`, `src/sync/`, `src/controls/`, `src/plates/`, `src/contracts/`, or `src/styles/`.
6. **Simplicity & D3 Primitives:** Prefer concise, readable, high-performance D3 primitives (`d3.scale*`, `d3.stack`, `d3.line`, `d3.area`, `d3.arc`, `d3.geoPath`, `d3.brushX`, `d3.zoom`, `.join()`) over imperative DOM bloat.
7. **Scoped CSS Isolation:** Never place bare `html`, `body`, or `*` rules outside `src/styles/exhibition.css`.
8. **Design Language Integrity:** Follow `DESIGN_LANGUAGE.md` strictly—flat-opaque gouache fills, crisp `#1A1615` India-ink outlines, tactile vellum tooltips, and clean typography.
