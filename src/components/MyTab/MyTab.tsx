import { Tabs } from 'rsuite';
import React, { useState } from 'react';
import Translate from '../Translate';
import './styles.less';

interface TabDataItem {
  title: string;
  content: React.ReactNode;
  disabled?: boolean;
}

interface MyTabProps {
  data: TabDataItem[];
  defaultActiveKey?: string | number;
  appearance?: 'subtle' | 'tabs' | 'pills';
  className?: string;
  activeTab?: string | number;
  setActiveTab?: (key: string) => void;
  lazy?: boolean;
}

const MyTab: React.FC<MyTabProps> = ({
  data,
  defaultActiveKey = '1',
  appearance = 'subtle',
  className = '',
  activeTab,
  setActiveTab,
  lazy = false,
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState(String(defaultActiveKey));

  if (!Array.isArray(data)) return null;

  const isControlled = activeTab !== undefined && typeof setActiveTab === 'function';
  const currentActiveTab = isControlled ? String(activeTab) : internalActiveTab;

  const handleSelect = (key: any) => {
    if (!key) return;

    const selectedKey = String(key);

    if (isControlled) {
      setActiveTab?.(selectedKey);
    } else {
      setInternalActiveTab(selectedKey);
    }
  };

  return (
    <Tabs
      activeKey={currentActiveTab}
      onSelect={handleSelect}
      appearance={appearance}
      className={`tabs-style ${className}`}
    >
      {data.map((item, index) => {
        const eventKey = String(index + 1);
        const isActive = currentActiveTab === eventKey;

        return (
          <Tabs.Tab
            key={eventKey}
            eventKey={eventKey}
            title={<Translate>{item.title}</Translate>}
            disabled={item.disabled ?? false}
          >
            {!lazy || isActive ? item.content : null}
          </Tabs.Tab>
        );
      })}
    </Tabs>
  );
};

export default MyTab;