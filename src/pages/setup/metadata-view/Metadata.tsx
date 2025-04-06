import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { IoSettingsSharp } from 'react-icons/io5';
import { Input, Pagination, Panel, Table, Form } from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import { useGetMetadataQuery } from '@/services/setupService';
import { ButtonToolbar, Carousel, IconButton, InputGroup } from 'rsuite';
import ListIcon from '@rsuite/icons/List';
import { ApMetadata } from '@/types/model-types';
import { newApMetadata } from '@/types/model-types-constructor';
import MyInput from '@/components/MyInput';
import SearchIcon from '@rsuite/icons/Search';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import MetadataFields from './MetadataFields';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch } from '@/hooks';
const Metadata = () => {
  const dispatch = useAppDispatch();
  const [metadata, setMetadata] = useState<ApMetadata>({ ...newApMetadata });
  const [carouselActiveIndex, setCarouselActiveIndex] = useState(0);
  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
  const { data: metadataListResponse } = useGetMetadataQuery(listRequest);
  const divElement = useSelector((state: RootState) => state.div?.divElement);
  const divContent = (
    <div style={{ display: 'flex' }}>
      <h5>Metadata</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('Metadata'));
  dispatch(setDivContent(divContentHTML));
  const isSelected = rowData => {
    if (rowData && metadata && rowData.key === metadata.key) {
      return 'selected-row';
    } else return '';
  };

  const [recordOFSearch, setRecordOFSearch] = useState({ name: '' });

  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [location.pathname, dispatch]);

  useEffect(() => {
    handleFilterChange('objectName', recordOFSearch['objectName']);
  }, [recordOFSearch]);

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
      <Panel>
        <Form style={{marginBottom: "10px"}}>
          <MyInput
            fieldName="objectName"
            fieldType="text"
            record={recordOFSearch}
            setRecord={setRecordOFSearch}
            showLabel={false}
            placeholder="Search by Object Name"
            width={'220px'}
          />
        </Form>

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
          // bordered
          cellBordered
          data={metadataListResponse?.object ?? []}
          onRowClick={rowData => {
            setMetadata(rowData);
          }}
          rowClassName={isSelected}
        >
          <Column sortable flexGrow={4}>
            <HeaderCell>
              <Translate>Object Name</Translate>
            </HeaderCell>
            <Cell dataKey="objectName" />
          </Column>
          <Column sortable flexGrow={4}>
            <HeaderCell>
              <Translate>DB Object Name</Translate>
            </HeaderCell>
            <Cell dataKey="dbObjectName" />
          </Column>
          <Column sortable flexGrow={4}>
            <HeaderCell>
              <Translate>Description</Translate>
            </HeaderCell>
            <Cell dataKey="description" />
          </Column>

          <Column flexGrow={2}>
            <HeaderCell>View Metadata Values</HeaderCell>
            <Cell>
              <IoSettingsSharp
                title="View Metadata Values"
                size={24}
                fill="var(--primary-gray)"
                onClick={() => setCarouselActiveIndex(1)}
              />
            </Cell>
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
