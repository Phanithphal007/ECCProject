import { apiClient } from './apiClient';
import { mockUsers } from '../mock/users';

const STORAGE_KEY_USER = 'ecc_auth_user';
const STORAGE_KEY_TOKEN = 'ecc_auth_token';

export const authService = {
  /**
   * Login with email/phone & password
   */
  async login(credentials) {
    const { identifier, password } = credentials;

    return apiClient.request({
      endpoint: '/auth/login.php',
      method: 'POST',
      data: credentials,
      mockFallback: () => {
        const cleanId = (identifier || '').trim().toLowerCase();
        const user = mockUsers.find(
          (u) =>
            u.email.toLowerCase() === cleanId ||
            u.phone.replace(/[\s-]/g, '') === cleanId.replace(/[\s-]/g, '') ||
            (u.studentId && u.studentId.toLowerCase() === cleanId)
        );

        if (!user) {
          throw new Error('User not found. Please check your email or phone number.');
        }

        // Check password (in mock mode, password can be demo password or role name)
        if (password && password !== user.password && password !== '123456' && password !== 'password') {
          throw new Error('Incorrect password. For testing, you may use the Demo Account buttons.');
        }

        const token = `mock-jwt-token-${user.id}-${Date.now()}`;
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
        localStorage.setItem(STORAGE_KEY_TOKEN, token);
        localStorage.setItem('edumanage-role', user.role);

        return {
          success: true,
          user,
          token,
          message: `Welcome back, ${user.name}!`
        };
      }
    });
  },

  /**
   * Fast Demo Login for quick testing each role
   */
  async demoLogin(targetRole) {
    return apiClient.request({
      endpoint: '/auth/demo-login.php',
      method: 'POST',
      data: { role: targetRole },
      mockFallback: () => {
        const user = mockUsers.find((u) => u.role === targetRole) || mockUsers[0];
        const token = `mock-demo-token-${user.id}-${Date.now()}`;
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
        localStorage.setItem(STORAGE_KEY_TOKEN, token);
        localStorage.setItem('edumanage-role', user.role);

        return {
          success: true,
          user,
          token,
          message: `Logged in as demo ${user.roleLabel} (${user.name})`
        };
      }
    });
  },

  /**
   * Public Registration (strictly allows Parent or General User only)
   */
  async register(registrationData) {
    const { role } = registrationData;

    // Safety rule: Public registration must NOT allow users to register as Admin or Student
    if (role === 'admin' || role === 'student') {
      throw new Error('Administrative and Student accounts cannot be created via public registration.');
    }

    return apiClient.request({
      endpoint: '/auth/register.php',
      method: 'POST',
      data: registrationData,
      mockFallback: () => {
        const newUser = {
          id: `USR-REG-${Date.now().toString().slice(-4)}`,
          email: registrationData.email,
          phone: registrationData.phone,
          name: registrationData.name,
          khmerName: registrationData.khmerName || registrationData.name,
          role: role === 'parent' ? 'parent' : 'user',
          roleLabel: role === 'parent' ? 'Parent / Guardian' : 'General User',
          title: role === 'parent' ? 'Parent / Guardian' : 'Registered Member',
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(registrationData.name)}&background=4f46e5&color=fff`,
          linkedChildrenIds: []
        };

        const token = `mock-reg-token-${newUser.id}`;
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));
        localStorage.setItem(STORAGE_KEY_TOKEN, token);
        localStorage.setItem('edumanage-role', newUser.role);

        return {
          success: true,
          user: newUser,
          token,
          message: 'Account registered successfully.'
        };
      }
    });
  },

  /**
   * Forgot Password request
   */
  async forgotPassword(email) {
    return apiClient.request({
      endpoint: '/auth/forgot-password.php',
      method: 'POST',
      data: { email },
      mockFallback: () => {
        return {
          success: true,
          message: `A 6-digit verification code has been sent to ${email} (Demo code: 123456).`
        };
      }
    });
  },

  /**
   * Verify OTP
   */
  async verifyOtp(email, otp) {
    return apiClient.request({
      endpoint: '/auth/verify-otp.php',
      method: 'POST',
      data: { email, otp },
      mockFallback: () => {
        if (otp !== '123456' && otp.length !== 6) {
          throw new Error('Invalid OTP code. Please use demo code 123456.');
        }
        return {
          success: true,
          resetToken: `reset-token-${Date.now()}`,
          message: 'OTP verified successfully.'
        };
      }
    });
  },

  /**
   * Reset Password
   */
  async resetPassword(email, newPassword) {
    return apiClient.request({
      endpoint: '/auth/reset-password.php',
      method: 'POST',
      data: { email, newPassword },
      mockFallback: () => {
        return {
          success: true,
          message: 'Password has been reset successfully. Please sign in with your new password.'
        };
      }
    });
  },

  /**
   * Get currently authenticated user from localStorage
   */
  getCurrentUser() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_USER);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    // Default to admin user for existing testing if not logged in
    return mockUsers[0];
  },

  /**
   * Logout
   */
  logout() {
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    // don't remove role or theme preferences so reload stays smooth
  }
};

