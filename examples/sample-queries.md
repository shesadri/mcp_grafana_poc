# Sample MCP Queries for Grafana

This document contains example queries and use cases for the Grafana MCP server.

## Basic Health Check

```json
{
  "method": "tools/call",
  "params": {
    "name": "health_check",
    "arguments": {}
  }
}
```

## Query Metrics

### Basic CPU Usage Query

```json
{
  "method": "tools/call",
  "params": {
    "name": "query_metrics",
    "arguments": {
      "query": "100 - (avg by (instance) (rate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)",
      "start": "1h",
      "end": "now"
    }
  }
}
```

### Memory Usage Query

```json
{
  "method": "tools/call",
  "params": {
    "name": "query_metrics",
    "arguments": {
      "query": "(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100",
      "start": "30m",
      "end": "now"
    }
  }
}
```

### Disk Usage Query

```json
{
  "method": "tools/call",
  "params": {
    "name": "query_metrics",
    "arguments": {
      "query": "100 - ((node_filesystem_avail_bytes{mountpoint=\"/\",fstype!=\"rootfs\"} * 100) / node_filesystem_size_bytes{mountpoint=\"/\",fstype!=\"rootfs\"})",
      "start": "2h",
      "end": "now"
    }
  }
}
```

## Dashboard Operations

### List All Dashboards

```json
{
  "method": "tools/call",
  "params": {
    "name": "get_dashboards",
    "arguments": {}
  }
}
```

### Search Dashboards

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

### Create a Simple Dashboard

```json
{
  "method": "tools/call",
  "params": {
    "name": "create_dashboard",
    "arguments": {
      "title": "MCP Generated Dashboard",
      "panels": [
        {
          "id": 1,
          "title": "CPU Usage",
          "type": "timeseries",
          "targets": [
            {
              "expr": "100 - (avg by (instance) (rate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)",
              "legendFormat": "CPU Usage - {{instance}}"
            }
          ],
          "gridPos": {
            "h": 8,
            "w": 12,
            "x": 0,
            "y": 0
          }
        }
      ]
    }
  }
}
```

## Alert Queries

### Get All Alerts

```json
{
  "method": "tools/call",
  "params": {
    "name": "get_alerts",
    "arguments": {}
  }
}
```

### Get Only Alerting Status

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

## Advanced Use Cases

### Monitor Application Performance

```json
{
  "method": "tools/call",
  "params": {
    "name": "query_metrics",
    "arguments": {
      "query": "rate(http_requests_total[5m])",
      "start": "1h",
      "end": "now"
    }
  }
}
```

### Check Service Availability

```json
{
  "method": "tools/call",
  "params": {
    "name": "query_metrics",
    "arguments": {
      "query": "up{job=\"prometheus\"}",
      "start": "5m",
      "end": "now"
    }
  }
}
```

### Network I/O Monitoring

```json
{
  "method": "tools/call",
  "params": {
    "name": "query_metrics",
    "arguments": {
      "query": "rate(node_network_receive_bytes_total[5m])",
      "start": "30m",
      "end": "now"
    }
  }
}
```

## Time Range Examples

- `"5m"` - Last 5 minutes
- `"1h"` - Last 1 hour
- `"1d"` - Last 1 day
- `"2023-01-01T00:00:00Z"` - Specific timestamp
- `"now"` - Current time
- `"now-1h"` - 1 hour ago from now

## Error Handling

All tools will return error information in the response if something goes wrong:

```json
{
  "content": [
    {
      "type": "text",
      "text": "Error executing query_metrics: Connection refused"
    }
  ],
  "isError": true
}
```
