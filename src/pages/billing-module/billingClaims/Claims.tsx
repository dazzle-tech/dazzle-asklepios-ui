import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import SettlementReportPanel from '@/pages/billing-module/settlementReport/SettlementReport';

import ClaimsWorkspace from './ClaimsWorkspace';
import './styles.less';

type ClaimsTab = 'claims' | 'settlement';

const ClaimsScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<ClaimsTab>(
    searchParams.get('tab') === 'settlement' ? 'settlement' : 'claims'
  );

  useEffect(() => {
    dispatch(setPageCode('Claims'));
    dispatch(setDivContent('Claims'));
  }, [dispatch]);

  const handleTabChange = (tab: ClaimsTab) => {
    setActiveTab(tab);
    if (tab === 'settlement') {
      setSearchParams({ tab: 'settlement' }, { replace: true });
      return;
    }
    setSearchParams({}, { replace: true });
  };

  return (
    <div className="bc-page" data-page="billing-claims-v2">
      <header className="bc-toolbar">
        <div className="bc-toolbar__main">
          <div className="bc-toolbar__title-wrap">
            <span className="bc-toolbar__eyebrow">Waseel</span>
            <h1 className="bc-toolbar__title">Insurance Claims</h1>
          </div>
        </div>

        <nav className="bc-tabs" aria-label="Claims sections">
          <button
            type="button"
            className={`bc-tab${activeTab === 'claims' ? ' bc-tab--active' : ''}`}
            onClick={() => handleTabChange('claims')}
          >
            Claims
          </button>
          <button
            type="button"
            className={`bc-tab${activeTab === 'settlement' ? ' bc-tab--active' : ''}`}
            onClick={() => handleTabChange('settlement')}
          >
            Settlement Report
          </button>
        </nav>
      </header>

      {activeTab === 'claims' ? <ClaimsWorkspace /> : <SettlementReportPanel />}
    </div>
  );
};

export default ClaimsScreen;
