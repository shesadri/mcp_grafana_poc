# Grafana MCP Server POC

This repository contains a proof-of-concept implementation for learning and understanding how Grafana MCP (Model Context Protocol) servers work.

## Overview

The Model Context Protocol (MCP) is a protocol that enables AI assistants to securely access and interact with external systems. This POC demonstrates how to create an MCP server that integrates with Grafana for monitoring and observability use cases.

## Features

- **MCP Server Implementation**: A complete MCP server that can interact with Grafana
- **Grafana Integration**: Sample configurations and dashboards
- **Docker Setup**: Complete containerized environment
- **Sample Data**: Mock metrics and monitoring data for testing
- **Documentation**: Comprehensive guides and examples

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Git

### Using Docker (Recommended)

1. Clone the repository:
```bash
git clone https://github.com/shesadri/mcp_grafana_poc.git
cd mcp_grafana_poc
```

2. Start the complete stack:
```bash
docker-compose up -d
```

3. Access the services:
- Grafana: http://localhost:3000 (admin/admin)
- MCP Server: http://localhost:8080
- Prometheus: http://localhost:9090

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Start the MCP server:
```bash
npm start
```

3. Run in development mode:
```bash
npm run dev
```

## Architecture

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   Client    │────│  MCP Server  │────│   Grafana   │
│ (AI Agent)  │    │              │    │             │
└─────────────┘    └──────────────┘    └─────────────┘
                            │
                    ┌──────────────┐
                    │ Prometheus   │
                    │ (Data Source)│
                    └──────────────┘
```

## MCP Server Capabilities

The MCP server provides the following tools:

- `query_metrics`: Query metrics from Grafana/Prometheus
- `create_dashboard`: Create new Grafana dashboards
- `get_alerts`: Retrieve alerting information
- `search_logs`: Search through log data
- `health_check`: Check system health status

## File Structure

```
.
├── src/
│   ├── server.js          # Main MCP server implementation
│   ├── tools/             # MCP tool implementations
│   └── utils/             # Utility functions
├── config/
│   ├── grafana/           # Grafana configuration files
│   └── prometheus/        # Prometheus configuration
├── docker/
│   ├── Dockerfile         # MCP server container
│   └── docker-compose.yml # Complete stack setup
├── examples/              # Sample queries and usage
├── docs/                  # Documentation
└── package.json          # Node.js dependencies
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Learning Resources

- [Model Context Protocol Specification](https://spec.modelcontextprotocol.io/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Prometheus Documentation](https://prometheus.io/docs/)

## License

MIT License - see LICENSE file for details

## Support

For questions and support, please open an issue in this repository.
