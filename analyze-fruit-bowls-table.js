const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeFruitBowlsTable() {
  try {
    console.log('🔍 Analyzing fruit_bowls table structure...');
    
    // Get table structure using raw SQL
    const { data: columns, error: columnsError } = await supabase.rpc('get_table_columns', {
      table_name: 'fruit_bowls'
    });

    // If the RPC doesn't exist, try direct query
    if (columnsError) {
      console.log('Trying direct table query...');
      const { data: sampleData, error: dataError } = await supabase
        .from('fruit_bowls')
        .select('*')
        .limit(1);

      if (dataError) {
        console.error('❌ Error fetching sample data:', dataError);
        return;
      }

      if (sampleData && sampleData.length > 0) {
        const columns = Object.keys(sampleData[0]);
        console.log('📋 Detected columns from sample data:');
        columns.forEach(col => {
          console.log(`  - ${col}`);
        });

        const hasImageColumn = columns.includes('image');
        console.log(`\n🖼️  Image column exists: ${hasImageColumn ? '✅ YES' : '❌ NO'}`);

        console.log('\n📊 Sample fruit bowls data:');
        console.log(JSON.stringify(sampleData, null, 2));
      }
    } else {
      console.log('📋 Current fruit_bowls table structure:');
      columns.forEach(col => {
        const nullable = col.is_nullable === 'NO' ? '(NOT NULL)' : '(NULLABLE)';
        const defaultValue = col.column_default ? `DEFAULT ${col.column_default}` : '';
        console.log(`  - ${col.column_name}: ${col.data_type} ${nullable} ${defaultValue}`);
      });

      const hasImageColumn = columns.some(col => col.column_name === 'image');
      console.log(`\n🖼️  Image column exists: ${hasImageColumn ? '✅ YES' : '❌ NO'}`);
    }

    // Count total records
    const { count, error: countError } = await supabase
      .from('fruit_bowls')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error counting records:', countError);
      return;
    }

    console.log(`\n📈 Total fruit bowls in database: ${count}`);

    if (!hasImageColumn) {
      console.log('\n💡 Recommendation: Add image column to fruit_bowls table');
      console.log('   SQL: ALTER TABLE fruit_bowls ADD COLUMN image TEXT;');
      console.log('   Then update all records with: UPDATE fruit_bowls SET image = \'/images/fruit-bowl-custom.jpg\';');
    }

  } catch (error) {
    console.error('❌ Analysis failed:', error);
  }
}

analyzeFruitBowlsTable();
