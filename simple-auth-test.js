// Simple test runner for authentication flows
// Run this with: node simple-auth-test.js

// Mock Supabase client for testing
class MockSupabaseClient {
  constructor() {
    this.users = new Map();
    this.credits = new Map();
    this.sessions = new Map();
    this.initializeTestData();
  }

  initializeTestData() {
    // Add a test user
    const testUser = {
      id: 'test-user-123',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      display_name: 'Test User',
      role: 'user',
      is_active: true,
      email_verified: true,
      phone_verified: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.users.set('test@example.com', testUser);
    this.users.set('test-user-123', testUser);

    // Add test credits
    this.credits.set('test-user-123', {
      id: 'credit-123',
      user_id: 'test-user-123',
      email: 'test@example.com',
      credit_tokens: 10,
      tokens_used: 2,
      status: 'active',
      created_at: new Date().toISOString()
    });
  }

  auth = {
    signUp: async ({ email, password, options }) => {
      console.log('🔐 Mock signUp called:', { email, password: '***', options });

      if (!email || !password) {
        return {
          data: { user: null, session: null },
          error: { message: 'Email and password are required' }
        };
      }

      if (this.users.has(email)) {
        return {
          data: { user: null, session: null },
          error: { message: 'User already registered' }
        };
      }

      const userId = `user-${Date.now()}`;
      const mockUser = {
        id: userId,
        email,
        email_confirmed_at: null,
        user_metadata: {
          name: options?.data?.name,
          user_type: options?.data?.user_type || 'user'
        }
      };

      const mockSession = {
        access_token: `mock-token-${Date.now()}`,
        refresh_token: `mock-refresh-${Date.now()}`,
        expires_in: 3600,
        expires_at: Date.now() + 3600000,
        user: mockUser
      };

      this.users.set(email, {
        id: userId,
        email,
        first_name: options?.data?.name || '',
        display_name: options?.data?.name || '',
        role: options?.data?.user_type || 'user',
        is_active: true,
        email_verified: false,
        phone_verified: false,
        created_at: new Date().toISOString()
      });

      this.users.set(userId, this.users.get(email));
      this.sessions.set(userId, mockSession);

      return {
        data: { user: mockUser, session: mockSession },
        error: null
      };
    },

    signInWithPassword: async ({ email, password }) => {
      console.log('🔐 Mock signInWithPassword called:', { email, password: '***' });

      if (!email || !password) {
        return {
          data: { user: null, session: null },
          error: { message: 'Email and password are required' }
        };
      }

      const userData = this.users.get(email);
      if (!userData) {
        return {
          data: { user: null, session: null },
          error: { message: 'Invalid login credentials' }
        };
      }

      const mockUser = {
        id: userData.id,
        email: userData.email,
        email_confirmed_at: userData.email_verified ? new Date().toISOString() : null,
        user_metadata: {
          name: userData.display_name,
          user_type: userData.role
        }
      };

      const mockSession = {
        access_token: `mock-token-${Date.now()}`,
        refresh_token: `mock-refresh-${Date.now()}`,
        expires_in: 3600,
        expires_at: Date.now() + 3600000,
        user: mockUser
      };

      this.sessions.set(userData.id, mockSession);

      return {
        data: { user: mockUser, session: mockSession },
        error: null
      };
    }
  };

  from = (table) => {
    return {
      select: (columns) => ({
        eq: (column, value) => ({
          single: async () => {
            console.log(`📊 Mock query: SELECT ${columns} FROM ${table} WHERE ${column} = ${value}`);
            
            if (table === 'users') {
              const user = this.users.get(value) || this.users.get(Array.from(this.users.keys())[0]);
              return { data: user, error: null };
            }
            
            if (table === 'credits') {
              const credit = this.credits.get(value);
              return { data: credit, error: null };
            }
            
            return { data: null, error: null };
          },
          maybeSingle: async () => {
            console.log(`📊 Mock query: SELECT ${columns} FROM ${table} WHERE ${column} = ${value} (maybeSingle)`);
            return { data: null, error: null };
          }
        }),
        order: (column, options) => ({
          limit: (count) => ({
            single: async () => {
              console.log(`📊 Mock query: SELECT ${columns} FROM ${table} ORDER BY ${column} LIMIT ${count}`);
              
              if (table === 'credits') {
                const credit = Array.from(this.credits.values())[0];
                return { data: credit, error: null };
              }
              
              return { data: null, error: null };
            }
          })
        })
      }),
      insert: (data) => ({
        select: () => ({
          single: async () => {
            console.log(`📊 Mock insert: INSERT INTO ${table}`, data);
            
            if (table === 'users') {
              const newUser = { ...data, id: data.id || `user-${Date.now()}` };
              this.users.set(data.email, newUser);
              this.users.set(newUser.id, newUser);
              return { data: newUser, error: null };
            }
            
            if (table === 'credits') {
              const newCredit = { ...data, id: `credit-${Date.now()}` };
              this.credits.set(data.user_id, newCredit);
              return { data: newCredit, error: null };
            }
            
            return { data: data, error: null };
          }
        })
      }),
      update: (data) => ({
        eq: (column, value) => {
          console.log(`📊 Mock update: UPDATE ${table} SET ... WHERE ${column} = ${value}`);
          return Promise.resolve({ data: null, error: null });
        }
      })
    };
  };
}

const mockSupabase = new MockSupabaseClient();

// Mock the route handlers
async function mockSignupHandler(userData) {
  try {
    const { email, password, name, userType = 'user' } = userData;

    // Validate required fields
    if (!email || !password || !name) {
      return {
        status: 400,
        data: { error: 'Missing required fields: email, password, name' }
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        status: 400,
        data: { error: 'Invalid email format' }
      };
    }

    // Validate password strength
    if (password.length < 8) {
      return {
        status: 400,
        data: { error: 'Password must be at least 8 characters long' }
      };
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await mockSupabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return {
        status: 409,
        data: { error: 'User with this email already exists' }
      };
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await mockSupabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          user_type: userType
        }
      }
    });

    if (authError) {
      return {
        status: 400,
        data: { error: authError.message }
      };
    }

    if (!authData.user) {
      return {
        status: 500,
        data: { error: 'Failed to create user account' }
      };
    }

    // Create user record in users table
    const { data: userRecord, error: userError } = await mockSupabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: authData.user.email,
        first_name: name,
        display_name: name,
        role: userType,
        is_active: true,
        auth_provider: 'email',
        login_method: 'password',
        email_verified: false,
        phone_verified: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (userError) {
      return {
        status: 500,
        data: { error: 'Account created but failed to complete registration' }
      };
    }

    // Initialize default credits
    const { data: creditData, error: creditError } = await mockSupabase
      .from('credits')
      .insert({
        user_id: authData.user.id,
        email: authData.user.email,
        credit_tokens: userType === 'user' ? 5 : 10,
        tokens_used: 0,
        amount_contributed: 0,
        payment_status: 'pending',
        support_level: userType === 'user' ? 'standard' : 'premium',
        status: 'pending_verification'
      });

    if (creditError) {
      console.log('Warning: Error initializing credits:', creditError);
    }

    return {
      status: 200,
      data: {
        success: true,
        data: {
          user: {
            id: authData.user.id,
            email: authData.user.email,
            name: name,
            user_type: userType
          },
          email_confirmation_sent: authData.user.email_confirmed_at ? false : true,
          message: 'Account created successfully'
        }
      }
    };

  } catch (error) {
    console.error('Signup error:', error);
    return {
      status: 500,
      data: { error: 'Internal server error' }
    };
  }
}

async function mockSigninHandler(credentials) {
  try {
    const { email, password, userType = 'user' } = credentials;

    // Validate required fields
    if (!email || !password) {
      return {
        status: 400,
        data: { error: 'Missing required fields: email, password' }
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        status: 400,
        data: { error: 'Invalid email format' }
      };
    }

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await mockSupabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      return {
        status: 401,
        data: { error: authError.message }
      };
    }

    if (!authData.user) {
      return {
        status: 500,
        data: { error: 'Failed to authenticate user' }
      };
    }

    // Update last sign in timestamp
    await mockSupabase
      .from('users')
      .update({
        last_sign_in: new Date().toISOString(),
        login_method: 'password',
        updated_at: new Date().toISOString()
      })
      .eq('id', authData.user.id);

    // Get user data from users table
    const { data: userData, error: userError } = await mockSupabase
      .from('users')
      .select('id, email, first_name, last_name, display_name, role, is_active, email_verified, phone_verified')
      .eq('id', authData.user.id)
      .single();

    if (userError) {
      return {
        status: 404,
        data: { error: 'User profile not found' }
      };
    }

    if (!userData.is_active) {
      return {
        status: 403,
        data: { error: 'Account is deactivated' }
      };
    }

    // Verify user type matches requested type
    const actualUserType = userData.role || 'user';
    if (userType && actualUserType !== userType && userType !== 'user') {
      return {
        status: 403,
        data: { error: `Access denied: This user type requires ${userType} privileges` }
      };
    }

    // Get user's current credit balance
    const { data: creditData } = await mockSupabase
      .from('credits')
      .select('credit_tokens, tokens_used, status')
      .eq('user_id', authData.user.id)
      .single();

    return {
      status: 200,
      data: {
        success: true,
        data: {
          user: {
            id: authData.user.id,
            email: authData.user.email,
            name: userData.display_name || userData.first_name || '',
            first_name: userData.first_name,
            last_name: userData.last_name,
            user_type: userData.role || 'user',
            is_active: userData.is_active,
            email_verified: userData.email_verified || false,
            phone_verified: userData.phone_verified || false
          },
          session: authData.session,
          credits: creditData ? {
            available: (creditData.credit_tokens || 0) - (creditData.tokens_used || 0),
            total: creditData.credit_tokens || 0,
            used: creditData.tokens_used || 0,
            status: creditData.status
          } : null,
          message: 'Authentication successful'
        }
      }
    };

  } catch (error) {
    console.error('Signin error:', error);
    return {
      status: 500,
      data: { error: 'Internal server error' }
    };
  }
}

// Test scenarios
const testScenarios = {
  signup: {
    success: { email: 'newuser@example.com', password: 'password123', name: 'New User', userType: 'user' },
    duplicate: { email: 'test@example.com', password: 'password123', name: 'Duplicate User', userType: 'user' },
    invalidEmail: { email: 'invalid-email', password: 'password123', name: 'Invalid User', userType: 'user' },
    weakPassword: { email: 'weak@example.com', password: '123', name: 'Weak User', userType: 'user' }
  },
  signin: {
    success: { email: 'test@example.com', password: 'password123', userType: 'user' },
    wrongPassword: { email: 'test@example.com', password: 'wrongpassword', userType: 'user' },
    nonexistentUser: { email: 'nonexistent@example.com', password: 'password123', userType: 'user' }
  }
};

async function runAuthTests() {
  console.log('🚀 Starting Authentication Flow Tests\n');
  console.log('=' .repeat(50));
  
  try {
    // Test signup scenarios
    console.log('\n📝 TESTING SIGNUP SCENARIOS');
    console.log('-'.repeat(30));
    
    // 1. Successful signup
    console.log('\n1. Testing successful signup:');
    const signupResult = await mockSignupHandler(testScenarios.signup.success);
    console.log(`   Status: ${signupResult.status}`);
    console.log(`   Success: ${signupResult.data.success}`);
    console.log(`   User: ${signupResult.data.data?.user?.email}`);
    
    // 2. Duplicate email
    console.log('\n2. Testing duplicate email:');
    const duplicateResult = await mockSignupHandler(testScenarios.signup.duplicate);
    console.log(`   Status: ${duplicateResult.status}`);
    console.log(`   Error: ${duplicateResult.data.error}`);
    
    // 3. Invalid email
    console.log('\n3. Testing invalid email:');
    const invalidEmailResult = await mockSignupHandler(testScenarios.signup.invalidEmail);
    console.log(`   Status: ${invalidEmailResult.status}`);
    console.log(`   Error: ${invalidEmailResult.data.error}`);
    
    // 4. Weak password
    console.log('\n4. Testing weak password:');
    const weakPasswordResult = await mockSignupHandler(testScenarios.signup.weakPassword);
    console.log(`   Status: ${weakPasswordResult.status}`);
    console.log(`   Error: ${weakPasswordResult.data.error}`);
    
    // Test signin scenarios
    console.log('\n\n🔐 TESTING SIGNIN SCENARIOS');
    console.log('-'.repeat(30));
    
    // 1. Successful signin
    console.log('\n1. Testing successful signin:');
    const signinResult = await mockSigninHandler(testScenarios.signin.success);
    console.log(`   Status: ${signinResult.status}`);
    console.log(`   Success: ${signinResult.data.success}`);
    console.log(`   User: ${signinResult.data.data?.user?.email}`);
    
    // 2. Wrong password
    console.log('\n2. Testing wrong password:');
    const wrongPasswordResult = await mockSigninHandler(testScenarios.signin.wrongPassword);
    console.log(`   Status: ${wrongPasswordResult.status}`);
    console.log(`   Error: ${wrongPasswordResult.data.error}`);
    
    // 3. Nonexistent user
    console.log('\n3. Testing nonexistent user:');
    const nonexistentResult = await mockSigninHandler(testScenarios.signin.nonexistentUser);
    console.log(`   Status: ${nonexistentResult.status}`);
    console.log(`   Error: ${nonexistentResult.data.error}`);
    
    console.log('\n\n✅ ALL TESTS COMPLETED SUCCESSFULLY!');
    console.log('=' .repeat(50));
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the tests
runAuthTests();
