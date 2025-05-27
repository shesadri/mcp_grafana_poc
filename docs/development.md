# Development Guide

This guide covers development setup, contributing guidelines, and architectural details for the Grafana MCP server.

## Development Setup

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- Git

### Local Development Environment

1. **Clone the repository:**
   ```bash
   git clone https://github.com/shesadri/mcp_grafana_poc.git
   cd mcp_grafana_poc
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

4. **Start supporting services:**
   ```bash
   docker-compose up grafana prometheus -d
   ```

5. **Run the MCP server:**
   ```bash
   npm run dev  # With auto-reload
   # or
   npm start    # Without auto-reload
   ```

### Project Structure

```
mcp_grafana_poc/
├── src/                    # Source code
│   ├── server.js           # Main MCP server
│   ├── tools/              # Tool implementations
│   │   └── grafana.js      # Grafana-specific tools
│   └── utils/              # Utility functions
│       ├── logger.js       # Logging configuration
│       └── validator.js    # Input validation
├── config/                 # Configuration files
│   ├── grafana/            # Grafana configurations
│   │   ├── dashboards/     # Sample dashboards
│   │   └── provisioning/   # Grafana provisioning
│   └── prometheus/         # Prometheus configuration
├── examples/               # Usage examples
├── tests/                  # Test files
├── docs/                   # Documentation
├── scripts/                # Utility scripts
└── docker-compose.yml     # Container orchestration
```

## Architecture

### MCP Server Architecture

The server follows the Model Context Protocol specification:

```
┌──────────────────────────────────────────────────────────┐
│                        MCP Client                        │
│                   (AI Assistant)                       │
└─────────────────┬──────────────────────────────────────┘
                │
                │ MCP Protocol (JSON-RPC)
                │
┌─────────────────┴──────────────────────────────────────┐
│                      MCP Server                        │
│  ┌───────────────────────────────────────────────┐ │
│  │                Tool Registry               │ │
│  │  ┌───────────────────────────────────────┐  │ │
│  │  │              Tools                  │  │ │
│  │  │  • query_metrics                   │  │ │
│  │  │  • get_dashboards                  │  │ │
│  │  │  • create_dashboard                │  │ │
│  │  │  • get_alerts                      │  │ │
│  │  │  • health_check                    │  │ │
│  │  └───────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
                │
     ┌─────────────┴──────────────────────────┐
     │           External Services            │
     │  ┌─────────────────────────────────┐  │
     │  │           Grafana              │  │
     │  │  • Dashboards API               │  │
     │  │  • Alerts API                   │  │
     │  │  • Health API                   │  │
     │  └─────────────────────────────────┘  │
     │  ┌─────────────────────────────────┐  │
     │  │          Prometheus            │  │
     │  │  • Query API                    │  │
     │  │  • Query Range API              │  │
     │  │  • Health API                   │  │
     │  └─────────────────────────────────┘  │
     └────────────────────────────────────────┘
```

### Core Components

1. **Server (`src/server.js`)**
   - Main MCP server implementation
   - Handles tool registration and execution
   - Manages connections and protocol communication

2. **Tools (`src/tools/`)**
   - Individual tool implementations
   - Each tool has its own validation and execution logic
   - Modular design for easy extension

3. **Utilities (`src/utils/`)**
   - Shared functionality across tools
   - Logging, validation, error handling

## Adding New Tools

To add a new tool to the MCP server:

### 1. Define the Tool Schema

Add the tool definition to the tools array in `src/server.js`:

```javascript
{
  name: 'my_new_tool',
  description: 'Description of what the tool does',
  inputSchema: {
    type: 'object',
    properties: {
      param1: {
        type: 'string',
        description: 'Description of parameter'
      }
    },
    required: ['param1']
  }
}
```

### 2. Implement the Tool Handler

Add the tool case to the switch statement in `setupHandlers()`:

```javascript
case 'my_new_tool':
  return await this.myNewTool(args);
```

### 3. Create the Tool Implementation

Add the method to the `GrafanaMCPServer` class:

```javascript
async myNewTool(args) {
  const { param1 } = args;
  
  try {
    // Tool implementation here
    const result = await someOperation(param1);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };
  } catch (error) {
    throw new Error(`Failed to execute my_new_tool: ${error.message}`);
  }
}
```

### 4. Add Validation Schema

Update `src/utils/validator.js` with the validation schema:

```javascript
myNewTool: Joi.object({
  param1: Joi.string().required().min(1).max(100)
    .description('Parameter description')
})
```

### 5. Add Tests

Create tests in `tests/` directory:

```javascript
describe('My New Tool', () => {
  it('should execute successfully with valid parameters', async () => {
    const result = await client.callTool({
      name: 'my_new_tool',
      arguments: { param1: 'test' }
    });
    
    expect(result.content).toBeDefined();
  });
});
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- server.test.js
```

### Test Categories

1. **Unit Tests**: Test individual functions and methods
2. **Integration Tests**: Test tool interactions with external services
3. **MCP Protocol Tests**: Test MCP protocol compliance

### Writing Tests

Example test structure:

```javascript
describe('Tool Name', () => {
  let client;
  let serverProcess;

  beforeAll(async () => {
    // Setup test client and server
  });

  afterAll(() => {
    // Cleanup
  });

  describe('Input Validation', () => {
    it('should validate required parameters', async () => {
      // Test validation
    });
  });

  describe('Functionality', () => {
    it('should execute successfully', async () => {
      // Test execution
    });
  });

  describe('Error Handling', () => {
    it('should handle service unavailable', async () => {
      // Test error cases
    });
  });
});
```

## Code Style and Standards

### ESLint Configuration

The project uses ESLint for code style enforcement:

```bash
# Check code style
npm run lint

# Auto-fix style issues
npm run lint:fix
```

### Code Style Guidelines

1. **Use async/await**: Prefer async/await over promises
2. **Error Handling**: Always wrap external calls in try/catch
3. **Logging**: Use the Winston logger for all logging
4. **Validation**: Validate all inputs using Joi schemas
5. **Documentation**: Document all public methods and complex logic

### Example Code Style

```javascript
/**
 * Query metrics from Prometheus
 * @param {Object} args - Tool arguments
 * @param {string} args.query - PromQL query
 * @param {string} args.start - Start time
 * @param {string} args.end - End time
 * @returns {Object} MCP response with metrics data
 */
async queryMetrics(args) {
  const validatedArgs = validateArgs('queryMetrics', args);
  const { query, start, end } = validatedArgs;
  
  try {
    logger.info('Executing metrics query', { query, start, end });
    
    const response = await axios.get(`${this.prometheusUrl}/api/v1/query_range`, {
      params: { query, start: this.parseTimeRange(start), end: this.parseTimeRange(end) },
      timeout: 30000
    });

    logger.info('Query executed successfully', { 
      resultType: response.data.data.resultType,
      resultCount: response.data.data.result.length 
    });
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(response.data, null, 2)
      }]
    };
  } catch (error) {
    logger.error('Failed to query metrics', { 
      error: error.message, 
      query, 
      start, 
      end 
    });
    throw new Error(`Failed to query metrics: ${error.message}`);
  }
}
```

## Debugging

### Logging

The server uses structured logging with different levels:

```javascript
const logger = require('./utils/logger');

// Different log levels
logger.error('Error message', { context: 'data' });
logger.warn('Warning message', { context: 'data' });
logger.info('Info message', { context: 'data' });
logger.debug('Debug message', { context: 'data' });
```

### Debug Mode

Run with debug logging:

```bash
LOG_LEVEL=debug npm run dev
```

### Common Debugging Steps

1. **Check service connectivity**:
   ```bash
   curl http://localhost:3000/api/health
   curl http://localhost:9090/-/healthy
   ```

2. **Verify environment variables**:
   ```bash
   printenv | grep GRAFANA
   ```

3. **Test tool execution directly**:
   ```bash
   node -e "console.log(require('./src/server.js'))"
   ```

4. **Use the test client**:
   ```bash
   cd examples && node mcp-client.js
   ```

## Performance Considerations

### Caching

Implement caching for frequently accessed data:

```javascript
const cache = new Map();

async getCachedDashboards(ttl = 300000) { // 5 minutes
  const cacheKey = 'dashboards';
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }
  
  const data = await this.fetchDashboards();
  cache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}
```

### Rate Limiting

Implement rate limiting for external API calls:

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
```

### Connection Pooling

Use connection pooling for HTTP requests:

```javascript
const http = require('http');
const https = require('https');

const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });

axios.defaults.httpAgent = httpAgent;
axios.defaults.httpsAgent = httpsAgent;
```

## Deployment

### Docker Production Build

```bash
# Build production image
docker build -t grafana-mcp-server:prod .

# Run production container
docker run -d \
  --name grafana-mcp-server \
  -p 8080:8080 \
  -e NODE_ENV=production \
  -e GRAFANA_URL=https://your-grafana.com \
  grafana-mcp-server:prod
```

### Environment-specific Configuration

Use different configurations for different environments:

```bash
# Development
cp .env.example .env.development

# Production
cp .env.example .env.production

# Load environment-specific config
NODE_ENV=production node src/server.js
```

## Contributing

### Pull Request Process

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/new-tool`
3. **Make changes** with tests
4. **Run tests**: `npm test`
5. **Lint code**: `npm run lint`
6. **Commit changes**: Use conventional commit messages
7. **Push branch**: `git push origin feature/new-tool`
8. **Create pull request**

### Commit Message Format

Use conventional commits:

```
type(scope): description

feat(tools): add new dashboard creation tool
fix(validation): handle edge case in time parsing
docs(api): update tool documentation
test(integration): add Grafana connectivity tests
```

### Code Review Checklist

- [ ] Tests pass locally
- [ ] Code follows style guidelines
- [ ] New features have tests
- [ ] Documentation is updated
- [ ] Error handling is implemented
- [ ] Logging is appropriate
- [ ] Performance impact considered

## Resources

- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [Grafana HTTP API](https://grafana.com/docs/grafana/latest/developers/http_api/)
- [Prometheus HTTP API](https://prometheus.io/docs/prometheus/latest/querying/api/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
