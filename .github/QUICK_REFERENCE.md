# Quick Reference Card

## Common Operations

### Deploy to Preview (Staging)
```bash
git checkout main
git pull
# Make changes
git add .
git commit -m "feat: your changes"
git push origin main
# ✅ Auto-deploys to preview
```

### Deploy to Production
```bash
# Ensure you're on main with latest changes
git checkout main
git pull

# Create release (choose one)
pnpm release:patch  # v1.0.x - Bug fixes
pnpm release:minor  # v1.x.0 - New features
pnpm release:major  # vx.0.0 - Breaking changes

# ✅ Auto-deploys to production
```

### Before Pushing Changes
```bash
pnpm typecheck  # Type check
pnpm lint       # Lint
pnpm test       # Run tests
pnpm build      # Test build

# Or run all at once
pnpm ci:check
```

### Manual Tag Creation (Alternative)
```bash
git tag v1.0.0
git push origin v1.0.0
# ✅ Triggers production deployment
```

### Rollback Production
```bash
# Option 1: Via Vercel Dashboard
# Go to Deployments → Find working version → Promote to Production

# Option 2: Create rollback tag
git tag v1.0.1-rollback v1.0.0
git push origin v1.0.1-rollback
```

### Check Deployment Status
```bash
# GitHub Actions
open https://github.com/twr-engineering/twr-mls/actions

# Vercel Dashboard
open https://vercel.com/dashboard

# Or use Vercel CLI
vercel ls
vercel logs <url>
```

### Fix Failed Deployment
```bash
# 1. Check logs
#    - GitHub Actions: Actions tab
#    - Vercel: Deployment logs

# 2. Fix issue locally
# 3. Run checks
pnpm ci:check

# 4. Push fix
git add .
git commit -m "fix: deployment issue"
git push origin main
```

## Environment Setup

### GitHub Secrets (Required)
```
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
TEST_DATABASE_URL
TEST_PAYLOAD_SECRET
```

### Vercel Environment Variables (Required)
```
Production & Preview:
├── DATABASE_URL
├── PAYLOAD_SECRET
└── NODE_ENV=production
```

## Troubleshooting

### "Tests failing in CI"
```bash
# Run tests locally with same environment
export DATABASE_URL="..."
export PAYLOAD_SECRET="..."
pnpm test
```

### "Build failing"
```bash
# Check type errors
pnpm typecheck

# Check build
pnpm build
```

### "Tag already exists"
```bash
# Delete and recreate
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0
git tag v1.0.1
git push origin v1.0.1
```

### "Deployment not triggered"
```bash
# Check workflows are enabled
# Go to: Settings → Actions → General
# Ensure "Allow all actions and reusable workflows" is selected

# Manually trigger (last resort)
vercel --prod
```

## Branch Protection (Recommended)

```
Settings → Branches → Add rule for 'main':
✅ Require pull request reviews
✅ Require status checks: quality-check
✅ Require branches up to date
✅ Include administrators
```

## Documentation

- `.github/SETUP_CHECKLIST.md` - Initial setup steps
- `DEPLOYMENT.md` - Comprehensive guide
- `CI_CD_SETUP.md` - Detailed workflows
- `.github/workflows/` - Workflow configurations

## Support

- Check workflow logs: GitHub → Actions tab
- Check deployment logs: Vercel → Deployments
- Review documentation files above
