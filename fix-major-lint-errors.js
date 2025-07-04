#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// List of files to fix - focusing on API routes and core components
const filesToProcess = [
  'src/app/api/fruit-bowls/route.ts',
  'src/app/api/fruit-bowls/subscription-plans/route.ts',
  'src/app/api/orders/create/route.ts',
  'src/app/api/subscriptions/create/route.ts',
  'src/app/api/cashfree/create-order/route.ts',
  'src/app/api/corporate/accounts/route.ts',
  'src/app/api/corporate/employees/route.ts',
];

const fixes = [
  // Fix unused _error parameters
  {
    pattern: /} catch \(_error\) {/g,
    replacement: '} catch {'
  },
  // Fix unused _request parameters
  {
    pattern: /\((_request): NextRequest\)/g,
    replacement: '(_request: NextRequest)'
  },
  // Fix unused variables at the start of functions
  {
    pattern: /const _(\w+) = /g,
    replacement: 'const $1 = '
  },
  // Fix prefer-const for variables that are never reassigned
  {
    pattern: /let (\w+) = (\w+)\.map\(/g,
    replacement: 'const $1 = $2.map('
  },
  // Fix prefer-const for other simple cases
  {
    pattern: /let (\w+) = \[/g,
    replacement: 'const $1 = ['
  },
  {
    pattern: /let (\w+) = \{/g,
    replacement: 'const $1 = {'
  }
];

function fixFile(filePath) {
  try {
    const fullPath = path.join(__dirname, filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    let changed = false;

    // Apply fixes
    fixes.forEach(fix => {
      const oldContent = content;
      content = content.replace(fix.pattern, fix.replacement);
      if (content !== oldContent) {
        changed = true;
      }
    });

    // Special fixes for specific patterns
    
    // Fix unused imports at the top of files
    if (filePath.includes('fruit-bowls/route.ts')) {
      content = content.replace(/import.*?'FruitBowl'.*?from.*?;?\n/g, '');
    }
    
    if (filePath.includes('fruit-bowls/subscription-plans/route.ts')) {
      content = content.replace(/import.*?'FruitBowlSubscriptionPlan'.*?from.*?;?\n/g, '');
    }
    
    if (filePath.includes('orders/create/route.ts')) {
      content = content.replace(/import.*?'OrderItem'.*?,.*?'CheckoutAddressFormData'.*?from.*?;?\n/g, '');
      content = content.replace(/import.*?'clearDeliverySettingsCache'.*?from.*?;?\n/g, '');
    }
    
    if (filePath.includes('subscriptions/create/route.ts')) {
      content = content.replace(/import.*?'CheckoutAddressFormData'.*?from.*?;?\n/g, '');
      content = content.replace(/import.*?'clearDeliverySettingsCache'.*?from.*?;?\n/g, '');
    }

    if (changed) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`Fixed: ${filePath}`);
    } else {
      console.log(`No changes needed: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
  }
}

// Process all files
filesToProcess.forEach(fixFile);

console.log('Lint fixes completed!');
