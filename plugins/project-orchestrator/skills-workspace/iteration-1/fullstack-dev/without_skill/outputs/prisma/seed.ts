import { PrismaClient, TaskStatus, TaskPriority } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      password: hashedPassword,
      firstName: 'Demo',
      lastName: 'User',
    },
  });

  console.log(`Seeded user: ${user.email}`);

  const tasks = [
    {
      title: 'Set up project repository',
      description: 'Initialize Git repo and configure CI/CD pipeline',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      userId: user.id,
    },
    {
      title: 'Design database schema',
      description: 'Create ERD and define Prisma models for the task management system',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      userId: user.id,
    },
    {
      title: 'Implement authentication',
      description: 'Set up JWT-based authentication with login and registration endpoints',
      status: TaskStatus.TODO,
      priority: TaskPriority.URGENT,
      userId: user.id,
    },
    {
      title: 'Write unit tests',
      description: 'Add comprehensive test coverage for all services',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      dueDate: new Date('2026-04-15'),
      userId: user.id,
    },
  ];

  for (const task of tasks) {
    await prisma.task.create({ data: task });
  }

  console.log(`Seeded ${tasks.length} tasks`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
