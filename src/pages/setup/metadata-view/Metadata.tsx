import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { IoSettingsSharp } from 'react-icons/io5';
import { Panel, Form } from 'rsuite';
import { useGetMetadataQuery } from '@/services/setupService';
import { Carousel } from 'rsuite';
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
  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest,pageSize: 15 });
  const [recordOFSearch, setRecordOFSearch] = useState({ name: '' });
  const [width, setWidth] = useState<number>(window.innerWidth);

  // Fetch metaData list response
  const { data: metadataListResponse, isFetching } = useGetMetadataQuery(listRequest);
   // Pagination values
  const pageIndex = listRequest.pageNumber - 1;
  const rowsPerPage = listRequest.pageSize;
  const totalCount = metadataListResponse?.extraNumeric ?? 0;
  // Page header setup
  const divContent = (
    "Metadata"
  );
  dispatch(setPageCode('Metadata'));
  dispatch(setDivContent(divContent));

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

  //table columns
  const tableColumns = [
    {
      key: 'objectName',
      title: <Translate>Object Name</Translate>,
      dataKey: 'objectName'
    },
    {
      key: 'dbObjectName',
      title: <Translate>DB Object Name</Translate>,
      dataKey: 'dbObjectName'
    },
    {
      key: 'description',
      title: <Translate>Description</Translate>,
      dataKey: 'description'
    },
    {
      key: 'icon',
      title: <Translate>View Metadata Values</Translate>,
      render: () => (
        <IoSettingsSharp
          title="View Metadata Values"
          size={24}
          fill="var(--primary-gray)"
          onClick={() => setCarouselActiveIndex(1)}
          className="icons-style"
        />
      )
    }
  ];

  return (
    <Carousel className="carousel-metadata" autoplay={false} activeIndex={carouselActiveIndex}>
      <Panel>
        <MyTable
          height={450}
          data={metadataListResponse?.object ?? []}
          columns={tableColumns}
          rowClassName={isSelected}
          filters={<Form className="container-of-search-metadata">
          <MyInput
            fieldName="objectName"
            fieldType="text"
            record={recordOFSearch}
            setRecord={setRecordOFSearch}
            showLabel={false}
            placeholder="Search by Object Name"
            width={'220px'}
          />
        </Form>}
          loading={isFetching}
          onRowClick={rowData => {
            setMetadata(rowData);
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
