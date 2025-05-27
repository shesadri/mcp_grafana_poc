const Joi = require('joi');

// Validation schemas for MCP tool arguments
const schemas = {
  queryMetrics: Joi.object({
    query: Joi.string().required().min(1).max(1000)
      .description('PromQL query string'),
    start: Joi.string().optional().default('1h')
      .description('Start time for query range'),
    end: Joi.string().optional().default('now')
      .description('End time for query range')
  }),

  getDashboards: Joi.object({
    search: Joi.string().optional().max(100)
      .description('Search term for filtering dashboards')
  }),

  createDashboard: Joi.object({
    title: Joi.string().required().min(1).max(200)
      .description('Dashboard title'),
    panels: Joi.array().optional().default([])
      .description('Array of panel configurations')
  }),

  getAlerts: Joi.object({
    state: Joi.string().optional()
      .valid('alerting', 'ok', 'paused', 'pending')
      .description('Filter alerts by state')
  }),

  healthCheck: Joi.object({})
};

/**
 * Validate tool arguments against schema
 * @param {string} toolName - Name of the tool
 * @param {object} args - Arguments to validate
 * @returns {object} Validation result
 */
function validateArgs(toolName, args) {
  const schema = schemas[toolName];
  if (!schema) {
    throw new Error(`No validation schema found for tool: ${toolName}`);
  }

  const { error, value } = schema.validate(args);
  if (error) {
    throw new Error(`Validation error: ${error.details[0].message}`);
  }

  return value;
}

/**
 * Validate PromQL query syntax (basic validation)
 * @param {string} query - PromQL query to validate
 * @returns {boolean} True if query appears valid
 */
function validatePromQLQuery(query) {
  // Basic PromQL validation patterns
  const patterns = {
    metricName: /^[a-zA-Z_:][a-zA-Z0-9_:]*$/,
    function: /^(rate|increase|sum|avg|max|min|count)\s*\(/,
    timeRange: /\[\d+[smhd]\]/
  };

  // Check for obviously invalid characters
  if (/[<>"'\\]/.test(query)) {
    return false;
  }

  // Allow complex queries through - this is just basic validation
  return query.length > 0 && query.length < 1000;
}

/**
 * Validate time range format
 * @param {string} timeRange - Time range string
 * @returns {boolean} True if format is valid
 */
function validateTimeRange(timeRange) {
  if (timeRange === 'now') return true;
  
  // Relative time format (e.g., "1h", "30m", "1d")
  if (/^\d+[smhd]$/.test(timeRange)) return true;
  
  // ISO 8601 timestamp
  try {
    new Date(timeRange);
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  validateArgs,
  validatePromQLQuery,
  validateTimeRange,
  schemas
};
