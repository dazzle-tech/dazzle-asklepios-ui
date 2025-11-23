import MyButton from '@/components/MyButton/MyButton';
import React, { useEffect, useState } from 'react';
import { Col, Form, Row, Text, Message, useToaster } from 'rsuite';
import MyInput from '@/components/MyInput';
import Icd10Search from '@/pages/medical-component/Icd10Search';
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
import { newApPatientDiagnose } from '@/types/model-types-constructor';
import { initialListRequest, ListRequest } from '@/types/types';
import {
  useGetEncounterReviewOfSystemsQuery,
  useGetPatientDiagnosisQuery,
  useGetPrescriptionMedicationsQuery,
  useGetDiagnosticOrderTestQuery
} from '@/services/encounterService';
import { useGetProceduresQuery } from '@/services/procedureService';
import { calculateAgeFormat } from '@/utils';
import { useGetGenericMedicationWithActiveIngredientQuery } from '@/services/medicationsSetupService';
// Helper: join values into one string, ignoring empty values
const joinValuesFromArray = (values: any[]) => {
  return values
    .filter(v => v !== undefined && v !== null && v !== '')
    .join(' ');
};

const DischargePlanning = () => {
  const location = useLocation();
  const state = location.state || {};
  const patient = state.patient;
  const encounter = state.encounter;

  // Get user and facility from localStorage
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const tenant = JSON.parse(localStorage.getItem('tenant') || 'null');
  const selectedFacility = tenant?.selectedFacility || null;

  const [selectedDiagnose, setSelectedDiagnose] = useState<any>({
    ...newApPatientDiagnose,
    visitKey: encounter.key,
    patientKey: patient.key,
    createdBy: 'Administrator'
  });

  // Fetch diagnoses
  const [diagnosisListRequest] = useState({
    ...initialListRequest,
    sortBy: 'createdAt',
    sortType: 'desc',
    filters: [
      { fieldName: 'patient_key', operator: 'match', value: patient.key },
      { fieldName: 'visit_key', operator: 'match', value: encounter.key }
    ]
  });

  const { data: patientDiagnoseListResponse } = useGetPatientDiagnosisQuery(diagnosisListRequest);

  useEffect(() => {
    if (patientDiagnoseListResponse?.object?.length > 0) {
      setSelectedDiagnose(patientDiagnoseListResponse.object[0]);
    }
  }, [patientDiagnoseListResponse]);

  // Fetch review of systems
  const { data: encounterReviewOfSystemsSummaryResponse } =
    useGetEncounterReviewOfSystemsQuery(encounter.key);

  // Fetch procedures
  const [proceduresListRequest] = useState({
    ...initialListRequest,
    filters: [
      { fieldName: 'encounter_key', operator: 'match', value: encounter?.key }
    ]
  });
  const { data: proceduresResponse } = useGetProceduresQuery(proceduresListRequest);

  const [listOrdersTestRequest, setListOrdersTestRequest] = useState<ListRequest>({
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
    refetch: orderTestRefetch,
    isLoading: loadTests
  } = useGetDiagnosticOrderTestQuery({ ...listOrdersTestRequest });
  // Fetch prescriptions
  const [prescriptionsListRequest] = useState({
    ...initialListRequest,
    filters: [
      { fieldName: 'patient_key', operator: 'match', value: patient.key },
      { fieldName: 'visit_key', operator: 'match', value: encounter.key }
    ]
  });
  const { data: prescriptionsResponse } = useGetPrescriptionMedicationsQuery(prescriptionsListRequest);
  const { data: genericMedicationListResponse } =
    useGetGenericMedicationWithActiveIngredientQuery('');
  // Fetch diagnostic tests
  const [diagnosticTestsListRequest] = useState({
    ...initialListRequest,
    filters: [
      { fieldName: 'patient_key', operator: 'match', value: patient?.key },
      { fieldName: 'status_lkey', operator: 'notMatch', value: "7076094029034732" }

    ]
  });
  const { data: diagnosticTestsResponse } = useGetDiagnosticOrderTestQuery(diagnosticTestsListRequest);

  // Fetch readiness Status Lov response
  const { data: readinessStatusLovQueryResponse } = useGetLovValuesByCodeQuery('READINESS_STATUS');

  // Discharge PDF Generation
  const [generateDischargePdf, { isLoading: isGeneratingPdf }] = useGenerateDischargePdfMutation();
  const toaster = useToaster();

  const [object, setObject] = useState({ homeCareNeeded: false, readinessStatus: '' });
  const [medicalEquipmentTags, setMedicalEquipmentTags] = useState([]);
  const [homeCareNeedsTags, setHomeCareNeedsTags] = useState([]);
  const [topicsCoveredTags, setTopicsCoveredTags] = useState([]);

  // Helper function to format date
  const formatDate = (timestamp: number) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleDateString('en-GB');
  };

  // Prepare discharge data - Complete structure
  const prepareDischargeData = () => {
 
    // Patient data
    const patientData = {
      fullName: patient?.fullName || '',
      patientMrn: patient?.patientMrn || '',
      dob: patient?.dob || '',
      age: patient?.dob ? calculateAgeFormat(patient.dob) + '' : '',
      gender: patient?.genderLvalue?.lovDisplayVale || 'Not specified'
    };

    // Encounter data
    const encounterData = {
      chiefComplain: encounter?.chiefComplaint || 'Not specified',
      admissionDate: formatDate(encounter?.createdAt)
    };

    // User data
    const userData = {
      fullName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Unknown',
      email: user?.email || ''
    };

    // Facility data
    const facilityData = {
      name: selectedFacility?.name || 'Health Organization'
    };

    // Diagnoses data
    const diagnosesData = patientDiagnoseListResponse?.object?.map((diag: any) => {
      const diagType = diag?.diagnoseTypeLvalue?.lovDisplayVale ||
        (diag?.diagnoseTypeLvalue?.valueCode === 'DIAG_TYP_PRIMARY' ? 'Primary' : 'Secondary');
      return {
        diagnoseType: diagType,
        icdCode: diag?.diagnosisObject?.icdCode || '',
        description: diag?.diagnosisObject?.description || ''
      };
    }) || [];

    // Review of systems data
    const reviewSystemsData = encounterReviewOfSystemsSummaryResponse?.object?.map((item: any) => ({
      system: item?.systemLvalue?.lovDisplayVale || '',
      systemDetail: item?.systemDetailLvalue?.lovDisplayVale || item?.systemDetailLkey || '',
      notes: item?.notes || ''
    })) || [];

    // Procedures data
    const joinValues = (keys: any[], lovValues: any) => {
      return keys
        .map(key => lovValues?.object?.find((lov: any) => lov.key === key))
        .filter(obj => obj !== undefined)
        .map(obj => obj.lovDisplayVale)
        .join(', ');
    };

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
            (item: any) => item.key === rowData.genericMedicationsKey
          )?.genericName || 'Unknown Medication';
        const instructions = joinValuesFromArray([
          rowData.dose,
          rowData.doseUnitLvalue?.lovDisplayVale,
          rowData.drugOrderTypeLkey === '2937757567806213'
            ? 'STAT'
            : ``,
          rowData.roaLvalue?.lovDisplayVale
        ]);

        return {
          medicationName,
          instructions
        };
      }) || [];



    // Diagnostic tests data
    const diagnosticTestsData = diagnosticTestsResponse?.object?.map((test: any) => ({
      testName: test?.test?.testName || '',
      processingStatus: test?.processingStatusLvalue?.lovDisplayVale || test?.processingStatusLkey || ''
    })) || [];

    const completeData = {
      patient: patientData,
      encounter: encounterData,
      user: userData,
      facility: facilityData,
      diagnoses: diagnosesData,
      reviewSystems: reviewSystemsData,
      procedures: proceduresData,
      prescriptions: prescriptionsData,
      diagnosticTests: diagnosticTestsData
    };

    return completeData;
  };

  // Function to handle PDF generation
  const handleGenerateReport = async () => {
    try {
     
      const dischargeData = prepareDischargeData();
      const result = await generateDischargePdf(dischargeData).unwrap();

      // Create blob URL and trigger download
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

      // Show success message
      toaster.push(
        <Message showIcon type="success" closable>
          Discharge Summary Report generated successfully for {patient?.fullName}!
        </Message>,
        { placement: 'topEnd', duration: 5000 }
      );

    } catch (error) {
      console.error('==========================================');
      console.error('Error generating Discharge PDF:', error);
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        data: error?.data
      });
      console.error('==========================================');

      // Show error message
      const errorMessage = error?.message || 'Unknown error occurred';
      toaster.push(
        <Message showIcon type="error" closable>
          Failed to generate Discharge Summary Report: {errorMessage}
        </Message>,
        { placement: 'topEnd', duration: 7000 }
      );
    }
  };

  // Function to handle print
  const handlePrintReport = async () => {
    try {

      const dischargeData = prepareDischargeData();
      const result = await generateDischargePdf(dischargeData).unwrap();

      // Create blob URL and open in new window
      const blob = new Blob([result], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');

      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      } else {
        throw new Error('Failed to open print window. Please check your browser settings.');
      }

      // Show success message
      toaster.push(
        <Message showIcon type="success" closable>
          Discharge Summary Report opened for printing!
        </Message>,
        { placement: 'topEnd', duration: 5000 }
      );

    } catch (error) {
      console.error('Error generating Discharge PDF for printing:', error);

      // Show error message
      const errorMessage = error?.message || 'Unknown error occurred';
      toaster.push(
        <Message showIcon type="error" closable>
          Failed to open Discharge Summary Report for printing: {errorMessage}
        </Message>,
        { placement: 'topEnd', duration: 7000 }
      );
    }
  };

  return (
    <>
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
                        fieldName="Expected Discharge Date"
                        record=""
                        setRecord=""
                      />
                    </Col>
                    <Col md={8}>
                      <MyInput
                        width="100%"
                        disabled
                        fieldName="Estimated Length of Stay (LOS)"
                        fieldLabel="Estimated LOS"
                        record=""
                        setRecord=""
                      />
                    </Col>
                    <Col md={8}>
                      <MyInput
                        width="100%"
                        selectData={readinessStatusLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        fieldType="select"
                        fieldName="readinessStatus"
                        record={object}
                        setRecord={setObject}
                      />
                    </Col>
                    {object.readinessStatus == '7081919156301225' && (
                      <Col md={12}>
                        <MyInput width="100%" fieldName="ReasonForDelay" record="" setRecord="" />
                      </Col>
                    )}
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
                          fieldName="mobility"
                          fieldLabel="Mobility / ADL status"
                          record={object}
                          setRecord={setObject}
                        />
                      </Col>
                    </Row>
                    <Row>
                      <Col md={24}>
                        <div className="container-ofiicd10-search-discharge-planning">
                          <Icd10Search object="" setOpject="" fieldName="diagnosisKey" />
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
                          fieldName="finalMedicationReconciliationCompleted"
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
                          fieldName="patient/familyInformed"
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
                        <MyButton prefixIcon={() => <FontAwesomeIcon icon={faPills} />}>
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
                      {object.homeCareNeeded == true && (
                        <Col md={12}>
                          <MyTagInput
                            tags={homeCareNeedsTags}
                            setTags={setHomeCareNeedsTags}
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
                          fieldName="dietaryPlan"
                          record={object}
                          setRecord={setObject}
                        />
                      </Col>
                      <Col md={12}>
                        <MyInput
                          width="100%"
                          fieldType="textarea"
                          fieldName="socialNeeds"
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
                          fieldName="dietaryPlan"
                          record={object}
                          setRecord={setObject}
                        />
                      </Col>
                      <Col md={12}>
                        <MyInput
                          width="100%"
                          fieldType="textarea"
                          fieldName="socialNeeds"
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
                          fieldName="Leaflet"
                          record={object}
                          setRecord={setObject}
                          showLabel={false}
                        />
                      </Col>
                      <Col md={6}>
                        <MyInput
                          width="100%"
                          fieldType="check"
                          fieldName="Verbal"
                          record={object}
                          setRecord={setObject}
                          showLabel={false}
                        />
                      </Col>
                      <Col md={6}>
                        <MyInput
                          width="100%"
                          fieldType="check"
                          fieldName="Video"
                          record={object}
                          setRecord={setObject}
                          showLabel={false}
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
          loading={isGeneratingPdf}
          disabled={isGeneratingPdf}
        >
          <FaModx title="Generate Report" size={20} />
          {isGeneratingPdf ? 'Generating...' : 'Generate Report'}
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
          color="var(--deep-blue)"
          width="80px"
          height="32px"
          prefixIcon={() => <FontAwesomeIcon icon={faCheck} />}
        >
          Save
        </MyButton>

        <MyButton
          color="var(--deep-blue)"
          width="119px"
          height="32px"
          prefixIcon={() => <FontAwesomeIcon icon={faCheckDouble} />}
        >
          Sign & Submit
        </MyButton>
      </div>
    </>
  );
};

export default DischargePlanning;