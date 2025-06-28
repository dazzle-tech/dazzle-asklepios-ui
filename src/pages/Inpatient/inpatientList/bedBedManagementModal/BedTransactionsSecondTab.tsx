import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { newApEncounter } from '@/types/model-types-constructor';
import React, { useEffect, useState } from 'react';
import MyButton from '@/components/MyButton/MyButton';
import {Form, Panel } from 'rsuite';
import 'react-tabs/style/react-tabs.css';
import * as icons from '@rsuite/icons';
import { formatDateWithoutSeconds } from "@/utils";
import { addFilterToListRequest } from '@/utils';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetBedTransactionsListQuery } from '@/services/encounterService';
import { useLocation, useNavigate } from 'react-router-dom';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useDispatch } from 'react-redux';
import ReactDOMServer from 'react-dom/server';
import { hideSystemLoader, showSystemLoader } from '@/utils/uiReducerActions';
import MyTable from '@/components/MyTable';

const BedTransactionsSecondTab = ({ encounter }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const divContent = (
    <div style={{ display: 'flex' }}>
      <h5>Patients Visit List</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('P_Encounters'));
  dispatch(setDivContent(divContentHTML));
  const [localencounter, setLocalEncounter] = useState<any>({ ...newApEncounter, discharge: false });
  const [manualSearchTriggered, setManualSearchTriggered] = useState(false);

  // State to manage the list request used for filtering and pagination
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'department_key',
        operator: 'match',
        value: encounter?.resourceObject?.key
      }
    ]
  });
  // State to store the selected date range for filtering (fromDate and toDate default to today)
  const [dateFilter, setDateFilter] = useState({
    fromDate: new Date(),
    toDate: new Date()
  });
  // Fetch bed transaction data from the backend using the current listRequest as filters
  const { data: bedTransactionsListResponse, isFetching, isLoading } = useGetBedTransactionsListQuery(listRequest);

  //Functions
  // This function checks if a given row is selected based on matching keys
  const isSelected = rowData => {
    if (rowData && localencounter && rowData.key === localencounter.key) {
      return 'selected-row';
    } else return '';
  };

  // This function handles manual date-based search for filtering records
  const handleManualSearch = () => {
    setManualSearchTriggered(true);

    const fromDate = dateFilter.fromDate ? new Date(dateFilter.fromDate) : null;
    const toDate = dateFilter.toDate ? new Date(dateFilter.toDate) : null;

    if (fromDate) fromDate.setHours(0, 0, 0, 0);
    if (toDate) toDate.setHours(23, 59, 59, 999);

    if (fromDate && toDate) {
      setListRequest(
        addFilterToListRequest(
          'created_at',
          'between',
          `${fromDate.getTime()}_${toDate.getTime()}`,
          listRequest
        )
      );
    } else if (fromDate) {
      setListRequest(
        addFilterToListRequest('created_at', 'gte', fromDate.getTime().toString(), listRequest)
      );
    } else if (toDate) {
      setListRequest(
        addFilterToListRequest('created_at', 'lte', toDate.getTime().toString(), listRequest)
      );
    } else {
      setListRequest({
        ...listRequest, filters: [
          {
            fieldName: 'department_key',
            operator: 'match',
            value: encounter?.resourceObject?.key

          }
        ]
      });
    }
  };



  //useEffect
  useEffect(() => {
    dispatch(setPageCode(''));
    dispatch(setDivContent(' '));
  }, [location.pathname, dispatch, isLoading]);
  useEffect(() => {
    if (!isFetching && manualSearchTriggered) {
      setManualSearchTriggered(false);
    }
  }, [isFetching, manualSearchTriggered]);
  useEffect(() => {
    // init list
    handleManualSearch();
  }, []);
  useEffect(() => {
    setLocalEncounter({ ...encounter });
  }, [encounter]);
  useEffect(() => {
    if (isLoading || (manualSearchTriggered && isFetching)) {
      dispatch(showSystemLoader());
    } else if ((isFetching && isLoading)) {
      dispatch(hideSystemLoader());
    }
    return () => {
      dispatch(hideSystemLoader());
    };
  }, [isLoading, isFetching, dispatch]);


  // table columns
  const tableColumns = [
    {
      key: 'queueNumber',
      title: <Translate>#</Translate>,
      dataKey: 'queueNumber',
      render: rowData => rowData?.patient?.patientMrn
    },
    {
      key: 'patientFullName',
      title: <Translate>PATIENT NAME</Translate>,
      render: rowData => rowData?.patient?.fullName
    },
    {
      key: 'fromBed',
      title: <Translate>FROM BED</Translate>,
      render: rowData => rowData?.fromBed?.name
    },
    {
      key: 'fromRoom',
      title: <Translate>ROOM</Translate>,
      render: rowData => rowData.fromRoom?.name
    },
    {
      key: 'toBed',
      title: <Translate>TO BED</Translate>,
      render: rowData => rowData?.toBed?.name
    },
    {
      key: 'toRoom',
      title: <Translate>ROOM</Translate>,
      render: rowData => rowData.toRoom?.name
    },
    {
      key: 'admitSource',
      title: <Translate>Admit Source</Translate>,
      render: rowData => rowData?.admitOutpatientInpatient?.admitSourceLvalue ?
        rowData?.admitOutpatientInpatient?.admitSourceLvalue?.lovDisplayVale : rowData?.admitOutpatientInpatient?.admitSourceLkey
    },
    {
      key: "admissionDate",
      title: <Translate>Admission Date</Translate>,
      render: (rowData: any) => {
        return (<span className='date-table-style'>{formatDateWithoutSeconds(rowData?.admitOutpatientInpatient?.createdAt)}</span>)
      }
    },
    {
      key: "",
      title: <Translate>Moved By\At</Translate>,
      render: (rowData: any) => {
        return (<>
          <span>Current User</span>
          <br />
          <span className='date-table-style'>{formatDateWithoutSeconds(rowData?.createdAt)}</span>
        </>)
      }
    },
  ];

  const pageIndex = listRequest.pageNumber - 1;

  // how many rows per page:
  const rowsPerPage = listRequest.pageSize;

  // total number of items in the backend:
  const totalCount = bedTransactionsListResponse?.extraNumeric ?? 0;

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

  const filters = () => {
    return (
      <Form layout="inline" fluid className="date-filter-form">
        <MyInput
          column
          width={180}
          fieldType="date"
          fieldLabel="From Date"
          fieldName="fromDate"
          record={dateFilter}
          setRecord={setDateFilter}
        />
        <MyInput
          width={180}
          column
          fieldType="date"
          fieldLabel="To Date"
          fieldName="toDate"
          record={dateFilter}
          setRecord={setDateFilter}
        />
        <div className="search-btn">
          <MyButton onClick={handleManualSearch}>
            <icons.Search />
          </MyButton>
        </div>
      </Form>
    );
  };
  return (
    <Panel>
      <MyTable
        filters={filters()}
        height={600}
        data={bedTransactionsListResponse?.object ?? []}
        columns={tableColumns}
        rowClassName={isSelected}
        loading={isLoading || (manualSearchTriggered && isFetching)}
        onRowClick={rowData => {
          setLocalEncounter(rowData);
        }}
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
    </Panel>
  );
};

export default BedTransactionsSecondTab;