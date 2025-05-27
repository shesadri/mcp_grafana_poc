# Getting Started with Grafana MCP Server

This guide will help you get started with the Grafana MCP (Model Context Protocol) server for learning and experimentation.

## What is MCP?

The Model Context Protocol (MCP) is an open protocol that enables AI assistants to securely access and interact with external systems. This POC demonstrates how to create an MCP server that can:

- Query metrics from Prometheus/Grafana
- Create and manage Grafana dashboards
- Retrieve alerting information
- Perform health checks on monitoring infrastructure

## Prerequisites

Before you begin, ensure you have:

- Docker and Docker Compose installed
- Node.js 18+ (for local development)
- Basic understanding of Prometheus and Grafana
- Familiarity with REST APIs and JSON

## Quick Start with Docker

### 1. Clone and Start

```bash
git clone https://github.com/shesadri/mcp_grafana_poc.git
cd mcp_grafana_poc
docker-compose up -d
```

### 2. Verify Services

Wait a few minutes for all services to start, then check:

- **Grafana**: http://localhost:3000 (admin/admin)
- **Prometheus**: http://localhost:9090
- **MCP Server**: Check logs with `docker-compose logs mcp-server`

### 3. Test the MCP Server

Run the example client:

```bash
cd examples
node mcp-client.js
```

## Manual Setup (Local Development)

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your Grafana and Prometheus URLs
```

### 3. Start External Services

Start Grafana and Prometheus separately, or use Docker Compose for just those services:

```bash
docker-compose up grafana prometheus -d
```

### 4. Run the MCP Server

```bash
npm start
```

## Understanding the MCP Server

### Available Tools

The MCP server provides these tools:

1. **query_metrics**: Execute PromQL queries
2. **get_dashboards**: List Grafana dashboards
3. **create_dashboard**: Create new dashboards
4. **get_alerts**: Retrieve alert information
5. **health_check**: Check system health

### Tool Usage Examples

#### Health Check

```javascript
const result = await client.callTool({
  name: 'health_check',
  arguments: {}
});
```

#### Query CPU Usage

```javascript
const result = await client.callTool({
  name: 'query_metrics',
  arguments: {
    query: '100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)',
    start: '1h',
    end: 'now'
  }
});
```

#### Create Dashboard

```javascript
const result = await client.callTool({
  name: 'create_dashboard',
  arguments: {
    title: 'My MCP Dashboard',
    panels: [
      {
        title: 'CPU Usage',
        type: 'timeseries',
        targets: [{
          expr: 'rate(cpu_usage[5m])',
          legendFormat: 'CPU - {{instance}}'
        }]
      }
    ]
  }
});
```

## Working with the Code

### Project Structure

```
src/
├── server.js          # Main MCP server implementation
├── tools/             # Tool implementations
│   └── grafana.js     # Grafana-specific tools
└── utils/             # Utility functions
    ├── logger.js      # Logging configuration
    └── validator.js   # Input validation
```

### Key Files

- **`src/server.js`**: Main MCP server that handles tool registration and execution
- **`src/tools/grafana.js`**: Grafana-specific tool implementations
- **`examples/mcp-client.js`**: Example client for testing
- **`docker-compose.yml`**: Complete stack setup
- **`config/`**: Configuration files for Grafana, Prometheus, etc.

### Development Workflow

1. **Make Changes**: Edit files in `src/`
2. **Test Locally**: Run `npm run dev` for auto-restart
3. **Test with Docker**: `docker-compose up --build mcp-server`
4. **Run Examples**: Use the example client to test functionality

## Common Use Cases

### 1. Monitoring System Health

```javascript
// Check if all services are healthy
const health = await client.callTool({
  name: 'health_check',
  arguments: {}
});
```

### 2. Creating Monitoring Dashboards

```javascript
// Create a dashboard for application monitoring
const dashboard = await client.callTool({
  name: 'create_dashboard',
  arguments: {
    title: 'Application Performance',
    panels: [
      // CPU panel
      {
        title: 'CPU Usage',
        targets: [{ expr: 'rate(cpu_seconds_total[5m])' }]
      },
      // Memory panel
      {
        title: 'Memory Usage',
        targets: [{ expr: 'memory_usage_bytes' }]
      }
    ]
  }
});
```

### 3. Querying Historical Data

```javascript
// Get last 24 hours of error rates
const errors = await client.callTool({
  name: 'query_metrics',
  arguments: {
    query: 'rate(http_requests_total{status=~"5.."}[5m])',
    start: '24h',
    end: 'now'
  }
});
```

## Troubleshooting

### Common Issues

1. **Connection Refused**: Check that Grafana/Prometheus are running
2. **Authentication Failed**: Verify GRAFANA_API_KEY in environment
3. **Query Errors**: Validate PromQL syntax
4. **Docker Issues**: Try `docker-compose down && docker-compose up`

### Debugging

1. **Check Logs**:
   ```bash
   docker-compose logs mcp-server
   docker-compose logs grafana
   ```

2. **Test Connectivity**:
   ```bash
   curl http://localhost:3000/api/health
   curl http://localhost:9090/-/healthy
   ```

3. **Validate Environment**:
   ```bash
   docker-compose exec mcp-server env | grep GRAFANA
   ```

## Next Steps

1. **Explore Examples**: Look at `examples/sample-queries.md`
2. **Customize Tools**: Add new tools in `src/tools/`
3. **Create Dashboards**: Use Grafana UI to design, then recreate via MCP
4. **Add Monitoring**: Implement metrics for the MCP server itself
5. **Authentication**: Add proper authentication for production use

## Learning Resources

- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [Grafana API Documentation](https://grafana.com/docs/grafana/latest/developers/http_api/)
- [Prometheus Query Language](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

## Support

For questions and issues:

1. Check the troubleshooting section
2. Review example queries and usage
3. Open an issue in the GitHub repository
4. Consult the MCP and Grafana documentation
