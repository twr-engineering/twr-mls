#!/bin/bash

# Release Creation Script
# Usage: ./scripts/create-release.sh [major|minor|patch]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if on main branch
current_branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$current_branch" != "main" ]; then
  echo -e "${RED}Error: You must be on the main branch to create a release${NC}"
  exit 1
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
  echo -e "${RED}Error: You have uncommitted changes. Please commit or stash them first.${NC}"
  exit 1
fi

# Pull latest changes
echo -e "${YELLOW}Pulling latest changes from origin/main...${NC}"
git pull origin main

# Get current version from package.json
current_version=$(node -p "require('./package.json').version")
echo -e "Current version: ${GREEN}v${current_version}${NC}"

# Parse version parts
IFS='.' read -r major minor patch <<< "$current_version"

# Determine new version based on argument
bump_type=${1:-patch}
case $bump_type in
  major)
    new_version="$((major + 1)).0.0"
    ;;
  minor)
    new_version="${major}.$((minor + 1)).0"
    ;;
  patch)
    new_version="${major}.${minor}.$((patch + 1))"
    ;;
  *)
    echo -e "${RED}Error: Invalid bump type. Use 'major', 'minor', or 'patch'${NC}"
    exit 1
    ;;
esac

echo -e "New version: ${GREEN}v${new_version}${NC}"

# Confirm with user
read -p "Create release v${new_version}? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}Release cancelled${NC}"
  exit 0
fi

# Update package.json version
echo -e "${YELLOW}Updating package.json...${NC}"
node -e "const pkg = require('./package.json'); pkg.version = '$new_version'; require('fs').writeFileSync('./package.json', JSON.stringify(pkg, null, 2) + '\n');"

# Run quality checks
echo -e "${YELLOW}Running quality checks...${NC}"
pnpm lint || { echo -e "${RED}Lint failed${NC}"; exit 1; }

echo -e "${YELLOW}Running type check...${NC}"
npx tsc --noEmit || { echo -e "${RED}Type check failed${NC}"; exit 1; }

echo -e "${YELLOW}Running tests...${NC}"
pnpm test || { echo -e "${RED}Tests failed${NC}"; exit 1; }

# Commit version bump
echo -e "${YELLOW}Committing version bump...${NC}"
git add package.json
git commit -m "chore: bump version to v${new_version}"

# Create and push tag
echo -e "${YELLOW}Creating and pushing tag v${new_version}...${NC}"
git tag -a "v${new_version}" -m "Release v${new_version}"
git push origin main
git push origin "v${new_version}"

echo -e "${GREEN}✓ Release v${new_version} created successfully!${NC}"
echo -e "${YELLOW}Monitor the deployment at:${NC} https://github.com/twr-engineering/twr-mls/actions"
