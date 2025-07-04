const fs = require('fs');
const path = require('path');

// Fix unused imports and variables
const fixes = [
  {
    file: 'src/ai/flows/recommend-juice-combinations.ts',
    fixes: [
      {
        from: 'export async function execute(input: any) {',
        to: 'export async function execute(_input: any) {'
      }
    ]
  },
  {
    file: 'src/ai/flows/suggest-recipe-from-flavors.ts',
    fixes: [
      {
        from: 'export async function execute(input: any) {',
        to: 'export async function execute(_input: any) {'
      }
    ]
  },
  {
    file: 'src/ai/flows/suggest-subscription-plan.ts',
    fixes: [
      {
        from: 'export async function execute(input: any) {',
        to: 'export async function execute(_input: any) {'
      }
    ]
  },
  {
    file: 'src/app/api/fruit-bowls/route.ts',
    fixes: [
      {
        from: 'import { NextRequest, NextResponse } from \'next/server\';',
        to: 'import { NextResponse } from \'next/server\';'
      },
      {
        from: 'import { supabase } from \'@/lib/supabase\';',
        to: 'import { supabase } from \'@/lib/supabase\';'
      },
      {
        from: '} catch (error) {',
        to: '} catch (_error) {'
      }
    ]
  },
  {
    file: 'src/app/api/fruit-bowls/subscription-plans/route.ts',
    fixes: [
      {
        from: 'import { NextRequest, NextResponse } from \'next/server\';',
        to: 'import { NextResponse } from \'next/server\';'
      },
      {
        from: '} catch (error) {',
        to: '} catch (_error) {'
      }
    ]
  },
  {
    file: 'src/app/api/health/route.ts',
    fixes: [
      {
        from: 'import { NextRequest, NextResponse } from \'next/server\';',
        to: 'import { NextResponse } from \'next/server\';'
      }
    ]
  },
  {
    file: 'src/app/api/juices/route.ts',
    fixes: [
      {
        from: '} catch (error) {',
        to: '} catch (_error) {'
      }
    ]
  },
  {
    file: 'src/app/api/orders/create/route.ts',
    fixes: [
      {
        from: 'import { OrderItem, CheckoutAddressFormData } from \'@/lib/types\';',
        to: 'import { /* OrderItem, CheckoutAddressFormData */ } from \'@/lib/types\';'
      },
      {
        from: 'import { clearDeliverySettingsCache } from \'@/lib/deliverySettings\';',
        to: '// import { clearDeliverySettingsCache } from \'@/lib/deliverySettings\';'
      }
    ]
  },
  {
    file: 'src/app/api/subscriptions/create/route.ts',
    fixes: [
      {
        from: 'import { CheckoutAddressFormData } from \'@/lib/types\';',
        to: '// import { CheckoutAddressFormData } from \'@/lib/types\';'
      },
      {
        from: 'import { clearDeliverySettingsCache } from \'@/lib/deliverySettings\';',
        to: '// import { clearDeliverySettingsCache } from \'@/lib/deliverySettings\';'
      }
    ]
  },
  {
    file: 'src/app/api/admin/delivery-schedule/settings/route.ts',
    fixes: [
      {
        from: 'export async function GET(_request: Request) {',
        to: 'export async function GET() {'
      }
    ]
  },
  {
    file: 'src/app/api/admin/delivery-schedule/test/route.ts',
    fixes: [
      {
        from: 'export async function POST(_request: Request) {',
        to: 'export async function POST() {'
      }
    ]
  }
];

function applyFixes() {
  fixes.forEach(fileFix => {
    const filePath = path.join(__dirname, fileFix.file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${fileFix.file}`);
      return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    fileFix.fixes.forEach(fix => {
      if (content.includes(fix.from)) {
        content = content.replace(fix.from, fix.to);
        changed = true;
        console.log(`✅ Fixed in ${fileFix.file}: ${fix.from.substring(0, 50)}...`);
      }
    });
    
    if (changed) {
      fs.writeFileSync(filePath, content);
    }
  });
}

applyFixes();
console.log('Lint fixes applied!');
