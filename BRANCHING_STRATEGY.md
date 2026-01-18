# Branching Strategy - PsicoPay MVP

## Overview

This document outlines the Git branching strategy for the PsicoPay project development.

## Branch Structure

```
main (protected)
  │
  ├── feature/project-setup         → PR #1
  ├── feature/database-schema       → PR #2
  ├── feature/calendar-service      → PR #3
  ├── feature/payment-service       → PR #4
  ├── feature/notification-service  → PR #5
  ├── feature/repositories          → PR #6
  ├── feature/session-monitor       → PR #7
  ├── feature/webhook-server        → PR #8
  ├── feature/testing               → PR #9
  └── feature/documentation         → PR #10
```

## Branch Naming Convention

- **Feature branches**: `feature/<short-description>`
- **Bug fixes**: `fix/<short-description>`
- **Hotfixes**: `hotfix/<short-description>`
- **Documentation**: `docs/<short-description>`

## Workflow

1. Create feature branch from `main`
2. Implement changes with clear, atomic commits
3. Push branch to origin
4. Create Pull Request to `main`
5. Review and approve PR
6. Squash merge to `main`
7. Delete feature branch

## Commit Message Convention

```
<type>: <short description>

[optional body]

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

### Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

## Pull Request Checklist

- [ ] Code follows project conventions
- [ ] All tests pass
- [ ] Documentation updated (if applicable)
- [ ] CHANGELOG.md updated
- [ ] Module README updated (if applicable)

## Implementation Order

| PR # | Branch | Description | Dependencies |
|------|--------|-------------|--------------|
| 1 | feature/project-setup | Project foundation | None |
| 2 | feature/database-schema | Database & ORM | PR #1 |
| 3 | feature/calendar-service | Google Calendar integration | PR #2 |
| 4 | feature/payment-service | Mercado Pago integration | PR #2 |
| 5 | feature/notification-service | Twilio WhatsApp | PR #2 |
| 6 | feature/repositories | Data access layer | PR #2 |
| 7 | feature/session-monitor | Cron job orchestration | PR #3, #4, #5, #6 |
| 8 | feature/webhook-server | Express + webhooks | PR #4, #6 |
| 9 | feature/testing | Unit & integration tests | PR #7, #8 |
| 10 | feature/documentation | Final docs & deploy config | PR #9 |

## Protection Rules (Recommended for main)

- Require pull request reviews before merging
- Require status checks to pass
- Require linear history (squash merging)
