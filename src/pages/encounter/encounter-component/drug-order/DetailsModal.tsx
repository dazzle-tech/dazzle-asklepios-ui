import AdvancedModal from '@/components/AdvancedModal';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import CheckIcon from '@rsuite/icons/Check';
import { useAppDispatch } from '@/hooks';
import { useSaveDrugOrderMedicationMutation } from '@/services/encounterService';
import { useGetGenericMedicationWithActiveIngredientQuery } from '@/services/medicationsSetupService';
import { useGetDepartmentsQuery, useGetIcdListQuery } from '@/services/setupService';
import { newApDrugOrderMedications } from '@/types/model-types-constructor';
import { initialListRequest, ListRequest } from '@/types/types';
import { notify } from '@/utils/uiReducerActions';
import { faRightLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import SearchIcon from '@rsuite/icons/Search';
import React, { useEffect, useState } from 'react';
import { Col, Dropdown, Form, Input, InputGroup, Row, Text } from 'rsuite';
import ActiveIngrediantList from './ActiveIngredient';
import './styles.less';
import Substitues from './Substitutes';
import clsx from 'clsx';
import DiagnosticsOrder from '../diagnostics-order';
import MyModal from '@/components/MyModal/MyModal';
import { PlusRound } from '@rsuite/icons';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyTable from '@/components/MyTable';
import { faStar } from '@fortawesome/free-solid-svg-icons';

const DetailsModal = ({
  edit,
  open,
  setOpen,
  orderMedication,
  setOrderMedication,

  drugKey,
  editing,
  patient,
  encounter,
  medicRefetch,
  openToAdd,
  isFavorite
}) => {
  const dispatch = useAppDispatch();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchKeywordicd, setSearchKeywordicd] = useState('');
  const [openOrderModel, setOpenOrderModel] = useState(false);
  const [tags, setTags] = React.useState([]);
  const [indicationsIcd, setIndicationsIcd] = useState({ indicationIcd: null });
  const [openSubstitutesModel, setOpenSubstitutesModel] = useState(false);
  const [selectedGeneric, setSelectedGeneric] = useState(null);
  const [selectedFirstDate, setSelectedFirstDate] = useState(null);
  const [filteredList, setFilteredList] = useState([]);
  const [adminInstructions, setAdminInstructions] = useState('');
  const [editDuration, setEditDuration] = useState(false);
  const [slectInst, setSelectInt] = useState({ inst: null });
  const [instructionList, setInstructionList] = useState([]);
  const [instr, setInstruc] = useState(null);
  const [indicationsDescription, setindicationsDescription] = useState<string>('');
  const [adminDescription, setAdminDescription] = useState<string>('');
  const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
  const [favoriteMedications, setFavoriteMedications] = useState([]);
  const MedicalTestsTable = () => {
    return (
      <div className="medical-tests-container">
        <h4 className="medical-tests-title">Pre-requested Tests</h4>
        <table className="medical-tests-table">
          <thead>
            <tr>
              <th className="column-type">TYPE</th>
              <th className="column-name">NAME</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="column-type">Laboratory</td>
              <td className="column-name">ALT/SGPT</td>
            </tr>
            <tr>
              <td className="column-type">Laboratory</td>
              <td className="column-name">TPHA Screening Test</td>
            </tr>
            <tr>
              <td className="column-type">Laboratory</td>
              <td className="column-name">Urinalysis (Routine)</td>
            </tr>
            <tr>
              <td className="column-type">Radiology</td>
              <td className="column-name">Ultrasound - Kidney, Ureter, Bladder (KUB)</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  interface FluidOrder {
    untilCompleted?: boolean;
    fluidType?: string;
    volume?: number;
    route?: string;
    infusionRate?: number;
    frequency?: string;
    duration?: number;
    concentration?: string;
    startTime?: string;
    estimatedEndTime?: string;
    infusionDevice?: string;
    priority?: string;
    notesToNurse?: string;
    allergiesChecked?: boolean;
  }

  // In your component:
  const [fluidOrder, setFluidOrder] = useState<FluidOrder>({});
  const { data: roaLovQueryResponse } = useGetLovValuesByCodeQuery('MED_ROA');
  const { data: genericMedicationListResponse } =
    useGetGenericMedicationWithActiveIngredientQuery(searchKeyword);
  console.log('genericMedicationListResponse', genericMedicationListResponse?.object);
  const { data: administrationInstructionsLovQueryResponse } = useGetLovValuesByCodeQuery(
    'MED_ORDER_ADMIN_NSTRUCTIONS'
  );

  const { data: orderTypeLovQueryResponse } = useGetLovValuesByCodeQuery('MEDCATION_ORDER_TYPE');
  const { data: priorityLevelLovQueryResponse } = useGetLovValuesByCodeQuery('ORDER_PRIORITY');
  const { data: indicationLovQueryResponse } = useGetLovValuesByCodeQuery('MED_INDICATION_USE');
  const { data: unitLovQueryResponse } = useGetLovValuesByCodeQuery('UOM');
  const { data: DurationTypeLovQueryResponse } = useGetLovValuesByCodeQuery('MED_DURATION');
  const [saveDrugorderMedication, saveDrugorderMedicationMutation] =
    useSaveDrugOrderMedicationMutation();
  const [icdListRequest, setIcdListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      }
    ]
  });
  const { data: departmentListResponse } = useGetDepartmentsQuery({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'department_type_lkey',
        operator: 'match',
        value: '5673990729647012'
      }
    ]
  });
  const { data: icdListResponseLoading } = useGetIcdListQuery(icdListRequest);
  const modifiedData = (icdListResponseLoading?.object ?? []).map(item => ({
    ...item,
    combinedLabel: `${item.icdCode} - ${item.description}`
  }));
  // Fetch route Lov response
  const { data: routeLovQueryResponse } = useGetLovValuesByCodeQuery('FLUID_ROUTE');
  // Fetch frequency Lov response
  const { data: frequencyLovQueryResponse } = useGetLovValuesByCodeQuery('IV_FREQUENCY');
  // Fetch infusion Device Lov response
  const { data: infusionDeviceLovQueryResponse } = useGetLovValuesByCodeQuery('INFUSION_DEVICE');
  // Fetch priority Lov response
  const { data: priorityLovQueryResponse } = useGetLovValuesByCodeQuery('ORDER_PRIORITY');

  useEffect(() => {
    if (orderMedication.key != null) {
      setSelectedGeneric(
        genericMedicationListResponse?.object?.find(
          item => item.key === orderMedication.genericMedicationsKey
        )
      );
      const prevadmin = orderMedication.administrationInstructions?.split(',');
      setInstructionList(prevadmin);
      setAdminInstructions(orderMedication.administrationInstructions);
      setTags(orderMedication?.parametersToMonitor?.split(','));
    }
  }, [orderMedication]);

  useEffect(() => {
    setInstruc(joinValuesFromArray(instructionList));
  }, [instructionList]);

  useEffect(() => {
    if (slectInst?.inst != null) {
      const foundItem = administrationInstructionsLovQueryResponse?.object?.find(
        item => item.key === slectInst?.inst
      );

      const value = foundItem?.lovDisplayVale;

      if (value) {
        setInstructionList(prev => [...prev, foundItem?.lovDisplayVale]);
      } else {
        console.warn('⚠️ Could not find display value for key:', slectInst.inst);
      }
    }
  }, [slectInst?.inst]);
  useEffect(() => {
    if (drugKey == null) {
      handleCleare();
    }
  }, [drugKey]);

  //when close modal clear
  useEffect(() => {
    if (open == false) {
      handleCleare();
    }
  }, [open]);
  // cleare when open modal to add new medication
  useEffect(() => {
    if (openToAdd) {
      handleCleare();
    }
  }, [openToAdd]);
  useEffect(() => {
    if (searchKeywordicd.trim() !== '') {
      setIcdListRequest({
        ...initialListRequest,
        filterLogic: 'or',
        filters: [
          {
            fieldName: 'icd_code',
            operator: 'containsIgnoreCase',
            value: searchKeywordicd
          },
          {
            fieldName: 'description',
            operator: 'containsIgnoreCase',
            value: searchKeywordicd
          }
        ]
      });
    }
  }, [searchKeywordicd]);
  useEffect(() => {
    setEditDuration(orderMedication.chronicMedication);
    setOrderMedication({ ...orderMedication, duration: null, durationTypeLkey: null });
  }, [orderMedication.chronicMedication]);

  useEffect(() => {
    if (indicationsIcd.indicationIcd != null || indicationsIcd.indicationIcd != '') {
      setindicationsDescription(prevadminInstructions => {
        const currentIcd = icdListResponseLoading?.object?.find(
          item => item.key === indicationsIcd.indicationIcd
        );

        if (!currentIcd) return prevadminInstructions;

        const newEntry = `${currentIcd.icdCode}, ${currentIcd.description}.`;

        return prevadminInstructions ? `${prevadminInstructions}\n${newEntry}` : newEntry;
      });
    }
  }, [indicationsIcd.indicationIcd]);

  useEffect(() => {
    if (orderMedication.administrationInstructions != null) {
      setAdminInstructions(prevadminInstructions =>
        prevadminInstructions
          ? `${prevadminInstructions}, ${
              administrationInstructionsLovQueryResponse?.object?.find(
                item => item.key === orderMedication.administrationInstructions
              )?.lovDisplayVale
            }`
          : administrationInstructionsLovQueryResponse?.object?.find(
              item => item.key === orderMedication.administrationInstructions
            )?.lovDisplayVale
      );
    }

    setOrderMedication({ ...orderMedication, administrationInstructions: null });
  }, [orderMedication.administrationInstructions]);
  useEffect(() => {
    setEditDuration(orderMedication.chronicMedication);
    setOrderMedication({ ...orderMedication, duration: null, durationTypeLkey: null });
  }, [orderMedication.chronicMedication]);

  const handleCleare = () => {
    setOrderMedication({
      ...newApDrugOrderMedications,
      durationTypeLkey: null,
      administrationInstructions: null,
      startDateTime: null,
      genericSubstitute: false,
      chronic: false,
      homeMed: false,
      substituteAllowed: false,
      patientOwnMedication: false,
      priorityLkey: null,
      roaLkey: null,
      doseUnitLkey: null,
      drugOrderTypeLkey: null,
      indicationUseLkey: null,
      pharmacyDepartmentKey: null
    });
    setAdminInstructions('');
    setSelectedGeneric(null);
    setSelectedFirstDate(null);
    setindicationsDescription('');
    setSearchKeyword('');
    setTags([]);
  };
  const handleSaveMedication = () => {
    try {
      const tagcompine = joinValuesFromArray(tags);
      saveDrugorderMedication({
        ...orderMedication,
        patientKey: patient.key,
        visitKey: encounter.key,
        drugOrderKey: drugKey,
        genericMedicationsKey: selectedGeneric.key,
        parametersToMonitor: tagcompine,
        statusLkey: '164797574082125',
        startDateTime: orderMedication.startDateTime
          ? new Date(orderMedication?.startDateTime)?.getTime()
          : null,
        indicationIcd: indicationsDescription,
        administrationInstructions: instr
      })
        .unwrap()
        .then(() => {
          dispatch(notify({ msg: 'Added sucssesfily', sev: 'success' }));
          setOpen(false);
          handleCleare();
          medicRefetch();
        });
    } catch (error) {
      dispatch(notify({ msg: 'Added feild', sev: 'error' }));
      console.log(error);
    }
  };
  const handleSearch = value => {
    setSearchKeyword(value);
  };
  const handleItemClick = Generic => {
    setSelectedGeneric(Generic);
    setSearchKeyword('');
    const newList = roaLovQueryResponse.object.filter(item => Generic.roaList?.includes(item.key));
    setFilteredList(newList);
  };
  const handleSearchIcd = value => {
    setSearchKeywordicd(value);
  };
  // handle add new attachment
  const handleAddNewAttachment = () => {
    setAttachmentsModalOpen(true);
  };
  const joinValuesFromArray = values => {
    return values?.filter(Boolean).join(', ');
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
  return (
    <>
      <AdvancedModal
        open={open}
        setOpen={setOpen}
        actionButtonFunction={handleSaveMedication}
        actionButtonLabel="Save"
        size="100vw"
        isDisabledActionBtn={
          edit
            ? true
            : orderMedication.key
            ? orderMedication?.statusLvalue?.valueCode !== ' DIAG_ORDER_STAT_NEW'
            : false
        }
        leftTitle={selectedGeneric ? selectedGeneric.genericName : 'Select Generic'}
        rightTitle="Medication Order Details"
        leftContent={
          <>
            <div className="left-content-wrapper">
              <ActiveIngrediantList selectedGeneric={selectedGeneric} />
              <MedicalTestsTable />
            </div>
          </>
        }
        footerButtons={
          <div className="footer-buttons">
            <MyButton
              appearance="ghost"
              onClick={() => {
                setOpenOrderModel(true);
              }}
              prefixIcon={() => <CheckIcon />}
            >
              Order Related Tests
            </MyButton>
          </div>
        }
        rightContent={
          <Form fluid>
            <Row
              gutter={20}
              className={clsx({
                'disabled-panel':
                  !isFavorite &&
                  (edit ||
                    (orderMedication?.key &&
                      orderMedication?.statusLvalue?.valueCode !== 'DIAG_ORDER_STAT_NEW'))
              })}
            >
              <Col>
                <Row className="rows-gap borderr">
                  <Row>
                    <Col md={6} style={{ marginTop: '12px' }}>
                      <InputGroup inside className="input-search-p">
                        <Input
                          placeholder={'Medication Name'}
                          value={searchKeyword}
                          onChange={handleSearch}
                        />
                        <InputGroup.Button>
                          <SearchIcon />
                        </InputGroup.Button>
                      </InputGroup>
                      {searchKeyword && (
                        <Dropdown.Menu className="dropdown-menuresult">
                          {genericMedicationListResponse?.object?.map(Generic => (
                            <Dropdown.Item
                              key={Generic.key}
                              eventKey={Generic.key}
                              onClick={() => handleItemClick(Generic)}
                            >
                              <div style={{ lineHeight: '1.4' }}>
                                <div style={{ fontWeight: 'bold' }}>
                                  {Generic.genericName}{' '}
                                  {Generic.dosageFormLvalue?.lovDisplayVale &&
                                    `(${Generic.dosageFormLvalue?.lovDisplayVale})`}
                                </div>
                                <div style={{ fontSize: '0.85em', color: '#555' }}>
                                  {Generic.manufacturerLvalue?.lovDisplayVale}{' '}
                                  {Generic.roaLvalue?.lovDisplayVale &&
                                    `| ${Generic.roaLvalue?.lovDisplayVale}`}
                                </div>
                                <div style={{ fontSize: '0.8em', color: '#888' }}>
                                  {Generic.activeIngredients}
                                </div>
                              </div>
                            </Dropdown.Item>
                          ))}
                        </Dropdown.Menu>
                      )}
                    </Col>
                    <Col md={2}>
                      <MyButton
                        style={{ marginTop: '14px' }}
                        radius={'25px'}
                        appearance="ghost"
                        color="#808099"
                        onClick={() => {
                          setOpenSubstitutesModel(true);
                        }}
                        prefixIcon={() => <FontAwesomeIcon icon={faRightLeft} />}
                      ></MyButton>
                    </Col>
                    <Col md={4}>
                      <MyInput
                        width="100%"
                        fieldType="datetime"
                        fieldName="startDateTime"
                        record={orderMedication}
                        setRecord={setOrderMedication}
                      />
                    </Col>
                    <Col md={4}>
                      <MyInput
                        width="100%"
                        fieldType="datetime"
                        fieldName="startDateTime"
                        record={orderMedication}
                        setRecord={setOrderMedication}
                      />
                    </Col>
                    <Col md={4}>
                      <MyInput
                        width="100%"
                        fieldType="select"
                        fieldLabel="Drug Order Type"
                        selectData={orderTypeLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        fieldName={'drugOrderTypeLkey'}
                        record={orderMedication}
                        setRecord={setOrderMedication}
                        searchable={false}
                      />
                    </Col>
                    <Col md={4} style={{ marginTop: '22px' }}>
                      <MyButton>Titration Plan</MyButton>
                    </Col>
                  </Row>
                  <Row className="rows-gap">
                    <Col md={2}>
                      <MyInput
                        width="100%"
                        fieldType="number"
                        fieldName={'dose'}
                        record={orderMedication}
                        setRecord={setOrderMedication}
                      />
                    </Col>
                    <Col md={3}>
                      {' '}
                      <MyInput
                        width="100%"
                        fieldType="select"
                        fieldLabel="Unit"
                        selectData={unitLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        fieldName={'doseUnitLkey'}
                        record={orderMedication}
                        setRecord={setOrderMedication}
                      />
                    </Col>
                    <Col md={2}>
                      {' '}
                      <MyInput
                        width="100%"
                        disabled={drugKey != null ? editing : true}
                        fieldLabel="Frequency"
                        fieldType="number"
                        fieldName={'frequency'}
                        record={orderMedication}
                        setRecord={setOrderMedication}
                        rightAddon="Hr"
                      />
                    </Col>
                    <Col md={3}>
                      {' '}
                      <MyInput
                        width="100%"
                        fieldType="select"
                        fieldLabel="Unit"
                        selectData={unitLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        fieldName={'doseUnitLkey'}
                        record={orderMedication}
                        setRecord={setOrderMedication}
                      />
                    </Col>
                    <Col md={2}>
                      {' '}
                      <MyInput
                        width="100%"
                        fieldType="select"
                        fieldLabel="ROA"
                        selectData={filteredList ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        fieldName={'roaLkey'}
                        record={orderMedication}
                        setRecord={setOrderMedication}
                      />
                    </Col>
                    <Col md={2}>
                      {' '}
                      <MyInput
                        disabled={editDuration}
                        fieldType="number"
                        fieldLabel="Duration"
                        fieldName={'duration'}
                        width="100%"
                        record={orderMedication}
                        setRecord={setOrderMedication}
                      />
                    </Col>
                    <Col md={3}>
                      {' '}
                      <MyInput
                        width="100%"
                        disabled={editDuration}
                        fieldType="select"
                        fieldLabel="Duration type"
                        selectData={DurationTypeLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        fieldName={'durationTypeLkey'}
                        record={orderMedication}
                        setRecord={setOrderMedication}
                        searchable={false}
                      />
                    </Col>
                    <Col md={2}>
                      {' '}
                      <MyInput
                        fieldLabel="Chronic"
                        fieldType="checkbox"
                        fieldName="chronicMedication"
                        record={orderMedication}
                        setRecord={setOrderMedication}
                      />
                    </Col>
                    <Col md={2}>
                      {' '}
                      <MyInput
                        fieldLabel="Home Med"
                        fieldType="checkbox"
                        fieldName="homeMed"
                        record={orderMedication}
                        setRecord={setOrderMedication}
                      />
                    </Col>
                    <Col md={3}>
                      {' '}
                      <MyInput
                        fieldLabel="Substitute Allowed"
                        fieldType="checkbox"
                        fieldName="substituteAllowed"
                        record={orderMedication}
                        setRecord={setOrderMedication}
                      />
                    </Col>
                  </Row>
                </Row>
                {/* <Row className="rows-gap">
                  <Col md={8}>
                    {orderMedication.drugOrderTypeLkey == '2937712448460454' ? (
                      <MyInput
                        width="100%"
                        fieldLabel="PRN Indication"
                        fieldName={'prnIndication'}
                        record={orderMedication}
                        setRecord={setOrderMedication}
                      />
                    ) : (
                      ''
                    )}
                  </Col>
                </Row> */}
                <Row className="rows-gap borderr">
                  <Row className="rows-gap">
                    <Text className="font-style">Indication</Text>
                  </Row>
                  <Row>
                    <Col md={6} style={{ marginTop: '18px' }}>
                      {' '}
                      <InputGroup inside>
                        <Input
                          placeholder="Search ICD-10"
                          value={searchKeywordicd}
                          onChange={handleSearchIcd}
                        />
                        <InputGroup.Button>
                          <SearchIcon />
                        </InputGroup.Button>
                      </InputGroup>
                      {searchKeywordicd && (
                        <Dropdown.Menu className="dropdown-menuresult">
                          {modifiedData?.map(mod => (
                            <Dropdown.Item
                              key={mod.key}
                              eventKey={mod.key}
                              onClick={() => {
                                setIndicationsIcd({
                                  ...indicationsIcd,
                                  indicationIcd: mod.key
                                });
                                setSearchKeywordicd('');
                              }}
                            >
                              {mod.icdCode} {' - '} {mod.description}
                            </Dropdown.Item>
                          ))}
                        </Dropdown.Menu>
                      )}
                    </Col>
                    <Col md={6} style={{ marginTop: '18px' }}>
                      {' '}
                      <InputGroup>
                        <Input
                          disabled={drugKey != null ? editing : true}
                          placeholder="Search SNOMED-CT"
                          value={''}
                        />
                        <InputGroup.Button>
                          <SearchIcon />
                        </InputGroup.Button>
                      </InputGroup>
                    </Col>
                    <Col md={6}>
                      <MyInput
                        width="100%"
                        fieldType="select"
                        fieldLabel="Indication Use"
                        selectData={indicationLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        fieldName={'indicationUseLkey'}
                        record={orderMedication}
                        setRecord={setOrderMedication}
                        searchable={false}
                      />
                    </Col>
                    <Col md={6}>
                      <MyInput
                        width="100%"
                        fieldType="select"
                        fieldLabel="Administration Instructions"
                        selectData={administrationInstructionsLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        fieldName={'inst'}
                        record={slectInst}
                        setRecord={setSelectInt}
                      />
                    </Col>
                  </Row>
                  <Row className="rows-gap">
                    {/*  */}
                    <Col md={6}>
                      {' '}
                      <Input
                        as="textarea"
                        disabled={true}
                        onChange={value => setAdminDescription(value)}
                        value={adminDescription || orderMedication.indicationIcd}
                        rows={3}
                      />
                    </Col>
                    {/*  */}
                    <Col md={6}>
                      {' '}
                      <Input
                        as="textarea"
                        disabled={true}
                        onChange={value => setindicationsDescription(value)}
                        value={indicationsDescription || orderMedication.indicationIcd}
                        rows={3}
                      />
                    </Col>
                    {/*  */}
                    <Col md={6}>
                      <Input as="textarea" disabled={true} rows={3} />
                    </Col>
                    {/*  */}
                    <Col md={6}>
                      <Input
                        as="textarea"
                        onChange={e => setInstruc(e.target.value)}
                        value={instr}
                        rows={3}
                      />
                    </Col>
                  </Row>
                </Row>
                <Row className="rows-gap borderr">
                  {/* Notes + Buttons */}
                  <Col md={6}>
                    <MyInput
                      disabled={drugKey != null ? editing : true}
                      height={90}
                      fieldType="textarea"
                      fieldName={'notes'}
                      record={orderMedication}
                      setRecord={setOrderMedication}
                      width={220}
                    />

                    <Row className="mt-2" gutter={10}>
                      <Col>
                        <MyButton onClick={handleAddNewAttachment} prefixIcon={() => <PlusRound />}>
                          New Attachment
                        </MyButton>
                      </Col>
                      <Col>
                        <MyButton>Download</MyButton>
                      </Col>
                    </Row>
                  </Col>

                  {/* Diluent + Fluid Order */}
                  <Col md={18}>
                    <Row className="align-center mb-2">
                      <Col md={3}>
                        <MyInput
                          fieldLabel="Diluent"
                          fieldType="checkbox"
                          fieldName="diluent"
                          record={orderMedication}
                          setRecord={setOrderMedication}
                          onChange={value => {
                            setOrderMedication({ ...orderMedication, diluent: value });
                            if (!value) {
                              setFluidOrder({});
                            }
                          }}
                        />
                      </Col>
                    </Row>

                    {/* Row 1 */}
                    <Row gutter={16} className="mb-2">
                      <Col md={6}>
                        <MyInput
                          width="100%"
                          selectData={[]}
                          selectDataLabel=""
                          selectDataValue=""
                          fieldType="select"
                          fieldName="fluidType"
                          fieldLabel="Fluid Type"
                          record={fluidOrder}
                          setRecord={setFluidOrder}
                          menuMaxHeight={200}
                          disabled={!orderMedication.diluent}
                        />
                      </Col>
                      <Col md={6}>
                        <MyInput
                          width="100%"
                          fieldType="number"
                          rightAddon="ml"
                          fieldName="volume"
                          fieldLabel="Volume"
                          record={fluidOrder}
                          setRecord={setFluidOrder}
                          disabled={!orderMedication.diluent}
                        />
                      </Col>
                      <Col md={6}>
                        <MyInput
                          width="100%"
                          selectData={infusionDeviceLovQueryResponse?.object ?? []}
                          selectDataLabel="lovDisplayVale"
                          selectDataValue="key"
                          fieldType="select"
                          fieldName="infusionDevice"
                          fieldLabel="Infusion Device"
                          record={fluidOrder}
                          setRecord={setFluidOrder}
                          menuMaxHeight={200}
                          searchable={false}
                          disabled={!orderMedication.diluent}
                        />
                      </Col>
                    </Row>

                    {/* Row 2 */}
                    <Row gutter={16} className="mb-2">
                      <Col md={6}>
                        <MyInput
                          width="100%"
                          selectData={routeLovQueryResponse?.object ?? []}
                          selectDataLabel="lovDisplayVale"
                          selectDataValue="key"
                          fieldType="select"
                          fieldName="route"
                          fieldLabel="Route"
                          record={fluidOrder}
                          setRecord={setFluidOrder}
                          menuMaxHeight={200}
                          searchable={false}
                          disabled={!orderMedication.diluent}
                        />
                      </Col>
                      <Col md={6}>
                        <MyInput
                          width="100%"
                          fieldType="number"
                          rightAddon="mL/hr"
                          rightAddonwidth={70}
                          fieldName="infusionRate"
                          fieldLabel="Infusion Rate"
                          record={fluidOrder}
                          setRecord={setFluidOrder}
                          disabled={!orderMedication.diluent}
                        />
                      </Col>
                      <Col md={8}>
                        <MyInput
                          width="100%"
                          fieldName="notesToNurse"
                          fieldLabel="Notes To Nurse"
                          fieldType="textarea"
                          record={fluidOrder}
                          setRecord={setFluidOrder}
                          disabled={!orderMedication.diluent}
                        />
                      </Col>
                    </Row>

                    {/* Row 3 */}
                    <Row gutter={16}>
                      <Col md={6}>
                        <MyInput
                          width="100%"
                          selectData={frequencyLovQueryResponse?.object ?? []}
                          selectDataLabel="lovDisplayVale"
                          selectDataValue="key"
                          fieldType="select"
                          fieldName="frequency"
                          fieldLabel="Frequency"
                          record={fluidOrder}
                          setRecord={setFluidOrder}
                          searchable={false}
                          disabled={!orderMedication.diluent}
                        />
                      </Col>
                      <Col md={6}>
                        <MyInput
                          width={100}
                          fieldType="checkbox"
                          fieldName="untilCompleted"
                          fieldLabel="Until Completed"
                          record={fluidOrder}
                          setRecord={setFluidOrder}
                          disabled={!orderMedication.diluent}
                        />
                      </Col>
                    </Row>
                  </Col>
                </Row>

                <Row className="rows-gap borderr">
                  <Row>
                    <Text>Recall From Favorite</Text>
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
                                return (
                                  instruction?.lovDisplayVale || rowData.administrationInstructions
                                );
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
                  </Row>
                </Row>
              </Col>
            </Row>
          </Form>
        }
      ></AdvancedModal>
      <Substitues
        open={openSubstitutesModel}
        setOpen={setOpenSubstitutesModel}
        selectedGeneric={selectedGeneric}
        setSelectedGeneric={setSelectedGeneric}
      ></Substitues>
      <MyModal
        open={openOrderModel}
        setOpen={setOpenOrderModel}
        size={'full'}
        title="Add Order"
        content={<DiagnosticsOrder edit={edit} patient={patient} encounter={encounter} />}
      ></MyModal>
    </>
  );
};
export default DetailsModal;
