# CI/CD Setup Quick Reference

## Overview

This project uses **GitHub Actions** + **Vercel** for automated deployments.

## Workflow Summary

```
┌─────────────────┐
│  Pull Request   │──→ Quality Checks (type check, lint, tests)
└─────────────────┘

┌─────────────────┐
│  Push to main   │──→ Quality Checks ──→ Deploy to Preview (Staging)
└─────────────────┘

┌─────────────────┐
│  Tag v*.*.* │──→ Quality Checks ──→ Deploy to Production
└─────────────────┘
```

## Quick Commands

### Deploy to Preview (Staging)
```bash
git checkout main
git pull
git add .
git commit -m "feat: your changes"
git push origin main
```

### Deploy to Production
```bash
# Create and push a tag
git tag v1.0.0
git push origin v1.0.0

# Or use GitHub Releases UI
```

### Manual Deployment (Local)
```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy preview
vercel

# Deploy production
vercel --prod
```

## Required Secrets

GitHub Secrets (in repository settings):
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `TEST_DATABASE_URL`
- `TEST_PAYLOAD_SECRET`

Vercel Environment Variables (in project settings):
- `DATABASE_URL`
- `PAYLOAD_SECRET`

## GitHub Actions Workflows

### 1. `.github/workflows/pr-check.yml`
- **Trigger**: Pull request opened/updated
- **Actions**: Type check, lint, tests, build
- **Purpose**: Ensure PR quality before merge

### 2. `.github/workflows/deploy.yml`
- **Trigger**: Push to main OR tag creation
- **Actions**:
  - Run all quality checks
  - Deploy to preview (main branch)
  - Deploy to production (tags only)

### 3. `.github/workflows/cleanup-preview.yml`
- **Trigger**: PR closed without merge
- **Actions**: Clean up unused preview deployments

## Vercel Configuration

### `vercel.json`
- Disables auto-deployments
- Uses custom ignore script
- Configures build commands
- Sets security headers

### `scripts/vercel-ignore-build.js`
- Controls when Vercel builds
- Skips production auto-builds
- Allows preview builds on main

## Troubleshooting

### Build Fails
```bash
# Check locally
npx tsc --noEmit  # Type check
pnpm lint         # Lint
pnpm test         # Run tests
pnpm build        # Build
```

### Deployment Fails
1. Check GitHub Actions logs
2. Verify Vercel secrets are set
3. Check Vercel deployment logs

### Tag Already Exists
```bash
# Delete local tag
git tag -d v1.0.0

# Delete remote tag
git push origin :refs/tags/v1.0.0

# Create new tag
git tag v1.0.1
git push origin v1.0.1
```

## Monitoring

- **GitHub Actions**: Repository > Actions tab
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Deployment Logs**: `vercel logs <deployment-url>`

## Best Practices

✅ Always create PR for changes
✅ Wait for CI checks to pass
✅ Test locally before pushing
✅ Use semantic versioning for tags
✅ Review deployment logs after release

❌ Don't push directly to main
❌ Don't skip CI checks
❌ Don't force push to main
❌ Don't reuse tag versions

## Semantic Versioning

```
v1.0.0 = Major.Minor.Patch

Major (1.x.x): Breaking changes
Minor (x.1.x): New features (backwards compatible)
Patch (x.x.1): Bug fixes
```

Examples:
- `v1.0.0` - Initial release
- `v1.0.1` - Bug fix
- `v1.1.0` - New feature
- `v2.0.0` - Breaking change

## Support

For detailed information, see:
- `DEPLOYMENT.md` - Full deployment guide
- `.github/workflows/` - CI/CD workflow files
- `vercel.json` - Vercel configuration
