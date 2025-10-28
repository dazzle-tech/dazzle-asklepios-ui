import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import {
  useGetOperationRequestsListQuery,
  useSaveOperationRequestsMutation
} from '@/services/operationService';
import { newApOperationRequests } from '@/types/model-types-constructor';
import { initialListRequest, ListRequest } from '@/types/types';
import { formatDateWithoutSeconds } from '@/utils';
import { notify } from '@/utils/uiReducerActions';
import React, { useEffect, useState } from 'react';
import { MdModeEdit } from 'react-icons/md';
import { Checkbox, HStack, Row, Tooltip, Whisper } from 'rsuite';
import Details from './Details';
import CancellationModal from '@/components/CancellationModal';
import StartedDetails from '@/pages/operation-module/StartedDetails/StartedDetails';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import { faPlus, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import BlockIcon from '@rsuite/icons/Block';
import PreviewRequest from './PreviewRequest';

const Request = ({ patient, encounter, user, refetchrequest }) => {
  const dispatch = useAppDispatch();
  const [showCanceled, setShowCanceled] = useState(false);
  const [open, setOpen] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [openCancelModal, setOpenCancelModal] = useState(false);
  const [previewRequest, setPreviewRequest] = useState<any | null>(null);
  const [request, setRequest] = useState<any>({
    ...newApOperationRequests,
    encounterKey: encounter?.key,
    patientKey: patient?.key
  });
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'patient_key',
        operator: 'match',
        value: patient.key
      },
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
  const isSelected = rowData => {
    if (rowData && request && rowData.key === request.key) {
      return 'selected-row';
    } else return '';
  };

  //operation Api's
  const {
    data: operationrequestList,
    refetch,
    isLoading
  } = useGetOperationRequestsListQuery(listRequest);
  const [save, saveMutation] = useSaveOperationRequestsMutation();

  //use Effect
  useEffect(() => {
    setRequest({
      ...newApOperationRequests,
      encounterKey: encounter?.key,
      patientKey: patient?.key
    });
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
        filter.fieldName === 'status_lkey'
          ? { ...filter, operator: showCanceled ? 'match' : 'notMatch' }
          : filter
      )
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
      plannedAnesthesiaTypeLkey: null
    });
  };

  const handleCancel = async () => {
    try {
      const Response = await save({
        ...request,
        statusLkey: '3621690096636149',
        cancelledBy: user?.key,
        cancelledAt: Date.now()
      });

      dispatch(notify({ msg: 'Cancelled Successfully', sev: 'success' }));
      setOpenCancelModal(false);
      refetch();
      refetchrequest();
    } catch (error) {
      dispatch(notify({ msg: 'Cancelled Faild', sev: 'error' }));
    }
  };

  const handleSubmit = async () => {
    try {
      const Response = await save({
        ...request,
        statusLkey: '6134761379970516',
        submitedBy: user?.key,
        submitedAt: Date.now(),
        operationStatusLkey: '3621653475992516'
      });
      dispatch(notify({ msg: 'Submited Successfully', sev: 'success' }));

      refetch();
      refetchrequest();
    } catch (error) {
      dispatch(notify({ msg: 'Submited Faild', sev: 'error' }));
    }
  };

  //table
  const columns = [
    {
      key: 'facilityKey',
      title: <Translate>facility</Translate>,
      render: (rowData: any) => {
        return rowData?.facility?.facilityName;
      }
    },
    {
      key: 'departmentKey',
      title: <Translate>department</Translate>,
      render: (rowData: any) => {
        return rowData?.department?.name;
      }
    },
    {
      key: 'oparetionKey',
      title: <Translate>oparation name</Translate>,
      render: (rowData: any) => {
        return rowData?.operation?.name;
      }
    },
    {
      key: 'operationTypeLkey',
      title: <Translate>operation type</Translate>,
      render: (rowData: any) => {
        return rowData.operationTypeLvalue
          ? rowData.operationTypeLvalue.lovDisplayVale
          : rowData.operationTypeLkey;
      }
    },
    {
      key: 'operationLevelLkey',
      title: <Translate>Operation Level</Translate>,
      render: (rowData: any) => {
        return rowData.operationLevelLvalue
          ? rowData.operationLevelLvalue.lovDisplayVale
          : rowData.operationLevelLkey;
      }
    },
    {
      key: 'operationDateTime',
      title: <Translate>Operation Date/Time</Translate>,
      render: (rowData: any) => {
        return formatDateWithoutSeconds(rowData?.operationDateTime);
      }
    },
    {
      key: 'priorityLkey',
      title: <Translate>Priority</Translate>,
      render: (rowData: any) => {
        return rowData.priorityLvalue
          ? rowData.priorityLvalue?.lovDisplayVale
          : rowData.priorityLkey;
      }
    },
    {
      key: 'diagnosisKey',
      title: <Translate>Pre-op Diagnosis</Translate>,
      render: (rowData: any) => {
        return rowData?.diagnosis
          ? rowData.diagnosis?.icdCode + ' - ' + rowData?.diagnosis?.description
          : '';
      }
    },
    {
      key: 'statusLkey',
      title: <Translate>Request Status</Translate>,
      render: (rowData: any) => {
        return rowData.statusLvalue ? rowData.statusLvalue?.lovDisplayVale : rowData.statusLkey;
      }
    },
    {
      key: 'edit',
      title: <Translate>Edit</Translate>,

      render: (rowData: any) => {
        return (
          <MdModeEdit
            title="Edit"
            size={24}
            fill="var(--primary-gray)"
            onClick={() => {
              setOpen(true);
              setRequest(rowData);
            }}
          />
        );
      }
    },
    {
      key: 'actions',
      title: <Translate>Actions</Translate>,
      render: (rowData: any) => {
        const isDisabled =
          request?.key !== rowData.key ||
          rowData.operationStatusLvalue?.valueCode !== 'PROC_COMPLETED';
        return (
          <HStack spacing={10}>
            <Whisper placement="top" trigger="hover" speaker={<Tooltip> View</Tooltip>}>
              <FontAwesomeIcon
                icon={faEye}
                onClick={() => setOpenView(true)}
                style={isDisabled ? { cursor: 'not-allowed', opacity: 0.5 } : {}}
              />
            </Whisper>
          </HStack>
        );
      }
    },
    {
      key: 'createdAt',
      title: <Translate>Created At/By</Translate>,
      expandable: true,
      render: (rowData: any) => {
        return (
          <>
            <span>{rowData.createdBy}</span>
            <br />
            <span className="date-table-style">{formatDateWithoutSeconds(rowData.createdAt)}</span>
          </>
        );
      }
    },
    {
      key: 'submitedAt',
      title: <Translate>Submited At/By</Translate>,
      expandable: true,
      render: (rowData: any) => {
        return (
          <>
            <span>{rowData.submitedBy}</span>
            <br />
            <span className="date-table-style">{formatDateWithoutSeconds(rowData.submitedAt)}</span>
          </>
        );
      }
    },

    {
      key: 'cancelledBy',
      title: <Translate>Cancelled At/By</Translate>,
      expandable: true,
      render: (rowData: any) => {
        return (
          <>
            <span>{rowData.cancelledBy}</span>
            <br />
            <span className="date-table-style">
              {formatDateWithoutSeconds(rowData.cancelledAt)}
            </span>
          </>
        );
      }
    },
    {
      key: 'cancellationReason',
      title: <Translate>Cancelled Reason</Translate>,
      expandable: true,
      render: (rowData: any) => {
        return rowData.cancellationReason || '-';
      }
    }
  ];
  return (
    <>
      <Row className='margin-left-right'>
        <MyTable
          columns={columns}
          data={operationrequestList?.object || []}
          rowClassName={isSelected}
          loading={isLoading}
          onRowClick={rowData => {
            setRequest(rowData);
            setPreviewRequest(rowData);
          }}
          tableButtons={
            <div className="bt-div-2">
              <div className="bt-left-2">
                <MyButton
                  disabled={request?.statusLvalue?.valueCode !== 'PROC_REQ'}
                  onClick={() => setOpenCancelModal(true)}
                  prefixIcon={() => <BlockIcon />}
                >
                  Cancel
                </MyButton>
                <Checkbox checked={showCanceled} onChange={() => setShowCanceled(!showCanceled)}>
                  Show Cancelled
                </Checkbox>
              </div>
              <div className="bt-right-2">
                <MyButton
                  onClick={() => {
                    handleClear();
                    setOpen(true);
                  }}
                >
                  <FontAwesomeIcon icon={faPlus} style={{ marginRight: 5 }} />
                  Add Request
                </MyButton>

                <MyButton
                  disabled={request?.statusLvalue?.valueCode !== 'PROC_REQ'}
                  onClick={handleSubmit}
                >
                  <FontAwesomeIcon icon={faCheck} style={{ marginRight: 5 }} />
                  Submit
                </MyButton>
              </div>
            </div>
          }
        />
      </Row>
      {previewRequest && (
        <PreviewRequest
          open={true}
          setOpen={(val) => { }}
          request={previewRequest}
          patient={patient}
          encounter={encounter}
        />
      )}

      <Details
        open={open}
        setOpen={setOpen}
        user={user}
        request={request}
        setRequest={setRequest}
        refetch={refetch}
        refetchrequest={refetchrequest}
        encounter={encounter}
        patient={patient}
      />
      <CancellationModal
        open={openCancelModal}
        setOpen={setOpenCancelModal}
        object={request}
        setObject={setRequest}
        handleCancle={handleCancel}
        fieldName="cancellationReason"
        fieldLabel={'Cancelled Reason'}
        title={'Cancellation'}
      ></CancellationModal>
      <StartedDetails
        open={openView}
        setOpen={setOpenView}
        operation={request}
        setOperation={setRequest}
        patient={patient}
        encounter={encounter}
        refetch={refetch}
        editable={false}
      />
    </>
  );
};
export default Request;
