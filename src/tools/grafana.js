const axios = require('axios');
const logger = require('../utils/logger');
const { validateArgs } = require('../utils/validator');

class GrafanaTools {
  constructor(grafanaUrl, apiKey) {
    this.grafanaUrl = grafanaUrl;
    this.apiKey = apiKey;
    this.axiosConfig = {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    };
  }

  /**
   * Get all dashboards from Grafana
   */
  async getDashboards(args) {
    const validatedArgs = validateArgs('getDashboards', args);
    const { search } = validatedArgs;
    
    try {
      logger.info('Fetching dashboards from Grafana', { search });
      
      const response = await axios.get(`${this.grafanaUrl}/api/search`, {
        ...this.axiosConfig,
        params: {
          query: search || '',
          type: 'dash-db'
        }
      });

      logger.info('Successfully retrieved dashboards', { count: response.data.length });
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            dashboards: response.data,
            total: response.data.length,
            search: search || 'all'
          }, null, 2)
        }]
      };
    } catch (error) {
      logger.error('Failed to get dashboards', { error: error.message });
      throw new Error(`Failed to get dashboards: ${error.message}`);
    }
  }

  /**
   * Create a new dashboard in Grafana
   */
  async createDashboard(args) {
    const validatedArgs = validateArgs('createDashboard', args);
    const { title, panels } = validatedArgs;
    
    const dashboard = {
      dashboard: {
        id: null,
        title,
        panels: panels.map((panel, index) => ({
          id: index + 1,
          title: panel.title || `Panel ${index + 1}`,
          type: panel.type || 'timeseries',
          targets: panel.targets || [],
          gridPos: panel.gridPos || {
            h: 8,
            w: 12,
            x: (index % 2) * 12,
            y: Math.floor(index / 2) * 8
          },
          fieldConfig: {
            defaults: {
              custom: {},
              thresholds: {
                mode: 'absolute',
                steps: [
                  { color: 'green', value: null },
                  { color: 'red', value: 80 }
                ]
              }
            }
          },
          options: {
            legend: {
              calcs: [],
              displayMode: 'list',
              placement: 'bottom'
            }
          }
        })),
        tags: ['mcp-generated'],
        refresh: '30s',
        time: {
          from: 'now-1h',
          to: 'now'
        },
        timepicker: {
          refresh_intervals: ['5s', '10s', '30s', '1m', '5m', '15m', '30m', '1h', '2h', '1d']
        },
        schemaVersion: 36
      },
      folderId: 0,
      overwrite: false
    };

    try {
      logger.info('Creating dashboard in Grafana', { title });
      
      const response = await axios.post(
        `${this.grafanaUrl}/api/dashboards/db`,
        dashboard,
        this.axiosConfig
      );

      logger.info('Successfully created dashboard', { 
        title,
        id: response.data.id,
        url: response.data.url 
      });
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            dashboard: {
              id: response.data.id,
              uid: response.data.uid,
              url: response.data.url,
              version: response.data.version
            },
            message: `Dashboard '${title}' created successfully`
          }, null, 2)
        }]
      };
    } catch (error) {
      logger.error('Failed to create dashboard', { error: error.message, title });
      throw new Error(`Failed to create dashboard: ${error.message}`);
    }
  }

  /**
   * Get alerts from Grafana
   */
  async getAlerts(args) {
    const validatedArgs = validateArgs('getAlerts', args);
    const { state } = validatedArgs;
    
    try {
      logger.info('Fetching alerts from Grafana', { state });
      
      const response = await axios.get(`${this.grafanaUrl}/api/alerts`, {
        ...this.axiosConfig,
        params: state ? { state } : {}
      });

      const alerts = response.data;
      const summary = {
        total: alerts.length,
        byState: alerts.reduce((acc, alert) => {
          acc[alert.state] = (acc[alert.state] || 0) + 1;
          return acc;
        }, {}),
        filtered: state || 'all'
      };

      logger.info('Successfully retrieved alerts', summary);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            alerts,
            summary
          }, null, 2)
        }]
      };
    } catch (error) {
      logger.error('Failed to get alerts', { error: error.message });
      throw new Error(`Failed to get alerts: ${error.message}`);
    }
  }

  /**
   * Check Grafana health
   */
  async checkHealth() {
    try {
      logger.info('Checking Grafana health');
      
      const healthResponse = await axios.get(`${this.grafanaUrl}/api/health`, {
        timeout: 5000
      });
      
      const dbResponse = await axios.get(`${this.grafanaUrl}/api/admin/stats`, {
        ...this.axiosConfig,
        timeout: 5000
      });

      const health = {
        status: 'healthy',
        url: this.grafanaUrl,
        version: healthResponse.data.version,
        database: healthResponse.data.database,
        stats: dbResponse.data,
        timestamp: new Date().toISOString()
      };

      logger.info('Grafana health check passed', { version: health.version });
      return health;
    } catch (error) {
      logger.error('Grafana health check failed', { error: error.message });
      return {
        status: 'unhealthy',
        url: this.grafanaUrl,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = GrafanaTools;
