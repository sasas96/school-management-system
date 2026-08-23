import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  'https://jzepatqjrnpxypiafyel.supabase.co';

const supabasePublishableKey =
  'sb_publishable_KzvDR_TyWmG6GK5oq5XXgg_fU3sMhgg';

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey
);