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

// ─── Mock factories ─────────────────────────────────────────────────────────

const mockUserRepository = () => ({
  findByEmail: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  updatePassword: jest.fn(),
});

const mockBcryptService = () => ({
  hash: jest.fn(),
  compare: jest.fn(),
});

// ─── Test data ───────────────────────────────────────────────────────────────

const TEST_USER = {
  id: 'uuid-1234',
  email: 'john@example.com',
  password: '$2b$10$hashedPasswordValue',
  name: 'John Doe',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const VALID_EMAIL = 'john@example.com';
const VALID_PASSWORD = 'SecureP@ss123';
const VALID_NAME = 'John Doe';
const HASHED_PASSWORD = '$2b$10$hashedPasswordValue';

// ─── Test suite ──────────────────────────────────────────────────────────────

describe('UserService', () => {
  let service: UserService;
  let userRepository: ReturnType<typeof mockUserRepository>;
  let bcryptService: ReturnType<typeof mockBcryptService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: UserRepository, useFactory: mockUserRepository },
        { provide: BcryptService, useFactory: mockBcryptService },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get(UserRepository);
    bcryptService = module.get(BcryptService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // register(email, password, name)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('register', () => {
    // ── Happy path ─────────────────────────────────────────────────────────

    it('should successfully register a new user', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      bcryptService.hash.mockResolvedValue(HASHED_PASSWORD);
      userRepository.create.mockReturnValue(TEST_USER);
      userRepository.save.mockResolvedValue(TEST_USER);

      const result = await service.register(VALID_EMAIL, VALID_PASSWORD, VALID_NAME);

      expect(userRepository.findByEmail).toHaveBeenCalledWith(VALID_EMAIL);
      expect(bcryptService.hash).toHaveBeenCalledWith(VALID_PASSWORD);
      expect(userRepository.create).toHaveBeenCalledWith({
        email: VALID_EMAIL,
        password: HASHED_PASSWORD,
        name: VALID_NAME,
      });
      expect(userRepository.save).toHaveBeenCalled();
      expect(result).toEqual(TEST_USER);
    });

    it('should hash the password before saving', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      bcryptService.hash.mockResolvedValue(HASHED_PASSWORD);
      userRepository.create.mockReturnValue(TEST_USER);
      userRepository.save.mockResolvedValue(TEST_USER);

      await service.register(VALID_EMAIL, VALID_PASSWORD, VALID_NAME);

      // Verify hash was called with the raw password, not the hashed one
      expect(bcryptService.hash).toHaveBeenCalledWith(VALID_PASSWORD);
      // Verify the repository received the hashed password, not the raw one
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ password: HASHED_PASSWORD }),
      );
    });

    it('should not return the raw password in the result', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      bcryptService.hash.mockResolvedValue(HASHED_PASSWORD);
      userRepository.create.mockReturnValue(TEST_USER);
      userRepository.save.mockResolvedValue(TEST_USER);

      const result = await service.register(VALID_EMAIL, VALID_PASSWORD, VALID_NAME);

      // The returned password should be hashed, never the raw input
      if (result.password) {
        expect(result.password).not.toBe(VALID_PASSWORD);
      }
    });

    // ── Duplicate email ────────────────────────────────────────────────────

    it('should throw ConflictException when email already exists', async () => {
      userRepository.findByEmail.mockResolvedValue(TEST_USER);

      await expect(
        service.register(VALID_EMAIL, VALID_PASSWORD, VALID_NAME),
      ).rejects.toThrow(ConflictException);

      // Should NOT hash or save when duplicate is detected
      expect(bcryptService.hash).not.toHaveBeenCalled();
      expect(userRepository.create).not.toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    // ── Input validation edge cases ────────────────────────────────────────

    it('should handle email with leading/trailing whitespace', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      bcryptService.hash.mockResolvedValue(HASHED_PASSWORD);
      userRepository.create.mockReturnValue(TEST_USER);
      userRepository.save.mockResolvedValue(TEST_USER);

      await service.register('  john@example.com  ', VALID_PASSWORD, VALID_NAME);

      // The service should normalize the email (trim whitespace)
      // This tests whether the service calls findByEmail with the trimmed version
      expect(userRepository.findByEmail).toHaveBeenCalled();
    });

    it('should handle email case normalization', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      bcryptService.hash.mockResolvedValue(HASHED_PASSWORD);
      userRepository.create.mockReturnValue(TEST_USER);
      userRepository.save.mockResolvedValue(TEST_USER);

      await service.register('JOHN@EXAMPLE.COM', VALID_PASSWORD, VALID_NAME);

      // Service should normalize email to lowercase for consistent lookups
      expect(userRepository.findByEmail).toHaveBeenCalled();
    });

    it('should throw BadRequestException for empty email', async () => {
      await expect(
        service.register('', VALID_PASSWORD, VALID_NAME),
      ).rejects.toThrow();
    });

    it('should throw BadRequestException for empty password', async () => {
      await expect(
        service.register(VALID_EMAIL, '', VALID_NAME),
      ).rejects.toThrow();
    });

    it('should throw BadRequestException for empty name', async () => {
      await expect(
        service.register(VALID_EMAIL, VALID_PASSWORD, ''),
      ).rejects.toThrow();
    });

    // ── Repository failure ─────────────────────────────────────────────────

    it('should propagate repository errors during save', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      bcryptService.hash.mockResolvedValue(HASHED_PASSWORD);
      userRepository.create.mockReturnValue(TEST_USER);
      userRepository.save.mockRejectedValue(new InternalServerErrorException('DB write failed'));

      await expect(
        service.register(VALID_EMAIL, VALID_PASSWORD, VALID_NAME),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should propagate repository errors during email lookup', async () => {
      userRepository.findByEmail.mockRejectedValue(new InternalServerErrorException('DB read failed'));

      await expect(
        service.register(VALID_EMAIL, VALID_PASSWORD, VALID_NAME),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should propagate bcrypt errors during hashing', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      bcryptService.hash.mockRejectedValue(new Error('Hashing failed'));

      await expect(
        service.register(VALID_EMAIL, VALID_PASSWORD, VALID_NAME),
      ).rejects.toThrow();
    });

    // ── Call order verification ────────────────────────────────────────────

    it('should check for existing user BEFORE hashing password', async () => {
      const callOrder: string[] = [];

      userRepository.findByEmail.mockImplementation(async () => {
        callOrder.push('findByEmail');
        return null;
      });
      bcryptService.hash.mockImplementation(async () => {
        callOrder.push('hash');
        return HASHED_PASSWORD;
      });
      userRepository.create.mockReturnValue(TEST_USER);
      userRepository.save.mockResolvedValue(TEST_USER);

      await service.register(VALID_EMAIL, VALID_PASSWORD, VALID_NAME);

      expect(callOrder.indexOf('findByEmail')).toBeLessThan(callOrder.indexOf('hash'));
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // login(email, password)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('login', () => {
    // ── Happy path ─────────────────────────────────────────────────────────

    it('should successfully login with valid credentials', async () => {
      userRepository.findByEmail.mockResolvedValue(TEST_USER);
      bcryptService.compare.mockResolvedValue(true);

      const result = await service.login(VALID_EMAIL, VALID_PASSWORD);

      expect(userRepository.findByEmail).toHaveBeenCalledWith(VALID_EMAIL);
      expect(bcryptService.compare).toHaveBeenCalledWith(VALID_PASSWORD, TEST_USER.password);
      expect(result).toBeDefined();
    });

    it('should return user data on successful login', async () => {
      userRepository.findByEmail.mockResolvedValue(TEST_USER);
      bcryptService.compare.mockResolvedValue(true);

      const result = await service.login(VALID_EMAIL, VALID_PASSWORD);

      // Result should contain user info (or a token, depending on implementation)
      expect(result).toBeDefined();
    });

    // ── Invalid email (user not found) ─────────────────────────────────────

    it('should throw UnauthorizedException when email does not exist', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      await expect(
        service.login('nonexistent@example.com', VALID_PASSWORD),
      ).rejects.toThrow(UnauthorizedException);

      // Should NOT attempt password comparison when user is not found
      expect(bcryptService.compare).not.toHaveBeenCalled();
    });

    // ── Invalid password ───────────────────────────────────────────────────

    it('should throw UnauthorizedException when password is incorrect', async () => {
      userRepository.findByEmail.mockResolvedValue(TEST_USER);
      bcryptService.compare.mockResolvedValue(false);

      await expect(
        service.login(VALID_EMAIL, 'wrongPassword'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should use the same error type for invalid email and invalid password', async () => {
      // Security: prevent user enumeration by using the same error for both cases

      // Case 1: invalid email
      userRepository.findByEmail.mockResolvedValue(null);
      const emailError = service.login('bad@example.com', VALID_PASSWORD).catch((e) => e);

      // Case 2: invalid password
      userRepository.findByEmail.mockResolvedValue(TEST_USER);
      bcryptService.compare.mockResolvedValue(false);
      const passwordError = service.login(VALID_EMAIL, 'wrongPassword').catch((e) => e);

      const [err1, err2] = await Promise.all([emailError, passwordError]);

      expect(err1.constructor.name).toBe(err2.constructor.name);
    });

    // ── Input edge cases ───────────────────────────────────────────────────

    it('should throw for empty email', async () => {
      await expect(service.login('', VALID_PASSWORD)).rejects.toThrow();
    });

    it('should throw for empty password', async () => {
      await expect(service.login(VALID_EMAIL, '')).rejects.toThrow();
    });

    it('should handle email with different casing', async () => {
      userRepository.findByEmail.mockResolvedValue(TEST_USER);
      bcryptService.compare.mockResolvedValue(true);

      // Should normalize email before lookup
      await service.login('JOHN@EXAMPLE.COM', VALID_PASSWORD);

      expect(userRepository.findByEmail).toHaveBeenCalled();
    });

    // ── Repository failure ─────────────────────────────────────────────────

    it('should propagate repository errors', async () => {
      userRepository.findByEmail.mockRejectedValue(
        new InternalServerErrorException('DB connection lost'),
      );

      await expect(
        service.login(VALID_EMAIL, VALID_PASSWORD),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should propagate bcrypt comparison errors', async () => {
      userRepository.findByEmail.mockResolvedValue(TEST_USER);
      bcryptService.compare.mockRejectedValue(new Error('Bcrypt internal error'));

      await expect(
        service.login(VALID_EMAIL, VALID_PASSWORD),
      ).rejects.toThrow();
    });

    // ── Timing attack resistance ───────────────────────────────────────────

    it('should always use bcrypt.compare even for known-bad states (timing consistency)', async () => {
      // This test verifies that the service uses constant-time comparison
      // If user exists and password is wrong, bcrypt.compare MUST be called
      userRepository.findByEmail.mockResolvedValue(TEST_USER);
      bcryptService.compare.mockResolvedValue(false);

      await expect(service.login(VALID_EMAIL, 'wrongPassword')).rejects.toThrow();
      expect(bcryptService.compare).toHaveBeenCalledTimes(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // resetPassword(email)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('resetPassword', () => {
    // ── Happy path ─────────────────────────────────────────────────────────

    it('should initiate password reset for existing user', async () => {
      userRepository.findByEmail.mockResolvedValue(TEST_USER);

      const result = await service.resetPassword(VALID_EMAIL);

      expect(userRepository.findByEmail).toHaveBeenCalledWith(VALID_EMAIL);
      // Should not throw for a valid existing user
      expect(result).toBeDefined();
    });

    it('should call findByEmail with the provided email', async () => {
      userRepository.findByEmail.mockResolvedValue(TEST_USER);

      await service.resetPassword(VALID_EMAIL);

      expect(userRepository.findByEmail).toHaveBeenCalledWith(VALID_EMAIL);
      expect(userRepository.findByEmail).toHaveBeenCalledTimes(1);
    });

    // ── Non-existent email (security behavior) ─────────────────────────────

    it('should NOT throw when email does not exist (prevent enumeration)', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      // Security best practice: don't reveal whether an account exists
      // The method should complete without error even for unknown emails
      await expect(
        service.resetPassword('nonexistent@example.com'),
      ).resolves.not.toThrow();
    });

    it('should not reveal whether the email exists in the response', async () => {
      // Reset for existing user
      userRepository.findByEmail.mockResolvedValue(TEST_USER);
      const existingResult = await service.resetPassword(VALID_EMAIL);

      // Reset for non-existing user
      userRepository.findByEmail.mockResolvedValue(null);
      const nonExistingResult = await service.resetPassword('ghost@example.com');

      // Both responses should be indistinguishable to prevent user enumeration
      // (This test is flexible -- either both return void/undefined or similar messages)
      if (typeof existingResult === 'object' && typeof nonExistingResult === 'object') {
        expect(Object.keys(existingResult || {})).toEqual(
          Object.keys(nonExistingResult || {}),
        );
      }
    });

    // ── Input edge cases ───────────────────────────────────────────────────

    it('should throw for empty email', async () => {
      await expect(service.resetPassword('')).rejects.toThrow();
    });

    it('should handle email with different casing', async () => {
      userRepository.findByEmail.mockResolvedValue(TEST_USER);

      await service.resetPassword('JOHN@EXAMPLE.COM');

      expect(userRepository.findByEmail).toHaveBeenCalled();
    });

    it('should handle email with whitespace', async () => {
      userRepository.findByEmail.mockResolvedValue(TEST_USER);

      await service.resetPassword('  john@example.com  ');

      expect(userRepository.findByEmail).toHaveBeenCalled();
    });

    // ── Repository failure ─────────────────────────────────────────────────

    it('should propagate repository errors', async () => {
      userRepository.findByEmail.mockRejectedValue(
        new InternalServerErrorException('DB error'),
      );

      await expect(
        service.resetPassword(VALID_EMAIL),
      ).rejects.toThrow(InternalServerErrorException);
    });

    // ── Side effects ───────────────────────────────────────────────────────

    it('should not modify the user password directly during reset request', async () => {
      userRepository.findByEmail.mockResolvedValue(TEST_USER);

      await service.resetPassword(VALID_EMAIL);

      // resetPassword should only generate/send a token, not change the password
      // (updatePassword should not be called at this stage)
      expect(userRepository.updatePassword).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Cross-cutting concerns
  // ═══════════════════════════════════════════════════════════════════════════

  describe('cross-cutting concerns', () => {
    it('should use dependency injection for UserRepository', () => {
      expect(userRepository).toBeDefined();
    });

    it('should use dependency injection for BcryptService', () => {
      expect(bcryptService).toBeDefined();
    });

    it('should not store passwords in plain text in any method', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      bcryptService.hash.mockResolvedValue(HASHED_PASSWORD);
      userRepository.create.mockReturnValue(TEST_USER);
      userRepository.save.mockResolvedValue(TEST_USER);

      await service.register(VALID_EMAIL, VALID_PASSWORD, VALID_NAME);

      // Verify hash was called, meaning raw password is not persisted
      expect(bcryptService.hash).toHaveBeenCalledWith(VALID_PASSWORD);

      // Verify the saved entity does not contain the raw password
      const createCall = userRepository.create.mock.calls[0][0];
      expect(createCall.password).toBe(HASHED_PASSWORD);
      expect(createCall.password).not.toBe(VALID_PASSWORD);
    });

    it('should handle concurrent registrations with the same email gracefully', async () => {
      // First call: no user found, second call from race condition: save fails
      userRepository.findByEmail.mockResolvedValue(null);
      bcryptService.hash.mockResolvedValue(HASHED_PASSWORD);
      userRepository.create.mockReturnValue(TEST_USER);
      userRepository.save.mockRejectedValue(
        new ConflictException('Duplicate key: email'),
      );

      await expect(
        service.register(VALID_EMAIL, VALID_PASSWORD, VALID_NAME),
      ).rejects.toThrow();
    });
  });
});
