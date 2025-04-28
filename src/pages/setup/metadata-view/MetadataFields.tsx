import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Pagination, Panel, Form } from 'rsuite';
import { useGetMetadataFieldsQuery } from '@/services/setupService';
import ArowBackIcon from '@rsuite/icons/ArrowBack';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import './styles.less';
import { ApMetadataField } from '@/types/model-types';
import { newApMetadataField } from '@/types/model-types-constructor';
const MetadataFields = ({ metadata, goBack }) => {
  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
  const [recordOFSearch, setRecordOFSearch] = useState({ fieldName: '' });
  const [metadataField, setMetadataField] = useState<ApMetadataField>({ ...newApMetadataField });
  const [width, setWidth] = useState<number>(window.innerWidth);

  // Fetch metaDataFields list response
  const { data: metadataFieldListResponse, isLoading } = useGetMetadataFieldsQuery(listRequest);
  
  // className for selected row
  const isSelected = rowData => {
    if (rowData && metadataField && rowData.key === metadataField.key) {
      return 'selected-row';
    } else return '';
  };

  // Effects
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (metadata && metadata.key) {
      setListRequest(addFilterToListRequest('metadata_key', 'match', metadata.key, listRequest));
    }
  }, [metadata]);

  useEffect(() => {
    handleFilterChange('fieldName', recordOFSearch['fieldName']);
  }, [recordOFSearch]);

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
            <MyButton
              prefixIcon={() => <ArowBackIcon />}
              color="var(--deep-blue)"
              appearance={'ghost'}
              onClick={goBack}
              width="82px"
            >
              Back
            </MyButton>
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
            loading={isLoading}
            onRowClick={rowData => {
              setMetadataField(rowData);
            }}
            sortColumn={listRequest.sortBy}
            sortType={listRequest.sortType}
            onSortChange={(sortBy, sortType) => {
              if (sortBy) setListRequest({ ...listRequest, sortBy, sortType });
            }}
          />
          <div className="container-of-pagination-metadata">
            <Pagination
              prev
              next
              first={width > 500}
              last={width > 500}
              ellipsis={width > 500}
              boundaryLinks={width > 500}
              maxButtons={width < 500 ? 1 : 2}
              size="xs"
              layout={['limit', '|', 'pager']}
              limitOptions={[5, 15, 30]}
              limit={listRequest.pageSize}
              activePage={listRequest.pageNumber}
              onChangePage={pageNumber => {
                setListRequest({ ...listRequest, pageNumber });
              }}
              onChangeLimit={pageSize => {
                setListRequest({ ...listRequest, pageSize });
              }}
              total={metadataFieldListResponse?.extraNumeric ?? 0}
            />
          </div>
        </Panel>
      )}
      {/* {(!metadata || !metadata.key) && (
        // <IconButton appearance="ghost" color="cyan" icon={<ArowBackIcon />} onClick={goBack}>
        //   No Valid Metadata Selected, Go Back
        // </IconButton>

        <MyButton appearance="ghost" prefixIcon={() => <ArowBackIcon />} onClick={goBack}>No Valid Metadata Selected, Go Back</MyButton>
      )} */}
    </>
  );
};
export default MetadataFields;
