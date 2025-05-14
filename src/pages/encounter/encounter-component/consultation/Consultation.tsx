import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { useFetchAttachmentByKeyQuery, useFetchAttachmentQuery, useGetPatientAttachmentsListQuery } from '@/services/attachmentService';
import { useGetConsultationOrdersQuery, useSaveConsultationOrdersMutation } from '@/services/encounterService';
import { ApConsultationOrder } from '@/types/model-types';
import { newApConsultationOrder } from '@/types/model-types-constructor';
import { initialListRequest, ListRequest } from '@/types/types';
import { notify } from '@/utils/uiReducerActions';
import { faPrint } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import BlockIcon from '@rsuite/icons/Block';
import CheckIcon from '@rsuite/icons/Check';
import React, { useEffect, useState } from 'react';
import { FaFileArrowDown } from "react-icons/fa6";
import { IoIosMore } from "react-icons/io";
import { MdAttachFile, MdModeEdit } from 'react-icons/md';
import CancellationModal from '@/components/CancellationModal';
import { Checkbox, HStack } from 'rsuite';
import Details from './Details';
import './styles.less';
import AttachmentUploadModal from '@/components/AttachmentUploadModal';
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
const Consultation = ({ edit, patient, encounter }) => {
  const dispatch = useAppDispatch();
  const [selectedRows, setSelectedRows] = useState([]);
  const [showCanceled, setShowCanceled] = useState(true);
  const [showPrev, setShowPrev] = useState(true);
  const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [openDetailsMdal, setOpenDetailsModal] = useState(false);
  const [openConfirmCancelModel, setOpenConfirmCancelModel] = useState(false);
  const [manualSearchTriggered, setManualSearchTriggered] = useState(false);
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
  const { data: consultationOrderListResponse, refetch: refetchCon, isLoading: consaultLoading } = useGetConsultationOrdersQuery(listRequest);

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
        fieldName: 'reference_object_key',
        operator: "match",
        value: consultationOrders?.key
      }
    ]
  });

  const { data: fetchPatintAttachmentsResponce, refetch: attachmentRefetch, isLoading: loadAttachment } = useGetPatientAttachmentsListQuery(attachmentsListRequest, { skip: !consultationOrders?.key });

  console.log("attach :", fetchPatintAttachmentsResponce?.object[0])
  const isSelected = rowData => {
    if (rowData && consultationOrders && rowData.key === consultationOrders.key) {
      return 'selected-row';
    } else return '';
  };

  useEffect(() => {
    const updatedFilters = [
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      },
      {
        fieldName: 'reference_object_key',
        operator: "match",
        value: consultationOrders?.key
      }
    ];
    setAttachmentsListRequest((prevRequest) => ({
      ...prevRequest,
      filters: updatedFilters,
    }));
  }, [consultationOrders])
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
    ]
    setListRequest((prevRequest) => ({
      ...prevRequest,
      filters: upateFilter,
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
  }

  const tableColumns = [
    {
      key: "",
      dataKey: "",
      title: <Translate>#</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return <Checkbox
          key={rowData.id}
          checked={selectedRows.includes(rowData)}
          onChange={() => handleCheckboxChange(rowData)}
          disabled={rowData.statusLvalue?.lovDisplayVale !== 'New'}
        />;
      }

    },
    {
      key: "createdAt ",
      dataKey: "createdAt ",
      title: <Translate>CONSULTATION DATE</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return rowData.createdAt ? new Date(rowData.createdAt).toLocaleString() : '';
      }

    },
    {
      key: "consultantSpecialtyLkey",
      dataKey: "consultantSpecialtyLkey",
      title: <Translate>CONSULTANT SPECIALTY</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return rowData.consultantSpecialtyLvalue?.lovDisplayVale;
      }

    },
    {
      key: "statusLkey",
      dataKey: "statusLkey",
      title: <Translate>STATUS</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return rowData.statusLvalue.lovDisplayVale ?? null;
      }

    },
    {
      key: "resposeStatusLkey",
      dataKey: "resposeStatusLkey",
      title: <Translate>RESPOSE STATUS</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return rowData.resposeStatusLvalue?.lovDisplayVale;
      }

    },
    {
      key: "",
      dataKey: "",
      title: <Translate>VIEW RESPONSE</Translate>,
      flexGrow: 1,
      render: (rowData: any) => { return <IoIosMore size={22} fill="var(--primary-gray)" />; }
    },
    {
      key: "",
      dataKey: "",
      title: <Translate>ATTACHED FILE</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return<HStack>
          <MyButton
          onClick={() => handleDownload(fetchPatintAttachmentsResponce?.object[fetchPatintAttachmentsResponce?.object.length-1])}
        ><FaFileArrowDown /></MyButton>
        <MyButton
        onClick={()=>setAttachmentsModalOpen(true)}
        ><MdAttachFile /></MyButton>
        </HStack>
         
      }
    },
    {
      key: "",
      dataKey: "",
      title: <Translate>EDIT</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return <MdModeEdit
          title="Edit"
          size={24}
          fill="var(--primary-gray)"
          onClick={() => setOpenDetailsModal(true)}
        />;
      }

    },
    {
      key: '',
      title: 'SUBMISSION AT/BY',
      expandable: true,
    },
    {
      key: '',
      title: 'CREATED AT/BY',
      expandable: true,
    },
    {
      key: '',
      title: 'UPDATED AT/BY',
      expandable: true,
    },
    {
      key: 'deletedAt',
      title: 'CANCELLED AT/BY',
      render: (row: any) => row?.deletedAt ? <>{"keyForCurrentUser"}  <br /><span className='date-table-style'>{new Date(row.deletedAt).toLocaleString('en-GB')}</span></> : ' ',
      expandable: true,
    },
    {
      key: 'cancellationReason',
      title: 'CANCELLATION REASON',
      dataKey: 'cancellationReason',
      expandable: true,
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

  return (
    <div>
      <div className='bt-div'>
        <MyButton
          onClick={handleSubmit}
          disabled={selectedRows.length === 0 || edit}
          prefixIcon={() => <CheckIcon />}
        >Submit</MyButton>
        <MyButton
          prefixIcon={() => <BlockIcon />}
          onClick={OpenConfirmDeleteModel}
          disabled={selectedRows.length === 0} >Cancle</MyButton>
        <MyButton
          appearance='ghost'
          disabled={selectedRows.length === 0}
          prefixIcon={() => <FontAwesomeIcon icon={faPrint} />}>Print</MyButton>
        <Checkbox
          checked={!showCanceled}
          onChange={() => {
            setShowCanceled(!showCanceled);
          }}>
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
        <div className={`bt-right ${edit ? "disabled-panel" : ""}`}>

          <MyButton
            onClick={handelAddNew}
          >Add Consultation</MyButton>
        </div>
      </div>
      <div>
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
            setListRequest({ ...listRequest, sortBy, sortType })
          }}
          page={pageIndex}
          rowsPerPage={rowsPerPage}
          totalCount={totalCount}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </div>
      <CancellationModal title="Cancel Consultation " fieldLabel="Cancellation Reason" open={openConfirmCancelModel} setOpen={setOpenConfirmCancelModel} object={consultationOrders} setObject={setConsultationOrder} handleCancle={handleCancle} fieldName="cancellationReason" />
      <Details patient={patient}
        encounter={encounter}
        editing={editing}
        consultationOrders={consultationOrders}
        setConsultationOrder={setConsultationOrder}
        open={openDetailsMdal}
        setOpen={setOpenDetailsModal}
        refetchCon={refetchCon}
        editable={edit} />
      <AttachmentUploadModal
        isOpen={attachmentsModalOpen}
        setIsOpen={setAttachmentsModalOpen}
        actionType={'add'}
        refecthData={attachmentRefetch}
        attachmentSource={consultationOrders}
        attatchmentType="CONSULTATION_ORDER" />
    </div>

  );
};
export default Consultation;
