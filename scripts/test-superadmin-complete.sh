#!/bin/bash

echo "🚀 Starting complete superadmin API test..."
echo "========================================="
echo ""

# Kill any existing Next.js server
echo "🔄 Cleaning up any existing servers..."
pkill -f "next dev" 2>/dev/null || true
sleep 2

# Start the dev server in background
echo "🚀 Starting Next.js development server..."
npm run dev > /tmp/next-server.log 2>&1 &
SERVER_PID=$!

# Wait for server to be ready
echo "⏳ Waiting for server to start..."
for i in {1..30}; do
  if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Server is ready!"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "❌ Server failed to start after 30 seconds"
    echo "Server logs:"
    cat /tmp/next-server.log
    kill $SERVER_PID 2>/dev/null
    exit 1
  fi
  sleep 1
done

# Run the test script
echo ""
echo "🧪 Running API tests..."
echo ""
npx tsx scripts/test-superadmin-apis.ts

# Kill the server
echo ""
echo "🛑 Stopping server..."
kill $SERVER_PID 2>/dev/null

echo ""
echo "✅ Test complete!"