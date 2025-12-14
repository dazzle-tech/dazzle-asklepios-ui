import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { faTrash, faFilePen } from '@fortawesome/free-solid-svg-icons';
import React, { useEffect, useState } from 'react';
import 'react-tabs/style/react-tabs.css';
import {
  useGetDocumentsByPatientQuery,
  useDeletePatientDocumentMutation
} from '@/services/patients/patientDocumentsService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPen } from '@fortawesome/free-solid-svg-icons';
import { newPatientDocument } from '@/types/model-types-constructor-new';

import { PlusRound } from '@rsuite/icons';
import { notify } from '@/utils/uiReducerActions';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import AddExtraDetails from './AddExtraDetails';
import { formatDateWithoutSeconds } from '@/utils';

const IDTab = ({ localPatient }) => {
  const dispatch = useAppDispatch();
  const [secondaryDocumentModalOpen, setSecondaryDocumentModalOpen] = useState(false);
  const [secondaryDocument, setSecondaryDocument] = useState(newPatientDocument);
  const [deleteDocModalOpen, setDeleteDocModalOpen] = useState(false);
  const [deletePatientDocument] = useDeletePatientDocumentMutation();
  const [selectedSecondaryDocument, setSelectedSecondaryDocument] = useState<any>({
    ...newPatientDocument
  });

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Fetch patient documents list
  const {
    data: patientSecondaryDocumentsResponse,
    refetch: patientSecondaryDocuments,
    isLoading
  } = useGetDocumentsByPatientQuery(
    {
      patientId: localPatient?.id,
      page,
      size: rowsPerPage,
      sort: 'createdDate,desc'
    },
    { skip: !localPatient?.id }
  );

  // Function to check if the current row is the selected one
  const isSelectedDocument = rowData => {
    if (rowData && secondaryDocument && secondaryDocument.id === rowData.id) {
      return 'selected-row';
    } else return '';
  };

  // Handle Delete Secondary Document Function
  const handleDeleteSecondaryDocument = () => {
    deletePatientDocument({
      id: selectedSecondaryDocument.id
    })
      .unwrap()
      .then(() => {
        patientSecondaryDocuments();
        dispatch(notify({ msg: 'Document Deleted Successfully', sev: 'success' }));
        setDeleteDocModalOpen(false);
        handleClearDocument();
      })
      .catch(error => {
        dispatch(notify({ msg: 'Failed to delete document', sev: 'error' }));
        console.error('Error deleting document:', error);
      });
  };

  // Handle Clear Secondary Document Function
  const handleClearDocument = () => {
    setSecondaryDocumentModalOpen(false);
    setSecondaryDocument(newPatientDocument);
    setDeleteDocModalOpen(false);
    setSelectedSecondaryDocument(newPatientDocument);
  };

  // Handle Edit Secondary Document Function
  const handleEditSecondaryDocument = () => {
    if (selectedSecondaryDocument?.id) {
      setSecondaryDocumentModalOpen(true);
    }
  };

  // Change page event handler
  const handlePageChange = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Change number of rows per page
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reset to first page
  };

  // Format document type for display
  const formatDocumentType = (type: string) => {
    if (!type) return '-';
    // Convert enum format to readable format
    return type
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  const columns = [
    {
      key: 'isPrimary',
      title: <Translate>Primary</Translate>,
      flexGrow: 2,
      render: (rowData: any) => (
        <span style={{ color: rowData.isPrimary ? '#4caf50' : '#757575' }}>
          {rowData.isPrimary ? '✓ Yes' : 'No'}
        </span>
      )
    },
    {
      key: 'country',
      title: <Translate>Document Country</Translate>,
      flexGrow: 4,
      render: (rowData: any) => rowData.country || '-'
    },
    {
      key: 'type',
      title: <Translate>Document Type</Translate>,
      flexGrow: 4,
      render: (rowData: any) => formatDocumentType(rowData.type)
    },
    {
      key: 'number',
      title: <Translate>Document Number</Translate>,
      flexGrow: 4,
      dataKey: 'number'
    },
    {
      key: 'createdAt',
      title: <Translate>CREATED AT/BY</Translate>,
      flexGrow: 3,
      fullText: true,
      render: (row: any) =>
        row?.createdDate ? (
          <>
            {row?.createdBy || '-'}
            <br />
            <span className="date-table-style">{formatDateWithoutSeconds(row.createdDate)}</span>
          </>
        ) : (
          '-'
        )
    },
    {
      key: 'updatedAt',
      title: <Translate>UPDATED AT/BY</Translate>,
      flexGrow: 3,
      fullText: true,
      render: (row: any) =>
        row?.lastModifiedDate ? (
          <>
            {row?.lastModifiedBy || '-'}
            <br />
            <span className="date-table-style">
              {formatDateWithoutSeconds(row.lastModifiedDate)}
            </span>
          </>
        ) : (
          '-'
        )
    },
    {
      key: 'actions',
      title: <Translate>Actions</Translate>,
      flexGrow: 2,
      render: (rowData: any) => (
        <div className="table-actions">
          <FontAwesomeIcon
            icon={faFilePen}
            className="action-icon edit-icon"
            onClick={e => {
              e.stopPropagation();
              setSelectedSecondaryDocument(rowData);
              setSecondaryDocument(rowData);
              setSecondaryDocumentModalOpen(true);
            }}
          />
          <FontAwesomeIcon
            icon={faTrash}
            className="action-icon delete-icon"
            onClick={e => {
              e.stopPropagation();
              setSelectedSecondaryDocument(rowData);
              setDeleteDocModalOpen(true);
            }}
          />
        </div>
      )
    }
  ];

  // Handle adding a new Document Function
  const handleNewDocSecondary = () => {
    setSecondaryDocumentModalOpen(true);
    setSecondaryDocument(newPatientDocument);
    setSelectedSecondaryDocument(newPatientDocument);
  };

  // Effects
  useEffect(() => {
    if (selectedSecondaryDocument?.id) {
      setSecondaryDocument(selectedSecondaryDocument);
    }
  }, [selectedSecondaryDocument]);

  // Reset to first page when patient changes
  useEffect(() => {
    if (localPatient?.id) {
      setPage(0);
    }
  }, [localPatient?.id]);

  const totalCount = patientSecondaryDocumentsResponse?.totalCount ?? 0;

  return (
    <div className="tab-main-container">
      <div className="tab-content-btns">
        <AddExtraDetails
          open={secondaryDocumentModalOpen}
          setOpen={setSecondaryDocumentModalOpen}
          localPatient={localPatient}
          secondaryDocument={secondaryDocument}
          setSecondaryDocument={setSecondaryDocument}
          refetch={patientSecondaryDocuments}
        />
        <MyButton
          onClick={handleNewDocSecondary}
          disabled={!localPatient?.id}
          prefixIcon={() => <PlusRound />}
        >
          New Document
        </MyButton>
      </div>
      <MyTable
        height={600}
        data={patientSecondaryDocumentsResponse?.data ?? []}
        columns={columns}
        onRowClick={rowData => {
          setSelectedSecondaryDocument(rowData);
        }}
        rowClassName={isSelectedDocument}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        loading={isLoading}
      />
      <DeletionConfirmationModal
        open={deleteDocModalOpen}
        setOpen={setDeleteDocModalOpen}
        itemToDelete="Document"
        actionButtonFunction={handleDeleteSecondaryDocument}
      />
    </div>
  );
};

export default IDTab;
