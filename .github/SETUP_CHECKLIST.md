# CI/CD Setup Checklist

Follow these steps to complete the Vercel + GitHub Actions CI/CD setup.

## ✅ Step 1: Vercel Project Setup

### 1.1 Create Vercel Project
- [ ] Go to [Vercel Dashboard](https://vercel.com/dashboard)
- [ ] Click "Add New" → "Project"
- [ ] Import your GitHub repository: `twr-engineering/twr-mls`
- [ ] Configure project:
  - Framework Preset: **Next.js**
  - Root Directory: `./` (leave as default)
  - Build Command: `pnpm build`
  - Output Directory: `.next`
  - Install Command: `pnpm install`

### 1.2 Configure Git Settings
- [ ] In Vercel project, go to **Settings** → **Git**
- [ ] **Disable**: "Automatically build and deploy commits pushed to the production branch"
  - This allows GitHub Actions to control deployments

### 1.3 Get Vercel Credentials
- [ ] **VERCEL_TOKEN**: Create at [Vercel Tokens](https://vercel.com/account/tokens)
  - Token name: `GitHub Actions CI/CD`
  - Scope: Full Account
  - Save the token securely

- [ ] **VERCEL_ORG_ID**: Settings → General → "Organization ID"
  - Copy the value

- [ ] **VERCEL_PROJECT_ID**: Project Settings → General → "Project ID"
  - Copy the value

## ✅ Step 2: Configure Environment Variables in Vercel

### 2.1 Production Environment
- [ ] Go to Vercel project → **Settings** → **Environment Variables**
- [ ] Add the following for **Production**:
  ```
  DATABASE_URL = [Your production PostgreSQL connection string]
  PAYLOAD_SECRET = [Your production Payload secret - min 32 chars]
  NODE_ENV = production
  ```

### 2.2 Preview Environment
- [ ] Add the same variables for **Preview**:
  ```
  DATABASE_URL = [Your staging PostgreSQL connection string]
  PAYLOAD_SECRET = [Your staging Payload secret - min 32 chars]
  NODE_ENV = production
  ```

> **Note**: You can use the same database for preview/production initially, but separate databases are recommended for production.

## ✅ Step 3: GitHub Secrets Configuration

### 3.1 Add Repository Secrets
- [ ] Go to GitHub repository → **Settings** → **Secrets and variables** → **Actions**
- [ ] Click "New repository secret" and add:

```
Name: VERCEL_TOKEN
Value: [Token from Step 1.3]

Name: VERCEL_ORG_ID
Value: [ID from Step 1.3]

Name: VERCEL_PROJECT_ID
Value: [ID from Step 1.3]

Name: TEST_DATABASE_URL
Value: [PostgreSQL connection string for CI tests]

Name: TEST_PAYLOAD_SECRET
Value: [Any 32+ character string for tests]
```

### 3.2 Verify Secrets
- [ ] All 5 secrets should be listed in the Secrets page
- [ ] Secret names must match exactly (case-sensitive)

## ✅ Step 4: Test the CI/CD Pipeline

### 4.1 Test PR Checks
- [ ] Create a new branch: `git checkout -b test/ci-cd-setup`
- [ ] Make a small change (e.g., add a comment to README)
- [ ] Commit and push: `git push origin test/ci-cd-setup`
- [ ] Create a Pull Request on GitHub
- [ ] Verify that **PR Quality Checks** workflow runs
- [ ] Check that all checks pass (type check, lint, tests, build)

### 4.2 Test Preview Deployment
- [ ] Merge the test PR to `main`
- [ ] Go to **Actions** tab on GitHub
- [ ] Verify **Deploy to Vercel** workflow runs
- [ ] Check that "Deploy to Preview" job completes
- [ ] Visit the preview URL provided in the workflow logs
- [ ] Verify the site loads correctly

### 4.3 Test Production Deployment
- [ ] Run: `pnpm release:patch`
  - Or manually: `git tag v1.0.1 && git push origin v1.0.1`
- [ ] Go to **Actions** tab on GitHub
- [ ] Verify **Deploy to Vercel** workflow runs
- [ ] Check that "Deploy to Production" job completes
- [ ] Visit your production URL on Vercel
- [ ] Verify the site loads correctly

## ✅ Step 5: Verify Everything Works

### 5.1 Check GitHub Actions
- [ ] Go to repository → **Actions** tab
- [ ] Verify you see:
  - ✅ PR Quality Checks
  - ✅ Deploy to Vercel
  - ✅ Cleanup Preview Deployments

### 5.2 Check Vercel Dashboard
- [ ] Go to [Vercel Dashboard](https://vercel.com/dashboard)
- [ ] Open your project
- [ ] Verify you see:
  - Production deployment (from tag)
  - Preview deployment (from main)

### 5.3 Test the Release Script
- [ ] Run: `pnpm release:patch`
- [ ] Verify it:
  - Runs quality checks
  - Updates package.json version
  - Creates git tag
  - Pushes to GitHub
  - Triggers production deployment

## ✅ Step 6: Team Setup (Optional)

### 6.1 Branch Protection
- [ ] Go to repository → **Settings** → **Branches**
- [ ] Add branch protection rule for `main`:
  - ✅ Require pull request reviews before merging
  - ✅ Require status checks to pass before merging
  - Select: `quality-check`
  - ✅ Require branches to be up to date before merging
  - ✅ Do not allow bypassing the above settings

### 6.2 Team Documentation
- [ ] Share `CI_CD_SETUP.md` with team
- [ ] Share `DEPLOYMENT.md` with team
- [ ] Add deployment process to team wiki/docs

## 📋 Verification Commands

Run these locally to verify setup:

```bash
# Check all files exist
ls -la vercel.json
ls -la scripts/vercel-ignore-build.js
ls -la .github/workflows/deploy.yml
ls -la .github/workflows/pr-check.yml

# Test quality checks locally
pnpm typecheck
pnpm lint
pnpm test
pnpm build

# Test release script (dry run)
git checkout -b test/release-script
bash scripts/create-release.sh patch
```

## 🎉 Success Criteria

Your CI/CD is fully set up when:
- ✅ PRs automatically run quality checks
- ✅ Merging to `main` deploys to preview/staging
- ✅ Creating a version tag deploys to production
- ✅ All deployments only happen after tests pass
- ✅ Team can create releases with `pnpm release:patch`

## 🆘 Troubleshooting

### GitHub Actions failing?
1. Check workflow logs in Actions tab
2. Verify all secrets are set correctly
3. Check that test database is accessible from GitHub Actions

### Vercel deployment failing?
1. Check Vercel deployment logs
2. Verify environment variables are set in Vercel
3. Check that build passes locally with `pnpm build`

### Can't push tags?
1. Ensure you're on `main` branch
2. Check that you have push permissions
3. Verify tag doesn't already exist: `git tag -l`

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Deployment Documentation](https://vercel.com/docs/deployments/overview)
- [Semantic Versioning](https://semver.org/)

---

**Need Help?** Check `DEPLOYMENT.md` or `CI_CD_SETUP.md` for detailed instructions.
