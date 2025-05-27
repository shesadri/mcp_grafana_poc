#!/bin/bash

# Demo script for Grafana MCP POC
# This script demonstrates the capabilities of the MCP server

set -e

echo "🎬 Grafana MCP Server Demo"
echo "================================"
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required for this demo"
    exit 1
fi

# Check if services are running
echo "🔍 Checking services..."
if ! curl -s -f "http://localhost:3000/api/health" > /dev/null; then
    echo "❌ Grafana is not running. Please start with: docker-compose up -d"
    exit 1
fi

if ! curl -s -f "http://localhost:9090/-/healthy" > /dev/null; then
    echo "❌ Prometheus is not running. Please start with: docker-compose up -d"
    exit 1
fi

echo "✅ Services are running"
echo ""

# Function to run MCP command and show result
run_mcp_demo() {
    local title="$1"
    local script="$2"
    
    echo "📋 Demo: $title"
    echo "$script" | node -e "
        const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
        const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');
        const { spawn } = require('child_process');
        
        async function runDemo() {
            const serverProcess = spawn('node', ['src/server.js'], {
                stdio: ['pipe', 'pipe', 'inherit'],
                env: { ...process.env }
            });
            
            const client = new Client(
                { name: 'demo-client', version: '1.0.0' },
                { capabilities: {} }
            );
            
            const transport = new StdioClientTransport({
                reader: serverProcess.stdout,
                writer: serverProcess.stdin
            });
            
            try {
                await client.connect(transport);
                $(echo "$script")
                serverProcess.kill();
            } catch (error) {
                console.error('Demo error:', error.message);
                serverProcess.kill();
            }
        }
        
        runDemo();
    "
    echo ""
    sleep 2
}

# Demo 1: Health Check
echo "🏥 Demo 1: Health Check"
echo "This checks the health of Grafana and Prometheus services"
echo ""
node -e "
const { spawn } = require('child_process');
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

async function demo() {
    const serverProcess = spawn('node', ['src/server.js'], {
        stdio: ['pipe', 'pipe', 'inherit']
    });
    
    const client = new Client(
        { name: 'demo-client', version: '1.0.0' },
        { capabilities: {} }
    );
    
    const transport = new StdioClientTransport({
        reader: serverProcess.stdout,
        writer: serverProcess.stdin
    });
    
    try {
        await client.connect(transport);
        
        const result = await client.callTool({
            name: 'health_check',
            arguments: {}
        });
        
        console.log('Health Check Result:');
        console.log(result.content[0].text);
        
        serverProcess.kill();
    } catch (error) {
        console.error('Error:', error.message);
        serverProcess.kill();
    }
}

demo();
"

echo ""
echo "⏳ Waiting before next demo..."
sleep 3

# Demo 2: List Tools
echo "🛠️  Demo 2: Available Tools"
echo "This shows all available MCP tools"
echo ""
node -e "
const { spawn } = require('child_process');
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

async function demo() {
    const serverProcess = spawn('node', ['src/server.js'], {
        stdio: ['pipe', 'pipe', 'inherit']
    });
    
    const client = new Client(
        { name: 'demo-client', version: '1.0.0' },
        { capabilities: {} }
    );
    
    const transport = new StdioClientTransport({
        reader: serverProcess.stdout,
        writer: serverProcess.stdin
    });
    
    try {
        await client.connect(transport);
        
        const result = await client.listTools();
        
        console.log('Available Tools:');
        result.tools.forEach(tool => {
            console.log('- ' + tool.name + ': ' + tool.description);
        });
        
        serverProcess.kill();
    } catch (error) {
        console.error('Error:', error.message);
        serverProcess.kill();
    }
}

demo();
"

echo ""
echo "⏳ Waiting before next demo..."
sleep 3

# Demo 3: Query Metrics
echo "📊 Demo 3: Query Metrics"
echo "This demonstrates querying Prometheus metrics"
echo ""
node -e "
const { spawn } = require('child_process');
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

async function demo() {
    const serverProcess = spawn('node', ['src/server.js'], {
        stdio: ['pipe', 'pipe', 'inherit']
    });
    
    const client = new Client(
        { name: 'demo-client', version: '1.0.0' },
        { capabilities: {} }
    );
    
    const transport = new StdioClientTransport({
        reader: serverProcess.stdout,
        writer: serverProcess.stdin
    });
    
    try {
        await client.connect(transport);
        
        const result = await client.callTool({
            name: 'query_metrics',
            arguments: {
                query: 'up',
                start: '5m',
                end: 'now'
            }
        });
        
        console.log('Metrics Query Result (up):');
        const data = JSON.parse(result.content[0].text);
        if (data.data && data.data.result) {
            console.log('Found', data.data.result.length, 'metrics');
            data.data.result.forEach(metric => {
                console.log('- ' + JSON.stringify(metric.metric) + ' = ' + metric.value[1]);
            });
        } else {
            console.log('No metrics data received');
        }
        
        serverProcess.kill();
    } catch (error) {
        console.error('Error:', error.message);
        serverProcess.kill();
    }
}

demo();
"

echo ""
echo "🎉 Demo completed!"
echo ""
echo "What you just saw:"
echo "  ✅ Health checking of monitoring services"
echo "  ✅ Listing available MCP tools"
echo "  ✅ Querying Prometheus metrics via MCP"
echo ""
echo "Next steps:"
echo "  📖 Read docs/getting-started.md for detailed usage"
echo "  📋 Check examples/sample-queries.md for more examples"
echo "  🔧 Explore the source code in src/"
echo "  🌐 Open Grafana at http://localhost:3000"
echo ""
