import CancellationModal from '@/components/CancellationModal';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';
import EncounterAttachment from '@/pages/patient/patient-profile/tabs/Attachment-new/EncounterAttachment';
import {
  useGetCustomeInstructionsQuery,
  useGetPrescriptionMedicationsQuery,
  useGetPrescriptionsQuery,
  useSavePrescriptionMedicationMutation,
  useSavePrescriptionMutation
} from '@/services/encounterService';
import { faPrint } from '@fortawesome/free-solid-svg-icons';
import { useGetAllBrandMedicationsQuery } from '@/services/setup/brandmedication/BrandMedicationService ';
import { useGetAllPrescriptionInstructionsQuery } from '@/services/setup/prescription-instruction/prescriptionInstructionService';
import { ApPrescription, ApPrescriptionMedications } from '@/types/model-types';
import { newApPrescription, newApPrescriptionMedications } from '@/types/model-types-constructor';
import { initialListRequest, ListRequest } from '@/types/types';
import { conjureValueBasedOnIDFromList, formatDateWithoutSeconds, formatEnumString } from '@/utils';
import { notify } from '@/utils/uiReducerActions';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import BlockIcon from '@rsuite/icons/Block';
import CheckIcon from '@rsuite/icons/Check';
import PlusIcon from '@rsuite/icons/Plus';
import clsx from 'clsx';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { FaFilePrescription } from 'react-icons/fa6';
import { MdAttachFile, MdModeEdit } from 'react-icons/md';
import { useLocation } from 'react-router-dom';
import { Checkbox, Divider, Form } from 'rsuite';
import AllergyFloatingButton from '../../encounter-pre-observations/AllergiesNurse/AllergyFloatingButton';
import UrgencyButton from '../drug-order/UrgencyButton';
import DetailsModal from './DetailsModal';
import PrescriptionPreview from './PrescriptionPreview';
import { useGeneratePrescriptionPdfMutation } from '@/services/setup/PrescriptionReportRequest';
import './styles.less';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import PatientHistorySummaryModal from './PatientHistorySummaryModal';
import BrandActivesPrefetcher from './BrandActivesPrefetcher';

const Prescription = (props: any) => {
  const location = useLocation();
  const tableContainerRef = useRef<HTMLDivElement | null>(null);

  const patient = props.patient || location.state?.patient;
  const encounter = props.encounter || location.state?.encounter;
  const edit = props.edit ?? location.state?.edit ?? false;

  const dispatch = useAppDispatch();
  const authSlice = useAppSelector(state => state.auth);
  const selectedFacility = useAppSelector(state => state.auth?.tenant?.selectedFacility);

  const [openToAdd, setOpenToAdd] = useState(true);
  const [openCancellation, setOpenCancellation] = useState(false);
  const [showCanceled, setShowCanceled] = useState(true);
  const [prescription, setPrescription] = useState<ApPrescription>({ ...newApPrescription });
  const { data: facilityListResponse } = useGetAllFacilitiesQuery({});
  const facilityName = conjureValueBasedOnIDFromList(
    facilityListResponse ?? [],
    selectedFacility?.id,
    'name'
  );

  const { data: predefinedInstructionsListResponse } = useGetAllPrescriptionInstructionsQuery({
    page: 0,
    size: 1000,
    sort: 'id,asc'
  });

  const { data: unitLov } = useGetLovValuesByCodeQuery('VALUE_UNIT');

  const [customeinst, setCustomeinst] = useState({
    dose: null,
    unit: null,
    frequency: null,
    roa: null
  });

  type ActiveRel = any;
  type BrandActiveCache = Record<string, ActiveRel[]>;
  const [brandActivesCache, setBrandActivesCache] = useState<BrandActiveCache>({});

  const onActivesLoaded = (brandId: string, actives: ActiveRel[]) => {
    setBrandActivesCache(prev => {
      const existing = prev[brandId];
      if (existing) return prev;
      return { ...prev, [brandId]: actives ?? [] };
    });
  };

  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [selectedPreviewMedication, setSelectedPreviewMedication] = useState<any>(null);
  const [favoriteMedications, setFavoriteMedications] = useState<any[]>([]);
  const [openFavoritesModal, setOpenFavoritesModal] = useState(false);
  const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
  const [selectedMedicationForAttachments, setSelectedMedicationForAttachments] =
    useState<any>(null);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);

  const { data: genericMedicationListResponse } = useGetAllBrandMedicationsQuery({
    page: 0,
    size: 1000,
    sort: 'id,asc'
  });

  const {
    data: prescriptions,
    isLoading: isLoadingPrescriptions,
    refetch: preRefetch
  } = useGetPrescriptionsQuery({
    ...initialListRequest,
    filters: [
      { fieldName: 'patient_key', operator: 'match', value: patient?.key },
      { fieldName: 'visit_key', operator: 'match', value: encounter?.key }
    ]
  });
  
  const filteredPrescriptions =
    prescriptions?.object?.filter((item: any) => item.statusLkey === '1804482322306061') ?? [];

  const [preKeyRecord, setPreKeyRecord] = useState<{ preKey: any }>({ preKey: null });
useEffect(() => {
    setPrescription(prescriptions?.object?.find((p: any) => p.key === preKeyRecord['preKey']) || { ...newApPrescription });
  }, [prescriptions, preKeyRecord]);

  const [prescriptionMedication, setPrescriptionMedications] = useState<ApPrescriptionMedications>({
    ...newApPrescriptionMedications,
    prescriptionKey: preKeyRecord['preKey'],
    duration: null,
    numberOfRefills: null
  });

  const [savePrescription] = useSavePrescriptionMutation();
  const [savePrescriptionMedication] = useSavePrescriptionMedicationMutation();

  const [generatePrescriptionPdf, { isLoading: isGeneratingPdf }] =
    useGeneratePrescriptionPdfMutation();

  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      { fieldName: 'prescription_key', operator: '', value: preKeyRecord['preKey'] },
      {
        fieldName: 'status_lkey',
        operator: showCanceled ? 'notMatch' : 'match',
        value: '1804447528780744'
      }
    ]
  });

  const {
    data: prescriptionMedications,
    isLoading: isLoadingPrescriptionMedications,
    refetch: medicRefetch
  } = useGetPrescriptionMedicationsQuery(listRequest);

  const [selectedRowoMedicationKey, setSelectedRowoMedicationKey] = useState('');

  const { data: customeInstructions, refetch: refetchCo } = useGetCustomeInstructionsQuery({
    ...initialListRequest
  });

  const [isdraft, setIsDraft] = useState(
    prescriptions?.object?.find((p: any) => p.key === preKeyRecord['preKey'])?.saveDraft
  );

  // aggregation helpers (IMPORTANT: defined BEFORE payload)
  const toStr = (v: any) => (v === null || v === undefined ? '' : String(v));

  const getMedicationName = (brandMedications: any[] = [], id: any) =>
    toStr(brandMedications.find(m => String(m?.id) === String(id))?.name);
  const getLovDisplay = (list: any[] = [], key: any, labelKey = 'lovDisplayVale') => {
    const hit = (list ?? []).find((x: any) => String(x?.key) === String(key));
    return toStr(hit?.[labelKey]);
  };

  const formatActiveIngredientsLikeUI = (brandId: any) => {
    const rels = brandActivesCache[String(brandId)] ?? [];
    if (!rels.length) return '-';

    return rels
      .map((rel: any) => {
        const ai = rel?.activeIngredient ?? {};
        const name = toStr(ai?.name);
        const atc = toStr(ai?.atcCode);

        const unitTxt = rel?.unit ? ` ${getLovDisplay(unitLov?.object ?? [], rel.unit)}` : '';
        const strength = toStr(rel?.strength);
        const strengthTxt = strength ? `${strength}${unitTxt}`.trim() : '';

        return `${name}${atc ? ` (${atc})` : ''}${strengthTxt ? ` - ${strengthTxt}` : ''}`.trim();
      })
      .filter(Boolean)
      .join('\n');
  };

  const formatInstructionsLikeTable = (
    row: any,
    predefinedInstructions: any[] = [],
    customInstructions: any[] = []
  ) => {
    const type = toStr(row?.instructionsTypeLkey);

    // Pre-defined
    if (type === '3010591042600262') {
      const instId = Number(row?.instructions);
      const inst = predefinedInstructions.find((x: any) => Number(x.id) === instId);
      if (!inst) return '';

      return [
        toStr(inst?.dose),
        formatEnumString(inst?.unit) ?? '',
        formatEnumString(inst?.rout) ?? '',
        formatEnumString(inst?.frequency) ?? ''
      ]
        .map(s => toStr(s).trim())
        .filter(Boolean)
        .join(', ');
    }

    // Free text
    if (type === '3010573499898196') return toStr(row?.instructions);

    // Custom
    if (type === '3010606785535008') {
      const ci = customInstructions.find(
        (x: any) => String(x.prescriptionMedicationsKey) === String(row?.key)
      );

      return [
        toStr(ci?.dose),
        toStr(ci?.unitLvalue?.lovDisplayVale),
        toStr(ci?.frequencyLvalue?.lovDisplayVale)
      ]
        .map(s => s.trim())
        .filter(Boolean)
        .join(', ');
    }

    return '';
  };
  function buildPrescriptionSummaryPayload(
    patientX: any,
    encounterX: any,
    meds: any[] = [],
    brandMedicationsForNames: any[] = [],
    predefinedInstructions: any[] = [],
    customInstructions: any[] = []
  ) {
    const patientInfo = {
      mrn: toStr(patientX?.patientMrn),
      fullName: toStr(patientX?.fullName || patientX?.patientFullName),
      gender: toStr(patientX?.genderLvalue?.lovDisplayVale || patientX?.genderLvalue?.valueCode),
      dob: toStr(patientX?.dob)
    };

    const encounterInfo = {
      visitId: toStr(encounterX?.visitId),
      visitType: toStr(encounterX?.visitTypeLvalue?.lovDisplayVale),
      plannedStartDate: toStr(encounterX?.plannedStartDate),
      chiefComplaint: toStr(encounterX?.chiefComplaint),
      patientAge: toStr(encounterX?.patientAge),
      diagnosis: toStr(encounterX?.diagnosis)
    };
    const medicationsAsStrings: string[] = (meds ?? []).map((row: any) => {
      const medicationName = getMedicationName(brandMedicationsForNames, row?.genericMedicationsId);
      const activeIngredientsText = formatActiveIngredientsLikeUI(row?.genericMedicationsId);

      const instructionsText = formatInstructionsLikeTable(
        row,
        predefinedInstructions,
        customInstructions
      );

      const parts = [
        `Medication Name: ${toStr(medicationName)}`,
        `Active Ingredients: ${activeIngredientsText || '-'}`,
        `Instructions: ${toStr(instructionsText)}`,
        `Instructions Type: ${toStr(
          row?.instructionsTypeLvalue?.lovDisplayVale || row?.instructionsTypeLkey
        )}`,
        `Valid Until: ${toStr(row?.validUtil)}`,
        `Is Chronic: ${row?.chronicMedication ? 'Yes' : 'No'}`,
        `Duration: ${toStr(row?.duration)}`,
        `Duration Type: ${toStr(row?.durationTypeLvalue?.lovDisplayVale || row?.durationTypeLkey)}`,
        `Maximum Dose: ${toStr(row?.maximumDose)}`,
        `ICD-10: ${toStr(row?.indicationIcd)}`
      ];

      return parts
        .map(s => s.trim())
        .filter(Boolean)
        .join(' | ');
    });

    return {
      patient: patientInfo,
      encounter: encounterInfo,
      complain: toStr(encounterX?.chiefComplaint),
      diagnosis: { type: 'Encounter Diagnosis', value: toStr(encounterX?.diagnosis) },
      medications: medicationsAsStrings
    };
  }

  const uniqueBrandIds = useMemo(() => {
    const ids = (prescriptionMedications?.object ?? [])
      .map((m: any) => m?.genericMedicationsId)
      .filter(Boolean)
      .map((x: any) => String(x));
    return Array.from(new Set(ids));
  }, [prescriptionMedications]);

  const payload = useMemo(() => {
    return buildPrescriptionSummaryPayload(
      patient,
      encounter,
      prescriptionMedications?.object ?? [],
      genericMedicationListResponse?.data ?? [],
      predefinedInstructionsListResponse?.data ?? [],
      customeInstructions?.object ?? []
    );
  }, [
    patient,
    encounter,
    prescriptionMedications,
    genericMedicationListResponse,
    predefinedInstructionsListResponse,
    customeInstructions,
    brandActivesCache,
    unitLov
  ]);

  // useEffect(() => {
  //   console.log('PRESCRIPTION_SUMMARY_PAYLOAD =>', payload);
  //   console.log('PRESCRIPTION_SUMMARY_PAYLOAD_JSON =>\n', JSON.stringify(payload, null, 2));
  // }, [payload]);

  const isFormField = (node: EventTarget | null) => {
    if (!(node instanceof Element)) return false;
    if (
      node.closest(
        'input, textarea, select, button, [contenteditable="true"], .rs-input, .rs-picker, .rs-checkbox, .rs-btn, .rs-picker-menu, .rs-picker-select-menu, .rs-picker-popup, .rs-modal, .rs-modal-body, .rs-modal-dialog'
      ) !== null
    )
      return true;
    return false;
  };

  const addToFavorites = (rowData: any) => {
    const alreadyExists = favoriteMedications.some(
      item => item.genericMedicationsId === rowData.genericMedicationsId
    );

    if (alreadyExists) {
      setFavoriteMedications(prev =>
        prev.filter(item => item.genericMedicationsId !== rowData.genericMedicationsId)
      );
      const genericMedication = genericMedicationListResponse?.data?.find(
        (item: any) => item.id === rowData.genericMedicationsId
      );
      const medicationName = genericMedication ? genericMedication.name : 'Medication';
      dispatch(notify({ msg: `${medicationName} removed from favorites`, type: 'info' }));
    } else {
      const genericMedication = genericMedicationListResponse?.data?.find(
        (item: any) => item.id === rowData.genericMedicationsId
      );

      const medicationToAdd = {
        ...rowData,
        name: genericMedication ? genericMedication.name : 'Unnamed Medication',
        administrationInstructions: rowData.administrationInstructions || null,
        parametersToMonitor: rowData.parametersToMonitor || ''
      };

      setFavoriteMedications(prev => [...prev, medicationToAdd]);
      dispatch(notify({ msg: `${medicationToAdd.name} added to favorites`, type: 'success' }));
    }
  };

  const handleRecall = async (rowData: any) => {
    const genericMedication = genericMedicationListResponse?.data?.find(
      (item: any) => item.id === rowData.genericMedicationsId
    );
    await Promise.resolve();

    setPrescriptionMedications({
      ...rowData,
      prescriptionKey: preKeyRecord['preKey'],
      name: genericMedication?.name || ''
    });

    setOpenDetailsModal(true);
    setOpenFavoritesModal(false);
  };

  const isSelected = (rowData: any) => {
    if (rowData && prescriptionMedication && rowData.key === prescriptionMedication.key) {
      return 'selected-row';
    }
    return '';
  };

  // Effects
  useEffect(() => {
    if (preKeyRecord.preKey !== null) return;

    const foundDraft = prescriptions?.object?.find((p: any) => p.saveDraft === true);
    if (foundDraft?.key) setPreKeyRecord({ preKey: foundDraft.key });
  }, [prescriptions]);

  useEffect(() => {
    setListRequest(prev => ({
      ...prev,
      filters: [
        { fieldName: 'prescription_key', operator: '', value: preKeyRecord['preKey'] },
        {
          fieldName: 'status_lkey',
          operator: showCanceled ? 'notMatch' : 'match',
          value: '1804447528780744'
        }
      ]
    }));
  }, [preKeyRecord['preKey'], showCanceled]);

  useEffect(() => {
    refetchCo();
    setCustomeinst(prev => ({
      ...prev,
      unit: customeInstructions?.object?.find(
        (item: any) => item.prescriptionMedicationsKey === selectedRowoMedicationKey
      )?.unitLkey,
      frequency: customeInstructions?.object?.find(
        (item: any) => item.prescriptionMedicationsKey === selectedRowoMedicationKey
      )?.frequencyLkey,
      dose: customeInstructions?.object?.find(
        (item: any) => item.prescriptionMedicationsKey === selectedRowoMedicationKey
      )?.dose
    }));
  }, [selectedRowoMedicationKey]);

  useEffect(() => {
    if (preKeyRecord['preKey'] == null) handleCleare();
  }, [preKeyRecord['preKey']]);

  useEffect(() => {
    if (showCanceled) handleCleare();
  }, [showCanceled]);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;

      if (tableContainerRef.current?.contains(target as Node)) return;
      if (isFormField(e.target)) return;
      if ((e.target as Element)?.closest('.rs-modal, .rs-modal-body, .rs-modal-dialog')) return;

      setSelectedPreviewMedication(null);
      setPrescriptionMedications(prev => ({ ...prev, key: undefined }));
      setSelectedRows([]);
    };

    document.addEventListener('mousedown', handleGlobalClick);
    document.addEventListener('touchstart', handleGlobalClick);

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedPreviewMedication(null);
        setSelectedRows([]);
      }
    };
    document.addEventListener('keydown', handleEsc);

    return () => {
      document.removeEventListener('mousedown', handleGlobalClick);
      document.removeEventListener('touchstart', handleGlobalClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  // Functions
  const handleCheckboxChange = (rowData: any) => {
    setSelectedRows(prev => {
      if (prev.includes(rowData)) {
        setSelectedPreviewMedication(null);
        return prev.filter(item => item !== rowData);
      }
      return [...prev, rowData];
    });
  };

  const handleCancle = async () => {
    try {
      await Promise.all(
        selectedRows.map(item =>
          savePrescriptionMedication({
            ...item,
            isValid: false,
            statusLkey: '1804447528780744',
            deletedAt: Date.now()
          }).unwrap()
        )
      );

      dispatch(notify({ msg: 'All Medication Deleted Successfully', sev: 'success' }));
      setOpenCancellation(false);
      medicRefetch().catch(() => {});
      medicRefetch().catch(() => {});
      setSelectedRows([]);
    } catch (error) {
      dispatch(notify({ msg: 'One or more deleted failed', sev: 'error' }));
    }
  };

  const handleSubmitPres = async () => {
    try {
      await savePrescription({
        ...prescription,
        statusLkey: '1804482322306061',
        saveDraft: false,
        submittedAt: Date.now()
      }).unwrap();

      dispatch(notify('submetid  Successfully'));
      await handleCleare();
      setPreKeyRecord({ preKey: null });
      preRefetch().then(() => '');
      medicRefetch().then(() => '');
      setSummaryModalOpen(false);
    } catch (error) {
      console.error('Error saving prescription or medications:', error);
    }

    prescriptionMedications?.object?.map((item: any) => {
      savePrescriptionMedication({ ...item, statusLkey: '1804482322306061' });
    });
    medicRefetch().then(() => '');
  };

  const handleCleare = () => {
    setPrescriptionMedications({
      ...newApPrescriptionMedications,
      durationTypeLkey: null,
      administrationInstructions: null,
      instructionsTypeLkey: null,
      genericSubstitute: false,
      chronicMedication: false,
      refillIntervalUnitLkey: null,
      indicationUseLkey: null
    });

    setCustomeinst({ dose: null, frequency: null, unit: null, roa: null });
  };

  const handleSavePrescription = async () => {
    await handleCleare();
    setPreKeyRecord({ preKey: null });

    if (patient && encounter) {
      try {
        const response: any = await savePrescription({
          ...newApPrescription,
          patientKey: patient.key,
          visitKey: encounter.key,
          statusLkey: '164797574082125',
          saveDraft: true
        });

        dispatch(notify('Start New Prescription whith ID:' + response?.data?.prescriptionId));
        setPreKeyRecord({ preKey: response?.data?.key });
        preRefetch().then(() => '');
      } catch (error) {
        console.error('Error saving prescription:', error);
      }
    } else {
      console.warn('Patient or encounter is missing. Cannot save prescription.');
    }
  };

  const handleNewPrescriptionAndAddMedication = async () => {
    try {
      if (!preKeyRecord['preKey']) await handleSavePrescription();
      await new Promise(resolve => setTimeout(resolve, 100));
      handleCleare();
      setOpenDetailsModal(true);
      setOpenToAdd(true);
    } catch (error) {
      dispatch(notify({ msg: 'Failed to complete actions', type: 'error' }));
    }
  };

  const tableColumns: any[] = [
    {
      key: '#',
      title: <Translate> #</Translate>,
      flexGrow: 1,
      render: (rowData: any) => (
        <Checkbox
          className="check-box"
          key={rowData.id}
          checked={selectedRows.includes(rowData)}
          onChange={() => handleCheckboxChange(rowData)}
          disabled={rowData.statusLvalue?.lovDisplayVale !== 'New'}
        />
      )
    },
    {
      key: 'medicationName',
      dataKey: 'genericMedicationsId',
      title: <Translate> Medication Name</Translate>,
      flexGrow: 2,
      render: (rowData: any) =>
        genericMedicationListResponse?.data?.find(
          (item: any) => item.id === rowData.genericMedicationsId
        )?.name
    },
    {
      key: 'instructions',
      dataKey: '',
      title: 'Instructions',
      flexGrow: 3,
      render: (rowData: any) => {
        if (rowData.instructionsTypeLkey === '3010591042600262') {
          const generic = predefinedInstructionsListResponse?.data?.find(
            item => item.id === Number(rowData.instructions)
          );

          if (generic) {
          } else {
            console.warn('No matching generic found for key:', rowData.instructions);
          }
          return [
            generic?.dose ?? '',
            formatEnumString(generic?.unit) ?? '',
            formatEnumString(generic?.rout) ?? '', // route
            formatEnumString(generic?.frequency) ?? ''
          ]
            .filter(v => v != null && String(v).trim() !== '')
            .join(', ');
        }
        if (rowData.instructionsTypeLkey === '3010573499898196') {
          return rowData?.instructions;
        }
        if (rowData?.instructionsTypeLkey === '3010606785535008') {
          return (
            customeInstructions?.object?.find(
              item => item?.prescriptionMedicationsKey === rowData.key
            )?.dose +
            ',' +
            customeInstructions?.object?.find(
              item => item?.prescriptionMedicationsKey === rowData.key
            )?.unitLvalue?.lovDisplayVale +
            ',' +
            customeInstructions?.object?.find(
              item => item?.prescriptionMedicationsKey === rowData.key
            )?.frequencyLvalue?.lovDisplayVale
          )+","+formatEnumString(
            customeInstructions?.object?.find(
              item => item?.prescriptionMedicationsKey === rowData.key
            )?.roaLkey)
          ;
        }

        return 'no';
      }
    },
    {
      key: 'instructionsType',
      dataKey: 'instructionsTypeLkey',
      title: 'Instructions Type',
      flexGrow: 2,
      render: (rowData: any) =>
        rowData.instructionsTypeLvalue
          ? rowData.instructionsTypeLvalue.lovDisplayVale
          : rowData.instructionsTypeLkey
    },
    { key: 'validUtil', dataKey: 'validUtil', title: 'Valid Util', flexGrow: 2 },
    {
      key: 'isChronic',
      dataKey: 'chronicMedication',
      title: 'Is Chronic',
      flexGrow: 2,
      render: (rowData: any) => (rowData.chronicMedication ? 'Yes' : 'No')
    },
    {
      key: 'status',
      dataKey: 'statusLkey',
      title: 'Status',
      flexGrow: 1,
      render: (rowData: any) =>
        rowData.statusLvalue ? rowData.statusLvalue?.lovDisplayVale : rowData.statusLkey
    },
    {
      key: 'actions',
      title: 'Actions',
      flexGrow: 1.5,
      render: (rowData: any) => {
        const isInFavorites = favoriteMedications.some(
          item => item.genericMedicationsId === rowData.genericMedicationsId
        );
        return (
          <div className="flex-c8">
            <MdModeEdit
              title="Edit"
              size={20}
              className={'font-aws'}
              onClick={() => {
                if (rowData.statusLvalue?.lovDisplayVale === 'New') {
                  setPrescriptionMedications(rowData);
                  setOpenDetailsModal(true);
                  setOpenToAdd(false);
                }
              }}
            />
            <FontAwesomeIcon
              icon={faStar}
              onClick={() => addToFavorites(rowData)}
              className={isInFavorites ? 'font-awsy' : 'font-aws'}
              title={isInFavorites ? 'Remove from favorites' : 'Add to favorites'}
            />
          </div>
        );
      }
    },
    {
      key: 'attachments',
      title: <Translate>Attachments</Translate>,
      flexGrow: 1,
      render: (rowData: any) => (
        <MdAttachFile
          size={20}
          fill={rowData?.key ? 'var(--primary-gray)' : '#ccc'}
          onClick={() => {
            if (rowData?.key) {
              setSelectedMedicationForAttachments(rowData);
              setAttachmentsModalOpen(true);
            }
          }}
          style={{ cursor: rowData?.key ? 'pointer' : 'not-allowed' }}
          title="View Attachments"
        />
      )
    },
    {
      key: '',
      title: <Translate>Created At/By</Translate>,
      expandable: true,
      render: (rowData: any) => (
        <>
          <span>{rowData.createdBy}</span>
          <br />
          <span className="date-table-style">{formatDateWithoutSeconds(rowData.createdAt)}</span>
        </>
      )
    },
    {
      key: '',
      title: <Translate>Updated At/By</Translate>,
      expandable: true,
      render: (rowData: any) => (
        <>
          <span>{rowData.updatedBy}</span>
          <br />
          <span className="date-table-style">{formatDateWithoutSeconds(rowData.updatedAt)}</span>
        </>
      )
    },
    {
      key: '',
      title: <Translate>Cancelled At/By</Translate>,
      expandable: true,
      render: (rowData: any) => (
        <>
          <span>{rowData.deletedBy}</span>
          <br />
          <span className="date-table-style">{formatDateWithoutSeconds(rowData.deletedAt)}</span>
        </>
      )
    }
  ];

  const pageIndex = listRequest.pageNumber - 1;
  const rowsPerPage = listRequest.pageSize;
  const totalCount = prescriptionMedications?.extraNumeric ?? 0;

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

  const handleGeneratePrescriptionPdf = async () => {
    try {
      if (!patient || !encounter || !preKeyRecord.preKey) {
        dispatch(notify({ msg: 'Missing patient, encounter or prescription', type: 'error' }));
        return;
      }

      const blob = await generatePrescriptionPdf({
        patient,
        encounter,
        prescriptionKey: preKeyRecord.preKey,
        genericMedicationList: genericMedicationListResponse?.data ?? [],
        facilityName: facilityName,
        authenticatedUserName: `${authSlice?.user?.firstName} ${authSlice?.user?.lastName}`,
        authenticatedUserEmail: authSlice?.user?.email,
        predefinedInstructions: predefinedInstructionsListResponse?.data ?? [],
        customInstructions: customeInstructions?.object ?? []
      }).unwrap();

      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');

      link.href = url;
      link.download = `Prescription_${preKeyRecord.preKey}.pdf`;
      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      dispatch(
        notify({
          msg: error?.message || 'Failed to generate prescription PDF',
          type: 'error'
        })
      );
    }
  };

  return (
    <>
      {uniqueBrandIds.map((id: string) => (
        <BrandActivesPrefetcher key={id} brandId={id} onLoaded={onActivesLoaded} />
      ))}{' '}
      <div className="bt-div">
        <div style={{ width: '500px', display: 'flex', flexDirection: 'row', gap: '6px' }}>
          <Form fluid>
            <MyInput
              placeholder="Prescription"
              fieldName="preKey"
              fieldType="select"
              record={preKeyRecord}
              setRecord={setPreKeyRecord}
              selectData={filteredPrescriptions ?? []}
              selectDataLabel="prescriptionId"
              selectDataValue="key"
              showLabel={false}
            />
          </Form>

          <div className="icon-style">
            <FaFilePrescription size={18} />
          </div>
          <div>
            <div className="prescripton-word-style">Prescription</div>
            <div className="prescripton-number-style">
              {prescriptions?.object?.find(
                prescription => prescription.key === preKeyRecord['preKey']
              )?.prescriptionId || '_'}
            </div>
          </div>

          <Form fluid>
            <MyInput
              fieldName=""
              fieldType="select"
              selectData={[]}
              placeholder="Pharmacy"
              selectDataLabel="label"
              selectDataValue="key"
              record={{}}
              setRecord={() => {}}
              width={110}
            />
          </Form>
        </div>

        <div className={clsx('bt-right', { 'disabled-panel': edit })}>
          <UrgencyButton />

          <MyButton loading={isLoadingPrescriptions}>Validate with Gallon Reasoner</MyButton>

          <MyButton
            onClick={handleNewPrescriptionAndAddMedication}
            prefixIcon={() => <PlusIcon />}
            loading={isLoadingPrescriptions}
          >
            Add Medication
          </MyButton>

          <MyButton
            prefixIcon={() => <BlockIcon />}
            onClick={() => setOpenCancellation(true)}
            disabled={selectedRows.length === 0}
          >
            Cancel
          </MyButton>

          <MyButton
            loading={isLoadingPrescriptions}
            onClick={() => setSummaryModalOpen(true)}
            disabled={
              preKeyRecord['preKey']
                ? prescriptions?.object?.find((p: any) => p.key === preKeyRecord['preKey'])
                    ?.statusLkey === '1804482322306061'
                : true
            }
            prefixIcon={() => <CheckIcon />}
          >
            Sign & Submit Order
          </MyButton>
        </div>

        <MyButton
          onClick={handleGeneratePrescriptionPdf}
          loading={isGeneratingPdf}
          disabled={!preKeyRecord['preKey']}
          prefixIcon={() => <FontAwesomeIcon icon={faPrint} />}
        ></MyButton>
      </div>
      <Divider />
      <div className="bt-div">
        <div className="bt-right">
          <Checkbox checked={!showCanceled} onChange={() => setShowCanceled(!showCanceled)}>
            Show cancelled
          </Checkbox>
        </div>
      </div>
      <div ref={tableContainerRef}>
        <MyTable
          columns={tableColumns}
          data={prescriptionMedications?.object ?? []}
          onRowClick={(rowData: any) => {
            setSelectedPreviewMedication(rowData);
            setPrescriptionMedications(rowData);
            setOpenToAdd(false);
            if (rowData.instructionsTypeLkey == '3010606785535008') {
              setSelectedRowoMedicationKey(rowData.key);
            }
          }}
          loading={isLoadingPrescriptionMedications}
          rowClassName={isSelected}
          page={pageIndex}
          rowsPerPage={rowsPerPage}
          totalCount={totalCount}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </div>
      {selectedPreviewMedication && (
        <div className="mt-4">
          <PrescriptionPreview
            orderMedication={selectedPreviewMedication}
            genericMedicationListResponse={genericMedicationListResponse}
            orderTypeLovQueryResponse={{ object: [] }}
            unitLovQueryResponse={{ object: [] }}
            unitsLovQueryResponse={{ object: [] }}
            DurationTypeLovQueryResponse={{ object: [] }}
            filteredList={[]}
            indicationLovQueryResponse={{ object: [] }}
            administrationInstructionsLovQueryResponse={{ object: [] }}
            routeLovQueryResponse={{ object: [] }}
            frequencyLovQueryResponse={{ object: [] }}
            infusionDeviceLovQueryResponse={{ object: [] }}
          />
        </div>
      )}
      <DetailsModal
        edit={edit}
        open={openDetailsModal}
        setOpen={setOpenDetailsModal}
        patient={patient}
        encounter={encounter}
        prescriptionMedication={prescriptionMedication}
        setPrescriptionMedications={setPrescriptionMedications}
        preKey={preKeyRecord['preKey']}
        openToAdd={openToAdd}
        medicRefetch={medicRefetch}
        setOrderMedication={() => {}}
        drugKey={null}
        editing={false}
      />
      <CancellationModal
        open={openCancellation}
        setOpen={setOpenCancellation}
        object={prescriptionMedication}
        setObject={setPrescriptionMedications}
        handleCancle={handleCancle}
        withReason={false}
        title={'Cancellation'}
      />
      <PatientHistorySummaryModal
        patient={patient}
        encounter={encounter}
        edit={edit}
        open={summaryModalOpen}
        setOpen={setSummaryModalOpen}
        handleSave={handleSubmitPres}
      />
      <MyModal
        open={openFavoritesModal}
        setOpen={setOpenFavoritesModal}
        title="Favorite Medications"
        size="lg"
        content={
          <div>
            <MyTable
              columns={[
                {
                  key: 'medicationName',
                  dataKey: 'genericMedicationsId',
                  title: 'Medication Name',
                  render: (rowData: any) =>
                    genericMedicationListResponse?.data?.find(
                      (item: any) => item.id === rowData.genericMedicationsId
                    )?.name || 'Unknown Medication'
                },
                {
                  key: 'instruction',
                  dataKey: '',
                  title: 'Instruction',
                  render: (rowData: any) =>
                    [
                      rowData.dose,
                      rowData.doseUnitLvalue?.lovDisplayVale,
                      rowData.drugOrderTypeLkey == '2937757567806213'
                        ? 'STAT'
                        : 'every ' + rowData.frequency + ' hours',
                      rowData.roaLvalue?.lovDisplayVale
                    ]
                      .filter(Boolean)
                      .join(', ')
                },
                {
                  key: 'administrationInstruction',
                  dataKey: 'administrationInstructions',
                  title: 'Administration Instruction',
                  render: (rowData: any) => {
                    if (rowData.administrationInstructions?.lovDisplayVale) {
                      return rowData.administrationInstructions.lovDisplayVale;
                    } else if (rowData.administrationInstructions) {
                      const instruction = predefinedInstructionsListResponse?.data?.find(
                        (item: any) => item.id === rowData.administrationInstructions
                      );
                      return instruction?.lovDisplayVale || rowData.administrationInstructions;
                    }
                    return 'No instruction';
                  }
                },
                {
                  key: 'parametersToMonitor',
                  dataKey: 'parametersToMonitorKey',
                  title: 'Parameters To Monitor',
                  render: (rowData: any) => {
                    if (rowData.parametersToMonitor) return rowData.parametersToMonitor;
                    if (rowData.parametersToMonitorValue?.lovDisplayVale)
                      return rowData.parametersToMonitorValue.lovDisplayVale;
                    if (rowData.parametersToMonitorKey) return rowData.parametersToMonitorKey;
                    return 'No parameters specified';
                  }
                },
                {
                  key: 'actions',
                  title: 'Actions',
                  render: (rowData: any) => (
                    <div className="flex-c8">
                      <MyButton size="xs" onClick={() => handleRecall(rowData)}>
                        Recall
                      </MyButton>
                      <FontAwesomeIcon
                        icon={faStar}
                        onClick={() => addToFavorites(rowData)}
                        className="star-favorite-icon"
                        title="Remove from favorites"
                      />
                    </div>
                  )
                }
              ]}
              onRowClick={(rowData: any) => {
                setPrescriptionMedications({ ...rowData, parametersToMonitor: '' });
              }}
              data={favoriteMedications}
            />
          </div>
        }
      />
      <MyModal
        open={attachmentsModalOpen}
        setOpen={setAttachmentsModalOpen}
        title={`Attachments - ${
          selectedMedicationForAttachments
            ? genericMedicationListResponse?.data?.find(
                (item: any) => item.id === selectedMedicationForAttachments.genericMedicationsId
              )?.name || 'Medication'
            : 'Medication'
        }`}
        size="lg"
        hideActionBtn={true}
        content={
          <EncounterAttachment
            localEncounter={encounter}
            source="PRESCRIPTION_ORDER_ATTACHMENT"
            sourceId={
              selectedMedicationForAttachments?.key
                ? Number(selectedMedicationForAttachments.key)
                : undefined
            }
            refetchAttachmentList={false}
            setRefetchAttachmentList={() => {}}
          />
        }
      />
      <PatientHistorySummaryModal
        patient={patient}
        encounter={encounter}
        edit={edit}
        open={summaryModalOpen}
        setOpen={setSummaryModalOpen}
        handleSave={handleSubmitPres}
        medicationValidationPayload={payload}
      />
      <AllergyFloatingButton patientKey={patient?.key} />
    </>
  );
};

export default Prescription;
