#!/bin/bash

# Run the full system stress test with test environment
echo "🚀 Starting Full System Stress Test"
echo "=================================="
echo ""

# Set environment to test for email mocking
export NODE_ENV=test

# Run the test
node scripts/full-system-stress-test.js