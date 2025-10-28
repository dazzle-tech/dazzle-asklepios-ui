// TelephonicConsultationUI.tsx
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import { faPrint } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import BlockIcon from '@rsuite/icons/Block';
import React, { useEffect, useRef, useState } from 'react';
import { MdModeEdit } from 'react-icons/md';
import { Checkbox } from 'rsuite';
import DetailsTele from './DetailsTele';
import './styles.less';

const TelephonicConsultation = () => {
  // Container that wraps ONLY the table; used to detect inside/outside clicks
  const tableContainerRef = useRef<HTMLDivElement | null>(null);

  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [consultationOrders, setConsultationOrder] = useState<any>({});
  const [selectedRow, setSelectedRow] = useState<any | null>(null);

  // Utility: is the event target within form-ish/editable elements?
  const isFormField = (node: EventTarget | null) => {
    if (!(node instanceof Element)) return false;
    return (
      node.closest(`
      input, textarea, select, button, [contenteditable="true"],
      .rs-input, .rs-picker, .rs-checkbox, .rs-btn, .rs-datepicker,
      .rs-picker-toggle, .rs-calendar, .rs-dropdown, .rs-auto-complete,
      .rs-input-group, .rs-select, .rs-slider
    `) !== null
    );
  };

  // Utility: ignore clicks inside modals/popups/menus
  const isInsideModalOrPopup = (node: EventTarget | null) => {
    if (!(node instanceof Element)) return false;
    return (
      node.closest(`
      .rs-modal, .rs-drawer, .rs-picker-select-menu, .rs-picker-popup,
      .my-modal, .my-popup
    `) !== null
    );
  };

  // Global listeners: click outside (or inside table but not on row) clears selection; ESC clears as well
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;

      // If click is inside table container, we DON'T immediately clear here.
      // onRowClick will set selection when a real row is clicked.
      if (tableContainerRef.current?.contains(target as Node)) return;

      // Ignore clicks on inputs/modals/menus
      if (isFormField(e.target) || isInsideModalOrPopup(e.target)) return;

      // Click is outside table and not on form/popup → clear selection
      setSelectedRow(null);
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedRow(null);
    };

    document.addEventListener('mousedown', handleGlobalClick);
    document.addEventListener('touchstart', handleGlobalClick);
    document.addEventListener('keydown', handleEsc);

    return () => {
      document.removeEventListener('mousedown', handleGlobalClick);
      document.removeEventListener('touchstart', handleGlobalClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  // Dummy patient/encounter for demo—replace with real props/state in your app
  const patient = { key: 'patient1', name: 'John Doe' };
  const encounter = { key: 'encounter1', date: '2025-09-15' };

  // Sample data
  const tableData = [
    {
      id: 1,
      physician: 'Dr. John Doe',
      result: 'Normal',
      callDateTime: '2025-09-15 10:30',
      cancellationReason: '',
      cancelledBy: 'Nurse Admin',
      cancelledAt: '2025-09-15 11:00',
      createdBy: 'Dr. Smith',
      createdAt: '2025-09-15 10:00'
    },
    {
      id: 2,
      physician: 'Dr. Jane Smith',
      result: 'Follow-up Needed',
      callDateTime: '2025-09-14 14:00',
      cancellationReason: 'Patient unavailable',
      cancelledBy: 'Nurse Admin',
      cancelledAt: '2025-09-14 14:30',
      createdBy: 'Dr. Brown',
      createdAt: '2025-09-14 13:50'
    }
  ];

  // Row highlighter: return "selected-row" CSS class for the selected row
  const isSelected = (rowData: any) =>
    selectedRow && rowData?.id === selectedRow?.id ? 'selected-row' : '';

  const tableColumns = [
    {
      key: 'select',
      title: '#',
      render: () => <Checkbox />
    },
    { key: 'physician', title: 'Physician', render: (row: any) => row.physician },
    { key: 'result', title: 'Result', render: (row: any) => row.result },
    {
      key: 'callDateTime',
      title: 'Call Date/Time',
      dataKey: 'callDateTime',
      width: 220,
      render: (row: any) => (
        <>
          {row.physician}
          <br />
          <span className="date-table-style">{row.callDateTime}</span>
        </>
      )
    },
    {
      key: 'cancellationReason',
      title: 'Cancellation Reason',
      render: (row: any) => row.cancellationReason
    },
    {
      key: 'cancelledAtBy',
      title: 'Cancelled At/By',
      dataKey: 'cancelledAtBy',
      width: 220,
      render: (row: any) => (
        <>
          {row.cancelledBy}
          <br />
          <span className="date-table-style">{row.cancelledAt}</span>
        </>
      )
    },
    {
      key: 'createdByAt',
      title: 'Created By/At',
      dataKey: 'createdByAt',
      width: 220,
      render: (row: any) => (
        <>
          {row.createdBy}
          <br />
          <span className="date-table-style">{row.createdAt}</span>
        </>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: () => (
        <div className="icons-consultation-main-container">
          <MdModeEdit size={24} fill="var(--primary-gray)" />
        </div>
      )
    }
  ];

  const tablebuttons = (
    <>
      <div className="table-buttons-left-part-handle-positions">
        <MyButton prefixIcon={() => <BlockIcon />}>Cancel</MyButton>
        <MyButton appearance="ghost" prefixIcon={() => <FontAwesomeIcon icon={faPrint} />}>
          Print
        </MyButton>
        <Checkbox>Show Cancelled</Checkbox>
      </div>
      <div className="bt-right">
        <MyButton onClick={() => setOpenDetailsModal(true)}>Add Consultation</MyButton>
      </div>
    </>
  );

  return (
    <div>
      <div>
        <div ref={tableContainerRef}>
          <MyTable
            columns={tableColumns}
            data={tableData}
            loading={false}
            tableButtons={tablebuttons}
            page={0}
            rowsPerPage={5}
            totalCount={tableData.length}
            onRowClick={row => setSelectedRow(row)} // set current selection
            rowClassName={isSelected} // highlight the selected row
          />
        </div>
      </div>

      {/* {selectedRow && (
        <div className="under-table-preview">
          <div className="preview-card">
            <div>
              <b>Physician:</b> {selectedRow.physician}
            </div>
            <div>
              <b>Result:</b> {selectedRow.result}
            </div>
            <div>
              <b>Call:</b> {selectedRow.callDateTime}
            </div>
          </div>
        </div>
      )} */}

      <DetailsTele
        patient={patient}
        encounter={encounter}
        consultationOrders={consultationOrders}
        setConsultationOrder={setConsultationOrder}
        open={openDetailsModal}
        setOpen={setOpenDetailsModal}
        refetchCon={() => console.log('refetch called')}
        editing={false}
        edit={false}
      />
    </div>
  );
};

export default TelephonicConsultation;
