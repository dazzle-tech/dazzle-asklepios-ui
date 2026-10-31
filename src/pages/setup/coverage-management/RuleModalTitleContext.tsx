import { createContext, useContext } from 'react';

type RuleModalTitleContextValue = {
  className?: string | null;
  tabLabel?: string | null;
};

const RuleModalTitleContext = createContext<RuleModalTitleContextValue>({});

export const RuleModalTitleProvider = RuleModalTitleContext.Provider;

/**
 * Popup titles inside the class rule tabs show the class name and the active tab,
 * e.g. "Coverage Rule - Class A - Coverage Limit". Outside the class tabs
 * (TPA rules) the title stays as it is.
 */
export const useRuleModalTitle = () => {
  const { className, tabLabel } = useContext(RuleModalTitleContext);
  return (title: string) => [title, className, tabLabel].filter(Boolean).join(' - ');
};
