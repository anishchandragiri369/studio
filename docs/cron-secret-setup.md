# CRON_SECRET Setup Guide

## What is CRON_SECRET?

The `CRON_SECRET` is a security token used to authenticate scheduled tasks (cron jobs) in your application. It prevents unauthorized access to your cron endpoints.

## How to Generate CRON_SECRET

### Method 1: Using Node.js (Recommended)
```bash
node -e "console.log('CRON_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

### Method 2: Using PowerShell (Windows)
```powershell
Add-Type -AssemblyName System.Web
[System.Web.Security.Membership]::GeneratePassword(64, 0)
```

### Method 3: Using Online Generator
1. Go to https://generate-secret.vercel.app/32
2. Copy the generated secret
3. Add `CRON_SECRET=` prefix

### Method 4: Manual Generation
```bash
# Generate a 32-byte random hex string
openssl rand -hex 32
```

## Setting Up the Environment Variable

### For Local Development (.env.local)
```env
CRON_SECRET=your_generated_secret_here
```

### For Production (Netlify)
1. Go to your Netlify dashboard
2. Navigate to Site settings > Environment variables
3. Add new variable:
   - Key: `CRON_SECRET`
   - Value: Your generated secret

### For Production (Vercel)
1. Go to your Vercel dashboard
2. Navigate to Settings > Environment Variables
3. Add new variable:
   - Key: `CRON_SECRET`
   - Value: Your generated secret

## Example Generated Secret
```
CRON_SECRET=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

## Security Best Practices

1. **Never commit secrets to version control**
2. **Use different secrets for different environments**
3. **Rotate secrets periodically**
4. **Keep secrets in secure environment variable storage**
5. **Use strong, random secrets (at least 32 characters)**

## Using the Secret in Code

Your cron endpoints should verify the secret:

```typescript
// In your cron endpoint
const providedSecret = request.headers.get('x-cron-secret') || 
                      request.nextUrl.searchParams.get('secret');
const expectedSecret = process.env.CRON_SECRET;

if (providedSecret !== expectedSecret) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

## Troubleshooting

### Secret Not Working?
1. Check that the environment variable is set correctly
2. Verify the secret matches exactly (no extra spaces)
3. Ensure the secret is available in your deployment environment
4. Check that your cron job is passing the secret correctly

### Testing Your Secret
You can test your cron endpoint manually:
```bash
curl -H "x-cron-secret: your_secret_here" https://your-domain.com/api/your-cron-endpoint
```

## Quick Setup Commands

```bash
# Generate and set CRON_SECRET in one command
echo "CRON_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")" >> .env.local
```

Remember to add the same secret to your production environment variables!
