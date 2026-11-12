# Implementation workflow

1. Inspect repository status, instructions, installed dependencies, build scripts and hosting configuration. Save the clean baseline or document preexisting changes.
2. Translate PRB acceptance IDs into a short checklist in IMPLEMENTATION_STATUS.md. Record dates, completed work, test evidence and remaining risks.
3. Build small vertical slices. Write failing domain tests first; implement; run targeted tests; then integration checks at milestone completion.
4. Use deterministic fixture weather for development and automated tests. Live network calls belong only in explicit smoke tests and never gate ordinary unit CI.
5. Make coherent commits at passing milestones. Record a last-known-good commit after each milestone. Never use destructive reset to erase user changes.
6. Inspect the assembled interface at mobile and desktop sizes in one review pass; fix findings together; perform one confirmation pass. Functional failures still require correction.
7. Run the final checks once the final change is complete. Re-run affected checks if a subsequent fix changes behavior.
8. Produce a final report: what works, commands and results, deployment instructions, known limitations, and unresolved owner decisions.

## Long-session handoff
At approximately 45–50 tool calls, or before context becomes constrained, update IMPLEMENTATION_STATUS.md with current branch/commit, files changed, exact failing tests, next step, unresolved assumptions and local preview instructions. Continue from this checkpoint rather than repeating discovery. Delegation is optional only when explicitly authorized by the user or project instructions; this document does not request additional agents.

## Definition of done
All P0 acceptance criteria verified, no fabricated data, production build and preview working, privacy and attribution visible, README suitable for a first-time contributor, and production release checklist either passed or explicitly marked pending authorization.
