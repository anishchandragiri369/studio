interface LogEntry {
  timestamp: string;
  level: 'info' | 'error' | 'warn' | 'debug';
  message: string;
  data?: any;
  source: string;
}

class Logger {
  private isClient = typeof window !== 'undefined';
  
  public log(level: LogEntry['level'], message: string, data?: any, source: string = 'API') {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      source
    };

    // Always log to console for server-side visibility
    const logMethod = level === 'error' ? console.error : 
                     level === 'warn' ? console.warn : 
                     level === 'debug' ? console.debug : console.log;
    
    logMethod(`[${source}] ${message}`, data || '');

    // Store in localStorage for browser viewing (client-side only)
    if (this.isClient) {
      this.storeInLocalStorage(logEntry);
    }
  }

  private storeInLocalStorage(logEntry: LogEntry) {
    try {
      const existingLogs = localStorage.getItem('api_logs');
      const logs: LogEntry[] = existingLogs ? JSON.parse(existingLogs) : [];
      
      // Keep only last 100 logs to prevent localStorage overflow
      logs.push(logEntry);
      if (logs.length > 100) {
        logs.shift();
      }
      
      localStorage.setItem('api_logs', JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to store log in localStorage:', error);
    }
  }

  info(message: string, data?: any, source?: string) {
    this.log('info', message, data, source);
  }

  error(message: string, data?: any, source?: string) {
    this.log('error', message, data, source);
  }

  warn(message: string, data?: any, source?: string) {
    this.log('warn', message, data, source);
  }

  debug(message: string, data?: any, source?: string) {
    this.log('debug', message, data, source);
  }

  // Client-side only method to add logs from API responses
  addClientLog(level: LogEntry['level'], message: string, data?: any, source: string = 'Client') {
    if (this.isClient) {
      this.log(level, message, data, source);
    }
  }

  // Clear all logs
  clear() {
    if (this.isClient) {
      localStorage.removeItem('api_logs');
    }
  }
}

export const logger = new Logger();

// Helper function for API routes to return logs in response
export function createLoggedResponse(
  success: boolean, 
  message: string, 
  data?: any, 
  status: number = 200,
  logLevel: 'info' | 'error' | 'warn' = success ? 'info' : 'error'
) {
  logger.log(logLevel, message, data, 'API');
  
  return {
    success,
    message,
    data,
    log: {
      timestamp: new Date().toISOString(),
      level: logLevel,
      message,
      data
    }
  };
}
