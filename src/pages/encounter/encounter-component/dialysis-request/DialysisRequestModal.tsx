import React, { useState } from 'react';
import SectionContainer from '@/components/SectionsoContainer';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import { Form, RadioGroup, Radio } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSquarePlus, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import MyModal from '@/components/MyModal/MyModal';
import { faGetPocket } from '@fortawesome/free-brands-svg-icons';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { Whisper, Tooltip } from 'rsuite';
import RecallProtocolModal from './RecallProtocolModal';
import './styles.less';

//declares
const DialysisRequestModal = ({}) => {
  const [formData, setFormData] = useState<any>({});
  const [showAddProtocol, setShowAddProtocol] = useState(false);
  const [openRecallProtocolModal, setOpenRecallProtocolModal] = useState(false);
  const handleChange = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  //add input by button click
  const [dialysateCompositions, setDialysateCompositions] = useState<number[]>([0]);

  const handleAddComposition = () => {
    setDialysateCompositions(prev => [...prev, prev.length]);
  };

  const handleCompositionChange = (index: number, value: any) => {
    const updatedList = [...(formData.dialysateCompositionList ?? [])];
    updatedList[index] = value;
    setFormData(prev => ({ ...prev, dialysateCompositionList: updatedList }));
  };

  //LOV's
  const { data: dialysisTypeLov } = useGetLovValuesByCodeQuery('DIALYSIS_TYPE');
  const { data: dialysisFrequencyLov } = useGetLovValuesByCodeQuery('DIALYSIS_FREQUENCY');
  const { data: orderPriorityLov } = useGetLovValuesByCodeQuery('ORDER_PRIORITY');
  const { data: departmentLov } = useGetLovValuesByCodeQuery('DEPARTMENTS');

  const renderAddToProtocolsModal = () =>
    showAddProtocol && (
      <div className="add-protocol-popup">
        <Form fluid>
          <MyInput
            fieldType="text"
            placeholder="Protocol Name"
            fieldName="protocolName"
            showLabel={false}
            record={formData}
            setRecord={setFormData}
          />
        </Form>
        <Whisper placement="top" trigger="hover" speaker={<Tooltip>Save Protocol</Tooltip>}>
          <FontAwesomeIcon
            icon={faCircleCheck}
            onClick={() => setShowAddProtocol(false)}
            style={{
              color: 'var(--primary-green)',
              fontSize: '24px',
              cursor: 'pointer',
              marginTop: '0.4vw'
            }}
          />
        </Whisper>
      </div>
    );

  return (
    <>
      <Form fluid>
        <div className="section-row-dialysis-request-modal">
          <SectionContainer
            title="Order Details"
            content={
              <>
                <div className="input-row-dialysis-request-modal">
                  <MyInput
                    fieldType="select"
                    fieldLabel="Dialysis Type"
                    fieldName="dialysisType"
                    selectData={dialysisTypeLov?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={formData}
                    searchable={false}
                    width={'100%'}
                    setRecord={setFormData}
                  />
                  <MyInput
                    fieldType="select"
                    fieldLabel="Frequency Type"
                    fieldName="frequency"
                    selectData={dialysisFrequencyLov?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    searchable={false}
                    record={formData}
                    width={'100%'}
                    setRecord={setFormData}
                  />
                </div>

                <div className="input-row-dialysis-request-modal">
                  <MyInput
                    fieldType="text"
                    fieldLabel="Reason"
                    fieldName="reason"
                    record={formData}
                    width={'100%'}
                    setRecord={setFormData}
                  />
                  <MyInput
                    fieldType="select"
                    fieldLabel="Priority"
                    fieldName="priority"
                    selectData={orderPriorityLov?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    searchable={false}
                    record={formData}
                    width={'100%'}
                    setRecord={setFormData}
                  />
                </div>

                <div className="input-row-dialysis-request-modal">
                  <MyInput
                    fieldType="select"
                    fieldLabel="Department"
                    fieldName="department"
                    selectSource="departments"
                    width={'100%'}
                    record={formData}
                    setRecord={setFormData}
                  />
                  <MyInput
                    fieldType="date"
                    fieldLabel="Scheduled Date"
                    fieldName="scheduledDate"
                    width={'100%'}
                    record={formData}
                    setRecord={setFormData}
                  />
                </div>
              </>
            }
          />

          <SectionContainer
            title="Clinical Parameters"
            content={
              <>
                <div className="input-row-dialysis-request-modal">
                  <MyInput
                    fieldType="number"
                    fieldLabel="Dry Weight"
                    fieldName="dryWeight"
                    record={formData}
                    setRecord={setFormData}
                    rightAddon="kg"
                    rightAddonwidth="auto"
                    width={'100%'}
                  />
                  <MyInput
                    fieldType="number"
                    fieldLabel="Current Weight (kg)"
                    fieldName="currentWeight"
                    record={formData}
                    setRecord={setFormData}
                    rightAddon="kg"
                    rightAddonwidth="auto"
                    width={'100%'}
                  />
                </div>

                <div className="input-row-dialysis-request-modal">
                  <MyInput
                    fieldType="number"
                    fieldLabel="BP"
                    fieldName="bp"
                    record={formData}
                    setRecord={setFormData}
                    rightAddon="Hmmg"
                    rightAddonwidth="auto"
                    width={'100%'}
                  />
                  <MyInput
                    fieldType="number"
                    fieldLabel="Pulse"
                    fieldName="pulse"
                    record={formData}
                    setRecord={setFormData}
                    rightAddon="bpm"
                    width={'100%'}
                    rightAddonwidth="auto"
                  />
                </div>

                <div className="input-row-dialysis-request-modal">
                  <MyInput
                    fieldType="number"
                    fieldLabel="Temp"
                    fieldName="temperature"
                    record={formData}
                    setRecord={setFormData}
                    rightAddon="°C"
                    width={'100%'}
                    rightAddonwidth="auto"
                  />
                  <div className="empty-space" />
                </div>

                <div className="radio-group-field">
                  <label>Access Type</label>
                  <RadioGroup
                    className="radio-buttons-dialysis-request"
                    name="accessType"
                    inline
                    value={formData.accessType}
                    onChange={value => handleChange('accessType', value)}
                  >
                    <Radio value="AV fistula">AV fistula</Radio>
                    <Radio value="AV graft">AV graft</Radio>
                    <Radio value="Central line">Central line</Radio>
                    <Radio value="Catheter">Catheter</Radio>
                  </RadioGroup>
                </div>
              </>
            }
          />
        </div>
        <div className="section-row-dialysis-request-modal">
          <SectionContainer
            title="Lab Results"
            content={
              <>
                <div className="input-row-dialysis-request-modal">
                  <MyInput
                    fieldType="number"
                    fieldLabel="CREATININE"
                    fieldName="creatinine"
                    record={formData}
                    setRecord={setFormData}
                    width={'100%'}
                  />
                  <MyInput
                    fieldType="number"
                    fieldLabel="BUN"
                    fieldName="bun"
                    record={formData}
                    setRecord={setFormData}
                    width={'100%'}
                  />
                </div>

                <div className="input-row-dialysis-request-modal">
                  <MyInput
                    fieldType="number"
                    fieldLabel="POTASSIUM"
                    fieldName="potassium"
                    record={formData}
                    setRecord={setFormData}
                    width={'100%'}
                  />
                  <MyInput
                    fieldType="number"
                    fieldLabel="SODIUM"
                    fieldName="sodium"
                    record={formData}
                    setRecord={setFormData}
                    width={'100%'}
                  />
                </div>

                <div className="input-row-dialysis-request-modal">
                  <MyInput
                    fieldType="number"
                    fieldLabel="HB"
                    fieldName="hb"
                    record={formData}
                    setRecord={setFormData}
                    width={'100%'}
                  />
                  <MyInput
                    fieldType="number"
                    fieldLabel="HCT"
                    fieldName="hct"
                    record={formData}
                    setRecord={setFormData}
                    width={'100%'}
                  />
                </div>

                <MyButton prefixIcon={() => <FontAwesomeIcon icon={faGetPocket} />}>
                  Fetch Results
                </MyButton>
              </>
            }
          />

          <SectionContainer
            title="Dialysis Prescription"
            content={
              <>
                <div className="dialysis-prescription-horizontal-row">
                  <div className="equal-item">
                    <MyButton
                      appearance="ghost"
                      onClick={() => setOpenRecallProtocolModal(true)}
                      style={{ width: '100%' }}
                    >
                      Recall Protocol
                    </MyButton>
                  </div>

                  <div className="equal-item">
                    <MyInput
                      fieldType="select"
                      fieldLabel="Dialyzer Type"
                      fieldName="dialyzerType"
                      selectCode="DIALYZER_TYPE"
                      record={formData}
                      setRecord={setFormData}
                      width="100%"
                    />
                  </div>
                </div>

                <div className="input-row-dialysis-request-modal">
                  <MyInput
                    width={'100%'}
                    fieldType="number"
                    fieldLabel="Blood Flow Rate (Qb)"
                    fieldName="bloodFlow"
                    record={formData}
                    setRecord={setFormData}
                    rightAddon="ml/min"
                    rightAddonwidth="auto"
                    inputColor={
                      Number(formData.bloodFlow) < 200 || Number(formData.bloodFlow) > 500
                        ? 'danger'
                        : ''
                    }
                  />

                  <MyInput
                    width={'100%'}
                    fieldType="number"
                    fieldLabel="Dialysate Flow Rate (Qd)"
                    fieldName="dialysateFlow"
                    record={formData}
                    setRecord={setFormData}
                    rightAddon="ml/min"
                    rightAddonwidth="auto"
                    inputColor={
                      Number(formData.dialysateFlow) < 500 || Number(formData.dialysateFlow) > 800
                        ? 'danger'
                        : ''
                    }
                  />
                </div>

                <div className="dialysate-composition-wrapper">
                  {dialysateCompositions.map((_, index) => {
                    if (index % 2 !== 0) return null;

                    const hasSecondInput = dialysateCompositions.length > index + 1;
                    const isLastPair =
                      index === dialysateCompositions.length - 1 ||
                      index === dialysateCompositions.length - 2;

                    return (
                      <div className="composition-row" key={`row-${index}`}>
                        {/* Input 1 */}
                        <div className="input-wrapper">
                          <MyInput
                            fieldType="number"
                            fieldLabel={`Dialysate Composition ${index + 1}`}
                            fieldName={`dialysateComposition_${index}`}
                            record={formData}
                            setRecord={setFormData}
                            width="100%"
                            rightAddon="mmol/L"
                            rightAddonwidth="auto"
                          />
                        </div>

                        {/* Input 2 */}
                        <div className="input-wrapper">
                          {hasSecondInput ? (
                            <MyInput
                              fieldType="number"
                              fieldLabel={`Dialysate Composition ${index + 2}`}
                              fieldName={`dialysateComposition_${index + 1}`}
                              record={formData}
                              setRecord={setFormData}
                              width="100%"
                              rightAddon="mmol/L"
                              rightAddonwidth="auto"
                            />
                          ) : (
                            <div className="empty-placeholder" />
                          )}
                        </div>

                        {/* Add icon */}
                        <div className="add-icon-wrapper">
                          {isLastPair ? (
                            <Whisper
                              placement="top"
                              trigger="hover"
                              speaker={<Tooltip>Add Dialysate Composition</Tooltip>}
                            >
                              <FontAwesomeIcon
                                icon={faSquarePlus}
                                onClick={handleAddComposition}
                                style={{
                                  fontSize: '24px',
                                  cursor: 'pointer',
                                  color: '#cececeff',
                                  marginBottom: '4px'
                                }}
                              />
                            </Whisper>
                          ) : (
                            <div className="icon-placeholder" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="input-row-dialysis-request-modal-save-to-protocols">
                  <MyButton onClick={() => setShowAddProtocol(true)}>Save to Protocols</MyButton>
                  {renderAddToProtocolsModal()}
                </div>
              </>
            }
          />
        </div>
      </Form>

      <MyModal
        open={openRecallProtocolModal}
        setOpen={setOpenRecallProtocolModal}
        title="Encounter Logs"
        size="30vw"
        position="right"
        content={<RecallProtocolModal />}
        actionButtonLabel="Close"
        actionButtonFunction={() => setOpenRecallProtocolModal(false)}
        cancelButtonLabel="Cancel"
      />
    </>
  );
};

export default DialysisRequestModal;
