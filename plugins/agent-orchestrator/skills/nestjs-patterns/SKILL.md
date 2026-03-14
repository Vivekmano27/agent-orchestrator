---
name: nestjs-patterns
description: Implement NestJS best practices — module architecture, dependency injection, guards, pipes, interceptors, exception filters, DTOs with class-validator, TypeORM/Prisma integration, and testing patterns. Use when building NestJS applications, creating modules, implementing middleware, or following NestJS conventions. Trigger on "NestJS", "Nest.js", "NestJS module", "NestJS guard", "NestJS service".
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# NestJS Patterns Skill

Build production-grade NestJS applications following official best practices.

## Module Architecture
```
src/
├── main.ts                    → Bootstrap + global config
├── app.module.ts              → Root module (imports all feature modules)
├── common/                    → Shared across all modules
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   ├── pipes/
│   │   └── validation.pipe.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   ├── interceptors/
│   │   ├── logging.interceptor.ts
│   │   └── transform.interceptor.ts
│   ├── decorators/
│   │   ├── roles.decorator.ts
│   │   └── current-user.decorator.ts
│   └── dto/
│       └── pagination.dto.ts
├── config/
│   ├── config.module.ts
│   └── database.config.ts
└── modules/
    ├── auth/
    │   ├── auth.module.ts
    │   ├── auth.controller.ts
    │   ├── auth.service.ts
    │   ├── auth.controller.spec.ts
    │   ├── dto/
    │   │   ├── login.dto.ts
    │   │   └── register.dto.ts
    │   ├── entities/
    │   │   └── refresh-token.entity.ts
    │   └── strategies/
    │       ├── jwt.strategy.ts
    │       └── local.strategy.ts
    └── users/
        ├── users.module.ts
        ├── users.controller.ts
        ├── users.service.ts
        ├── users.service.spec.ts
        ├── dto/
        │   ├── create-user.dto.ts
        │   └── update-user.dto.ts
        └── entities/
            └── user.entity.ts
```

## DTO with Validation
```typescript
import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ enum: ['admin', 'member', 'viewer'], default: 'member' })
  @IsOptional()
  @IsEnum(['admin', 'member', 'viewer'])
  role?: string;
}
```

## Service Pattern
```typescript
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already exists');
    
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({ ...dto, passwordHash });
    return this.userRepo.save(user);
  }

  async findAll(pagination: PaginationDto): Promise<PaginatedResult<User>> {
    const [items, total] = await this.userRepo.findAndCount({
      take: pagination.limit,
      skip: (pagination.page - 1) * pagination.limit,
      order: { createdAt: 'DESC' },
    });
    return { items, total, page: pagination.page, limit: pagination.limit };
  }
}
```

## Exception Filter
```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    
    const message = exception instanceof HttpException
      ? exception.getResponse()
      : 'Internal server error';

    response.status(status).json({
      error: {
        code: status,
        message: typeof message === 'string' ? message : (message as any).message,
        path: request.url,
        timestamp: new Date().toISOString(),
        requestId: request.headers['x-request-id'],
      },
    });
  }
}
```

## Testing Pattern
```typescript
describe('UsersService', () => {
  let service: UsersService;
  let repo: MockType<Repository<User>>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useFactory: repositoryMockFactory },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();
    
    service = module.get(UsersService);
    repo = module.get(getRepositoryToken(User));
  });

  it('should create user', async () => {
    repo.findOne.mockResolvedValue(null);
    repo.create.mockReturnValue({ id: '1', email: 'test@test.com' });
    repo.save.mockResolvedValue({ id: '1', email: 'test@test.com' });
    
    const result = await service.create({ email: 'test@test.com', name: 'Test', password: 'Pass123!' });
    expect(result.email).toBe('test@test.com');
  });
});
```
