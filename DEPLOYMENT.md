# Vercel Deployment Guide for Doxiqo

## Pre-deployment Checklist

### 1. Environment Variables Setup

Add these environment variables in your Vercel project settings:

```bash
# Required
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/doxiqo
NEXTAUTH_SECRET=generate-a-strong-secret-key
NEXTAUTH_URL=https://your-domain.vercel.app
UPLOADTHING_TOKEN=your-uploadthing-token
GEMINI_API_KEY=your-gemini-api-key

# Optional (for GitHub OAuth)
GITHUB_ID=your-github-oauth-app-id
GITHUB_SECRET=your-github-oauth-app-secret
```

### 2. MongoDB Atlas Setup

1. Create a MongoDB Atlas cluster
2. Add your domain to the IP whitelist (0.0.0.0/0 for Vercel)
3. Create a database user with read/write permissions
4. Get the connection string and add it to `MONGODB_URI`

### 3. UploadThing Setup

1. Go to [UploadThing Dashboard](https://uploadthing.com/dashboard)
2. Create a new app or use existing
3. Copy the app token to `UPLOADTHING_TOKEN`

### 4. Google AI Studio Setup

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Add it to `GEMINI_API_KEY`

### 5. NextAuth Configuration

1. Generate a strong secret: `openssl rand -base64 32`
2. Add it to `NEXTAUTH_SECRET`
3. Set `NEXTAUTH_URL` to your production domain

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard

1. Fork/clone this repository
2. Connect your GitHub account to Vercel
3. Import the project
4. Add environment variables
5. Deploy

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Add environment variables
vercel env add MONGODB_URI
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL
vercel env add UPLOADTHING_TOKEN
vercel env add GEMINI_API_KEY

# Redeploy with env vars
vercel --prod
```

## Common Issues & Solutions

### 1. Build Errors

- Ensure all environment variables are set
- Check that dependencies are properly installed
- Verify TypeScript compilation passes

### 2. Database Connection Issues

- Verify MongoDB Atlas connection string
- Check IP whitelist settings (add 0.0.0.0/0)
- Ensure database user has proper permissions

### 3. File Upload Issues

- Verify UploadThing token is correct
- Check CORS settings in UploadThing dashboard
- Ensure file size limits are configured

### 4. Authentication Issues

- Verify NEXTAUTH_SECRET is set and secure
- Check NEXTAUTH_URL matches your domain
- For GitHub OAuth, verify app credentials

### 5. AI Generation Timeouts

- Gemini API calls may take 20-30 seconds
- Vercel function timeout is handled in vercel.json
- Check API key and quota limits

## Performance Optimization

### 1. Function Timeouts

- Generation function: 300 seconds (5 minutes)
- Preparation function: 60 seconds
- Other functions: 10 seconds (default)

### 2. File Size Limits

- ZIP uploads: 50MB max (UploadThing limit)
- Extracted files: 8MB total processing limit
- Individual files: 300KB processing limit

### 3. Rate Limiting

- API generation: 5 requests per minute per user
- Built-in protection against abuse

## Monitoring & Logs

### 1. Vercel Functions

- Check function logs in Vercel dashboard
- Monitor execution time and memory usage
- Set up alerts for errors

### 2. Database Monitoring

- Monitor MongoDB Atlas metrics
- Set up connection alerts
- Track query performance

### 3. Third-party Services

- Monitor UploadThing usage
- Track Gemini API usage and costs
- Set up quota alerts

## Security Considerations

### 1. Environment Variables

- Never commit .env files
- Use strong, unique secrets
- Rotate keys regularly

### 2. Database Security

- Use strong database passwords
- Enable MongoDB Atlas security features
- Regular security audits

### 3. File Processing

- Files are processed in isolated /tmp directory
- Temporary files are cleaned up after processing
- No persistent file storage on Vercel

## Scaling Considerations

- Vercel automatically scales functions
- MongoDB Atlas can be upgraded as needed
- UploadThing has tiered pricing
- Gemini API has rate limits and quotas

## Support

For deployment issues:

1. Check Vercel deployment logs
2. Verify all environment variables
3. Test API endpoints individually
4. Check third-party service status
