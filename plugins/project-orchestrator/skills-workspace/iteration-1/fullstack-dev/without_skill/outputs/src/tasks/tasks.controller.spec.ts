import { Test, TestingModule } from '@nestjs/testing';
import { TaskStatus, TaskPriority } from '@prisma/client';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

describe('TasksController', () => {
  let controller: TasksController;
  let tasksService: jest.Mocked<Partial<TasksService>>;

  const mockUser = { id: 'user-uuid-123', email: 'test@example.com' };
  const mockTask = {
    id: 'task-uuid-456',
    title: 'Test Task',
    description: 'Test description',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    dueDate: null,
    userId: mockUser.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    tasksService = {
      create: jest.fn().mockResolvedValue(mockTask),
      findAll: jest.fn().mockResolvedValue({
        data: [mockTask],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      }),
      findOne: jest.fn().mockResolvedValue(mockTask),
      update: jest.fn().mockResolvedValue({ ...mockTask, title: 'Updated' }),
      remove: jest.fn().mockResolvedValue(undefined),
      updateStatus: jest.fn().mockResolvedValue({ ...mockTask, status: TaskStatus.DONE }),
      getStats: jest.fn().mockResolvedValue({ total: 1, overdue: 0, byStatus: {}, byPriority: {} }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [{ provide: TasksService, useValue: tasksService }],
    }).compile();

    controller = module.get<TasksController>(TasksController);
  });

  describe('create', () => {
    it('should create a task', async () => {
      const dto = { title: 'Test Task' };
      const result = await controller.create(mockUser, dto);

      expect(result).toEqual(mockTask);
      expect(tasksService.create).toHaveBeenCalledWith(mockUser.id, dto);
    });
  });

  describe('findAll', () => {
    it('should return paginated tasks', async () => {
      const query = { page: 1, limit: 10 };
      const result = await controller.findAll(mockUser, query);

      expect(result.data).toHaveLength(1);
      expect(tasksService.findAll).toHaveBeenCalledWith(mockUser.id, query);
    });
  });

  describe('findOne', () => {
    it('should return a task by id', async () => {
      const result = await controller.findOne(mockUser, mockTask.id);

      expect(result).toEqual(mockTask);
      expect(tasksService.findOne).toHaveBeenCalledWith(mockUser.id, mockTask.id);
    });
  });

  describe('update', () => {
    it('should update a task', async () => {
      const dto = { title: 'Updated' };
      const result = await controller.update(mockUser, mockTask.id, dto);

      expect(result.title).toBe('Updated');
      expect(tasksService.update).toHaveBeenCalledWith(mockUser.id, mockTask.id, dto);
    });
  });

  describe('updateStatus', () => {
    it('should update task status', async () => {
      const result = await controller.updateStatus(mockUser, mockTask.id, TaskStatus.DONE);

      expect(result.status).toBe(TaskStatus.DONE);
    });
  });

  describe('remove', () => {
    it('should delete a task', async () => {
      await controller.remove(mockUser, mockTask.id);

      expect(tasksService.remove).toHaveBeenCalledWith(mockUser.id, mockTask.id);
    });
  });

  describe('getStats', () => {
    it('should return task statistics', async () => {
      const result = await controller.getStats(mockUser);

      expect(result).toHaveProperty('total');
      expect(tasksService.getStats).toHaveBeenCalledWith(mockUser.id);
    });
  });
});
