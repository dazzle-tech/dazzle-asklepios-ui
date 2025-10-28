import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { useAppDispatch } from '@/hooks';
import { useSaveWarningsMutation } from '@/services/observationService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { newApVisitWarning } from '@/types/model-types-constructor';
import { notify } from '@/utils/uiReducerActions';
import { faWarning, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import clsx from 'clsx';
import React, { useState } from 'react';
import { Col, Form, Row } from 'rsuite';
const DetailsModal = ({
  open,
  setOpen,
  warning,
  setWarning,
  fetchwarnings,
  patient,
  encounter,
  editing,
  edit
}) => {
  const [editDate, setEditDate] = useState({ editdate: true });
  const [editSourceof, seteditSourceof] = useState({ editSource: true });
  const [showAllFields, setShowAllFields] = useState(false);
  const dispatch = useAppDispatch();
  const { data: warningTypeLovQueryResponse } = useGetLovValuesByCodeQuery('MED_WARNING_TYPS');
  const { data: severityLovQueryResponse } = useGetLovValuesByCodeQuery('SEVERITY');
  const { data: sourceofinformationLovQueryResponse } = useGetLovValuesByCodeQuery('RELATION');
  const [saveWarning, saveWarningMutation] = useSaveWarningsMutation();
  const handleSave = async () => {
    try {
      const Response = await saveWarning({
        ...warning,
        patientKey: patient.key,
        visitKey: encounter.key,
        statusLkey: '9766169155908512',
        firstTimeRecorded: warning.firstTimeRecorded
          ? new Date(warning.firstTimeRecorded).getTime()
          : null
      }).unwrap();
      setWarning({ ...newApVisitWarning });
      dispatch(notify('saved  Successfully'));

      //  setShowPrev(false);
      setOpen(false);
      await fetchwarnings();

      handleClear();
      //setShowPrev(true);
    } catch (error) {
      dispatch(notify('Save Failed'));
      console.error('An error occurred:', error);
    }
  };
  const handleClear = () => {
    setWarning({
      ...newApVisitWarning,
      sourceOfInformationLkey: null,
      severityLkey: null,
      warningTypeLkey: null
    });

    setEditDate({ editdate: true });
    seteditSourceof({ editSource: true });
  };
  return (
    <>
      <MyModal
        open={open}
        setOpen={setOpen}
        title="Add Warning"
        actionButtonFunction={handleSave}
        isDisabledActionBtn={
          !edit ? (warning.statusLvalue?.valueCode == 'ARS_CANCEL' ? true : false) : true
        }
        size="40vw"
        position="right"
        steps={[
          {
            title: 'Warning',
            icon: <FontAwesomeIcon icon={faWarning} />,
            footer: <MyButton onClick={handleClear}>Clear</MyButton>
          }
        ]}
        content={
          <div
            className={clsx({
              'disabled-panel': edit || warning.statusLvalue?.valueCode === 'ARS_CANCEL'
            })}
          >
            <Form fluid>
              {/* First Row - Always Visible (Warning Type, Warning, Severity) */}
              <Row className="rows-gap">
                <Col md={8}>
                  <MyInput
                    disabled={editing}
                    width="100%"
                    fieldType="select"
                    fieldLabel="Warning Type"
                    selectData={warningTypeLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    fieldName={'warningTypeLkey'}
                    record={warning}
                    setRecord={setWarning}
                  />
                </Col>
                <Col md={8}>
                  <MyInput
                    disabled={editing}
                    width="100%"
                    fieldName={'warning'}
                    record={warning}
                    setRecord={setWarning}
                  />
                </Col>
                <Col md={8}>
                  <MyInput
                    disabled={editing}
                    width="100%"
                    fieldType="select"
                    fieldLabel="Severity"
                    selectData={severityLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    fieldName={'severityLkey'}
                    record={warning}
                    setRecord={setWarning}
                    searchable={false}
                  />
                </Col>
              </Row>

              {/* Show All Fields Button */}
              <Row className="rows-gap">
                <Col md={24}>
                  <MyButton
                    prefixIcon={() => (
                      <FontAwesomeIcon icon={showAllFields ? faChevronUp : faChevronDown} />
                    )}
                    onClick={() => setShowAllFields(!showAllFields)}
                    color="var(--primary-blue)"
                  >
                    {showAllFields ? 'Hide Details' : 'Show All'}
                  </MyButton>
                </Col>
              </Row>

              {/* Additional fields - shown only when showAllFields is true */}
              {showAllFields && (
                <>
                  <Row className="rows-gap">
                    <Col md={12}>
                      <MyInput
                        width="100%"
                        fieldLabel="Notes"
                        fieldType="textarea"
                        fieldName="notes"
                        height={100}
                        record={warning}
                        setRecord={setWarning}
                        disabled={editing}
                      />
                    </Col>
                    <Col md={12}>
                      <Row>
                        <Col md={12}>
                          <MyInput
                            disabled={editSourceof.editSource}
                            width="100%"
                            fieldType="select"
                            fieldLabel="Source of Information"
                            selectData={sourceofinformationLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            fieldName={'sourceOfInformationLkey'}
                            record={warning}
                            setRecord={setWarning}
                            searchable={false}
                          />
                        </Col>
                        <Col md={12}>
                          <MyInput
                            fieldLabel="By Patient"
                            fieldName="editSource"
                            width="100%"
                            fieldType="checkbox"
                            record={editSourceof}
                            setRecord={seteditSourceof}
                          />
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                  <Col md={12}>
                    <MyInput
                      width="100%"
                      fieldLabel="Action Taken"
                      fieldType="textarea"
                      fieldName="actionTake"
                      height={100}
                      record={warning}
                      setRecord={setWarning}
                      disabled={editing}
                    />
                  </Col>
                  <Row className="rows-gap">
                    <Col md={12}>
                      <Row>
                        <Col md={12}>
                          <MyInput
                            disabled={editDate.editdate}
                            width="100%"
                            fieldName="firstTimeRecorded"
                            fieldType="date"
                            record={warning}
                            setRecord={setWarning}
                          />
                        </Col>
                        <Col md={12}>
                          <MyInput
                            fieldLabel="Undefined"
                            fieldName="editdate"
                            width="100%"
                            fieldType="checkbox"
                            record={editDate}
                            setRecord={setEditDate}
                          />
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                </>
              )}
            </Form>
          </div>
        }
      />
    </>
  );
};
export default DetailsModal;
