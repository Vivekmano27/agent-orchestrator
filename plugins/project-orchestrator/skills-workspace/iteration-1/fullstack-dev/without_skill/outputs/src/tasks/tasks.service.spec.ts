import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { TaskStatus, TaskPriority } from '@prisma/client';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TasksService', () => {
  let service: TasksService;
  let prisma: {
    task: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      count: jest.Mock;
      groupBy: jest.Mock;
    };
  };

  const userId = 'user-uuid-123';
  const taskId = 'task-uuid-456';

  const mockTask = {
    id: taskId,
    title: 'Test Task',
    description: 'Test description',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    dueDate: null,
    userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      task: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new task', async () => {
      const dto = { title: 'New Task', description: 'Description' };
      prisma.task.create.mockResolvedValue({ ...mockTask, ...dto });

      const result = await service.create(userId, dto);

      expect(result.title).toBe('New Task');
      expect(prisma.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'New Task',
          description: 'Description',
          userId,
        }),
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated tasks', async () => {
      prisma.task.findMany.mockResolvedValue([mockTask]);
      prisma.task.count.mockResolvedValue(1);

      const result = await service.findAll(userId, { page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });

    it('should filter by status', async () => {
      prisma.task.findMany.mockResolvedValue([]);
      prisma.task.count.mockResolvedValue(0);

      await service.findAll(userId, { status: TaskStatus.DONE });

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: TaskStatus.DONE }),
        }),
      );
    });

    it('should search by title and description', async () => {
      prisma.task.findMany.mockResolvedValue([]);
      prisma.task.count.mockResolvedValue(0);

      await service.findAll(userId, { search: 'test' });

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ title: expect.objectContaining({ contains: 'test' }) }),
            ]),
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a task if it belongs to the user', async () => {
      prisma.task.findUnique.mockResolvedValue(mockTask);

      const result = await service.findOne(userId, taskId);

      expect(result).toEqual(mockTask);
    });

    it('should throw NotFoundException if task does not exist', async () => {
      prisma.task.findUnique.mockResolvedValue(null);

      await expect(service.findOne(userId, taskId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if task belongs to another user', async () => {
      prisma.task.findUnique.mockResolvedValue({ ...mockTask, userId: 'other-user' });

      await expect(service.findOne(userId, taskId)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update a task', async () => {
      prisma.task.findUnique.mockResolvedValue(mockTask);
      prisma.task.update.mockResolvedValue({ ...mockTask, title: 'Updated' });

      const result = await service.update(userId, taskId, { title: 'Updated' });

      expect(result.title).toBe('Updated');
    });

    it('should throw NotFoundException if task not found', async () => {
      prisma.task.findUnique.mockResolvedValue(null);

      await expect(service.update(userId, taskId, { title: 'Updated' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a task', async () => {
      prisma.task.findUnique.mockResolvedValue(mockTask);
      prisma.task.delete.mockResolvedValue(mockTask);

      await service.remove(userId, taskId);

      expect(prisma.task.delete).toHaveBeenCalledWith({ where: { id: taskId } });
    });

    it('should throw NotFoundException if task not found', async () => {
      prisma.task.findUnique.mockResolvedValue(null);

      await expect(service.remove(userId, taskId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should update task status', async () => {
      prisma.task.findUnique.mockResolvedValue(mockTask);
      prisma.task.update.mockResolvedValue({ ...mockTask, status: TaskStatus.DONE });

      const result = await service.updateStatus(userId, taskId, TaskStatus.DONE);

      expect(result.status).toBe(TaskStatus.DONE);
    });
  });

  describe('getStats', () => {
    it('should return task statistics', async () => {
      prisma.task.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(2); // overdue
      prisma.task.groupBy
        .mockResolvedValueOnce([
          { status: TaskStatus.TODO, _count: { status: 5 } },
          { status: TaskStatus.DONE, _count: { status: 5 } },
        ])
        .mockResolvedValueOnce([
          { priority: TaskPriority.HIGH, _count: { priority: 3 } },
          { priority: TaskPriority.MEDIUM, _count: { priority: 7 } },
        ]);

      const result = await service.getStats(userId);

      expect(result.total).toBe(10);
      expect(result.overdue).toBe(2);
      expect(result.byStatus).toEqual({ TODO: 5, DONE: 5 });
      expect(result.byPriority).toEqual({ HIGH: 3, MEDIUM: 7 });
    });
  });
});
