---
name: secrets-scanner
description: Detect accidentally committed secrets — API keys, passwords, tokens, private keys, database URLs in code and config. Use when the user says "scan for secrets", "check for leaked keys", "secrets audit", or before any public repository push.
allowed-tools: Read, Grep, Glob, Bash
---

# Secrets Scanner Skill

Find and remediate leaked secrets in code.

## Common Patterns to Detect
```regex
# AWS Keys
AKIA[0-9A-Z]{16}

# Generic API Key
[a-zA-Z0-9]{32,}

# JWT Token
eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+

# Database URL
(postgres|mysql|mongodb)://[^\s]+

# Private Key
-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----
```

## Remediation Steps
1. Rotate the exposed secret immediately
2. Remove from git history: `git filter-branch` or BFG Repo Cleaner
3. Add pattern to `.gitignore`
4. Move secret to environment variable or secret manager
5. Set up pre-commit hook to prevent future leaks
