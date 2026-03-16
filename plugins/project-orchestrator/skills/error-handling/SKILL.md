---
name: error-handling
description: Implement consistent error handling: custom error classes, boundaries, retry logic, graceful degradation. Use when the user mentions "Handle errors", "Error strategy", or related tasks.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Error Handling Skill

Implement consistent error handling across the entire stack: NestJS exception filters, Django REST Framework exception handlers, React error boundaries, retry logic with exponential backoff, and circuit breakers for inter-service calls.

## When to Use

- User asks to add or improve error handling in any service
- A new service or endpoint needs a global exception filter
- Cross-service calls need retry and circuit breaker logic
- React components need error boundaries
- Error logging and correlation IDs need to be set up
- Stack traces are leaking to API consumers

## Patterns

### NestJS — Exception Filters

Create a global exception filter that normalizes all errors:

```typescript
// common/filters/global-exception.filter.ts
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const correlationId = request.headers['x-correlation-id'] || uuidv4();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let details: Record<string, unknown> | null = null;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exResponse = exception.getResponse();
      message = typeof exResponse === 'string' ? exResponse : (exResponse as Record<string, unknown>).message as string;
      details = typeof exResponse === 'object' ? exResponse as Record<string, unknown> : null;
    }

    // Log with structured JSON
    Logger.error({
      correlationId,
      statusCode,
      path: request.url,
      method: request.method,
      message,
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    response.status(statusCode).json({
      statusCode,
      error: HttpStatus[statusCode],
      message,
      details,
      correlationId,
    });
  }
}
```

Register it globally in `main.ts`:

```typescript
app.useGlobalFilters(new GlobalExceptionFilter());
```

### Custom Exception Classes

```typescript
// common/exceptions/domain.exceptions.ts
export class ResourceNotFoundException extends NotFoundException {
  constructor(resource: string, id: string) {
    super(`${resource} with ID ${id} not found`);
  }
}

export class BusinessRuleViolationException extends BadRequestException {
  constructor(rule: string) {
    super(`Business rule violated: ${rule}`);
  }
}
```

### Django REST Framework — Custom Exception Handler

```python
# common/exception_handler.py
import uuid
import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    correlation_id = context["request"].META.get("HTTP_X_CORRELATION_ID", str(uuid.uuid4()))
    response = exception_handler(exc, context)

    if response is not None:
        body = {
            "statusCode": response.status_code,
            "error": type(exc).__name__,
            "message": str(exc.detail) if hasattr(exc, "detail") else str(exc),
            "details": response.data if isinstance(response.data, dict) else None,
            "correlationId": correlation_id,
        }
        response.data = body
    else:
        logger.exception("Unhandled exception", extra={"correlationId": correlation_id})
        response = Response(
            {
                "statusCode": 500,
                "error": "InternalServerError",
                "message": "An unexpected error occurred",
                "details": None,
                "correlationId": correlation_id,
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return response
```

Register in `settings.py`:

```python
REST_FRAMEWORK = {
    "EXCEPTION_HANDLER": "common.exception_handler.custom_exception_handler",
}
```

### Consistent Error Response Format

All services must return errors in the same shape:

```json
{
  "statusCode": 422,
  "error": "UnprocessableEntity",
  "message": "Inference model 'sentiment-v3' is not available",
  "details": { "availableModels": ["sentiment-v1", "sentiment-v2"] },
  "correlationId": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
}
```

### Retry Logic with Exponential Backoff

For calls to external services (AI providers, third-party APIs):

```typescript
// common/utils/retry.ts
async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxAttempts?: number; baseDelayMs?: number; maxDelayMs?: number } = {},
): Promise<T> {
  const { maxAttempts = 3, baseDelayMs = 200, maxDelayMs = 5000 } = options;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      const delay = Math.min(baseDelayMs * Math.pow(2, attempt - 1), maxDelayMs);
      const jitter = delay * 0.5 * Math.random();
      await new Promise((resolve) => setTimeout(resolve, delay + jitter));
    }
  }
  throw new Error('Unreachable');
}
```

### Circuit Breaker Pattern (Inter-Service Calls)

Prevent cascading failures when a downstream service is unhealthy:

```typescript
// common/utils/circuit-breaker.ts
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private readonly threshold: number = 5,
    private readonly resetTimeoutMs: number = 30000,
  ) {}

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeoutMs) {
        this.state = 'HALF_OPEN';
      } else {
        throw new ServiceUnavailableException('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() { this.failures = 0; this.state = 'CLOSED'; }
  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= this.threshold) this.state = 'OPEN';
  }
}
```

### React — Error Boundaries

```tsx
// components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', { error: error.message, componentStack: info.componentStack });
    // Send to error tracking service (e.g., Sentry)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <div>Something went wrong. Please try again.</div>;
    }
    return this.props.children;
  }
}
```

### Structured Logging with Correlation IDs

Pass `X-Correlation-ID` through the entire request chain:

```typescript
// common/middleware/correlation-id.middleware.ts
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const correlationId = req.headers['x-correlation-id'] as string || uuidv4();
    req.headers['x-correlation-id'] = correlationId;
    res.setHeader('x-correlation-id', correlationId);
    next();
  }
}
```

## Anti-patterns

- **Swallowing errors silently** — `catch (e) {}` with no logging or rethrow; every error must be logged or propagated
- **Exposing stack traces to clients** — never send `error.stack` in API responses; log it server-side only
- **No correlation IDs** — without a shared ID, tracing a request across services is impossible
- **Retry without backoff** — hammering a failing service immediately makes outages worse
- **No circuit breaker on inter-service calls** — one down service can cascade and take down the entire system
- **Catching generic `Exception`** — catch specific error types to handle them differently; let unknown errors bubble up
- **Inconsistent error formats** — NestJS returning `{ message }` while Django returns `{ detail }` confuses consumers
- **Missing error boundaries in React** — one component crash takes down the entire page

## Checklist

- [ ] Global exception filter is registered in every NestJS service
- [ ] Custom exception handler is set in Django REST Framework settings
- [ ] Error response format is `{ statusCode, error, message, details, correlationId }` everywhere
- [ ] Correlation ID middleware generates or propagates `X-Correlation-ID` on every request
- [ ] All cross-service HTTP calls use retry with exponential backoff and jitter
- [ ] Circuit breaker wraps calls to downstream services
- [ ] React app has `ErrorBoundary` at the route level and around critical components
- [ ] Errors are logged as structured JSON with correlation ID, path, method, and status code
- [ ] Stack traces are logged server-side only, never sent in API responses
- [ ] Custom domain exceptions extend framework base exceptions with descriptive messages
