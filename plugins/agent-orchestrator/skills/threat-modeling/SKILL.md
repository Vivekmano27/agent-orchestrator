---
name: threat-modeling
description: Perform STRIDE threat modeling — Spoofing, Tampering, Repudiation, Information Disclosure, DoS, Elevation of Privilege. Use when the user says "threat model", "STRIDE analysis", "security assessment", or needs to identify threats before building security controls.
allowed-tools: Read, Grep, Glob
---

# Threat Modeling Skill (STRIDE)

Identify and mitigate security threats systematically.

## STRIDE Categories
| Threat | Property Violated | Example | Mitigation |
|--------|------------------|---------|------------|
| **S**poofing | Authentication | Fake login | MFA, strong passwords |
| **T**ampering | Integrity | Modified request | Input validation, HMAC |
| **R**epudiation | Non-repudiation | Deny action | Audit logging |
| **I**nfo Disclosure | Confidentiality | Data leak | Encryption, access control |
| **D**enial of Service | Availability | Flood attack | Rate limiting, CDN |
| **E**levation of Privilege | Authorization | Admin access | RBAC, least privilege |
