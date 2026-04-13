import React, { useMemo, useState,useEffect,useRef } from 'react';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import UccMedicationOrderAddModal from './UccMedicationOrderAddModal';
import CancellationModal from '@/components/CancellationModal';
import PlusIcon from '@rsuite/icons/Plus';
import { Tooltip, Whisper } from 'rsuite';
import CheckRoundIcon from '@rsuite/icons/CheckRound';
import WarningRoundIcon from '@rsuite/icons/WarningRound';
import { Checkbox } from 'rsuite';
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const initialSampleData = [
  {
    id: 1,
    medicationName: 'Paracetamol 500mg',
    medicationClass: 'Analgesic',
    isHighAlert: false,
    instructions: 'Take 1 tablet every 6 hours',
    status: 'NEW',
    addedBy: 'Dr. Rami',
    addedAt: '2026-04-10 10:30 AM',
    cancelled: false
  },
  {
    id: 2,
    medicationName: 'Insulin',
    medicationClass: 'Hormone',
    isHighAlert: true,
    instructions: 'Injectaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaasssssssssssss sssssssssssssssssssssssssssssssssssssssssssssssssssssss sssssssssssssssssssssssssssss before meals',
    status: 'NEW',
    addedBy: 'Nurse Layla',
    addedAt: '2026-04-09 01:15 PM',
    cancelled: false
  },
  {
    id: 3,
    medicationName: 'Amoxicillin',
    medicationClass: 'Antibiotic',
    isHighAlert: false,
    instructions: 'Take every 8 hours',
    status: 'SUBMITTED',
    addedBy: 'Dr. Ahmad',
    addedAt: '2026-04-08 08:45 AM',
    cancelled: false
  },
  {
    id: 4,
    medicationName: 'Heparin',
    medicationClass: 'Anticoagulant',
    isHighAlert: true,
    instructions: 'IV infusion',
    status: 'CANCELED',
    cancelReason: 'Bleeding risk',
    addedBy: 'Dr. Sara',
    addedAt: '2026-04-07 11:20 AM',
    cancelled: true
  }
];

const UccMedicationOrder = () => {
  const dispatch = useAppDispatch();



  const [rows, setRows] = useState(initialSampleData);
  const [selectedIds, setSelectedIds] = useState([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [openCancel, setOpenCancel] = useState(false);

  const [cancelObject, setCancelObject] = useState({
    cancelReason: ''
  });

  const selectedRows = useMemo(
    () => rows.filter(r => selectedIds.includes(r.id)),
    [rows, selectedIds]
  );

  const handleAdd = newRow => {
    setRows(prev => [newRow, ...prev]);
  };

  const toggleRow = (row: any, checked: boolean) => {
    if (row.status !== 'NEW') return;

    setSelectedIds(prev =>
      checked
        ? prev.includes(row.id)
          ? prev
          : [...prev, row.id]
        : prev.filter(id => id !== row.id)
    );
  };

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(selectableIds);
    } else {
      setSelectedIds([]);
    }
  };

  const selectableRows = useMemo(
    () => rows.filter(r => r.status === 'NEW'),
    [rows]
  );

  const selectableIds = useMemo(
    () => selectableRows.map(r => r.id),
    [selectableRows]
  );

  const isAllSelected =
    selectableIds.length > 0 &&
    selectableIds.every(id => selectedIds.includes(id));

  const isIndeterminate =
    selectedIds.length > 0 && !isAllSelected;

  const columns = [
    {
      key: 'select',
      title: (
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={isAllSelected}
            indeterminate={isIndeterminate}
            onChange={(_, checked, event) => {
              event?.stopPropagation?.();
              toggleAll(checked);
            }}
          />
        </div>
      ),
      align: 'center' as const,
      width: 60,
      render: (row: any) => {
        const disabled = row.status !== 'NEW';

        return (
          <Checkbox
            checked={selectedIds.includes(row.id)}
            disabled={disabled}
            onChange={(_, checked) => toggleRow(row, checked)}
            onClick={(e) => e.stopPropagation()}
          />
        );
      }
    },
    {
      key: 'medicationName',
      title: <Translate>MEDICATION NAME</Translate>
    },
    {
      key: 'medicationClass',
      title: <Translate>Medication Class</Translate>
    },
    {
      key: 'isHighAlert',
      title: <Translate>High Risk Med</Translate>,
      render: row => (row.isHighAlert ? <FontAwesomeIcon icon={faTriangleExclamation} className="high-risk-icon-style" /> : '')
    },
    {
      key: 'instructions',
      title: <Translate>INSTRUCTIONS</Translate>,
      render: (row: any) => {
        const text = row.instructions;

        const TextWithTooltip = () => {
          const ref = useRef<HTMLDivElement>(null);
          const [isTruncated, setIsTruncated] = useState(false);

          useEffect(() => {
            const el = ref.current;
            if (el) {
              setIsTruncated(el.scrollHeight > el.clientHeight);
            }
          }, [text]);

          const content = (
            <div
              ref={ref}
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                cursor: isTruncated ? 'pointer' : 'default',
                maxWidth: 250,
                overflowWrap: 'anywhere',
                wordBreak: 'break-word'
              }}
            >
              {text}
            </div>
          );

          if (!isTruncated) return content;

          return (
            <Whisper
              placement="top"
              trigger="hover"
              speaker={<Tooltip>{text}</Tooltip>}
            >
              {content}
            </Whisper>
          );
        };

        return <TextWithTooltip />;
      }
    },
    {
      key: 'status',
      title: <Translate>STATUS</Translate>
    },
    {
      key: 'actions',
      title: <Translate>ACTIONS</Translate>,
      align: 'center',
      render: (row: any) => {
        const canSubmit = row.status === 'NEW';
        const canCancel = row.status === 'NEW';

        return (
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>

            <Whisper
              placement="top"
              trigger="hover"
              speaker={<Tooltip>Submit</Tooltip>}
            >
              <span>
                <CheckRoundIcon
                  id={`submit-${row.id}`}
                  className="icon-laboratory-size"
                  style={{
                    cursor: canSubmit ? 'pointer' : 'not-allowed',
                    opacity: canSubmit ? 1 : 0.4,
                    color: 'var(--primary-gray)'
                  }}
                  onClick={() => {
                    if (!canSubmit) return;

                    setRows(prev =>
                      prev.map(r =>
                        r.id === row.id
                          ? { ...r, status: 'SUBMITTED' }
                          : r
                      )
                    );
                  }}
                />
              </span>
            </Whisper>

            <Whisper
              placement="top"
              trigger="hover"
              speaker={<Tooltip>Cancel</Tooltip>}
            >
              <span>
                <WarningRoundIcon
                  id={`cancel-${row.id}`}
                  className="icon-laboratory-size"
                  style={{
                    cursor: canCancel ? 'pointer' : 'not-allowed',
                    opacity: canCancel ? 1 : 0.4,
                    color: 'var(--primary-gray)'
                  }}
                  onClick={() => {
                    if (!canCancel) return;

                    setSelectedIds([row.id]);
                    setOpenCancel(true);
                  }}
                />
              </span>
            </Whisper>

          </div>
        );
      }
    }
  ];



  const tableButtons = (
    <>

      <MyButton
        color="var(--deep-blue)"
        onClick={() => setOpenAdd(true)}
        prefixIcon={() => <PlusIcon />}
      >
        Add
      </MyButton>
    </>
  );


// Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <div dir={dir}>

      <MyTable
        height={450}
        data={initialSampleData}
        columns={columns}
        tableButtons={tableButtons}
      />

      <UccMedicationOrderAddModal
        open={openAdd}
        setOpen={setOpenAdd}
        onAdd={handleAdd}
      />

      <CancellationModal
        open={openCancel}
        setOpen={setOpenCancel}
        handleCancle={{}}
        object={cancelObject}
        setObject={setCancelObject}
        fieldName="cancelReason"
        fieldLabel="CANCELLATION_REASON"
        title="Cancel Medication"
        required
      />

    </div>
  );
};

export default UccMedicationOrder;