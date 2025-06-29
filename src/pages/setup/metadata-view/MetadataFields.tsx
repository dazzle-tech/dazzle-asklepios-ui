import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Panel, Form } from 'rsuite';
import { useGetMetadataFieldsQuery } from '@/services/setupService';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import './styles.less';
import { ApMetadataField } from '@/types/model-types';
import { newApMetadataField } from '@/types/model-types-constructor';
import BackButton from '@/components/BackButton/BackButton';
const MetadataFields = ({ metadata, goBack }) => {
  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest, pageSize: 15 });
  const [recordOFSearch, setRecordOFSearch] = useState({ fieldName: '' });
  const [metadataField, setMetadataField] = useState<ApMetadataField>({ ...newApMetadataField });

  // Fetch metaDataFields list response
  const { data: metadataFieldListResponse, isFetching } = useGetMetadataFieldsQuery(listRequest);

    // Pagination values
  const pageIndex = listRequest.pageNumber - 1;
  const rowsPerPage = listRequest.pageSize;
  const totalCount = metadataFieldListResponse?.extraNumeric ?? 0;

  // className for selected row
  const isSelected = rowData => {
    if (rowData && metadataField && rowData.key === metadataField.key) {
      return 'selected-row';
    } else return '';
  };

  // Effects
  useEffect(() => {
    if (metadata && metadata.key) {
      setListRequest(addFilterToListRequest('metadata_key', 'match', metadata.key, listRequest));
    }
  }, [metadata]);

  useEffect(() => {
    handleFilterChange('fieldName', recordOFSearch['fieldName']);
  }, [recordOFSearch]);

   // Handle page change in navigation
      const handlePageChange = (_: unknown, newPage: number) => {
        setListRequest({ ...listRequest, pageNumber: newPage + 1 });
      };
      // Handle change rows per page in navigation
      const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setListRequest({
          ...listRequest,
          pageSize: parseInt(event.target.value, 10),
          pageNumber: 1
        });
      };

  // filter table
  const handleFilterChange = (fieldName, value) => {
    if (value) {
      setListRequest(
        addFilterToListRequest(
          fromCamelCaseToDBName(fieldName),
          'startsWithIgnoreCase',
          value,
          listRequest
        )
      );
    } else {
      setListRequest({ ...listRequest, filters: [] });
    }
  };
  //table columns
  const tableColumns = [
    {
      key: 'fieldName',
      title: <Translate>Field Name</Translate>,
      flexGrow: 4,
      dataKey: 'fieldName'
    },
    {
      key: 'dbObjectName',
      title: <Translate>DB Object Name</Translate>,
      flexGrow: 4,
      dataKey: 'dbObjectName'
    },
    {
      key: 'dataType',
      title: <Translate>Data Type</Translate>,
      flexGrow: 4,
      dataKey: 'dataType'
    }
  ];

  return (
    <>
      {metadata && metadata.key && (
        <Panel
          header={
            <p className="title-metadata-fields">
              <Translate> Metadata Fields for </Translate> <i>{metadata?.objectName ?? ''}</i>
            </p>
          }
        >
          <div className="container-of-header-actions-metadata">
            <BackButton appearance="ghost" onClick={goBack} text="Back" />
            <Form layout="inline">
              <MyInput
                fieldName="fieldName"
                fieldType="text"
                record={recordOFSearch}
                setRecord={setRecordOFSearch}
                showLabel={false}
                placeholder="Search by Field Name"
                width={'220px'}
                height={32}
              />
            </Form>
          </div>
          <MyTable
            height={450}
            data={metadataFieldListResponse?.object ?? []}
            columns={tableColumns}
            rowClassName={isSelected}
            loading={isFetching}
            onRowClick={rowData => {
              setMetadataField(rowData);
            }}
            sortColumn={listRequest.sortBy}
            sortType={listRequest.sortType}
            onSortChange={(sortBy, sortType) => {
              if (sortBy) setListRequest({ ...listRequest, sortBy, sortType });
            }}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
          />
        </Panel>
      )}
    </>
  );
};
export default MetadataFields;
