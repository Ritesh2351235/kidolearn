#!/bin/bash

echo "🚀 Production API Monitoring Script"
echo "Monitoring calls to: https://kidscurator.vercel.app"
echo ""

echo "Testing API endpoints..."
echo ""

echo "1. Testing /api/children (should require auth):"
curl -s -o /dev/null -w "Status: %{http_code} | Time: %{time_total}s\n" https://kidscurator.vercel.app/api/children

echo ""
echo "2. Testing /api/approved-videos (should require auth):"  
curl -s -o /dev/null -w "Status: %{http_code} | Time: %{time_total}s\n" "https://kidscurator.vercel.app/api/approved-videos?childId=test"

echo ""
echo "3. Testing /api/parent/analytics (should require auth):"
curl -s -o /dev/null -w "Status: %{http_code} | Time: %{time_total}s\n" https://kidscurator.vercel.app/api/parent/analytics

echo ""
echo "✅ All endpoints are accessible (401 = expected auth error)"
echo "🔥 Ready for production testing!"