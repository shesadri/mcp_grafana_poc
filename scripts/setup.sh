#!/bin/bash

# Grafana MCP POC Setup Script
# This script helps set up the development environment

set -e

echo "🚀 Setting up Grafana MCP POC..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if Node.js is installed (for local development)
if ! command -v node &> /dev/null; then
    echo "⚠️  Node.js is not installed. You'll need it for local development."
    echo "   You can still use Docker for the complete setup."
else
    NODE_VERSION=$(node --version)
    echo "✅ Node.js $NODE_VERSION detected"
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p data
mkdir -p config/grafana/dashboards

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ Created .env file. You may want to customize it."
else
    echo "✅ .env file already exists"
fi

# Install Node.js dependencies if Node is available
if command -v node &> /dev/null; then
    echo "📦 Installing Node.js dependencies..."
    npm install
    echo "✅ Dependencies installed"
fi

# Pull Docker images
echo "🐳 Pulling Docker images..."
docker-compose pull

# Build custom images
echo "🔨 Building custom MCP server image..."
docker-compose build mcp-server

# Create docker volumes
echo "💾 Creating Docker volumes..."
docker volume create mcp_grafana_poc_grafana_data || true
docker volume create mcp_grafana_poc_prometheus_data || true

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Quick start commands:"
echo "  Start all services:    docker-compose up -d"
echo "  View logs:            docker-compose logs -f"
echo "  Stop services:        docker-compose down"
echo ""
echo "Service URLs (after starting):"
echo "  Grafana:              http://localhost:3000 (admin/admin)"
echo "  Prometheus:           http://localhost:9090"
echo "  Sample App:           http://localhost:8081"
echo ""
echo "For local development:"
echo "  npm start             # Start MCP server locally"
echo "  npm run dev           # Start with auto-reload"
echo "  npm test              # Run tests"
echo ""
echo "📖 Check docs/getting-started.md for detailed instructions"
