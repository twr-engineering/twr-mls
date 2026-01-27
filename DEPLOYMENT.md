# Deployment Guide

This document explains the CI/CD setup for deploying the TWR MLS application to Vercel.

## Deployment Strategy

- **Preview (Staging)**: Automatic deployment when commits are pushed to `main` branch
- **Production**: Manual deployment triggered by creating release tags (e.g., `v1.0.0`)

All deployments only proceed after passing:
- TypeScript type checking
- ESLint checks
- Integration tests (Vitest)
- E2E tests (Playwright)

## Prerequisites

### 1. Vercel Project Setup

1. Create a new Vercel project linked to your GitHub repository
2. In Vercel dashboard, go to **Settings > Git**:
   - Disable "Automatically build and deploy commits pushed to the production branch"
   - This allows GitHub Actions to control deployments

### 2. Required GitHub Secrets

Add these secrets in **GitHub Repository Settings > Secrets and variables > Actions**:

#### Vercel Secrets
- `VERCEL_TOKEN`: Personal access token from Vercel
  - Create at: https://vercel.com/account/tokens
- `VERCEL_ORG_ID`: Your Vercel organization ID
  - Find in: Vercel project settings > General
- `VERCEL_PROJECT_ID`: Your Vercel project ID
  - Find in: Vercel project settings > General

#### Application Secrets
- `TEST_DATABASE_URL`: PostgreSQL connection string for CI tests
- `TEST_PAYLOAD_SECRET`: Payload CMS secret for CI tests

#### Configure Vercel Environment Variables

In Vercel dashboard, add these environment variables:

**Production & Preview:**
- `DATABASE_URL`: PostgreSQL connection string
- `PAYLOAD_SECRET`: Payload CMS secret key
- `NODE_ENV`: `production`

## Deployment Workflows

### Preview Deployment (Staging)

Triggers on:
- Pull request merged to `main`
- Direct commit pushed to `main`

Process:
1. Run quality checks (type check, lint, tests)
2. Build project
3. Deploy to Vercel preview environment
4. Comment PR with preview URL (if applicable)

```bash
# Preview URL format
https://twr-mls-preview-<hash>.vercel.app
```

### Production Deployment

Triggers on:
- Creating a release tag (format: `v*.*.*`)

Process:
1. Run quality checks (type check, lint, tests)
2. Build project
3. Deploy to Vercel production environment
4. Add deployment notification to commit

#### Creating a Production Release

```bash
# Create and push a version tag
git tag v1.0.0
git push origin v1.0.0

# Or create a release through GitHub UI
# Repository > Releases > Create a new release
```

## Pull Request Checks

Every pull request automatically runs:
- TypeScript type checking
- ESLint linting
- Integration tests
- E2E tests
- Production build verification

PRs must pass all checks before merging.

## Local Testing

Before pushing changes, test locally:

```bash
# Type check
npx tsc --noEmit

# Lint
pnpm lint

# Run tests
pnpm test

# Build
pnpm build
```

## Troubleshooting

### Deployment Fails

1. Check GitHub Actions logs:
   - Repository > Actions tab
   - Click on failed workflow

2. Common issues:
   - Missing environment variables in Vercel
   - Database connection issues
   - Build errors (check type errors)
   - Test failures

### Vercel CLI Commands

```bash
# Install Vercel CLI globally
pnpm add -g vercel

# Login
vercel login

# Link project
vercel link

# Pull environment variables
vercel env pull

# Deploy manually (testing)
vercel --prod  # Production
vercel         # Preview
```

## Rollback

If a production deployment has issues:

```bash
# In Vercel dashboard
1. Go to Deployments
2. Find the last working deployment
3. Click "..." menu > Promote to Production

# Or via CLI
vercel rollback [deployment-url] --token=$VERCEL_TOKEN
```

## Monitoring

- **Vercel Dashboard**: Monitor deployment status, logs, and analytics
- **GitHub Actions**: Track CI/CD pipeline runs
- **Vercel Logs**: Real-time application logs via `vercel logs`

## Best Practices

1. **Never push directly to main** - Always use pull requests
2. **Test locally first** - Run all checks before pushing
3. **Use semantic versioning** - Tag releases as `v1.0.0`, `v1.0.1`, etc.
4. **Monitor deployments** - Check Vercel dashboard after deployment
5. **Keep secrets secure** - Never commit secrets to repository
