import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState } from 'react';
import { Input, Pagination, Panel, Table } from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import { useGetMetadataQuery } from '@/services/setupService';
import { ButtonToolbar, Carousel, IconButton } from 'rsuite';
import ListIcon from '@rsuite/icons/List';
import { ApMetadata } from '@/types/model-types';
import { newApMetadata } from '@/types/model-types-constructor';
import {
  addFilterToListRequest, 
  fromCamelCaseToDBName
} from '@/utils';
import MetadataFields from './MetadataFields';

const Metadata = () => {
  const [metadata, setMetadata] = useState<ApMetadata>({ ...newApMetadata });
  const [carouselActiveIndex, setCarouselActiveIndex] = useState(0);

  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
  const { data: metadataListResponse } = useGetMetadataQuery(listRequest);

  const isSelected = rowData => {
    if (rowData && metadata && rowData.key === metadata.key) {
      return 'selected-row';
    } else return '';
  };

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
    <Carousel
      style={{ height: 'auto', backgroundColor: 'var(--rs-body)' }}
      autoplay={false}
      activeIndex={carouselActiveIndex}
    >
      <Panel
        header={
          <h3 className="title">
            <Translate>Metadata</Translate>
          </h3>
        }
      >
        <ButtonToolbar>
          <IconButton
            disabled={!metadata.key}
            appearance="primary"
            color="orange"
            onClick={() => setCarouselActiveIndex(1)}
            icon={<ListIcon />}
          >
            View Metadata Values
          </IconButton>
        </ButtonToolbar>
        <hr />
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
          headerHeight={80}
          rowHeight={60}
          bordered
          cellBordered
          data={metadataListResponse?.object ?? []}
          onRowClick={rowData => {
            setMetadata(rowData);
          }}
          rowClassName={isSelected}
        >
          <Column sortable flexGrow={4}>
            <HeaderCell>
              <Input onChange={e => handleFilterChange('objectName', e)} />
              <Translate>Object Name</Translate>
            </HeaderCell>
            <Cell dataKey="objectName" />
          </Column>
          <Column sortable flexGrow={4}>
            <HeaderCell>
              <Input onChange={e => handleFilterChange('dbObjectName', e)} />
              <Translate>DB Object Name</Translate>
            </HeaderCell>
            <Cell dataKey="dbObjectName" />
          </Column>
          <Column sortable flexGrow={4}>
            <HeaderCell>
              <Input onChange={e => handleFilterChange('description', e)} />
              <Translate>Description</Translate>
            </HeaderCell>
            <Cell dataKey="description" />
          </Column>
        </Table>
        <div style={{ padding: 20 }}>
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
            total={metadataListResponse?.extraNumeric ?? 0}
          />
        </div>
      </Panel>
      <MetadataFields
        metadata={metadata}
        goBack={() => {
          setCarouselActiveIndex(0);
        }}
      />
    </Carousel>
  );
};

export default Metadata;
