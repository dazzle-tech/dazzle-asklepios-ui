
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import SettlementReportPanel from '@/pages/billing-module/settlementReport/SettlementReport';

import ClaimsWorkspace from './ClaimsWorkspace';
import BillersWorkspace from './BillersWorkspace';
import './styles.less';

type ClaimsTab = 'claims' | 'settlement' | 'billers';

const ClaimsScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const getInitialTab = (): ClaimsTab => {
    const tab = searchParams.get('tab');

    if (tab === 'settlement' || tab === 'billers') {
      return tab;
    }

    return 'claims';
  };

  const [activeTab, setActiveTab] = useState<ClaimsTab>(getInitialTab);

  useEffect(() => {
    dispatch(setPageCode('Claims'));
    dispatch(setDivContent('Claims'));
  }, [dispatch]);

  const handleTabChange = (tab: ClaimsTab) => {
    setActiveTab(tab);

    if (tab === 'claims') {
      setSearchParams({}, { replace: true });
      return;
    }

    setSearchParams({ tab }, { replace: true });
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
           <button
            type="button"
            className={`bc-tab${activeTab === 'billers' ? ' bc-tab--active' : ''}`}
            onClick={() => handleTabChange('billers')}
          >
            Pre-Claim Clinical & Coding Review
          </button>
        </nav>
      </header>

      {activeTab === 'claims' && <ClaimsWorkspace />}

      {activeTab === 'billers' && <BillersWorkspace />}

      {activeTab === 'settlement' && <SettlementReportPanel />}
    </div>
  );
};

export default ClaimsScreen;