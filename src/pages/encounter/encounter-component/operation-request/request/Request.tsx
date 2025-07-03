import MyButton from "@/components/MyButton/MyButton";
import React, { useEffect, useState } from "react";
import { Checkbox, Row } from "rsuite";
import Details from "./Details";
import Translate from "@/components/Translate";
import { render } from "react-dom";
import { formatDateWithoutSeconds } from "@/utils";
import { MdModeEdit } from "react-icons/md";
import { newApOperationRequests } from "@/types/model-types-constructor";
import { initialListRequest, ListRequest } from "@/types/types";
import { useGetOperationRequestsListQuery, useSaveOperationRequestsMutation } from "@/services/operationService";
import MyTable from "@/components/MyTable";
import DeletionConfirmationModal from "@/components/DeletionConfirmationModal";
import { notify } from "@/utils/uiReducerActions";
import { useAppDispatch } from "@/hooks";
const Request = ({ patient, encounter, user, refetchrequest }) => {
  const dispatch = useAppDispatch();
  const [showCanceled, setShowCanceled] = useState(false);
  const [open, setOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [request, setRequest] = useState<any>({ ...newApOperationRequests, encounterKey: encounter?.key, patientKey: patient?.key });
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: "patient_key",
        operator: "match",
        value: patient.key,
      },
      {
        fieldName: "encounter_key",
        operator: "match",
        value: encounter.key,
      },
      {
        fieldName: "status_lkey",
        operator: showCanceled ? "notMatch" : "match",
        value: '3621690096636149',
      }

    ],
  });
  const isSelected = rowData => {
    if (rowData && request && rowData.key === request.key) {
      return 'selected-row';
    } else return '';
  };

  //operation Api's
  const { data: operationrequestList, refetch, isLoading } = useGetOperationRequestsListQuery(listRequest);
  const [save, saveMutation] = useSaveOperationRequestsMutation();


  //use Effect
  useEffect(() => {
    setRequest({ ...newApOperationRequests, encounterKey: encounter?.key, patientKey: patient?.key });
    let updatedFilters = [...listRequest.filters];
    setListRequest(prev => ({
      ...prev,
      filters: updatedFilters
    }));
  }, [encounter, patient]);

  useEffect(() => {


    setListRequest(prev => ({
      ...prev,
      filters: prev.filters.map(filter =>
        filter.fieldName === "status_lkey"
          ? { ...filter, operator: showCanceled ? "match" : "notMatch" }
          : filter
      ),
    }));

    refetch();
  }, [showCanceled]);


  //handle functions
  const handleClear = () => {
    setRequest({
      ...newApOperationRequests,
      operationTypeLkey: null,
      operationLevelLkey: null,
      bodyPartLkey: null,
      sideOfProcedureLkey: null,
      plannedAnesthesiaTypeLkey: null,
    })
  }

  const handleCancel = async () => {
    try {
      const Response=await save({
        ...request, statusLkey: '3621690096636149', cancelledBy: user?.key,
        cancelledAt: Date.now(),
      });

      dispatch(notify({ msg: 'Cancelled Successfully', sev: "success" }));
      setConfirmDeleteOpen(false);
      refetch();
      refetchrequest();
    }
    catch (error) {
      dispatch(notify({ msg: 'Cancelled Faild', sev: "error" }));
    }

  }

  const handleSubmit = async () => {
    try {
      await save({ ...request, statusLkey: '6134761379970516' ,submitedBy: user?.key,
        submitedAt: Date.now(),});
      dispatch(notify({ msg: 'Submited Successfully', sev: "success" }));
      setConfirmDeleteOpen(false);
      refetch();
      refetchrequest();
    }
    catch (error) {
      dispatch(notify({ msg: 'Submited Faild', sev: "error" }));
    }
  }


//table 
  const columns = [
    {
      key: "facilityKey",
      title: <Translate>facility</Translate>,
      render: (rowData: any) => {
        return null;
      }
    },
    {
      key: "departmentKey",
      title: <Translate>department</Translate>,
      render: (rowData: any) => {
        return rowData?.departmentKey;
      }
    },
    {
      key: "oparetionKey",
      title: <Translate>oparation name</Translate>,
      render: (rowData: any) => {
        return null;
      }
    },
    {
      key: "operationTypeLkey",
      title: <Translate>operation type</Translate>,
      render: (rowData: any) => {
        return rowData.operationTypeLvalue ? rowData.operationTypeLvalue.lovDisplayVale : rowData.operationTypeLkey;
      }
    },
    {
      key: "operationLevelLkey",
      title: <Translate>Operation Level</Translate>,
      render: (rowData: any) => {
        return rowData.operationLevelLvalue ? rowData.operationLevelLvalue.lovDisplayVale : rowData.operationLevelLkey;
      }
    },
    {
      key: "operationDateTime",
      title: <Translate>Operation Date/Time</Translate>,
      render: (rowData: any) => {
        return formatDateWithoutSeconds(rowData?.operationDateTime);
      }
    },
    {
      key: "priorityLkey",
      title: <Translate>Priority</Translate>,
      render: (rowData: any) => {
        return rowData.priorityLvalue ? rowData.priorityLvalue?.lovDisplayVale : rowData.priorityLkey;;
      }
    },
    {
      key: "diagnosisKey",
      title: <Translate>Pre-op Diagnosis</Translate>,
      render: (rowData: any) => {
        return null;
      }
    },
    {
      key: "statusLkey",
      title: <Translate>Request Status</Translate>,
      render: (rowData: any) => {
        return rowData.statusLvalue ? rowData.statusLvalue?.lovDisplayVale : rowData.statusLkey;
      }
    },
    {
      key: "edit",
      title: <Translate>Edit</Translate>,

      render: (rowData: any) => {
        return (<MdModeEdit
          title="Edit"
          size={24}

          fill="var(--primary-gray)"
          onClick={() => {
            setOpen(true);
            setRequest(rowData);

          }}
        />)
      }
    }
 
    ,
    {
      key: "",
      title: <Translate>Created At/By</Translate>,
      expandable: true,
      render: (rowData: any) => {
        return (<>
          <span>{rowData.createdBy}</span>
          <br />
          <span className='date-table-style'>{formatDateWithoutSeconds(rowData.createdAt)}</span>
        </>)
      }

    },
    {
      key: "",
      title: <Translate>Submited At/By</Translate>,
      expandable: true,
      render: (rowData: any) => {
        return (<>
          <span>{rowData.submitedBy}</span>
          <br />
          <span className='date-table-style'>{formatDateWithoutSeconds(rowData.submitedAt)}</span>
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
          <span className='date-table-style'>{formatDateWithoutSeconds(rowData.deletedAt)}</span>
        </>)
      }
    },
  ]
  return (<>
    <div className='bt-div'>
      <Checkbox
        checked={showCanceled}
        onChange={() => {
          setShowCanceled(!showCanceled);
        }}>
        Show Cancelled
      </Checkbox>
      <div className='bt-right'>
        <MyButton onClick={() => {
          handleClear();
          setOpen(true);
        }}>Add Request</MyButton>
        <MyButton onClick={handleSubmit} >Submit</MyButton>
        <MyButton disabled={request?.statusLvalue?.valueCode != 'PROC_REQ'}
          onClick={() => { setConfirmDeleteOpen(true) }} >Cancel</MyButton>
      </div>

    </div>
    <Row>
      <MyTable
        columns={columns}
        data={operationrequestList?.object || []}
        rowClassName={isSelected}
        loading={isLoading}
        onRowClick={rowData => {
          setRequest(rowData)

        }}
      />

    </Row>
    <Details open={open} setOpen={setOpen} 
    user={user} 
    request={request} setRequest={setRequest}
     refetch={refetch} refetchrequest={refetchrequest}
      encounter={encounter} patient={patient} />
    <DeletionConfirmationModal
      open={confirmDeleteOpen}
      setOpen={setConfirmDeleteOpen}
      itemToDelete="note"
      actionButtonFunction={handleCancel}
      actionType="delete"
    />
  </>)
}
export default Request;