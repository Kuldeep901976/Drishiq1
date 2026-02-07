// Quick RLS Fix - Manual SQL Execution Required
console.log('🔧 RLS INFINITE RECURSION FIX');
console.log('=====================================\n');

console.log('❌ Issue: Infinite recursion detected in policy for relation "users"');
console.log('✅ Solution: Run the following SQL in your Supabase dashboard\n');

console.log('📋 STEPS TO FIX:');
console.log('1. Go to https://supabase.com/dashboard');
console.log('2. Select your project: xzrpgqymjfdhwnrrfgpa');
console.log('3. Go to SQL Editor');
console.log('4. Copy and paste the SQL below:');
console.log('5. Click "Run"\n');

console.log('🔧 SQL TO EXECUTE:');
console.log('=====================================');
console.log(`
-- Fix infinite recursion in users table RLS policy
DROP POLICY IF EXISTS "Admins can access all users" ON users;

-- Create a simple admin policy without recursion
CREATE POLICY "Admins can access all users" ON users
    FOR ALL USING (
        auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin'
        OR 
        auth.jwt() ->> 'user_metadata' ->> 'user_type' = 'admin'
    );

-- Alternative: Temporarily disable RLS for testing (uncomment if needed)
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
`);

console.log('=====================================\n');

console.log('🧪 AFTER RUNNING THE SQL:');
console.log('1. Test the APIs again: node test-apis.js');
console.log('2. Check if the 500 errors are resolved');
console.log('3. Visit /blog and /testimonials pages\n');

console.log('📝 Note: This fixes the RLS policy that was causing infinite recursion');
console.log('   when trying to access the users table from other tables.');



























