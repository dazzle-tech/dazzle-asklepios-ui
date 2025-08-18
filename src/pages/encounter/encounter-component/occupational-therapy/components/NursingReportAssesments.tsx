import React, { useState } from 'react';
import MyLabel from '@/components/MyLabel';
import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { Col, Form, Row } from 'rsuite';
import MyInput from '@/components/MyInput';
import MyTagInput from '@/components/MyTagInput/MyTagInput';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardList } from '@fortawesome/free-solid-svg-icons';
import GeneralAssessmentSummary from '../../nursing-reports-summary/GeneralAssessmentSummary';
import FunctionalAssessmentSummary from '../../nursing-reports-summary/FunctionalAssessmentSummary';
import { newApFunctionalAssessment } from '@/types/model-types-constructor';
import { ApFunctionalAssessment } from '@/types/model-types';

const NursingReportAssesments: React.FC = ({ patient, encounter }) => {
  const [generalAssessmentOpen, setGeneralAssessmentOpen] = useState(false);
  const [functionalAssessmentOpen, setFunctionalAssessmentOpen] = useState(false);
  const [generalAssessment, setGeneralAssessment] = useState({});
  const [isDisabledField, setIsDisabledField] = useState(false);
  const [tags, setTags] = useState([]);
  const [functionalAssessment, setFunctionalAssessment] = useState<ApFunctionalAssessment>({
    ...newApFunctionalAssessment
  });
  // Fetch LOV data for various fields
  const { data: positionStatusLovQueryResponse } = useGetLovValuesByCodeQuery('POSITION_STATUS');
  const { data: bodyMovementLovQueryResponse } = useGetLovValuesByCodeQuery('BODY_MOVEMENT');
  const { data: levelOfConscLovQueryResponse } = useGetLovValuesByCodeQuery('LEVEL_OF_CONSC');
  const { data: countryLovQueryResponse } = useGetLovValuesByCodeQuery('CNTRY');
  const { data: speechAssLovQueryResponse } = useGetLovValuesByCodeQuery('SPEECH_ASSESSMENT');
  const { data: moodLovQueryResponse } = useGetLovValuesByCodeQuery('MOOD_BEHAVIOR');
  return (
    <div className="physiotherapy-container">
      {/* Header */}
      <div
        className="section-header"
        style={{ justifyContent: 'space-between', alignItems: 'center' }}
      >
        <MyLabel className="section-title" label={<h6>Nursing Reports Summary</h6>} />
        <div className="section-buttons">
          <MyButton onClick={() => setGeneralAssessmentOpen(true)}>
            Fill General Assessment
          </MyButton>
          <MyButton onClick={() => setFunctionalAssessmentOpen(true)}>
            Fill Functional Assessment
          </MyButton>
        </div>
      </div>

      <Row gutter={18}>
        <Col xs={12}>
          <GeneralAssessmentSummary patient={patient} encounter={encounter} />
        </Col>
        <Col xs={12}>
          <FunctionalAssessmentSummary patient={patient} encounter={encounter} />
        </Col>
      </Row>
      {/* Modal for General Assessment */}
      <MyModal
        open={generalAssessmentOpen}
        setOpen={setGeneralAssessmentOpen}
        title="Fill General Assessment"
        size="32vw"
        bodyheight="80vh"
        position="right"
        content={() => (
          <div>
            <Form fluid layout="inline">
              <MyInput
                column
                width={200}
                fieldLabel="Position Status"
                fieldType="select"
                fieldName="positionStatusLkey"
                selectData={positionStatusLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={generalAssessment}
                setRecord={setGeneralAssessment}
                disabled={isDisabledField}
                searchable={false}
              />
              <MyInput
                column
                width={200}
                fieldLabel="Body Movements"
                fieldType="select"
                fieldName="bodyMovementsLkey"
                selectData={bodyMovementLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={generalAssessment}
                setRecord={setGeneralAssessment}
                disabled={isDisabledField}
                searchable={false}
              />
              <MyInput
                column
                width={200}
                fieldLabel="Level of Consciousness"
                fieldType="select"
                fieldName="levelOfConsciousnessLkey"
                selectData={levelOfConscLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={generalAssessment}
                setRecord={setGeneralAssessment}
                disabled={isDisabledField}
                searchable={false}
              />
              <MyInput
                column
                width={200}
                fieldLabel="Facial Expression"
                fieldType="select"
                fieldName="facialExpressionLkey"
                selectData={levelOfConscLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={generalAssessment}
                setRecord={setGeneralAssessment}
                disabled={isDisabledField}
                searchable={false}
              />
              <MyInput
                column
                width={200}
                fieldLabel="Speech"
                fieldType="select"
                fieldName="speechLkey"
                selectData={speechAssLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={generalAssessment}
                setRecord={setGeneralAssessment}
                disabled={isDisabledField}
                searchable={false}
              />
              <MyInput
                column
                width={200}
                fieldLabel="Mood/Behavior"
                fieldType="select"
                fieldName="moodBehaviorLkey"
                selectData={moodLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={generalAssessment}
                setRecord={setGeneralAssessment}
                disabled={isDisabledField}
                searchable={false}
              />
              <MyInput
                column
                width={200}
                fieldLable="Memory Remote"
                fieldName="memoryRemote"
                fieldType="checkbox"
                record={generalAssessment}
                setRecord={setGeneralAssessment}
                disabled={isDisabledField}
              />
              <MyInput
                column
                width={200}
                fieldLable="Memory Recent"
                fieldName="memoryRecent"
                fieldType="checkbox"
                record={generalAssessment}
                setRecord={setGeneralAssessment}
                disabled={isDisabledField}
              />
              <MyInput
                column
                width={200}
                fieldLable="Signs of Agitation"
                fieldName="signsOfAgitation"
                fieldType="checkbox"
                record={generalAssessment}
                setRecord={setGeneralAssessment}
                disabled={isDisabledField}
              />
              <MyInput
                column
                width={200}
                fieldLable="Signs of Depression"
                fieldName="signsOfDepression"
                fieldType="checkbox"
                record={generalAssessment}
                setRecord={setGeneralAssessment}
                disabled={isDisabledField}
              />
              <MyInput
                column
                width={200}
                fieldLable="Signs of Suicidal Ideation"
                fieldName="signsOfSuicidalIdeation"
                fieldType="checkbox"
                record={generalAssessment}
                setRecord={setGeneralAssessment}
                disabled={isDisabledField}
              />
              <MyInput
                column
                width={200}
                fieldLable="Signs of Substance Use"
                fieldName="signsOfSubstanceUse"
                fieldType="checkbox"
                record={generalAssessment}
                setRecord={setGeneralAssessment}
                disabled={isDisabledField}
              />

              <MyLabel className="label-size" label={<h6>Supporting Members</h6>} />

              <MyInput
                column
                width={200}
                fieldLable="Living Condition"
                fieldName="livingCondition"
                record={generalAssessment}
                setRecord={setGeneralAssessment}
                disabled={isDisabledField}
              />
              <MyInput
                column
                width={200}
                fieldLable="Patient Need Help"
                fieldName="patientNeedHelp"
                fieldType="checkbox"
                record={generalAssessment}
                setRecord={setGeneralAssessment}
                disabled={isDisabledField}
              />

              <div className="repositioning-container">
                <MyTagInput
                  tags={tags}
                  setTags={setTags}
                  labelText="Supporting Members"
                  width="200px"
                  fontSize="13px"
                />

                <MyInput
                  column
                  width={200}
                  fieldLabel="Family Location"
                  fieldType="select"
                  fieldName="familyLocationLkey"
                  selectData={countryLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={generalAssessment}
                  setRecord={setGeneralAssessment}
                  disabled={isDisabledField}
                  searchable={false}
                />
              </div>
            </Form>
          </div>
        )}
        actionButtonFunction={() => {
          setGeneralAssessmentOpen(false);
        }}
        steps={[
          {
            title: 'General Assessment',
            icon: <FontAwesomeIcon icon={faClipboardList} />
          }
        ]}
      />
      <MyModal
        open={functionalAssessmentOpen}
        setOpen={setFunctionalAssessmentOpen}
        title="Fill Functional Assessment"
        size="32vw"
        bodyheight="80vh"
        position="right"
        content={() => (
          <Form fluid layout="inline">
            <MyInput
              column
              width={200}
              fieldLable="Mobility / Ambulation"
              fieldName="mobilityAmbulation"
              fieldType="checkbox"
              record={functionalAssessment}
              setRecord={setFunctionalAssessment}
              disabled={isDisabledField}
              unCheckedLabel="Independent"
              checkedLabel=" Needs assistance"
            />
            <MyInput
              column
              width={200}
              fieldLable="Transferring (Bed ↔ Wheelchair)"
              fieldName="transferringBedChair"
              fieldType="checkbox"
              record={functionalAssessment}
              setRecord={setFunctionalAssessment}
              disabled={isDisabledField}
              unCheckedLabel="Independent"
              checkedLabel=" Needs assistance"
            />
            <MyInput
              column
              width={200}
              fieldLable="Stair Climbing Ability"
              fieldName="stairClimbingAbility"
              fieldType="checkbox"
              record={functionalAssessment}
              setRecord={setFunctionalAssessment}
              disabled={isDisabledField}
              unCheckedLabel="Independent"
              checkedLabel=" Needs assistance"
            />
            <MyInput
              column
              width={200}
              fieldLable="Feeding (Eating ability)"
              fieldName="feeding"
              fieldType="checkbox"
              record={functionalAssessment}
              setRecord={setFunctionalAssessment}
              disabled={isDisabledField}
              unCheckedLabel="Independent"
              checkedLabel=" Needs assistance"
            />
            <MyInput
              column
              width={200}
              fieldLable="Toileting Ability"
              fieldName="toiletingAbility"
              fieldType="checkbox"
              record={functionalAssessment}
              setRecord={setFunctionalAssessment}
              disabled={isDisabledField}
              unCheckedLabel="Independent"
              checkedLabel=" Needs assistance"
            />
            <MyInput
              column
              width={200}
              fieldLable="Dressing Ability"
              fieldName="dressingAbility"
              fieldType="checkbox"
              record={functionalAssessment}
              setRecord={setFunctionalAssessment}
              disabled={isDisabledField}
              unCheckedLabel="Independent"
              checkedLabel=" Needs assistance"
            />
            <MyInput
              column
              width={200}
              fieldLable="Bathing Ability"
              fieldName="bathingAbility"
              fieldType="checkbox"
              record={functionalAssessment}
              setRecord={setFunctionalAssessment}
              disabled={isDisabledField}
              unCheckedLabel="Independent"
              checkedLabel=" Needs assistance"
            />
            <MyInput
              column
              width={200}
              fieldLable="Grooming Ability"
              fieldName="groomingAbility"
              fieldType="checkbox"
              record={functionalAssessment}
              setRecord={setFunctionalAssessment}
              disabled={isDisabledField}
              unCheckedLabel="Independent"
              checkedLabel=" Needs assistance"
            />
            <MyInput
              column
              width={200}
              fieldLable="Walking Distance"
              fieldName="walkingDistance"
              fieldType="checkbox"
              record={functionalAssessment}
              setRecord={setFunctionalAssessment}
              disabled={isDisabledField}
              unCheckedLabel="Unlimited"
              checkedLabel="Limited"
            />
            <MyInput
              column
              width={200}
              fieldLable="Balance (Standing/Sitting)"
              fieldName="balance"
              fieldType="checkbox"
              record={functionalAssessment}
              setRecord={setFunctionalAssessment}
              disabled={isDisabledField}
              unCheckedLabel="Stable"
              checkedLabel="Unable"
            />
            <MyInput
              column
              width={200}
              fieldLable="Urinary Continence"
              fieldName="urinaryContinence"
              fieldType="checkbox"
              record={functionalAssessment}
              setRecord={setFunctionalAssessment}
              disabled={isDisabledField}
            />
            <MyInput
              column
              width={200}
              fieldLable="Bowel Continence"
              fieldName="bowelContinence"
              fieldType="checkbox"
              record={functionalAssessment}
              setRecord={setFunctionalAssessment}
              disabled={isDisabledField}
            />
            <MyInput
              column
              width={200}
              fieldLable="Use of Assistive Devices"
              fieldName="useOfAssistiveDevices"
              fieldType="checkbox"
              record={functionalAssessment}
              setRecord={setFunctionalAssessment}
              disabled={isDisabledField}
            />
            <MyInput
              column
              width={200}
              fieldLable="Need for Assistance in ADLs"
              fieldName="needForAssistance"
              fieldType="checkbox"
              record={functionalAssessment}
              setRecord={setFunctionalAssessment}
              disabled={isDisabledField}
            />
            <MyInput
              column
              width={200}
              fieldLable="Fall History"
              fieldName="fallHistory"
              fieldType="checkbox"
              record={functionalAssessment}
              setRecord={setFunctionalAssessment}
              disabled={isDisabledField}
            />
            <MyInput
              column
              width={200}
              fieldLable="Pain during Movement"
              fieldName="painDuringMovement"
              fieldType="checkbox"
              record={functionalAssessment}
              setRecord={setFunctionalAssessment}
              disabled={isDisabledField}
            />
            <MyInput
              column
              width={200}
              fieldLable="Need for Rehab/PT Referral"
              fieldName="needForRehab"
              fieldType="checkbox"
              record={functionalAssessment}
              setRecord={setFunctionalAssessment}
              disabled={isDisabledField}
            />
          </Form>
        )}
        actionButtonFunction={() => {
          setFunctionalAssessmentOpen(false);
        }}
        steps={[
          {
            title: 'Functional Assessment',
            icon: <FontAwesomeIcon icon={faClipboardList} />
          }
        ]}
      />
    </div>
  );
};

export default NursingReportAssesments;
