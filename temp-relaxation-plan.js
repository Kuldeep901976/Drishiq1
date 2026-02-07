// Temporary RLS Relaxation - Step by Step Plan
console.log('🔧 TEMPORARY RLS RELAXATION PLAN');
console.log('=====================================\n');

console.log('✅ Goal: Temporarily relax security to fix APIs, then fix properly');
console.log('📋 Plan: Disable → Test → Fix → Re-enable\n');

console.log('📋 STEP 1: TEMPORARILY DISABLE RLS');
console.log('=====================================');
console.log(`
-- Temporarily disable RLS on users table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- This will immediately fix the infinite recursion
-- APIs should start working right away
`);

console.log('=====================================\n');

console.log('📋 STEP 2: TEST THE FIX');
console.log('=====================================');
console.log(`
-- After running Step 1, test with:
node test-db-connection.js
node test-apis.js

-- Expected results:
✅ Blog posts table: Accessible
✅ Testimonials table: Accessible  
✅ APIs: All returning data instead of 500 errors
`);

console.log('=====================================\n');

console.log('📋 STEP 3: IDENTIFY THE RECURSIVE POLICY');
console.log('=====================================');
console.log(`
-- Check what policy was causing the recursion
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'users'
ORDER BY policyname;
`);

console.log('=====================================\n');

console.log('📋 STEP 4: CREATE PROPER NON-RECURSIVE POLICY');
console.log('=====================================');
console.log(`
-- Create a new policy that doesn't reference users table
CREATE POLICY "Admins can access all users - Fixed" ON users
    FOR ALL USING (
        -- Use JWT metadata instead of table reference
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
        OR
        (auth.jwt() -> 'user_metadata' ->> 'user_type') = 'admin'
        OR
        -- Or use auth.users (not public.users)
        auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE raw_user_meta_data->>'role' = 'admin'
        )
    );
`);

console.log('=====================================\n');

console.log('📋 STEP 5: RE-ENABLE RLS WITH FIXED POLICY');
console.log('=====================================');
console.log(`
-- Re-enable RLS with the new policy
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Test again to make sure it still works
node test-apis.js
`);

console.log('=====================================\n');

console.log('🧪 EXECUTION ORDER:');
console.log('1. Run Step 1 SQL in Supabase');
console.log('2. Test with: node test-apis.js');
console.log('3. Run Step 3 to see the old policy');
console.log('4. Run Step 4 to create fixed policy');
console.log('5. Run Step 5 to re-enable RLS');
console.log('6. Final test: node test-apis.js');

console.log('\n📝 This approach gets you working APIs quickly, then fixes security properly.');




























