import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import {
  useDeletePatientDocumentMutation,
  useGetDocumentsByPatientQuery
} from '@/services/patients/patientDocumentsService';
import { newPatientDocument } from '@/types/model-types-constructor-new';
import { faFilePen, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useState } from 'react';
import 'react-tabs/style/react-tabs.css';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import { conjureValueBasedOnKeyFromList, formatDateWithoutSeconds } from '@/utils';
import { notify } from '@/utils/uiReducerActions';
import { PlusRound } from '@rsuite/icons';
import { Badge } from 'rsuite';
import AddExtraDetails from './AddExtraDetails';
import { useGetCountriesBulkMutation } from '@/services/setup/country/countryService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';

const IDTab = ({ localPatient }) => {
  const dispatch = useAppDispatch();

  const [secondaryDocumentModalOpen, setSecondaryDocumentModalOpen] = useState(false);
  const [secondaryDocument, setSecondaryDocument] = useState(newPatientDocument);
  const [deleteDocModalOpen, setDeleteDocModalOpen] = useState(false);
  const [selectedSecondaryDocument, setSelectedSecondaryDocument] = useState<any>({
    ...newPatientDocument
  });
  const { data: countryLovQueryResponse } = useGetLovValuesByCodeQuery('CNTRY');

  const [deletePatientDocument] = useDeletePatientDocumentMutation();

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Countries bulk
  const [countriesMap, setCountriesMap] = useState<Record<number | string, any>>({});
  const [getCountriesBulk] = useGetCountriesBulkMutation();

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

  // Load countries in bulk based on countryId in rows (no infinite loop)
  useEffect(() => {
    const loadCountries = async () => {
      const docs = patientSecondaryDocumentsResponse?.data ?? [];
      if (!docs.length) {
        setCountriesMap({});
        return;
      }

      const uniqueIds = Array.from(
        new Set(docs.map(row => row.countryId).filter(id => id !== null && id !== undefined))
      );

      if (!uniqueIds.length) {
        setCountriesMap({});
        return;
      }

      try {
        const countries = await getCountriesBulk(uniqueIds as number[]).unwrap();
        const map = Object.fromEntries(countries.map((c: any) => [c.id, c]));
        setCountriesMap(map);
      } catch (e) {
        console.error('Bulk country load failed', e);
      }
    };

    loadCountries();
  }, [patientSecondaryDocumentsResponse, getCountriesBulk]);

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

        const countryObj = countriesMap[rowData.countryId];
        const countryName =
          countryObj?.name ||
          countryObj?.countryName ||
          countryObj?.countryNameEn ||
          countryObj?.description ||
          '';

        const displayValue =
          conjureValueBasedOnKeyFromList(
            countryLovQueryResponse?.object || [],
            countryName,
            'lovDisplayVale'
          ) || '';

        return <span>{displayValue}</span>;
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
      render: (row: any) =>
        row?.createdDate ? (
          <>
            {row?.createdBy || ''}
            <br />
            <span className="date-table-style">{formatDateWithoutSeconds(row.createdDate)}</span>
          </>
        ) : (
          ''
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
            {row?.lastModifiedBy || ''}
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
          disabled={!localPatient?.id}
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
