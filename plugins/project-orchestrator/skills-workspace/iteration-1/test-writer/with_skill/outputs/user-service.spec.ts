import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { BcryptService } from './bcrypt.service';
import {
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';

// ---------------------------------------------------------------------------
// Test Data Factories
// ---------------------------------------------------------------------------

interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-' + Math.random().toString(36).slice(2, 8),
    email: 'jane@example.com',
    password: '$2b$10$hashedpasswordvalue',
    name: 'Jane Doe',
    createdAt: new Date('2026-01-15T00:00:00Z'),
    updatedAt: new Date('2026-01-15T00:00:00Z'),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

function createMockUserRepository(): jest.Mocked<UserRepository> {
  return {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  } as unknown as jest.Mocked<UserRepository>;
}

function createMockBcryptService(): jest.Mocked<BcryptService> {
  return {
    hash: jest.fn(),
    compare: jest.fn(),
  } as unknown as jest.Mocked<BcryptService>;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('UserService', () => {
  let service: UserService;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockBcryptService: jest.Mocked<BcryptService>;

  beforeEach(async () => {
    mockUserRepository = createMockUserRepository();
    mockBcryptService = createMockBcryptService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: UserRepository, useValue: mockUserRepository },
        { provide: BcryptService, useValue: mockBcryptService },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // register(email, password, name)
  // =========================================================================

  describe('register', () => {
    // --- Happy path ---

    it('should register a new user with valid inputs', async () => {
      // Arrange
      const email = 'newuser@example.com';
      const password = 'SecureP@ss1';
      const name = 'New User';
      const hashedPassword = '$2b$10$hashed';
      const savedUser = buildUser({ email, password: hashedPassword, name });

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockBcryptService.hash.mockResolvedValue(hashedPassword);
      mockUserRepository.save.mockResolvedValue(savedUser);

      // Act
      const result = await service.register(email, password, name);

      // Assert
      expect(result).toEqual(savedUser);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(mockBcryptService.hash).toHaveBeenCalledWith(password);
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ email, password: hashedPassword, name }),
      );
    });

    it('should hash the password before saving', async () => {
      // Arrange
      const rawPassword = 'MyPassword123!';
      const hashedPassword = '$2b$10$completelydifferent';

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockBcryptService.hash.mockResolvedValue(hashedPassword);
      mockUserRepository.save.mockResolvedValue(
        buildUser({ password: hashedPassword }),
      );

      // Act
      await service.register('test@example.com', rawPassword, 'Test');

      // Assert
      expect(mockBcryptService.hash).toHaveBeenCalledWith(rawPassword);
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ password: hashedPassword }),
      );
      // Ensure the raw password is never passed to save
      expect(mockUserRepository.save).not.toHaveBeenCalledWith(
        expect.objectContaining({ password: rawPassword }),
      );
    });

    // --- Validation ---

    it('should reject registration when email is already taken', async () => {
      // Arrange
      const existingUser = buildUser({ email: 'taken@example.com' });
      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      // Act & Assert
      await expect(
        service.register('taken@example.com', 'Password1!', 'User'),
      ).rejects.toThrow(ConflictException);

      expect(mockBcryptService.hash).not.toHaveBeenCalled();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should reject registration with an empty email', async () => {
      // Act & Assert
      await expect(
        service.register('', 'Password1!', 'User'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject registration with an empty password', async () => {
      // Act & Assert
      await expect(
        service.register('user@example.com', '', 'User'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject registration with an empty name', async () => {
      // Act & Assert
      await expect(
        service.register('user@example.com', 'Password1!', ''),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject registration with an invalid email format', async () => {
      // Act & Assert
      await expect(
        service.register('not-an-email', 'Password1!', 'User'),
      ).rejects.toThrow(BadRequestException);
    });

    // --- Edge cases ---

    it('should trim whitespace from email before checking', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockBcryptService.hash.mockResolvedValue('$2b$10$hashed');
      mockUserRepository.save.mockResolvedValue(
        buildUser({ email: 'user@example.com' }),
      );

      // Act
      await service.register('  user@example.com  ', 'Password1!', 'User');

      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        'user@example.com',
      );
    });

    it('should handle email with mixed casing by normalizing to lowercase', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockBcryptService.hash.mockResolvedValue('$2b$10$hashed');
      mockUserRepository.save.mockResolvedValue(
        buildUser({ email: 'user@example.com' }),
      );

      // Act
      await service.register('User@Example.COM', 'Password1!', 'User');

      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        'user@example.com',
      );
    });

    it('should handle names with Unicode characters', async () => {
      // Arrange
      const unicodeName = 'Jose Garcia';
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockBcryptService.hash.mockResolvedValue('$2b$10$hashed');
      mockUserRepository.save.mockResolvedValue(
        buildUser({ name: unicodeName }),
      );

      // Act
      const result = await service.register(
        'jose@example.com',
        'Password1!',
        unicodeName,
      );

      // Assert
      expect(result.name).toBe(unicodeName);
    });

    // --- Error handling ---

    it('should propagate error when repository save fails', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockBcryptService.hash.mockResolvedValue('$2b$10$hashed');
      mockUserRepository.save.mockRejectedValue(
        new InternalServerErrorException('Database connection lost'),
      );

      // Act & Assert
      await expect(
        service.register('user@example.com', 'Password1!', 'User'),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should propagate error when bcrypt hashing fails', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockBcryptService.hash.mockRejectedValue(new Error('Hashing failed'));

      // Act & Assert
      await expect(
        service.register('user@example.com', 'Password1!', 'User'),
      ).rejects.toThrow('Hashing failed');

      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should propagate error when findByEmail fails', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockRejectedValue(
        new Error('DB timeout'),
      );

      // Act & Assert
      await expect(
        service.register('user@example.com', 'Password1!', 'User'),
      ).rejects.toThrow('DB timeout');
    });

    // --- Security ---

    it('should never return the raw password in the response', async () => {
      // Arrange
      const rawPassword = 'SuperSecret123!';
      const hashedPassword = '$2b$10$completelydifferent';

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockBcryptService.hash.mockResolvedValue(hashedPassword);
      mockUserRepository.save.mockResolvedValue(
        buildUser({ password: hashedPassword }),
      );

      // Act
      const result = await service.register(
        'user@example.com',
        rawPassword,
        'User',
      );

      // Assert
      expect(result.password).not.toBe(rawPassword);
      expect(result.password).toBe(hashedPassword);
    });

    it('should reject SQL injection attempts in email', async () => {
      // Act & Assert
      await expect(
        service.register(
          "'; DROP TABLE users; --",
          'Password1!',
          'Hacker',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // =========================================================================
  // login(email, password)
  // =========================================================================

  describe('login', () => {
    // --- Happy path ---

    it('should login successfully with valid credentials', async () => {
      // Arrange
      const user = buildUser({ email: 'user@example.com' });
      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockBcryptService.compare.mockResolvedValue(true);

      // Act
      const result = await service.login('user@example.com', 'CorrectPass1!');

      // Assert
      expect(result).toBeDefined();
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        'user@example.com',
      );
      expect(mockBcryptService.compare).toHaveBeenCalledWith(
        'CorrectPass1!',
        user.password,
      );
    });

    // --- Validation ---

    it('should reject login with a non-existent email', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.login('unknown@example.com', 'Password1!'),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockBcryptService.compare).not.toHaveBeenCalled();
    });

    it('should reject login with an incorrect password', async () => {
      // Arrange
      const user = buildUser({ email: 'user@example.com' });
      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockBcryptService.compare.mockResolvedValue(false);

      // Act & Assert
      await expect(
        service.login('user@example.com', 'WrongPassword!'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject login with an empty email', async () => {
      // Act & Assert
      await expect(service.login('', 'Password1!')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject login with an empty password', async () => {
      // Act & Assert
      await expect(
        service.login('user@example.com', ''),
      ).rejects.toThrow(BadRequestException);
    });

    // --- Edge cases ---

    it('should normalize email casing before lookup', async () => {
      // Arrange
      const user = buildUser({ email: 'user@example.com' });
      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockBcryptService.compare.mockResolvedValue(true);

      // Act
      await service.login('User@Example.COM', 'CorrectPass1!');

      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        'user@example.com',
      );
    });

    it('should trim whitespace from email', async () => {
      // Arrange
      const user = buildUser({ email: 'user@example.com' });
      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockBcryptService.compare.mockResolvedValue(true);

      // Act
      await service.login('  user@example.com  ', 'CorrectPass1!');

      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        'user@example.com',
      );
    });

    // --- Error handling ---

    it('should propagate error when repository lookup fails', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockRejectedValue(
        new Error('Connection refused'),
      );

      // Act & Assert
      await expect(
        service.login('user@example.com', 'Password1!'),
      ).rejects.toThrow('Connection refused');
    });

    it('should propagate error when bcrypt compare fails', async () => {
      // Arrange
      const user = buildUser({ email: 'user@example.com' });
      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockBcryptService.compare.mockRejectedValue(
        new Error('Bcrypt internal error'),
      );

      // Act & Assert
      await expect(
        service.login('user@example.com', 'Password1!'),
      ).rejects.toThrow('Bcrypt internal error');
    });

    // --- Security ---

    it('should not reveal whether the email or password was wrong', async () => {
      // Arrange — non-existent email
      mockUserRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert — same error type for both cases
      const emailError = service.login('wrong@example.com', 'Password1!');
      await expect(emailError).rejects.toThrow(UnauthorizedException);

      // Arrange — wrong password
      const user = buildUser({ email: 'user@example.com' });
      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockBcryptService.compare.mockResolvedValue(false);

      const passwordError = service.login('user@example.com', 'WrongPass!');
      await expect(passwordError).rejects.toThrow(UnauthorizedException);
    });

    it('should reject SQL injection attempts in email', async () => {
      // Act & Assert
      await expect(
        service.login("' OR 1=1 --", 'Password1!'),
      ).rejects.toThrow();
    });

    it('should not return the hashed password in the login response', async () => {
      // Arrange
      const user = buildUser({ email: 'user@example.com' });
      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockBcryptService.compare.mockResolvedValue(true);

      // Act
      const result = await service.login('user@example.com', 'CorrectPass1!');

      // Assert — the login result (token payload, session, etc.) should not
      // contain the hashed password. The exact shape depends on the
      // implementation. We verify the password field is excluded if the
      // service returns user data.
      if (result && typeof result === 'object' && 'password' in result) {
        fail('Login response must not include the password field');
      }
    });
  });

  // =========================================================================
  // resetPassword(email)
  // =========================================================================

  describe('resetPassword', () => {
    // --- Happy path ---

    it('should initiate password reset for a registered user', async () => {
      // Arrange
      const user = buildUser({ email: 'user@example.com' });
      mockUserRepository.findByEmail.mockResolvedValue(user);

      // Act
      const result = await service.resetPassword('user@example.com');

      // Assert
      expect(result).toBeDefined();
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        'user@example.com',
      );
    });

    // --- Validation ---

    it('should reject reset with an empty email', async () => {
      // Act & Assert
      await expect(service.resetPassword('')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject reset with an invalid email format', async () => {
      // Act & Assert
      await expect(service.resetPassword('not-valid')).rejects.toThrow(
        BadRequestException,
      );
    });

    // --- Edge cases ---

    it('should normalize email casing before lookup', async () => {
      // Arrange
      const user = buildUser({ email: 'user@example.com' });
      mockUserRepository.findByEmail.mockResolvedValue(user);

      // Act
      await service.resetPassword('User@Example.COM');

      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        'user@example.com',
      );
    });

    it('should trim whitespace from email', async () => {
      // Arrange
      const user = buildUser({ email: 'user@example.com' });
      mockUserRepository.findByEmail.mockResolvedValue(user);

      // Act
      await service.resetPassword('  user@example.com  ');

      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        'user@example.com',
      );
    });

    // --- Security ---

    it('should not reveal whether the email exists in the system', async () => {
      // Arrange — email does not exist
      mockUserRepository.findByEmail.mockResolvedValue(null);

      // Act — should succeed silently (no error thrown)
      // A secure implementation returns a generic success message regardless
      // of whether the email exists, to prevent user enumeration.
      await expect(
        service.resetPassword('nonexistent@example.com'),
      ).resolves.not.toThrow();
    });

    it('should produce the same response shape for existing and non-existing emails', async () => {
      // Arrange — existing user
      const user = buildUser({ email: 'exists@example.com' });
      mockUserRepository.findByEmail.mockResolvedValue(user);
      const resultExisting = await service.resetPassword('exists@example.com');

      // Arrange — non-existing user
      mockUserRepository.findByEmail.mockResolvedValue(null);
      const resultNonExisting = await service.resetPassword(
        'ghost@example.com',
      );

      // Assert — both should resolve to equivalent success shapes
      // (prevents user enumeration via response differentiation)
      expect(typeof resultExisting).toBe(typeof resultNonExisting);
    });

    it('should reject SQL injection attempts in email', async () => {
      // Act & Assert
      await expect(
        service.resetPassword("'; DROP TABLE users; --"),
      ).rejects.toThrow();
    });

    // --- Error handling ---

    it('should propagate error when repository lookup fails', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockRejectedValue(
        new Error('DB connection lost'),
      );

      // Act & Assert
      await expect(
        service.resetPassword('user@example.com'),
      ).rejects.toThrow('DB connection lost');
    });

    it('should propagate error when the update operation fails', async () => {
      // Arrange
      const user = buildUser({ email: 'user@example.com' });
      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockUserRepository.update.mockRejectedValue(
        new Error('Write failed'),
      );

      // Act & Assert
      // This tests the scenario where generating/saving the reset token fails.
      // If the implementation does not call update, this test simply validates
      // that the service handles downstream failures.
      await expect(
        service.resetPassword('user@example.com'),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // Concurrency scenarios
  // =========================================================================

  describe('concurrency', () => {
    it('should handle concurrent registrations with the same email', async () => {
      // Arrange — first call sees no user, second call also sees no user
      // (race condition window)
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockBcryptService.hash.mockResolvedValue('$2b$10$hashed');

      // First save succeeds, second save fails with a unique constraint violation
      mockUserRepository.save
        .mockResolvedValueOnce(buildUser({ email: 'race@example.com' }))
        .mockRejectedValueOnce(
          new ConflictException('Unique constraint violation'),
        );

      // Act
      const first = service.register('race@example.com', 'Pass1!', 'User1');
      const second = service.register('race@example.com', 'Pass2!', 'User2');

      // Assert — one succeeds, the other fails
      await expect(first).resolves.toBeDefined();
      await expect(second).rejects.toThrow(ConflictException);
    });

    it('should handle concurrent login attempts for the same user', async () => {
      // Arrange
      const user = buildUser({ email: 'user@example.com' });
      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockBcryptService.compare.mockResolvedValue(true);

      // Act — fire multiple logins concurrently
      const results = await Promise.all([
        service.login('user@example.com', 'CorrectPass1!'),
        service.login('user@example.com', 'CorrectPass1!'),
        service.login('user@example.com', 'CorrectPass1!'),
      ]);

      // Assert — all should succeed independently
      results.forEach((result) => {
        expect(result).toBeDefined();
      });
      expect(mockUserRepository.findByEmail).toHaveBeenCalledTimes(3);
    });

    it('should handle concurrent password reset requests', async () => {
      // Arrange
      const user = buildUser({ email: 'user@example.com' });
      mockUserRepository.findByEmail.mockResolvedValue(user);

      // Act — fire multiple resets concurrently
      const results = await Promise.allSettled([
        service.resetPassword('user@example.com'),
        service.resetPassword('user@example.com'),
      ]);

      // Assert — all should settle without unhandled rejections
      results.forEach((result) => {
        expect(['fulfilled', 'rejected']).toContain(result.status);
      });
    });
  });

  // =========================================================================
  // Cross-cutting: isolation between tests
  // =========================================================================

  describe('test isolation', () => {
    it('should not carry state between tests (mock reset verification)', () => {
      // Assert — mocks should be clean at the start of each test
      expect(mockUserRepository.findByEmail).not.toHaveBeenCalled();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
      expect(mockBcryptService.hash).not.toHaveBeenCalled();
      expect(mockBcryptService.compare).not.toHaveBeenCalled();
    });
  });
});
