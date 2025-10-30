import CancellationModal from '@/components/CancellationModal';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { formatDateWithoutSeconds } from '@/utils';
import {
  useGetDrugOrderMedicationQuery,
  useGetDrugOrderQuery,
  useSaveDrugOrderMedicationMutation,
  useSaveDrugOrderMutation
} from '@/services/encounterService';
import { useGetGenericMedicationWithActiveIngredientQuery } from '@/services/medicationsSetupService';
import { FaPills, FaSyringe } from 'react-icons/fa';
import { MdModeEdit, MdAttachFile } from 'react-icons/md';
import { newApDrugOrder, newApDrugOrderMedications } from '@/types/model-types-constructor';
import { initialListRequest, ListRequest } from '@/types/types';
import { notify } from '@/utils/uiReducerActions';
import BlockIcon from '@rsuite/icons/Block';
import CheckIcon from '@rsuite/icons/Check';
import DrugOrderPreview from './DrugOrderPreview';
import DocPassIcon from '@rsuite/icons/DocPass';
import PlusIcon from '@rsuite/icons/Plus';
import React, { useEffect, useRef, useState } from 'react';
import { Checkbox, Divider, Form, SelectPicker } from 'rsuite';
import DetailsModal from './DetailsModal';
import './styles.less';
import { useLocation } from 'react-router-dom';
import clsx from 'clsx';
import AddEditFluidOrder from '@/pages/encounter/encounter-component/iv-fluid-order/AddEditFluidOrder';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import MyModal from '@/components/MyModal/MyModal';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import AllergyFloatingButton from '../../encounter-pre-observations/AllergiesNurse/AllergyFloatingButton';
import UrgencyButton from './UrgencyButton';
import EncounterAttachment from '@/pages/patient/patient-profile/tabs/Attachment-new/EncounterAttachment';
const DrugOrder = props => {
  const location = useLocation();
  const tableContainerRef = useRef<HTMLDivElement | null>(null);

  // Was the click on an input/edit item?
  const isFormField = (node: EventTarget | null) => {
    if (!(node instanceof Element)) return false;
    return (
      node.closest(
        `
      input, textarea, select, button, [contenteditable="true"],
      .rs-input, .rs-picker, .rs-checkbox, .rs-btn, .rs-picker-toggle,
      .rs-calendar, .rs-dropdown, .rs-auto-complete, .rs-input-group
    `
      ) !== null
    );
  };

  // Ignore clicks inside modules/popups (RSuite or your components)
  const isInsideModalOrPopup = (node: EventTarget | null) => {
    if (!(node instanceof Element)) return false;
    return (
      node.closest(
        `
      .rs-modal, .rs-drawer, .rs-picker-select-menu, .rs-picker-popup,
      .my-modal, .my-popup
    `
      ) !== null
    );
  };

  const { data: administrationInstructionsLovQueryResponse } = useGetLovValuesByCodeQuery(
    'MED_ORDER_ADMIN_NSTRUCTIONS'
  );
  const patient = props.patient || location.state?.patient;
  const encounter = props.encounter || location.state?.encounter;
  const edit = props.edit ?? location.state?.edit ?? false;
  const dispatch = useAppDispatch();
  const [order, setOrder] = useState({ ...newApDrugOrder });
  const [drugKey, setDrugKey] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showCanceled, setShowCanceled] = useState(true);
  const [editing, setEditing] = useState(false);
  const [selectedGeneric, setSelectedGeneric] = useState(null);
  const [openToAdd, setOpenToAdd] = useState(true);
  const [reson, setReson] = useState({ cancellationReason: '' });
  const [isdraft, setIsDraft] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [openCancellationReasonModel, setOpenCancellationReasonModel] = useState(false);
  const [openDetailsModel, setOpenDetailsModel] = useState(false);
  const [openAddEditFluidOrderPopup, setOpenAddEditFluidOrderPopup] = useState<boolean>(false);
  const [fluidOrder, setFluidOrder] = useState({});
  const [favoriteMedications, setFavoriteMedications] = useState([]);
  const [adminInstructions, setAdminInstructions] = useState('');
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [openFavoritesModal, setOpenFavoritesModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(true);
  const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
  const [selectedMedicationForAttachments, setSelectedMedicationForAttachments] = useState(null);
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
      dispatch(
        notify({
          msg: `${medicationName} removed from favorites`,
          type: 'info'
        })
      );
    } else {
      const genericMedication = genericMedicationListResponse?.object?.find(
        item => item.key === rowData.genericMedicationsKey
      );

      const medicationToAdd = {
        ...rowData,
        genericName: genericMedication ? genericMedication.genericName : 'Unnamed Medication',
        administrationInstructions: rowData.administrationInstructions,
        parametersToMonitor: rowData.parametersToMonitor || rowData.parametersToMonitorKey
      };

      setFavoriteMedications(prev => [...prev, medicationToAdd]);
      dispatch(
        notify({
          msg: `${medicationToAdd.genericName} added to favorites`,
          type: 'success'
        })
      );
    }
  };
  const { data: genericMedicationListResponse } =
    useGetGenericMedicationWithActiveIngredientQuery(searchKeyword);

  const { data: orders, refetch: ordRefetch } = useGetDrugOrderQuery({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'patient_key',
        operator: 'match',
        value: patient?.key
      },
      {
        fieldName: 'visit_key',
        operator: 'match',
        value: encounter?.key
      }
    ]
  });

  const [filteredList, setFilteredList] = useState([]);

  const { data: orderTypeLovQueryResponse } = useGetLovValuesByCodeQuery('MEDCATION_ORDER_TYPE');
  const { data: priorityLevelLovQueryResponse } = useGetLovValuesByCodeQuery('ORDER_PRIORITY');
  const { data: indicationLovQueryResponse } = useGetLovValuesByCodeQuery('MED_INDICATION_USE');
  const { data: unitLovQueryResponse } = useGetLovValuesByCodeQuery('UOM');
  const { data: DurationTypeLovQueryResponse } = useGetLovValuesByCodeQuery('MED_DURATION');
  // Fetch route Lov response
  const { data: routeLovQueryResponse } = useGetLovValuesByCodeQuery('FLUID_ROUTE');
  // Fetch frequency Lov response
  const { data: frequencyLovQueryResponse } = useGetLovValuesByCodeQuery('IV_FREQUENCY');
  // Fetch infusion Device Lov response
  const { data: infusionDeviceLovQueryResponse } = useGetLovValuesByCodeQuery('INFUSION_DEVICE');
  // Fetch priority Lov response
  const { data: priorityLovQueryResponse } = useGetLovValuesByCodeQuery('ORDER_PRIORITY');
  // Fetch units OF TIME Lov response
  const { data: unitsLovQueryResponse } = useGetLovValuesByCodeQuery('TIME_UNITS');

  const [orderMedication, setOrderMedication] = useState<any>({
    ...newApDrugOrderMedications,
    drugOrderKey: drugKey
  });

  const [showPreview, setShowPreview] = useState(false);
  const [saveDrugorder, saveDrugorderMutation] = useSaveDrugOrderMutation();
  const [saveDrugorderMedication, saveDrugorderMedicationMutation] =
    useSaveDrugOrderMedicationMutation();
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'drug_order_key',
        operator: '',
        value: drugKey
      },
      {
        fieldName: 'status_lkey',
        operator: showCanceled ? 'notMatch' : 'match',
        value: '1804447528780744'
      }
    ]
  });
  const {
    data: orderMedications,
    refetch: medicRefetch,
    isFetching: fetchingOrderMed
  } = useGetDrugOrderMedicationQuery(listRequest);
  const filteredorders =
    orders?.object?.filter(item => item.statusLkey === '1804482322306061') ?? [];

  const isSelected = rowData => {
    if (rowData && orderMedication && rowData.key === orderMedication.key) {
      return 'selected-row';
    } else return '';
  };

  //Effect
  useEffect(() => {
    setListRequest(prev => ({
      ...prev,
      filters: [
        {
          fieldName: 'drug_order_key',
          operator: '',
          value: drugKey
        },
        {
          fieldName: 'status_lkey',
          operator: showCanceled ? 'notMatch' : 'match',
          value: '1804447528780744'
        }
      ]
    }));
  }, [drugKey, showCanceled]);
  useEffect(() => {
    if (orders?.object) {
      const foundOrder = orders.object.find(order => {
        return order.saveDraft === true;
      });

      if (foundOrder?.key != null) {
        setDrugKey(foundOrder?.key);
        setOrder({ ...foundOrder });
      } else {
        setOrder({ ...newApDrugOrder });
      }
    }
  }, [orders]);
  useEffect(() => {
    if (drugKey == null) {
      handleCleare();
    }
  }, [drugKey]);
  useEffect(() => {
    const foundOrder = orders?.object?.find(order => order.key === drugKey);
    if (foundOrder?.saveDraft !== isdraft) {
      setIsDraft(foundOrder?.saveDraft);
    }
  }, [orders, drugKey]);
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;

      // If click inside table container => do nothing
      if (tableContainerRef.current?.contains(target as Node)) return;

      // If on input element or inside modal/popup => ignore
      if (isFormField(e.target) || isInsideModalOrPopup(e.target)) return;

      // Hide the preview and clean up the selections
      setShowPreview(false);
      setSelectedRows([]);
      handleCleare();// reset the selected row
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowPreview(false);
        setSelectedRows([]);
        // handleCleare();
      }
    };

    document.addEventListener('mousedown', handleGlobalClick);
    document.addEventListener('touchstart', handleGlobalClick);
    document.addEventListener('keydown', handleEsc);

    return () => {
      document.removeEventListener('mousedown', handleGlobalClick);
      document.removeEventListener('touchstart', handleGlobalClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  //functions
  const saveDraft = async () => {
    try {
      await saveDrugorder({
        ...orders?.object?.find(order => order.key === drugKey),
        saveDraft: true
      }).then(() => {
        setIsDraft(true);
      });
    } catch (error) {
      dispatch(notify({ msg: 'Error Saving draft', type: 'error' }));
    }
  };
  const cancleDraft = async () => {
    try {
      await saveDrugorder({
        ...orders?.object?.find(order => order.key === drugKey),
        saveDraft: false
      }).then(() => {
        dispatch(notify({ msg: 'Draft Cancelled', sev: 'info' }));
        setIsDraft(false);
      });
    } catch (error) {}
  };

  const joinValuesFromArray = values => {
    return values.filter(Boolean).join(', ');
  };

  const handleSaveOrder = async () => {
    handleCleare();

    if (patient && encounter) {
      try {
        const response = await saveDrugorder({
          ...newApDrugOrder,
          patientKey: patient.key,
          visitKey: encounter.key,
          statusLkey: '164797574082125',
          saveDraft: true
        });

        dispatch(notify('Start New Order whith ID:' + response?.data?.drugorderId));

        setDrugKey(response?.data?.key);
        setIsDraft(true);
        ordRefetch()
          .then(() => {})
          .catch(error => {
            console.error('Refetch failed:', error);
          });
      } catch (error) {
        console.error('Error saving order:', error);
      }
    } else {
      dispatch(
        notify({ mag: 'Patient or encounter is missing. Cannot save order.', sev: 'warning' })
      );
    }
  };
  const handleCancle = async () => {
    try {
      await Promise.all(
        selectedRows.map(item =>
          saveDrugorderMedication({
            ...item,
            isValid: false,
            statusLkey: '1804447528780744',
            deletedAt: Date.now(),
            cancellationReason: reson.cancellationReason
          }).unwrap()
        )
      );

      dispatch(notify({ msg: 'All medication deleted successfully', sev: 'success' }));
      CloseCancellationReasonModel();
      medicRefetch()
        .then(() => {
          console.log('Refetch complete');
        })
        .catch(error => {
          console.error('Refetch failed:', error);
        });
    } catch (error) {
      dispatch(notify({ msg: ' deleted failed', sev: 'error' }));
    }
  };
  const handleSubmitPres = async () => {
    try {
      await saveDrugorder({
        ...orders?.object?.find(order => order.key === drugKey),

        statusLkey: '1804482322306061',
        saveDraft: false,
        submittedAt: Date.now()
      }).unwrap();

      dispatch(notify({ msg: 'Submetid  Successfully', sev: 'success' }));
      await handleCleare();
      await ordRefetch();
      setOrder({ ...newApDrugOrder });
      setDrugKey(null);
    } catch (error) {
      dispatch(notify({ msg: 'Error saving order or medications', sev: 'error' }));
    }

    orderMedications?.object?.map(item => {
      saveDrugorderMedication({ ...item, statusLkey: '1804482322306061' });
    });
    medicRefetch()
      .then(() => {
        console.log('Refetch complete');
      })
      .catch(error => {
        console.error('Refetch failed:', error);
      });
  };

  const handleCheckboxChangeRow = rowData => {
    setSelectedRows(prev => {
      let newSelected;
      if (prev.includes(rowData)) {
        newSelected = prev.filter(item => item !== rowData);
        setShowPreview(false);
      } else {
        newSelected = [...prev, rowData];
        setOrderMedication(rowData);
        setShowPreview(true);
      }
      return newSelected;
    });
  };

  const handleCleare = () => {
    setOrderMedication({
      ...newApDrugOrderMedications,
      durationTypeLkey: null,
      administrationInstructions: null,
      startDateTime: null,
      genericSubstitute: false,
      chronicMedication: false,
      patientOwnMedication: false,
      priorityLkey: null,
      roaLkey: null,
      doseUnitLkey: null,
      drugOrderTypeLkey: null,
      indicationUseLkey: null,
      pharmacyDepartmentKey: null
    });
    setSelectedGeneric(null);
  };

  const CloseCancellationReasonModel = () => {
    setOpenCancellationReasonModel(false);
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
            onChange={() => handleCheckboxChangeRow(rowData)}
            disabled={rowData.statusLvalue?.lovDisplayVale !== 'New'}
          />
        );
      }
    },
    {
      key: 'medicationName',
      dataKey: 'genericMedicationsKey',
      title: 'Medication Name',
      flexGrow: 2,
      render: (rowData: any) => {
        return genericMedicationListResponse?.object?.find(
          item => item.key === rowData.genericMedicationsKey
        )?.genericName;
      }
    },
    {
      key: 'drugOrderType',
      dataKey: 'drugOrderTypeLkey',
      title: 'medication Order Type',
      flexGrow: 1,
      render: (rowData: any) => {
        return rowData.drugOrderTypeLvalue
          ? rowData.drugOrderTypeLvalue?.lovDisplayVale
          : rowData.drugOrderTypeLkey;
      }
    },
    {
      key: 'instruction',
      dataKey: '',
      title: 'Instruction',
      flexGrow: 2,
      render: (rowData: any) => {
        return joinValuesFromArray([
          rowData.dose,
          rowData.doseUnitLvalue?.lovDisplayVale,
          rowData.drugOrderTypeLkey == '2937757567806213'
            ? 'STAT'
            : 'every ' + rowData.frequency + ' hours',
          rowData.roaLvalue?.lovDisplayVale
        ]);
      }
    },
    {
      key: 'startDateTime',
      dataKey: 'startDateTime',
      title: 'Start Date Time',
      flexGrow: 2,
      render: (rowData: any) => {
        return formatDateWithoutSeconds(rowData.startDateTime);
      }
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
      key: 'priorityLevel',
      dataKey: 'priorityLkey',
      title: 'Priority Level',
      flexGrow: 2,
      render: (rowData: any) => {
        return rowData.priorityLvalue
          ? rowData.priorityLvalue?.lovDisplayVale
          : rowData.priorityLkey;
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
      title: <Translate>actions</Translate>,
      flexGrow: 1,
      render: rowData => {
        const drugOrderTypeValue = rowData?.drugOrderTypeLvalue?.lovDisplayVale;
        const isInFavorites = favoriteMedications.some(
          item => item.genericMedicationsKey === rowData.genericMedicationsKey
        );
        return (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <MdModeEdit
              title="Edit"
              size={24}
              className="font-aws"
              onClick={() => {
                setOpenToAdd(false);
                setOpenDetailsModel(true);
              }}
            />

            <FontAwesomeIcon
              icon={faStar}
              onClick={() => addToFavorites(rowData)}
              className={isInFavorites ? 'font-awsy' : 'font-aws'}
              title={isInFavorites ? 'Remove from favorites' : 'Add to favorites'}
            />
            {drugOrderTypeValue === 'Continuous' && (
              <FaSyringe
                title="Use Diluent"
                size={24}
                className="font-aws"
                onClick={() => setOpenAddEditFluidOrderPopup(true)}
              />
            )}
          </div>
        );
      }
    },
    {
      key: 'attachments',
      title: <Translate>Attachments</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return (
          <MdAttachFile
            size={20}
            fill={rowData?.key ? "var(--primary-gray)" : "#ccc"}
            onClick={() => {
              if (rowData?.key) {
                setSelectedMedicationForAttachments(rowData);
                setAttachmentsModalOpen(true);
              }
            }}
            style={{ cursor: rowData?.key ? 'pointer' : 'not-allowed' }}
            title="View Attachments"
          />
        );
      }
    },

    {
      key: 'createdAt',
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
      key: 'updatedAt',
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
      key: 'deletedAt',
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
    },
    {
      key: 'cancellationReason',
      dataKey: 'cancellationReason',
      title: 'Cancellation Reason',
      flexGrow: 2,
      expandable: true,
      render: (rowData: any) => {
        return rowData.cancellationReason;
      }
    }
  ];
  const pageIndex = listRequest.pageNumber - 1;

  // how many rows per page:
  const rowsPerPage = listRequest.pageSize;

  // total number of items in the backend:
  const totalCount = orderMedications?.extraNumeric ?? 0;

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
  const handleRecall = rowData => {
    const genericMedication = genericMedicationListResponse?.object?.find(
      item => item.key === rowData.genericMedicationsKey
    );

    setOrderMedication({
      ...newApDrugOrderMedications,
      ...rowData,
      drugOrderKey: drugKey,
      genericName: genericMedication?.genericName || '',
      dose: rowData.dose || null,
      doseUnitLkey: rowData.doseUnitLkey || null,
      frequency: rowData.frequency || null,
      roaLkey: rowData.roaLkey || null,
      chronicMedication: rowData.chronicMedication || false,
      priorityLkey: rowData.priorityLkey || null,
      durationTypeLkey: rowData.durationTypeLkey || null,
      indicationUseLkey: rowData.indicationUseLkey || null,
      pharmacyDepartmentKey: rowData.pharmacyDepartmentKey || null
    });

    setSelectedGeneric(genericMedication || null);
    setOpenFavoritesModal(false);
    setOpenDetailsModel(true);
    setOpenToAdd(true);
  };

  return (
    <>
      <div className="bt-div">
        <div style={{ width: '500px' }}>
          <SelectPicker
            className="fill-width"
            data={filteredorders ?? []}
            labelKey="drugorderId"
            valueKey="key"
            placeholder="orders"
            // value={selectedDiagnose.diagnoseCode}
            onChange={e => {
              setDrugKey(e);
            }}
          />
        </div>
        <div className="icon-style">
          <FaPills size={18} />
        </div>
        <div>
          <div className="prescripton-word-style">Order</div>
          <div className="prescripton-number-style">{order?.drugorderId || '_'}</div>
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
            />
          </Form>
          <UrgencyButton />
          <MyButton>Validate With</MyButton>
          <MyButton onClick={() => setOpenFavoritesModal(true)}>Recall Favorite</MyButton>
          <MyButton
            prefixIcon={() => <PlusIcon />}
            onClick={async () => {
              try {
                if (!order.key) {
                  await handleSaveOrder();
                }

                handleCleare();
                setOpenDetailsModel(true);
              } catch (error) {
                dispatch(notify({ msg: 'Failed to complete actions', type: 'error' }));
              }
            }}
          >
            Add Medication
          </MyButton>
          <MyButton
            prefixIcon={() => <BlockIcon />}
            onClick={() => setOpenCancellationReasonModel(true)}
            disabled={orderMedication.statusLvalue?.lovDisplayVale !== 'New'}
          >
            <Translate>Cancel</Translate>
          </MyButton>
          <MyButton
            prefixIcon={() => <CheckIcon />}
            onClick={handleSubmitPres}
            disabled={
              drugKey
                ? orders?.object?.find(order => order.key === drugKey)?.statusLkey ===
                  '1804482322306061'
                : true
            }
          >
            Sign & Submit Order
          </MyButton>
        </div>
      </div>

      <Divider />

      <div className="mid-container-p ">
        <div className="bt-div">
          <div className="bt-right">
            <Checkbox
              checked={!showCanceled}
              onChange={() => {
                setShowCanceled(!showCanceled);
              }}
            >
              Show canceled orders
            </Checkbox>
          </div>
        </div>
        <div ref={tableContainerRef}>
          <MyTable
            columns={tableColumns}
            data={orderMedications?.object || []}
            loading={fetchingOrderMed}
            onRowClick={rowData => {
              setOrderMedication(rowData);
              setEditing(rowData.statusLkey == '3196709905099521' ? true : false);
              setOpenToAdd(false);
              setSelectedGeneric(
                genericMedicationListResponse?.object?.find(
                  item => item.key === rowData.genericMedicationsKey
                )
              );
              setShowPreview(true);
            }}
            rowClassName={isSelected}
            page={pageIndex}
            rowsPerPage={rowsPerPage}
            totalCount={totalCount}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </div>

        <CancellationModal
          open={openCancellationReasonModel}
          setOpen={setOpenCancellationReasonModel}
          handleCancle={handleCancle}
          object={reson}
          setObject={setReson}
          fieldName="cancellationReason"
          fieldLabel={'Cancellation Reason'}
          title={'Cancellation'}
        />

        <DetailsModal
          edit={edit}
          open={openDetailsModel}
          setOpen={setOpenDetailsModel}
          orderMedication={orderMedication}
          setOrderMedication={setOrderMedication}
          drugKey={drugKey}
          editing={editing}
          patient={patient}
          encounter={encounter}
          medicRefetch={medicRefetch}
          openToAdd={openToAdd}
          isFavorite={isFavorite}
        />

        {showPreview && orderMedication && orderTypeLovQueryResponse && (
          <DrugOrderPreview
            orderMedication={orderMedication}
            fluidOrder={fluidOrder}
            genericMedicationListResponse={genericMedicationListResponse}
            orderTypeLovQueryResponse={orderTypeLovQueryResponse}
            unitLovQueryResponse={unitLovQueryResponse}
            unitsLovQueryResponse={unitsLovQueryResponse}
            DurationTypeLovQueryResponse={DurationTypeLovQueryResponse}
            filteredList={filteredList}
            indicationLovQueryResponse={indicationLovQueryResponse}
            administrationInstructionsLovQueryResponse={administrationInstructionsLovQueryResponse}
            routeLovQueryResponse={routeLovQueryResponse}
            frequencyLovQueryResponse={frequencyLovQueryResponse}
            infusionDeviceLovQueryResponse={infusionDeviceLovQueryResponse}
          />
        )}

        <AddEditFluidOrder
          open={openAddEditFluidOrderPopup}
          setOpen={setOpenAddEditFluidOrderPopup}
          width={width}
          fluidOrder={fluidOrder}
          setFluidOrder={setFluidOrder}
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
                      return joinValuesFromArray([
                        rowData.dose,
                        rowData.doseUnitLvalue?.lovDisplayVale,
                        rowData.drugOrderTypeLkey == '2937757567806213'
                          ? 'STAT'
                          : 'every ' + rowData.frequency + ' hours',
                        rowData.roaLvalue?.lovDisplayVale
                      ]);
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
                        const instruction =
                          administrationInstructionsLovQueryResponse?.object?.find(
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
                    render: (rowData: any) => {
                      return (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <MyButton size="xs" onClick={() => handleRecall(rowData)}>
                            Recall
                          </MyButton>
                          <FontAwesomeIcon
                            icon={faStar}
                            onClick={() => addToFavorites(rowData)}
                            style={{
                              cursor: 'pointer',
                              color: '#ffc107'
                            }}
                            title="Remove from favorites"
                          />
                        </div>
                      );
                    }
                  }
                ]}
                data={favoriteMedications || []}
              />
            </div>
          }
        />

        {/* Attachments Modal */}
        <MyModal
          open={attachmentsModalOpen}
          setOpen={setAttachmentsModalOpen}
          title={`Attachments - ${selectedMedicationForAttachments ? genericMedicationListResponse?.object?.find(
            item => item.key === selectedMedicationForAttachments.genericMedicationsKey
          )?.genericName || 'Medication' : 'Medication'}`}
          size="lg"
          hideActionBtn={true}
          content={
            <EncounterAttachment
              localEncounter={encounter}
              source="MEDICATION_ORDER_ATTACHMENT"
              sourceId={selectedMedicationForAttachments?.key ? Number(selectedMedicationForAttachments.key) : undefined}
              refetchAttachmentList={false}
              setRefetchAttachmentList={() => {}}
            />
          }
        />
      </div>
      <AllergyFloatingButton patientKey={patient.key} />
    </>
  );
};
export default DrugOrder;
