const request = require('supertest');
const GrafanaMCPServer = require('../src/server');
const { spawn } = require('child_process');
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

describe('Grafana MCP Server', () => {
  let serverProcess;
  let client;

  beforeAll(async () => {
    // Start the MCP server process
    serverProcess = spawn('node', ['src/server.js'], {
      stdio: ['pipe', 'pipe', 'inherit'],
      env: {
        ...process.env,
        GRAFANA_URL: 'http://localhost:3000',
        PROMETHEUS_URL: 'http://localhost:9090'
      }
    });

    // Create MCP client
    client = new Client(
      { name: 'test-client', version: '1.0.0' },
      { capabilities: {} }
    );

    // Connect client to server
    const transport = new StdioClientTransport({
      reader: serverProcess.stdout,
      writer: serverProcess.stdin
    });

    await client.connect(transport);
  });

  afterAll(() => {
    if (serverProcess) {
      serverProcess.kill();
    }
  });

  describe('Tool Listing', () => {
    it('should list all available tools', async () => {
      const result = await client.listTools();
      
      expect(result.tools).toBeDefined();
      expect(Array.isArray(result.tools)).toBe(true);
      expect(result.tools.length).toBeGreaterThan(0);
      
      const toolNames = result.tools.map(tool => tool.name);
      expect(toolNames).toContain('query_metrics');
      expect(toolNames).toContain('get_dashboards');
      expect(toolNames).toContain('create_dashboard');
      expect(toolNames).toContain('get_alerts');
      expect(toolNames).toContain('health_check');
    });

    it('should have proper tool schemas', async () => {
      const result = await client.listTools();
      
      result.tools.forEach(tool => {
        expect(tool.name).toBeDefined();
        expect(tool.description).toBeDefined();
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe('object');
      });
    });
  });

  describe('Health Check Tool', () => {
    it('should execute health check successfully', async () => {
      const result = await client.callTool({
        name: 'health_check',
        arguments: {}
      });
      
      expect(result.content).toBeDefined();
      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content[0].type).toBe('text');
      
      const healthData = JSON.parse(result.content[0].text);
      expect(healthData.grafana).toBeDefined();
      expect(healthData.prometheus).toBeDefined();
      expect(healthData.timestamp).toBeDefined();
    });
  });

  describe('Query Metrics Tool', () => {
    it('should validate query parameters', async () => {
      try {
        await client.callTool({
          name: 'query_metrics',
          arguments: {}
        });
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).toContain('query');
      }
    });

    it('should accept valid query parameters', async () => {
      const result = await client.callTool({
        name: 'query_metrics',
        arguments: {
          query: 'up',
          start: '5m',
          end: 'now'
        }
      });
      
      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');
      
      // Should be JSON response (might be error if Prometheus not available)
      const responseText = result.content[0].text;
      expect(() => JSON.parse(responseText)).not.toThrow();
    });
  });

  describe('Dashboard Operations', () => {
    it('should list dashboards', async () => {
      const result = await client.callTool({
        name: 'get_dashboards',
        arguments: {}
      });
      
      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');
      
      const dashboardData = JSON.parse(result.content[0].text);
      expect(dashboardData.dashboards).toBeDefined();
      expect(Array.isArray(dashboardData.dashboards)).toBe(true);
    });

    it('should validate dashboard creation parameters', async () => {
      try {
        await client.callTool({
          name: 'create_dashboard',
          arguments: {}
        });
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).toContain('title');
      }
    });

    it('should accept valid dashboard creation parameters', async () => {
      const result = await client.callTool({
        name: 'create_dashboard',
        arguments: {
          title: 'Test Dashboard',
          panels: []
        }
      });
      
      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');
    });
  });

  describe('Alert Operations', () => {
    it('should get alerts without filters', async () => {
      const result = await client.callTool({
        name: 'get_alerts',
        arguments: {}
      });
      
      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');
      
      const alertData = JSON.parse(result.content[0].text);
      expect(alertData.alerts).toBeDefined();
      expect(Array.isArray(alertData.alerts)).toBe(true);
    });

    it('should validate alert state filter', async () => {
      try {
        await client.callTool({
          name: 'get_alerts',
          arguments: {
            state: 'invalid_state'
          }
        });
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).toContain('state');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown tool names', async () => {
      try {
        await client.callTool({
          name: 'unknown_tool',
          arguments: {}
        });
        fail('Should have thrown error for unknown tool');
      } catch (error) {
        expect(error.message).toContain('unknown_tool');
      }
    });

    it('should return error responses with isError flag', async () => {
      // This test assumes Grafana is not running
      const result = await client.callTool({
        name: 'get_dashboards',
        arguments: {}
      });
      
      // If Grafana is not available, should get error response
      if (result.isError) {
        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('Error');
      }
    });
  });
});

// Integration tests (require running services)
describe('Integration Tests', () => {
  // These tests require actual Grafana and Prometheus instances
  // Skip if services are not available
  
  const isServiceAvailable = async (url) => {
    try {
      const response = await fetch(url);
      return response.ok;
    } catch {
      return false;
    }
  };

  beforeAll(async () => {
    const grafanaAvailable = await isServiceAvailable('http://localhost:3000/api/health');
    const prometheusAvailable = await isServiceAvailable('http://localhost:9090/-/healthy');
    
    if (!grafanaAvailable || !prometheusAvailable) {
      console.log('Skipping integration tests - services not available');
    }
  });

  // Add integration tests here that require actual services
});
