#!/bin/bash

# Setup Test Database
# This script initializes the test database with the latest schema

set -e

echo "Setting up test database..."

# Load test database credentials (filter out NODE_OPTIONS)
export DATABASE_URL=$(grep '^DATABASE_URL=' test.env | cut -d '=' -f2-)
export PAYLOAD_SECRET=$(grep '^PAYLOAD_SECRET=' test.env | cut -d '=' -f2-)
export S3_ENDPOINT=$(grep '^S3_ENDPOINT=' test.env | cut -d '=' -f2-)
export S3_REGION=$(grep '^S3_REGION=' test.env | cut -d '=' -f2-)
export S3_BUCKET=$(grep '^S3_BUCKET=' test.env | cut -d '=' -f2-)
export S3_ACCESS_KEY_ID=$(grep '^S3_ACCESS_KEY_ID=' test.env | cut -d '=' -f2-)
export S3_SECRET_ACCESS_KEY=$(grep '^S3_SECRET_ACCESS_KEY=' test.env | cut -d '=' -f2-)

echo "Running migrations on test database: ${DATABASE_URL##*/}"

# Run Payload migrations
pnpm migrate

echo "✅ Test database setup complete!"
echo "You can now run: pnpm test:int"
