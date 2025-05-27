/**
 * Example MCP Client for testing Grafana MCP Server
 * This demonstrates how to interact with the MCP server
 */

const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');
const { spawn } = require('child_process');

class GrafanaMCPClient {
  constructor() {
    this.client = new Client(
      {
        name: 'grafana-mcp-client',
        version: '1.0.0'
      },
      {
        capabilities: {}
      }
    );
  }

  async connect() {
    // Spawn the MCP server process
    const serverProcess = spawn('node', ['../src/server.js'], {
      stdio: ['pipe', 'pipe', 'inherit']
    });

    // Create transport
    const transport = new StdioClientTransport({
      reader: serverProcess.stdout,
      writer: serverProcess.stdin
    });

    // Connect client
    await this.client.connect(transport);
    console.log('Connected to Grafana MCP Server');

    return serverProcess;
  }

  async listTools() {
    const result = await this.client.listTools();
    console.log('Available tools:', JSON.stringify(result.tools, null, 2));
    return result.tools;
  }

  async queryMetrics(query, start = '1h', end = 'now') {
    const result = await this.client.callTool({
      name: 'query_metrics',
      arguments: { query, start, end }
    });
    
    console.log('Metrics query result:', JSON.stringify(result, null, 2));
    return result;
  }

  async getDashboards(search = '') {
    const result = await this.client.callTool({
      name: 'get_dashboards',
      arguments: { search }
    });
    
    console.log('Dashboards:', JSON.stringify(result, null, 2));
    return result;
  }

  async createDashboard(title, panels = []) {
    const result = await this.client.callTool({
      name: 'create_dashboard',
      arguments: { title, panels }
    });
    
    console.log('Dashboard creation result:', JSON.stringify(result, null, 2));
    return result;
  }

  async getAlerts(state = null) {
    const args = state ? { state } : {};
    const result = await this.client.callTool({
      name: 'get_alerts',
      arguments: args
    });
    
    console.log('Alerts:', JSON.stringify(result, null, 2));
    return result;
  }

  async healthCheck() {
    const result = await this.client.callTool({
      name: 'health_check',
      arguments: {}
    });
    
    console.log('Health check:', JSON.stringify(result, null, 2));
    return result;
  }
}

// Example usage
async function runExamples() {
  const client = new GrafanaMCPClient();
  
  try {
    const serverProcess = await client.connect();
    
    // List available tools
    await client.listTools();
    
    // Health check
    await client.healthCheck();
    
    // Query some basic metrics
    await client.queryMetrics('up');
    
    // Get dashboards
    await client.getDashboards();
    
    // Get alerts
    await client.getAlerts();
    
    // Clean up
    serverProcess.kill();
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runExamples();
}

module.exports = GrafanaMCPClient;
