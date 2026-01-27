# Secrets Setup Guide

Complete step-by-step guide to configure all secrets and environment variables.

## Part 1: Vercel Setup (Do This First)

### Step 1: Create Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Click **"Import Git Repository"**
4. Find and select: `twr-engineering/twr-mls`
5. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (default)
   - **Build Command**: `pnpm build`
   - **Output Directory**: `.next`
   - **Install Command**: `pnpm install`
6. **DO NOT DEPLOY YET** - Click **"Deploy"** to create the project

### Step 2: Disable Auto-Deploy in Vercel

1. In Vercel project, go to **Settings** → **Git**
2. Scroll to **"Production Branch"**
3. **UNCHECK**: "Automatically build and deploy commits pushed to the production branch"
4. Click **"Save"**

> This prevents Vercel from auto-deploying. GitHub Actions will control all deployments.

### Step 3: Get Vercel Credentials

#### 3.1 Get VERCEL_TOKEN

1. Go to [Vercel Account Settings → Tokens](https://vercel.com/account/tokens)
2. Click **"Create Token"**
3. Settings:
   - **Token Name**: `GitHub Actions CI/CD`
   - **Scope**: Select your organization
   - **Expiration**: 1 year (or longer)
4. Click **"Create Token"**
5. **COPY THE TOKEN** (you won't see it again!)
6. Save it temporarily - format: `vercel_abc123...`

#### 3.2 Get VERCEL_ORG_ID

1. In your Vercel project, go to **Settings** → **General**
2. Scroll down to **"Project ID"** section
3. You'll see two IDs:
   - **Team ID** or **Organization ID** - This is your `VERCEL_ORG_ID`
4. Click the copy icon next to it
5. Save it temporarily - format: `team_abc123...` or `prj_abc123...`

#### 3.3 Get VERCEL_PROJECT_ID

1. Same page as above (Settings → General)
2. Copy the **"Project ID"**
3. Save it temporarily - format: `prj_xyz789...`

---

## Part 2: GitHub Secrets Setup

### Step 4: Add GitHub Repository Secrets

1. Go to your GitHub repository: `https://github.com/twr-engineering/twr-mls`
2. Click **Settings** (repository settings, not your account)
3. In left sidebar, click **Secrets and variables** → **Actions**
4. Click **"New repository secret"** for each secret below

#### Secret 1: VERCEL_TOKEN
```
Name: VERCEL_TOKEN
Value: [Paste the token from Step 3.1]
Example: vercel_abc123def456ghi789...
```

#### Secret 2: VERCEL_ORG_ID
```
Name: VERCEL_ORG_ID
Value: [Paste the ID from Step 3.2]
Example: team_abc123... or prj_abc123...
```

#### Secret 3: VERCEL_PROJECT_ID
```
Name: VERCEL_PROJECT_ID
Value: [Paste the ID from Step 3.3]
Example: prj_xyz789...
```

#### Secret 4: TEST_DATABASE_URL

This is for running tests in GitHub Actions.

**Option A: Use a separate test database (Recommended)**
```
Name: TEST_DATABASE_URL
Value: postgresql://user:password@host:5432/twr_mls_test
Example: postgresql://postgres:mypass@db.example.com:5432/twr_mls_test
```

**Option B: Use the same database as development (Not recommended for production)**
```
Name: TEST_DATABASE_URL
Value: [Same as your development DATABASE_URL]
```

> **Note**: Tests will run migrations, so use a separate database if possible.

#### Secret 5: TEST_PAYLOAD_SECRET

This is for Payload CMS during tests. Can be any random 32+ character string.

```
Name: TEST_PAYLOAD_SECRET
Value: [Generate a random string, min 32 characters]
Example: test_secret_abc123def456ghi789jkl012mno345pqr678
```

**Generate a random secret:**
```bash
# On Mac/Linux
openssl rand -base64 32

# Or Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 5: Verify GitHub Secrets

After adding all 5 secrets, you should see:

```
✓ VERCEL_TOKEN
✓ VERCEL_ORG_ID
✓ VERCEL_PROJECT_ID
✓ TEST_DATABASE_URL
✓ TEST_PAYLOAD_SECRET
```

---

## Part 3: Vercel Environment Variables

### Step 6: Add Production Environment Variables

1. Go to Vercel project → **Settings** → **Environment Variables**
2. Add the following variables:

#### Variable 1: DATABASE_URL (Production)
```
Key: DATABASE_URL
Value: [Your production PostgreSQL connection string]
Example: postgresql://user:pass@prod-db.example.com:5432/twr_mls
Environment: Production, Preview
```

#### Variable 2: PAYLOAD_SECRET (Production)
```
Key: PAYLOAD_SECRET
Value: [Generate a strong 32+ character secret]
Environment: Production, Preview
```

**Generate:**
```bash
openssl rand -base64 32
```

#### Variable 3: NODE_ENV
```
Key: NODE_ENV
Value: production
Environment: Production, Preview
```

### Step 7: Add Preview/Staging Environment Variables (Optional)

If you want separate staging database:

```
Key: DATABASE_URL
Value: [Your staging PostgreSQL connection string]
Environment: Preview only
```

> If you don't add separate Preview variables, it will use the Production values.

---

## Part 4: Verification Checklist

### ✅ Vercel Setup Complete
- [ ] Vercel project created and linked to GitHub
- [ ] Auto-deploy disabled in Vercel Git settings
- [ ] Got VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID

### ✅ GitHub Secrets Complete
- [ ] VERCEL_TOKEN added
- [ ] VERCEL_ORG_ID added
- [ ] VERCEL_PROJECT_ID added
- [ ] TEST_DATABASE_URL added
- [ ] TEST_PAYLOAD_SECRET added

### ✅ Vercel Environment Variables Complete
- [ ] DATABASE_URL added (Production & Preview)
- [ ] PAYLOAD_SECRET added (Production & Preview)
- [ ] NODE_ENV=production added (Production & Preview)

---

## Part 5: Test the Setup

### Step 8: Push the CI/CD Branch
```bash
git push origin misc/setup-ci-cd
```

### Step 9: Create Pull Request
1. Go to GitHub: `https://github.com/twr-engineering/twr-mls/pulls`
2. Click **"New pull request"**
3. Select: `misc/setup-ci-cd` → `main`
4. Click **"Create pull request"**

### Step 10: Watch the Checks Run
1. The PR will trigger **"PR Quality Checks"** workflow
2. Go to **"Actions"** tab to watch it run
3. Should see:
   - ✅ Type check
   - ✅ Lint
   - ✅ Integration tests
   - ✅ E2E tests
   - ✅ Build

### Step 11: Merge and Test Preview Deployment
1. If all checks pass, merge the PR
2. Go to **"Actions"** tab
3. Watch **"Deploy to Vercel"** workflow run
4. Should deploy to Preview environment
5. Check Vercel dashboard for deployment URL

### Step 12: Test Production Deployment
```bash
# After merging, test production deployment
git checkout main
git pull
pnpm release:patch
```

Watch GitHub Actions deploy to production!

---

## Troubleshooting

### Error: "VERCEL_TOKEN is invalid"
- Regenerate token at https://vercel.com/account/tokens
- Make sure to copy the entire token
- Update GitHub secret with new token

### Error: "Project not found"
- Check VERCEL_ORG_ID matches your organization
- Check VERCEL_PROJECT_ID matches your project
- Make sure IDs don't have extra spaces

### Error: "Database connection failed"
- Check DATABASE_URL format is correct
- Test connection locally first
- Ensure database allows connections from GitHub Actions IPs
- For GitHub-hosted runners, database must be publicly accessible or use VPN

### Error: "Tests failing"
- Check TEST_DATABASE_URL is accessible
- Make sure test database exists
- Run tests locally first: `pnpm test`

### Error: "Vercel deployment failed"
- Check Vercel deployment logs
- Verify environment variables are set in Vercel
- Test build locally: `pnpm build`

---

## Security Best Practices

1. **Never commit secrets to git**
   - All secrets are in GitHub/Vercel, not in code
   - `.env` is in `.gitignore`

2. **Rotate secrets regularly**
   - Change PAYLOAD_SECRET every 6-12 months
   - Regenerate VERCEL_TOKEN if compromised

3. **Use separate databases**
   - Production database
   - Preview/staging database
   - Test database (for CI)

4. **Limit token scope**
   - VERCEL_TOKEN should only have access to this project
   - Don't use personal tokens for team projects

5. **Monitor access**
   - Review Vercel deployment logs
   - Check GitHub Actions logs
   - Monitor database connections

---

## Quick Reference

### Where Things Are:
- **GitHub Secrets**: Repository → Settings → Secrets and variables → Actions
- **Vercel Env Vars**: Vercel Project → Settings → Environment Variables
- **Vercel Tokens**: https://vercel.com/account/tokens
- **GitHub Actions**: Repository → Actions tab

### What Goes Where:
| Secret/Variable | GitHub Secrets | Vercel Env Vars |
|----------------|----------------|-----------------|
| VERCEL_TOKEN | ✅ | ❌ |
| VERCEL_ORG_ID | ✅ | ❌ |
| VERCEL_PROJECT_ID | ✅ | ❌ |
| TEST_DATABASE_URL | ✅ | ❌ |
| TEST_PAYLOAD_SECRET | ✅ | ❌ |
| DATABASE_URL | ❌ | ✅ |
| PAYLOAD_SECRET | ❌ | ✅ |
| NODE_ENV | ❌ | ✅ |

---

## Need Help?

- Review this guide: `.github/SECRETS_SETUP_GUIDE.md`
- Check setup checklist: `.github/SETUP_CHECKLIST.md`
- See deployment guide: `DEPLOYMENT.md`
- Check workflow files: `.github/workflows/`
