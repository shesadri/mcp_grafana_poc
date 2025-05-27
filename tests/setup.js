// Jest setup file
// This file is run before each test file

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';
process.env.GRAFANA_URL = process.env.GRAFANA_URL || 'http://localhost:3000';
process.env.PROMETHEUS_URL = process.env.PROMETHEUS_URL || 'http://localhost:9090';
process.env.GRAFANA_API_KEY = process.env.GRAFANA_API_KEY || 'admin';

// Global test timeout
jest.setTimeout(30000);

// Mock console methods in tests to reduce noise
if (process.env.SILENT_TESTS === 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

// Global test utilities
global.testUtils = {
  // Wait for a condition to be true
  waitFor: async (condition, timeout = 5000, interval = 100) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (await condition()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    throw new Error(`Condition not met within ${timeout}ms`);
  },
  
  // Check if a service is available
  isServiceAvailable: async (url) => {
    try {
      const response = await fetch(url);
      return response.ok;
    } catch {
      return false;
    }
  }
};
