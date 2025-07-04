const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addImageColumnToFruitBowls() {
  try {
    console.log('🚀 Adding image column to fruit_bowls table...');
    
    // Read the SQL migration file
    const sqlPath = path.join(__dirname, 'sql', 'add_image_to_fruit_bowls.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Split by semicolon to execute each statement separately
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`   ${i + 1}. ${statement.substring(0, 50)}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        // Try direct query if RPC doesn't work
        console.log('   Trying direct execution...');
        // For Supabase, we'll need to execute these manually or use the dashboard
        console.log(`   ⚠️  Please execute this SQL manually in Supabase dashboard: ${statement}`);
      } else {
        console.log('   ✅ Success');
      }
    }
    
    // Verify the column was added
    console.log('\n🔍 Verifying the migration...');
    const { data: sampleData, error: dataError } = await supabase
      .from('fruit_bowls')
      .select('id, name, image, image_url')
      .limit(3);

    if (dataError) {
      console.error('❌ Error verifying migration:', dataError);
      return;
    }

    console.log('📊 Sample fruit bowls after migration:');
    sampleData.forEach(item => {
      console.log(`   - ${item.name}: image="${item.image}", image_url="${item.image_url}"`);
    });

    console.log('\n✅ Migration completed! All fruit bowls now have image column.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

addImageColumnToFruitBowls();
