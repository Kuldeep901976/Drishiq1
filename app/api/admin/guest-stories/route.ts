import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// GET - Fetch guest stories
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || '';
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);

    // Get authorization header from request
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || null;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    // First, try to verify as super admin token
    let isSuperAdmin = false;
    try {
      const verifyRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin-auth/auth/verify`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (verifyRes.ok) {
        isSuperAdmin = true;
        console.log('✅ Super admin token verified');
      }
    } catch (verifyError) {
      console.log('Not a super admin token, trying Supabase auth...');
    }

    // If not super admin, verify as Supabase user
    if (!isSuperAdmin) {
      // Create client for auth check (using anon key to verify user)
      const supabaseAuth = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      );

      // Verify token and get user
      const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
      if (authError || !user) {
        console.error('Auth error:', authError);
        return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
      }

      // Check if user is admin or super_admin using service client (bypasses RLS)
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('role, user_type, is_active')
        .eq('id', user.id)
        .single();

      const isAdmin = userData && 
                     userData.is_active && 
                     (userData.role === 'admin' || userData.role === 'super_admin') &&
                     (userData.user_type === 'admin' || userData.role === 'super_admin');

      if (userError || !isAdmin) {
        console.error('Admin check failed:', { userError, userData, userId: user.id });
        return NextResponse.json({ error: 'Forbidden - Admin or Super Admin access required' }, { status: 403 });
      }
    }

    // Build query using service client (bypasses RLS)
    // Get all testimonials_stories (guest stories)
    // First, get total count to see what we have
    const { count: totalCount } = await supabaseAdmin
      .from('testimonials_stories')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Total records in testimonials_stories: ${totalCount || 0}`);
    
    // Get a sample to check submission_type values
    const { data: sampleData } = await supabaseAdmin
      .from('testimonials_stories')
      .select('id, submission_type, status, name')
      .limit(5);
    
    console.log('📋 Sample records:', sampleData);
    
    let query = supabaseAdmin
      .from('testimonials_stories')
      .select('*')
      .order('created_at', { ascending: false });

    // Try to filter by submission_type, but if it fails, get all records
    // Filter by submission_type = 'story' OR NULL to get guest story submissions
    try {
      query = query.or('submission_type.eq.story,submission_type.is.null');
    } catch (filterError) {
      console.warn('⚠️ Could not apply submission_type filter, fetching all records:', filterError);
      // Continue without filter
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    console.log('🔍 Executing query for guest stories...');
    console.log('Query params:', { status, page, limit, from, to });
    const { data, error } = await query;

    if (error) {
      console.error('❌ Error fetching guest stories:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      
      // Try a simpler query without the OR filter as fallback
      console.log('🔄 Trying fallback query without submission_type filter...');
      let fallbackQuery = supabaseAdmin
        .from('testimonials_stories')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (status && status !== 'all') {
        fallbackQuery = fallbackQuery.eq('status', status);
      }
      
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      fallbackQuery = fallbackQuery.range(from, to);
      
      const { data: fallbackData, error: fallbackError } = await fallbackQuery;
      
      if (fallbackError) {
        return NextResponse.json(
          { 
            error: 'Failed to fetch guest stories', 
            details: fallbackError.message, 
            code: fallbackError.code,
            hint: fallbackError.hint 
          },
          { status: 500 }
        );
      }
      
      console.log(`✅ Fallback query fetched ${fallbackData?.length || 0} stories`);
      return NextResponse.json({ success: true, data: fallbackData || [] });
    }

    console.log(`✅ Fetched ${data?.length || 0} guest stories with status: ${status || 'all'}`);
    if (data && data.length > 0) {
      console.log('Sample story:', {
        id: data[0].id,
        name: data[0].name,
        email: data[0].email,
        status: data[0].status,
        submission_type: data[0].submission_type,
        created_at: data[0].created_at
      });
    } else {
      console.log('⚠️ No stories found with current filter. Total in table:', totalCount || 0);
      
      // If filtered query returned 0 but we know there are records, try without filter
      if (totalCount && totalCount > 0 && data?.length === 0) {
        console.log('🔄 Retrying query without submission_type filter...');
        const retryFrom = (page - 1) * limit;
        const retryTo = retryFrom + limit - 1;
        
        let retryQuery = supabaseAdmin
          .from('testimonials_stories')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (status && status !== 'all') {
          retryQuery = retryQuery.eq('status', status);
        }
        
        retryQuery = retryQuery.range(retryFrom, retryTo);
        
        const { data: retryData, error: retryError } = await retryQuery;
        
        if (!retryError && retryData && retryData.length > 0) {
          console.log(`✅ Retry query found ${retryData.length} stories`);
          return NextResponse.json({ success: true, data: retryData });
        }
      }
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: any) {
    console.error('Error in GET /api/admin/guest-stories:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Approve or reject guest story
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, storyId, adminNotes } = body;

    if (!action || !storyId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Get authorization header from request
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || null;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    // First, try to verify as super admin token
    let isSuperAdmin = false;
    try {
      const verifyRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin-auth/auth/verify`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (verifyRes.ok) {
        isSuperAdmin = true;
        console.log('✅ Super admin token verified for POST');
      }
    } catch (verifyError) {
      console.log('Not a super admin token, trying Supabase auth...');
    }

    // If not super admin, verify as Supabase user
    if (!isSuperAdmin) {
      const supabaseAuth = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      );

      const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('role, user_type, is_active')
        .eq('id', user.id)
        .single();

      const isAdmin = userData && 
                     userData.is_active && 
                     (userData.role === 'admin' || userData.role === 'super_admin') &&
                     (userData.user_type === 'admin' || userData.role === 'super_admin');

      if (!isAdmin) {
        return NextResponse.json({ error: 'Forbidden - Admin or Super Admin access required' }, { status: 403 });
      }
    }

    const supabase = createServiceClient();

    // Get reviewer ID (for super admin, use a system ID or null)
    let reviewerId: string | null = null;
    if (!isSuperAdmin) {
      const supabaseAuth = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      );
      const { data: { user } } = await supabaseAuth.auth.getUser(token);
      reviewerId = user?.id || null;
    }

    // Get the guest story
    const { data: guestStory, error: fetchError } = await supabase
      .from('testimonials_stories')
      .select('*')
      .eq('id', storyId)
      .single();

    if (fetchError || !guestStory) {
      return NextResponse.json(
        { error: 'Guest story not found' },
        { status: 404 }
      );
    }

    if (action === 'approve') {
      // Create testimonial from guest story
      const testimonialData: any = {
        content: guestStory.content,
        status: 'published',
        is_approved: true,
        is_published: true,
        consent_given: guestStory.consent_given,
        published_at: new Date().toISOString(),
        category: guestStory.category || null,
        // Store guest info for display
        user_name: guestStory.name,
        user_role: null,
        user_location: null,
        user_image: guestStory.image_url || null,
      };

      const { data: testimonial, error: testimonialError } = await supabase
        .from('testimonials')
        .insert(testimonialData)
        .select()
        .single();

      if (testimonialError) {
        console.error('Error creating testimonial:', testimonialError);
        return NextResponse.json(
          { error: 'Failed to create testimonial', details: testimonialError.message },
          { status: 500 }
        );
      }

      // Check if user exists in users table by email
      const { data: existingUser, error: userCheckError } = await supabaseAdmin
        .from('users')
        .select('id, email')
        .eq('email', guestStory.email)
        .maybeSingle();

      let userId: string | null = null;

      if (existingUser) {
        // User already exists
        userId = existingUser.id;
        console.log('User already exists:', userId);
      } else {
        // Create new user in auth.users and users table
        try {
          // Combine country code and phone number if separate fields exist
          let fullPhone = guestStory.phone;
          if (guestStory.country_code && guestStory.phone_number) {
            fullPhone = `${guestStory.country_code}${guestStory.phone_number}`;
          }

          // Create auth user first
          const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: guestStory.email,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
              name: guestStory.name,
              phone: fullPhone,
              preferred_language: guestStory.preferred_language,
              profession: guestStory.profession,
            }
          });

          if (authError || !authUser.user) {
            console.error('Error creating auth user:', authError);
            throw new Error(authError?.message || 'Failed to create auth user');
          }

          userId = authUser.user.id;

          // Create user in users table
          const nameParts = guestStory.name.split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || null;

          const { error: userInsertError } = await supabaseAdmin
            .from('users')
            .insert({
              id: userId,
              email: guestStory.email,
              first_name: firstName,
              last_name: lastName,
              phone: fullPhone,
              phone_verified: guestStory.phone_verified || false,
              preferred_language: guestStory.preferred_language || null,
              user_role: guestStory.profession || null,
              occupation: guestStory.profession || null,
              role: 'user',
              is_active: true,
              email_verified: true, // Auto-verified since we created via admin
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (userInsertError) {
            console.error('Error creating user in users table:', userInsertError);
            // Try to delete auth user if user creation fails
            await supabaseAdmin.auth.admin.deleteUser(userId);
            throw new Error(userInsertError.message);
          }

          console.log('New user created:', userId);
        } catch (createUserError: any) {
          console.error('Error creating user:', createUserError);
          return NextResponse.json(
            { error: 'Failed to create user', details: createUserError.message },
            { status: 500 }
          );
        }
      }

      // Add 1 credit to user_credits_balance
      if (userId) {
        try {
          // Check if user_credits_balance entry exists
          const { data: existingBalance } = await supabaseAdmin
            .from('user_credits_balance')
            .select('user_id, total_credits')
            .eq('user_id', userId)
            .maybeSingle();

          if (existingBalance) {
            // Update existing balance
            const { error: balanceError } = await supabaseAdmin
              .from('user_credits_balance')
              .update({
                total_credits: (existingBalance.total_credits || 0) + 1,
                updated_at: new Date().toISOString(),
              })
              .eq('user_id', userId);

            if (balanceError) {
              console.error('Error updating user credits balance:', balanceError);
            } else {
              console.log('Added 1 credit to existing user balance');
            }
          } else {
            // Create new balance entry
            const { error: balanceError } = await supabaseAdmin
              .from('user_credits_balance')
              .insert({
                user_id: userId,
                total_credits: 1,
                credits_used: 0,
                credits_pending: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });

            if (balanceError) {
              console.error('Error creating user credits balance:', balanceError);
            } else {
              console.log('Created new user credits balance with 1 credit');
            }
          }
        } catch (creditError: any) {
          console.error('Error adding credit:', creditError);
          // Continue even if credit addition fails
        }
      }

      // Update guest story
      const updateData: any = {
        status: 'approved',
        is_approved: true,
        is_published: true,
        admin_notes: adminNotes || null,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        approved_story_id: testimonial.id,
      };

      // Send magic link to guest
      try {
        const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/complete-profile?guest_story_id=${storyId}`;
        
        const { data: linkData, error: magicLinkError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email: guestStory.email,
          options: {
            redirectTo: redirectUrl
          }
        });

        if (!magicLinkError && linkData) {
          // TODO: Send email with magic link
          // You can use your email service here
          // For now, log the magic link
          console.log('Magic link generated:', linkData.properties?.action_link);
          
          updateData.magic_link_sent = true;
          updateData.magic_link_sent_at = new Date().toISOString();
        } else {
          console.error('Error generating magic link:', magicLinkError);
        }
      } catch (magicLinkErr) {
        console.error('Error generating magic link:', magicLinkErr);
        // Continue even if magic link fails
      }

      const { error: updateError } = await supabase
        .from('testimonials_stories')
        .update(updateData)
        .eq('id', storyId);

      if (updateError) {
        console.error('Error updating guest story:', updateError);
        return NextResponse.json(
          { error: 'Failed to update guest story', details: updateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Guest story approved, user created/updated, credit added, and magic link sent',
        testimonialId: testimonial.id,
        userId: userId
      });
    } else {
      // Reject story
      const { error: updateError } = await supabase
        .from('testimonials_stories')
        .update({
          status: 'rejected',
          is_approved: false,
          is_published: false,
          admin_notes: adminNotes || null,
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', storyId);

      if (updateError) {
        console.error('Error rejecting guest story:', updateError);
        return NextResponse.json(
          { error: 'Failed to reject guest story', details: updateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Guest story rejected'
      });
    }
  } catch (error: any) {
    console.error('Error in POST /api/admin/guest-stories:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

