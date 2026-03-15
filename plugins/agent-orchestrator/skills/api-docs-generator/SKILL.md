---
name: api-docs-generator
description: Generate API documentation from code — endpoint descriptions, request/response examples, auth guides, SDK samples. Supports OpenAPI/Swagger output. Use when the user says "API documentation", "generate docs from code", "Swagger docs", "OpenAPI spec", "document endpoints", or needs to create API reference docs.
allowed-tools: Read, Write, Edit, Grep, Glob
---

# API Docs Generator Skill

Generate OpenAPI 3.0 documentation from NestJS and Django REST Framework codebases. Produces endpoint descriptions, request/response schemas, authentication guides, and error code references.

## When to Use

- User asks to generate or update API documentation
- A new endpoint or service is created and needs docs
- API contracts need to be defined before implementation
- Swagger/OpenAPI spec needs to be exported for consumers
- Documentation drift is suspected (code changed, docs did not)

## Patterns

### NestJS — OpenAPI with @nestjs/swagger

Add Swagger decorators to every controller and DTO:

```typescript
// users.controller.ts
import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('api/v1/users')
export class UsersController {
  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List users with pagination' })
  @ApiQuery({ name: 'cursor', required: false, description: 'Pagination cursor' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Page size (max 100)' })
  @ApiResponse({ status: 200, description: 'Paginated list of users' })
  async findAll(@Query('cursor') cursor?: string, @Query('limit') limit?: number) {
    return this.usersService.findAll({ cursor, limit });
  }
}
```

Annotate DTOs with `@ApiProperty` for schema generation:

```typescript
// dto/create-user.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'jane@example.com', description: 'Unique email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Jane Doe', minLength: 2 })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({ example: 'product_manager', enum: ['admin', 'user', 'product_manager'] })
  role?: string;
}
```

### Django REST Framework — drf-spectacular

Use `drf-spectacular` for OpenAPI 3.0 generation:

```python
# settings.py
REST_FRAMEWORK = {
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}

SPECTACULAR_SETTINGS = {
    "TITLE": "AI Service API",
    "DESCRIPTION": "ML model inference and LLM integration endpoints",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
}
```

Add `@extend_schema` to views for precise documentation:

```python
# views.py
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiExample
from rest_framework import viewsets, status

class InferenceViewSet(viewsets.ViewSet):
    @extend_schema(
        request=InferenceRequestSerializer,
        responses={
            200: InferenceResponseSerializer,
            422: OpenApiResponse(description="Model could not process input"),
            429: OpenApiResponse(description="Rate limit exceeded"),
        },
        examples=[
            OpenApiExample("Sentiment analysis", value={"text": "Great product!", "model": "sentiment-v2"}),
        ],
    )
    def create(self, request):
        """Run inference on the specified model."""
        ...
```

### Documentation Structure

Every generated API doc must include these sections in order:

1. **Overview** — service purpose, base URL, versioning scheme
2. **Authentication** — token format, how to obtain, refresh flow, example header
3. **Endpoints by Resource** — grouped by tag/resource, each with method, path, description, request body, query params, response schema, error responses
4. **Error Codes** — table of all error codes with meaning and resolution
5. **Rate Limits** — per-endpoint or global limits, headers returned (`X-RateLimit-Remaining`)

## Anti-patterns

- **Outdated documentation** — docs that describe removed or renamed fields; always regenerate from code
- **Missing error responses** — only documenting the 200 case; every endpoint must document 4xx and 5xx responses
- **No authentication section** — consumers cannot use the API without knowing how to authenticate
- **Generic descriptions** — using "Get item" instead of "Retrieve a user profile by their unique ID"
- **Undocumented query parameters** — pagination, filtering, and sorting params left out of the spec
- **No examples** — request and response bodies without concrete example values

## Checklist

- [ ] Every controller/view has `@ApiTags` or is grouped in the schema
- [ ] Every endpoint has `@ApiOperation` / `@extend_schema` with a summary
- [ ] Every DTO/serializer field has `@ApiProperty` or serializer documentation
- [ ] All possible HTTP status codes are documented per endpoint
- [ ] Authentication requirements are documented (which endpoints need auth, which are public)
- [ ] Pagination parameters and response shape are documented
- [ ] Error response format is consistent and documented
- [ ] Rate limit headers and thresholds are documented
- [ ] OpenAPI spec validates without errors (`npx @redocly/cli lint openapi.yaml`)
- [ ] Generated docs match the actual API behavior (run a smoke test)
