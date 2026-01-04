import React, { useState } from 'react';
import { Panel, Form } from 'rsuite';
import { MdModeEdit, MdDelete } from 'react-icons/md';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';
import EditAvailabilityTemplateModalNew from './AvailabilityTemplatePageNewModal';


const mockAvailabilityTemplates = [
  {
    id: 'tmpl_004',
    departmentId: 'pediatrics_department',
    description: 'pediatrics_department - Template #1',
    availability_json: '{}',
    is_valid: true
  },
  {
    id: 'tmpl_003',
    departmentId: 'default_department',
    description: 'default_department - Template #3',
    availability_json: '{}',
    is_valid: true
  },
  {
    id: 'tmpl_002',
    departmentId: 'default_department',
    description: 'default_department - Template #2',
    availability_json: '{}',
    is_valid: false
  }
];

const AvailabilityTemplatePageNew = () => {
  const [data, setData] = useState(mockAvailabilityTemplates);
  const [record, setRecord] = useState<{ filter?: string; value?: string }>({});
  const [openModal, setOpenModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);

  const columns = [
    {
      key: 'id',
      title: <Translate>Template ID</Translate>,
      flexGrow: 2
    },
    {
      key: 'departmentId',
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
      render: (row) =>
        row.is_valid ? 'Active' : 'Inactive'
    },
    {
      key: 'actions',
      title: '',
      flexGrow: 2,
      render: (row) => (
        <div className="container-of-icons">
          <MdModeEdit
            size={22}
            className="icons-style"
            onClick={() => {
              setSelectedTemplate(row);
              setOpenModal(true);
            }}
          />
          <MdDelete
            size={22}
            className="icons-style"
          />
        </div>
      )
    }
  ];

  const filters = (
    <Form layout="inline">
      <MyInput
        fieldType="select"
        fieldName="filter"
        selectData={[
          { label: 'Template ID', value: 'id' },
          { label: 'Department ID', value: 'departmentId' },
          { label: 'Description', value: 'description' }
        ]}
        record={record}
        setRecord={setRecord}
        showLabel={false}
        placeholder="Filter By"
        searchable={false}
      />

      <MyInput
        fieldType="text"
        fieldName="value"
        record={record}
        setRecord={setRecord}
        showLabel={false}
        placeholder="Search"
      />
    </Form>
  );

  return (
    <Panel>

      <MyTable
        columns={columns}
        data={mockAvailabilityTemplates}
        height={500}
        filters={filters}
        tableButtons={<MyButton
                        icon="plus"
                        appearance="primary"
                        onClick={() => {
                          setSelectedTemplate(null);
                          setOpenModal(true);
                        }}
                      >
                        Add Template
                      </MyButton>
                      }
      />




      <MyModal
        open={openModal}
        setOpen={setOpenModal}
        title={
          selectedTemplate
            ? <Translate>Edit Availability Template</Translate>
            : <Translate>New Availability Template</Translate>
        }
        size="70vw"
        content={
          <EditAvailabilityTemplateModalNew />
        }
      />

    </Panel>
  );
};

export default AvailabilityTemplatePageNew;
