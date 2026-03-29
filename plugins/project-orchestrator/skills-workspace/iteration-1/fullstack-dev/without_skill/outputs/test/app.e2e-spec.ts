import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Task Management API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    prisma = app.get(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.task.deleteMany();
    await prisma.user.deleteMany();
    await app.close();
  });

  describe('Auth', () => {
    const testUser = {
      email: 'e2e-test@example.com',
      password: 'SecurePass123!',
      firstName: 'E2E',
      lastName: 'Test',
    };

    it('POST /auth/register - should register a new user', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201)
        .expect((res) => {
          expect(res.body.data.accessToken).toBeDefined();
          expect(res.body.data.user.email).toBe(testUser.email);
          accessToken = res.body.data.accessToken;
        });
    });

    it('POST /auth/register - should reject duplicate email', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(409);
    });

    it('POST /auth/login - should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.accessToken).toBeDefined();
        });
    });

    it('POST /auth/login - should reject invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: testUser.email, password: 'wrong-password' })
        .expect(401);
    });

    it('POST /auth/register - should reject invalid email', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...testUser, email: 'invalid-email' })
        .expect(400);
    });

    it('POST /auth/register - should reject short password', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...testUser, email: 'new@example.com', password: 'short' })
        .expect(400);
    });
  });

  describe('Tasks', () => {
    let taskId: string;

    it('POST /tasks - should create a task', () => {
      return request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'E2E Test Task', description: 'Created during e2e testing' })
        .expect(201)
        .expect((res) => {
          expect(res.body.data.title).toBe('E2E Test Task');
          taskId = res.body.data.id;
        });
    });

    it('POST /tasks - should reject unauthenticated request', () => {
      return request(app.getHttpServer())
        .post('/tasks')
        .send({ title: 'Unauthorized Task' })
        .expect(401);
    });

    it('POST /tasks - should reject task without title', () => {
      return request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ description: 'No title' })
        .expect(400);
    });

    it('GET /tasks - should return user tasks', () => {
      return request(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.data).toBeInstanceOf(Array);
          expect(res.body.data.meta).toBeDefined();
          expect(res.body.data.meta.total).toBeGreaterThanOrEqual(1);
        });
    });

    it('GET /tasks/:id - should return a specific task', () => {
      return request(app.getHttpServer())
        .get(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.id).toBe(taskId);
        });
    });

    it('PATCH /tasks/:id - should update a task', () => {
      return request(app.getHttpServer())
        .patch(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Updated E2E Task', status: 'IN_PROGRESS' })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.title).toBe('Updated E2E Task');
          expect(res.body.data.status).toBe('IN_PROGRESS');
        });
    });

    it('PATCH /tasks/:id/status - should update task status', () => {
      return request(app.getHttpServer())
        .patch(`/tasks/${taskId}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'DONE' })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.status).toBe('DONE');
        });
    });

    it('GET /tasks/stats - should return task statistics', () => {
      return request(app.getHttpServer())
        .get('/tasks/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('total');
          expect(res.body.data).toHaveProperty('byStatus');
          expect(res.body.data).toHaveProperty('byPriority');
        });
    });

    it('DELETE /tasks/:id - should delete a task', () => {
      return request(app.getHttpServer())
        .delete(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);
    });

    it('GET /tasks/:id - should return 404 for deleted task', () => {
      return request(app.getHttpServer())
        .get(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('Users', () => {
    it('GET /users/me - should return current user profile', () => {
      return request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.email).toBe('e2e-test@example.com');
          expect(res.body.data).not.toHaveProperty('password');
        });
    });

    it('GET /users/me - should reject unauthenticated request', () => {
      return request(app.getHttpServer())
        .get('/users/me')
        .expect(401);
    });
  });
});
