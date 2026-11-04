import MyModal from '@/components/MyModal/MyModal';
import { useGetDiagnosticTestByIdQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import React from 'react';
import { Loader } from 'rsuite';
import './style.less';

const ViewDiagnosticTestModal = ({ open, setOpen, diagnosticTestId }) => {
  const { data, isFetching } = useGetDiagnosticTestByIdQuery(diagnosticTestId, {
    skip: !diagnosticTestId || !open
  });

  const tableData = data?.data;

  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <div dir={dir}>
      <MyModal
        open={open}
        setOpen={setOpen}
        title="Diagnostic Test Details"
        hideActionBtn
        size="650px"
        content={
          isFetching ? (
            <Loader center content="Loading..." />
          ) : data ? (
            <div className="dt-card">
              {/* Header */}
              <div className="dt-header">
                <div className="dt-title">{tableData?.name}</div>
                <div className="dt-badge">{tableData?.type}</div>
              </div>

              {/* Body Grid */}
              <div className="dt-grid">
                <div className="dt-item">
                  <span className="dt-label">Internal Code</span>
                  <span className="dt-value">{tableData?.internalCode || '—'}</span>
                </div>

                <div className="dt-item">
                  <span className="dt-label">Price</span>
                  <span className="dt-price">
                    {tableData?.price ? `${tableData.price} ${tableData?.currency || ''}` : '—'}
                  </span>
                </div>

                <div className="dt-item dt-notes">
                  <span className="dt-label">Notes</span>
                  <span className="dt-value">{tableData?.specialNotes || 'No special notes'}</span>
                </div>
              </div>
            </div>
          ) : (
            <p>No data found</p>
          )
        }
      />
    </div>
  );
};

export default ViewDiagnosticTestModal;
