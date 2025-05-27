const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const axios = require('axios');
require('dotenv').config();

// Grafana and Prometheus configuration
const GRAFANA_URL = process.env.GRAFANA_URL || 'http://localhost:3000';
const GRAFANA_API_KEY = process.env.GRAFANA_API_KEY || 'admin';
const PROMETHEUS_URL = process.env.PROMETHEUS_URL || 'http://localhost:9090';

class GrafanaMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'grafana-mcp-server',
        version: '1.0.0'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    this.setupTools();
    this.setupHandlers();
  }

  setupTools() {
    // Define available tools
    this.tools = [
      {
        name: 'query_metrics',
        description: 'Query metrics from Prometheus via Grafana',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'PromQL query to execute'
            },
            start: {
              type: 'string',
              description: 'Start time (ISO 8601 or relative like "1h")'
            },
            end: {
              type: 'string',
              description: 'End time (ISO 8601 or relative like "now")'
            }
          },
          required: ['query']
        }
      },
      {
        name: 'get_dashboards',
        description: 'List all Grafana dashboards',
        inputSchema: {
          type: 'object',
          properties: {
            search: {
              type: 'string',
              description: 'Search term to filter dashboards'
            }
          }
        }
      },
      {
        name: 'create_dashboard',
        description: 'Create a new Grafana dashboard',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Dashboard title'
            },
            panels: {
              type: 'array',
              description: 'Array of panel configurations'
            }
          },
          required: ['title']
        }
      },
      {
        name: 'get_alerts',
        description: 'Get current alerts from Grafana',
        inputSchema: {
          type: 'object',
          properties: {
            state: {
              type: 'string',
              enum: ['alerting', 'ok', 'paused', 'pending'],
              description: 'Filter alerts by state'
            }
          }
        }
      },
      {
        name: 'health_check',
        description: 'Check the health status of Grafana and connected data sources',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      }
    ];
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.tools
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'query_metrics':
            return await this.queryMetrics(args);
          case 'get_dashboards':
            return await this.getDashboards(args);
          case 'create_dashboard':
            return await this.createDashboard(args);
          case 'get_alerts':
            return await this.getAlerts(args);
          case 'health_check':
            return await this.healthCheck(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error executing ${name}: ${error.message}`
          }],
          isError: true
        };
      }
    });
  }

  async queryMetrics(args) {
    const { query, start = '1h', end = 'now' } = args;
    
    try {
      const response = await axios.get(`${PROMETHEUS_URL}/api/v1/query_range`, {
        params: {
          query,
          start: this.parseTimeRange(start),
          end: this.parseTimeRange(end),
          step: '15s'
        }
      });

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(response.data, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Failed to query metrics: ${error.message}`);
    }
  }

  async getDashboards(args) {
    const { search = '' } = args;
    
    try {
      const response = await axios.get(`${GRAFANA_URL}/api/search`, {
        headers: {
          'Authorization': `Bearer ${GRAFANA_API_KEY}`
        },
        params: {
          query: search,
          type: 'dash-db'
        }
      });

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(response.data, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Failed to get dashboards: ${error.message}`);
    }
  }

  async createDashboard(args) {
    const { title, panels = [] } = args;
    
    const dashboard = {
      dashboard: {
        title,
        panels,
        tags: ['mcp-generated'],
        refresh: '30s',
        time: {
          from: 'now-1h',
          to: 'now'
        },
        timepicker: {
          refresh_intervals: ['5s', '10s', '30s', '1m', '5m', '15m', '30m', '1h', '2h', '1d']
        }
      },
      folderId: 0,
      overwrite: false
    };

    try {
      const response = await axios.post(`${GRAFANA_URL}/api/dashboards/db`, dashboard, {
        headers: {
          'Authorization': `Bearer ${GRAFANA_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(response.data, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Failed to create dashboard: ${error.message}`);
    }
  }

  async getAlerts(args) {
    const { state } = args;
    
    try {
      const response = await axios.get(`${GRAFANA_URL}/api/alerts`, {
        headers: {
          'Authorization': `Bearer ${GRAFANA_API_KEY}`
        },
        params: state ? { state } : {}
      });

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(response.data, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Failed to get alerts: ${error.message}`);
    }
  }

  async healthCheck() {
    const health = {
      grafana: { status: 'unknown', url: GRAFANA_URL },
      prometheus: { status: 'unknown', url: PROMETHEUS_URL },
      timestamp: new Date().toISOString()
    };

    try {
      // Check Grafana health
      const grafanaHealth = await axios.get(`${GRAFANA_URL}/api/health`);
      health.grafana.status = grafanaHealth.status === 200 ? 'healthy' : 'unhealthy';
      health.grafana.details = grafanaHealth.data;
    } catch (error) {
      health.grafana.status = 'unhealthy';
      health.grafana.error = error.message;
    }

    try {
      // Check Prometheus health
      const prometheusHealth = await axios.get(`${PROMETHEUS_URL}/-/healthy`);
      health.prometheus.status = prometheusHealth.status === 200 ? 'healthy' : 'unhealthy';
    } catch (error) {
      health.prometheus.status = 'unhealthy';
      health.prometheus.error = error.message;
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(health, null, 2)
      }]
    };
  }

  parseTimeRange(timeStr) {
    if (timeStr === 'now') {
      return Math.floor(Date.now() / 1000);
    }
    
    // Handle relative time (e.g., "1h", "30m", "1d")
    const match = timeStr.match(/^(\d+)([smhd])$/);
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2];
      const multipliers = { s: 1, m: 60, h: 3600, d: 86400 };
      return Math.floor(Date.now() / 1000) - (value * multipliers[unit]);
    }
    
    // Handle ISO 8601 timestamps
    return Math.floor(new Date(timeStr).getTime() / 1000);
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Grafana MCP Server running on stdio');
  }
}

// Run the server
const server = new GrafanaMCPServer();
server.run().catch(console.error);

module.exports = GrafanaMCPServer;
