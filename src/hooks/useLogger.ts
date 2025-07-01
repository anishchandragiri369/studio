"use client";

import { useCallback } from 'react';
import { logger } from '@/lib/logger';

export function useLogger() {
  const logInfo = useCallback((message: string, data?: any, source?: string) => {
    logger.addClientLog('info', message, data, source);
  }, []);

  const logError = useCallback((message: string, data?: any, source?: string) => {
    logger.addClientLog('error', message, data, source);
  }, []);

  const logWarn = useCallback((message: string, data?: any, source?: string) => {
    logger.addClientLog('warn', message, data, source);
  }, []);

  const logDebug = useCallback((message: string, data?: any, source?: string) => {
    logger.addClientLog('debug', message, data, source);
  }, []);

  const clearLogs = useCallback(() => {
    logger.clear();
  }, []);

  // Helper to log API responses
  const logApiResponse = useCallback((response: any, endpoint: string) => {
    if (response.log) {
      logger.addClientLog(
        response.log.level,
        `[${endpoint}] ${response.log.message}`,
        response.log.data,
        'API Response'
      );
    }
    
    if (!response.success) {
      logger.addClientLog('error', `[${endpoint}] ${response.message}`, response, 'API Error');
    } else {
      logger.addClientLog('info', `[${endpoint}] ${response.message}`, response.data, 'API Success');
    }
  }, []);

  return {
    logInfo,
    logError,
    logWarn,
    logDebug,
    clearLogs,
    logApiResponse
  };
}
