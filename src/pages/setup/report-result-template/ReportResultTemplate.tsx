// Import required modules and components
import React, { useState, useEffect } from 'react';
import MyTable from '@/components/MyTable';
import { Panel, Form } from 'rsuite';
import MyButton from '@/components/MyButton/MyButton';
import PlusIcon from '@rsuite/icons/Plus';
import { MdDelete, MdEdit } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import ReportResultTemplateModal from './ReportResultTemplateModal';
import { useDispatch } from 'react-redux';
import { AiOutlineEye } from 'react-icons/ai';
import { setPageCode, setDivContent } from '@/reducers/divSlice';
import ReactDOMServer from 'react-dom/server';

// Sample data used for initial state
const sampleData = [
  {
    id: 1,
    testType: 'Radiology',
    radiologyTestName: 'Chest X-Ray',
    reportTemplate: 'Standard chest X-ray report',
    active: true
  },
  {
    id: 2,
    testType: 'Radiology',
    radiologyTestName: 'CT Scan Abdomen',
    reportTemplate: 'Abdomen CT report template',
    active: false
  },
  {
    id: 3,
    testType: 'Pathology',
    radiologyTestName: 'Pap-Smear',
    reportTemplate: 'Abdomen Pap Smear template',
    active: true
  }
];

type TemplateType = {
  id: number;
  testType: string;
  radiologyTestName: string;
  reportTemplate: string;
  active?: boolean;
};

const ReportResultTemplate = () => {
  // State for managing data and modals
    const dispatch = useDispatch();
  const [records, setRecords] = useState<TemplateType[]>(sampleData);
  const [modalOpen, setModalOpen] = useState(false);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType | null>(null);
  const [viewOnly, setViewOnly] = useState(false);

  // Handle activation/deactivation toggle
  const handleToggleActive = () => {
    if (selectedItemId !== null) {
      setRecords(prev =>
        prev.map(item => (item.id === selectedItemId ? { ...item, active: !item.active } : item))
      );
    }
    setOpenConfirmModal(false);
    setSelectedItemId(null);
  };

  // Define table columns
  const columns = [
    { key: 'testType', title: 'Test Type', dataKey: 'testType', width: 150 },
    { key: 'radiologyTestName', title: 'Test Name', dataKey: 'radiologyTestName', width: 200 },
    {
      key: 'reportTemplate',
      title: 'Report Template',
      width: 150,
      align: 'center',
      render: (rowData: TemplateType) => (
        // View template button
        <AiOutlineEye
          className="icon-view"
          title="View Template"
          onClick={() => {
            setSelectedTemplate(rowData);
            setViewOnly(true);
            setModalOpen(true);
          }}
        />
      )
    },
    {
      key: 'status',
      title: 'Status',
      dataKey: 'active',
      width: 100,
      align: 'center',
      render: (row: TemplateType) => (row.active ? 'Reactivate' : 'Deactivated')
    },
    {
      key: 'actions',
      title: 'Actions',
      width: 140,
      align: 'center',
      render: (rowData: TemplateType) => (
        <div className="actions">
          {/* Edit button */}
          <MdEdit
            className="icon-edit"
            title="Edit"
            onClick={() => {
              setSelectedTemplate(rowData);
              setViewOnly(false);
              setModalOpen(true);
            }}
          />
          {/* Deactivate or Reactivate button based on status */}
          {rowData.active ? (
            <MdDelete
              className="icon-delete"
              title="Deactivate"
              onClick={() => {
                setSelectedItemId(rowData.id);
                setOpenConfirmModal(true);
              }}
            />
          ) : (
            <FaUndo
              className="icon-undo"
              title="Reactivate"
              onClick={() => {
                setSelectedItemId(rowData.id);
                setOpenConfirmModal(true);
              }}
            />
          )}
        </div>
      )
    }
  ];

  // Apply custom class for deactivated rows
  const rowClassName = (row: TemplateType) => (!row.active ? 'deactivated-row' : '');

  // Render filter section including "Add New" button
  const filters = (
    <Form fluid>
      <div className="filters">
        <div className="bt-right">
          {/* Button to add a new template */}
          <MyButton
            prefixIcon={() => <PlusIcon />}
            onClick={() => {
              setSelectedTemplate(null);
              setViewOnly(false);
              setModalOpen(true);
            }}
          >
            Add New
          </MyButton>
        </div>
      </div>
    </Form>
  );

    useEffect(() => {
      const divContent = (
        <div className="page-title">
          <h5>Report Result Template</h5>
        </div>
      );
      const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
      dispatch(setPageCode('Report_Result_Template'));
      dispatch(setDivContent(divContentHTML));
    }, [dispatch]);
  

  return (
    <Panel>
      {/* Main table displaying templates */}
      <MyTable
        data={records}
        columns={columns}
        loading={false}
        page={0}
        rowsPerPage={20}
        filters={filters}
        totalCount={records.length}
        onPageChange={() => {}}
        onRowsPerPageChange={() => {}}
        rowClassName={rowClassName}
      />

      {/* Modal for adding/editing/viewing a template */}
      <ReportResultTemplateModal
        open={modalOpen}
        setOpen={open => {
        setModalOpen(open);
        if (!open) {
        setSelectedTemplate(null);
        setViewOnly(false);
          }
        }}
        initialData={
          selectedTemplate
            ? {
                radiologyTestName: Array.isArray(selectedTemplate.radiologyTestName)
                  ? selectedTemplate.radiologyTestName
                  : [selectedTemplate.radiologyTestName],
                reportTemplate: selectedTemplate.reportTemplate
              }
            : undefined
        }
        onSave={newData => {
          if (viewOnly) return;

          // Ensure data is properly formatted
          const fixedRadiologyTestName = Array.isArray(newData.radiologyTestName)
            ? newData.radiologyTestName.join(', ')
            : newData.radiologyTestName ?? '';
          const fixedTestType = newData.testType ?? selectedTemplate?.testType ?? '';

          if (selectedTemplate) {
            // Update existing template
            setRecords(prev =>
              prev.map(item =>
                item.id === selectedTemplate.id
                  ? {
                      ...item,
                      ...newData,
                      testType: fixedTestType,
                      radiologyTestName: fixedRadiologyTestName
                    }
                  : item
              )
            );
          } else {
            // Add new template
            const newId = Math.max(0, ...records.map(r => r.id)) + 1;
            setRecords(prev => [
              ...prev,
              {
                id: newId,
                active: true,
                testType: fixedTestType,
                radiologyTestName: fixedRadiologyTestName,
                reportTemplate: newData.reportTemplate ?? ''
              }
            ]);
          }

          setModalOpen(false);
          setSelectedTemplate(null);
        }}
        readOnly={viewOnly}
      />

      {/* Confirmation modal for deactivating/reactivating */}
      <DeletionConfirmationModal
        open={openConfirmModal}
        setOpen={setOpenConfirmModal}
        itemToDelete={
          selectedItemId && records.find(r => r.id === selectedItemId)?.active
            ? 'Deactivate'
            : 'Reactivate'
        }
        actionButtonFunction={handleToggleActive}
        actionType={
          selectedItemId && records.find(r => r.id === selectedItemId)?.active
            ? 'deactivate'
            : 'reactivate'
        }
      />
    </Panel>
  );
};

export default ReportResultTemplate;
