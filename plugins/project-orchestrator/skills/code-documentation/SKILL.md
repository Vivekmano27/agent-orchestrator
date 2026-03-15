---
name: code-documentation
description: Enforce code documentation standards — JSDoc/TSDoc, Google-style docstrings, KDoc, dartdoc, godoc. Public APIs always documented, private only when complex, no trivial comments. TODO/FIXME must reference tickets. Use when implementing features or reviewing code for documentation quality.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Code Documentation Skill

Single source of truth for inline documentation standards across all languages in the stack.

## When to Document

| Scope | Rule |
|-------|------|
| **Public APIs** (exported functions, classes, interfaces, endpoints) | Always document |
| **Private/internal** | Only when the logic is non-obvious or the function has side effects |
| **Inline comments** | Only when the *why* is not clear from the code itself |
| **Constants/config** | Document units, valid ranges, or business meaning |

## Per-Language Format Standards

### TypeScript / JavaScript — JSDoc / TSDoc

```typescript
/**
 * Calculate the delivery fee based on distance and order weight.
 *
 * @param distanceKm - Distance from warehouse to delivery address in kilometers
 * @param weightKg - Total order weight in kilograms
 * @returns The delivery fee in the user's local currency
 * @throws {InvalidDistanceError} If distanceKm is negative or exceeds max delivery radius
 */
export function calculateDeliveryFee(distanceKm: number, weightKg: number): number {
  // Weight surcharge only applies above 10kg (logistics policy P-2024-03)
  const surcharge = weightKg > 10 ? (weightKg - 10) * WEIGHT_SURCHARGE_RATE : 0;
  return BASE_FEE + distanceKm * PER_KM_RATE + surcharge;
}
```

**Rules:**
- Use `@param name - description` (TSDoc style with dash separator)
- Use `@returns` (not `@return`)
- Use `@throws {ErrorType}` for documented exceptions
- Interfaces and type aliases: document non-obvious fields inline

### Python — Google-Style Docstrings

```python
def process_ai_request(prompt: str, model: str = "claude-sonnet-4-20250514") -> AIResponse:
    """Generate AI content from a prompt using the configured provider.

    Args:
        prompt: The user prompt to send to the AI model.
        model: Model identifier. Defaults to claude-sonnet-4-20250514.

    Returns:
        AIResponse with content, token usage, and model metadata.

    Raises:
        AIProviderError: If the AI provider returns a non-retryable error.
        RateLimitError: If the provider rate limit is exceeded.
    """
```

**Rules:**
- Use Google style (`Args`, `Returns`, `Raises`) — not NumPy or reST
- One blank line between summary and sections
- Type hints in the signature, not repeated in the docstring

### Kotlin — KDoc

```kotlin
/**
 * Place an order after validating can availability.
 *
 * Checks the user's available can count against the requested amount
 * before delegating to [OrderRepository.placeOrder].
 *
 * @param request The order placement request containing user and item details.
 * @return [Result] containing the created [Order] on success.
 * @throws InsufficientCansException If the user lacks enough cans for the order.
 */
suspend operator fun invoke(request: PlaceOrderRequest): Result<Order>
```

**Rules:**
- Use `@param`, `@return`, `@throws`
- Use `[ClassName]` and `[ClassName.method]` for cross-references
- Document suspend/coroutine behavior when non-obvious

### Dart — dartdoc

```dart
/// Calculate the total price including delivery fee and discounts.
///
/// Applies [DiscountPolicy] rules before adding the delivery fee.
/// Returns zero if the cart is empty rather than throwing.
///
/// See also:
/// - [DeliveryFeeCalculator] for fee computation details
/// - [DiscountPolicy] for available discount rules
double calculateTotal(List<CartItem> items, DeliveryFeeCalculator feeCalc) {
  // Early return avoids division-by-zero in discount percentage calc
  if (items.isEmpty) return 0;
```

**Rules:**
- Use `///` (not `/** */`)
- Use `[ClassName]` for cross-references
- First line is a single-sentence summary, then blank line, then details

### Go — godoc

```go
// CalculateDeliveryFee returns the delivery fee based on distance and weight.
// It applies a weight surcharge for orders above 10kg per logistics policy P-2024-03.
func CalculateDeliveryFee(distanceKm, weightKg float64) (float64, error) {
```

**Rules:**
- Comment starts with the function name
- No special tags — use plain prose
- Package-level doc comment in `doc.go`

## TODO / FIXME / HACK Tracking

All `TODO`, `FIXME`, and `HACK` comments **must** include a ticket reference:

```typescript
// TODO(PROJ-123): Replace with batch API once endpoint is available
// FIXME(PROJ-456): Race condition when two users modify the same order
// HACK(PROJ-789): Workaround for upstream bug in @nestjs/swagger v7.2
```

**Bare TODOs are not allowed.** Before completing a task, grep for untracked TODOs:

```bash
grep -rn "TODO\|FIXME\|HACK" --include="*.ts" --include="*.py" --include="*.kt" --include="*.dart" --include="*.go" | grep -v "([A-Z]\{2,\}-[0-9]\+)"
```

If bare TODOs exist, either add a ticket reference or remove the comment.

## Anti-Patterns

- **Trivial comments restating code** — `// increment counter` above `counter++`. Delete these.
- **Stale comments** — comment describes old behavior. Worse than no comment. Update or remove.
- **Commented-out code** — use version control, not comments. Delete dead code.
- **Journal comments** — `// Added by John on 2024-03-15`. Use git blame instead.
- **Closing brace comments** — `} // end if`. Refactor the function to be shorter instead.
- **Redundant type documentation** — `@param name {string} The name` when TypeScript already has `name: string`. Only add if the description adds meaning beyond the type.

## Checklist

- [ ] All public APIs (exported functions, classes, interfaces) have doc comments
- [ ] Doc comments follow the correct format for the language (JSDoc/TSDoc, Google docstrings, KDoc, dartdoc, godoc)
- [ ] No trivial comments restating what the code already says
- [ ] All TODO/FIXME/HACK comments include a ticket reference
- [ ] No commented-out code blocks
- [ ] Inline comments explain *why*, not *what*
- [ ] Constants and config values document units, ranges, or business meaning
