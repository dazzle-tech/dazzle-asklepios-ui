import CancellationModal from '@/components/CancellationModal';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';
import {
  useGetEncounterVaccinationsActiveQuery,
  useGetEncounterVaccinationsAllQuery,
  useGetPatientVaccinationsActiveQuery,
  useGetPatientVaccinationsAllQuery,
  useAddEncounterVaccinationMutation,
  useUpdateEncounterVaccinationMutation,
  useCancelEncounterVaccinationMutation,
  useReviewEncounterVaccinationMutation
} from '@/services/encounterMedical/encounterVaccinationService';
import { EncounterVaccination, Vaccine, VaccineBrand, VaccineDose } from '@/types/model-types-new';
import { newEncounterVaccination, newVaccine, newVaccineBrand, newVaccineDose } from '@/types/model-types-constructor-new';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import { notify } from '@/utils/uiReducerActions';
import CheckOutlineIcon from '@rsuite/icons/CheckOutline';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import PlusIcon from '@rsuite/icons/Plus';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MdModeEdit } from 'react-icons/md';
import { useLocation } from 'react-router-dom';
import { Checkbox } from 'rsuite';
import AddEncounterVaccine from './AddEncounterVaccine';
import './styles.less';

import { useLazyGetVaccinesByIdsQuery } from '@/services/vaccine/vaccineService';
import { useLazyGetVaccineBrandsByIdsQuery } from '@/services/vaccine/vaccineBrandsService';
import { useLazyGetVaccineDosesByIdsQuery } from '@/services/vaccine/vaccineDosesService';
import { extractPaginationFromLink } from '@/utils/paginationHelper';

import { toHumanEncounterVaccinationError } from './toHumanEncounterVaccinationError';

const uniqueNums = (arr: any[]): number[] =>
  Array.from(
    new Set(
      arr
        .filter(x => x !== null && x !== undefined)
        .map(x => Number(x))
        .filter(n => !Number.isNaN(n))
    )
  );

const getVaccineId = (row: any) => row?.vaccineId ?? row?.vaccine?.id;

const getBrandId = (row: any) =>
  row?.vaccineBrandId ?? row?.vaccineBranvaccineDoseId ?? row?.vaccineBrandDoseId ?? row?.brandId;

const getDoseId = (row: any) => row?.vaccineDoseId ?? row?.doseId;

const normalizeArray = (res: any): any[] => {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.data)) return res.data;
  return [];
};

const getCheckboxCheckedValue = (firstArg: any, secondArg: any): boolean => {
  if (typeof secondArg === 'boolean') return secondArg;
  if (typeof firstArg === 'boolean') return firstArg;
  const checkedFromEvent = secondArg?.target?.checked ?? firstArg?.target?.checked;
  return Boolean(checkedFromEvent);
};

const VaccinationTab = ({ disabled, patient: propPatient, encounter: propEncounter, edit: propEdit }: any) => {
  const location = useLocation();
  const state = location.state || {};
  const patient = propPatient || state.patient;
  const encounter = propEncounter || state.encounter;
  const edit = propEdit ?? state.edit;

  const authSlice = useAppSelector((s: any) => s.auth);
  const dispatch = useAppDispatch();

  const [encounterVaccination, setEncounterVaccination] = useState<EncounterVaccination>({
    ...newEncounterVaccination
  });

  const [selectedRow, setSelectedRow] = useState<any>(null);

  const [popupOpen, setPopupOpen] = useState(false);
  const [popupCancelOpen, setPopupCancelOpen] = useState(false);
  const [modalKey, setModalKey] = useState(0);

  const [showCancelled, setShowCancelled] = useState(false);
  const [showAllVaccines, setShowAllVaccines] = useState(false);

  const [isEncounterStatusClosed, setIsEncounterStatusClosed] = useState(false);

  const [pagination, setPagination] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc',
    timestamp: Date.now()
  });

  useAddEncounterVaccinationMutation();
  useUpdateEncounterVaccinationMutation();
  const [cancelEncounterVaccination] = useCancelEncounterVaccinationMutation();
  const [reviewEncounterVaccination] = useReviewEncounterVaccinationMutation();

  const [triggerVaccinesBulk] = useLazyGetVaccinesByIdsQuery();
  const [triggerBrandsBulk] = useLazyGetVaccineBrandsByIdsQuery();
  const [triggerDosesBulk] = useLazyGetVaccineDosesByIdsQuery();

  const [vaccinesById, setVaccinesById] = useState<Record<number, Vaccine>>({});
  const [brandsById, setBrandsById] = useState<Record<number, VaccineBrand>>({});
  const [dosesById, setDosesById] = useState<Record<number, VaccineDose>>({});

  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const bulkKeyRef = useRef<string>('');

  const encounterId = parseInt(encounter?.id, 10);
  const patientId = parseInt(patient.id, 10);

  useEffect(() => {
    if (encounter?.encounterStatusLkey === 'CLOSED') setIsEncounterStatusClosed(true);
  }, [encounter?.encounterStatusLkey]);

  const encounterScope = !showAllVaccines;
  const patientScope = showAllVaccines;

  const encounterActive = encounterScope && !showCancelled;
  const encounterAll = encounterScope && showCancelled;
  const patientActive = patientScope && !showCancelled;
  const patientAll = patientScope && showCancelled;

  const {
    data: encounterActiveResp,
    isLoading: encounterActiveLoading,
    refetch: refetchEncounterActive
  } = useGetEncounterVaccinationsActiveQuery(
    { encounterId, page: pagination.page, size: pagination.size, sort: pagination.sort, timestamp: pagination.timestamp } as any,
    { skip: !encounterId || !encounterActive }
  );

  const {
    data: encounterAllResp,
    isLoading: encounterAllLoading,
    refetch: refetchEncounterAll
  } = useGetEncounterVaccinationsAllQuery(
    { encounterId, page: pagination.page, size: pagination.size, sort: pagination.sort, timestamp: pagination.timestamp } as any,
    { skip: !encounterId || !encounterAll }
  );

  const {
    data: patientActiveResp,
    isLoading: patientActiveLoading,
    refetch: refetchPatientActive
  } = useGetPatientVaccinationsActiveQuery(
    { patientId, page: pagination.page, size: pagination.size, sort: pagination.sort, timestamp: pagination.timestamp } as any,
    { skip: !patientId || !patientActive }
  );

  const {
    data: patientAllResp,
    isLoading: patientAllLoading,
    refetch: refetchPatientAll
  } = useGetPatientVaccinationsAllQuery(
    { patientId, page: pagination.page, size: pagination.size, sort: pagination.sort, timestamp: pagination.timestamp } as any,
    { skip: !patientId || !patientAll }
  );

  const activeResp = useMemo(() => {
    if (encounterActive) return encounterActiveResp;
    if (encounterAll) return encounterAllResp;
    if (patientActive) return patientActiveResp;
    if (patientAll) return patientAllResp;
    return encounterActiveResp;
  }, [encounterActive, encounterAll, patientActive, patientAll, encounterActiveResp, encounterAllResp, patientActiveResp, patientAllResp]);

  const baseLoading =
    (encounterActive && encounterActiveLoading) ||
    (encounterAll && encounterAllLoading) ||
    (patientActive && patientActiveLoading) ||
    (patientAll && patientAllLoading);

  const tableData = activeResp?.data ?? [];
  const totalCount = activeResp?.totalCount ?? 0;
  const links = activeResp?.links ?? {};

  const refetchActiveList = () => {
    setPagination(prev => ({ ...prev, timestamp: Date.now() }));
    if (encounterActive) refetchEncounterActive();
    else if (encounterAll) refetchEncounterAll();
    else if (patientActive) refetchPatientActive();
    else if (patientAll) refetchPatientAll();
  };

  const clearSelection = () => {
    setEncounterVaccination({ ...newEncounterVaccination } as any);
    setSelectedRow(null);
  };

  const handleClearField = () => {
    setEncounterVaccination({ ...newEncounterVaccination, status: null } as any);
    setSelectedRow(null);
  };

  const handleAddNewVaccine = () => {
    handleClearField();
    setModalKey(prev => prev + 1);
    setPopupOpen(true);
  };

  const handleCancel = () => {
    cancelEncounterVaccination({
      id: (encounterVaccination as any).id,
      cancellationReason: (encounterVaccination as any).cancellationReason,
    } as any)
      .unwrap()
      .then(() => {
        dispatch(notify({ msg: 'Encounter Vaccine Canceled Successfully', sev: 'success' }));
        setShowAllVaccines(false);
        setShowCancelled(true);
        setPagination(prev => ({ ...prev, page: 0, timestamp: Date.now() }));
      })
      .catch((err: any) => {
        dispatch(notify({ msg: toHumanEncounterVaccinationError(err), sev: 'error' }));
      });

    setPopupCancelOpen(false);
  };

  const handleReview = () => {
    reviewEncounterVaccination({
      id: (encounterVaccination as any).id,
    } as any)
      .unwrap()
      .then(() => {
        dispatch(notify({ msg: 'Encounter Vaccine Reviewed Successfully', sev: 'success' }));
        refetchActiveList();
      })
      .catch((err: any) => {
        dispatch(notify({ msg: toHumanEncounterVaccinationError(err), sev: 'error' }));
      });
  };

  const bulkLoadForRows = async (rows: any[]) => {
    const vaccineIds = uniqueNums(rows.map(getVaccineId));
    const brandIds = uniqueNums(rows.map(getBrandId));
    const doseIds = uniqueNums(rows.map(getDoseId));

    const bulkRequestKey = `v=${vaccineIds.join(',')};b=${brandIds.join(',')};d=${doseIds.join(',')}`;
    if (bulkKeyRef.current === bulkRequestKey) return;
    bulkKeyRef.current = bulkRequestKey;

    setIsBulkLoading(true);

    try {
      const [vaccinesResRaw, brandsResRaw, dosesResRaw] = await Promise.all([
        vaccineIds.length ? triggerVaccinesBulk({ ids: vaccineIds } as any).unwrap() : Promise.resolve([]),
        brandIds.length ? triggerBrandsBulk({ ids: brandIds } as any).unwrap() : Promise.resolve([]),
        doseIds.length ? triggerDosesBulk({ ids: doseIds } as any).unwrap() : Promise.resolve([])
      ]);

      const vaccinesRes = normalizeArray(vaccinesResRaw);
      const brandsRes = normalizeArray(brandsResRaw);
      const dosesRes = normalizeArray(dosesResRaw);

      setVaccinesById(Object.fromEntries((vaccinesRes ?? []).map((v: any) => [Number(v.id), v])));
      setBrandsById(Object.fromEntries((brandsRes ?? []).map((b: any) => [Number(b.id), b])));
      setDosesById(Object.fromEntries((dosesRes ?? []).map((d: any) => [Number(d.id), d])));
    } catch {
      setVaccinesById({});
      setBrandsById({});
      setDosesById({});
    } finally {
      setIsBulkLoading(false);
    }
  };

  useEffect(() => {
    const rows = tableData ?? [];
    if (!rows.length) {
      setVaccinesById({});
      setBrandsById({});
      setDosesById({});
      bulkKeyRef.current = '';
      setIsBulkLoading(false);
      return;
    }
    bulkLoadForRows(rows);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encounterActive, encounterAll, patientActive, patientAll, pagination.page, pagination.size, pagination.sort, activeResp]);

  const isMappingsCompleteForRows = (rows: any[]) => {
    const vaccineIds = uniqueNums(rows.map(getVaccineId));
    const brandIds = uniqueNums(rows.map(getBrandId));
    const doseIds = uniqueNums(rows.map(getDoseId));
    return (
      vaccineIds.every(id => !!vaccinesById[id]) &&
      brandIds.every(id => !!brandsById[id]) &&
      doseIds.every(id => !!dosesById[id])
    );
  };

  const tableLoading =
    (baseLoading && tableData.length === 0) ||
    (tableData.length > 0 && (isBulkLoading || !isMappingsCompleteForRows(tableData)));

  const vaccine: Vaccine = useMemo(() => {
    const id = selectedRow ? getVaccineId(selectedRow) : undefined;
    return id && vaccinesById[id] ? { ...newVaccine, ...vaccinesById[id] } : { ...newVaccine };
  }, [selectedRow, vaccinesById]);

  const vaccineBrand: VaccineBrand = useMemo(() => {
    const id = selectedRow ? getBrandId(selectedRow) : undefined;
    return id && brandsById[id] ? { ...newVaccineBrand, ...brandsById[id] } : { ...newVaccineBrand, volume: null };
  }, [selectedRow, brandsById]);

  const vaccineDose: VaccineDose = useMemo(() => {
    const id = selectedRow ? getDoseId(selectedRow) : undefined;
    return id && dosesById[id] ? { ...newVaccineDose, ...dosesById[id] } : { ...newVaccineDose };
  }, [selectedRow, dosesById]);

  const handleEditRow = (row: any) => {
    setEncounterVaccination({ ...(row as any) });
    setSelectedRow(row);
    setModalKey(prev => prev + 1);
    setPopupOpen(true);
  };

  const handlePageChange = (_: unknown, newPage: number) => {
    const currentPage = pagination.page;
    const linksMap = links || {};
    let targetLink: string | null | undefined = null;

    if (newPage > currentPage && linksMap.next) targetLink = linksMap.next;
    else if (newPage < currentPage && linksMap.prev) targetLink = linksMap.prev;
    else if (newPage === 0 && linksMap.first) targetLink = linksMap.first;
    else if (newPage > currentPage + 1 && linksMap.last) targetLink = linksMap.last;

    if (targetLink) {
      const { page, size } = extractPaginationFromLink(targetLink);
      setPagination(prev => ({ ...prev, page, size, timestamp: Date.now() }));
    }
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(event.target.value, 10);
    setPagination(prev => ({ ...prev, size: newSize, page: 0, timestamp: Date.now() }));
  };

  const columns = useMemo(
    () => [
      {
        key: 'vaccineName',
        title: 'VACCINE NAME',
        render: (row: any) => {
          const id = getVaccineId(row);
          const v = id ? vaccinesById[id] : null;
          return v?.name ?? '';
        }
      },
      {
        key: 'brandName',
        title: 'BRAND NAME',
        render: (row: any) => {
          const id = getBrandId(row);
          const b = id ? brandsById[id] : null;
          return b?.name ?? '';
        }
      },
      {
        key: 'doseNumber',
        title: 'DOSE NUMBER',
        render: (row: any) => {
          const id = getDoseId(row);
          const d = id ? dosesById[id] : null;
          return d?.doseNumber != null ? formatEnumString(String(d.doseNumber)) : '';
        }
      },
      {
        key: 'dateAdministered',
        title: 'DATE OF ADMINISTRATION',
        render: (row: any) => (!row?.dateAdministered ? '' : formatDateWithoutSeconds(row.dateAdministered))
      },
      {
        key: 'externalFacilityName',
        title: 'VACCINATION LOCATION',
        dataKey: 'administeredLocation',
        expandable: true
      },
      {
        key: 'isReviewed',
        title: 'Is Reviewed',
        render: (row: any) => ((row as any)?.reviewedAt === 0 ? 'No' : 'Yes')
      },
      {
        key: 'totalDoses',
        title: 'TOTAL VACCINE DOSES',
        render: (row: any) => {
          const id = getVaccineId(row);
          const v = id ? vaccinesById[id] : null;
          return v?.numberOfDoses ? formatEnumString(v.numberOfDoses) : '';
        }
      },
      {
        key: 'status',
        title: 'STATUS',
        render: (row: any) => (row?.status ? formatEnumString(row.status) : '')
      },
      {
        key: 'details',
        title: <Translate>EDIT</Translate>,
        flexGrow: 2,
        fullText: true,
        render: (row: any) => (
          <MdModeEdit
            title="Edit"
            size={24}
            fill="var(--primary-gray)"
            onClick={() => handleEditRow(row)}
          />
        )
      },
      {
        key: 'createdDate',
        title: 'CREATED AT/BY',
        expandable: true,
        render: (row: any) =>
          row?.createdDate ? (
            <>
              {(row as any)?.createdBy}
              <br />
              <span className="date-table-style">{formatDateWithoutSeconds((row as any).createdDate)}</span>{' '}
            </>
          ) : (
            ' '
          )
      },
      {
        key: 'reviewedDate',
        title: 'REVIEWED AT/BY',
        expandable: true,
        render: (row: any) =>
          (row as any)?.reviewedAt ? (
            <>
              {(row as any)?.reviewedBy}
              <br />
              <span className="date-table-style">{formatDateWithoutSeconds((row as any).reviewedAt)}</span>{' '}
            </>
          ) : (
            ' '
          )
      },
      {
        key: 'lastModifiedDate',
        title: 'UPDATED AT/BY',
        expandable: true,
        render: (row: any) =>
          (row as any)?.lastModifiedDate ? (
            <>
              {(row as any)?.lastModifiedBy}
              <br />
              <span className="date-table-style">{formatDateWithoutSeconds((row as any).lastModifiedDate)}</span>{' '}
            </>
          ) : (
            ' '
          )
      },
      {
        key: 'deletedAt',
        title: 'CANCELLED AT/BY',
        expandable: true,
        render: (row: any) =>
          (row as any)?.cancelledAt ? (
            <>
              {(row as any)?.cancelledBy} <br />
              <span className="date-table-style">{formatDateWithoutSeconds((row as any).cancelledAt)}</span>
            </>
          ) : (
            ' '
          )
      },
      {
        key: 'cancellationReason',
        title: 'CANCELLATION REASON',
        dataKey: 'cancellationReason',
        expandable: true
      }
    ],
    [vaccinesById, brandsById, dosesById, popupOpen]
  );

  const handleShowCancelledToggle = (isShowCancelledChecked: boolean) => {
    setShowCancelled(isShowCancelledChecked);
    clearSelection();
    setPagination(prev => ({ ...prev, page: 0, timestamp: Date.now() }));
  };

  const handleShowAllVaccinesToggle = (isShowAllVaccinesChecked: boolean) => {
    setShowAllVaccines(isShowAllVaccinesChecked);
    clearSelection();
    setPagination(prev => ({ ...prev, page: 0, timestamp: Date.now() }));
  };

  return (
    <div>
      <AddEncounterVaccine
        key={modalKey}
        open={popupOpen}
        setOpen={setPopupOpen}
        patient={patient}
        encounter={encounter}
        encounterVaccination={encounterVaccination}
        setEncounterVaccination={setEncounterVaccination}
        vaccineObject={vaccine}
        vaccineDoseObjet={vaccineDose}
        vaccineBrandObject={vaccineBrand}
        isDisabled={disabled}
        refetch={refetchActiveList}
        edit={edit}
      />

      <div>
        <MyTable
          data={tableData}
          columns={columns}
          loading={tableLoading}
          totalCount={totalCount}
          page={pagination.page}
          rowsPerPage={pagination.size}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          onRowClick={(row: any) => {
            setEncounterVaccination({ ...(row as any) });
            setSelectedRow(row);
          }}
          tableButtons={
            <div className="bt-div-2">
              <div className="bt-left-2">
                <MyButton
                  prefixIcon={() => <CloseOutlineIcon />}
                  onClick={() => setPopupCancelOpen(true)}
                  disabled={
                    (encounterVaccination as any).id === undefined ||
                    (encounterVaccination as any).status === 'CANCELLED' ||
                    isEncounterStatusClosed ||
                    disabled ||
                    ((encounterVaccination as any).id != undefined ? encounter.id != (encounterVaccination as any).encounterId : false)
                  }
                >
                  Cancel
                </MyButton>

                <MyButton
                  disabled={
                    (encounterVaccination as any).id === undefined ||
                    (encounterVaccination as any).status === 'REVIEW' ||
                    (encounterVaccination as any).status === 'CANCELLED' ||
                    ((encounterVaccination as any).id != undefined ? encounter.id != (encounterVaccination as any).encounterId : false) ||
                    isEncounterStatusClosed ||
                    disabled
                  }
                  prefixIcon={() => <CheckOutlineIcon />}
                  onClick={handleReview}
                >
                  Review
                </MyButton>

                <Checkbox
                  checked={showCancelled}
                  onChange={(firstArg, secondArg) => {
                    const isShowCancelledChecked = getCheckboxCheckedValue(firstArg, secondArg);
                    handleShowCancelledToggle(isShowCancelledChecked);
                  }}
                >
                  <Translate>Show Cancelled</Translate>
                </Checkbox>

                <Checkbox
                  checked={showAllVaccines}
                  onChange={(firstArg, secondArg) => {
                    const isShowAllVaccinesChecked = getCheckboxCheckedValue(firstArg, secondArg);
                    handleShowAllVaccinesToggle(isShowAllVaccinesChecked);
                  }}
                >
                  Show All Vaccines
                </Checkbox>
              </div>

              <div className="bt-right-2">
                <MyButton prefixIcon={() => <PlusIcon />} onClick={handleAddNewVaccine} disabled={edit}>
                  Add
                </MyButton>
              </div>
            </div>
          }
        />
      </div>

      <CancellationModal
        open={popupCancelOpen}
        setOpen={setPopupCancelOpen}
        object={encounterVaccination}
        setObject={setEncounterVaccination}
        handleCancle={handleCancel}
        fieldName="cancellationReason"
        fieldLabel="Cancellation Reason"
        title="Cancellation"
        statusKey="CANCELLED"
      />
    </div>
  );
};

export default VaccinationTab;
