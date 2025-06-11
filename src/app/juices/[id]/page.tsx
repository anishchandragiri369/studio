import JuiceDetailPage from './JuiceDetailClient';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { JUICES as FALLBACK_JUICES } from '@/lib/constants';

export async function generateStaticParams() {
  if (!isSupabaseConfigured || !supabase) {
    console.warn("Supabase not configured. Falling back to constants.");
    return FALLBACK_JUICES.map(juice => ({
      id: juice.id.toString(),
    }));
  }

  try {
    const { data, error } = await supabase.from('juices').select('id');
    if (error || !data) {
      return FALLBACK_JUICES.map(juice => ({
        id: juice.id.toString(),
      }));
    }
    return data.map(juice => ({ id: juice.id.toString() }));
  } catch {
    return FALLBACK_JUICES.map(juice => ({ id: juice.id.toString() }));
  }
}

export default function Page() {
  return <JuiceDetailPage />;
}
