# React Virtuoso Codebase Guide

## Build Commands

- Build: `bun run build`
- Lint: `bun run lint`
- Test: `bun test`
- Dev environment: `bun dev`

## Important documentation files

- README.md - overall project overview
- CHART_API_REFERENCE.md - reference for the sc-charts API
- COMPONENT_HIERARCHY.md - hierarchy of the React components in the app

## Code Style Guidelines

- Use TypeScript with strong typing; avoid `any` when possible
- Format: prettier with 140 char width, single quotes, no semicolons
- Naming: camelCase for variables/functions, PascalCase for components/classes
- Imports: group React imports first, then external libs, then internal modules
- Prefer functional components with hooks over class components
- Error handling: prefer early returns over deep nesting
- Keep components focused on a single responsibility

## Performance Considerations

- Optimize rendering with memoization where appropriate
- Ensure proper cleanup in useEffect hooks
- Be cautious with closures capturing outdated values
