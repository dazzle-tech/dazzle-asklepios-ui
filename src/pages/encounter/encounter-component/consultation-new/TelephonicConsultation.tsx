import CancellationModal from '@/components/CancellationModal';
import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import { useAppDispatch } from '@/hooks';
import EncounterAttachment from '@/pages/patient/patient-profile/tabs/Attachment-new/EncounterAttachment';
import {
  useGetTelephonicConsultationOrdersListQuery,
  useSaveTelephonicConsultationOrderMutation
} from '@/services/encounterService';
import { useGetAllPractitionersQuery } from '@/services/setup/practitioner/PractitionerService';
import { newApTelephonicConsultation } from '@/types/model-types-constructor';
import { initialListRequest } from '@/types/types';
import { formatDateWithoutSeconds } from '@/utils';
import { notify } from '@/utils/uiReducerActions';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import BlockIcon from '@rsuite/icons/Block';
import clsx from 'clsx';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MdAttachFile, MdModeEdit } from 'react-icons/md';
import { useLocation } from 'react-router-dom';
import { Checkbox } from 'rsuite';
import DetailsTele from './DetailsTele';
import './styles.less';

const TelephonicConsultation = props => {
  const location = useLocation();
  const loggedInUser = JSON.parse(localStorage.getItem('user') || 'null');

  const currentPatient = props.patient || location.state?.patient;
  const currentEncounter = props.encounter || location.state?.encounter;
  const isEditMode = props.edit ?? location.state?.edit ?? false;

  const tableContainerRef = useRef<HTMLDivElement | null>(null);

  const dispatch = useAppDispatch();
  const [saveConsultationOrder] = useSaveTelephonicConsultationOrderMutation();

  const [selectedConsultations, setSelectedConsultations] = useState<any[]>([]);
  const [showCancelled, setShowCancelled] = useState(false);

  const [activeConsultation, setActiveConsultation] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAttachmentsModalOpen, setIsAttachmentsModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const [consultationFormData, setConsultationFormData] = useState({
    ...newApTelephonicConsultation
  });

  const [consultationListRequest, setConsultationListRequest] = useState({
    ...initialListRequest,
    pageSize: 20,
    filters: [
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      },
      {
        fieldName: 'patient_key',
        operator: 'match',
        value: currentPatient?.key
      },
      {
        fieldName: 'encounter_key',
        operator: 'match',
        value: currentEncounter?.key
      }
    ]
  });

  const { data: consultationListResponse, isLoading } =
    useGetTelephonicConsultationOrdersListQuery(consultationListRequest);

  const { data: practitionerResponse } = useGetAllPractitionersQuery({
    page: 0,
    size: 9999,
    sort: 'id,asc'
  });

  const physicianList =
    practitionerResponse?.data?.filter(practitioner => practitioner.jobRole === 'PHYSICIAN') ?? [];

  const totalCount = consultationListResponse?.extraNumeric ?? 0;
  const pageIndex = consultationListRequest.pageNumber - 1;
  const rowsPerPage = consultationListRequest.pageSize;

  const isFormField = (node: EventTarget | null) => {
    if (!(node instanceof Element)) return false;
    return (
      node.closest(`
        input, textarea, select, button,
        .rs-input, .rs-picker, .rs-checkbox, .rs-btn,
        .rs-picker-toggle, .rs-calendar, .rs-dropdown
      `) !== null
    );
  };

  const isInsideModalOrPopup = (node: EventTarget | null) => {
    if (!(node instanceof Element)) return false;
    return node.closest('.rs-modal, .rs-picker-popup, .my-modal') !== null;
  };

  const isDataRow = (node: EventTarget | null) => {
    if (!(node instanceof Element)) return false;
    return node.closest('.rs-table-row') && !node.closest('.rs-table-row-header');
  };

  const clearRowSelection = useCallback(() => {
    setActiveConsultation(null);
    setSelectedConsultations([]);
  }, []);

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target;

      if (isFormField(target) || isInsideModalOrPopup(target)) return;

      const insideTable = tableContainerRef.current?.contains(target as Node);
      const isRowClick = isDataRow(target);

      if (!insideTable) return clearRowSelection();
      if (insideTable && !isRowClick) return clearRowSelection();
    };

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') clearRowSelection();
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [clearRowSelection]);

  const handleOpenAttachments = rowData => {
    setConsultationFormData(rowData);
    setIsAttachmentsModalOpen(true);
  };

  const getRowClassName = row => (activeConsultation?.key === row?.key ? 'selected-row' : '');

  const handleCheckboxChange = (rowData: any) => {
    setSelectedConsultations(previous => {
      if (previous.includes(rowData)) {
        return previous.filter(item => item !== rowData);
      }
      return [...previous, rowData];
    });
  };

  const columns = [
    {
      key: 'select',
      title: '#',
      flexGrow: 1,
      render: (rowData: any) => (
        <Checkbox
          checked={selectedConsultations.includes(rowData)}
          onChange={() => handleCheckboxChange(rowData)}
          disabled={rowData.isValid === false}
        />
      )
    },
    {
      key: 'physician',
      title: 'Physician',
      flexGrow: 2,
      render: row => {
        const physician = physicianList.find(item => item?.id === row?.physician);
        return <p>{physician?.firstName + ' ' + physician?.lastName}</p>;
      }
    },
    {
      key: 'dateOfCall',
      title: 'Date Of Call',
      flexGrow: 2,
      render: row => (row.dateOfCall ? new Date(row.dateOfCall).toLocaleString() : '')
    },
    {
      key: 'consultationContent',
      title: 'Consultation Content',
      flexGrow: 4,
      render: row => <div className="consultation-content-container">{row.consultationContent}</div>
    },
    {
      key: 'attachments',
      title: 'Attachments',
      flexGrow: 1,
      render: row => (
        <MdAttachFile
          size={20}
          fill={row?.key ? 'var(--primary-gray)' : '#ccc'}
          onClick={() => row?.key && handleOpenAttachments(row)}
          style={{
            cursor: row?.key ? 'pointer' : 'not-allowed'
          }}
        />
      )
    },
    {
      key: 'edit',
      title: '',
      flexGrow: 1,
      render: row => (
        <MdModeEdit
          size={22}
          fill="var(--primary-gray)"
          style={{ cursor: 'pointer' }}
          onClick={() => {
            setActiveConsultation(row);
            setConsultationFormData(row);
            setIsDetailsModalOpen(true);
          }}
        />
      )
    },
    {
      key: 'createdAt',
      title: 'CREATED BY/AT',
      expandable: true,
      render: row =>
        row?.createdAt ? (
          <>
            {row?.createdBy}
            <br />
            <span className="date-table-style">{formatDateWithoutSeconds(row.createdAt)}</span>
          </>
        ) : (
          ' '
        )
    },
    {
      key: 'deletedAt',
      title: 'CANCELLED BY/AT',
      expandable: true,
      render: row =>
        row?.deletedAt ? (
          <>
            {row?.deletedBy}
            <br />
            <span className="date-table-style">{formatDateWithoutSeconds(row?.deletedAt)}</span>
          </>
        ) : (
          ' '
        )
    },
    {
      key: 'cancellationReason',
      title: 'Cancellation Reason',
      expandable: true
    }
  ];

  const handleCancelConsultations = async () => {
    try {
      await Promise.all(
        selectedConsultations.map(item =>
          saveConsultationOrder({
            ...item,
            isValid: false,
            deletedAt: Date.now(),
            deletedBy: loggedInUser?.firstName + ' ' + loggedInUser?.lastName,
            cancellationReason: consultationFormData?.cancellationReason
          }).unwrap()
        )
      );

      dispatch(notify('All consultations cancelled'));
      setSelectedConsultations([]);
      setIsCancelModalOpen(false);

      setConsultationListRequest(prev => ({
        ...prev,
        timestamp: Date.now()
      }));
    } catch {
      dispatch(notify('Cancel failed'));
    }
  };

  const handlePageChange = (_: any, newPage: number) => {
    setConsultationListRequest({
      ...consultationListRequest,
      pageNumber: newPage + 1
    });
  };

  const handleRowsPerPageChange = e => {
    setConsultationListRequest({
      ...consultationListRequest,
      pageSize: Number(e.target.value),
      pageNumber: 1
    });
  };

  const tableButtons = (
    <div className="bt-div-2">
      <div className="bt-left-2">
        <MyButton
          prefixIcon={() => <BlockIcon />}
          onClick={() => setIsCancelModalOpen(true)}
          disabled={selectedConsultations.length === 0}
        >
          Cancel
        </MyButton>

        <Checkbox checked={showCancelled} onChange={() => setShowCancelled(prev => !prev)}>
          Show Cancelled
        </Checkbox>
      </div>

      <div
        className={clsx('bt-right-2', {
          'disabled-panel': isEditMode
        })}
      >
        <MyButton
          prefixIcon={() => <FontAwesomeIcon icon={faPlus} />}
          onClick={() => {
            setActiveConsultation(null);
            setConsultationFormData({
              ...newApTelephonicConsultation,
              patientKey: currentPatient?.key,
              encounterKey: currentEncounter?.key,
              createdBy: 'Admin'
            });
            setIsDetailsModalOpen(true);
          }}
        >
          Add Consultation
        </MyButton>
      </div>
    </div>
  );

  useEffect(() => {
    setConsultationListRequest(prev => ({
      ...prev,
      filters: [
        {
          fieldName: 'is_valid',
          operator: 'equal',
          value: !showCancelled
        },
        {
          fieldName: 'patient_key',
          operator: 'match',
          value: currentPatient?.key
        }
      ]
    }));
  }, [showCancelled, currentPatient?.key]);

  return (
    <div>
      <div ref={tableContainerRef}>
        <MyTable
          height={450}
          loading={isLoading}
          data={consultationListResponse?.object || []}
          columns={columns}
          rowClassName={getRowClassName}
          page={pageIndex}
          rowsPerPage={rowsPerPage}
          totalCount={totalCount}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          onRowClick={row => setActiveConsultation(row)}
          tableButtons={tableButtons}
        />
      </div>

      <DetailsTele
        patient={currentPatient}
        encounter={currentEncounter}
        consultationOrders={consultationFormData}
        setConsultationOrder={setConsultationFormData}
        open={isDetailsModalOpen}
        setOpen={value => {
          setIsDetailsModalOpen(value);
          setConsultationListRequest({
            ...consultationListRequest,
            timestamp: Date.now()
          });
        }}
        editing={false}
        edit={false}
        refetchCon={() =>
          setConsultationListRequest({
            ...consultationListRequest,
            timestamp: Date.now()
          })
        }
      />

      <MyModal
        open={isAttachmentsModalOpen}
        setOpen={setIsAttachmentsModalOpen}
        title="Attachments - Telephonic Consultation"
        size="lg"
        hideActionBtn={true}
        content={
          <EncounterAttachment
            localEncounter={currentEncounter}
            source="TELEPHONIC_CONSULTATION_ORDER_ATTACHMENT"
            sourceId={consultationFormData?.key ? Number(consultationFormData.key) : undefined}
            refetchAttachmentList={false}
            setRefetchAttachmentList={() => {}}
          />
        }
      />

      <CancellationModal
        title="Cancel Telephonic Consultation"
        fieldLabel="Cancellation Reason"
        open={isCancelModalOpen}
        setOpen={setIsCancelModalOpen}
        object={consultationFormData}
        setObject={setConsultationFormData}
        handleCancle={handleCancelConsultations}
        fieldName="cancellationReason"
        required={true}
      />
    </div>
  );
};

export default TelephonicConsultation;
