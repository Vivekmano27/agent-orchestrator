---
name: accessibility-audit
description: Validate WCAG 2.1 AA/AAA compliance — ARIA labels, keyboard navigation, color contrast, screen reader support, focus management, and semantic HTML. Use when the user mentions "accessibility", "WCAG", "a11y", "screen reader", "keyboard navigation", or needs to make their app accessible to all users.
allowed-tools: Read, Bash, Grep, Glob
---

# Accessibility Audit Skill

Ensure web applications are usable by everyone.

## WCAG 2.1 AA Checklist
### Perceivable
- [ ] All images have meaningful alt text (or alt="" for decorative)
- [ ] Color contrast ≥ 4.5:1 for normal text, ≥ 3:1 for large text
- [ ] Information not conveyed by color alone
- [ ] Captions for video content
- [ ] Content readable at 200% zoom

### Operable
- [ ] All interactive elements keyboard accessible
- [ ] Visible focus indicators on all focusable elements
- [ ] Skip navigation link at top of page
- [ ] No keyboard traps
- [ ] Sufficient time to complete tasks

### Understandable
- [ ] Page language set (`<html lang="en">`)
- [ ] Form inputs have visible labels
- [ ] Error messages identify the field and describe the issue
- [ ] Consistent navigation across pages

### Robust
- [ ] Valid HTML (no duplicate IDs)
- [ ] ARIA roles and properties used correctly
- [ ] Custom components have appropriate ARIA patterns
