import MyButton from '@/components/MyButton/MyButton';
import React, { useEffect, useRef, useState } from 'react';
import './styles.less';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import { Checkbox } from 'rsuite';
import AddEditReferralRequest from './AddEditReferralRequest';
import PlusIcon from '@rsuite/icons/Plus';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import CancellationModal from '@/components/CancellationModal';
import ReferralRequestPreview from './ReferralRequestPreview';

const ReferralRequest = () => {
  const [referral, setReferral] = useState<any>({ referralType: '' });
  const [openAddEditReferralPopup, setOpenAddEditReferralPopup] = useState<boolean>(false);
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [cancelObject, setCancelObject] = useState<any>({});
  const [openCancelModal, setOpenCancelModal] = useState(false);
  const [openPreview, setOpenPreview] = useState(false);
  // Class name of selected row
  const isSelected = (rowData: any) => {
    if (rowData && referral && rowData.key === referral.key) {
      return 'selected-row';
    } else return '';
  };

  const data = [
    {
      key: '1',
      referralType: 'Internal',
      department: 'Emergency Department',
      referralReason: 'Specialist Consultation',
      notes: 'Referred for further evaluation and treatment',
      priority: 'High',
      createdBy: 'Dr. Ali',
      createdAt: '2025-08-01 09:15 AM',
      submittedBy: 'Nurse Nora',
      submittedAt: '2025-08-01 10:00 AM',
      cancelledBy: '',
      cancelledAt: '',
      cancelReason: ''
    },
    {
      key: '2',
      referralType: 'External',
      department: 'Internal Medicine',
      referralReason: 'Diagnostic Testing',
      notes: 'Patient referred externally for advanced diagnostic evaluation',
      priority: 'Medium',
      createdBy: 'Dr. Layla',
      createdAt: '2025-08-02 11:20 AM',
      submittedBy: 'Nurse Sarah',
      submittedAt: '2025-08-02 12:00 PM',
      cancelledBy: 'Admin Sam',
      cancelledAt: '2025-08-05 02:30 PM',
      cancelReason: 'Referral no longer needed'
    }
  ];

  //table columns
  const tableColumns = [
    {
      key: 'referralType',
      title: <Translate>Referral Type</Translate>
    },
    {
      key: 'department',
      title: <Translate>Department</Translate>
    },
    {
      key: 'referralReason',
      title: <Translate>Referral Reason</Translate>
    },
    {
      key: 'notes',
      title: <Translate>Notes</Translate>
    },
    {
      key: 'priority',
      title: <Translate>Priority</Translate>
    },
    {
      key: 'createdByAt',
      title: <Translate>Created By\At</Translate>,
      expandable: true,
      render: (rowData: any) => (
        <>
          {rowData.createdBy}
          <br />
          <span className="date-table-style">{rowData.createdAt}</span>
        </>
      )
    },
    {
      key: 'submittedByAt',
      title: <Translate>Submitted By\At</Translate>,
      expandable: true,
      render: (rowData: any) => (
        <>
          {rowData.submittedBy}
          <br />
          <span className="date-table-style">{rowData.submittedAt}</span>
        </>
      )
    },
    {
      key: 'cancelledByAt',
      title: <Translate>Cancelled By\At</Translate>,
      expandable: true,
      render: (rowData: any) =>
        rowData.cancelledBy ? (
          <>
            {rowData.cancelledBy}
            <br />
            <span className="date-table-style">{rowData.cancelledAt}</span>
          </>
        ) : (
          <i style={{ color: '#888' }}>Not cancelled</i>
        )
    },
    {
      key: 'cancelReason',
      title: <Translate>Cancellation Reason</Translate>,
      expandable: true,
      render: (rowData: any) =>
        rowData.cancelReason ? rowData.cancelReason : <i style={{ color: '#888' }}>N/A</i>
    }
  ];

  const handleNew = () => {
    setOpenAddEditReferralPopup(true);
    setReferral({ referralType: '' });
  };



  // ✅ Handle resize
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const tablebuttons = (
    <div className="table-buttons-container">
      <div className="left-group">
        <MyButton
          prefixIcon={() => <CloseOutlineIcon />}
          onClick={() => {
            setCancelObject({});
            setOpenCancelModal(true);
          }}
        >
          Cancel
        </MyButton>
        <Checkbox>Show Cancelled</Checkbox>
      </div>
      <MyButton
        color="var(--deep-blue)"
        prefixIcon={() => <PlusIcon />}
        onClick={handleNew}
        width="109px"
      >
        Add New
      </MyButton>
    </div>
  );

  const tableRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tableRef.current &&
        previewRef.current &&
        !tableRef.current.contains(event.target as Node) &&
        !previewRef.current.contains(event.target as Node)
      ) {
        setOpenPreview(false);
        setReferral({ referralType: '' });
      }
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div style={{ position: 'relative' }} ref={tableRef}>
      <MyTable
        height={450}
        data={data}
        tableButtons={tablebuttons}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={(rowData: any) => {
          if (referral?.key === rowData.key && openPreview) {
            setOpenPreview(false);
            setReferral({ referralType: '' });
          } else {
            setReferral(rowData);
            setOpenPreview(true);
          }
        }}
      />

      {openPreview && (
                <div ref={previewRef}>
          <ReferralRequestPreview referral={referral} onClose={() => setOpenPreview(false)} />
        </div>
      )}

      <AddEditReferralRequest
        open={openAddEditReferralPopup}
        setOpen={setOpenAddEditReferralPopup}
        width={width}
        referral={referral}
        setReferral={setReferral}
      />

      <CancellationModal
        open={openCancelModal}
        setOpen={setOpenCancelModal}
        object={cancelObject}
        setObject={setCancelObject}
        handleCancle={() => {
          console.log('Cancelled:', cancelObject);
          setOpenCancelModal(false);
        }}
        title="Cancel Assessment"
        fieldLabel="Reason for cancellation"
        fieldName="cancelReason"
      />
    </div>
  );
};

export default ReferralRequest;
