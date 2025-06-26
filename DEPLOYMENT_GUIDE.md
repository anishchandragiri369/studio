# 🚀 Deployment Guide: Netlify + Mobile APK

This guide explains how to deploy your app to both web (Netlify) and mobile (APK).

## 🌐 Netlify Web Deployment

### Automatic Deployment
1. **Push to GitHub**: When you push changes to your `develop` or `main` branch, Netlify will automatically:
   - Run `npm run build:server`
   - Set `MOBILE_BUILD=false` 
   - Deploy with full API functionality

### Manual Deployment
```bash
# Test locally first
npm run build:server
npm start

# Then push to GitHub
git add .
git commit -m "your changes"
git push origin develop
```

### Environment Variables in Netlify
Make sure these are set in your Netlify dashboard:
```
MOBILE_BUILD=false
NEXT_PUBLIC_BUILD_MODE=server
NEXT_PUBLIC_API_BASE_URL=https://your-site.netlify.app
```

## 📱 Mobile APK Build

### Method 1: Quick APK Build (Recommended)
```bash
# Build APK with your Netlify URL
npm run apk:build https://your-site.netlify.app

# Or use default URL from .env
npm run apk:build
```

This will:
1. ✅ Set the correct API base URL
2. ✅ Build static export
3. ✅ Sync with Capacitor  
4. ✅ Open Android Studio
5. ✅ Clean up temporary files

### Method 2: Manual Step-by-Step
```bash
# 1. Build static version
npm run build:static

# 2. Sync with Capacitor
npx cap sync

# 3. Open Android Studio
npx cap open android

# 4. In Android Studio:
#    - Build > Build Bundle(s) / APK(s) > Build APK(s)
#    - Find APK at: android/app/build/outputs/apk/debug/app-debug.apk
```

### Method 3: GitHub Actions (Automated)
1. **Manual Trigger**: Go to GitHub > Actions > "Build Android APK" > Run workflow
2. **Tag Release**: Create a tag like `mobile-v1.0.0` to auto-build and release

## 🔧 Configuration Parameters

### For Netlify (Web Server)
```env
MOBILE_BUILD=false
NEXT_PUBLIC_BUILD_MODE=server  
NEXT_PUBLIC_API_BASE_URL=https://your-site.netlify.app
```

### For Mobile APK (Static Export)
```env
MOBILE_BUILD=true
NEXT_PUBLIC_BUILD_MODE=static
NEXT_PUBLIC_API_BASE_URL=https://your-site.netlify.app
```

## 📋 Deployment Checklist

### Before Deploying to Netlify:
- [ ] Update `NEXT_PUBLIC_API_BASE_URL` in `.env` to your Netlify URL
- [ ] Test server build: `npm run build:server`
- [ ] Commit and push to GitHub
- [ ] Check Netlify build logs

### Before Building APK:
- [ ] Ensure Netlify deployment is working
- [ ] Update API URL in APK build command
- [ ] Test mobile build: `npm run build:static`
- [ ] Install Android Studio and SDK
- [ ] Connect Android device or setup emulator

## 🌍 Environment-Specific URLs

### Development
```bash
npm run dev  # Uses http://localhost:9002
```

### Production Web (Netlify)
```bash
npm run build:server  # Uses https://your-site.netlify.app
```

### Mobile APK
```bash
npm run apk:build https://your-site.netlify.app
```

## 🔄 Complete Workflow

1. **Develop**: Make changes locally with `npm run dev`
2. **Test Server**: Run `npm run build:server` to test web version
3. **Deploy Web**: Push to GitHub → Netlify auto-deploys
4. **Build Mobile**: Run `npm run apk:build https://your-netlify-url.netlify.app`
5. **Distribute**: Install APK on devices or upload to app stores

## 🆘 Troubleshooting

### Netlify Build Fails
- Check that `netlify.toml` has `command = "npm run build:server"`
- Verify environment variables are set correctly
- Check build logs for API route errors

### APK Build Fails  
- Ensure Android Studio and SDK are installed
- Check that `NEXT_PUBLIC_API_BASE_URL` points to your live Netlify site
- Verify static build works: `npm run build:static`

### API Calls Fail in Mobile App
- Check that `NEXT_PUBLIC_API_BASE_URL` in APK build matches your Netlify URL
- Ensure Netlify APIs are accessible (test in browser)
- Check CORS settings if needed
