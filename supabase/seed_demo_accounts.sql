-- =====================================================================
-- Demo accounts for the landing page's one-click "Demo: …" buttons
-- (src/constants/demoAccounts.js). One account per role, password
-- "demo-weconnect", email pre-confirmed.
--
-- Normally the buttons auto-provision these accounts client-side through
-- the regular signup flow, so this file is only needed when the Supabase
-- project has email confirmation enabled — the @example.com addresses
-- can't receive a confirmation mail, so the accounts must be created
-- here, already confirmed. Run once in the SQL editor; safe to re-run
-- (existing accounts are left alone, but their demo flags are repaired).
--
-- Keep emails/usernames/role_data in sync with src/constants/demoAccounts.js.
-- =====================================================================

do $$
declare
  demo record;
  uid uuid;
begin
  for demo in
    select * from (values
      (
        'demo.student@example.com', 'Demo Student', 'demo_student', 'student',
        '{"school":"TU München","fieldOfStudy":"Electrical Engineering","semester":"4th semester","affiliationId":"DEMO-0001"}'::jsonb
      ),
      (
        'demo.educator@example.com', 'Demo Educator', 'demo_educator', 'educator',
        '{"institution":"KIT Karlsruhe","subject":"Computer Science","affiliationId":"DEMO-0002"}'::jsonb
      ),
      (
        'demo.wurth@example.com', 'Demo Würth Employee', 'demo_wurth', 'wurth_employee',
        '{"site":"Waldenburg","businessUnit":"University Relations","organization":"Würth Elektronik"}'::jsonb
      )
    ) as t(email, name, username, user_role, role_data)
  loop
    select id into uid from auth.users where email = demo.email;

    if uid is null then
      uid := gen_random_uuid();

      -- The on_auth_user_created trigger (schema.sql section 11) reads this
      -- metadata and creates the profiles row, exactly as a real signup would.
      -- Token columns get '' rather than NULL: GoTrue's Go scanner errors on
      -- NULL string fields for rows it later reads back.
      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, recovery_token, email_change, email_change_token_new
      )
      values (
        '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
        demo.email, crypt('demo-weconnect', gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object(
          'name', demo.name,
          'username', demo.username,
          'role', demo.user_role,
          'role_data', demo.role_data,
          'verification_status', 'verified'
        ),
        now(), now(), '', '', '', ''
      );

      insert into auth.identities (
        id, user_id, provider_id, provider, identity_data,
        last_sign_in_at, created_at, updated_at
      )
      values (
        gen_random_uuid(), uid, uid::text, 'email',
        jsonb_build_object('sub', uid::text, 'email', demo.email, 'email_verified', true),
        now(), now(), now()
      );
    end if;

    -- Demo users skip both the verification gate and the onboarding
    -- questionnaire (App.jsx) and land straight in the app.
    update public.profiles
    set onboarding_completed = true, verification_status = 'verified'
    where id = uid;
  end loop;
end $$;
