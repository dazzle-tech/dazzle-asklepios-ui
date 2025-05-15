import CancellationModal from '@/components/CancellationModal';
import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { useGetWarningsQuery, useSaveWarningsMutation } from '@/services/observationService';
import {
  useGetLovValuesByCodeQuery
} from '@/services/setupService';
import { ApVisitWarning } from '@/types/model-types';
import { newApVisitWarning } from '@/types/model-types-constructor';
import { initialListRequest, ListRequest } from '@/types/types';
import { notify } from '@/utils/uiReducerActions';
import { faArrowRotateRight, faCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import CollaspedOutlineIcon from '@rsuite/icons/CollaspedOutline';
import ExpandOutlineIcon from '@rsuite/icons/ExpandOutline';
import PlusIcon from '@rsuite/icons/Plus';
import ReloadIcon from '@rsuite/icons/Reload';
import React, { useEffect, useState } from 'react';
import { MdModeEdit } from 'react-icons/md';
import {
  Checkbox,
  IconButton,
  Table
} from 'rsuite';
import DetailsModal from './DetailsModal';
import './styles.less';
const { Column, HeaderCell, Cell } = Table;
const Warning = ({ edit, patient, encounter }) => {
  const { data: warningTypeLovQueryResponse } = useGetLovValuesByCodeQuery('MED_WARNING_TYPS');
  const { data: severityLovQueryResponse } = useGetLovValuesByCodeQuery('SEVERITY');
  const { data: sourceofinformationLovQueryResponse } = useGetLovValuesByCodeQuery('RELATION');
  const { data: statusLovQueryResponse } = useGetLovValuesByCodeQuery('ALLERGY_RES_STATUS');
  const [warning, setWarning] = useState<any>({ ...newApVisitWarning });
  const [saveWarning, saveWarningMutation] = useSaveWarningsMutation();
  const [openCancellationReasonModel, setOpenCancellationReasonModel] = useState(false);
  const [openConfirmResolvedModel, setOpenConfirmResolvedModel] = useState(false);
  const [openConfirmUndoResolvedModel, setOpenConfirmUndoResolvedModel] = useState(false);
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [expandedRowKeys, setExpandedRowKeys] = React.useState([]);
  const [showCanceled, setShowCanceled] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showPrev, setShowPrev] = useState(true);
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'patient_key',
        operator: 'match',
        value: patient.key
      },
      {
        fieldName: 'status_lkey',
        operator: showCanceled ? 'notMatch' : 'match',
        value: '3196709905099521'
      }
    ]
  });

  const { data: warningsListResponse, refetch: fetchwarnings ,isLoading} = useGetWarningsQuery({
    ...listRequest
  });
const [manualSearchTriggered, setManualSearchTriggered] = useState(false);
  const dispatch = useAppDispatch();

  const isSelected = rowData => {
    if (rowData && warning && rowData.key === warning.key) {
      return 'selected-row';
    } else return '';
  };


 
  useEffect(() => {

    if (showPrev) {
      const updatedFilters = [
        {
          fieldName: 'patient_key',
          operator: 'match',
          value: patient.key
        },
        {
          fieldName: 'status_lkey',
          operator: showCanceled ? 'notMatch' : 'match',
          value: '3196709905099521'
        },
        {
          fieldName: 'visit_key',
          operator: 'match',
          value: encounter.key
        }
      ];
      setListRequest(prevRequest => ({
        ...prevRequest,
        filters: updatedFilters
      }));
    } else {
      const updatedFilters = [
        {
          fieldName: 'patient_key',
          operator: 'match',
          value: patient.key
        },
        {
          fieldName: 'status_lkey',
          operator: showCanceled ? 'notMatch' : 'match',
          value: '3196709905099521'
        }
      ];
      setListRequest(prevRequest => ({
        ...prevRequest,
        filters: updatedFilters
      }));
    }
    fetchwarnings();
  }, [showPrev]);

  useEffect(() => {
    if (showPrev) {
      const updatedFilters = [
        {
          fieldName: 'patient_key',
          operator: 'match',
          value: patient.key
        },
        {
          fieldName: 'status_lkey',
          operator: showCanceled ? 'notMatch' : 'match',
          value: '3196709905099521'
        },
        {
          fieldName: 'visit_key',
          operator: 'match',
          value: encounter.key
        }
      ];
      setListRequest(prevRequest => ({
        ...prevRequest,
        filters: updatedFilters
      }));
    } else {
      const updatedFilters = [
        {
          fieldName: 'patient_key',
          operator: 'match',
          value: patient.key
        },
        {
          fieldName: 'status_lkey',
          operator: showCanceled ? 'notMatch' : 'match',
          value: '3196709905099521'
        }
      ];
      setListRequest(prevRequest => ({
        ...prevRequest,
        filters: updatedFilters
      }));
    }
  }, [showCanceled]);

  useEffect(() => {
    fetchwarnings();
  }, [saveWarningMutation]);

  useEffect(() => {
    fetchwarnings();
  }, [listRequest]);

  const handleClear = () => {
    setWarning({
      ...newApVisitWarning,
      sourceOfInformationLkey: null,
      severityLkey: null,
      warningTypeLkey: null
    });
    setSelectedFirstDate(null);
    setEditDate({ editdate: true });
    seteditSourceof({ editSource: true });
  };
  const OpenCancellationReasonModel = () => {
    setOpenCancellationReasonModel(true);
  };
  const CloseCancellationReasonModel = () => {
    setOpenCancellationReasonModel(false);
  };
  const OpenConfirmUndoResolvedModel = () => {
    setOpenConfirmUndoResolvedModel(true);
  };
  const CloseConfirmUndoResolvedModel = () => {
    setOpenConfirmUndoResolvedModel(false);
  };
  const OpenConfirmResolvedModel = () => {
    setOpenConfirmResolvedModel(true);
  };
  const CloseConfirmResolvedModel = () => {
    setOpenConfirmResolvedModel(false);
  };
  const handleCancle = async () => {
    try {
      await saveWarning({
        ...warning,
        statusLkey: '3196709905099521',
        isValid: false,
        deletedAt: Date.now()
      }).unwrap();
      dispatch(notify({msg:' Deleted successfully' ,sev:"success"}));
     
      await fetchwarnings()
        .then(() => {
          console.log('Refetch complete');
        })
        .catch(error => {
          console.error('Refetch failed:', error);
        });

      CloseCancellationReasonModel();
    } catch { }
  };
  const handleResolved = async () => {
    try {
      await saveWarning({
        ...warning,
        statusLkey: '9766179572884232',
        resolvedAt: Date.now()
      }).unwrap();
      dispatch(notify('Resolved successfully'));
      setShowPrev(!showPrev);
      await fetchwarnings()
        .then(() => {
          console.log('Refetch complete');
        })
        .catch(error => {
          console.error('Refetch failed:', error);
        });

      CloseConfirmResolvedModel();
    } catch {
      dispatch(notify('Resolved Fill'));
    }
  };
  const handleUndoResolved = async () => {
    try {
      await saveWarning({
        ...warning,
        statusLkey: '9766169155908512'
      }).unwrap();
      dispatch(notify('Undo Resolved successfully'));
      setShowPrev(!showPrev);
      await fetchwarnings()
        .then(() => {
        
        })
        .catch(error => {
          console.error('Refetch failed:', error);
        });

      CloseConfirmUndoResolvedModel();
    } catch {
      dispatch(notify('Undo Resolved Fill'));
    }
  }

  const tableColumns=[
    { key:"warningTypeLkey",
      dataKey:"warningTypeLkey",
      title:<Translate>Warning Type</Translate>,
      flexGrow:1,
      render:(rowData:any)=>{
        return rowData.warningTypeLvalue?.lovDisplayVale ;
      }
    },
    { key:"severityLkey",
      dataKey:"severityLkey",
      title:<Translate>Severity</Translate>,
      flexGrow:1,
      render:(rowData:any)=>{
        return rowData.severityLvalue?.lovDisplayVale;
      }
    },
    { key:"firstTimeRecorded",
      dataKey:"firstTimeRecorded",
      title:<Translate>First Time Recorded</Translate>,
      flexGrow:1,
      render:(rowData:any)=>{
        return  rowData.firstTimeRecorded
        ? new Date(rowData.firstTimeRecorded).toLocaleString()
        : 'Undefind'
;
      }
    },
    {key:"sourceOfInformationLkey",
      dataKey:"sourceOfInformationLkey",
      title:<Translate>Source of information</Translate>,
      flexGrow:1,
      render:(rowData:any)=>{
        return rowData.sourceOfInformationLvalue?.lovDisplayVale || 'BY Patient';
      }
    },
    {key:"warning",
      dataKey:"warning",
      title:<Translate>Warning</Translate>,
      flexGrow:1,
      render:(rowData:any)=>{
        return rowData.warning;
      }
    },
    {key:"actionTake",
      dataKey:"actionTake",
      title:<Translate>Action Taken</Translate>,
      flexGrow:1,
      render:(rowData:any)=>{
        return rowData.actionTake;
      }
    },
    { key:"notes",
      dataKey:"notes",
      title:<Translate>Notes</Translate>,
      flexGrow:1,
      render:(rowData:any)=>{
        return rowData.notes;
      }
    },
    {key:"statusLkey",
      dataKey:"statusLkey",
      title:<Translate>Status</Translate>,
      flexGrow:1,
      render:(rowData:any)=>{
        return rowData.statusLvalue?.lovDisplayVale;
      }
    },
    { key:"#",
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
      key: "",
      title: <Translate>Created At/By</Translate>,
      expandable: true,
      render: (rowData: any) => {
        return (<>
          <span>{rowData.createdBy}</span>
          <br />
          <span className='date-table-style'>{rowData.createdAt ? new Date(rowData.createdAt).toLocaleString() : ''}</span>
        </>)
      }

    },
    {
      key: "",
      title: <Translate>Updated At/By</Translate>,
      expandable: true,
      render: (rowData: any) => {
        return (<>
          <span>{rowData.updatedBy}</span>
          <br />
          <span className='date-table-style'>{rowData.createdAt ? new Date(rowData.createdAt).toLocaleString() : ''}</span>
        </>)
      }

    },

    {
      key: "",
      title: <Translate>Cancelled At/By</Translate>,
      expandable: true,
      render: (rowData: any) => {
        return (<>
          <span>{rowData.deletedBy}</span>
          <br />
          <span className='date-table-style'>{rowData.deletedAt ? new Date(rowData.deletedAt).toLocaleString() : ''}</span>
        </>)
      }

    },
    {
      key: "",
      title: <Translate>Resolved At/By</Translate>,
      expandable: true,
      render: (rowData: any) => {
        if (rowData.statusLkey != '9766169155908512') {
          return (<>

            <span>{rowData.resolvedBy}</span>
            <br />
            <span className='date-table-style'>{rowData.resolvedAt ? new Date(rowData.resolvedAt).toLocaleString() : ''}</span>
          </>)
        }
        else {
          return null;
        }
      }

    },
    { key:"cancellationReason",
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
    const totalCount = warningsListResponse?.extraNumeric ?? 0;
  
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
    <div >
       {/* buttons actions section */}
      <div className='bt-div'>
        <MyButton
          disabled={!edit?warning.key ? warning?.statusLvalue.valueCode == 'ARS_CANCEL' ? true : false : true:true}
          prefixIcon={() => <CloseOutlineIcon />}
          onClick={OpenCancellationReasonModel}
        >Cancel</MyButton>
        <MyButton
          disabled={!edit ? warning?.statusLkey != '9766169155908512' ? true : false:true}
          prefixIcon={() => <FontAwesomeIcon icon={faCheck} />}
          onClick={OpenConfirmResolvedModel}
        >
          Resolved</MyButton>
        <MyButton
          prefixIcon={() => <ReloadIcon />}
          disabled={!edit ? warning?.statusLkey != '9766179572884232' ? true : false:true}
          onClick={OpenConfirmUndoResolvedModel}
        >Undo Resolved</MyButton>


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
          Show Previous Warnings
        </Checkbox>
        <div className='bt-right'>
          <MyButton
            prefixIcon={() => <PlusIcon />}
            disabled={edit}
            onClick={() =>{ setOpenDetailsModal(true);
              handleClear();
            }}
          >Add Warning</MyButton>
        </div>
      </div>
      <MyTable
      columns={tableColumns}
      data={warningsListResponse?.object || []}
      onRowClick={rowData => {
        setWarning(rowData);
        setEditing(rowData.statusLvalue.valueCode == 'ARS_CANCEL' ? true : false);
      }}
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
      loading={isLoading}
      />


  {/* modal for esolve warning */}
      <MyModal
        open={openConfirmResolvedModel}
        setOpen={setOpenConfirmResolvedModel}
        actionButtonFunction={handleResolved}
        actionButtonLabel='Yes'
        title="Resolve"
        bodyheight="30vh"
        steps={[{ title: "Is this Warning resolved?", icon: <FontAwesomeIcon icon={faCheck}/>}]}
        content={<></>}
      ></MyModal>
  {/* modal for undo resolve for warning */}
      <MyModal
        open={openConfirmUndoResolvedModel}
        setOpen={setOpenConfirmUndoResolvedModel}
        actionButtonFunction={handleUndoResolved}
        actionButtonLabel='Yes'
        title="Undo Resolve"
         bodyheight="30vh"
        steps={[{ title: "Is this Warning active?", icon:<FontAwesomeIcon icon={ faArrowRotateRight}/> }]}
        content={<></>}
      ></MyModal>

      {/* moodal for cancel warning and write reason */}
       <CancellationModal
        open={openCancellationReasonModel}
        setOpen={setOpenCancellationReasonModel}
        object={warning}
        setObject={setWarning}
        handleCancle={handleCancle}
        fieldName="cancellationReason"
        title={"Cancellation"}
        fieldLabel={"Cancellation Reason"}
      ></CancellationModal>


    
      <DetailsModal patient={patient} 
      open={openDetailsModal} setOpen={setOpenDetailsModal}
       warning={warning} setWarning={setWarning}
       encounter={encounter} editing={editing}
       fetchwarnings={fetchwarnings} edit={edit}/>
    </div>
  );
};
export default Warning;
