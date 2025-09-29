import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useGetAllergiesQuery } from '@/services/observationService';
import { useGetAllergensQuery } from '@/services/setupService';
import { initialListRequest, ListRequest } from '@/types/types';
import { faHandDots } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState } from 'react';
import { Checkbox, Table } from 'rsuite';
import './styles.less';

const AllergiesModal = ({ open, setOpen, patient }) => {
  const [showCanceled, setShowCanceled] = useState(true);

  const filters = [
    {
      fieldName: 'patient_key',
      operator: 'match',
      value: patient?.key
    },
    {
      fieldName: 'status_lkey',
      operator: showCanceled ? 'notMatch' : 'match',
      value: '3196709905099521'
    }
  ];
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters
  });
  const {
    data: allergiesListResponse,
    refetch: fetchallerges,
    isLoading
  } = useGetAllergiesQuery(listRequest);
  const { data: allergensListToGetName } = useGetAllergensQuery({
    ...initialListRequest
  });

  const tableColumns = [
    {
      key: 'allergyTypeLvalue',
      dataKey: 'allergyTypeLvalue',
      title: <Translate>Allergy Type</Translate>,
      flexGrow: 2,
      render: (rowData: any) => rowData.allergyTypeLvalue?.lovDisplayVale
    },
    {
      key: 'allergenKey',
      dataKey: 'allergenKey',
      title: <Translate>Allergen</Translate>,
      flexGrow: 2,
      render: (rowData: any) => {
        if (!allergensListToGetName?.object) return 'Loading...';
        const found = allergensListToGetName.object.find(item => item.key === rowData.allergenKey);
        return found?.allergenName || 'No Name';
      }
    },
    {
      key: 'severityLvalue',
      dataKey: 'severityLvalue',
      title: <Translate>Severity</Translate>,
      flexGrow: 1,
      render: (rowData: any) => rowData.severityLvalue?.lovDisplayVale
    },
    {
      key: 'criticalityLkey',
      dataKey: 'criticalityLkey',
      title: <Translate>Certainty type</Translate>,
      flexGrow: 2,
      render: (rowData: any) =>
        rowData.criticalityLkey
          ? rowData.criticalityLvalue?.lovDisplayVale
          : rowData.criticalityLkey
    },
    {
      key: 'onsetLvalue',
      dataKey: 'onsetLvalue',
      title: <Translate>Onset</Translate>,
      flexGrow: 2,
      render: (rowData: any) => rowData.onsetLvalue?.lovDisplayVale
    },
    {
      key: 'onsetDate',
      dataKey: 'onsetDate',
      title: <Translate>Onset Date Time</Translate>,
      flexGrow: 2,
      render: (rowData: any) =>
        rowData.onsetDate ? new Date(rowData.onsetDate).toLocaleString() : 'Undefind'
    },
    {
      key: 'treatmentStrategyLvalue',
      dataKey: 'treatmentStrategyLvalue',
      title: <Translate>Treatment Strategy</Translate>,
      flexGrow: 2,
      render: (rowData: any) => rowData.treatmentStrategyLvalue?.lovDisplayVale
    },
    {
      key: 'sourceOfInformationLvalue',
      dataKey: 'sourceOfInformationLvalue',
      title: <Translate>Source of information</Translate>,
      flexGrow: 2,
      render: (rowData: any) => rowData.sourceOfInformationLvalue?.lovDisplayVale || 'BY Patient'
    },
    {
      key: 'reactionDescription',
      dataKey: 'reactionDescription',
      title: <Translate>Reaction Description</Translate>,
      flexGrow: 2,
      render: (rowData: any) => rowData.reactionDescription
    },
    {
      key: 'typeOfPropensityLkey',
      dataKey: 'typeOfPropensityLkey',
      title: <Translate>Type Of Propensity</Translate>,
      flexGrow: 2,
      render: (rowData: any) =>
        rowData.typeOfPropensityLkey
          ? rowData.typeOfPropensityLvalue?.lovDisplayVale
          : rowData.typeOfPropensityLkey
    },
    {
      key: 'statusLvalue',
      dataKey: 'statusLvalue',
      title: <Translate>Status</Translate>,
      flexGrow: 1,
      render: (rowData: any) => rowData.statusLvalue?.lovDisplayVale
    },

    {
      key: 'notes',
      dataKey: 'notes',
      title: <Translate>Notes</Translate>,
      expandable: true
    },
    {
      key: 'certainty',
      dataKey: 'certainty',
      title: <Translate>Certainty</Translate>,
      expandable: true
    },
    {
      key: 'cancellationReason',
      dataKey: 'cancellationReason',
      title: <Translate>Cancellation Reason</Translate>,
      expandable: true
    },
    {
      key: '',
      title: <Translate>Created At/By</Translate>,
      expandable: true,
      render: (rowData: any) => {
        return (
          <>
            <span>{rowData.createdBy}</span>
            <br />
            <span className="date-table-style">
              {rowData.createdAt ? new Date(rowData.createdAt).toLocaleString() : ''}
            </span>
          </>
        );
      }
    },
    {
      key: '',
      title: <Translate>Updated At/By</Translate>,
      expandable: true,
      render: (rowData: any) => {
        return (
          <>
            <span>{rowData.updatedBy}</span>
            <br />
            <span className="date-table-style">
              {rowData.createdAt ? new Date(rowData.createdAt).toLocaleString() : ''}
            </span>
          </>
        );
      }
    },

    {
      key: '',
      title: <Translate>Cancelled At/By</Translate>,
      expandable: true,
      render: (rowData: any) => {
        return (
          <>
            <span>{rowData.deletedBy}</span>
            <br />
            <span className="date-table-style">
              {rowData.deletedAt ? new Date(rowData.deletedAt).toLocaleString() : ''}
            </span>
          </>
        );
      }
    },
    {
      key: '',
      title: <Translate>Resolved At/By</Translate>,
      expandable: true,
      render: (rowData: any) => {
        if (rowData.statusLkey != '9766169155908512') {
          return (
            <>
              <span>{rowData.resolvedBy}</span>
              <br />
              <span className="date-table-style">
                {rowData.resolvedAt ? new Date(rowData.resolvedAt).toLocaleString() : ''}
              </span>
            </>
          );
        } else {
          return null;
        }
      }
    }
  ];
  const pageIndex = listRequest.pageNumber - 1;

  // how many rows per page:
  const rowsPerPage = listRequest.pageSize;

  // total number of items in the backend:
  const totalCount = allergiesListResponse?.extraNumeric ?? 0;

  // handler when the user clicks a new page number:
  const handlePageChange = (_: unknown, newPage: number) => {
    // MUI gives you a zero-based page, so add 1 for your API

    setListRequest({ ...listRequest, pageNumber: newPage + 1 });
  };

  // handler when the user chooses a different rows-per-page:
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setListRequest({
      ...listRequest,
      pageSize: parseInt(event.target.value, 10),
      pageNumber: 1 // reset to first page
    });
  };
  return (
    <>
      <MyModal
        position="right"
        size="50vw"
        open={open}
        setOpen={setOpen}
        steps={[{ title: 'Allergy', icon: <FontAwesomeIcon icon={faHandDots} /> }]}
        title="Allergy"
        content={
          <>
            <div>
              <Checkbox
                checked={!showCanceled}
                onChange={() => {
                  setShowCanceled(!showCanceled);
                }}
              >
                Show Cancelled
              </Checkbox>
            </div>
            <MyTable
              columns={tableColumns}
              data={allergiesListResponse?.object || []}
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
          </>
        }
      ></MyModal>
    </>
  );
};
export default AllergiesModal;
