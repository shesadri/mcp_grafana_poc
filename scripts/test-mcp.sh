#!/bin/bash

# Test script for MCP Grafana server
# This script runs various tests against the MCP server

set -e

echo "🧪 Testing Grafana MCP Server..."

# Check if services are running
echo "🔍 Checking if services are running..."

# Function to check if a service is responding
check_service() {
    local url=$1
    local name=$2
    local max_attempts=30
    local attempt=1
    
    echo "Checking $name at $url..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$url" > /dev/null 2>&1; then
            echo "✅ $name is running"
            return 0
        fi
        
        echo "⏳ Waiting for $name... (attempt $attempt/$max_attempts)"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "❌ $name is not responding after $max_attempts attempts"
    return 1
}

# Check Grafana
check_service "http://localhost:3000/api/health" "Grafana"

# Check Prometheus
check_service "http://localhost:9090/-/healthy" "Prometheus"

# Test Grafana API directly
echo "🔍 Testing Grafana API..."
GRAFANA_RESPONSE=$(curl -s -u admin:admin "http://localhost:3000/api/org")
if echo "$GRAFANA_RESPONSE" | grep -q "id"; then
    echo "✅ Grafana API is accessible"
else
    echo "❌ Grafana API test failed"
    echo "Response: $GRAFANA_RESPONSE"
fi

# Test Prometheus API
echo "🔍 Testing Prometheus API..."
PROM_RESPONSE=$(curl -s "http://localhost:9090/api/v1/query?query=up")
if echo "$PROM_RESPONSE" | grep -q "success"; then
    echo "✅ Prometheus API is accessible"
else
    echo "❌ Prometheus API test failed"
    echo "Response: $PROM_RESPONSE"
fi

# Run Node.js tests if available
if [ -f "package.json" ] && command -v npm &> /dev/null; then
    echo "🧪 Running Node.js tests..."
    npm test
else
    echo "⚠️  Skipping Node.js tests (npm or package.json not found)"
fi

# Test MCP server health (if running in container)
echo "🔍 Testing MCP server..."
if docker-compose ps mcp-server | grep -q "Up"; then
    echo "✅ MCP server container is running"
    
    # Check MCP server logs for any errors
    echo "📋 Recent MCP server logs:"
    docker-compose logs --tail=10 mcp-server
else
    echo "❌ MCP server container is not running"
fi

# Test example client if available
if [ -f "examples/mcp-client.js" ] && command -v node &> /dev/null; then
    echo "🧪 Testing example MCP client..."
    cd examples
    timeout 30s node mcp-client.js || echo "⚠️  MCP client test timed out or failed"
    cd ..
fi

echo ""
echo "🏁 Test suite completed!"
echo ""
echo "If any tests failed, check:"
echo "  1. All services are running: docker-compose ps"
echo "  2. Service logs: docker-compose logs [service-name]"
echo "  3. Network connectivity between containers"
echo "  4. Environment variables in .env file"
