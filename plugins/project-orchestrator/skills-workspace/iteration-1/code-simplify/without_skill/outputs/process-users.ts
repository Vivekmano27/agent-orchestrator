interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  status: string;
  age: number;
  createdAt: string;
}

interface ProcessedUser {
  id: string;
  name: string;
  email: string;
  isAdult: true;
  registeredDays: number;
}

const MS_PER_DAY = 86_400_000;

function formatName(user: User): string {
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
  return user.firstName ?? 'Unknown';
}

function daysSince(dateString: string): number {
  return Math.floor((Date.now() - new Date(dateString).getTime()) / MS_PER_DAY);
}

function processUsers(users: User[]): ProcessedUser[] {
  return users
    .filter((user): user is User => user != null)
    .filter(user => user.status === 'active' && user.age >= 18)
    .map(user => ({
      id: user.id,
      name: formatName(user),
      email: user.email,
      isAdult: true as const,
      registeredDays: daysSince(user.createdAt),
    }));
}
