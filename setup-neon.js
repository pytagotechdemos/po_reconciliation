const fs = require('fs');

async function setupNeon() {
  const token = 'napi_n2qchukdlwxw72qs3719vz9a9l4usrv3xsst56wr1exzom6noq11x0i7zjnb3ota';
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  try {
    // 1. Get org_id
    console.log('Fetching organizations...');
    const orgsRes = await fetch('https://console.neon.tech/api/v2/users/me/organizations', { headers });
    const orgs = await orgsRes.json();
    
    if (!orgs || !orgs.organizations || orgs.organizations.length === 0) {
      console.log('No organizations found for this user.');
      return;
    }
    
    const orgId = orgs.organizations[0].id;
    console.log(`Found org_id: ${orgId}`);

    // 2. Create Project
    console.log('Creating project...');
    const createRes = await fetch('https://console.neon.tech/api/v2/projects', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        project: {
          name: 'po-reconciliation',
          org_id: orgId
        }
      })
    });
    
    const projectData = await createRes.json();
    if (projectData.message) {
      console.log('Error creating project:', projectData.message);
      return;
    }

    console.log(`Project created! ID: ${projectData.project.id}`);
    
    // In Neon API v2, creating a project returns connection_uris
    const connectionUri = projectData.connection_uris[0].connection_uri;
    console.log('Database URL retrieved successfully!', connectionUri);
    
    // 4. Save to .env.local
    let envContent = '';
    if (fs.existsSync('.env.local')) {
      envContent = fs.readFileSync('.env.local', 'utf-8');
    }
    
    // Update or append DATABASE_URL
    if (envContent.includes('DATABASE_URL=')) {
      envContent = envContent.replace(/DATABASE_URL=.*/g, `DATABASE_URL="${connectionUri}"`);
    } else {
      envContent += `\nDATABASE_URL="${connectionUri}"\n`;
    }
    
    fs.writeFileSync('.env.local', envContent);
    fs.writeFileSync('.env', envContent);
    console.log('.env and .env.local updated with DATABASE_URL.');

  } catch (err) {
    console.error('Script error:', err);
  }
}

setupNeon();
