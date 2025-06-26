const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Function to add export declarations to API routes
function addExportsToApiRoute(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check if exports already exist
  if (content.includes('export const dynamic') || content.includes('export const revalidate')) {
    console.log(`Skipping ${filePath} - exports already exist`);
    return;
  }
  
  // Find the first import or the start of the file
  const lines = content.split('\n');
  let insertIndex = 0;
  
  // Find the last import line
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ')) {
      insertIndex = i + 1;
    } else if (lines[i].trim() === '' && insertIndex > 0) {
      // Empty line after imports
      insertIndex = i;
      break;
    }
  }
  
  // Insert the export declarations
  const exportsToAdd = [
    '',
    '// Required for static export',
    'export const dynamic = \'force-static\';',
    'export const revalidate = false;',
    ''
  ];
  
  lines.splice(insertIndex, 0, ...exportsToAdd);
  
  const updatedContent = lines.join('\n');
  fs.writeFileSync(filePath, updatedContent, 'utf8');
  console.log(`Updated ${filePath}`);
}

// Find all API route files
const apiRoutes = glob.sync('src/app/api/**/route.ts', { cwd: __dirname });

console.log(`Found ${apiRoutes.length} API routes to update:`);
apiRoutes.forEach(route => {
  const fullPath = path.join(__dirname, route);
  console.log(`Processing: ${route}`);
  try {
    addExportsToApiRoute(fullPath);
  } catch (error) {
    console.error(`Error processing ${route}:`, error.message);
  }
});

console.log('Done updating API routes for static export compatibility!');
