import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { IoSettingsSharp } from 'react-icons/io5';
import {Pagination, Panel, Form } from 'rsuite';
import { useGetMetadataQuery } from '@/services/setupService';
import {Carousel} from 'rsuite';
import { ApMetadata } from '@/types/model-types';
import { newApMetadata } from '@/types/model-types-constructor';
import MyInput from '@/components/MyInput';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import MetadataFields from './MetadataFields';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch } from '@/hooks';
import MyTable from '@/components/MyTable';
import './styles.less';
const Metadata = () => {
  const dispatch = useAppDispatch();
  const [metadata, setMetadata] = useState<ApMetadata>({ ...newApMetadata });
  const [carouselActiveIndex, setCarouselActiveIndex] = useState(0);
  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
  const [recordOFSearch, setRecordOFSearch] = useState({ name: '' });
  const [width, setWidth] = useState<number>(window.innerWidth);

  // Fetch metaData list response
  const { data: metadataListResponse, isLoading } = useGetMetadataQuery(listRequest);
  // Page header setup
  const divContent = (
    <div className='title-metadata'>
      <h5>Metadata</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('Metadata'));
  dispatch(setDivContent(divContentHTML));
  
  // className for selected row
  const isSelected = rowData => {
    if (rowData && metadata && rowData.key === metadata.key) {
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
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [location.pathname, dispatch]);

  useEffect(() => {
    handleFilterChange('objectName', recordOFSearch['objectName']);
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
      key: 'objectName',
      title: <Translate>Object Name</Translate>,
      flexGrow: 4,
      dataKey: 'objectName'
    },
    {
      key: 'dbObjectName',
      title: <Translate>DB Object Name</Translate>,
      flexGrow: 4,
      dataKey: 'dbObjectName'
    },
    {
      key: 'description',
      title: <Translate>Description</Translate>,
      flexGrow: 4,
      dataKey: 'description'
    },
    {
      key: 'icon',
      title: <Translate>View Metadata Values</Translate>,
      flexGrow: 2,
      render: () => <IoSettingsSharp
      title="View Metadata Values"
      size={24}
      fill="var(--primary-gray)"
      onClick={() => setCarouselActiveIndex(1)}
    />
    }
  ];

  return (
    <Carousel
    className='carousel-metadata'
      autoplay={false}
      activeIndex={carouselActiveIndex}
    >
      <Panel>
        <Form className='container-of-search-metadata'>
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
        <MyTable 
          height={450}
          data={metadataListResponse?.object ?? []}
          columns={tableColumns}
          rowClassName={isSelected}
          loading={isLoading}
          onRowClick={rowData => {
            setMetadata(rowData);
          }}
          sortColumn={listRequest.sortBy}
          sortType={listRequest.sortType}
          onSortChange={(sortBy, sortType) => {
            if (sortBy) setListRequest({ ...listRequest, sortBy, sortType });
          }}
        />
        <div className='container-of-pagination-metadata'>
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
