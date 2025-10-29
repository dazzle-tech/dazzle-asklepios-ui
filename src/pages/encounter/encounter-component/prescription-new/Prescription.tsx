import CancellationModal from '@/components/CancellationModal';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import {
  useGetCustomeInstructionsQuery,
  useGetPrescriptionMedicationsQuery,
  useGetPrescriptionsQuery,
  useSavePrescriptionMedicationMutation,
  useSavePrescriptionMutation
} from '@/services/encounterService';
import {
  useGetGenericMedicationWithActiveIngredientQuery,
  useGetPrescriptionInstructionQuery
} from '@/services/medicationsSetupService';
import { ApPrescriptionMedications } from '@/types/model-types';
import { newApPrescription, newApPrescriptionMedications } from '@/types/model-types-constructor';
import { initialListRequest, ListRequest } from '@/types/types';
import { formatDateWithoutSeconds } from '@/utils';
import { notify } from '@/utils/uiReducerActions';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import BlockIcon from '@rsuite/icons/Block';
import CheckIcon from '@rsuite/icons/Check';
import DocPassIcon from '@rsuite/icons/DocPass';
import PlusIcon from '@rsuite/icons/Plus';
import clsx from 'clsx';
import React, { useEffect, useRef, useState } from 'react';
import { FaFilePrescription } from 'react-icons/fa6';
import { MdModeEdit } from 'react-icons/md';
import { useLocation } from 'react-router-dom';
import { Checkbox, Divider, Form } from 'rsuite';
import AllergyFloatingButton from '../../encounter-pre-observations/AllergiesNurse/AllergyFloatingButton';
import UrgencyButton from '../drug-order/UrgencyButton';
import DetailsModal from './DetailsModal';
import PrescriptionPreview from './PrescriptionPreview';
import './styles.less';

const Prescription = props => {
  const location = useLocation();
  const tableContainerRef = useRef<HTMLDivElement | null>(null);

  const patient = props.patient || location.state?.patient;
  const encounter = props.encounter || location.state?.encounter;
  const edit = props.edit ?? location.state?.edit ?? false;
  const dispatch = useAppDispatch();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [openToAdd, setOpenToAdd] = useState(true);
  const [openCancellation, setOpenCancellation] = useState(false);
  const [showCanceled, setShowCanceled] = useState(true);
  const { data: predefinedInstructionsListResponse } = useGetPrescriptionInstructionQuery({
    ...initialListRequest
  });
  const [customeinst, setCustomeinst] = useState({
    dose: null,
    unit: null,
    frequency: null,
    roa: null
  });

  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const { data: genericMedicationListResponse } =
    useGetGenericMedicationWithActiveIngredientQuery(searchKeyword);

  const {
    data: prescriptions,
    isLoading: isLoadingPrescriptions,
    refetch: preRefetch
  } = useGetPrescriptionsQuery({
    ...initialListRequest,
    filters: [
      { fieldName: 'patient_key', operator: 'match', value: patient.key },
      { fieldName: 'visit_key', operator: 'match', value: encounter.key }
    ]
  });
  const filteredPrescriptions =
    prescriptions?.object?.filter(item => item.statusLkey === '1804482322306061') ?? [];

  const [preKeyRecord, setPreKeyRecord] = useState({ preKey: null });
  const [prescriptionMedication, setPrescriptionMedications] = useState<ApPrescriptionMedications>({
    ...newApPrescriptionMedications,
    prescriptionKey: preKeyRecord['preKey'],
    duration: null,
    numberOfRefills: null
  });

  const [selectedPreviewMedication, setSelectedPreviewMedication] = useState(null);
  const [favoriteMedications, setFavoriteMedications] = useState([]);
  const [openFavoritesModal, setOpenFavoritesModal] = useState(false);

  const isFormField = (node: EventTarget | null) => {
    if (!(node instanceof Element)) return false;
    return (
      node.closest(
        'input, textarea, select, button, [contenteditable="true"], .rs-input, .rs-picker, .rs-checkbox, .rs-btn'
      ) !== null
    );
  };
  const addToFavorites = rowData => {
    const alreadyExists = favoriteMedications.some(
      item => item.genericMedicationsKey === rowData.genericMedicationsKey
    );

    if (alreadyExists) {
      setFavoriteMedications(prev =>
        prev.filter(item => item.genericMedicationsKey !== rowData.genericMedicationsKey)
      );
      const genericMedication = genericMedicationListResponse?.object?.find(
        item => item.key === rowData.genericMedicationsKey
      );
      const medicationName = genericMedication ? genericMedication.genericName : 'Medication';
      dispatch(notify({ msg: `${medicationName} removed from favorites`, type: 'info' }));
    } else {
      const genericMedication = genericMedicationListResponse?.object?.find(
        item => item.key === rowData.genericMedicationsKey
      );

      const medicationToAdd = {
        ...rowData,
        genericName: genericMedication ? genericMedication.genericName : 'Unnamed Medication',
        administrationInstructions: rowData.administrationInstructions || null,
        parametersToMonitor: rowData.parametersToMonitor || ''
      };

      setFavoriteMedications(prev => [...prev, medicationToAdd]);
      dispatch(
        notify({ msg: `${medicationToAdd.genericName} added to favorites`, type: 'success' })
      );
    }
  };

  const handleRecall = async (rowData: any) => {
    const genericMedication = genericMedicationListResponse?.object?.find(
      item => item.key === rowData.genericMedicationsKey
    );
    await Promise.resolve();

    setPrescriptionMedications({
      ...rowData,
      prescriptionKey: preKeyRecord['preKey'],
      genericName: genericMedication?.genericName || ''
    });

    setOpenDetailsModal(true);
    setOpenFavoritesModal(false);
  };

  const isSelected = rowData => {
    if (rowData && prescriptionMedication && rowData.key === prescriptionMedication.key) {
      return 'selected-row';
    } else return '';
  };

  const [savePrescription, savePrescriptionMutation] = useSavePrescriptionMutation();

  const [savePrescriptionMedication, { isLoading: isSavingPrescriptionMedication }] =
    useSavePrescriptionMedicationMutation();
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'prescription_key',
        operator: '',
        value: preKeyRecord['preKey']
      },
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
  const {
    data: customeInstructions,
    isLoading: isLoadingCustomeInstructions,
    refetch: refetchCo
  } = useGetCustomeInstructionsQuery({
    ...initialListRequest
  });

  const [isdraft, setIsDraft] = useState(
    prescriptions?.object?.find(prescription => prescription.key === preKeyRecord['preKey'])
      ?.saveDraft
  );

  // Effects
  useEffect(() => {
    const foundPrescription = prescriptions?.object?.find(
      prescription => prescription.key === preKeyRecord['preKey']
    );
    if (foundPrescription?.saveDraft !== isdraft) {
      setIsDraft(foundPrescription?.saveDraft);
    }
  }, [prescriptions, preKeyRecord['preKey']]);

  useEffect(() => {
    setListRequest(prev => ({
      ...prev,
      filters: [
        {
          fieldName: 'prescription_key',
          operator: '',
          value: preKeyRecord['preKey']
        },
        {
          fieldName: 'status_lkey',
          operator: showCanceled ? 'notMatch' : 'match',
          value: '1804447528780744'
        }
      ]
    }));
  }, [preKeyRecord['preKey'], showCanceled]);

  useEffect(() => {
    if (prescriptions?.object) {
      const foundPrescription = prescriptions.object.find(
        prescription => prescription.saveDraft === true
      );

      if (foundPrescription?.key != null) {
        setPreKeyRecord({ preKey: foundPrescription?.key });
      }
    }
  }, [prescriptions]);

  useEffect(() => {
    refetchCo();
    setCustomeinst({
      ...customeinst,
      unit: customeInstructions?.object?.find(
        item => item.prescriptionMedicationsKey === selectedRowoMedicationKey
      )?.unitLkey,
      frequency: customeInstructions?.object?.find(
        item => item.prescriptionMedicationsKey === selectedRowoMedicationKey
      )?.frequencyLkey,
      dose: customeInstructions?.object?.find(
        item => item.prescriptionMedicationsKey === selectedRowoMedicationKey
      )?.dose
    });
  }, [selectedRowoMedicationKey]);

  useEffect(() => {
    if (preKeyRecord['preKey'] == null) {
      handleCleare();
    }
  }, [preKeyRecord['preKey']]);

  useEffect(() => {
    if (showCanceled) {
      handleCleare();
    }
  }, [showCanceled]);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;

      // If inside table: ignore
      if (tableContainerRef.current?.contains(target as Node)) return;

      // If on field/button: ignore
      if (isFormField(e.target)) return;

      // Hide under table + clean row selection
      setSelectedPreviewMedication(null);
      setPrescriptionMedications(prev => ({
        ...prev,
        key: undefined // if you want to clear everything Or call handleCleare() .
      }));
      setSelectedRows([]);
    };

    document.addEventListener('mousedown', handleGlobalClick);
    document.addEventListener('touchstart', handleGlobalClick);

    // Support ESC to hide the preview
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
      let updatedRows;
      if (prev.includes(rowData)) {
        updatedRows = prev.filter(item => item !== rowData);
        setSelectedPreviewMedication(null);
      } else {
        updatedRows = [...prev, rowData];
      }
      return updatedRows;
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
      medicRefetch()
        .then(() => {})
        .catch(error => {});

      medicRefetch()
        .then(() => {})
        .catch(error => {});

      setSelectedRows([]);
    } catch (error) {
      dispatch(notify({ msg: 'One or more deleted failed', sev: 'error' }));
    }
  };

  const handleSubmitPres = async () => {
    try {
      await savePrescription({
        ...prescriptions?.object?.find(prescription => prescription.key === preKeyRecord['preKey']),

        statusLkey: '1804482322306061',
        saveDraft: false,
        submittedAt: Date.now()
      }).unwrap();
      dispatch(notify('submetid  Successfully'));
      await handleCleare();
      setPreKeyRecord({ preKey: null });
      preRefetch().then(() => '');
      medicRefetch().then(() => '');
    } catch (error) {
      console.error('Error saving prescription or medications:', error);
    }

    prescriptionMedications?.object?.map(item => {
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

  const saveDraft = async () => {
    try {
      await savePrescription({
        ...prescriptions?.object?.find(prescription => prescription.key === preKeyRecord['preKey']),
        saveDraft: true
      }).then(() => {
        dispatch(notify({ msg: 'Saved Draft successfully', sev: 'success' }));
        setIsDraft(true);
      });
    } catch (error) {}
  };

  const cancleDraft = async () => {
    try {
      await savePrescription({
        ...prescriptions?.object?.find(prescription => prescription.key === preKeyRecord['preKey']),
        saveDraft: false
      }).then(() => {
        dispatch(notify({ msg: 'Draft Cancelled', sev: 'success' }));
        setIsDraft(false);
      });
    } catch (error) {}
  };

  const handleSavePrescription = async () => {
    await handleCleare();
    setPreKeyRecord({ preKey: null });

    if (patient && encounter) {
      try {
        const response = await savePrescription({
          ...newApPrescription,
          patientKey: patient.key,
          visitKey: encounter.key,
          statusLkey: '164797574082125'
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
      if (!preKeyRecord['preKey']) {
        await handleSavePrescription();
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      handleCleare();
      setOpenDetailsModal(true);
      setOpenToAdd(true);

      if (preKeyRecord['preKey'] || prescriptions?.object?.some(p => p.saveDraft === true)) {
        await saveDraft();
      }
    } catch (error) {
      dispatch(notify({ msg: 'Failed to complete actions', type: 'error' }));
    }
  };

  const tableColumns = [
    {
      key: '#',
      title: <Translate> #</Translate>,
      flexGrow: 1,

      render: (rowData: any) => {
        return (
          <Checkbox
            className="check-box"
            key={rowData.id}
            checked={selectedRows.includes(rowData)}
            onChange={() => handleCheckboxChange(rowData)}
            disabled={rowData.statusLvalue?.lovDisplayVale !== 'New'}
          />
        );
      }
    },

    {
      key: 'medicationName',
      dataKey: 'genericMedicationsKey',
      title: <Translate> Medication Name</Translate>,
      flexGrow: 2,
      render: (rowData: any) => {
        return genericMedicationListResponse?.object?.find(
          item => item.key === rowData.genericMedicationsKey
        )?.genericName;
      }
    },
    {
      key: 'instructions',
      dataKey: '',
      title: 'Instructions',
      flexGrow: 3,
      render: (rowData: any) => {
        if (rowData.instructionsTypeLkey === '3010591042600262') {
          const generic = predefinedInstructionsListResponse?.object?.find(
            item => item.key === rowData.instructions
          );

          if (generic) {
          } else {
            console.warn('No matching generic found for key:', rowData.instructions);
          }
          return [
            generic?.dose,
            generic?.unitLvalue?.lovDisplayVale,
            generic?.routLvalue?.lovDisplayVale,
            generic?.frequencyLvalue?.lovDisplayVale
          ]
            .filter(Boolean)
            .join(', ');
        }
        if (rowData.instructionsTypeLkey === '3010573499898196') {
          return rowData.instructions;
        }
        if (rowData.instructionsTypeLkey === '3010606785535008') {
          return (
            customeInstructions?.object?.find(
              item => item.prescriptionMedicationsKey === rowData.key
            )?.dose +
            ',' +
            customeInstructions?.object?.find(
              item => item.prescriptionMedicationsKey === rowData.key
            )?.unitLvalue.lovDisplayVale +
            ',' +
            customeInstructions?.object?.find(
              item => item.prescriptionMedicationsKey === rowData.key
            )?.frequencyLvalue.lovDisplayVale
          );
        }

        return 'no';
      }
    },
    {
      key: 'instructionsType',
      dataKey: 'instructionsTypeLkey',
      title: 'Instructions Type',
      flexGrow: 2,
      render: (rowData: any) => {
        return rowData.instructionsTypeLvalue
          ? rowData.instructionsTypeLvalue.lovDisplayVale
          : rowData.instructionsTypeLkey;
      }
    },
    {
      key: 'validUtil',
      dataKey: 'validUtil',
      title: 'Valid Util',
      flexGrow: 2
    },
    {
      key: 'isChronic',
      dataKey: 'chronicMedication',
      title: 'Is Chronic',
      flexGrow: 2,
      render: (rowData: any) => {
        return rowData.chronicMedication ? 'Yes' : 'No';
      }
    },

    {
      key: 'status',
      dataKey: 'statusLkey',
      title: 'Status',
      flexGrow: 1,
      render: (rowData: any) => {
        return rowData.statusLvalue ? rowData.statusLvalue?.lovDisplayVale : rowData.statusLkey;
      }
    },
    {
      key: 'actions',
      title: 'Actions',
      flexGrow: 1.5,
      render: rowData => {
        const isInFavorites = favoriteMedications.some(
          item => item.genericMedicationsKey === rowData.genericMedicationsKey
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
      key: '',
      title: <Translate>Created At/By</Translate>,
      expandable: true,
      render: (rowData: any) => {
        return (
          <>
            <span>{rowData.createdBy}</span>
            <br />
            <span className="date-table-style">{formatDateWithoutSeconds(rowData.createdAt)}</span>
          </>
        );
      }
    },
    {
      key: '',
      title: <Translate>Updated At/By</Translate>,
      expandable: true,
      render: (rowData: any) => {
        return (
          <>
            <span>{rowData.updatedBy}</span>
            <br />
            <span className="date-table-style">{formatDateWithoutSeconds(rowData.updatedAt)}</span>
          </>
        );
      }
    },

    {
      key: '',
      title: <Translate>Cancelled At/By</Translate>,
      expandable: true,
      render: (rowData: any) => {
        return (
          <>
            <span>{rowData.deletedBy}</span>
            <br />
            <span className="date-table-style">{formatDateWithoutSeconds(rowData.deletedAt)}</span>
          </>
        );
      }
    }
  ];
  const pageIndex = listRequest.pageNumber - 1;

  // how many rows per page:
  const rowsPerPage = listRequest.pageSize;

  // total number of items in the backend:
  const totalCount = prescriptionMedications?.extraNumeric ?? 0;

  // handler when the user clicks a new page number:
  const handlePageChange = (_: unknown, newPage: number) => {
    // MUI gives you a zero-based page, so add 1 for your API

    setListRequest({ ...listRequest, pageNumber: newPage + 1 });
  };

  // handler when the user chooses a different rows-per-page:
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setListRequest({
      ...listRequest,
      pageSize: parseInt(event.target.value, 10),
      pageNumber: 1 // reset to first page
    });
  };

  return (
    <>
      <div className="bt-div">
        <div style={{ width: '500px' }}>
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
        </div>
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
        <div
          className={clsx('bt-right', {
            'disabled-panel': edit
          })}
        >
          <Form fluid>
            <MyInput
              fieldName=""
              fieldType="select"
              selectData={[]}
              placeholder="Pharmacy"
              selectDataLabel="label"
              selectDataValue="key"
              record={{}}
              setRecord={''}
              width={110}
            />
          </Form>
          <UrgencyButton />
          <MyButton>Validate With</MyButton>
          <MyButton onClick={() => setOpenFavoritesModal(true)}>Recall Favorite</MyButton>
          <MyButton onClick={handleNewPrescriptionAndAddMedication} prefixIcon={() => <PlusIcon />}>
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
            onClick={handleSubmitPres}
            disabled={
              preKeyRecord['preKey']
                ? prescriptions?.object?.find(
                    prescription => prescription.key === preKeyRecord['preKey']
                  )?.statusLkey === '1804482322306061'
                : true
            }
            prefixIcon={() => <CheckIcon />}
          >
            Sign & Submit Order
          </MyButton>
          {isdraft && (
            <MyButton
              appearance="ghost"
              onClick={cancleDraft}
              prefixIcon={() => <DocPassIcon />}
              disabled={
                preKeyRecord['preKey']
                  ? prescriptions?.object?.find(
                      prescription => prescription.key === preKeyRecord['preKey']
                    )?.statusLkey === '1804482322306061'
                  : true
              }
            >
              Cancel draft
            </MyButton>
          )}
        </div>
      </div>
      <Divider />

      <div className="bt-div">
        <div className="bt-right">
          <Checkbox
            checked={!showCanceled}
            onChange={() => {
              setShowCanceled(!showCanceled);
            }}
          >
            Show cancelled
          </Checkbox>
        </div>
      </div>

      <div ref={tableContainerRef}>
        <MyTable
          columns={tableColumns}
          data={prescriptionMedications?.object ?? []}
          onRowClick={rowData => {
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
            fluidOrder={selectedPreviewMedication?.fluidOrder ?? {}}
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
                  dataKey: 'genericMedicationsKey',
                  title: 'Medication Name',
                  render: (rowData: any) => {
                    return (
                      genericMedicationListResponse?.object?.find(
                        item => item.key === rowData.genericMedicationsKey
                      )?.genericName || 'Unknown Medication'
                    );
                  }
                },
                {
                  key: 'instruction',
                  dataKey: '',
                  title: 'Instruction',
                  render: (rowData: any) => {
                    return [
                      rowData.dose,
                      rowData.doseUnitLvalue?.lovDisplayVale,
                      rowData.drugOrderTypeLkey == '2937757567806213'
                        ? 'STAT'
                        : 'every ' + rowData.frequency + ' hours',
                      rowData.roaLvalue?.lovDisplayVale
                    ]
                      .filter(Boolean)
                      .join(', ');
                  }
                },
                {
                  key: 'administrationInstruction',
                  dataKey: 'administrationInstructions',
                  title: 'Administration Instruction',
                  render: (rowData: any) => {
                    if (rowData.administrationInstructions?.lovDisplayVale) {
                      return rowData.administrationInstructions.lovDisplayVale;
                    } else if (rowData.administrationInstructions) {
                      const instruction = predefinedInstructionsListResponse?.object?.find(
                        item => item.key === rowData.administrationInstructions
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
                    if (rowData.parametersToMonitor) {
                      return rowData.parametersToMonitor;
                    } else if (rowData.parametersToMonitorValue?.lovDisplayVale) {
                      return rowData.parametersToMonitorValue.lovDisplayVale;
                    } else if (rowData.parametersToMonitorKey) {
                      return rowData.parametersToMonitorKey;
                    }
                    return 'No parameters specified';
                  }
                },
                {
                  key: 'actions',
                  title: 'Actions',
                  render: rowData => {
                    return (
                      <div className="flex-c8">
                        <MyButton
                          size="xs"
                          onClick={() => {
                            handleRecall(rowData);
                          }}
                        >
                          Recall
                        </MyButton>
                        <FontAwesomeIcon
                          icon={faStar}
                          onClick={() => addToFavorites(rowData)}
                          className="star-favorite-icon"
                          title="Remove from favorites"
                        />
                      </div>
                    );
                  }
                }
              ]}
              onRowClick={rowData => {
                setPrescriptionMedications({ ...rowData, parametersToMonitor: '' });
              }}
              data={favoriteMedications}
            />
          </div>
        }
      />
      <AllergyFloatingButton patientKey={patient.key} />
    </>
  );
};

export default Prescription;
