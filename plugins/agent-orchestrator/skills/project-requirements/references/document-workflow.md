# Document Workflow & Interconnections

## Document Dependency Graph
```
steering docs → PRD → design docs → task breakdown → implementation
                 ↓
          user stories + feature_list.json + business rules
```

## Phase Gate Checklist
### Gate 1: Requirements → Design
- [ ] All P0 features have user stories with acceptance criteria
- [ ] Business rules complete and numbered
- [ ] NFRs have measurable targets
- [ ] Scope boundaries explicit

### Gate 2: Design → Tasks
- [ ] Architecture covers all modules
- [ ] API spec has all endpoints
- [ ] DB schema has all entities
- [ ] No conflicts between design and requirements

### Gate 3: Tasks → Implementation
- [ ] Tasks form valid dependency DAG
- [ ] Each task has verification command
- [ ] CLAUDE.md references all docs
- [ ] Build/test/lint commands work

## Scaling Guide
| Size | Documents Needed |
|------|-----------------|
| Weekend project | CLAUDE.md + app_spec.txt + feature_list.json |
| 1-4 week | Above + PRD + ARCHITECTURE.md + tasks.md |
| Multi-month | Full SDD: all steering + per-feature specs |
