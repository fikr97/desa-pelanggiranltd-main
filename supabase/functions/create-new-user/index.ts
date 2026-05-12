import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
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

    // Use anon client just to get the authenticated user
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Authentication error' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      });
    }

    // Use service role to check profile (bypasses RLS completely)
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: userProfile, error: profileError } = await adminClient
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profileError || !userProfile) {
      return new Response(JSON.stringify({ error: 'Failed to fetch user profile' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }

    if (userProfile.role !== 'superuser') {
      return new Response(JSON.stringify({ error: 'Not authorized. Only superuser can create users.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403
      });
    }

    const body = await req.json();
    const { email, password, role, nama } = body;
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

    const { data: authData, error: createUserError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nama, role, dusun: role === 'kadus' ? dusun : null }
    });

    if (createUserError) {
      if (createUserError.message?.includes('already registered')) {
        return new Response(JSON.stringify({ error: 'User with this email already exists' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 409
        });
      }
      throw createUserError;
    }

    if (authData?.user?.id) {
      await adminClient.from('profiles').upsert({
        user_id: authData.user.id,
        nama,
        email,
        role,
        dusun: role === 'kadus' ? dusun : null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
    }

    return new Response(JSON.stringify({ user: authData.user }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
