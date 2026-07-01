import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import {
  newPatientPreferredHealthProfessional,
  newPractitioner
} from '@/types/model-types-constructor-new';
import { PatientPreferredHealthProfessional, Practitioner } from '@/types/model-types-new';
import { notify } from '@/utils/uiReducerActions';
import { faTrash, faUserPen } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { PlusRound } from '@rsuite/icons';
import React, { useEffect, useState } from 'react';
import '../styles.less';
import AddPrefferdHealthProfessionalModal from './AddPrefferdHealthProfessionalModal';
import {
  useDeletePatientPreferredHealthProfessionalMutation,
  useGetPatientPreferredHealthProfessionalsQuery
} from '@/services/patients/PatientPreferredHealthProfessional';
import { PaginationPerPage } from '@/utils/paginationPerPage';
import { useGetPractitionersBulkMutation } from '@/services/setup/practitioner/PractitionerService';

const PreferredHealthProfessional = ({ patient, isClick }) => {
  const dispatch = useAppDispatch();

  const [open, setOpen] = useState(false);
  const [editable, setEditable] = useState(false);
  const [deletePreferredHealthModalOpen, setDeletePreferredHealthModalOpen] = useState(false);

  const [patientHP, setPatientHP] = useState<PatientPreferredHealthProfessional>({
    ...newPatientPreferredHealthProfessional
  });
  const [practitioner, setPractitioner] = useState<Practitioner>({ ...newPractitioner });

  const [deletePatientPH] = useDeletePatientPreferredHealthProfessionalMutation();

  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc',
    timestamp: Date.now()
  });

  const {
    data: preferredHPResponse,
    isFetching,
    refetch
  } = useGetPatientPreferredHealthProfessionalsQuery(
    {
      page: paginationParams.page,
      size: paginationParams.size,
      sort: paginationParams.sort,
      patientId: patient?.id
    },
    { skip: !patient.id }
  );

  const rowsPerPage = paginationParams.size;
  const pageIndex = paginationParams.page;
  const totalCount = preferredHPResponse?.totalCount ?? 0;
  const links = preferredHPResponse?.links ?? {};

  const [practitionersMap, setPractitionersMap] = useState<Record<number | string, Practitioner>>(
    {}
  );
  const [getPractitionersBulk] = useGetPractitionersBulkMutation();

  useEffect(() => {
    const loadPractitioners = async () => {
      const rows = preferredHPResponse?.data ?? [];
      if (!rows.length) {
        setPractitionersMap({});
        return;
      }

      const uniqueIds = Array.from(
        new Set(rows.map(row => row.practitionerId).filter(id => id !== null && id !== undefined))
      );

      try {
        const practitioners = await getPractitionersBulk(uniqueIds).unwrap();
        const map = Object.fromEntries(practitioners.map(p => [p.id, p]));
        setPractitionersMap(map);
      } catch (e) {
        console.error('Bulk practitioner load failed', e);
      }
    };

    loadPractitioners();
  }, [preferredHPResponse]);

  const handleNewPreferredHP = () => {
    setEditable(false);
    setPatientHP({ ...newPatientPreferredHealthProfessional });
    setPractitioner({ ...newPractitioner });
    setOpen(true);
  };

  const handleDeletePH = () => {
    deletePatientPH({
      id: patientHP.id,
      patientId: patient.id
    })
      .unwrap()
      .then(() => {
        dispatch(
          notify({ msg: 'Primary Care Provider Deleted Successfully', sev: 'success' })
        );
        refetch();
      });

    setDeletePreferredHealthModalOpen(false);
    setPatientHP({ ...newPatientPreferredHealthProfessional });
    setPractitioner({ ...newPractitioner });
  };

  const handlePageChange = (event, newPage) => {
    PaginationPerPage.handlePageChange(
      event,
      newPage,
      paginationParams,
      links,
      setPaginationParams
    );
  };

  const handleRowsPerPageChange = event => {
    const newSize = Number(event.target.value);
    setPaginationParams({
      ...paginationParams,
      size: newSize,
      page: 0,
      timestamp: Date.now()
    });
  };

  const columns = [
    {
      key: 'practitionerId',
      title: <Translate>Name of the HP</Translate>,
      flexGrow: 4,
      render: row => {
        const p = practitionersMap[row.practitionerId];
        if (!p) return '';
        return `${p.firstName} ${p.lastName ?? ''}`.trim();
      }
    },
    {
      key: 'phoneNumber',
      title: <Translate>Phone Number</Translate>,
      flexGrow: 4,
      render: row => practitionersMap[row.practitionerId]?.phoneNumber ?? ''
    },
    {
      key: 'email',
      title: <Translate>Email</Translate>,
      flexGrow: 4,
      render: row => {
        const p = practitionersMap[row.practitionerId];
        return p?.email || '';
      }
    },
    {
      key: 'networkAffiliation',
      title: <Translate>Network Affiliation</Translate>,
      flexGrow: 4,
      dataKey: 'networkAffiliation'
    },
    {
      key: 'relatedWith',
      title: <Translate>Related with</Translate>,
      flexGrow: 4,
      dataKey: 'relatedWith'
    },
    {
      key: 'actions',
      title: <Translate>Actions</Translate>,
      width: 120,
      render: row => {
        const p = practitionersMap[row.practitionerId];
        return (
          <div className="container-of-icons">
            <FontAwesomeIcon
              icon={faUserPen}
              style={{ cursor: 'pointer' }}
              disabled={patient?.patientStatus === 'MERGED'}
              onClick={() => {
                setPatientHP(row);
                setPractitioner(p || { ...newPractitioner });
                setEditable(true);
                setOpen(true);
              }}
            />
            <FontAwesomeIcon
              icon={faTrash}
              style={{ marginLeft: 15, color: 'var(--primary-pink)', cursor: 'pointer' }}
              disabled={patient?.patientStatus === 'MERGED'}
              onClick={() => {
                setPatientHP(row);
                setDeletePreferredHealthModalOpen(true);
              }}
            />
          </div>
        );
      }
    }
  ];

  const isSelected = row => (row?.id === patientHP?.id ? 'selected-row' : '');

// Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <div dir={dir}>
    <div className="tab-main-container">
      <AddPrefferdHealthProfessionalModal
        open={open}
        setOpen={setOpen}
        patient={patient}
        patientHP={patientHP}
        setPatientHP={setPatientHP}
        refetch={refetch}
        practitioner={practitioner}
        setPractitioner={setPractitioner}
        editable={editable}
      />

      <DeletionConfirmationModal
        open={deletePreferredHealthModalOpen}
        setOpen={setDeletePreferredHealthModalOpen}
        itemToDelete="Record"
        actionButtonFunction={handleDeletePH}
      />

      <div className="tab-content-btns">
        <MyButton
          onClick={handleNewPreferredHP}
          disabled={isClick || patient?.patientStatus === 'MERGED'}
          prefixIcon={() => <PlusRound />}
        >
          New Primary Care Provider
        </MyButton>
      </div>

      <MyTable
        data={patient?.id ? preferredHPResponse?.data ?? [] : []}
        loading={isFetching}
        columns={columns}
        onRowClick={row => {
          
          const p = practitionersMap[row.practitionerId];
          setPatientHP(row);
          setEditable(true);
          setPractitioner(p || { ...newPractitioner });
        }}
        rowClassName={isSelected}
        totalCount={totalCount}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />
    </div>
    </div>
  );
};

export default PreferredHealthProfessional;
