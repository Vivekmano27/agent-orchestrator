# Rule: No Secrets in Code
NEVER commit API keys, passwords, tokens, or connection strings to code.
Use environment variables via .env (local) or AWS SSM/Secrets Manager (production).
This rule is enforced by the security-auditor agent and pre-commit hook.
