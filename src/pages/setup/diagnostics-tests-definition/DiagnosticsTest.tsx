import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Input, Pagination, Panel, Table, Carousel } from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import {
  useGetLovValuesByCodeQuery,
  useGetServicesQuery,
  useSaveDiagnosticsTestMutation,
  useGetDiagnosticsTestListQuery
} from '@/services/setupService';
import { ButtonToolbar, IconButton } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import EditIcon from '@rsuite/icons/Edit';
import TrashIcon from '@rsuite/icons/Trash';
import { ApDiagnosticTest } from '@/types/model-types';
import { newApDiagnosticTest } from '@/types/model-types-constructor';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import NewDiagnosticsTest from './NewDiagnosticsTest';

const DiagnosticsTest = () => {
 const [diagnosticsTest, setDiagnosticsTest] = useState<ApDiagnosticTest>({...newApDiagnosticTest});
 const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
 const { data: diagnosticsListResponse } = useGetDiagnosticsTestListQuery(listRequest);
 const [saveDiagnosticsTest, saveDiagnosticsTestMutation] = useSaveDiagnosticsTestMutation();
 const [carouselActiveIndex, setCarouselActiveIndex] = useState(0); 

  const handleNew = () => {
    setDiagnosticsTest({ ...newApDiagnosticTest});
  };

  const handleSave = () => {
    saveDiagnosticsTest(diagnosticsTest).unwrap();
  };

  useEffect(() => {
    if (saveDiagnosticsTestMutation.data) {
      setListRequest({ ...listRequest, timestamp: new Date().getTime() });
    }
  }, [saveDiagnosticsTestMutation.data]);

  
  const isSelected = rowData => {
    if (rowData && diagnosticsTest && rowData.key === diagnosticsTest.key) {
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
          <Translate>Diagnostics Tests Definition</Translate>
        </h3>
      }
    >
      <ButtonToolbar>
        <IconButton appearance="primary" icon={<AddOutlineIcon />} onClick={() => {setCarouselActiveIndex(1); setDiagnosticsTest(newApDiagnosticTest)}}>
          Add New
        </IconButton>
        <IconButton
          disabled={!diagnosticsTest.key}
          appearance="primary"
          onClick={() => setCarouselActiveIndex(1)}
          color="green"
          icon={<EditIcon />}
        >
          Edit Selected
        </IconButton>
        <IconButton
          disabled={true || !diagnosticsTest.key}
          appearance="primary"
          color="red"
          icon={<TrashIcon />}
        >
          Delete Selected
        </IconButton>
        <IconButton
          disabled={!diagnosticsTest.key}
          appearance="primary"
          color="cyan"
          icon={<EditIcon />}
        >
          Linked Services
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
          data={diagnosticsListResponse?.object ?? []}
          onRowClick={rowData => {
            setDiagnosticsTest(rowData);
          }}
          rowClassName={isSelected}
        >
          <Column sortable flexGrow={1}>
            <HeaderCell align="center">
              <Input onChange={e => handleFilterChange('testTypeLkey', e)} />
              <Translate>Type</Translate>
            </HeaderCell>
            <Cell>
              {rowData =>
                rowData.testTypeLvalue ? rowData.testTypeLvalue.lovDisplayVale : rowData.testTypeLkey
              }
            </Cell>
          </Column>
          <Column sortable flexGrow={1}>
            <HeaderCell align="center">
              <Input onChange={e => handleFilterChange('testName', e)} />
              <Translate>Name</Translate>
            </HeaderCell>
            <Cell dataKey="testName" />
          </Column>
          <Column sortable flexGrow={1}>
            <HeaderCell align="center">
              <Input onChange={e => handleFilterChange('internalCode', e)} />
              <Translate>Internal Code</Translate>
            </HeaderCell>
            <Cell dataKey="internalCode" />
          </Column>
          <Column sortable flexGrow={1}>
            <HeaderCell align="center">
              <Input onChange={e => handleFilterChange('internationalCodeOne', e)} />
              <Translate>Standard Code</Translate>
            </HeaderCell>
            <Cell dataKey="internationalCodeOne"/>
          </Column>
          <Column sortable flexGrow={3}>
            <HeaderCell  align="center">
              <Input onChange={e => handleFilterChange('deleted_at', e)} />
              <Translate>Status</Translate>
            </HeaderCell>
            <Cell>
            {rowData =>
              rowData.deletedAt === null  ? 'Active' : 'InActive' 
            }
            </Cell>
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
          total={diagnosticsListResponse?.extraNumeric ?? 0}
        />
      </div>

    
    </Panel>
    <NewDiagnosticsTest 
    selectedDiagnosticsTest={diagnosticsTest}
        goBack={() => {
          setCarouselActiveIndex(0);
        }}
        
       
      />
    </Carousel>
  );
};

export default DiagnosticsTest;
