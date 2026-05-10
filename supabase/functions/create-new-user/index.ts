import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
Deno.serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      });
    }
    const userSupabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await userSupabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Authentication error: Could not get user.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      });
    }
    const { data: userProfile, error: userError } = await userSupabaseClient
      .from('profiles').select('role').eq('user_id', user.id).single();
    if (userError) {
      console.error('Error fetching calling user profile:', userError);
      return new Response(JSON.stringify({ error: 'Failed to fetch user profile.', details: userError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }
    if (!userProfile || userProfile.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Not authorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403
      });
    }

    // Accept both `dusun` (preferred, sent by frontend) and legacy `dusun_id`
    const body = await req.json();
    const email = body.email;
    const password = body.password;
    const role = body.role;
    const nama = body.nama;
    const dusun = body.dusun ?? body.dusun_id ?? null;

    if (!email || !role || !nama) {
      return new Response(JSON.stringify({ error: 'Email, role, and nama are required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }
    if (role === 'kadus' && !dusun) {
      return new Response(JSON.stringify({ error: 'Dusun wajib dipilih untuk role kadus.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    const adminSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Create the auth user (trigger handle_new_user should populate profiles)
    const { data: authData, error: createUserError } = await adminSupabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nama,
        role,
        dusun: role === 'kadus' ? dusun : null
      }
    });

    if (createUserError) {
      if (createUserError.name === 'AuthApiError' && createUserError.message.includes('already registered')) {
        return new Response(JSON.stringify({ error: 'User with this email already exists' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 409
        });
      }
      throw createUserError;
    }

    // 2. Ensure the profile has the correct dusun/role (in case trigger didn't run or fields missing)
    //    Use upsert with service role to bypass RLS and guarantee persistence.
    if (authData?.user?.id) {
      const { error: upsertError } = await adminSupabaseClient
        .from('profiles')
        .upsert({
          user_id: authData.user.id,
          nama,
          email,
          role,
          dusun: role === 'kadus' ? dusun : null,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (upsertError) {
        console.error('Error upserting profile after auth create:', upsertError);
        // Not fatal: the auth user is created, client can still proceed; return warning.
        return new Response(JSON.stringify({
          user: authData.user,
          warning: 'User dibuat tetapi sinkronisasi profile gagal: ' + upsertError.message
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        });
      }
    }

    return new Response(JSON.stringify({ user: authData.user }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    console.error('Error in create-new-user function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage, details: String(error) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
