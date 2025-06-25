const fs = require('fs');
const path = require('path');

// Function to temporarily rename API directory for mobile builds
function handleApiDirectory(action) {
  const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');
  const apiBackupDir = path.join(__dirname, '..', 'src', 'app', '_api_backup');
  
  if (action === 'hide') {
    if (fs.existsSync(apiDir)) {
      console.log('Temporarily hiding API directory for mobile build...');
      fs.renameSync(apiDir, apiBackupDir);
    } else {
      console.log('API directory not found, skipping...');
    }
  } else if (action === 'restore') {
    if (fs.existsSync(apiBackupDir)) {
      console.log('Restoring API directory...');
      fs.renameSync(apiBackupDir, apiDir);
    } else {
      console.log('API backup directory not found, skipping...');
    }
  }
}

// Get command line argument
const action = process.argv[2];

if (action === 'hide' || action === 'restore') {
  handleApiDirectory(action);
} else {
  console.log('Usage: node handle-api-routes.js [hide|restore]');
  process.exit(1);
}
