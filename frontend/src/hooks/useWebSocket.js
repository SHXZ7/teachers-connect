import { useEffect, useRef, useState, useCallback } from 'react';

export const useWebSocket = (userId) => {
  const ws = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [connectionError, setConnectionError] = useState(null);

  const connect = useCallback(() => {
    if (!userId) {
      console.warn('WebSocket: No userId provided, skipping connection');
      return;
    }

    try {
      const wsUrl = `wss://shxz7-backend.hf.space/api/community/ws/${userId}`;
      console.log('WebSocket: Attempting to connect to:', wsUrl);
      
      // Check if backend is likely running by testing HTTP first
      fetch('https://shxz7-backend.hf.space/health')
        .then(() => {
          console.log('Backend server is responding, proceeding with WebSocket connection');
        })
        .catch(() => {
          console.warn('Backend server not responding on HTTP, WebSocket may fail');
          setConnectionError('Backend server not running. Please start the backend server with: uvicorn main:app --reload');
        });
      
      ws.current = new WebSocket(wsUrl);

      // Set a connection timeout
      const connectionTimeout = setTimeout(() => {
        if (ws.current?.readyState === WebSocket.CONNECTING) {
          console.warn('WebSocket connection timeout');
          ws.current.close();
          setConnectionError('Connection timeout. Backend server may not be running on shxz7-backend.hf.space');
          setIsConnected(false);
        }
      }, 10000); // 10 second timeout

      ws.current.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log('WebSocket connected successfully');
        setIsConnected(true);
        setConnectionError(null);
        
        // Send ping to keep connection alive
        const pingInterval = setInterval(() => {
          if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);

        ws.current.pingInterval = pingInterval;
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          setLastMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        
        if (ws.current?.pingInterval) {
          clearInterval(ws.current.pingInterval);
        }

        // Set appropriate error message based on close code
        if (event.code === 1006) {
          setConnectionError('Backend server is not running');
        } else if (event.code === 1002) {
          setConnectionError('WebSocket protocol error');
        } else if (!event.wasClean) {
          setConnectionError('Connection lost unexpectedly');
        }

        // Attempt to reconnect after a delay (only if not manually closed)
        if (!event.wasClean && event.code !== 1000) {
          console.log('WebSocket: Attempting to reconnect in 5 seconds...');
          setTimeout(() => {
            if (userId) { // Only reconnect if we still have a userId
              connect();
            }
          }, 5000);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error details:', {
          error: error,
          readyState: ws.current?.readyState,
          url: ws.current?.url,
          message: error?.message || 'Unknown WebSocket error'
        });
        
        // More specific error messages based on readyState
        if (ws.current?.readyState === WebSocket.CONNECTING) {
          setConnectionError('Failed to connect to backend server. Is the server running on shxz7-backend.hf.space?');
        } else if (ws.current?.readyState === WebSocket.CLOSING) {
          setConnectionError('WebSocket connection is closing');
        } else {
          setConnectionError('Backend server is not available. Please check if the server is running.');
        }
        setIsConnected(false);
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', {
        error: error,
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      
      if (error.name === 'SecurityError') {
        setConnectionError('WebSocket connection blocked by browser security settings');
      } else if (error.message && error.message.includes('localhost')) {
        setConnectionError('Cannot connect to backend server on shxz7-backend.hf.space. Please start the server.');
      } else if (error.message && error.message.includes('ECONNREFUSED')) {
        setConnectionError('Backend server refused connection. Please start the FastAPI server.');
      } else {
        setConnectionError(`Failed to create WebSocket connection: ${error.message || 'Unknown error'}`);
      }
      setIsConnected(false);
    }
  }, [userId]);

  const disconnect = useCallback(() => {
    if (ws.current) {
      if (ws.current.pingInterval) {
        clearInterval(ws.current.pingInterval);
      }
      ws.current.close(1000, 'User disconnected');
      ws.current = null;
      setIsConnected(false);
    }
  }, []);

  const sendMessage = useCallback((message) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  const sendTypingIndicator = useCallback((postId, userName, isTyping) => {
    return sendMessage({
      type: 'typing',
      post_id: postId,
      user_name: userName,
      is_typing: isTyping
    });
  }, [sendMessage]);

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    connectionError,
    sendMessage,
    sendTypingIndicator,
    connect,
    disconnect
  };
};