---
name: compliance-checker
description: Validate compliance with GDPR, CCPA, HIPAA, PCI-DSS, SOC2. Check data handling, consent flows, audit logging, and data retention. Use when the user mentions regulatory compliance or needs to ensure their application meets legal requirements.
allowed-tools: Read, Grep, Glob, Bash
---

# Compliance Checker Skill

Verify application compliance with major regulations.

## GDPR Checklist
- [ ] Privacy policy accessible and up-to-date
- [ ] Explicit consent before data collection
- [ ] Right to access (data export)
- [ ] Right to erasure (account deletion)
- [ ] Data processing agreements with vendors
- [ ] Data breach notification procedure (72 hours)
- [ ] Data Protection Impact Assessment (if high risk)
- [ ] Lawful basis documented for each processing activity

## PCI-DSS (if handling payments)
- [ ] Never store full card numbers
- [ ] Use tokenization (Stripe, etc.)
- [ ] TLS for all payment data transmission
- [ ] Regular security testing
- [ ] Access logging for payment systems
