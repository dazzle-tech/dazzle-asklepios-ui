import React, { createContext, useState, useContext, ReactNode } from 'react';

// Define the type for your context
interface MyContextType {
  activeContent: React.ReactNode;
  setActiveContent: React.Dispatch<React.SetStateAction<React.ReactNode>>;
}

// Create the context with a default value
const MyContext = createContext<MyContextType | undefined>(undefined);

interface MyProviderProps {
  children: ReactNode;
}

const MyProvider: React.FC<MyProviderProps> = ({ children }) => {
  const [activeContent, setActiveContent] = useState<React.ReactNode>(null);

  return (
    <MyContext.Provider value={{ activeContent, setActiveContent }}>
      {children}
    </MyContext.Provider>
  );
};

// Hook to use the context
const useMyContext = () => {
  const context = useContext(MyContext);
  if (!context) {
    throw new Error('useMyContext must be used within a MyProvider');
  }
  return context;
};

export { MyContext, MyProvider, useMyContext };
