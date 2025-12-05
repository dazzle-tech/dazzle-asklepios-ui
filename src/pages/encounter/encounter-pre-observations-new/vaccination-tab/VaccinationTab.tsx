import React, { useEffect, useState } from 'react';
import CancellationModal from '@/components/CancellationModal';
import MyButton from '@/components/MyButton/MyButton';
import MyStepper from '@/components/MyStepper';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { initialListRequest, ListRequest } from '@/types/types';
import { conjureValueBasedOnIDFromList, formatDateWithoutSeconds } from '@/utils';
import { notify } from '@/utils/uiReducerActions';
import { faCakeCandles, faSyringe } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { MdModeEdit } from 'react-icons/md';
import { useLocation } from 'react-router-dom';
import { Checkbox } from 'rsuite';
import AddEncounterVaccine from './AddEncounterVaccine';
import PlusIcon from '@rsuite/icons/Plus';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import CheckOutlineIcon from '@rsuite/icons/CheckOutline';
import { ApEncounterVaccination, ApVaccine, ApVaccineBrands } from '@/types/model-types';
import {
  useGetEncounterVaccineQuery,
  useSaveEncounterVaccineMutation
} from '@/services/observationService';
import {
  newApEncounterVaccination
} from '@/types/model-types-constructor';
import {
  newVaccine,
  newVaccineBrand,
  newVaccineDose
} from '@/types/model-types-constructor-new';

import {
  useGetVaccineByIdQuery,
  useGetVaccinesQuery,
  useLazyGetVaccinesByNameQuery
} from '@/services/vaccine/vaccineService';
import {
  useGetVaccineDosesByVaccineIdQuery,
  useGetVaccineDosesQuery
} from '@/services/vaccine/vaccineDosesService';
import {
  useGetIntervalsByVaccineIdQuery
} from '@/services/vaccine/vaccineDosesIntervalService';
import {
  useGetVaccineBrandsByVaccineQuery,
  useGetVaccineBrandsQuery
} from '@/services/vaccine/vaccineBrandsService';
import './styles.less';
import { Vaccine, VaccineBrand, VaccineDose } from '@/types/model-types-new';

const VaccinationTab = ({
  disabled,
  patient: propPatient,
  encounter: propEncounter,
  edit: propEdit
}) => {
  const location = useLocation();
  const state = location.state || {};
  const patient = propPatient || state.patient;
  const encounter = propEncounter || state.encounter;
  const edit = propEdit ?? state.edit;
  const authSlice = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();
  const [vaccine, setVaccine] = useState<Vaccine>({ ...newVaccine });
  const [vaccineBrand, setVaccineBrand] = useState<VaccineBrand>({
    ...newVaccineBrand,
    volume: null
  });
  const [vaccineDose, setVaccineDose] = useState<any>({ ...newVaccineDose });
  const [encounterVaccination, setEncounterVaccination] = useState<ApEncounterVaccination>({
    ...newApEncounterVaccination
  });
  const [selectedVaccineId, setSelectedVaccineId] = useState<number | undefined>();
  const [selectedBrandId, setSelectedBrandId] = useState<number | undefined>();
  const [selectedDoseId, setSelectedDoseId] = useState<number | undefined>();
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupCancelOpen, setPopupCancelOpen] = useState(false);
  const [encounterStatus, setEncounterStatus] = useState('');
  const [allData, setAllDate] = useState(false);
  const reviewedAt = new Date().getTime();
  const [isEncounterStatusClosed, setIsEncounterStatusClosed] = useState(false);
  const [saveEncounterVaccine] = useSaveEncounterVaccineMutation();

  // Initialize List Request Filters
  const [encounterVaccineListRequest, setEncounterVaccineListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      },
      {
        fieldName: 'patient_key',
        operator: 'match',
        value: patient?.key
      },
      {
        fieldName: 'encounter_key',
        operator: 'match',
        value: encounter?.key
      }
    ]
  });

  //List Responses
  // Fetch Encounter Vaccinelist
  const {
    data: encounterVaccineListResponseLoading,
    refetch: encounterVaccine,
    isLoading
  } = useGetEncounterVaccineQuery(encounterVaccineListRequest);

  const { data: vaccinePage } = useGetVaccinesQuery(
    {
      page: 0,
      size: 100,
      sort: 'id,asc'
    }
  );

  const { data: vaccineBrandsPage } = useGetVaccineBrandsQuery(
    {
      page: 0,
      size: 100,
      sort: 'id,asc'
    },
  );

  // Doses
  const { data: vaccineDosesPage } = useGetVaccineDosesQuery(
    {
      page: 0,
      size: 100,
      sort: 'id,asc'
    },
  );

  // Intervals 
  const { data: intervalsPage } = useGetIntervalsByVaccineIdQuery(
    {
      vaccineId: vaccine?.id as number | undefined,
      page: 0,
      size: 100,
      sort: 'id,asc'
    }
  );

   // Brands by vaccine
  const { data: vaccineBrandsByVaccinePage } = useGetVaccineBrandsByVaccineQuery(
    {
      vaccineId: selectedVaccineId as number,
      page: 0,
      size: 100,
      sort: 'id,asc'
    },
    { skip: !selectedVaccineId }
  );
  const { data: vaccineDosesByVaccinePage } = useGetVaccineDosesByVaccineIdQuery(
    {
      vaccineId: selectedVaccineId as number,
      page: 0,
      size: 100,
      sort: 'id,asc'
    },
    { skip: !selectedVaccineId }
  );
  const { data: intervalsByVaccinePage } = useGetIntervalsByVaccineIdQuery(
    {
      vaccineId: selectedVaccineId as number,
      page: 0,
      size: 100,
      sort: 'id,asc'
    },
    { skip: !selectedVaccineId }
  );

  const isSelected = rowData => {
    if (rowData && encounterVaccination && encounterVaccination.key === rowData.key) {
      return 'selected-row';
    } else return '';
  };
  //handle Clear Fields
  const handleClearField = () => {
    setEncounterVaccination({ ...newApEncounterVaccination, statusLkey: null });
    setVaccine({
      ...newVaccine
    });
    setVaccineBrand({
      ...newVaccineBrand
    });
    setVaccineDose({
      ...newVaccineDose
    });
  };
  // Handle Add New Vaccine Record
  const handleAddNewVaccine = () => {
    handleClearField();
    setPopupOpen(true);
  };

  // Change page event handler
  const handlePageChange = (_: unknown, newPage: number) => {
    setEncounterVaccineListRequest({ ...encounterVaccineListRequest, pageNumber: newPage + 1 });
  };
  // Change number of rows per page
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEncounterVaccineListRequest({
      ...encounterVaccineListRequest,
      pageSize: parseInt(event.target.value, 10),
      pageNumber: 1 // Reset to first page
    });
  };
  //handle Cancle Vaccine
  const handleCancle = () => {
    saveEncounterVaccine({
      ...encounterVaccination,
      statusLkey: '3196709905099521',
      deletedAt: new Date().getTime(),
      deletedBy: String(authSlice.user.id)
    })
      .unwrap()
      .then(() => {
        dispatch(notify({ msg: 'Encounter Vaccine Canceled Successfully', sev: 'success' }));
        encounterVaccine();
      });
    setPopupCancelOpen(false);
  };
  // //handle Reviewe Vaccine
  const handleReviewe = () => {
    saveEncounterVaccine({
      ...encounterVaccination,
      statusLkey: '3721622082897301',
      reviewedAt: reviewedAt,
      reviewedBy: String(authSlice.user.id),
      updatedBy: String(authSlice.user.id)
    })
      .unwrap()
      .then(() => {
        dispatch(notify({ msg: 'Encounter Vaccine Reviewed Successfully', sev: 'success' }));
        encounterVaccine();
      });
  };
  // Effects
  useEffect(() => {
    // TODO update status to be a LOV value
    if (encounter?.encounterStatusLkey === '91109811181900') {
      setIsEncounterStatusClosed(true);
    }
  }, [encounter?.encounterStatusLkey]);
  useEffect(() => {
    setEncounterVaccineListRequest(prev => ({
      ...prev,
      filters: [
        ...(encounterStatus !== ''
          ? [
            {
              fieldName: 'status_lkey',
              operator: 'match',
              value: encounterStatus
            },
            {
              fieldName: 'patient_key',
              operator: 'match',
              value: patient?.key
            },
            ...(allData === false
              ? [
                {
                  fieldName: 'encounter_key',
                  operator: 'match',
                  value: encounter?.key
                }
              ]
              : [])
          ]
          : [
            {
              fieldName: 'deleted_at',
              operator: 'isNull',
              value: undefined
            },
            {
              fieldName: 'patient_key',
              operator: 'match',
              value: patient?.key
            },
            ...(allData === false
              ? [
                {
                  fieldName: 'encounter_key',
                  operator: 'match',
                  value: encounter?.key
                }
              ]
              : [])
          ])
      ]
    }));
    setEncounterVaccineListRequest(prev => {
      const filters =
        encounterStatus != '' && allData
          ? [
            {
              fieldName: 'patient_key',
              operator: 'match',
              value: patient?.key
            }
          ]
          : encounterStatus === '' && allData
            ? [
              {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined
              },
              {
                fieldName: 'patient_key',
                operator: 'match',
                value: patient?.key
              }
            ]
            : prev.filters;
      return {
        ...initialListRequest,
        filters
      };
    });
  }, [encounterStatus, allData]);

useEffect(() => {
  if (!selectedVaccineId || !vaccinePage?.data) return;

  const src = vaccinePage.data.find(v => v.id === selectedVaccineId);
  if (!src) return;

  setVaccine(prev => ({
    ...prev,
    ...src
  }));
}, [selectedVaccineId, vaccinePage]);

  // Pagination values
  const pageIndex = encounterVaccineListRequest.pageNumber - 1;
  const rowsPerPage = encounterVaccineListRequest.pageSize;
  const totalCount = encounterVaccineListResponseLoading?.extraNumeric ?? 0;

  // Table Column
  const columns = [
    {
      key: 'vaccineName',
      title: 'VACCINE NAME',
      render: (rowData) => conjureValueBasedOnIDFromList(
        vaccinePage?.data ?? [],
        rowData.vaccineId,
        'name'
      )
    },
    {
      key: 'brandName',
      title: 'BRAND NAME',
      render: (rowData) => conjureValueBasedOnIDFromList(
        vaccineBrandsPage?.data ?? [],
        rowData.vaccineBrandId,
        'name'
      )
    },
    {
      key: 'doseNumber',
      title: 'DOSE NUMBER',
      render: (rowData) => conjureValueBasedOnIDFromList(
        vaccinePage?.data ?? [],
        rowData.vaccineId,
        'numberOfDoses'
      )
    },
    {
      key: 'dateAdministered',
      title: 'DATE OF ADMINISTRATION',
      render: (rowData: any) => {
        return !rowData.dateAdministered ? '' : formatDateWithoutSeconds(rowData.dateAdministered);
      }
    },
    {
      key: 'actualSide',
      title: 'ACTUAL SIDE',
      dataKey: 'actualSide',
      expandable: true
    },
    {
      key: 'roa',
      title: 'ROA',
      render: (rowData) => conjureValueBasedOnIDFromList(
        vaccineDosesPage?.data ?? [],
        rowData.vaccineId,
        'roa'
      ),
      expandable: true
    },
    {
      key: 'externalFacilityName',
      title: 'VACCINATION LOCATION',
      dataKey: 'externalFacilityName',
      expandable: true
    },
    {
      key: 'isReviewed',
      title: 'Is Reviewed',
      render: (rowData: any) => (rowData.reviewedAt === 0 ? 'No' : 'Yes')
    },
    {
      key: 'totalDoses',
      title: 'TOTAL VACCINE DOSES',
      render: (rowData) => conjureValueBasedOnIDFromList(
        vaccineDose?.data ?? [],
        rowData.vaccineDoseId,
        'doseNumber'
      )
    },
    {
      key: 'status',
      title: 'STATUS',
      render: (rowData: any) => rowData.statusLvalue?.lovDisplayVale || rowData.statusLkey
    },
    {
      key: 'details',
      title: <Translate>EDIT</Translate>,
      flexGrow: 2,
      fullText: true,
      render: rowData => {
        return (
          <MdModeEdit
            title="Edit"
            size={24}
            fill="var(--primary-gray)"
            onClick={() => {
              setEncounterVaccination({ ...rowData });

          const vId = rowData.vaccineId;
          const bId = rowData.vaccineBrandId;
          const dId = rowData.vaccineDoseId;

         
          setVaccine(prev => ({
            ...prev,
            ...(rowData.vaccine || {}),
            id: vId
          }));

          setVaccineBrand(prev => ({
            ...prev,
            ...(rowData.vaccineBrands || {}),
            id: bId
          }));

          setVaccineDose(prev => ({
            ...prev,
            ...(rowData.vaccineDose || {}),
            id: dId
          }));

          setSelectedVaccineId(vId);
          setSelectedBrandId(bId);
          setSelectedDoseId(dId);

              setTimeout(() => {
                setPopupOpen(true);
              }, 0);
            }}
          />
        );
      }
    },
    {
      key: 'createdAt',
      title: 'CREATED AT/BY',
      expandable: true,
      render: (row: any) =>
        row?.createdAt ? (
          <>
            {row?.createByUser?.fullName}
            <br />
            <span className="date-table-style">{formatDateWithoutSeconds(row.createdAt)}</span>{' '}
          </>
        ) : (
          ' '
        )
    },
    {
      key: 'updatedAt',
      title: 'UPDATED AT/BY',
      expandable: true,
      render: (row: any) =>
        row?.updatedAt ? (
          <>
            {row?.updateByUser?.fullName}
            <br />
            <span className="date-table-style">{formatDateWithoutSeconds(row.updatedAt)}</span>{' '}
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
        row?.deletedAt ? (
          <>
            {row?.deleteByUser?.fullName} <br />
            <span className="date-table-style">{formatDateWithoutSeconds(row.deletedAt)}</span>
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
  ];
  return (
    <div>
      <AddEncounterVaccine
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
        refetch={encounterVaccine}
        edit={edit}
      />
      <div className="display-start-10">
        <MyTable
          data={encounterVaccineListResponseLoading?.object ?? []}
          columns={columns}
          loading={isLoading}
          onRowClick={rowData => {
            setEncounterVaccination({ ...rowData });

          const vId = rowData.vaccineId;
          const bId = rowData.vaccineBrandId;
          const dId = rowData.vaccineDoseId;
          setVaccine(prev => ({
            ...prev,
            ...(rowData.vaccine || {}),
            id: vId
          }));

          setVaccineBrand(prev => ({
            ...prev,
            ...(rowData.vaccineBrands || {}),
            id: bId
          }));

          setVaccineDose(prev => ({
            ...prev,
            ...(rowData.vaccineDose || {}),
            id: dId
          }));

          setSelectedVaccineId(vId);
          setSelectedBrandId(bId);
          setSelectedDoseId(dId);
          }}

          rowClassName={isSelected}
          page={pageIndex}
          rowsPerPage={rowsPerPage}
          totalCount={totalCount}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          tableButtons={
            <div className="bt-div-2">
              <div className="bt-left-2">
                <MyButton
                  prefixIcon={() => <CloseOutlineIcon />}
                  onClick={() => {
                    setPopupCancelOpen(true);
                  }}
                  disabled={
                    encounterVaccination.key === undefined ||
                    encounterVaccination.statusLkey === '3196709905099521' ||
                    isEncounterStatusClosed ||
                    disabled ||
                    (encounterVaccination.key != undefined
                      ? encounter.key != encounterVaccination.encounterKey
                      : false)
                  }
                >
                  Cancel
                </MyButton>

                <MyButton
                  disabled={
                    encounterVaccination.key === undefined ||
                    encounterVaccination.statusLkey === '3721622082897301' ||
                    encounterVaccination.statusLkey === '3196709905099521' ||
                    (encounterVaccination.key != undefined
                      ? encounter.key != encounterVaccination.encounterKey
                      : false) ||
                    isEncounterStatusClosed ||
                    disabled
                  }
                  prefixIcon={() => <CheckOutlineIcon />}
                  onClick={handleReviewe}
                >
                  Review
                </MyButton>

                <Checkbox
                  onChange={(value, checked) => {
                    if (checked) {
                      setEncounterStatus('3196709905099521');
                    } else {
                      setEncounterStatus('');
                    }
                  }}
                >
                  Show Cancelled
                </Checkbox>

                <Checkbox
                  onChange={(value, checked) => {
                    if (checked) {
                      setAllDate(true);
                    } else {
                      setAllDate(false);
                    }
                  }}
                >
                  Show All Vaccines
                </Checkbox>
              </div>

              <div className="bt-right-2">
                <MyButton
                  prefixIcon={() => <PlusIcon />}
                  onClick={handleAddNewVaccine}
                  disabled={edit}
                >
                  Add
                </MyButton>
              </div>
            </div>
          }
        />

        <div className="vaccine-stepper">
          <h6 className="margin-bottom-16">Vaccine Schedule</h6>
          <MyStepper
            activeStep={1}
            orientation="vertical"
            stepsList={[
              {
                key: 1,
                value: 'HepB',
                description: (
                  <div>
                    <div className="flex-row-5">
                      <FontAwesomeIcon icon={faSyringe} />
                      <p className="margin-top-3">1st dose </p>
                    </div>
                    <div className="flex-row-5">
                      <FontAwesomeIcon icon={faCakeCandles} />
                      <p className="margin-top-3">0D</p>{' '}
                    </div>
                  </div>
                ),
                completed: true
              },
              {
                key: 2,
                value: 'DTaP',
                description: (
                  <div className="display-flex-space">
                    <div>
                      <div className="flex-row-5">
                        <FontAwesomeIcon icon={faSyringe} />
                        <p className="margin-top-3">2nd dose</p>
                      </div>
                      <div className="flex-row-5">
                        <FontAwesomeIcon icon={faCakeCandles} />
                        <p className="margin-top-3">2 Months</p>
                      </div>
                    </div>

                    <MyButton
                      prefixIcon={() => <FontAwesomeIcon icon={faSyringe} />}
                      onClick={handleAddNewVaccine}
                    >
                      Give
                    </MyButton>
                  </div>
                ),
                completed: true
              },
              {
                key: 3,
                value: 'HepB',
                description: (
                  <div className="display-flex-space">
                    <div>
                      <div className="flex-row-5">
                        <FontAwesomeIcon icon={faSyringe} />
                        <p className="margin-top-3">3nd dose</p>
                      </div>
                      <div className="flex-row-5">
                        <FontAwesomeIcon icon={faCakeCandles} />
                        <p className="margin-top-3">6 Months</p>
                      </div>
                    </div>
                  </div>
                ),
                completed: false
              }
            ]}
          />
        </div>
      </div>

      <CancellationModal
        open={popupCancelOpen}
        setOpen={setPopupCancelOpen}
        object={encounterVaccination}
        setObject={setEncounterVaccination}
        handleCancle={handleCancle}
        fieldName="cancellationReason"
        fieldLabel="Cancellation Reason"
        title="Cancellation"
      />
    </div>
  );
};
export default VaccinationTab;
