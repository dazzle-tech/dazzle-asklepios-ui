import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { useGetPatientAttachmentsListQuery } from '@/services/attachmentService';
import {
  useGetConsultationOrdersQuery,
  useSaveConsultationOrdersMutation
} from '@/services/encounterService';
import { ApConsultationOrder } from '@/types/model-types';
import { newApConsultationOrder } from '@/types/model-types-constructor';
import { initialListRequest, ListRequest } from '@/types/types';
import { notify } from '@/utils/uiReducerActions';
import { faPen, faPrint } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import BlockIcon from '@rsuite/icons/Block';
import CheckIcon from '@rsuite/icons/Check';
import React, { useEffect, useState } from 'react';
import { FaFileArrowDown } from 'react-icons/fa6';
import { IoIosMore } from 'react-icons/io';
import { MdAttachFile } from 'react-icons/md';
import CancellationModal from '@/components/CancellationModal';
import { Checkbox, Form, HStack, Tabs } from 'rsuite';
import Details from './Details';
import './styles.less';
import { formatDateWithoutSeconds } from '@/utils';
import AttachmentUploadModal from '@/components/AttachmentUploadModal';
import { useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import DetailsTele from './DetailsTele';
const handleDownload = attachment => {
  const byteCharacters = atob(attachment.fileContent);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: attachment.contentType });

  // Create a temporary  element and trigger the download
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = attachment.fileName;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
};
const Consultation = props => {
  const location = useLocation();

  const patient = props.patient || location.state?.patient;
  const encounter = props.encounter || location.state?.encounter;
  const edit = props.edit ?? location.state?.edit ?? false;
  const dispatch = useAppDispatch();
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedRowKey, setSelectedRowKey] = useState<number | null>(null);
  const [showCanceled, setShowCanceled] = useState(true);
  const [showPrev, setShowPrev] = useState(true);
  const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [openDetailsMdal, setOpenDetailsModal] = useState(false);
  const [openConfirmCancelModel, setOpenConfirmCancelModel] = useState(false);
  const [manualSearchTriggered, setManualSearchTriggered] = useState(false);
  const [record, setRecord] = useState({}); // Add this line to define 'record' state
  const [openModal, setOpenModal] = useState(false);
  const filters = [
    {
      fieldName: 'patient_key',
      operator: 'match',
      value: patient.key
    },
    {
      fieldName: 'status_lkey',
      operator: showCanceled ? 'notMatch' : 'match',
      value: '1804447528780744'
    }
  ];

  if (showPrev) {
    filters.push({
      fieldName: 'visit_key',
      operator: 'match',
      value: encounter.key
    });
  }
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters
  });
  const {
    data: consultationOrderListResponse,
    refetch: refetchCon,
    isLoading: consaultLoading
  } = useGetConsultationOrdersQuery(listRequest);

  const [saveconsultationOrders, saveConsultationOrdersMutation] =
    useSaveConsultationOrdersMutation();
  const [consultationOrders, setConsultationOrder] = useState<ApConsultationOrder>({
    ...newApConsultationOrder
  });
  const [attachmentsListRequest, setAttachmentsListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      },

      {
        fieldName: 'attachment_type',
        operator: 'match',
        value: 'CONSULTATION_ORDER'
      }
    ]
  });

  const {
    data: fetchPatintAttachmentsResponce,
    refetch: attachmentRefetch,
    isLoading: loadAttachment
  } = useGetPatientAttachmentsListQuery(attachmentsListRequest);

  const isSelected = rowData => {
    if (rowData && consultationOrders && rowData.key === consultationOrders.key) {
      return 'selected-row';
    } else return '';
  };

  useEffect(() => {
    if (!attachmentsModalOpen) {
      setConsultationOrder({ ...newApConsultationOrder });
      const updatedFilters = [
        {
          fieldName: 'deleted_at',
          operator: 'isNull',
          value: undefined
        },

        {
          fieldName: 'attachment_type',
          operator: 'match',
          value: 'CONSULTATION_ORDER'
        }
      ];
      setAttachmentsListRequest(prevRequest => ({
        ...prevRequest,
        filters: updatedFilters
      }));
    }
    attachmentRefetch();
  }, [attachmentsModalOpen]);
  useEffect(() => {
    const upateFilter = [
      {
        fieldName: 'visit_key',
        operator: 'match',
        value: encounter.key
      },
      {
        fieldName: 'status_lkey',
        operator: showCanceled ? 'notMatch' : 'match',
        value: '1804447528780744'
      }
    ];
    setListRequest(prevRequest => ({
      ...prevRequest,
      filters: upateFilter
    }));
  }, [showCanceled]);

  const handleCheckboxChange = key => {
    setSelectedRows(prev => {
      if (prev.includes(key)) {
        return prev.filter(item => item !== key);
      } else {
        return [...prev, key];
      }
    });
  };
  const OpenConfirmDeleteModel = () => {
    setOpenConfirmCancelModel(true);
  };
  const CloseConfirmDeleteModel = () => {
    setOpenConfirmCancelModel(false);
  };

  const handleClear = async () => {
    setConsultationOrder({
      ...newApConsultationOrder,
      consultationMethodLkey: null,
      consultationTypeLkey: null,
      cityLkey: null,
      consultantSpecialtyLkey: null,
      preferredConsultantKey: null
    });
  };
  const handleCancle = async () => {
    try {
      await Promise.all(
        selectedRows.map(item =>
          saveconsultationOrders({
            ...item,
            statusLkey: '1804447528780744',
            isValid: false,
            deletedAt: Date.now(),
            cancellationReason: consultationOrders?.cancellationReason
          }).unwrap()
        )
      );

      dispatch(notify('All orders deleted successfully'));

      refetchCon()
        .then(() => {
          console.log('Refetch complete');
        })
        .catch(error => {
          console.error('Refetch failed:', error);
        });
      setSelectedRows([]);
      CloseConfirmDeleteModel();
    } catch (error) {
      console.error('Encounter save failed:', error);
      dispatch(notify('One or more deleted failed'));
      CloseConfirmDeleteModel();
    }
  };
  const handleSubmit = async () => {
    try {
      await Promise.all(
        selectedRows.map(item =>
          saveconsultationOrders({
            ...item,
            submitDate: Date.now(),
            statusLkey: '1804482322306061'
          }).unwrap()
        )
      );

      dispatch(notify('All  Submitted successfully'));

      refetchCon()
        .then(() => {
          console.log('Refetch complete');
        })
        .catch(error => {
          console.error('Refetch failed:', error);
        });
      setSelectedRows([]);
    } catch (error) {
      console.error('Encounter save failed:', error);
      dispatch(notify('One or more saves failed'));
    }
  };
  const handelAddNew = () => {
    handleClear();
    setOpenDetailsModal(true);
    setEditing(false);
  };
  const handelAdd = () => {
    handleClear();
    setOpenModal(true);
    setEditing(false);
  };
  const tableColumns = [
    {
      key: '',
      dataKey: '',
      title: <Translate>#</Translate>,
      flexGrow: 1,
      render: rowData => (
        <Checkbox
          key={rowData.id}
          checked={selectedRows.includes(rowData)}
          onChange={() => handleCheckboxChange(rowData)}
          disabled={rowData.statusLvalue?.lovDisplayVale !== 'New'}
        />
      )
    },
    {
      key: 'createdAt ',
      dataKey: 'createdAt ',
      title: <Translate>CONSULTATION DATE</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return rowData.createdAt ? formatDateWithoutSeconds(rowData.createdAt) : '';
      }
    },
    {
      key: 'consultantSpecialtyLkey',
      dataKey: 'consultantSpecialtyLkey',
      title: <Translate>CONSULTANT SPECIALTY</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return rowData.consultantSpecialtyLvalue?.lovDisplayVale;
      }
    },
    {
      key: 'statusLkey',
      dataKey: 'statusLkey',
      title: <Translate>STATUS</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return rowData.statusLvalue.lovDisplayVale ?? null;
      }
    },
    {
      key: 'resposeStatusLkey',
      dataKey: 'resposeStatusLkey',
      title: <Translate>RESPOSE STATUS</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return rowData.resposeStatusLvalue?.lovDisplayVale;
      }
    },
    {
      key: '',
      dataKey: '',
      title: <Translate>VIEW RESPONSE</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return <IoIosMore size={22} fill="var(--primary-gray)" />;
      }
    },
    {
      key: '',
      dataKey: '',
      title: <Translate>ATTACHED FILE</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        const matchingAttachments = fetchPatintAttachmentsResponce?.object?.filter(
          item => item.referenceObjectKey === rowData.key
        );
        const lastAttachment = matchingAttachments?.[matchingAttachments.length - 1];

        return (
          <HStack spacing={2}>
            {lastAttachment && (
              <FaFileArrowDown
                size={20}
                fill="var(--primary-gray)"
                onClick={() => handleDownload(lastAttachment)}
                style={{ cursor: 'pointer' }}
              />
            )}

            <MdAttachFile
              size={20}
              fill="var(--primary-gray)"
              onClick={() => setAttachmentsModalOpen(true)}
              style={{ cursor: 'pointer' }}
            />
          </HStack>
        );
      }
    },

    {
      key: 'created',
      title: 'SUBMISSION AT/BY',
      expandable: true
    },
    {
      key: '',
      title: 'UPDATED AT/BY',
      render: (row: any) =>
        row?.updatedAt ? (
          <>
            {'keyForCurrentUser'} <br />
            <span className="date-table-style">
              {row.updatedAt ? formatDateWithoutSeconds(row.updatedAt) : ' '}
            </span>
          </>
        ) : (
          ' '
        ),
      expandable: true
    },
    {
      key: 'deletedAt',
      title: 'CANCELLED AT/BY',
      render: (row: any) =>
        row?.deletedAt ? (
          <>
            {'keyForCurrentUser'} <br />
            <span className="date-table-style">
              {row.deletedAt ? formatDateWithoutSeconds(row.deletedAt) : ' '}
            </span>
          </>
        ) : (
          ' '
        ),
      expandable: true
    },
    {
      key: 'cancellationReason',
      title: 'CANCELLATION REASON',
      dataKey: 'cancellationReason',
      expandable: true
    },
    {
      key: 'actions',
      title: <Translate>Actions</Translate>,
      flexGrow: 4
    }
  ];
  const pageIndex = listRequest.pageNumber - 1;

  // how many rows per page:
  const rowsPerPage = listRequest.pageSize;

  // total number of items in the backend:
  const totalCount = consultationOrderListResponse?.extraNumeric ?? 0;

  // handler when the user clicks a new page number:
  const handlePageChange = (_: unknown, newPage: number) => {
    // MUI gives you a zero-based page, so add 1 for your API
    setManualSearchTriggered(true);
    setListRequest({ ...listRequest, pageNumber: newPage + 1 });
  };

  // handler when the user chooses a different rows-per-page:
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setManualSearchTriggered(true);
    setListRequest({
      ...listRequest,
      pageSize: parseInt(event.target.value, 10),
      pageNumber: 1 // reset to first page
    });
  };
  const handleRowClick = (row: any) => {
    setSelectedRowKey(row.id); // row.id أو أي مفتاح فريد للصف
  };
  return (
    <div>
      <Tabs appearance="subtle" className="doctor-round-tabs" defaultActiveKey="1">
        <Tabs.Tab eventKey="1" title="Normal Consultation">
          <div className="bt-div">
            <MyButton
              onClick={handleSubmit}
              disabled={selectedRows.length === 0 || edit}
              prefixIcon={() => <CheckIcon />}
            >
              Submit
            </MyButton>
            <MyButton
              prefixIcon={() => <BlockIcon />}
              onClick={OpenConfirmDeleteModel}
              disabled={selectedRows.length === 0}
            >
              Cancle
            </MyButton>
            <MyButton
              appearance="ghost"
              disabled={selectedRows.length === 0}
              prefixIcon={() => <FontAwesomeIcon icon={faPrint} />}
            >
              Print
            </MyButton>
            <Checkbox
              checked={!showCanceled}
              onChange={() => {
                setShowCanceled(!showCanceled);
              }}
            >
              Show Cancelled
            </Checkbox>
            <Checkbox
              checked={!showPrev}
              onChange={() => {
                setShowPrev(!showPrev);
              }}
            >
              Show Previous Consultations
            </Checkbox>
            <div
              className={clsx('bt-right', {
                'disabled-panel': edit
              })}
            >
              <MyButton onClick={handelAddNew}>Add Consultation</MyButton>
            </div>
          </div>
          <MyTable
            columns={tableColumns}
            data={consultationOrderListResponse?.object ?? []}
            onRowClick={rowData => {
              setConsultationOrder(rowData);
              setEditing(rowData.statusLkey == '164797574082125' ? false : true);
            }}
            rowClassName={isSelected}
            loading={consaultLoading || (manualSearchTriggered && consaultLoading)}
            sortColumn={listRequest.sortBy}
            sortType={listRequest.sortType}
            onSortChange={(sortBy, sortType) => {
              setListRequest({ ...listRequest, sortBy, sortType });
            }}
            page={pageIndex}
            rowsPerPage={rowsPerPage}
            totalCount={totalCount}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </Tabs.Tab>
        <Tabs.Tab eventKey="2" title="Telephonic Consultation">
          <Form fluid>
            {/* Order Information */}
            <div className="section">
              <div className="bt-div">
                <MyButton
                  prefixIcon={() => <BlockIcon />}
                  onClick={OpenConfirmDeleteModel}
                  disabled={selectedRows.length === 0}
                >
                  Cancle
                </MyButton>
                <MyButton
                  appearance="ghost"
                  disabled={selectedRows.length === 0}
                  prefixIcon={() => <FontAwesomeIcon icon={faPrint} />}
                >
                  Print
                </MyButton>
                <Checkbox
                  checked={!showCanceled}
                  onChange={() => {
                    setShowCanceled(!showCanceled);
                  }}
                >
                  Show Cancelled
                </Checkbox>

                <div
                  className={clsx('bt-right', {
                    'disabled-panel': edit
                  })}
                >
                  <MyButton onClick={handelAdd}>Add Consultation</MyButton>
                </div>
              </div>
            </div>

            {/* Table Section */}
            <div className="section">
              <MyTable
                columns={[
                  {
                    key: '',
                    dataKey: '',
                    title: <Translate>#</Translate>,
                    render: rowData => <Checkbox key={rowData.id} />
                  },
                  { key: 'physician', title: 'Physician', dataKey: 'physician' },
                  { key: 'result', title: 'Result', dataKey: 'result' },
                  {
                    key: 'callDateTime',
                    title: 'CALL DATE/TIME',
                    render: (row: any) =>
                      row?.callDateTime ? (
                        <span className="date-table-style">
                          {formatDateWithoutSeconds(row.callDateTime)}
                        </span>
                      ) : (
                        ' '
                      )
                  },
                  {
                    key: 'cancellationReason',
                    title: 'CANCELLATION REASON',
                    dataKey: 'cancellationReason'
                  },
                  {
                    key: 'cancelledAtBy',
                    title: 'CANCELLED AT/BY',
                    render: (row: any) =>
                      row?.cancellationDatetime ? (
                        <>
                          {row?.cancelledByUser?.fullName || row.cancelledBy}
                          <br />
                          <span className="date-table-style">
                            {formatDateWithoutSeconds(row.cancellationDatetime)}
                          </span>
                        </>
                      ) : (
                        ' '
                      )
                  },
                  {
                    key: 'createdAtBy',
                    title: 'CREATED AT/BY',
                    render: (row: any) =>
                      row?.creationDatetime ? (
                        <>
                          {row?.createdByUser?.fullName || row.createdBy}
                          <br />
                          <span className="date-table-style">
                            {formatDateWithoutSeconds(row.creationDatetime)}
                          </span>
                        </>
                      ) : (
                        ' '
                      )
                  },
                  {
                    key: 'actions',
                    title: <Translate>Actions</Translate>,
                    render: (row: any) => (
                      <FontAwesomeIcon icon={faPen} className="icons-style font-aws" />
                    )
                  }
                ]}
                data={[
                  {
                    id: 1,
                    physician: 'Dr. Ali',
                    result: 'Follow-up needed',
                    callDateTime: '2025-06-30T11:00:00',
                    cancellationReason: 'Patient unavailable',
                    cancellationDatetime: '2025-06-30T10:50:00',
                    cancelledByUser: { fullName: 'Nurse Sara' },
                    creationDatetime: '2025-06-30T10:00:00',
                    createdByUser: { fullName: 'Patient Hassan' }
                  },
                  {
                    id: 2,
                    physician: 'Dr. Basel',
                    result: 'Completed',
                    callDateTime: '2025-06-30T12:00:00',
                    cancellationReason: '',
                    cancellationDatetime: '',
                    cancelledByUser: null,
                    creationDatetime: '2025-06-30T09:00:00',
                    createdByUser: { fullName: 'Patient Mosa' }
                  }
                ]}
                rowClassName={(row: any) => (row.id === selectedRowKey ? 'selected-row' : '')}
                onRowClick={handleRowClick}
              />
            </div>
          </Form>
        </Tabs.Tab>
      </Tabs>

      <CancellationModal
        title="Cancel Consultation "
        fieldLabel="Cancellation Reason"
        open={openConfirmCancelModel}
        setOpen={setOpenConfirmCancelModel}
        object={consultationOrders}
        setObject={setConsultationOrder}
        handleCancle={handleCancle}
        fieldName="cancellationReason"
      />
      <Details
        patient={patient}
        encounter={encounter}
        editing={editing}
        consultationOrders={consultationOrders}
        setConsultationOrder={setConsultationOrder}
        open={openDetailsMdal}
        setOpen={setOpenDetailsModal}
        refetchCon={refetchCon}
        edit={edit}
      />
      <DetailsTele
        patient={patient}
        encounter={encounter}
        editing={editing}
        consultationOrders={consultationOrders}
        setConsultationOrder={setConsultationOrder}
        open={openModal}
        setOpen={setOpenModal}
        refetchCon={refetchCon}
        edit={edit}
      />
      <AttachmentUploadModal
        isOpen={attachmentsModalOpen}
        setIsOpen={setAttachmentsModalOpen}
        actionType={'add'}
        refecthData={attachmentRefetch}
        attachmentSource={consultationOrders}
        attatchmentType="CONSULTATION_ORDER"
        patientKey={patient?.key}
      />
    </div>
  );
};
export default Consultation;
