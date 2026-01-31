import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load .env.local manually
const envContent = readFileSync('.env.local', 'utf8');
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    process.env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCost() {
  const { data, error } = await supabase
    .from('cost_calculator_settings')
    .select('*')
    .eq('year', 2026)
    .single();

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  console.log('Cost Calculator Settings (2026):');
  console.log('Exchange Rate:', data.exchange_rate);
  console.log('\nChampagne Types:');

  const types = data.champagne_types as any[];
  types.forEach((t: any) => {
    console.log(`  ${t.name}:`);
    console.log(`    - bottles: ${t.bottles}`);
    console.log(`    - costPerBottle (EUR): ${t.costPerBottle}`);
    console.log(`    - packagingCost (KRW): ${t.packagingCost || 0}`);
  });
}

checkCost();
