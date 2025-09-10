import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
Deno.serve(async (req)=>{
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    // 1. Create a Supabase client with the user's auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({
        error: 'Missing Authorization header'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 401
      });
    }
    const userSupabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });
    // 2. Get the user making the request and their profile to verify their role
    const { data: { user }, error: authError } = await userSupabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({
        error: 'Authentication error: Could not get user.'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 401
      });
    }
    const { data: userProfile, error: userError } = await userSupabaseClient.from('profiles').select('role').eq('user_id', user.id).single();
    if (userError) {
      console.error('Error fetching calling user profile:', userError);
      return new Response(JSON.stringify({
        error: 'Failed to fetch user profile.',
        details: userError.message
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      });
    }
    // 3. Check if the user is an admin
    if (!userProfile || userProfile.role !== 'admin') {
      return new Response(JSON.stringify({
        error: 'Not authorized'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 403
      });
    }
    // 4. If the user is an admin, proceed to create the new user
    const { email, password, role, nama, dusun_id } = await req.json();
    if (!email || !role || !nama) {
      return new Response(JSON.stringify({
        error: 'Email, role, and nama are required'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      });
    }
    // 5. Create a Supabase admin client using the service role key
    const adminSupabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    // 6. Attempt to create the new user in auth.users
    const { data: authData, error: createUserError } = await adminSupabaseClient.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        nama: nama,
        role: role,
        dusun: dusun_id
      }
    });
    // 7. Handle potential errors
    if (createUserError) {
      // Check if the error is because the email already exists
      if (createUserError.name === 'AuthApiError' && createUserError.message.includes('already registered')) {
        return new Response(JSON.stringify({
          error: 'User with this email already exists'
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          status: 409
        });
      }
      // For any other error, re-throw it to be caught by the main catch block
      throw createUserError;
    }
    // The handle_new_user trigger should automatically create the profile.
    // If not, we would need to manually insert into the profiles table here.
    // Let's assume the trigger works as intended.
    return new Response(JSON.stringify({
      user: authData.user
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('Error in create-new-user function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({
      error: errorMessage,
      details: String(error)
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});
