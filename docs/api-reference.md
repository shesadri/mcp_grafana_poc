# MCP Grafana Server API Reference

This document provides detailed information about all available tools in the Grafana MCP server.

## Tool Overview

The MCP server provides 5 main tools for interacting with Grafana and Prometheus:

| Tool Name | Description | Input Required |
|-----------|-------------|----------------|
| `health_check` | Check system health | None |
| `query_metrics` | Query Prometheus metrics | query |
| `get_dashboards` | List Grafana dashboards | None |
| `create_dashboard` | Create new dashboard | title |
| `get_alerts` | Get alert information | None |

## Tool Details

### health_check

Checks the health status of Grafana and Prometheus services.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {}
}
```

**Example Request:**
```json
{
  "method": "tools/call",
  "params": {
    "name": "health_check",
    "arguments": {}
  }
}
```

**Example Response:**
```json
{
  "content": [{
    "type": "text",
    "text": "{\n  \"grafana\": {\n    \"status\": \"healthy\",\n    \"url\": \"http://localhost:3000\",\n    \"version\": \"9.0.0\"\n  },\n  \"prometheus\": {\n    \"status\": \"healthy\",\n    \"url\": \"http://localhost:9090\"\n  },\n  \"timestamp\": \"2023-01-01T00:00:00.000Z\"\n}"
  }]
}
```

### query_metrics

Execute PromQL queries against Prometheus.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "PromQL query to execute",
      "minLength": 1,
      "maxLength": 1000
    },
    "start": {
      "type": "string",
      "description": "Start time (ISO 8601 or relative like '1h')",
      "default": "1h"
    },
    "end": {
      "type": "string",
      "description": "End time (ISO 8601 or relative like 'now')",
      "default": "now"
    }
  },
  "required": ["query"]
}
```

**Example Request:**
```json
{
  "method": "tools/call",
  "params": {
    "name": "query_metrics",
    "arguments": {
      "query": "rate(cpu_usage_total[5m])",
      "start": "1h",
      "end": "now"
    }
  }
}
```

**Time Range Formats:**
- Relative: `5m`, `1h`, `2d`, `1w`
- Absolute: `2023-01-01T00:00:00Z`
- Special: `now`

### get_dashboards

Retrieve list of Grafana dashboards.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "search": {
      "type": "string",
      "description": "Search term to filter dashboards",
      "maxLength": 100
    }
  }
}
```

**Example Request:**
```json
{
  "method": "tools/call",
  "params": {
    "name": "get_dashboards",
    "arguments": {
      "search": "system"
    }
  }
}
```

### create_dashboard

Create a new Grafana dashboard.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "description": "Dashboard title",
      "minLength": 1,
      "maxLength": 200
    },
    "panels": {
      "type": "array",
      "description": "Array of panel configurations",
      "default": []
    }
  },
  "required": ["title"]
}
```

**Panel Configuration:**
```json
{
  "title": "Panel Title",
  "type": "timeseries",
  "targets": [
    {
      "expr": "prometheus_query",
      "legendFormat": "Legend {{label}}"
    }
  ],
  "gridPos": {
    "h": 8,
    "w": 12,
    "x": 0,
    "y": 0
  }
}
```

**Example Request:**
```json
{
  "method": "tools/call",
  "params": {
    "name": "create_dashboard",
    "arguments": {
      "title": "System Overview",
      "panels": [
        {
          "title": "CPU Usage",
          "type": "timeseries",
          "targets": [
            {
              "expr": "100 - (avg by (instance) (rate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)",
              "legendFormat": "CPU - {{instance}}"
            }
          ]
        }
      ]
    }
  }
}
```

### get_alerts

Retrieve alert information from Grafana.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "state": {
      "type": "string",
      "enum": ["alerting", "ok", "paused", "pending"],
      "description": "Filter alerts by state"
    }
  }
}
```

**Example Request:**
```json
{
  "method": "tools/call",
  "params": {
    "name": "get_alerts",
    "arguments": {
      "state": "alerting"
    }
  }
}
```

## Error Handling

All tools return consistent error responses when something goes wrong:

```json
{
  "content": [{
    "type": "text",
    "text": "Error executing tool_name: Detailed error message"
  }],
  "isError": true
}
```

**Common Error Types:**

1. **Validation Errors**: Invalid input parameters
   ```
   Error executing query_metrics: Validation error: "query" is required
   ```

2. **Connection Errors**: Service unavailable
   ```
   Error executing health_check: Failed to connect to Grafana: ECONNREFUSED
   ```

3. **Authentication Errors**: Invalid credentials
   ```
   Error executing get_dashboards: Request failed with status code 401
   ```

4. **Query Errors**: Invalid PromQL syntax
   ```
   Error executing query_metrics: Bad query syntax
   ```

## Environment Configuration

The server uses these environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `GRAFANA_URL` | `http://localhost:3000` | Grafana server URL |
| `GRAFANA_API_KEY` | `admin` | Grafana API key |
| `PROMETHEUS_URL` | `http://localhost:9090` | Prometheus server URL |
| `LOG_LEVEL` | `info` | Logging level |
| `NODE_ENV` | `development` | Node environment |

## Rate Limiting

The server implements basic rate limiting:
- Default: 100 requests per 15 minutes per client
- Configurable via `RATE_LIMIT_MAX` and `RATE_LIMIT_WINDOW`

## Metrics and Monitoring

The MCP server itself can be monitored:
- Health endpoint: `/health`
- Metrics endpoint: `/metrics` (Prometheus format)
- Logs: Structured JSON logging with Winston

## Security Considerations

1. **API Keys**: Use proper Grafana API keys, not default passwords
2. **Network**: Run in isolated networks when possible
3. **HTTPS**: Use HTTPS in production environments
4. **Validation**: All inputs are validated against schemas
5. **Logging**: Sensitive data is not logged

## SDK Integration

When using the MCP SDK, initialize the client as follows:

```javascript
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');

const client = new Client(
  { name: 'grafana-client', version: '1.0.0' },
  { capabilities: {} }
);

// Connect and use
await client.connect(transport);
const tools = await client.listTools();
const result = await client.callTool({ name: 'health_check', arguments: {} });
```

## Troubleshooting

**Tool Not Found:**
```javascript
// Check available tools first
const tools = await client.listTools();
console.log(tools.tools.map(t => t.name));
```

**Connection Issues:**
```bash
# Test connectivity
curl http://localhost:3000/api/health
curl http://localhost:9090/-/healthy
```

**Authentication Issues:**
```bash
# Test Grafana auth
curl -H "Authorization: Bearer YOUR_API_KEY" http://localhost:3000/api/org
```
