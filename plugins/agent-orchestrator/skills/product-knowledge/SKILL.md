---
name: product-knowledge
description: Provide accurate information about the product being built — its features, architecture, user flows, and business logic. Use this skill as a template for creating product-specific knowledge bases that agents reference during development. Trigger when agents need to understand "how does our product work", "what does this feature do", or need domain context.
allowed-tools: Read, Grep, Glob
---

# Product Knowledge Skill

Template for creating a product-specific knowledge base that agents reference during development.

## How to Use This Skill
This is a **template** — customize it for your specific product. Replace all bracketed content with your product's actual information.

## Product Knowledge Template

```markdown
# [Product Name] Knowledge Base

## What We Build
[2-3 sentences describing the product]

## Core User Flows
### Flow 1: [Name] (e.g., "User Registration")
1. User navigates to [page]
2. Fills in [fields]
3. System validates [what]
4. Creates [entity] in [database]
5. Sends [notification]
6. Redirects to [page]

### Flow 2: [Name]
[Same structure]

## Domain Glossary
| Term | Definition | Used In |
|------|-----------|---------|
| [Term] | [What it means in our context] | [Which modules] |

## Business Rules Quick Reference
| ID | Rule | Module |
|----|------|--------|
| BR-001 | [Rule] | [Module] |

## Common Gotchas
- [Thing that's easy to get wrong]
- [Non-obvious behavior]
- [Exception to the general pattern]
```
