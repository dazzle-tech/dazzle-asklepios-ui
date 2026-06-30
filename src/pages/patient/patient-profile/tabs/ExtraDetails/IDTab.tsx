import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import {
  useDeletePatientDocumentMutation,
  useGetDocumentsByPatientQuery
} from '@/services/patients/patientDocumentsService';
import { newPatientDocument } from '@/types/model-types-constructor-new';
import { faFilePen, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useMemo, useState } from 'react';
import 'react-tabs/style/react-tabs.css';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import { notify } from '@/utils/uiReducerActions';
import { PlusRound } from '@rsuite/icons';
import { Badge } from 'rsuite';
import AddExtraDetails from './AddExtraDetails';

import clsx from 'clsx';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetActiveCountriesQuery } from '@/services/setup/country/countryService';
import UserDateCell from '@/components/UserDateCell';

const IDTab = ({ localPatient }) => {
  const dispatch = useAppDispatch();

  const [secondaryDocumentModalOpen, setSecondaryDocumentModalOpen] = useState(false);
  const [secondaryDocument, setSecondaryDocument] = useState(newPatientDocument);
  const [deleteDocModalOpen, setDeleteDocModalOpen] = useState(false);
  const [selectedSecondaryDocument, setSelectedSecondaryDocument] = useState<any>({
    ...newPatientDocument
  });
  const enumLabels = useEnumOptions('CountryName');
  const enumLabelMap = useMemo(
    () => Object.fromEntries(enumLabels.map(o => [o.value, o.label])),
    [enumLabels]
  );
  const { data: activeCountriesResp } = useGetActiveCountriesQuery({ page: 0, size: 1000 });
  const countryEnum = useMemo(
    () =>
      (activeCountriesResp?.data ?? []).map(c => ({
        value: c.id,
        label: enumLabelMap[c.name] || formatEnumString(c.name)
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeCountriesResp]
  );

  const [deletePatientDocument] = useDeletePatientDocumentMutation();

  // Pagination
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

  const rows = patientSecondaryDocumentsResponse?.data ?? [];
  const totalCount = patientSecondaryDocumentsResponse?.totalCount ?? 0;


  const isSelectedDocument = (rowData: any) =>
    rowData?.id === secondaryDocument?.id ? 'selected-row' : '';

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

  const handleClearDocument = () => {
    setSecondaryDocumentModalOpen(false);
    setSecondaryDocument(newPatientDocument);
    setDeleteDocModalOpen(false);
    setSelectedSecondaryDocument(newPatientDocument);
  };

  const handlePageChange = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatDocumentType = (type: string) => {
    if (!type) return '-';
    return type
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  const columns = [
    {
      key: 'country',
      title: <Translate>Document Country</Translate>,
      flexGrow: 4,
      render: (rowData: any) => {
        if (!rowData.countryId) return <span></span>;
        const label = countryEnum.find(c => c.value === rowData.countryId)?.label;
        return <span>{label ?? '-'}</span>;
      }
    },
    {
      key: 'type',
      title: <Translate>Document Type</Translate>,
      flexGrow: 4,
      render: (rowData: any) =>
        rowData.isPrimary ? (
          <div>
            <Badge color="blue" content="Primary">
              <span className="insurance-badge-text" style={{ fontSize: '14px' }}>
                {formatDocumentType(rowData.type)}
              </span>
            </Badge>
          </div>
        ) : (
          <span>{formatDocumentType(rowData.type)}</span>
        )
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
      render: (row: any) => (
        <UserDateCell
          login={row?.createdBy}
          date={row?.createdDate}
        />
      )
    },
    {
      key: 'updatedAt',
      title: <Translate>UPDATED AT/BY</Translate>,
      flexGrow: 3,
      fullText: true,
      render: (row: any) => (
        <UserDateCell
          login={row?.lastModifiedBy}
          date={row?.lastModifiedDate}
        />
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
            disabled={!localPatient?.id || localPatient?.patientStatus === 'MERGED'} 
            onClick={e => {
              e.stopPropagation();
              setSelectedSecondaryDocument(rowData);
              setSecondaryDocument(rowData);
              setSecondaryDocumentModalOpen(true);
            }}
          />
          <FontAwesomeIcon
            icon={faTrash}
            className={clsx('action-icon delete-icon', { 'not-allowed-cell': localPatient?.patientStatus === 'MERGED' })}
            disabled={!localPatient?.id || localPatient?.patientStatus === 'MERGED'}
            style={{ cursor: rowData.isPrimary ? 'not-allowed' : 'pointer' }}
            // "action-icon delete-icon"

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

  const handleNewDocSecondary = () => {
    setSecondaryDocumentModalOpen(true);
    setSecondaryDocument(newPatientDocument);
    setSelectedSecondaryDocument(newPatientDocument);
  };

  useEffect(() => {
    if (selectedSecondaryDocument?.id) {
      setSecondaryDocument(selectedSecondaryDocument);
    }
  }, [selectedSecondaryDocument]);

  useEffect(() => {
    if (localPatient?.id) {
      setPage(0);
    }
  }, [localPatient?.id]);

  return (
    <div className="tab-main-container">
      <AddExtraDetails
        open={secondaryDocumentModalOpen}
        setOpen={setSecondaryDocumentModalOpen}
        localPatient={localPatient}
        secondaryDocument={secondaryDocument}
        setSecondaryDocument={setSecondaryDocument}
        refetch={patientSecondaryDocuments}
      />

      <div className="tab-content-btns">
        <MyButton
          onClick={handleNewDocSecondary}
          disabled={!localPatient?.id || localPatient?.patientStatus === 'MERGED'}
          prefixIcon={() => <PlusRound />}

        >
          <Translate>New Document</Translate>
        </MyButton>
      </div>

      <MyTable
        height={600}
        data={localPatient?.id ? rows : []}
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
