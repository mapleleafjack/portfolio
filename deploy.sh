#!/bin/bash

# Build Gatsby site
npm run build

# Sync the public folder to the S3 bucket
aws s3 sync ./public s3://www.jackmusajo.it --delete

# Invalidate CloudFront cache to force refresh
aws cloudfront create-invalidation --distribution-id E2RX6269H5DED1 --paths "/*"