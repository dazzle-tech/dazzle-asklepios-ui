import React, { useEffect, useState } from 'react';
import { Col, Form, Row } from 'rsuite';

import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';

import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';

import { PatientEncounter } from '@/types/model-types-new';

import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useUpdateEncounterMutation } from '@/services/encounters/patientEncounterService';

const Summary = ({
  list,
  encounter,
  setEncounter,
  system,
  ...props
}) => {
  const dispatch = useAppDispatch();

  const { data: bodySystemsDetailLovQueryResponse } =
    useGetLovValuesByCodeQuery('BODY_SYS_DETAIL');

  const [updateEncounter] = useUpdateEncounterMutation();

  const [localEncounter, setLocalEncounter] = useState<any>(
    encounter ?? {}
  );

  useEffect(() => {
    setLocalEncounter(encounter ?? {});
  }, [encounter]);

  const toEncounterPayload = (
    enc: any
  ): PatientEncounter => ({
    id: Number(enc?.id),
    patientId: Number(
      enc?.patientId ??
      enc?.patient?.id
    ),

    encounterNumber:
      enc?.encounterNumber ?? null,

    facilityId: Number(
      enc?.facilityId
    ),

    departmentId: Number(
      enc?.departmentId
    ),

    practitionerId:
      enc?.practitionerId ?? null,

    paymentDate:
      enc?.paymentDate,

    amount:
      enc?.amount,

    encounterType:
      enc?.encounterType,

    encounterReason:
      enc?.encounterReason,

    followUpEncounterId:
      enc?.followUpEncounterId ??
      enc?.followUpEncounter?.id ??
      null,

    priorityLevel:
      enc?.priorityLevel,

    originType:
      enc?.originType ?? null,

    originName:
      enc?.originName ?? null,

    notes:
      enc?.notes ?? null,

    departmentDailySequenceNumber:
      enc?.departmentDailySequenceNumber ??
      null,

    encounterDate:
      enc?.encounterDate ?? null,

    status:
      enc?.status,

    chiefComplaint:
      enc?.chiefComplaint ?? null,

    hasPrescription:
      Boolean(enc?.hasPrescription),

    hasOrder:
      Boolean(enc?.hasOrder),

    isObserved:
      Boolean(enc?.isObserved),

    physicalExaminationSummery:
      enc?.physicalExaminationSummery ??
      null
  });

  const saveChanges = async () => {
    try {
      const idToUpdate =
        localEncounter?.id;

      if (!idToUpdate) {
        dispatch(
          notify({
            msg: 'No encounter id to update',
            sev: 'error'
          })
        );
        return;
      }

      const payload =
        toEncounterPayload(
          localEncounter
        );

      if (
        !payload.patientId ||
        !payload.facilityId ||
        !payload.departmentId
      ) {
        dispatch(
          notify({
            msg:
              'Missing required fields: patientId / facilityId / departmentId',
            sev: 'error'
          })
        );

        return;
      }

      const updatedEncounter =
        await updateEncounter({
          id: idToUpdate,
          body: payload
        }).unwrap();

      setEncounter?.(
        updatedEncounter
      );

      dispatch(
        notify({
          msg: 'Saved Successfully',
          sev: 'success'
        })
      );
    } catch (err) {
      console.error(
        'Save Failed:',
        err
      );

      dispatch(
        notify({
          msg: 'Save Failed',
          sev: 'error'
        })
      );
    }
  };

  return (
    <>
      <div className="summery-div">
        {list?.map(
          (item, index) => (
            <div
              key={index}
              className="summery-div-child"
            >
              <p>
                {
                  system?.object?.find(
                    i =>
                      i.key ===
                      item.bodySystem
                  )?.lovDisplayVale
                }
              </p>

              <p>
                {item.systemDetailLvalue
                  ? item
                      .systemDetailLvalue
                      .lovDisplayVale
                  : item.systemDetailLkey}
              </p>

              <p>
                {
                  bodySystemsDetailLovQueryResponse?.object?.find(
                    i =>
                      i.key ===
                      item.systemDetail
                  )?.lovDisplayVale
                }
              </p>

              <p>
                {item.note}
              </p>
            </div>
          )
        )}
      </div>

      <Row className="mt-3">
        <Col md={24}>
          <Form fluid>
            <MyInput
              width="100%"
              fieldType="textarea"
              fieldLabel="Additional Findings Summary"
              fieldName="physicalExaminationSummery"
              record={localEncounter}
              setRecord={
                setLocalEncounter
              }
              disabled={props?.edit}
            />
          </Form>
        </Col>
      </Row>

      <Row className="mt-2">
        <Col md={3}>
          <MyButton
            onClick={
              saveChanges
            }
            disabled={props?.edit}
          >
            Save
          </MyButton>
        </Col>
      </Row>
    </>
  );
};

export default Summary;