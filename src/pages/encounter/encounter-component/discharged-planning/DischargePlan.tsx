import MyButton from '@/components/MyButton/MyButton';
import React, { useEffect, useState } from 'react';
import { Col, Form, Row, Text, Message, useToaster } from 'rsuite';
import MyInput from '@/components/MyInput';
import Icd10Search from '@/components/ICD10SearchComponent/IcdSearchable';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useGenerateDischargePdfMutation } from '@/services/setup/dischargeService';
import MyTagInput from '@/components/MyTagInput/MyTagInput';
import MyLabel from '@/components/MyLabel';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FaModx } from 'react-icons/fa';
import {
  faUserPlus,
  faPills,
  faCheck,
  faCheckDouble,
  faPrint
} from '@fortawesome/free-solid-svg-icons';
import './styles.less';
import SectionContainer from '@/components/SectionsoContainer';
import { useLocation } from 'react-router-dom';
import { initialListRequest, ListRequest } from '@/types/types';

import {
  useUpsertDischargePlanningMutation,
  useUpdateDischargePlanningMutation,
  useGetDischargePlanningByEncounterQuery
} from '@/services/setup/DischargePlanningService';

import {
  useGetEncounterReviewOfSystemsQuery,
  useGetPatientDiagnosisQuery,
  useGetPrescriptionMedicationsQuery,
  useGetDiagnosticOrderTestQuery
} from '@/services/encounterService';

import { useGetProceduresQuery } from '@/services/procedureService';

import { calculateAgeFormat } from '@/utils';
import { newDischargePlanning } from '@/types/model-types-constructor-new';
import { useGetGenericMedicationWithActiveIngredientQuery } from '@/services/medicationsSetupService';
import { useEnumOptions } from '@/services/enumsApi';
import { useAppDispatch } from '@/hooks';
import { hideSystemLoader, notify, showSystemLoader } from '@/utils/uiReducerActions';
import Prescription from '../prescription';
import MyModal from '@/components/MyModal/MyModal';
import PrescriptionNew from '@/pages/encounter/encounter-component/prescription-new';

// Helper to join values
const joinValuesFromArray = (values: any[]) => {
  return values.filter(v => v !== undefined && v !== null && v !== '').join(' ');
};

const DischargePlanning = () => {
  const dispatch = useAppDispatch();


  const location = useLocation();
  const state = location.state || {};
  const patient = state.patient;
  const encounter = state.encounter;

  const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false);

  // Local
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const tenant = JSON.parse(localStorage.getItem('tenant') || 'null');
  const selectedFacility = tenant?.selectedFacility || null;

  const toaster = useToaster();

  // ------------------ FETCH EXISTING ------------------
  const {
    data: existingData,
    isFetching: loadingExisting
  } = useGetDischargePlanningByEncounterQuery(encounter?.id);

  // ------------------ STATE ------------------
  const [object, setObject] = useState({
    ...newDischargePlanning,
    patientId: patient?.id,
    encounterId: encounter?.id
  });
  // tags
  const [medicalEquipmentTags, setMedicalEquipmentTags] = useState<string[]>([]);
  const [topicsCoveredTags, setTopicsCoveredTags] = useState<string[]>([]);
  const [homeCareNeedsTags] = useState<string[]>([]); // unused but kept

  // ------------------ WHEN EXISTING DATA ------------------
  useEffect(() => {
    if (existingData) {
      setObject(existingData);

      setMedicalEquipmentTags(
        existingData.medicalEquipment
          ? existingData.medicalEquipment
            .split(",")
            .map(v => v.trim())
            .filter(v => v.length > 0)
          : []
      );

      setTopicsCoveredTags(
        existingData.topicsCovered
          ? existingData.topicsCovered
            .split(",")
            .map(v => v.trim())
            .filter(v => v.length > 0)
          : []
      );

    }
  }, [existingData]);

  // ------------------ PDF & OTHER DATA FETCHES (unchanged) ------------------
  const [diagnosisListRequest] = useState({
    ...initialListRequest,
    sortBy: 'createdAt',
    sortType: 'desc',
    filters: [
      { fieldName: 'patient_key', operator: 'match', value: patient.key },
      { fieldName: 'visit_key', operator: 'match', value: encounter.key }
    ]
  });

  const {
    data: patientDiagnoseListResponse,
    isFetching: isDiagnosisFetching
  } = useGetPatientDiagnosisQuery(diagnosisListRequest);

  // const {
  //   data: encounterReviewOfSystemsSummaryResponse,
  //   isFetching: isReviewSystemsFetching
  // } = useGetEncounterReviewOfSystemsQuery(encounter.key);

  const [proceduresListRequest] = useState({
    ...initialListRequest,
    filters: [
      { fieldName: 'encounter_key', operator: 'match', value: encounter?.key }
    ]
  });

  const {
    data: proceduresResponse,
    isFetching: isProceduresFetching
  } = useGetProceduresQuery(proceduresListRequest);

  const [listOrdersTestRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'patient_key',
        operator: 'match',
        value: patient?.key
      }
    ]
  });

  const {
    data: orderTestList,
    isLoading: loadTests
  } = useGetDiagnosticOrderTestQuery({ ...listOrdersTestRequest });

  const [prescriptionsListRequest] = useState({
    ...initialListRequest,
    filters: [
      { fieldName: 'patient_key', operator: 'match', value: patient.key },
      { fieldName: 'visit_key', operator: 'match', value: encounter.key }
    ]
  });

  const {
    data: prescriptionsResponse,
    isFetching: isPrescriptionsFetching
  } = useGetPrescriptionMedicationsQuery(prescriptionsListRequest);

  const {
    data: genericMedicationListResponse,
    isFetching: isGenericMedicationsFetching
  } = useGetGenericMedicationWithActiveIngredientQuery('');

  const [diagnosticTestsListRequest] = useState({
    ...initialListRequest,
    filters: [
      { fieldName: 'patient_key', operator: 'match', value: patient?.key },
      { fieldName: 'status_lkey', operator: 'notMatch', value: '7076094029034732' }
    ]
  });

  const {
    data: diagnosticTestsResponse,
    isFetching: isDiagnosticTestsFetching
  } = useGetDiagnosticOrderTestQuery(diagnosticTestsListRequest);

  const readinessStatus = useEnumOptions("ReadinessStatus");


  const [generateDischargePdf, { isLoading: isGeneratingPdf }] =
    useGenerateDischargePdfMutation();

  const isDataLoading =
    isGeneratingPdf ||
    isDiagnosisFetching ||
    // isReviewSystemsFetching ||
    isProceduresFetching ||
    loadTests ||
    isPrescriptionsFetching ||
    isGenericMedicationsFetching ||
    isDiagnosticTestsFetching ||
    loadingExisting;

  // ------------------ UPSERT / UPDATE ------------------
  const [upsertDischargePlanning, { isLoading: isSaving }] =
    useUpsertDischargePlanningMutation();

  const [updateDischargePlanning, { isLoading: isSubmitting }] =
    useUpdateDischargePlanningMutation();

  const buildPayload = () => ({
    ...object,
    medicalEquipment: medicalEquipmentTags.join(', '),
    topicsCovered: topicsCoveredTags.join(', ')
  });



  const handleSave = async () => {
    const requiredFields = [
      { field: "expectedDischargeDate", label: "Expected discharge date" },
      { field: "readinessStatus", label: "Readiness status" },
      { field: "diagnosisCode", label: "Diagnosis" }
    ];

    for (const item of requiredFields) {
      if (
        object[item.field] === null ||
        object[item.field] === undefined ||
        object[item.field] === "" ||
        object[item.field]?.toString().trim() === ""
      ) {
        dispatch(
          notify({
            msg: `${item.label} cannot be empty.`,
            sev: "warning",
          })
        );
        return;
      }
    }

    try {
      dispatch(showSystemLoader());

      // Base payload
      const basePayload: any = {
        ...object,
        medicalEquipment: medicalEquipmentTags.join(", "),
        topicsCovered: topicsCoveredTags.join(", "),
        patientId: patient?.id,
        encounterId: encounter?.id,
      };


      // Remove audit fields ALWAYS before sending
      delete basePayload.createdDate;
      delete basePayload.lastModifiedDate;
      delete basePayload.createdBy;
      delete basePayload.lastModifiedBy;

      if (object.id) {
        // ========== UPDATE ==========
        const payload = { ...basePayload, id: object.id };

        await updateDischargePlanning(payload).unwrap();

        dispatch(
          notify({
            msg: "Discharge Planning updated successfully",
            sev: "success",
          })
        );
      } else {
        // ========== CREATE ==========
        delete basePayload.id;

        await upsertDischargePlanning(basePayload).unwrap();

        dispatch(
          notify({
            msg: "Discharge Planning saved successfully",
            sev: "success",
          })
        );
      }
    } catch (err: any) {
      dispatch(
        notify({
          msg: "Failed to save Discharge Planning",
          sev: "error",
        })
      );
    } finally {
      dispatch(hideSystemLoader());
    }
  };



  const formatDate = (timestamp: number) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleDateString('en-GB');
  };

  // PDF preparation unchanged (kept exactly as your code)
  const prepareDischargeData = () => {
    const patientData = {
      fullName: patient?.fullName || '',
      patientMrn: patient?.patientMrn || '',
      dob: patient?.dob || '',
      age: patient?.dob ? calculateAgeFormat(patient.dob) + '' : '',
      gender: patient?.genderLvalue?.lovDisplayVale || 'Not specified'
    };

    const encounterData = {
      chiefComplain: encounter?.chiefComplaint || 'Not specified',
      admissionDate: formatDate(encounter?.createdAt)
    };

    const userData = {
      fullName:
        `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Unknown',
      email: user?.email || ''
    };

    const facilityData = {
      name: selectedFacility?.name || 'Health Organization'
    };

    const diagnosesData =
      patientDiagnoseListResponse?.object?.map((diag: any) => {
        const diagType =
          diag?.diagnoseTypeLvalue?.lovDisplayVale ||
          (diag?.diagnoseTypeLvalue?.valueCode === 'DIAG_TYP_PRIMARY'
            ? 'Primary'
            : 'Secondary');

        return {
          diagnoseType: diagType,
          icdCode: diag?.diagnosisObject?.icdCode || '',
          description: diag?.diagnosisObject?.description || ''
        };
      }) || [];

    // const reviewSystemsData =
    //   encounterReviewOfSystemsSummaryResponse?.object?.map((item: any) => ({
    //     system: item?.systemLvalue?.lovDisplayVale || '',
    //     systemDetail:
    //       item?.systemDetailLvalue?.lovDisplayVale ||
    //       item?.systemDetailLkey ||
    //       '',
    //     notes: item?.notes || ''
    //   })) || [];

    const joinValues = (keys: any[], lovValues: any) =>
      keys
        .map(key =>
          lovValues?.object?.find((lov: any) => lov.key === key)
        )
        .filter(obj => obj !== undefined)
        .map(obj => obj.lovDisplayVale)
        .join(', ');

    const proceduresData = [
      ...(proceduresResponse?.object?.map((proc: any) => ({
        procedureName: proc?.procedureName || '',
        procedureId: proc?.procedureId || ''
      })) || []),
      ...(orderTestList?.object?.map((row: any) => ({
        procedureName: row?.test?.testName || '',
        procedureId: row?.orderId || ''
      })) || [])
    ];

    const prescriptionsData =
      prescriptionsResponse?.object?.map((rowData: any) => {
        const medicationName =
          genericMedicationListResponse?.object?.find(
            (item: any) =>
              item.key === rowData.genericMedicationsKey
          )?.genericName || 'Unknown Medication';

        const instructions = joinValuesFromArray([
          rowData.dose,
          rowData.doseUnitLvalue?.lovDisplayVale,
          rowData.drugOrderTypeLkey === '2937757567806213' ? 'STAT' : ``,
          rowData.roaLvalue?.lovDisplayVale
        ]);

        return {
          medicationName,
          instructions
        };
      }) || [];

    const diagnosticTestsData =
      diagnosticTestsResponse?.object?.map((test: any) => ({
        testName: test?.test?.testName || '',
        processingStatus:
          test?.processingStatusLvalue?.lovDisplayVale ||
          test?.processingStatusLkey ||
          ''
      })) || [];

    return {
      patient: patientData,
      encounter: encounterData,
      user: userData,
      facility: facilityData,
      diagnoses: diagnosesData,
      // reviewSystems: reviewSystemsData,
      procedures: proceduresData,
      prescriptions: prescriptionsData,
      diagnosticTests: diagnosticTestsData
    };
  };

  const handleGenerateReport = async () => {
    try {
      const dischargeData = prepareDischargeData();
      const result = await generateDischargePdf(dischargeData).unwrap();

      const blob = new Blob([result], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fileName = `Discharge_Summary_${patient?.patientMrn || 'Unknown'}_${new Date().getTime()}.pdf`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toaster.push(
        <Message showIcon type="success" closable>
          Discharge Summary Report generated successfully for {patient?.fullName}!
        </Message>,
        { placement: 'topEnd', duration: 5000 }
      );
    } catch (error: any) {
      toaster.push(
        <Message showIcon type="error" closable>
          Failed to generate report
        </Message>,
        { placement: 'topEnd' }
      );
    }
  };

  const handlePrintReport = async () => {
    try {
      const dischargeData = prepareDischargeData();
      const result = await generateDischargePdf(dischargeData).unwrap();

      const blob = new Blob([result], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');

      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }

      toaster.push(
        <Message showIcon type="success" closable>
          Print Window Opened!
        </Message>,
        { placement: 'topEnd' }
      );
    } catch (error: any) {
      toaster.push(
        <Message showIcon type="error" closable>
          Failed to open print
        </Message>,
        { placement: 'topEnd' }
      );
    }
  };

  // ------------------ RENDER ------------------
          // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <div dir={dir}>
      <Row gutter={15} className="d">
        <Form fluid>
          <Col md={12}>
            <Row>
              <SectionContainer
                title="Planned Discharge Readiness"
                content={
                  <Row>
                    <Col md={8}>
                      <MyInput
                        width="100%"
                        fieldType="date"
                        fieldName="expectedDischargeDate"
                        fieldLabel="Expected Discharge Date"
                        record={object}
                        setRecord={setObject}
                        required
                      />
                    </Col>

                    <Col md={8}>
                      <MyInput
                        width="100%"
                        disabled
                        fieldName="estimatedLos"
                        fieldLabel="Estimated LOS"
                        record={object}
                        setRecord={setObject}
                      />
                    </Col>

                    <Col md={8}>
                      <MyInput
                        width="100%"
                        selectData={readinessStatus ?? []}
                        selectDataLabel="label"
                        selectDataValue="value"
                        fieldType="select"
                        fieldName="readinessStatus"
                        record={object}
                        setRecord={setObject}
                        required
                      />
                    </Col>
                  </Row>
                }
              />
            </Row>

            <Row>
              <SectionContainer
                title="Clinical Clearance"
                content={
                  <>
                    <Row>
                      <Col md={12}>
                        <MyInput
                          width="100%"
                          fieldType="checkbox"
                          fieldName="medicalConditionStable"
                          record={object}
                          setRecord={setObject}
                        />
                      </Col>

                      <Col md={12}>
                        <MyInput
                          width="100%"
                          fieldType="checkbox"
                          fieldName="vitalsStable"
                          record={object}
                          setRecord={setObject}
                        />
                      </Col>
                    </Row>

                    <Row>
                      <Col md={12}>
                        <MyInput
                          width="100%"
                          fieldType="checkbox"
                          fieldName="pendingInvestigations"
                          record={object}
                          setRecord={setObject}
                        />
                      </Col>

                      <Col md={12}>
                        <MyInput
                          width="100%"
                          fieldType="checkbox"
                          checkedLabel="Dependent"
                          unCheckedLabel="Independent"
                          fieldLabel="Mobility / ADL status"
                          fieldName="mobilityAdlStatus"
                          record={object}
                          setRecord={setObject}
                        />
                      </Col>
                    </Row>

                    <Row>
                      <Col md={24}>
                        <div className="container-ofiicd10-search-discharge-planning">
                          <Icd10Search
                            object={object}
                            setOpject={setObject}
                            fieldName="diagnosisCode"
                            label="Diagnosis"
                            mode="singleICD10"
                          />
                        </div>
                      </Col>
                    </Row>
                  </>
                }
              />
            </Row>

            <Row>
              <SectionContainer
                title="Discharge Checklist"
                content={
                  <>
                    <Row>
                      <Col md={12}>
                        <MyInput
                          width="100%"
                          fieldType="checkbox"
                          fieldName="finalMedReconciliationCompleted"
                          record={object}
                          setRecord={setObject}
                        />
                      </Col>

                      <Col md={12}>
                        <MyInput
                          width="100%"
                          fieldType="checkbox"
                          fieldName="dischargeSummaryPrepared"
                          record={object}
                          setRecord={setObject}
                        />
                      </Col>
                    </Row>

                    <Row>
                      <Col md={12}>
                        <MyInput
                          width="100%"
                          fieldType="checkbox"
                          fieldName="dischargeOrdersSigned"
                          record={object}
                          setRecord={setObject}
                        />
                      </Col>

                      <Col md={12}>
                        <MyInput
                          width="100%"
                          fieldType="checkbox"
                          fieldName="nursingDischargeReportDone"
                          record={object}
                          setRecord={setObject}
                        />
                      </Col>
                    </Row>

                    <Row>
                      <Col md={12}>
                        <MyInput
                          width="100%"
                          fieldType="checkbox"
                          fieldName="patientFamilyInformed"
                          record={object}
                          setRecord={setObject}
                        />
                      </Col>

                      <Col md={12}>
                        <MyInput
                          width="100%"
                          fieldType="checkbox"
                          fieldName="transportArranged"
                          record={object}
                          setRecord={setObject}
                        />
                      </Col>
                    </Row>
                  </>
                }
              />
            </Row>
          </Col>

          <Col md={12}>
            <Row>
              <SectionContainer
                title="Post-Discharge Needs"
                content={
                  <>
                    <Row>
                      <Col md={12}>
                        <Text>Medications to Continue</Text>
                      </Col>
                      <Col md={12}>
                        <MyButton
                          prefixIcon={() => <FontAwesomeIcon icon={faPills} />}
                          onClick={() => setPrescriptionModalOpen(true)}
                        >
                          Prescription
                        </MyButton>

                      </Col>
                    </Row>

                    <Row>
                      <Col md={24}>
                        <MyTagInput
                          tags={medicalEquipmentTags}
                          setTags={setMedicalEquipmentTags}
                          labelText="Medical Equipment"
                        />
                      </Col>
                    </Row>

                    <Row>
                      <Col md={12}>
                        <MyInput
                          width="100%"
                          fieldType="checkbox"
                          fieldName="homeCareNeeded"
                          record={object}
                          setRecord={setObject}
                        />
                      </Col>

                      {object.homeCareNeeded && (
                        <Col md={12}>
                          <MyTagInput
                            tags={homeCareNeedsTags}
                            setTags={() => { }}
                            labelText="Home Care Needs"
                          />
                        </Col>
                      )}
                    </Row>

                    <Row>
                      <Col md={12}>
                        <MyInput
                          width="100%"
                          fieldType="textarea"
                          fieldName="postDischargeDietaryPlan"
                          record={object}
                          setRecord={setObject}
                        />
                      </Col>

                      <Col md={12}>
                        <MyInput
                          width="100%"
                          fieldType="textarea"
                          fieldName="postDischargeSocialNeeds"
                          record={object}
                          setRecord={setObject}
                        />
                      </Col>
                    </Row>

                    <Row>
                      <Col md={12}>
                        <Text>Follow-up Plan</Text>
                      </Col>
                      <Col md={12}>
                        <MyButton prefixIcon={() => <FontAwesomeIcon icon={faUserPlus} />}>
                          Create Follow-up
                        </MyButton>
                      </Col>
                    </Row>
                  </>
                }
              />
            </Row>

            <Row>
              <SectionContainer
                title="Patient Education"
                content={
                  <>
                    <Row>
                      <Col md={24}>
                        <MyTagInput
                          tags={topicsCoveredTags}
                          setTags={setTopicsCoveredTags}
                          labelText="Topics Covered"
                        />
                      </Col>
                    </Row>

                    <Row>
                      <Col md={12}>
                        <MyInput
                          width="100%"
                          fieldType="textarea"
                          fieldName="educationDietaryPlan"
                          record={object}
                          setRecord={setObject}
                        />
                      </Col>

                      <Col md={12}>
                        <MyInput
                          width="100%"
                          fieldType="textarea"
                          fieldName="educationSocialNeeds"
                          record={object}
                          setRecord={setObject}
                        />
                      </Col>
                    </Row>

                    <Row className="container-of-checks">
                      <Col md={6}>
                        <MyLabel label="Material Given" />
                      </Col>

                      <Col md={6}>
                        <MyInput
                          width="100%"
                          fieldType="check"
                          fieldName="materialLeaflet"
                          showLabel={false}
                          record={object}
                          setRecord={setObject}
                        />
                      </Col>

                      <Col md={6}>
                        <MyInput
                          width="100%"
                          fieldType="check"
                          fieldName="materialVerbal"
                          showLabel={false}
                          record={object}
                          setRecord={setObject}
                        />
                      </Col>

                      <Col md={6}>
                        <MyInput
                          width="100%"
                          fieldType="check"
                          fieldName="materialVideo"
                          showLabel={false}
                          record={object}
                          setRecord={setObject}
                        />
                      </Col>
                    </Row>

                    <Row>
                      <Col md={12}>
                        <MyInput
                          width="100%"
                          fieldType="checkbox"
                          fieldName="educationProvided"
                          record={object}
                          setRecord={setObject}
                        />
                      </Col>

                      <Col md={12}>
                        <MyInput
                          width="100%"
                          fieldType="checkbox"
                          fieldName="patientUnderstanding"
                          checkedChildren="Verified"
                          unCheckedChildren="Not Verified"
                          record={object}
                          setRecord={setObject}
                        />
                      </Col>
                    </Row>
                  </>
                }
              />
            </Row>
          </Col>
        </Form>
      </Row>

      <div className="container-of-buttons-discharge">

        <MyButton
          onClick={handleGenerateReport}
          loading={isDataLoading}
          disabled={isDataLoading}
        >
          <FaModx title="Generate Report" size={20} />
          {isDataLoading ? 'Preparing...' : isGeneratingPdf ? 'Generating...' : 'Generate Report'}
        </MyButton>

        <MyButton
          onClick={handlePrintReport}
          loading={isGeneratingPdf}
          disabled={isGeneratingPdf}
        >
          <FontAwesomeIcon icon={faPrint} />
          {isGeneratingPdf ? 'Generating...' : 'Print Report'}
        </MyButton>

        <MyButton
          onClick={handleSave}
          color="var(--deep-blue)"
          width="80px"
          height="32px"
          loading={isSaving}
          disabled={isSaving}
          prefixIcon={() => <FontAwesomeIcon icon={faCheck} />}
        >
          Save
        </MyButton>
      </div>

      <MyModal
        open={prescriptionModalOpen}
        setOpen={setPrescriptionModalOpen}
        title="Prescription"
        size="70vw"
        hideBack={true}
        steps={[{ title: 'Prescription', icon: <FontAwesomeIcon icon={faPills} /> }]}

        content={
          <PrescriptionNew
            patient={patient}
            encounter={encounter}
            closeModal={() => setPrescriptionModalOpen(false)}
          />
        }

        actionButtonLabel="Save"
        hideActionBtn={true}
      />



    </div>
  );
};

export default DischargePlanning;
