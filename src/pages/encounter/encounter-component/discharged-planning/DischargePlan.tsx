import MyButton from '@/components/MyButton/MyButton';
import React, { useState } from 'react';
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

const DischargePlanning = () => {
  // Fetch readiness Status Lov response
  const { data: readinessStatusLovQueryResponse } = useGetLovValuesByCodeQuery('READINESS_STATUS');
  
  // Discharge PDF Generation
  const [generateDischargePdf, { isLoading: isGeneratingPdf }] = useGenerateDischargePdfMutation();
  const toaster = useToaster();

  const [object, setObject] = useState({ homeCareNeeded: false, readinessStatus: '' });
  const [medicalEquipmentTags, setMedicalEquipmentTags] = useState([]);
  const [homeCareNeedsTags, setHomeCareNeedsTags] = useState([]);
  const [topicsCoveredTags, setTopicsCoveredTags] = useState([]);

  // Function to handle PDF generation
  const handleGenerateReport = async () => {
    try {
      console.log('Starting Discharge PDF generation...');
      
      const result = await generateDischargePdf().unwrap();
      
      // Create blob URL and trigger download
      const blob = new Blob([result], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Discharge_Summary_Report_${new Date().getTime()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Show success message
      toaster.push(
        <Message showIcon type="success" closable>
          Discharge Summary Report generated successfully!
        </Message>,
        { placement: 'topEnd', duration: 5000 }
      );

      console.log('Discharge PDF generated and downloaded successfully');
    } catch (error) {
      console.error('Error generating Discharge PDF:', error);
      
      // Show error message
      toaster.push(
        <Message showIcon type="error" closable>
          Failed to generate Discharge Summary Report. Please try again.
        </Message>,
        { placement: 'topEnd', duration: 5000 }
      );
    }
  };

  // Function to handle print (generates PDF and opens in new window for printing)
  const handlePrintReport = async () => {
    try {
      console.log('Starting Discharge PDF generation for printing...');
      
      const result = await generateDischargePdf().unwrap();
      
      // Create blob URL and open in new window
      const blob = new Blob([result], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }

      // Show success message
      toaster.push(
        <Message showIcon type="success" closable>
          Discharge Summary Report opened for printing!
        </Message>,
        { placement: 'topEnd', duration: 5000 }
      );

      console.log('Discharge PDF opened for printing');
    } catch (error) {
      console.error('Error generating Discharge PDF for printing:', error);
      
      // Show error message
      toaster.push(
        <Message showIcon type="error" closable>
          Failed to open Discharge Summary Report for printing. Please try again.
        </Message>,
        { placement: 'topEnd', duration: 5000 }
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