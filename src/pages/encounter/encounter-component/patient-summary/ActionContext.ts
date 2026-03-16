import React, { createContext } from 'react';

type ActionFn = () => void;

export interface ActionContextValue {
  action?: ActionFn;
  setAction: React.Dispatch<React.SetStateAction<ActionFn>>;
}

export const ActionContext = createContext<ActionContextValue>({
  action: () => {},
  // Default implementation; real value is provided by `Encounter.tsx`
  setAction: (() => {}) as unknown as React.Dispatch<React.SetStateAction<ActionFn>>
});
