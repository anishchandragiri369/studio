"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'error' | 'warn' | 'debug';
  message: string;
  data?: any;
  source: string;
}

export default function LogViewerPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [autoScroll, setAutoScroll] = useState(false); // Disabled by default
  const [isPaused, setIsPaused] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (autoScroll && !isPaused) {
      logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const scrollToTop = () => {
    logsContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleScroll = () => {
    if (logsContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = logsContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
      setIsAtBottom(isNearBottom);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs, autoScroll, isPaused]);

  // Simulate log streaming (in a real app, you'd use WebSocket or SSE)
  useEffect(() => {
    const interval = setInterval(() => {
      // Only fetch new logs if not paused
      if (!isPaused) {
        // Check for new logs from localStorage (where APIs can write logs)
        const storedLogs = localStorage.getItem('api_logs');
        if (storedLogs) {
          try {
            const parsedLogs = JSON.parse(storedLogs);
            setLogs(parsedLogs);
          } catch (error) {
            console.error('Failed to parse logs:', error);
          }
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const clearLogs = () => {
    setLogs([]);
    localStorage.removeItem('api_logs');
  };

  const addTestLog = () => {
    const newLog: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Test log entry added manually',
      source: 'Manual Test',
      data: { test: true, timestamp: Date.now() }
    };
    
    const currentLogs = [...logs, newLog];
    setLogs(currentLogs);
    localStorage.setItem('api_logs', JSON.stringify(currentLogs));
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'bg-red-500';
      case 'warn': return 'bg-yellow-500';
      case 'info': return 'bg-blue-500';
      case 'debug': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-6xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>API Logs Viewer</CardTitle>
              <CardDescription>
                Real-time logs from your API endpoints and webhook functions
              </CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge variant={isPaused ? "destructive" : "default"}>
                {isPaused ? "Paused" : "Live"}
              </Badge>
              <Button 
                variant={isPaused ? "default" : "outline"}
                size="sm"
                onClick={() => setIsPaused(!isPaused)}
              >
                {isPaused ? "Resume" : "Pause"}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setAutoScroll(!autoScroll)}
              >
                Auto-scroll: {autoScroll ? "ON" : "OFF"}
              </Button>
              <Button variant="outline" size="sm" onClick={scrollToTop}>
                ↑ Top
              </Button>
              <Button variant="outline" size="sm" onClick={scrollToBottom}>
                ↓ Bottom
              </Button>
              <Button variant="outline" size="sm" onClick={addTestLog}>
                Add Test Log
              </Button>
              <Button variant="destructive" size="sm" onClick={clearLogs}>
                Clear Logs
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Scroll indicator */}
          {!isAtBottom && logs.length > 0 && (
            <div className="mb-2 text-center">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={scrollToBottom}
                className="text-xs"
              >
                ↓ New logs below ↓
              </Button>
            </div>
          )}
          
          <div 
            ref={logsContainerRef}
            onScroll={handleScroll}
            className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-96 overflow-y-auto"
          >
            {logs.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                No logs yet. Trigger some API calls to see logs appear here.
                <br />
                <span className="text-xs">
                  Go to <a href="/test-subscription" className="text-blue-400 underline">Test Subscription</a> page to generate logs.
                </span>
              </div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-2 border-b border-gray-700 pb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-gray-400 text-xs">
                      {formatTimestamp(log.timestamp)}
                    </span>
                    <Badge 
                      className={`${getLevelColor(log.level)} text-white text-xs px-2 py-0`}
                    >
                      {log.level.toUpperCase()}
                    </Badge>
                    <span className="text-yellow-400 text-xs">
                      [{log.source}]
                    </span>
                  </div>
                  <div className="text-green-400 mb-1">
                    {log.message}
                  </div>
                  {log.data && (
                    <div className="text-gray-300 text-xs bg-gray-800 p-2 rounded">
                      <pre>{JSON.stringify(log.data, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            <h4 className="font-semibold mb-2">Controls & Tips:</h4>
            <ul className="space-y-1 text-xs">
              <li>• <strong>Pause/Resume:</strong> Stop new logs from appearing while you read</li>
              <li>• <strong>Auto-scroll:</strong> Automatically scroll to new logs (off by default)</li>
              <li>• <strong>Top/Bottom:</strong> Quick navigation buttons</li>
              <li>• <strong>Manual scroll:</strong> Scroll up/down normally when auto-scroll is off</li>
              <li>• Use the Test Subscription page to generate API logs</li>
              <li>• Logs are stored in browser localStorage (cleared on refresh)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
