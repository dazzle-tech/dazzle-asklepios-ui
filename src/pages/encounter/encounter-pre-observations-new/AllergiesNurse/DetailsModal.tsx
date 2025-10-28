import React, { useEffect, useState } from 'react';
import './styles.less';
import MyModal from '@/components/MyModal/MyModal';
import MyButton from '@/components/MyButton/MyButton';
import {
  faPersonDotsFromLine,
  faChevronDown,
  faChevronUp
} from '@fortawesome/free-solid-svg-icons';
import { Col, Form, Input, Row } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import MyInput from '@/components/MyInput';
import { useGetLovValuesByCodeQuery, useGetAllergensQuery } from '@/services/setupService';
import { initialListRequest } from '@/types/types';
import { useSaveAllergiesMutation } from '@/services/observationService';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';
import clsx from 'clsx';
const DetailsModal = ({
  open,
  setOpen,
  allerges,
  setAllerges,
  edit,
  patient,
  encounter,
  handleClear,
  fetchallerges,
  openToAdd
}) => {
  const dispatch = useAppDispatch();
  const { data: allergyTypeLovQueryResponse } = useGetLovValuesByCodeQuery('ALLERGEN_TYPES');
  const { data: severityLovQueryResponse } = useGetLovValuesByCodeQuery('SEVERITY');
  const { data: onsetLovQueryResponse } = useGetLovValuesByCodeQuery('ONSET');
  const { data: reactionLovQueryResponse } = useGetLovValuesByCodeQuery('ALLRGY_REACTION_TYP');
  const { data: treatmentstrategyLovQueryResponse } = useGetLovValuesByCodeQuery('TREAT_STRATGY');
  const { data: sourceofinformationLovQueryResponse } = useGetLovValuesByCodeQuery('RELATION');
  const { data: allgPropnLovQueryResponse } = useGetLovValuesByCodeQuery('ALLG_PROPN');
  const { data: criticalityLovQueryResponse } = useGetLovValuesByCodeQuery('CRITICALITY');
  const [saveAllergies, saveAllergiesMutation] = useSaveAllergiesMutation();
  const [editOnset, setEditOnset] = useState({ editdate: true });
  const [reactionDescriptionList, setReactionDescriptionList] = useState([]);
  const [reaction, setReaction] = useState(null);
  const [slectReaction, setSelectReaction] = useState({ reaction: null });
  const [editSourceof, seteditSourceof] = useState({ editSource: true });
  const [showAllFields, setShowAllFields] = useState(false);
  const { data: allergensListResponse } = useGetAllergensQuery({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'allergen_type_lkey',
        operator: 'match',
        value: allerges.allergyTypeLkey
      }
    ]
  });

  useEffect(() => {
    if (allerges.key !== null) {
      const prevreaction = allerges.reactionDescription?.split(',');
      setReactionDescriptionList(prevreaction);
      if (allerges.onsetDate != 0) {
        setEditOnset({ editdate: false });
      }
      if (allerges.sourceOfInformationLkey != null) {
        seteditSourceof({ editSource: false });
      }
    }
  }, [allerges]);

  useEffect(() => {
    if (editOnset.editdate) {
      setAllerges({ ...allerges, onsetDate: 0 });
    }
  }, [editOnset.editdate]);

  useEffect(() => {
    if (openToAdd) {
      handleClear();
      setReaction(null);
      setReactionDescriptionList([]);
      setSelectReaction(null);
    }
  }, [openToAdd]);

  useEffect(() => {
    setReaction(joinValuesFromArray(reactionDescriptionList));
  }, [reactionDescriptionList]);

  useEffect(() => {
    if (slectReaction?.reaction != null) {
      const foundItem = reactionLovQueryResponse?.object?.find(
        item => item.key === slectReaction?.reaction
      );

      const value = foundItem?.lovDisplayVale;

      if (value) {
        setReactionDescriptionList(prev => [...prev, foundItem?.lovDisplayVale]);
      } else {
      }
    }
  }, [slectReaction?.reaction]);

  const handleSave = async () => {
    try {
      await saveAllergies({
        ...allerges,
        patientKey: patient?.key,
        visitKey: encounter?.key,
        statusLkey: '9766169155908512',
        reactionDescription: reaction,
        onsetDate: allerges.onsetDate ? new Date(allerges.onsetDate).getTime() : null
      }).unwrap();
      dispatch(notify({ msg: 'Saved Successfully', sev: 'success' }));
      setOpen(false);
      await fetchallerges();
      await handleClear();
    } catch (error) {
      dispatch(notify({ msg: 'Save Failed', sev: 'error' }));
    }
  };
  const joinValuesFromArray = values => {
    return values?.filter(Boolean)?.join(', ');
  };

  return (
    <>
      <MyModal
        open={open}
        setOpen={setOpen}
        title="Add Allergy"
        actionButtonFunction={handleSave}
        isDisabledActionBtn={
          !edit ? (allerges.statusLvalue?.valueCode == 'ARS_CANCEL' ? true : false) : true
        }
        size="40vw"
        position="right"
        steps={[
          {
            title: 'Allergy',
            icon: <FontAwesomeIcon icon={faPersonDotsFromLine} />,
            footer: <MyButton onClick={handleClear}>Clear</MyButton>
          }
        ]}
        content={
          <div
            className={clsx({
              'disabled-panel': edit || allerges.statusLvalue?.valueCode === 'ARS_CANCEL'
            })}
          >
            <Form fluid>
              {/* First Row - Always Visible */}
              <Row className="rows-gap">
                <Col md={8}>
                  <MyInput
                    width="100%"
                    fieldType="select"
                    fieldLabel="Allergy Type"
                    selectData={allergyTypeLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    fieldName={'allergyTypeLkey'}
                    record={allerges}
                    setRecord={setAllerges}
                    searchable={false}
                  />
                </Col>
                <Col md={8}>
                  <MyInput
                    width="100%"
                    fieldType="select"
                    fieldLabel="Allergen"
                    selectData={allergensListResponse?.object ?? []}
                    selectDataLabel="allergenName"
                    selectDataValue="key"
                    fieldName={'allergenKey'}
                    record={allerges}
                    setRecord={setAllerges}
                    searchable={false}
                  />
                </Col>
                <Col md={8}>
                  <MyInput
                    width="100%"
                    fieldType="select"
                    fieldLabel="Severity"
                    selectData={severityLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    fieldName={'severityLkey'}
                    record={allerges}
                    setRecord={setAllerges}
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
                    <Col md={8}>
                      <MyInput
                        width="100%"
                        fieldType="select"
                        fieldLabel="Criticality"
                        selectData={criticalityLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        fieldName={'criticalityLkey'}
                        record={allerges}
                        setRecord={setAllerges}
                        searchable={false}
                      />
                    </Col>
                    <Col md={8}>
                      <MyInput
                        width="100%"
                        fieldName={'certainty'}
                        record={allerges}
                        setRecord={setAllerges}
                      />
                    </Col>
                    <Col md={8}>
                      <MyInput
                        width="100%"
                        fieldType="select"
                        fieldLabel="Treatment Strategy"
                        selectData={treatmentstrategyLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        fieldName={'treatmentStrategyLkey'}
                        record={allerges}
                        setRecord={setAllerges}
                        searchable={false}
                      />
                    </Col>
                  </Row>
                  <Row className="rows-gap">
                    <Col md={8}>
                      <MyInput
                        width="100%"
                        fieldType="select"
                        fieldLabel="Onset"
                        selectData={onsetLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        fieldName={'onsetLkey'}
                        record={allerges}
                        setRecord={setAllerges}
                        searchable={false}
                      />
                    </Col>
                    <Col md={8}>
                      <MyInput
                        width="100%"
                        fieldType="date"
                        fieldName="onsetDate"
                        record={allerges}
                        setRecord={setAllerges}
                        disabled={editOnset.editdate}
                      />
                    </Col>
                    <Col md={8}>
                      <MyInput
                        fieldLabel="Undefined"
                        fieldName="editdate"
                        width="100%"
                        fieldType="checkbox"
                        record={editOnset}
                        setRecord={setEditOnset}
                      />
                    </Col>
                  </Row>
                  <Row className="rows-gap">
                    <Col md={8}>
                      <MyInput
                        width="100%"
                        fieldType="select"
                        fieldLabel="Type of Propensity"
                        selectData={allgPropnLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        fieldName={'typeOfPropensityLkey'}
                        record={allerges}
                        setRecord={setAllerges}
                        searchable={false}
                      />
                    </Col>
                    <Col md={8}>
                      <Form fluid>
                        <MyInput
                          disabled={editSourceof.editSource}
                          width="100%"
                          fieldType="select"
                          fieldLabel="Source of Information"
                          selectData={sourceofinformationLovQueryResponse?.object ?? []}
                          selectDataLabel="lovDisplayVale"
                          selectDataValue="key"
                          fieldName={'sourceOfInformationLkey'}
                          record={allerges}
                          setRecord={setAllerges}
                        />
                      </Form>
                    </Col>
                    <Col md={8}>
                      <Form fluid>
                        <MyInput
                          fieldLabel="BY Patient"
                          fieldName="editSource"
                          width="100%"
                          fieldType="checkbox"
                          record={editSourceof}
                          setRecord={seteditSourceof}
                        />
                      </Form>
                    </Col>
                  </Row>
                  <Row className="rows-gap">
                    <Col md={12}>
                      <Row>
                        <Col md={24}>
                          <MyInput
                            width="100%"
                            fieldType="select"
                            fieldLabel="Allergic Reactions"
                            selectData={reactionLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            fieldName={'reaction'}
                            record={slectReaction}
                            setRecord={setSelectReaction}
                          />
                        </Col>
                      </Row>
                      <Row>
                        <Col md={24}>
                          <Input
                            as="textarea"
                            onChange={e => setReaction(e)}
                            value={reaction}
                            className="fill-width"
                            rows={2}
                          />
                        </Col>
                      </Row>
                    </Col>
                    <Col md={12}>
                      <MyInput
                        width="100%"
                        fieldLabel="Note"
                        fieldType="textarea"
                        fieldName="notes"
                        height={90}
                        record={allerges}
                        setRecord={setAllerges}
                      />
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
