import {
  newApEncounter,
  newApOperationRequests,
  newApPatient
} from '@/types/model-types-constructor';
import React, { useState, useEffect } from 'react';
import PatientSide from '../encounter/encounter-main-info-section/PatienSide';
import {
  useGetOperationRequestsListQuery,
  useSaveOperationRequestsMutation
} from '@/services/operationService';
import { initialListRequest, ListRequest } from '@/types/types';
import Translate from '@/components/Translate';
import { formatDateWithoutSeconds } from '@/utils';
import { Badge, Checkbox, Col, Form, HStack, Row, Tooltip, Whisper } from 'rsuite';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faSquareXmark } from '@fortawesome/free-solid-svg-icons';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';
import CancellationModal from '@/components/CancellationModal';
import { set } from 'lodash';

const RequestList = ({
  patient,
  setPatient,
  encounter,
  setEncounter,
  setActiveTab,
  setOpen,
  request,
  setRequest,
  refetchOnGoing
}) => {
  const dispatch = useAppDispatch();
  const [showCancelled, setShowCancelled] = useState(true);
  const [openCancelModal, setOpenCancelModal] = useState(false);

  const [dateFilter, setDateFilter] = useState({
    fromDate: new Date(),
    toDate: null
  });

  const [save, saveMutation] = useSaveOperationRequestsMutation();
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,

    filters: [
      {
        fieldName: 'operation_status_lkey',
        operator: 'match',
        value: showCancelled ? '3621653475992516' : '3621690096636149'
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

  useEffect(() => {
    setPatient(request?.patient);
    setEncounter(request?.encounter);
  }, [request]);

  useEffect(() => {
    let updatedFilters = [...listRequest.filters];

    if (dateFilter.fromDate && dateFilter.toDate) {
      dateFilter.fromDate.setHours(0, 0, 0, 0);
      dateFilter.toDate.setHours(23, 59, 59, 999);

      updatedFilters = addOrUpdateFilter(updatedFilters, {
        fieldName: 'submited_at',
        operator: 'between',
        value: dateFilter.fromDate.getTime() + '-' + dateFilter.toDate.getTime()
      });
    } else if (dateFilter.fromDate) {
      dateFilter.fromDate.setHours(0, 0, 0, 0);

      updatedFilters = addOrUpdateFilter(updatedFilters, {
        fieldName: 'submited_at',
        operator: 'gte',
        value: dateFilter.fromDate.getTime()
      });
    } else if (dateFilter.toDate) {
      dateFilter.toDate.setHours(23, 59, 59, 999);

      updatedFilters = addOrUpdateFilter(updatedFilters, {
        fieldName: 'submited_at',
        operator: 'lte',
        value: dateFilter.toDate.getTime()
      });
    }

    setListRequest(prev => ({
      ...prev,
      filters: updatedFilters
    }));
  }, [dateFilter]);

  useEffect(() => {
    setListRequest(prev => {
      let updatedFilters = [...prev.filters];

      updatedFilters = addOrUpdateFilter(updatedFilters, {
        fieldName: 'operation_status_lkey',
        operator: 'match',
        value: showCancelled ? '3621653475992516' : '3621690096636149'
      });

      return {
        ...prev,
        filters: updatedFilters
      };
    });
  }, [showCancelled]);

  // Update the listRequest filters when record changes
  const addOrUpdateFilter = (filters, newFilter) => {
    const index = filters.findIndex(f => f.fieldName === newFilter.fieldName);
    if (index > -1) {
      // Replace the existing filter
      return filters.map((f, i) => (i === index ? newFilter : f));
    } else {
      // Add new filter
      return [...filters, newFilter];
    }
  };
  const handleCancel = async () => {
    try {
      await save({ ...request, operationStatusLkey: '3621690096636149' }).unwrap();
      dispatch(notify({ msg: 'Cancelled Successfully', sev: 'success' }));
      refetch();
    } catch (error) {
      dispatch(notify({ msg: 'Failed', sev: 'error' }));
    }
  };
  //table
  const columns = [
    {
      key: 'patientname',
      title: <Translate>Patient Name</Translate>,
      render: (rowData: any) => {
        const tooltipSpeaker = (
          <Tooltip>
            <div>MRN : {rowData?.patient?.patientMrn}</div>

            <div>
              Gender :{' '}
              {rowData?.patient?.genderLvalue
                ? rowData?.patient?.genderLvalue?.lovDisplayVale
                : rowData?.patient?.genderLkey}
            </div>
            <div>Visit ID : {rowData?.encounter?.visitId}</div>
          </Tooltip>
        );

        return (
          <Whisper trigger="hover" placement="top" speaker={tooltipSpeaker}>
            <div style={{ display: 'inline-block' }}>
              {rowData?.patient?.privatePatient ? (
                <Badge color="blue" content="Private">
                  <p style={{ marginTop: '5px', cursor: 'pointer' }}>
                    {rowData?.patient?.fullName}
                  </p>
                </Badge>
              ) : (
                <>
                  <p style={{ cursor: 'pointer' }}>{rowData?.patient?.fullName}</p>
                </>
              )}
            </div>
          </Whisper>
        );
      }
    },
    {
      key: 'diagnosisKey',
      title: <Translate>Pre-op Diagnosis</Translate>,
      render: (rowData: any) => {
        return rowData?.diagnosis?.icdCode + ' - ' + rowData?.diagnosis?.description;
      }
    },
    {
      key: 'oparetionKey',
      title: <Translate>oparation name</Translate>,
      render: (rowData: any) => {
        return rowData?.operation?.name;
      }
    },
    ,
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
      key: 'operationStatusLkey',
      title: <Translate>Status</Translate>,
      render: (rowData: any) => {
        return rowData.operationStatusLvalue
          ? rowData.operationStatusLvalue?.lovDisplayVale
          : rowData.operationStatusLkey;
      }
    },
    {
      key: 'actions',
      title: <Translate>Actions</Translate>,
      render: (rowData: any) => {
        const isDisabled = request?.key !== rowData.key;
        return (
          <HStack spacing={10}>
            <Whisper placement="top" trigger="hover" speaker={<Tooltip>Start</Tooltip>}>
              <FontAwesomeIcon
                icon={faPlay}
                style={isDisabled ? { cursor: 'not-allowed', opacity: 0.5 } : {}}
                onClick={
                  isDisabled
                    ? undefined
                    : async () => {
                        try {
                          setRequest(rowData);
                          const Response = await save({
                            ...request,
                            operationStatusLkey: '3621681578985655',
                            startedAt: Date.now()
                          }).unwrap();
                          dispatch(notify({ msg: 'Started Successfully', sev: 'success' }));
                          refetch();
                          refetchOnGoing();
                          setActiveTab('2');
                          setOpen(true);
                          console.log('Response', Response);
                        } catch (error) {
                          dispatch(notify({ msg: 'Faild', sev: 'error' }));
                        }
                      }
                }
              />
            </Whisper>

            <Whisper placement="top" trigger="hover" speaker={<Tooltip>Cancel</Tooltip>}>
              <FontAwesomeIcon
                style={isDisabled ? { cursor: 'not-allowed', opacity: 0.5 } : {}}
                icon={faSquareXmark}
                onClick={
                  isDisabled
                    ? undefined
                    : () => {
                        setRequest(rowData);
                        setOpenCancelModal(true);
                      }
                }
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
      key: 'deletedAt',
      title: <Translate>Cancelled At/By</Translate>,
      expandable: true,
      render: (rowData: any) => {
        return (
          <>
            <span>{rowData.deletedBy}</span>
            <br />
            <span className="date-table-style">{formatDateWithoutSeconds(rowData.deletedAt)}</span>
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

  const filters = () => (
    <>
      <Form layout="inline" fluid className="container-of-filter-fields-department">
        <MyInput
          fieldType="date"
          fieldLabel="From Date"
          fieldName="fromDate"
          record={dateFilter}
          setRecord={setDateFilter}
          showLabel={false}
        />
        <MyInput
          fieldType="date"
          fieldLabel="To Date"
          fieldName="toDate"
          record={dateFilter}
          setRecord={setDateFilter}
          showLabel={false}
        />
        <Checkbox
          checked={!showCancelled}
          onChange={() => {
            setShowCancelled(!showCancelled);
          }}
        >
          Show Cancelled
        </Checkbox>
      </Form>
      <AdvancedSearchFilters searchFilter={true} />
    </>
  );
  return (
    <Row>
      <Col md={24}>
        <MyTable
          filters={filters()}
          columns={columns}
          data={operationrequestList?.object || []}
          rowClassName={isSelected}
          loading={isLoading}
          onRowClick={rowData => {
            setRequest(rowData);
          }}
        />
      </Col>
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
    </Row>
  );
};
export default RequestList;
