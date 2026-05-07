import MyModal from '@/components/MyModal/MyModal';
import { faListCheck } from '@fortawesome/free-solid-svg-icons';
import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Col, Form, Row } from 'rsuite';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { notify } from '@/utils/uiReducerActions';
import { PatientEncounter } from '@/types/model-types-new';
import { useUpdateEncounterMutation } from '@/services/encounters/patientEncounterService';
import { useAppDispatch } from '@/hooks';

const Summary = ({ open, setOpen, list, encounter, setEncounter, system }) => {
  const { data: bodySystemsDetailLovQueryResponse } = useGetLovValuesByCodeQuery('BODY_SYS_DETAIL');
  const dispatch = useAppDispatch();
  const [updateEncounter] = useUpdateEncounterMutation();
  const [localEncounter, setLocalEncounter] = useState<any>(encounter ?? {});

  useEffect(() => {
    if (open) setLocalEncounter(encounter ?? {});
  }, [open, encounter]);

  const toEncounterPayload = (enc: any): PatientEncounter => ({
    id: Number(enc?.id),
    patientId: Number(enc?.patientId ?? enc?.patient?.id),
    encounterNumber: enc?.encounterNumber ?? null,
    facilityId: Number(enc?.facilityId),
    departmentId: Number(enc?.departmentId),
    practitionerId: enc?.practitionerId ?? null,
    paymentDate: enc?.paymentDate,
    amount: enc?.amount,
    encounterType: enc?.encounterType,
    encounterReason: enc?.encounterReason,
    followUpEncounterId: enc?.followUpEncounterId ?? enc?.followUpEncounter?.id ?? null,
    priorityLevel: enc?.priorityLevel,
    originType: enc?.originType ?? null,
    originName: enc?.originName ?? null,
    notes: enc?.notes ?? null,
    departmentDailySequenceNumber: enc?.departmentDailySequenceNumber ?? null,
    encounterDate: enc?.encounterDate ?? null,
    status: enc?.status,
    chiefComplaint: enc?.chiefComplaint ?? null,
    hasPrescription: Boolean(enc?.hasPrescription),
    hasOrder: Boolean(enc?.hasOrder),
    isObserved: Boolean(enc?.isObserved),
    physicalExaminationSummery: enc?.physicalExaminationSummery ?? null
  });

  const saveChanges = async () => {
    try {
      const idToUpdate = localEncounter?.id;

      if (!idToUpdate) {
        dispatch(notify({ msg: 'No encounter id to update', sev: 'error' }));
        return;
      }

      const payload = toEncounterPayload(localEncounter);

      if (!payload.patientId || !payload.facilityId || !payload.departmentId) {
        dispatch(
          notify({
            msg: 'Missing required fields: patientId / facilityId / departmentId',
            sev: 'error'
          })
        );
        return;
      }

      const updatedEncounter = await updateEncounter({
        id: idToUpdate,
        body: payload
      }).unwrap();

      if (typeof setEncounter === 'function') setEncounter(updatedEncounter);
      dispatch(notify({ msg: 'Saved Successfully', sev: 'success' }));
    } catch (err) {
      console.error('Save Failed:', err);
      dispatch(notify({ msg: 'Save Failed', sev: 'error' }));
    }
  };

  return (
    <>
      <MyModal
        position="right"
        open={open}
        setOpen={setOpen}
        title="Findings"
        hideActionBtn
        hideCancel
        steps={[
          {
            title: 'Findings',
            icon: <FontAwesomeIcon icon={faListCheck} />
          }
        ]}
        content={
          <Row>
            <div className="summery-div">
              {list?.map((item, index) => (
                <div key={index} className="summery-div-child">
                  <p>{system?.object?.find(i => i.key === item.bodySystem)?.lovDisplayVale}</p>
                  <p>
                    {item.systemDetailLvalue
                      ? item.systemDetailLvalue.lovDisplayVale
                      : item.systemDetailLkey}
                  </p>
                  <p>
                    {bodySystemsDetailLovQueryResponse?.object.find(
                      i => i.key === item.systemDetail
                    )?.lovDisplayVale}
                  </p>
                  <p>{item.note}</p>
                </div>
              ))}
            </div>
            <Row>
              <Col md={24}>
                <Form fluid>
                  <MyInput
                    width="100%"
                    fieldType="textarea"
                    fieldLabel="Additional Findings Summery"
                    fieldName="physicalExaminationSummery"
                    record={localEncounter}
                    setRecord={setLocalEncounter}
                  />
                </Form>
              </Col>
            </Row>
            <Row>
              <Col md={3}>
                <MyButton onClick={saveChanges}>Save</MyButton>
              </Col>
            </Row>
          </Row>
        }
      ></MyModal>
    </>
  );
};
export default Summary;
