---
name: tdd-skill
description: Enforce strict Test-Driven Development — Red-Green-Refactor cycle. Write failing tests first, implement minimal code to pass, then refactor. Use when the user says "write tests first", "TDD", "test-driven", "red green refactor", or when building features that require high reliability. This skill prevents the agent from skipping to implementation.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# TDD (Test-Driven Development) Skill

Enforce the Red-Green-Refactor cycle for every feature.

## The TDD Cycle

### 1. RED — Write a Failing Test
```typescript
// Write the test BEFORE any implementation
describe('UserService', () => {
  it('should create a user with valid data', async () => {
    const result = await userService.create({
      email: 'test@example.com',
      name: 'Test User',
      password: 'SecurePass123!'
    });
    
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.email).toBe('test@example.com');
    expect(result.passwordHash).not.toBe('SecurePass123!');
  });

  it('should reject duplicate email', async () => {
    await userService.create({ email: 'dup@test.com', name: 'A', password: 'Pass123!' });
    await expect(
      userService.create({ email: 'dup@test.com', name: 'B', password: 'Pass123!' })
    ).rejects.toThrow('Email already exists');
  });
});
```

### 2. GREEN — Write Minimal Code to Pass
```typescript
// Implement ONLY what's needed to make the test pass
// No extra features, no premature optimization
class UserService {
  async create(data: CreateUserDto): Promise<User> {
    const existing = await this.repo.findByEmail(data.email);
    if (existing) throw new Error('Email already exists');
    
    const passwordHash = await bcrypt.hash(data.password, 10);
    return this.repo.create({ ...data, passwordHash });
  }
}
```

### 3. REFACTOR — Improve Without Changing Behavior
```typescript
// Clean up: extract helpers, improve naming, reduce duplication
// All tests must still pass after refactoring
```

## Rules
- NEVER write implementation before the test
- NEVER write more code than needed to pass the current test
- ALWAYS run tests after each change
- ALWAYS refactor after green (even if small)
- One test at a time — don't batch

## Test Categories Per Feature
1. **Happy path** — normal successful operation
2. **Validation** — invalid inputs, missing fields
3. **Edge cases** — empty data, max values, concurrent access
4. **Error handling** — network failure, DB error, timeout
5. **Security** — unauthorized access, injection attempts
