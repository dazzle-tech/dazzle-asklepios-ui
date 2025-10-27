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
import SearchPatientCriteria from '@/components/SearchPatientCriteria';
import './style.less';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyButton from '@/components/MyButton/MyButton';


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
  const [record, setRecord] = useState({});
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

        const tooltipStart = <Tooltip>Start</Tooltip>;
        const tooltipCancel = <Tooltip>Cancel</Tooltip>;

        return (
          <Form layout="inline" fluid className="nurse-doctor-form">
            {/* Start Button */}
            <Whisper trigger="hover" placement="top" speaker={tooltipStart}>
              <div>
                <MyButton
                  size="small"
                  disabled={isDisabled}
                  onClick={async () => {
                    if (isDisabled) return;
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
                      dispatch(notify({ msg: 'Failed', sev: 'error' }));
                    }
                  }}
                >
                  <FontAwesomeIcon icon={faPlay} />
                </MyButton>
              </div>
            </Whisper>

            {/* Cancel Button */}
            <Whisper trigger="hover" placement="top" speaker={tooltipCancel}>
              <div>
                <MyButton
                  size="small"
                  backgroundColor="lightblue"
                  disabled={isDisabled}
                  onClick={() => {
                    if (isDisabled) return;
                    setRequest(rowData);
                    setOpenCancelModal(true);
                  }}
                >
                  <FontAwesomeIcon icon={faSquareXmark} />
                </MyButton>
              </div>
            </Whisper>
          </Form>
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

  const { data: operationLov } = useGetLovValuesByCodeQuery('OPERATION_NAMES');
  const { data: operationorderLov } = useGetLovValuesByCodeQuery('OPERATION_ORDER_TYPE');
  const { data: proclevelLov } = useGetLovValuesByCodeQuery('PROCEDURE_LEVEL');
  const { data: priorityLov } = useGetLovValuesByCodeQuery('ORDER_PRIORITY');
  const { data: statusLov } = useGetLovValuesByCodeQuery('PROC_STATUS');




  const filters = () => {
    return (
      <>
        <Form layout="inline" fluid className="container-of-filter-fields-department">
          <div className='container-of-filter-fields-department-date-filters'>
            <MyInput
              fieldType="date"
              fieldLabel="From Date"
              fieldName="fromDate"
              record={dateFilter}
              setRecord={setDateFilter}
              showLabel={false}
              column
            />
            <MyInput
              fieldType="date"
              fieldLabel="To Date"
              fieldName="toDate"
              record={dateFilter}
              setRecord={setDateFilter}
              showLabel={false}
              column
            />
          </div>
          <SearchPatientCriteria
            record={record}
            setRecord={setRecord}
          />

          <MyInput
            column
            width={150}
            fieldType="select"
            fieldLabel="Operation Name"
            fieldName="key"
            selectData={operationLov?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={record}
            setRecord={setRecord}
          />

          <MyInput
            column
            width={150}
            fieldType="select"
            fieldLabel="Status"
            fieldName="key"
            selectData={statusLov?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={record}
            setRecord={setRecord}
          />

        </Form>

        <AdvancedSearchFilters
          searchFilter={true}
          content={
            <div className="advanced-filters">

              <Form fluid className="dissss">
                <MyInput
                  fieldName="accessTypeLkey"
                  fieldType="select"
                  selectData={operationorderLov?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  fieldLabel="Operation Type"
                  selectDataValue="key"
                  record={record}
                  setRecord={setRecord}
                  searchable={false}
                  width={150}
                />
                <MyInput
                  width={150}
                  fieldName="priority"
                  fieldType="select"
                  record={record}
                  setRecord={setRecord}
                  selectData={proclevelLov?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  fieldLabel="Operation Level"
                  searchable={false}
                />
                <MyInput
                  width={150}
                  fieldType="date"
                  fieldLabel="Operation Date"
                  fieldName="operationDate"
                  record={record}
                  setRecord={setRecord}
                />

                <MyInput
                  width={150}
                  fieldName="priority"
                  fieldType="select"
                  record={record}
                  setRecord={setRecord}
                  selectData={priorityLov?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  fieldLabel="Priority"
                  searchable={false}
                />

              </Form>

            </div>
          }
        />
      </>
    );
  };


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
