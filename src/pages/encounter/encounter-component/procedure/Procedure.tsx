import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import React, { useEffect, useState } from 'react';
import { FaBedPulse, FaFileArrowDown } from "react-icons/fa6";
import { MdAttachFile, MdModeEdit } from 'react-icons/md';
import {
  Checkbox,
  HStack,
  Table
} from 'rsuite';
import './styles.less';
const { Column, HeaderCell, Cell } = Table;

import {
  useGetPatientAttachmentsListQuery
} from '@/services/attachmentService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { notify } from '@/utils/uiReducerActions';

import AttachmentUploadModal from '@/components/AttachmentUploadModal';
import CancellationModal from '@/components/CancellationModal';
import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import {
 
  useSaveProceduresMutation
} from '@/services/procedureService';
  import{useGetProceduresQuery} from '@/services/procedureService';

import { newApProcedure } from '@/types/model-types-constructor';
import { initialListRequest, ListRequest } from '@/types/types';
import { formatDateWithoutSeconds } from '@/utils';
import BlockIcon from '@rsuite/icons/Block';
import { useLocation } from 'react-router-dom';
import Details from './Details';
import Perform from './Perform';
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
const Referrals = (props) => {
 const location = useLocation();
 
   const patient = props.patient || location.state?.patient;
   const encounter = props.encounter || location.state?.encounter;
   const edit = props.edit ?? location.state?.edit ?? false;

  const dispatch = useAppDispatch();
  const [showCanceled, setShowCanceled] = useState(true);
  const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [openPerformModal, setOpenPerformModal] = useState(false);
  const [manualSearchTriggered, setManualSearchTriggered] = useState(false);
  const [indicationsDescription, setindicationsDescription] = useState<string>('');

  const [openCancellationReasonModel, setOpenCancellationReasonModel] = useState(false);
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [procedure, setProcedure] = useState<any>({
    ...newApProcedure,
    encounterKey: encounter.key,
     patientKey: patient.key,
    currentDepartment: true
  });

  const { data: CategoryLovQueryResponse } = useGetLovValuesByCodeQuery('PROCEDURE_CAT');
  const isSelected = rowData => {
    if (rowData && procedure && rowData.key === procedure.key) {
      return 'selected-row';
    } else return '';
  };
  const [saveProcedures, saveProcedureMutation] = useSaveProceduresMutation();

  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'encounter_key',
        operator: 'match',
        value: encounter.key
      },
      {
        fieldName: 'status_lkey',
        operator: showCanceled ? 'notMatch' : 'match',
        value: '3621690096636149'
      }
    ]
  });
  const { data: procedures, refetch: proRefetch, isLoading: procedureLoding } = useGetProceduresQuery(listRequest);
  const [attachmentsListRequest, setAttachmentsListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      }

      ,
      {
        fieldName: 'attachment_type',
        operator: "match",
        value: "PROCEDURE"
      }
    ]
  });

  const { data: fetchPatintAttachmentsResponce, refetch: attachmentRefetch, isLoading: loadAttachment } = useGetPatientAttachmentsListQuery(attachmentsListRequest);

  useEffect(() => {

    if (!attachmentsModalOpen) {

      const updatedFilters = [
        {
          fieldName: 'deleted_at',
          operator: 'isNull',
          value: undefined
        }

        ,
        {
          fieldName: 'attachment_type',
          operator: "match",
          value: "PROCEDURE"
        }
      ];
      setAttachmentsListRequest((prevRequest) => ({
        ...prevRequest,
        filters: updatedFilters,
      }));
    }
    attachmentRefetch()

  }, [attachmentsModalOpen])

  useEffect(() => {
    const upateFilter = [
      {
        fieldName: 'encounter_key',
        operator: 'match',
        value: encounter.key
      },
      {
        fieldName: 'status_lkey',
        operator: showCanceled ? 'notMatch' : 'match',
        value: '3621690096636149'
      }
    ]
    setListRequest((prevRequest) => ({
      ...prevRequest,
      filters: upateFilter,
    }));
  }, [showCanceled]);
  useEffect(() => {
    if (!attachmentsModalOpen) {
      const updatedFilters = [
        {
          fieldName: 'deleted_at',
          operator: 'isNull',
          value: undefined
        },
        {
          fieldName: 'reference_object_key',
          operator: "match",
          value: procedure?.key
        }
      ];
      setAttachmentsListRequest((prevRequest) => ({
        ...prevRequest,
        filters: updatedFilters,
      }));

    }

  }, [attachmentsModalOpen])
  const OpenPerformModel = () => {
    setOpenPerformModal(true);
  };


  const handleSave = async () => {
    try {
      await saveProcedures({
        ...procedure,
        statusLkey: '3621653475992516',
        indications: indicationsDescription,
        encounterKey: encounter.key,
        patientKey: patient.key,
      })
        .unwrap()
        .then(() => {
          proRefetch();
        });
      handleClear();
      dispatch(notify('saved  Successfully'));
    } catch (error) {
      dispatch(notify('Save Failed'));
    }
  };
  const CloseCancellationReasonModel = () => {
    setOpenCancellationReasonModel(false);
  };
  const handleClear = () => {
    setProcedure({
      ...newApProcedure,

      statusLkey: '3621653475992516',
      indications: indicationsDescription,
      bodyPartLkey: null,
      sideLkey: null,
      faciltyLkey: null,
      priorityLkey: null,
      procedureLevelLkey: null,
      departmentKey: null,
      categoryKey: null,
      procedureNameKey: null
    });
  };


  const handleCancle = async () => {
    try {
      await saveProcedures({ ...procedure, statusLkey: '3621690096636149', deletedAt: Date.now() })
        .unwrap()
        .then(() => {
          proRefetch();
        });

      dispatch(notify({ msg: ' procedure deleted successfully', sev: "success" }));
      CloseCancellationReasonModel();
    } catch (error) {
      dispatch(notify({ msg: ' deleted failed', sev: 'error' }));
    }
  };

  const handelAddNew = () => {
    handleClear();
    setOpenDetailsModal(true)
  }
  const tableColumns = [
    {
      key: "procedureId",
      dataKey: "procedureId",
      title: <Translate>PROCEDURE ID</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return rowData.procedureId;
      }
    },
    {
      key: "procedureName",
      dataKey: "procedureName",
      title: <Translate>Procedure Name</Translate>,
      flexGrow: 1,

    },
    {
      key: "scheduledDateTime",
      dataKey: "scheduledDateTime",
      title: <Translate>SCHEDULED DATE TIME</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return rowData.scheduledDateTime ? formatDateWithoutSeconds(rowData.scheduledDateTime) : ' '
      }
    },
    {
      key: "categoryKey",
      dataKey: "categoryKey",
      title: <Translate>CATEGORY</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        const category = CategoryLovQueryResponse?.object?.find(item => {
          return item.key === rowData.categoryKey;
        });

        return category?.lovDisplayVale || ' ';
      }
    },
    {
      key: "priorityLkey",
      dataKey: "priorityLkey",
      title: <Translate>PRIORITY</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return rowData.priorityLkey ? rowData.priorityLvalue?.lovDisplayVale : rowData.priorityLkey
      }
    },
    {
      key: "procedureLevelLkey",
      dataKey: "procedureLevelLkey",
      title: <Translate>LEVEL</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return rowData.procedureLevelLkey
          ? rowData.procedureLevelLvalue?.lovDisplayVale
          : rowData.procedureLevelLkey
      }
    },
    {
      key: "indications",
      dataKey: "indications",
      title: <Translate>INDICATIONS</Translate>,
      flexGrow: 1,

    },
    {
      key: "statusLkey",
      dataKey: "statusLkey",
      title: <Translate>STATUS</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return rowData.statusLvalue?.lovDisplayVale ?? null
      }
    },
    {
      key: "",
      dataKey: "",
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
      key: "",
      dataKey: "",
      title: <Translate>PERFORM</Translate>,
      flexGrow: 1,
       render: (rowData: any) => {
                     const isDisabled =! rowData.currentDepartment;
     
                     return (
                         <FaBedPulse
                             size={22}
                             fill={isDisabled ? "#ccc" : "var(--primary-gray)"}
                             style={{ cursor: isDisabled ? "not-allowed" : "pointer" }}
                             onClick={!isDisabled ? OpenPerformModel : undefined}
                         />
                     );
                 }
    },
    {
      key: "",
      dataKey: "",
      title: <Translate>EDIT</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return <MdModeEdit
          size={24}
          fill="var(--primary-gray)"
          onClick={() => setOpenDetailsModal(true)}
        />

      }
    },
    {
      key: "facilityKey",
      dataKey: "facilityKey",
      title: <Translate>FACILITY</Translate>,
      flexGrow: 1,
      expandable: true,
      render: (rowData: any) => { return rowData.facilityKey ? rowData.facility?.facilityName : "" }
    },
    {
      key: "departmentTypeLkey",
      dataKey: "departmentTypeLkey",
      title: <Translate>DEPARTMENT</Translate>,
      flexGrow: 1,
      expandable: true,
      render: (rowData: any) => {
        return rowData.departmentKey ? rowData.department?.departmentTypeLvalue?.lovDisplayVale : ""
      }
    },
    {
      key: "currentDepartment",
      dataKey: "currentDepartment",
      title: <Translate>CURRENT DEPARTMENT</Translate>,
      flexGrow: 1,
      expandable: true,
      render: (rowData: any) => {
        return rowData.currentDepartment ? 'Yes' : '';
      }
    },
    {
      key: "bodyPartLkey",
      dataKey: "bodyPartLkey",
      title: <Translate>BODY PART</Translate>,
      flexGrow: 1,
      expandable: true,
      render: (rowData: any) => {
        return rowData.bodyPartLkey ? rowData.bodyPartLvalue.lovDisplayVale : rowData.bodyPartLkey
      }
    },
    {
      key: "sideLkey",
      dataKey: "sideLkey",
      title: <Translate>SIDE</Translate>,
      flexGrow: 1,
      expandable: true,
      render: (rowData: any) => {
        return rowData.sideLkey ? rowData.sideLvalue.lovDisplayVale : rowData.sideLkey;
      }
    },
    {
      key: "notes",
      dataKey: "notes",
      title: <Translate>NOTE</Translate>,
      flexGrow: 1,
      expandable: true,

    },
    ,
    {
      key: "",
      title: <Translate>CREATED AT/BY</Translate>,
      expandable: true,
      render: (rowData: any) => {
        return (<>
          <span>{rowData.createdBy}</span>
          <br />
          <span className='date-table-style'>{rowData.createdAt ? formatDateWithoutSeconds(rowData.createdAt) : ''}</span>
        </>)
      }

    },
    {
      key: "",
      title: <Translate>UPDATED AT/BY</Translate>,
      expandable: true,
      render: (rowData: any) => {
        return (<>
          <span>{rowData.updatedBy}</span>
          <br />
          <span className='date-table-style'>{rowData.createdAt ? formatDateWithoutSeconds(rowData.updatedAt) : ''}</span>
        </>)
      }

    },
    {
      key: "",
      title: <Translate>CANCELLED AT/BY</Translate>,
      expandable: true,
      render: (rowData: any) => {
        return (<>
          <span>{rowData.deletedBy}</span>
          <br />
          <span className='date-table-style'>{rowData.deletedAt ? formatDateWithoutSeconds(rowData.deletedAt) : ''}</span>
        </>)
      }

    },
    {
      key: "cancellationReason",
      dataKey: "cancellationReason",
      title: <Translate>CANCELLITON REASON</Translate>,
      flexGrow: 1,
      expandable: true
    }

  ]
  const pageIndex = listRequest.pageNumber - 1;

  // how many rows per page:
  const rowsPerPage = listRequest.pageSize;

  // total number of items in the backend:
  const totalCount = procedures?.extraNumeric ?? 0;

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
    <>

      <div className='bt-div'>
        <MyButton
          onClick={() => setOpenCancellationReasonModel(true)}
          disabled={!edit ? procedure.key ? procedure.statusLvalue.lovCode == "PROC_CANCL" ? true : false : true : true}
          prefixIcon={() => <BlockIcon />}
        >Cancle</MyButton>
        <Checkbox
          checked={!showCanceled}
          onChange={() => {
            setShowCanceled(!showCanceled);
            if (showCanceled == false) setEditing(true);
          }}
        >
          Show Cancelled
        </Checkbox>
        <div className='bt-right'>
          <MyButton
            disabled={edit}
            onClick={handelAddNew}
          >Add Procedure</MyButton>
        </div>
      </div>

      <MyTable
        columns={tableColumns}
        data={procedures?.object ?? []}
        onRowClick={rowData => {
          setProcedure(rowData);
          setEditing(rowData.statusLkey == '3621690096636149' ? true : false);
        }}
        loading={procedureLoding}
        rowClassName={isSelected}
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

      <MyModal
        open={openPerformModal}
        setOpen={setOpenPerformModal}
        title='Perform Details'
        actionButtonFunction={handleSave}
        size='full'
        content={<Perform proRefetch={proRefetch} encounter={encounter} patient={patient} procedure={procedure} setProcedure={setProcedure} edit={edit} />}
      ></MyModal>



      <Details patient={patient}
        proRefetch={proRefetch}
        encounter={encounter} edit={edit}
        procedure={procedure} setProcedure={setProcedure}
        openDetailsModal={openDetailsModal} setOpenDetailsModal={setOpenDetailsModal} />


      <CancellationModal
        open={openCancellationReasonModel}
        setOpen={setOpenCancellationReasonModel}
        fieldName='cancellationReason'
        fieldLabel="Cancellation Reason"
        title="Cancellation "
        object={procedure}
        setObject={setProcedure}
        handleCancle={handleCancle}
      ></CancellationModal>

      <AttachmentUploadModal
        isOpen={attachmentsModalOpen}
        setIsOpen={setAttachmentsModalOpen}
        actionType={'add'}
        refecthData={attachmentRefetch}
        attachmentSource={procedure}
        attatchmentType="PROCEDURE" 
        patientKey={patient?.key}/>

    </>
  );
};
export default Referrals;