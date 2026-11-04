import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Panel } from 'rsuite';
import { MdModeEdit } from 'react-icons/md';
import { MdDelete } from 'react-icons/md';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import { useDispatch } from 'react-redux';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import EditAvailabilityTemplateModal from './EditAvailabilityTemplateModal';
import { notify } from '@/utils/uiReducerActions';

interface AvailabilityTemplate {
  id: string;
  departmentId: string;
  description: string;
  availability_json: string;
  deleted_by?: string;
  deleted_at?: string;
  is_valid: boolean;
}

const mockAvailabilityTemplates: AvailabilityTemplate[] = [
  {
    id: 'tmpl_004',
    departmentId: 'pediatrics_department',
    description: 'pediatrics_department - Template #1',
    availability_json: '{"days": [{"slots": [{"end": 510, "start": 480, "duration": 30}, {"end": 540, "start": 510, "duration": 30}], "day_of_week": 0}, {"slots": [{"end": 570, "start": 540, "duration": 30}, {"end": 600, "start": 570, "duration": 30}], "day_of_week": 4}]}',
    deleted_by: '',
    deleted_at: '',
    is_valid: true
  },
  {
    id: 'tmpl_003',
    departmentId: 'default_department',
    description: 'default_department - Template #3',
    availability_json: '{"days": [{"slots": [{"end": 530, "start": 500, "duration": 30}, {"end": 560, "start": 530, "duration": 30}], "day_of_week": 1}, {"slots": [{"end": 630, "start": 600, "duration": 30}, {"end": 660, "start": 630, "duration": 30}], "day_of_week": 3}]}',
    deleted_by: '',
    deleted_at: '',
    is_valid: true
  },
  {
    id: 'tmpl_001',
    departmentId: 'default_department',
    description: 'default_department - Template #1',
    availability_json: '{"days": [{"slots": [{"end": 510, "start": 480, "duration": 30}, {"end": 540, "start": 510, "duration": 30}], "day_of_week": 0}, {"slots": [{"end": 510, "start": 480, "duration": 30}, {"end": 540, "start": 510, "duration": 30}], "day_of_week": 1}]}',
    deleted_by: '',
    deleted_at: '',
    is_valid: true
  },
  {
    id: 'tmpl_002',
    departmentId: 'default_department',
    description: 'default_department - Template #2',
    availability_json: '{"days": [{"slots": [{"end": 520, "start": 480, "duration": 40}, {"end": 560, "start": 520, "duration": 40}], "day_of_week": 0}, {"slots": [{"end": 510, "start": 480, "duration": 30}, {"end": 540, "start": 510, "duration": 30}], "day_of_week": 2}]}',
    deleted_by: '',
    deleted_at: '',
    is_valid: true
  }
];

const AvailabilityTemplatePage = () => {
  const dispatch = useDispatch();

  const [selectedTemplate, setSelectedTemplate] = useState<AvailabilityTemplate | null>(null);
  const [load, setLoad] = useState<boolean>(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [record, setRecord] = useState({ filter: '', value: '' });
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      }
    ],
    pageSize: 15
  });

  // Mock data - in real implementation, this would come from API
  const [templates, setTemplates] = useState<AvailabilityTemplate[]>(mockAvailabilityTemplates);
  
  // Pagination values
  const pageIndex = listRequest.pageNumber - 1;
  const rowsPerPage = listRequest.pageSize;
  const totalCount = templates.length;

  // Available fields for filtering
  const filterFields = [
    { label: 'Template ID', value: 'id' },
    { label: 'Department ID', value: 'department_id' },
    { label: 'Description', value: 'description' }
  ];

  // Header page setup
  const divContent = "Availability Templates";


useEffect(() => {
  dispatch(setPageCode('Availability Templates'));
  dispatch(setDivContent(divContent));

  return () => {
    dispatch(setPageCode(''));
    dispatch(setDivContent(''));
  };
}, [dispatch]);

  // Class name for selected row
  const isSelected = (rowData: AvailabilityTemplate) => {
    if (rowData && selectedTemplate && rowData.id === selectedTemplate.id) {
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
    if (record['filter']) {
      handleFilterChange(record['filter'], record['value']);
    } else {
      setListRequest({
        ...initialListRequest,
        filters: [
          {
            fieldName: 'deleted_at',
            operator: 'isNull',
            value: undefined
          }
        ],
        pageSize: listRequest.pageSize,
        pageNumber: 1
      });
    }
  }, [record]);

  // Handle click on Add New Button
  const handleNew = () => {
    const newTemplate: AvailabilityTemplate = {
      id: `tmpl_${Date.now()}`,
      departmentId: '',
      description: '',
      availability_json: '{"days": []}',
      is_valid: true
    };
    setSelectedTemplate(newTemplate);
    setPopupOpen(true);
  };

  // Handle Save Template
  const handleSave = (template: AvailabilityTemplate) => {
    setPopupOpen(false);
    setLoad(true);
    
    // In real implementation, this would call an API
    const existingIndex = templates.findIndex(t => t.id === template.id);
    if (existingIndex >= 0) {
      const updatedTemplates = [...templates];
      updatedTemplates[existingIndex] = template;
      setTemplates(updatedTemplates);
    } else {
      setTemplates([...templates, template]);
    }
    
    dispatch(notify({ msg: 'Availability Template saved successfully', sev: 'success' }));
    setLoad(false);
  };

  // Handle Delete Template
  const handleDelete = (template: AvailabilityTemplate) => {
    setLoad(true);
    
    // In real implementation, this would call an API
    const updatedTemplates = templates.filter(t => t.id !== template.id);
    setTemplates(updatedTemplates);
    
    dispatch(notify({ msg: 'Availability Template deleted successfully', sev: 'success' }));
    setLoad(false);
  };

  // Filter table
  const handleFilterChange = (fieldName: string, value: string) => {
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
      setListRequest({
        ...listRequest,
        filters: [
          {
            fieldName: 'deleted_at',
            operator: 'isNull',
            value: undefined
          }
        ]
      });
    }
  };

  const iconsForActions = (rowData: AvailabilityTemplate) => (
    <div className="container-of-icons">
      <MdModeEdit
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        className="icons-style"
        onClick={() => {
          setSelectedTemplate(rowData);
          setPopupOpen(true);
        }}
      />
      <MdDelete 
        title="Delete" 
        size={24} 
        fill="var(--primary-pink)" 
        className="icons-style" 
        onClick={() => handleDelete(rowData)}
      />
    </div>
  );

  // Table columns
  const tableColumns = [
    {
      key: 'id',
      title: <Translate>Template ID</Translate>,
      flexGrow: 2
    },
    {
      key: 'department_id',
      title: <Translate>Department ID</Translate>,
      flexGrow: 3
    },
    {
      key: 'description',
      title: <Translate>Description</Translate>,
      flexGrow: 4
    },
    {
      key: 'is_valid',
      title: <Translate>Status</Translate>,
      flexGrow: 2,
      render: (rowData: AvailabilityTemplate) => {
        return <p>{rowData?.is_valid ? 'Active' : 'Inactive'}</p>;
      }
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 2,
      render: (rowData: AvailabilityTemplate) => iconsForActions(rowData)
    }
  ];

  // Filter form rendered above the table
  const filters = () => (
    <Form layout="inline" fluid>
      <MyInput
        selectDataValue="value"
        selectDataLabel="label"
        selectData={filterFields}
        fieldName="filter"
        fieldType="select"
        record={record}
        setRecord={updatedRecord => {
          setRecord({
            ...record,
            filter: updatedRecord.filter,
            value: ''
          });
        }}
        showLabel={false}
        placeholder="Select Filter"
        searchable={false}
      />

      <MyInput
        fieldName="value"
        fieldType="text"
        record={record}
        setRecord={setRecord}
        showLabel={false}
        placeholder="Search"
      />
    </Form>
  );

  const handlePageChange = (_: unknown, newPage: number) => {
    setListRequest({ ...listRequest, pageNumber: newPage + 1 });
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setListRequest({
      ...listRequest,
      pageSize: parseInt(event.target.value, 10),
      pageNumber: 1
    });
  };

  return (
    <Panel>
      <MyTable
        data={templates}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={rowData => {
          setSelectedTemplate(rowData);
        }}
        filters={filters()}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        loading={load}
        tableButtons={
          <div className="container-of-add-new-button">
            <MyButton
              prefixIcon={() => <AddOutlineIcon />}
              color="var(--deep-blue)"
              onClick={handleNew}
              width="109px"
            >
              Add New
            </MyButton>
          </div>
        }
      />
      <EditAvailabilityTemplateModal
        open={popupOpen}
        setOpen={setPopupOpen}
        template={selectedTemplate}
        setTemplate={setSelectedTemplate}
        width={width}
        handleSave={handleSave}
      />
    </Panel>
  );
};

export default AvailabilityTemplatePage;
