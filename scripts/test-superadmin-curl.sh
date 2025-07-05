#!/bin/bash

echo "🚀 Testing Superadmin APIs with curl"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://localhost:3000"

# Get password from environment
SUPERADMIN_PASSWORD="${SUPERADMIN_PASSWORD}"

if [ -z "$SUPERADMIN_PASSWORD" ]; then
  echo -e "${RED}❌ SUPERADMIN_PASSWORD not set in environment${NC}"
  exit 1
fi

echo "1. Testing login..."
echo "==================="

# Login and capture the cookie
LOGIN_RESPONSE=$(curl -s -i -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"password\":\"$SUPERADMIN_PASSWORD\",\"loginType\":\"superadmin\"}")

# Extract status code
STATUS_CODE=$(echo "$LOGIN_RESPONSE" | grep "HTTP/" | awk '{print $2}')
echo "Status Code: $STATUS_CODE"

# Extract cookie
COOKIE=$(echo "$LOGIN_RESPONSE" | grep -i "set-cookie:" | cut -d' ' -f2- | cut -d';' -f1)

if [ -n "$COOKIE" ]; then
  echo -e "${GREEN}✅ Login successful! Got cookie.${NC}"
else
  echo -e "${RED}❌ Login failed! No cookie received.${NC}"
  echo "Response:"
  echo "$LOGIN_RESPONSE"
  exit 1
fi

echo ""
echo "2. Testing GET /api/superadmin/health"
echo "====================================="

HEALTH_RESPONSE=$(curl -s -X GET "$BASE_URL/api/superadmin/health" \
  -H "Cookie: $COOKIE" \
  -H "Accept: application/json")

echo "Response:"
echo "$HEALTH_RESPONSE" | jq . 2>/dev/null || echo "$HEALTH_RESPONSE"

echo ""
echo "3. Testing GET /api/superadmin/users"
echo "===================================="

USERS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/superadmin/users" \
  -H "Cookie: $COOKIE" \
  -H "Accept: application/json")

echo "Response:"
echo "$USERS_RESPONSE" | jq . 2>/dev/null || echo "$USERS_RESPONSE"

echo ""
echo "4. Testing GET /api/superadmin/metrics"
echo "======================================"

METRICS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/superadmin/metrics" \
  -H "Cookie: $COOKIE" \
  -H "Accept: application/json")

echo "Response (truncated):"
echo "$METRICS_RESPONSE" | jq . 2>/dev/null | head -30 || echo "$METRICS_RESPONSE" | head -30

echo ""
echo "5. Testing GET /api/superadmin/orchestras"
echo "========================================="

ORCHESTRAS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/superadmin/orchestras" \
  -H "Cookie: $COOKIE" \
  -H "Accept: application/json")

echo "Response:"
echo "$ORCHESTRAS_RESPONSE" | jq . 2>/dev/null || echo "$ORCHESTRAS_RESPONSE"

# Extract first orchestra ID if available
ORCHESTRA_ID=$(echo "$ORCHESTRAS_RESPONSE" | jq -r '.[0].id' 2>/dev/null)

if [ "$ORCHESTRA_ID" != "null" ] && [ -n "$ORCHESTRA_ID" ]; then
  echo ""
  echo "6. Testing PATCH /api/superadmin/orchestras/$ORCHESTRA_ID"
  echo "========================================================"
  
  PATCH_RESPONSE=$(curl -s -X PATCH "$BASE_URL/api/superadmin/orchestras/$ORCHESTRA_ID" \
    -H "Cookie: $COOKIE" \
    -H "Content-Type: application/json" \
    -d '{"status":"inactive"}')
  
  echo "Response:"
  echo "$PATCH_RESPONSE" | jq . 2>/dev/null || echo "$PATCH_RESPONSE"
  
  # Toggle back
  echo ""
  echo "Toggling back to active..."
  PATCH_RESPONSE2=$(curl -s -X PATCH "$BASE_URL/api/superadmin/orchestras/$ORCHESTRA_ID" \
    -H "Cookie: $COOKIE" \
    -H "Content-Type: application/json" \
    -d '{"status":"active"}')
  
  echo "Response:"
  echo "$PATCH_RESPONSE2" | jq . 2>/dev/null || echo "$PATCH_RESPONSE2"
fi

echo ""
echo -e "${GREEN}✅ Test completed!${NC}"