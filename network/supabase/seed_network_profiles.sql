-- =====================================================================
-- Backfill network_profiles for any profile that doesn't have one yet.
--
-- Why the Network tab / mind map showed "no one else": a network_profiles
-- row is only ever created when someone visits the Network tab and saves
-- tags. Dummy/test accounts created via signup never did that, so there
-- was nothing in network_profiles to match against even though the
-- profiles table has plenty of rows.
--
-- This assigns each role a tag combo from a small fixed pool (cycling by
-- signup order), so users land in overlapping clusters instead of all
-- getting unique, never-matching tags. Safe to re-run — only inserts
-- users who are still missing a network_profiles row.
-- =====================================================================

with student_combos(combo_idx, interests, looking_for) as (
  values
    (0, array['Machine Learning','Robotics'], array['Praktikum','Abschlussarbeit']),
    (1, array['Data Science','Machine Learning'], array['Werkstudium','Masterprogramm']),
    (2, array['Sustainability','Climate Policy'], array['Praktikum','Traineeprogramm']),
    (3, array['Robotics','Product Design'], array['Bachelorprogramm','Werkstudium'])
),
educator_combos(combo_idx, expertise_tags, offers) as (
  values
    (0, array['Embedded Systems','IoT'], array['Laborpraktikum','Projektarbeit-Betreuung']),
    (1, array['Robotics','Automotive'], array['Gastvortrag / Expertenvortrag','Exkursion zum Standort']),
    (2, array['Renewable Energy','Power Distribution'], array['Kits & Boards für den Unterricht','Lehrmaterial & Design-Tools']),
    (3, array['PCB Design','RF & Wireless'], array['Laborpraktikum','Hochschulgruppen-Förderung'])
),
wurth_employee_combos(combo_idx, expertise_tags, looking_for, sought_educators, offers) as (
  values
    (0, array['Embedded Systems','IoT'], array['Praktikum','Werkstudium'], array['Professor/Dozent'], array['Gastvortrag / Expertenvortrag']),
    (1, array['Robotics','Automotive'], array['Abschlussarbeit','Masterprogramm'], array['Laborpraktikum-Betreuer'], array['Exkursion zum Standort'])
),
ranked as (
  select id, role, created_at, row_number() over (partition by role order by created_at) - 1 as rn
  from profiles
  where id not in (select user_id from network_profiles)
)
insert into network_profiles (user_id, bio, interests, looking_for, offers, expertise_tags, sought_educators)
select
  r.id,
  case r.role
    when 'student' then 'Student exploring opportunities with Würth Elektronik.'
    when 'educator' then 'Educator connecting students with industry partners.'
    else 'Würth Elektronik team member.'
  end,
  coalesce(sc.interests, '{}'),
  coalesce(sc.looking_for, adc.looking_for, '{}'),
  coalesce(ec.offers, adc.offers, '{}'),
  coalesce(ec.expertise_tags, adc.expertise_tags, '{}'),
  coalesce(adc.sought_educators, '{}')
from ranked r
left join student_combos sc on r.role = 'student' and sc.combo_idx = r.rn % 4
left join educator_combos ec on r.role = 'educator' and ec.combo_idx = r.rn % 4
left join wurth_employee_combos adc on r.role = 'wurth_employee' and adc.combo_idx = r.rn % 2;

-- ---------------------------------------------------------------------
-- Give existing demo rows enough variation for meaningful match scores.
--
-- The first version above only had 4/4/2 repeating combinations and did
-- not populate role_data. That left many role-pair calculations with only
-- one usable signal, commonly producing the exact same 50% score.
--
-- This is a demo reseed: it intentionally refreshes matching fields for every
-- existing network profile. Restricting by the original seed bio caused this
-- block to update zero rows when demo users came from a different seed.
-- ---------------------------------------------------------------------
with seeded as (
  select
    p.id,
    p.role,
    row_number() over (partition by p.role order by p.created_at, p.id) - 1 as rn
  from profiles p
  join network_profiles np on np.user_id = p.id
)
update network_profiles np
set
  interests = case s.role
    when 'student' then case s.rn % 8
      when 0 then array['Machine Learning','Robotics','Research']
      when 1 then array['Data Science']
      when 2 then array['Sustainability','Climate Policy','Research']
      when 3 then array['Robotics','Product Design']
      when 4 then array['Entrepreneurship','Product Design']
      when 5 then array['Machine Learning','Data Science']
      when 6 then array['Web Design','Entrepreneurship']
      else array['Research','Sustainability']
    end
    when 'educator' then case s.rn % 8
      when 0 then array['Research','Machine Learning']
      when 1 then array['Robotics']
      when 2 then array['Sustainability','Research']
      when 3 then array['Product Design']
      when 4 then array['Data Science','Research']
      when 5 then array['Entrepreneurship']
      when 6 then array['Climate Policy','Sustainability']
      else array['Machine Learning','Robotics']
    end
    else case s.rn % 8
      when 0 then array['Machine Learning','Research']
      when 1 then array['Robotics','Product Design']
      when 2 then array['Sustainability']
      when 3 then array['Entrepreneurship','Data Science']
      when 4 then array['Research']
      when 5 then array['Climate Policy','Sustainability']
      when 6 then array['Web Design']
      else array['Machine Learning','Robotics','Product Design']
    end
  end,
  looking_for = case s.role
    when 'student' then case s.rn % 10
      when 0 then array['Praktikum']
      when 1 then array['Werkstudium','Masterprogramm']
      when 2 then array['Abschlussarbeit']
      when 3 then array['Bachelorprogramm','Werkstudium']
      when 4 then array['Stipendium','Masterprogramm','Traineeprogramm']
      when 5 then array['Direkteinstieg']
      when 6 then array['Praktikum','Kostenlose Bauteile']
      when 7 then array['Abschlussarbeit','Werkstudium','Direkteinstieg']
      when 8 then array['Bachelorprogramm']
      else array['Praktikum','Traineeprogramm','Direkteinstieg']
    end
    when 'wurth_employee' then case s.rn % 8
      when 0 then array['Praktikum','Werkstudium','Abschlussarbeit']
      when 1 then array['Masterprogramm']
      when 2 then array['Traineeprogramm','Direkteinstieg']
      when 3 then array['Bachelorprogramm','Stipendium']
      when 4 then array['Werkstudium']
      when 5 then array['Abschlussarbeit','Masterprogramm']
      when 6 then array['Praktikum','Bachelorprogramm','Traineeprogramm']
      else array['Direkteinstieg','Werkstudium']
    end
    else array[]::text[]
  end,
  expertise_tags = case s.role
    when 'student' then array[]::text[]
    else case s.rn % 10
      when 0 then array['Embedded Systems']
      when 1 then array['Robotics','Automotive']
      when 2 then array['Renewable Energy','Power Distribution','EMC/EMI']
      when 3 then array['PCB Design']
      when 4 then array['RF & Wireless','IoT']
      when 5 then array['Sensors','Embedded Systems']
      when 6 then array['Automotive']
      when 7 then array['Power Distribution','PCB Design']
      when 8 then array['IoT','Sensors','Robotics']
      else array['EMC/EMI','RF & Wireless']
    end
  end,
  offers = case s.role
    when 'student' then array[]::text[]
    when 'educator' then case s.rn % 10
      when 0 then array['Laborpraktikum']
      when 1 then array['Projektarbeit-Betreuung','Gastvortrag / Expertenvortrag']
      when 2 then array['Kostenlose Bauteile für die Lehre']
      when 3 then array['Exkursion zum Standort','Karrieremessen & Recruiting-Events']
      when 4 then array['Lehrmaterial & Design-Tools','Kits & Boards für den Unterricht']
      when 5 then array['Hochschulgruppen-Förderung']
      when 6 then array['Laborpraktikum','Projektarbeit-Betreuung','Kostenlose Bauteile für die Lehre']
      when 7 then array['Erfolgsgeschichten']
      when 8 then array['Gastvortrag / Expertenvortrag','Exkursion zum Standort']
      else array['Projektarbeit-Betreuung']
    end
    else case s.rn % 4
      when 0 then array['Gastvortrag / Expertenvortrag']
      when 1 then array['Exkursion zum Standort','Karrieremessen & Recruiting-Events']
      when 2 then array['Kostenlose Bauteile für die Lehre']
      else array['Gastvortrag / Expertenvortrag','Exkursion zum Standort']
    end
  end,
  sought_educators = case s.role
    when 'wurth_employee' then case s.rn % 6
      when 0 then array['Professor/Dozent']
      when 1 then array['Laborpraktikum-Betreuer','Projektarbeit-Betreuer']
      when 2 then array['Hochschulgruppen-Berater']
      when 3 then array['Professor/Dozent','Projektarbeit-Betreuer']
      when 4 then array['Laborpraktikum-Betreuer']
      else array['Professor/Dozent','Hochschulgruppen-Berater']
    end
    else array[]::text[]
  end,
  cached_matches = '[]'::jsonb,
  matches_generated_at = null,
  updated_at = now()
from seeded s
where np.user_id = s.id;

-- Role-specific comparison fields live in profiles.role_data rather than
-- network_profiles. Merge them in so optional values such as LinkedIn are
-- preserved while the demo matching signals become varied.
with seeded as (
  select
    p.id,
    p.role,
    row_number() over (partition by p.role order by p.created_at, p.id) - 1 as rn
  from profiles p
  join network_profiles np on np.user_id = p.id
)
update profiles p
set role_data = (coalesce(p.role_data, '{}'::jsonb) - 'year' - 'studyYear' - 'yearOfStudy' - 'academicYear') || case s.role
  when 'student' then jsonb_build_object(
    'school', (array['TUM','KIT','RWTH Aachen','University of Stuttgart','TU Berlin'])[1 + (s.rn % 5)::int],
    'fieldOfStudy', (array['Electrical Engineering','Computer Science','Mechanical Engineering','Business/Economics','Physics','Mathematics','Other'])[1 + (s.rn % 7)::int],
    'semester', (array['1st semester','2nd semester','3rd semester','4th semester','5th semester','6th semester','7th semester','8th semester+'])[1 + (s.rn % 8)::int]
  )
  when 'educator' then jsonb_build_object(
    'institution', (array['TUM','KIT','RWTH Aachen','University of Stuttgart','TU Berlin'])[1 + (s.rn % 5)::int],
    'subject', (array['Electrical Engineering','Computer Science','Mechanical Engineering','Business/Economics','Physics','Mathematics','Other'])[1 + (s.rn % 7)::int]
  )
  else jsonb_build_object(
    'organization', 'Würth Elektronik',
    'site', (array['Waldenburg','Munich','Niedernhall','Waldzimmern'])[1 + (s.rn % 4)::int],
    'businessUnit', (array['University Relations','Recruiting','R&D','Marketing','Sales','Operations','IT','Human Resources'])[1 + (s.rn % 8)::int],
    'contactChannel', (array['Platform inbox','Email'])[1 + (s.rn % 2)::int]
  )
end
from seeded s
where p.id = s.id;

-- Supabase displays this result after the script runs. The second column
-- confirms rows exist; the third confirms they no longer share one profile.
select
  p.role,
  count(*) as people_reseeded,
  count(distinct concat_ws(
    '|',
    np.interests::text,
    np.looking_for::text,
    np.offers::text,
    np.expertise_tags::text,
    np.sought_educators::text,
    p.role_data::text
  )) as distinct_comparison_profiles
from profiles p
join network_profiles np on np.user_id = p.id
group by p.role
order by p.role;
