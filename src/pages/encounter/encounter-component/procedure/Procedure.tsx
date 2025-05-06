import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import React, { useEffect, useState } from 'react';
import { FaBedPulse, FaFileArrowDown } from "react-icons/fa6";
import { MdModeEdit } from 'react-icons/md';
import {
  Checkbox,
  Table
} from 'rsuite';
import './styles.less';
const { Column, HeaderCell, Cell } = Table;

import {
  useFetchAttachmentByKeyQuery,
  useFetchAttachmentQuery
} from '@/services/attachmentService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { notify } from '@/utils/uiReducerActions';

import CancellationModal from '@/components/CancellationModal';
import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import {
  useGetProceduresQuery,
  useSaveProceduresMutation
} from '@/services/encounterService';
import {
  useGetDepartmentsQuery
} from '@/services/setupService';
import { newApProcedure } from '@/types/model-types-constructor';
import { initialListRequest, ListRequest } from '@/types/types';
import { faBedPulse } from '@fortawesome/free-solid-svg-icons';
import BlockIcon from '@rsuite/icons/Block';
import Details from './Details';
import Perform from './Perform';

const Referrals = ({ edit, patient, encounter }) => {
  const dispatch = useAppDispatch();
  const [showCanceled, setShowCanceled] = useState(true);
  const [actionType, setActionType] = useState(null);
  const [editing, setEditing] = useState(false);
  const [openPerformModal, setOpenPerformModal] = useState(false);
 const [manualSearchTriggered, setManualSearchTriggered] = useState(false);
  const [indicationsDescription, setindicationsDescription] = useState<string>('');
  
  const [openCancellationReasonModel, setOpenCancellationReasonModel] = useState(false);
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [procedure, setProcedure] = useState<any>({
    ...newApProcedure,
    encounterKey: encounter.key,
    currentDepartment: true
  });
  const { data: CategoryLovQueryResponse } = useGetLovValuesByCodeQuery('PROCEDURE_CAT');
  const { data: departmentListResponse } = useGetDepartmentsQuery({ ...initialListRequest });

  const isSelected = rowData => {
    if (rowData && procedure && rowData.key === procedure.key) {
        return 'selected-row';
    } else return '';
};

  const department = departmentListResponse?.object.filter(
    item => item.departmentTypeLkey === '5673990729647006'
  );
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
  const { data: procedures, refetch: proRefetch ,isLoading:procedureLoding } = useGetProceduresQuery(listRequest);
  const [requestedPatientAttacment, setRequestedPatientAttacment] = useState();
  const fetchOrderAttachResponse = useFetchAttachmentQuery(
    {
      type: 'PROCEDURE_ORDER',
      refKey: procedure.key
    },
    { skip: !procedure.key }
  );
  const {
    data: fetchAttachmentByKeyResponce,
    error,
    isLoading,
    isFetching,
    isSuccess,
    refetch: refAtt
  } = useFetchAttachmentByKeyQuery(
    { key: requestedPatientAttacment },
    {
      skip: !requestedPatientAttacment
       || !procedure.key
    }
  );

 useEffect(()=>{
 const upateFilter=[
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
    filters:upateFilter,
  }));
 },[showCanceled]);

  const handleDownload = async attachment => {
    try {
      if (!attachment?.fileContent || !attachment?.contentType || !attachment?.fileName) {
        console.error('Invalid attachment data.');
        return;
      }

      const byteCharacters = atob(attachment.fileContent);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: attachment.contentType });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = attachment.fileName;

      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      console.log('File downloaded successfully:', attachment.fileName);
      // attachmentRefetch().then(() => {
      //     console.log("Refetch complete");
      // }).catch((error) => {
      //     console.error("Refetch failed:", error);
      // });
    } catch (error) {
      console.error('Error during file download:', error);
    }
  };
  const handleDownloadSelectedPatientAttachment = attachmentKey => {
    setRequestedPatientAttacment(attachmentKey);
    setActionType('download');
    handleDownload(fetchAttachmentByKeyResponce);
  };
  const OpenPerformModel = () => {
    setOpenPerformModal(true);
  };
 

  const handleSave = async () => {
    try {
      await saveProcedures({
        ...procedure,
        statusLkey: '3621653475992516',
        indications: indicationsDescription,
        encounterKey: encounter.key
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

      dispatch(notify({msg:' procedure deleted successfully' ,sev:"success"}));
      CloseCancellationReasonModel();
    } catch (error) {
      dispatch(notify({msg:' deleted failed' ,sev:'error'}));
    }
  };

  const handelAddNew = () => {
    handleClear();
    setOpenDetailsModal(true)
  }
  const tableColumns=[
    {
      key:"procedureId",
      dataKey:"procedureId",
      title:<Translate>Procedure ID</Translate>,
      flexGrow:1,
      render:(rowData:any)=>{
            return rowData.procedureId;
      }
    },
    {
      key:"procedureName",
      dataKey:"procedureName",
      title:<Translate>Procedure Name</Translate>,
      flexGrow:1,
     
    },
    {
      key:"scheduledDateTime",
      dataKey:"scheduledDateTime",
      title:<Translate>Scheduled Date Time</Translate>,
      flexGrow:1,
      render:(rowData:any)=>{
           return  rowData.scheduledDateTime ? new Date(rowData.scheduledDateTime).toLocaleString() : ' '
      }
    },
    {
      key:"categoryKey",
      dataKey:"categoryKey",
      title:<Translate>Category</Translate>,
      flexGrow:1,
      render:(rowData:any)=>{
        const category = CategoryLovQueryResponse?.object?.find(item => {
          return item.key === rowData.categoryKey;
        });

        return category?.lovDisplayVale || ' ';
      }
    },
    {
      key:"priorityLkey",
      dataKey:"priorityLkey",
      title:<Translate>Priority</Translate>,
      flexGrow:1,
      render:(rowData:any)=>{
       return rowData.priorityLkey ? rowData.priorityLvalue?.lovDisplayVale : rowData.priorityLkey
      }
    },
    {
      key:"procedureLevelLkey",
      dataKey:"procedureLevelLkey",
      title:<Translate>Level</Translate>,
      flexGrow:1,
      render:(rowData:any)=>{
           return  rowData.procedureLevelLkey
           ? rowData.procedureLevelLvalue?.lovDisplayVale
           : rowData.procedureLevelLkey
      }
    },
    {
      key:"indications",
      dataKey:"indications",
      title:<Translate>Indications</Translate>,
      flexGrow:1,
    
    },
    {
      key:"statusLkey",
      dataKey:"statusLkey",
      title:<Translate>Status</Translate>,
      flexGrow:1,
      render:(rowData:any)=>{
           return rowData.statusLvalue?.lovDisplayVale??null
      }
    },
    {
      key:"",
      dataKey:"",
      title:<Translate>Attached File</Translate>,
      flexGrow:1,
      render:(rowData:any)=>{
        return <FaFileArrowDown
        title="Edit"
        size={22}
        fill="var(--primary-gray)"
        onClick={() =>  handleDownloadSelectedPatientAttachment(fetchOrderAttachResponse.data.key)}
      />
      }
    },
    {
      key:"",
      dataKey:"",
      title:<Translate>Perform</Translate>,
      flexGrow:1,
      render:(rowData:any)=>{
          return <FaBedPulse
          title="Edit"
          size={22}
          fill="var(--primary-gray)"
          onClick={OpenPerformModel}
        />
      }
    },
    {
      key:"",
      dataKey:"",
      title:<Translate>Edit</Translate>,
      flexGrow:1,
      render:(rowData:any)=>{
        return <MdModeEdit
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={()=>setOpenDetailsModal(true)}
      />
      }
    },
    {
      key:"faciltyLkey",
      dataKey:"faciltyLkey",
      title:<Translate>Facelity</Translate>,
      flexGrow:1,
      expandable:true,
      render:(rowData:any)=>{
         return rowData.faciltyLkey ? rowData.faciltyLvalue.lovDisplayVale : rowData.faciltyLkey
      }
    },
    {
      key:"",
      dataKey:"",
      title:<Translate>Department</Translate>,
      flexGrow:1,
      expandable:true,
      render:(rowData:any)=> {
        const d = department?.find(item => item.key === rowData.departmentKey);

        return d?.name || '';
      }
    },
    {
      key:"currentDepartment",
      dataKey:"currentDepartment",
      title:<Translate>Current Department</Translate>,
      flexGrow:1,
      expandable:true,
      render:(rowData:any)=>{
        return rowData.currentDepartment ? 'Yes' : '';
      }
    },
    {
      key:"bodyPartLkey",
      dataKey:"bodyPartLkey",
      title:<Translate>Body Part</Translate>,
      flexGrow:1,
      expandable:true,
      render:(rowData:any)=>{
        return rowData.bodyPartLkey ? rowData.bodyPartLvalue.lovDisplayVale : rowData.bodyPartLkey
      } 
    },
    {
      key:"sideLkey",
      dataKey:"sideLkey",
      title:<Translate>Side</Translate>,
      flexGrow:1,
      expandable:true,
      render:(rowData:any)=>{
        return rowData.sideLkey ? rowData.sideLvalue.lovDisplayVale : rowData.sideLkey;
      }
    },
    {
      key:"notes",
      dataKey:"notes",
      title:<Translate>Note</Translate>,
      flexGrow:1,
      expandable:true,
     
    },
    {
      key:"createdAt",
      dataKey:"createdAt",
      title:<Translate>Created At</Translate>,
      flexGrow:1,
      expandable:true,
      render:(rowData:any)=>{
        return rowData.createdAt ? new Date(rowData.createdAt).toLocaleString() : ''
      }
    },
    {
      key:"createdBy",
      dataKey:"createdBy",
      title:<Translate>Created At</Translate>,
      flexGrow:1,
      expandable:true,
    
    },
    {
      key:"deletedAt",
      dataKey:"deletedAt",
      title:<Translate>Cancelled At</Translate>,
      flexGrow:1,
      expandable:true,
      render:(rowData:any)=>{
         return rowData.deletedAt ? new Date(rowData.deletedAt).toLocaleString() : ''
      }
    },
    {
      key:"deletedBy",
      dataKey:"deletedBy",
      title:<Translate>Cancelled By</Translate>,
      flexGrow:1,
      expandable:true
    },
    {
      key:"cancellationReason",
      dataKey:"cancellationReason",
      title:<Translate>Cancelliton Reason</Translate>,
      flexGrow:1,
      expandable:true
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
          disabled={procedure.key ? procedure.statusLvalue.lovCode=="PROC_CANCL"?true:false : true}
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

        steps={[

          {
            title: "Perform", icon: faBedPulse,

          },
        ]}

        content={<Perform encounter={encounter} patient={patient} procedure={procedure} setProcedure={setProcedure} edit={edit} />}
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
      title="Cancell"
      object={procedure}
      setObject={setProcedure}
      handleCancle={handleCancle}
       ></CancellationModal>
  
    </>
  );
};
export default Referrals;