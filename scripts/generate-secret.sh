#!/bin/bash

# Generate a secure secret for Better Auth
# Usage: ./scripts/generate-secret.sh

SECRET=$(openssl rand -base64 32)

echo "Generated BETTER_AUTH_SECRET:"
echo ""
echo "  $SECRET"
echo ""
echo "Add this to your packages/infra.auth/.env file:"
echo ""
echo "  BETTER_AUTH_SECRET=$SECRET"
echo ""
