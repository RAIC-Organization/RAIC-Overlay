<!--
=== Sync Impact Report ===
Version change: 1.0.0 → 1.1.0
Modified principles:
  - I. Code Quality (unchanged)
  - II. Testing Standards (unchanged)
  - III. User Experience Consistency (unchanged)
  - IV. Performance Requirements (unchanged)
Added sections:
  - V. Research-First Development (new principle)
  - Expanded Simplicity Standard in Development Workflow
Removed sections: None
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ (Constitution Check section compatible)
  - .specify/templates/spec-template.md ✅ (Requirements align with principles)
  - .specify/templates/tasks-template.md ✅ (Phase structure supports principles)
Follow-up TODOs: None
===========================
-->

# RAICOverlay Constitution

## Core Principles

### I. Code Quality

All code MUST be clean, readable, and maintainable. This principle ensures long-term
project health and reduces technical debt.

**Non-negotiable rules:**
- Code MUST pass static analysis (linting, type checking) before merge
- Functions MUST have a single, clear responsibility
- Code duplication MUST be eliminated through appropriate abstraction
- All code MUST be comprehensible without requiring the original author's explanation
- Variable and function names MUST be descriptive and self-documenting
- Complex logic MUST include explanatory comments describing the "why", not the "what"

**Rationale:** Poor code quality leads to bugs and performance issues that no library
or framework can fix. Static analysis tools objectively improve maintainability and
catch issues early. Research indicates TypeScript and static typing reduce bugs by ~15%.

### II. Testing Standards

Testing MUST follow an integration-first strategy. Tests provide the safety net that
enables confident refactoring and rapid iteration.

**Non-negotiable rules:**
- Integration/component tests MUST be written for all features before or during implementation
- Tests MUST cover features and user outcomes, not just individual functions
- Tests MUST execute frequently (every few minutes during development)
- Unit tests SHOULD be reserved for complex algorithms or non-trivial logic
- All tests MUST be deterministic and reproducible
- End-to-end tests SHOULD be minimal and targeted at critical user journeys only

**Rationale:** Component tests catch 99% of bugs and represent the core testing strategy
("Testing Diamond"). Testing during development, not after, provides immediate feedback
and prevents regression. Tests designed for features ensure focus on what matters to users.

### III. User Experience Consistency

Software MUST behave predictably and maintain consistency across all user interactions.
Users should never be surprised by system behavior.

**Non-negotiable rules:**
- UI patterns MUST be consistent across all screens and components
- Error messages MUST be clear, actionable, and user-friendly
- System responses MUST be timely with appropriate loading indicators
- Accessibility standards (WCAG 2.1 AA minimum) MUST be followed
- All user-facing text MUST use consistent terminology and tone
- State changes MUST provide clear visual feedback

**Rationale:** Predictable software behavior builds user trust and reduces support burden.
Consistency reduces cognitive load and enables users to transfer knowledge between
features. Accessible design ensures the widest possible user base.

### IV. Performance Requirements

Performance MUST be measurable, monitored, and maintained throughout the project lifecycle.
Systems MUST meet defined performance targets before release.

**Non-negotiable rules:**
- Performance budgets MUST be defined for all critical user paths
- Response times MUST be measured and tracked (p50, p95, p99)
- Performance regression tests MUST run in CI to prevent degradation
- Memory usage and resource consumption MUST be monitored
- Performance issues MUST be addressed before feature work continues
- All external dependencies MUST have timeout configurations

**Rationale:** Performance degradation often happens incrementally and goes unnoticed
until it impacts users. A 10ms response can become 100ms without explicit monitoring.
Performance tests ensure systems don't become slower or more expensive over time.

### V. Research-First Development

All implementation decisions MUST be informed by current documentation and best practices.
Research is mandatory before writing code that uses external libraries or APIs.

**Non-negotiable rules:**
- Context7 MUST be used to fetch up-to-date library documentation before implementation
- Web search MUST be performed to verify current best practices and patterns
- Official documentation MUST take precedence over outdated tutorials or Stack Overflow
- API changes and deprecations MUST be checked before using any external dependency
- Research findings MUST be documented in the feature specification or plan
- When documentation conflicts, prefer the most recent official source

**Research Workflow:**
1. Identify libraries/APIs needed for the feature
2. Use Context7 to retrieve current documentation for each dependency
3. Perform web search to verify patterns and check for known issues
4. Document key findings and version-specific considerations
5. Proceed with implementation using verified, current information

**Rationale:** Libraries and APIs evolve rapidly. Implementing based on cached knowledge
or outdated examples leads to deprecated patterns, security vulnerabilities, and
unnecessary refactoring. Current documentation ensures correct, maintainable solutions.

## Performance Standards

Performance targets MUST be defined per-project and documented in the feature specification.
The following baseline expectations apply unless explicitly overridden:

**Response Time Targets:**
- User-initiated actions: < 200ms p95
- Background operations: < 2s p95
- Batch processing: defined per-feature based on data volume

**Resource Constraints:**
- Memory usage growth MUST be monitored for leaks
- CPU utilization SHOULD remain below 70% under normal load
- Storage growth MUST be predictable and documented

**Availability Targets:**
- Production services SHOULD target 99.9% availability minimum
- Planned maintenance windows MUST be documented and communicated

**Measurement Requirements:**
- All performance metrics MUST be captured via automated monitoring
- Performance dashboards MUST be available for critical paths
- Alerts MUST trigger when metrics exceed defined thresholds

## Development Workflow

Development follows a quality-first approach where correctness is never sacrificed for
speed. The workflow ensures all principles are enforced at appropriate checkpoints.

**Code Review Requirements:**
- All changes MUST be reviewed before merge
- Reviews MUST verify adherence to Code Quality principle
- Reviews MUST confirm test coverage meets Testing Standards
- Reviews MUST validate no performance regressions introduced

**Quality Gates:**
- Pre-commit: Linting and formatting checks MUST pass
- Pre-merge: All tests MUST pass; coverage MUST not decrease
- Pre-deploy: Performance tests MUST pass; no critical issues

**Simplicity Standard:**
- Solutions MUST use the simplest approach that meets requirements
- New dependencies MUST be justified with clear rationale
- Abstractions MUST be introduced only when duplication exists
- YAGNI (You Aren't Gonna Need It) principle applies to all features
- Clever code is forbidden; readable code is mandatory
- Prefer explicit over implicit behavior in all cases
- Delete dead code immediately; do not comment it out
- If a solution requires extensive explanation, simplify it

**Documentation Requirements:**
- Public APIs MUST be documented with usage examples
- Architecture decisions MUST be recorded when non-obvious
- Setup and deployment procedures MUST be maintained and tested

## Governance

This constitution supersedes all other development practices within this project.
Amendments require explicit justification and version tracking.

**Amendment Procedure:**
1. Propose change with rationale and impact assessment
2. Review affected templates and documentation
3. Update constitution with new version number
4. Propagate changes to dependent artifacts
5. Document migration path for existing code if applicable

**Versioning Policy:**
- MAJOR: Backward-incompatible principle changes or removals
- MINOR: New principles added or existing ones materially expanded
- PATCH: Clarifications, wording improvements, non-semantic updates

**Compliance Review:**
- All PRs MUST verify compliance with applicable principles
- Violations MUST be documented with justification if exceptions are granted
- Periodic audits SHOULD review codebase adherence to constitution

**Conflict Resolution:**
- When principles conflict, prioritize: Correctness > Security > Performance > Simplicity
- Document conflicts and resolutions in feature specifications

**Version**: 1.1.0 | **Ratified**: 2025-12-12 | **Last Amended**: 2025-12-12
