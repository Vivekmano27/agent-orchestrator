import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Task, TaskStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateTaskDto): Promise<Task> {
    return this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        priority: dto.priority,
        dueDate: dto.dueDate,
        userId,
      },
    });
  }

  async findAll(userId: string, query: QueryTasksDto): Promise<PaginatedResult<Task>> {
    const { page = 1, limit = 10, status, priority, search, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.TaskWhereInput = {
      userId,
      ...(status && { status }),
      ...(priority && { priority }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
          { description: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(userId: string, taskId: string): Promise<Task> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID "${taskId}" not found`);
    }

    if (task.userId !== userId) {
      throw new ForbiddenException('You do not have access to this task');
    }

    return task;
  }

  async update(userId: string, taskId: string, dto: UpdateTaskDto): Promise<Task> {
    await this.findOne(userId, taskId);

    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.dueDate !== undefined && { dueDate: dto.dueDate }),
      },
    });
  }

  async remove(userId: string, taskId: string): Promise<void> {
    await this.findOne(userId, taskId);

    await this.prisma.task.delete({
      where: { id: taskId },
    });
  }

  async updateStatus(userId: string, taskId: string, status: TaskStatus): Promise<Task> {
    await this.findOne(userId, taskId);

    return this.prisma.task.update({
      where: { id: taskId },
      data: { status },
    });
  }

  async getStats(userId: string) {
    const [total, byStatus, byPriority, overdue] = await Promise.all([
      this.prisma.task.count({ where: { userId } }),
      this.prisma.task.groupBy({
        by: ['status'],
        where: { userId },
        _count: { status: true },
      }),
      this.prisma.task.groupBy({
        by: ['priority'],
        where: { userId },
        _count: { priority: true },
      }),
      this.prisma.task.count({
        where: {
          userId,
          status: { not: TaskStatus.DONE },
          dueDate: { lt: new Date() },
        },
      }),
    ]);

    return {
      total,
      overdue,
      byStatus: byStatus.reduce(
        (acc, item) => ({ ...acc, [item.status]: item._count.status }),
        {},
      ),
      byPriority: byPriority.reduce(
        (acc, item) => ({ ...acc, [item.priority]: item._count.priority }),
        {},
      ),
    };
  }
}
