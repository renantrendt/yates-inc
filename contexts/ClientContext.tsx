'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface Client {
  id: string;
  username: string;
  mail_handle: string;
}

interface ClientContextType {
  client: Client | null;
  setClient: (client: Client | null) => void;
  isClient: boolean;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const [client, setClientState] = useState<Client | null>(null);

  // Load client from localStorage on mount
  useEffect(() => {
    const savedClient = localStorage.getItem('yates-client');
    if (savedClient) {
      setClientState(JSON.parse(savedClient));
    }
  }, []);

  const setClient = (newClient: Client | null) => {
    setClientState(newClient);
    if (newClient) {
      localStorage.setItem('yates-client', JSON.stringify(newClient));
    } else {
      localStorage.removeItem('yates-client');
    }
  };

  const isClient = client !== null;

  return (
    <ClientContext.Provider value={{ client, setClient, isClient }}>
      {children}
    </ClientContext.Provider>
  );
}

export function useClient() {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useClient must be used within a ClientProvider');
  }
  return context;
}


