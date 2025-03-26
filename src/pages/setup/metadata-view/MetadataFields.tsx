import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { ButtonToolbar, Input, Pagination, Panel, Table,Button,InputGroup } from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import { useGetMetadataFieldsQuery } from '@/services/setupService';
import { IconButton } from 'rsuite';
import SearchIcon from '@rsuite/icons/Search';
import ArowBackIcon from '@rsuite/icons/ArowBack';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import MyInput from '@/components/MyInput';

const MetadataFields = ({ metadata, goBack, ...props }) => {
  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });

  const { data: metadataFieldListResponse } = useGetMetadataFieldsQuery(listRequest);

  useEffect(() => {
    if (metadata && metadata.key) {
      setListRequest(addFilterToListRequest('metadata_key', 'match', metadata.key, listRequest));
    }
  }, [metadata]);

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

  return (
    <>
      {metadata && metadata.key && (
        <Panel
          // header={
          //   <h3 className="title">
          //     <Translate> Metadata Fields for </Translate> <i>{metadata?.metadataName ?? ''}</i>
          //   </h3>
          // }
        >
          <div style={{display:"flex", gap:"20px"}}>
          <Button startIcon={<ArowBackIcon />} style={{ marginBottom: 10}} color="var(--deep-blue)" appearance="ghost" onClick={goBack}> Back </Button>
          <InputGroup inside style={{ width: 170, marginBottom: 10 }}>
                                <InputGroup.Button>
                                  <SearchIcon />
                                </InputGroup.Button>
                                <Input style={{fontSize: "12px"}} placeholder="Search by Field Name" onChange={e => handleFilterChange('fieldName', e)} />
                                
                               </InputGroup>
          </div>

          <Table
            height={400}
            sortColumn={listRequest.sortBy}
            sortType={listRequest.sortType}
            onSortColumn={(sortBy, sortType) => {
              if (sortBy)
                setListRequest({
                  ...listRequest,
                  sortBy,
                  sortType
                });
            }}
            cellBordered
            data={metadataFieldListResponse?.object ?? []}
          >
            <Column sortable flexGrow={4}>
              <HeaderCell>
                {/* <Input onChange={e => handleFilterChange('fieldName', e)} /> */}
                <Translate>Field Name</Translate>
              </HeaderCell>
              <Cell dataKey="fieldName" />
            </Column>
            <Column sortable flexGrow={4}>
              <HeaderCell>
                {/* <Input onChange={e => handleFilterChange('dbFieldName', e)} /> */}
                <Translate>DB Field Name</Translate>
              </HeaderCell>
              <Cell dataKey="dbFieldName" />
            </Column>
            <Column sortable flexGrow={4}>
              <HeaderCell>
                {/* <Input onChange={e => handleFilterChange('dataType', e)} /> */}
                <Translate>Data Type</Translate>
              </HeaderCell>
              <Cell dataKey="dataType" />
            </Column>
          </Table>
          <div style={{ padding: 20, backgroundColor: '#F4F7FC' }}>
            <Pagination
              prev
              next
              first
              last
              ellipsis
              boundaryLinks
              maxButtons={5}
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

      {(!metadata || !metadata.key) && (
        <IconButton appearance="ghost" color="cyan" icon={<ArowBackIcon />} onClick={goBack}>
          No Valid Metadata Selected, Go Back
        </IconButton>
      )}
    </>
  );
};

export default MetadataFields;
