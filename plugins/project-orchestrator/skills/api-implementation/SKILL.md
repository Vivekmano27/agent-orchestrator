---
name: api-implementation
description: Implement REST/GraphQL APIs with validation, error handling, pagination, auth middleware, rate limiting, and consistent response formats. Use when the user mentions "Build the API", "Implement endpoint", or related tasks.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# API Implementation Skill

Implement REST APIs following the Controller -> Service -> Repository pattern in NestJS and the ViewSet + Serializer pattern in Django REST Framework. Enforces request validation, consistent response shapes, auth guards, and pagination.

## When to Use

- User asks to build a new API endpoint or resource
- An existing endpoint needs validation, pagination, or auth added
- A CRUD module needs to be scaffolded for a new domain entity
- Cross-service API calls need to be implemented with proper error handling

## Patterns

### NestJS — Controller -> Service -> Repository with DTOs

```typescript
// modules/projects/projects.controller.ts
@Controller('api/v1/projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @Roles('admin', 'user')
  async create(@Body() dto: CreateProjectDto, @CurrentUser() user: User) {
    const project = await this.projectsService.create(dto, user.id);
    return { data: project, meta: null, errors: null };
  }

  @Get()
  async findAll(@Query() query: PaginationQueryDto) {
    const result = await this.projectsService.findAll(query);
    return { data: result.items, meta: { cursor: result.nextCursor, hasMore: result.hasMore }, errors: null };
  }
}
```

### Request Validation with class-validator

Every incoming request body and query must be validated:

```typescript
// dto/create-project.dto.ts
import { IsString, IsEmail, MinLength, MaxLength, IsOptional, IsEnum } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsEnum(ProjectStatus)
  status: ProjectStatus;
}
```

Enable the global `ValidationPipe` in `main.ts`:

```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,           // strip unknown properties
  forbidNonWhitelisted: true, // throw on unknown properties
  transform: true,            // auto-transform payloads to DTO instances
}));
```

### Consistent Response Format

All endpoints return the same shape:

```typescript
// Success
{ "data": { ... }, "meta": { "cursor": "abc123", "hasMore": true }, "errors": null }

// Error
{ "data": null, "meta": null, "errors": [{ "code": "VALIDATION_ERROR", "message": "name must be at least 3 characters", "field": "name" }] }
```

### Cursor-Based Pagination (preferred over offset)

```typescript
// services/projects.service.ts
async findAll(query: PaginationQueryDto) {
  const limit = Math.min(query.limit ?? 20, 100);
  const where = query.cursor ? { id: MoreThan(decodeCursor(query.cursor)) } : {};

  const items = await this.repo.find({
    where,
    order: { id: 'ASC' },
    take: limit + 1, // fetch one extra to determine hasMore
  });

  const hasMore = items.length > limit;
  if (hasMore) items.pop();

  return {
    items,
    nextCursor: hasMore ? encodeCursor(items[items.length - 1].id) : null,
    hasMore,
  };
}
```

### Auth Middleware — JWT Guard + Roles Guard

```typescript
// common/guards/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: Error, user: User) {
    if (err || !user) throw new UnauthorizedException('Invalid or expired token');
    return user;
  }
}

// common/guards/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) return true;
    const user = context.switchToHttp().getRequest().user;
    return requiredRoles.some((role) => user.roles.includes(role));
  }
}
```

### Error Handling

Throw typed exceptions that map to HTTP status codes:

```typescript
throw new NotFoundException(`Project with ID ${id} not found`);
throw new ConflictException('A project with this name already exists');
throw new BadRequestException('Invalid date range: start must be before end');
```

### Django REST Framework — ViewSet + Serializer

```python
# serializers.py
class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ["id", "name", "description", "status", "created_at"]
        read_only_fields = ["id", "created_at"]

    def validate_name(self, value):
        if len(value) < 3:
            raise serializers.ValidationError("Name must be at least 3 characters.")
        return value

# views.py
class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = CursorPagination

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
```

## Anti-patterns

- **No validation** — accepting raw `req.body` without DTO validation; always use `class-validator` or serializers
- **Inconsistent response shapes** — some endpoints returning `{ result }`, others `{ data }`, others raw arrays
- **N+1 queries in list endpoints** — loading related entities inside a loop; use eager loading or `select_related`/`prefetch_related`
- **Offset pagination on large tables** — O(n) skip cost; use cursor-based pagination instead
- **Catching errors and returning 200** — masking failures from the client; let exceptions propagate to the global filter
- **Missing auth on mutating endpoints** — every POST/PUT/PATCH/DELETE must have an auth guard
- **Hardcoded IDs or magic strings** — use enums and constants

## Checklist

- [ ] Every request body has a validated DTO / serializer
- [ ] Global `ValidationPipe` is enabled (NestJS) or validation is on serializer (Django)
- [ ] Response format is `{ data, meta, errors }` on all endpoints
- [ ] List endpoints use cursor-based pagination with configurable limit (max 100)
- [ ] Auth guard is applied to all mutating endpoints
- [ ] Role-based access control is enforced where needed
- [ ] Error responses use proper HTTP status codes (400, 401, 403, 404, 409, 422)
- [ ] Cross-service calls have timeouts and error handling
- [ ] Unit tests cover happy path and all error branches
- [ ] No N+1 queries — verified with query logging or `EXPLAIN`
