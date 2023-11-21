import { createContext, useContext, useMemo } from 'react';
import { Socket, io } from 'socket.io-client';

// Define the type for the context value
interface SocketContextProps {
  socket: Socket | null;
}
interface SocketProviderProps {
  children?: React.ReactNode
}

// Provide an initial value for the context
const SocketContext = createContext<SocketContextProps | null>(null);

// Custom hook for using socket
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context.socket;
}

export const SocketProvider = (props: SocketProviderProps) => {
  const socket = useMemo(() => io('localhost:3001'), []);

  // Wrap the socket in an object to match the context type
  const contextValue: SocketContextProps = { socket };

  return (
    <SocketContext.Provider value= { contextValue } >
    { props.children }
    </SocketContext.Provider>
  );
}
