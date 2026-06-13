import { userRepository } from '../../repositories/UserRepository';
import { hashPassword, comparePassword, generateToken } from '../../core/security/security';
import { Role } from '../../shared/constants/roles';
import { User } from '../../repositories/UserRepository';
import { userActivityRepository } from '../../repositories/UserActivityRepository';

export interface RegisterInput {
  email: string;
  passwordHash: string; // Wait, we can pass raw password or passwordHash. Let's do raw password for service!
  fullName: string;
  role?: Role;
}

export interface RegisterServiceInput {
  email: string;
  password: string;
  fullName: string;
  role?: Role;
}

export interface LoginServiceInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: Role;
    isApproved: boolean;
    avatarUrl?: string | null;
    bio?: string | null;
    createdAt: string;
  };
  token: string;
}

export class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterServiceInput): Promise<AuthResponse> {
    // 1. Check if email is already registered
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error('Email address is already in use.');
    }

    // 2. Validate input password length
    if (data.password.length < 8) {
      throw new Error('Password must be at least 8 characters long.');
    }

    // 3. Hash the password
    const hashedPassword = await hashPassword(data.password);

    // 4. Save the user
    const newUser = await userRepository.create({
      email: data.email,
      passwordHash: hashedPassword,
      fullName: data.fullName,
      role: data.role,
    });

    // 5. Generate token
    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
        isApproved: newUser.isApproved,
        avatarUrl: newUser.avatarUrl ?? null,
        bio: newUser.bio ?? null,
        createdAt: newUser.createdAt,
      },
      token,
    };
  }

  /**
   * Log in an existing user
   */
  async login(data: LoginServiceInput): Promise<AuthResponse> {
    // 1. Find user by email
    const user = await userRepository.findByEmail(data.email);
    if (!user) {
      throw new Error('Invalid email or password.');
    }

    // 2. Compare passwords
    const isPasswordValid = await comparePassword(data.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password.');
    }

    // 3. Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Log user login activity
    await userActivityRepository.logActivity(user.id, 'LOGIN', `Logged in via credentials: ${user.email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isApproved: user.isApproved,
        avatarUrl: user.avatarUrl ?? null,
        bio: user.bio ?? null,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  /**
   * Fetch current user profile details by ID
   */
  async getProfile(userId: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found.');
    }

    const { passwordHash, ...userProfile } = user;
    return userProfile;
  }
}

export const authService = new AuthService();
export default authService;
