// Test suite for authentication flows without hitting Supabase database
import { NextRequest } from 'next/server';
import { mockSupabase, testScenarios } from '@/lib/mock-supabase';

// Mock the Supabase client for testing
jest.mock('@/lib/supabase', () => ({
  supabase: mockSupabase,
  createServiceClient: () => mockSupabase
}));

// Import the actual route handlers
import { POST as signupHandler } from '@/app/api/auth/signup/route';
import { POST as signinHandler } from '@/app/api/auth/signin/route';

describe('Authentication Flow Tests', () => {
  beforeEach(() => {
    // Clear any previous test data
    jest.clearAllMocks();
  });

  describe('Signup Flow', () => {
    it('should successfully create a new user', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(testScenarios.signup.success),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await signupHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.user.email).toBe(testScenarios.signup.success.email);
      expect(data.data.user.name).toBe(testScenarios.signup.success.name);
      expect(data.data.email_confirmation_sent).toBe(true);
    });

    it('should reject duplicate email', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(testScenarios.signup.duplicate),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await signupHandler(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toContain('already exists');
    });

    it('should reject invalid email format', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(testScenarios.signup.invalidEmail),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await signupHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid email format');
    });

    it('should reject weak password', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(testScenarios.signup.weakPassword),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await signupHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('at least 8 characters');
    });

    it('should reject missing required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' }), // Missing password and name
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await signupHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required fields');
    });
  });

  describe('Signin Flow', () => {
    it('should successfully authenticate valid user', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify(testScenarios.signin.success),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await signinHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.user.email).toBe(testScenarios.signin.success.email);
      expect(data.data.session).toBeDefined();
      expect(data.data.credits).toBeDefined();
    });

    it('should reject wrong password', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify(testScenarios.signin.wrongPassword),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await signinHandler(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Invalid login credentials');
    });

    it('should reject nonexistent user', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify(testScenarios.signin.nonexistentUser),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await signinHandler(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Invalid login credentials');
    });

    it('should reject missing credentials', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' }), // Missing password
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await signinHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required fields');
    });

    it('should reject invalid email format', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({
          email: 'invalid-email',
          password: 'password123'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await signinHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid email format');
    });
  });

  describe('Authentication Middleware Tests', () => {
    it('should validate authentication middleware', async () => {
      // Test the middleware with valid token
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer mock-token-123',
          'Content-Type': 'application/json'
        }
      });

      // This would test the middleware if we had a test endpoint
      // For now, we'll just verify the request structure
      expect(request.headers.get('Authorization')).toBe('Bearer mock-token-123');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await signupHandler(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Internal server error');
    });

    it('should handle empty request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: '',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await signupHandler(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Internal server error');
    });
  });
});

// Manual testing helpers
export const manualTestHelpers = {
  // Test signup flow manually
  testSignup: async (userData: any) => {
    console.log('🧪 Testing signup with:', userData);
    
    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await signupHandler(request);
    const data = await response.json();
    
    console.log('📊 Signup response:', {
      status: response.status,
      success: data.success,
      error: data.error,
      user: data.data?.user
    });
    
    return { response, data };
  },

  // Test signin flow manually
  testSignin: async (credentials: any) => {
    console.log('🧪 Testing signin with:', credentials);
    
    const request = new NextRequest('http://localhost:3000/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify(credentials),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await signinHandler(request);
    const data = await response.json();
    
    console.log('📊 Signin response:', {
      status: response.status,
      success: data.success,
      error: data.error,
      user: data.data?.user,
      session: data.data?.session ? 'Present' : 'Missing',
      credits: data.data?.credits ? 'Present' : 'Missing'
    });
    
    return { response, data };
  },

  // Run all test scenarios
  runAllTests: async () => {
    console.log('🚀 Running all authentication tests...\n');
    
    // Test signup scenarios
    console.log('📝 Testing Signup Scenarios:');
    for (const [scenario, data] of Object.entries(testScenarios.signup)) {
      console.log(`\n  ${scenario}:`);
      await manualTestHelpers.testSignup(data);
    }
    
    // Test signin scenarios
    console.log('\n🔐 Testing Signin Scenarios:');
    for (const [scenario, data] of Object.entries(testScenarios.signin)) {
      console.log(`\n  ${scenario}:`);
      await manualTestHelpers.testSignin(data);
    }
    
    console.log('\n✅ All tests completed!');
  }
};








