#!/usr/bin/env node

/**
 * Vercel Ignore Build Script
 *
 * This script determines whether Vercel should build the project.
 * It runs automatically before each deployment.
 *
 * Exit codes:
 * - 0: Skip build
 * - 1: Proceed with build
 */

const { execSync } = require('child_process')

const VERCEL_ENV = process.env.VERCEL_ENV || 'development'
const VERCEL_GIT_COMMIT_REF = process.env.VERCEL_GIT_COMMIT_REF || ''

console.log('=== Vercel Build Check ===')
console.log('Environment:', VERCEL_ENV)
console.log('Git Ref:', VERCEL_GIT_COMMIT_REF)

try {
  // For production environment: only build if triggered by CI/CD (GitHub Actions)
  // This prevents auto-deployments on main branch
  if (VERCEL_ENV === 'production') {
    console.log('Production environment detected')
    console.log('Production deployments should only happen via GitHub Actions on tagged releases')
    console.log('Skipping auto-deployment')
    process.exit(0)
  }

  // For preview environment: build on main branch
  if (VERCEL_ENV === 'preview') {
    console.log('Preview environment detected')
    console.log('Proceeding with build')
    process.exit(1)
  }

  // For development/other: proceed with build
  console.log('Development environment detected')
  console.log('Proceeding with build')
  process.exit(1)
} catch (error) {
  console.error('Error in build check:', error.message)
  // On error, proceed with build to be safe
  process.exit(1)
}
