import { supabase } from '../database/supabase.client';
import { decrypt } from '../crypto/config.crypto';
import { GatewayConfig, Project } from '../payments/payment.types';

export async function findProjectByApiKey(
  apiKey: string
): Promise<Project | null> {
  const { data, error } = await supabase
    .schema('payments')
    .from('projects')
    .select('*')
    .eq('api_key', apiKey)
    .single();

  if (error || !data) return null;
  return data as Project;
}

export async function findActiveGatewayConfig(
  projectId: string,
  gateway?: string
): Promise<GatewayConfig | null> {
  let query = supabase
    .schema('payments')
    .from('payment_configs')
    .select('*')
    .eq('project_id', projectId)
    .eq('is_active', true);

  if (gateway) {
    query = query.eq('gateway', gateway);
  }

  const { data, error } = await query.limit(1).single();

  if (error || !data) return null;

  const decryptedConfig = JSON.parse(decrypt(data.config as string)) as Record<string, string>;

  return {
    id: data.id as string,
    project_id: data.project_id as string,
    gateway: data.gateway as string,
    config: decryptedConfig,
  };
}
