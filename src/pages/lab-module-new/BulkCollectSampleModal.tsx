import React, { useEffect, useState } from 'react';
import { Form, Row, Col } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVialCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { DiagnosticOrderTestStatus } from '@/types/model-types-new';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';

import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useBulkCreateCollectedSampleSameMutation } from '@/services/setup/diagnosticTest/diagnosticOrderTestCollectedSampleService';

type BulkCollectSampleModalProps = {
  open: boolean;
  setOpen: (v: boolean) => void;
  orderId: number;
  selectedTests: any[];
  onSuccess?: () => void;
};

const BulkCollectSampleModal = ({
  open,
  setOpen,
  orderId,
  selectedTests,
  onSuccess
}: BulkCollectSampleModalProps) => {
  const dispatch = useAppDispatch();

  const { data: valueUnitLov } = useGetLovValuesByCodeQuery('VALUE_UNIT');
  const { data: sampleSourceLov } = useGetLovValuesByCodeQuery('SAMPLE_SOURCE');

  const [record, setRecord] = useState({
    quantity: null,
    unit: null,
    collectedAt: new Date(),
    sourceOfSample: null
  });

  const getOneWeekFromNow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d;
  };

  const [selectedExpiryDate, setSelectedExpiryDate] = useState({ dateTime: getOneWeekFromNow() });

  const [bulkCreate, { isLoading }] = useBulkCreateCollectedSampleSameMutation();

  const handleSave = async () => {
    if (
      !record.quantity ||
      !record.unit ||
      !record.collectedAt ||
      !record.sourceOfSample ||
      !selectedExpiryDate.dateTime
    ) {
      dispatch(notify({ msg: 'All fields are required', sev: 'warning' }));
      return;
    }

    const invalidTest = selectedTests.find(t =>
      [
        DiagnosticOrderTestStatus.RESULT_READY,
        DiagnosticOrderTestStatus.RESULT_APPROVED,
        DiagnosticOrderTestStatus.ACCEPTED,
        DiagnosticOrderTestStatus.REJECTED
      ].includes(t.processingStatus)
    );

    if (invalidTest) {
      dispatch(
        notify({
          msg: `Cannot collect sample. Test (${
            invalidTest.test?.name ?? invalidTest.id
          }) is ${invalidTest.processingStatus.replace('_', ' ')}.`,
          sev: 'warning'
        })
      );

      return;
    }

    const unitText = valueUnitLov?.object?.find(
      u => String(u.key) === String(record.unit)
    )?.lovDisplayVale;

    if (!unitText) {
      dispatch(notify({ msg: 'Invalid unit', sev: 'error' }));
      return;
    }

    try {
      await bulkCreate({
        orderId,
        orderTestIds: selectedTests.map(t => t.id),
        quantity: record.quantity,
        unit: unitText,
        collectedAt:
          record.collectedAt instanceof Date
            ? record.collectedAt.toISOString()
            : record.collectedAt,
        expiryDate:
          selectedExpiryDate.dateTime instanceof Date
            ? selectedExpiryDate.dateTime.toISOString()
            : selectedExpiryDate.dateTime,
        sourceOfSample: record.sourceOfSample
      }).unwrap();

      dispatch(
        notify({
          msg: `Samples collected for ${selectedTests.length} tests`,
          sev: 'success'
        })
      );

      setOpen(false);
      onSuccess?.();
    } catch (e: any) {
      dispatch(
        notify({
          msg: 'Unable to collect sample due to server validation.',
          sev: 'error'
        })
      );
    }
  };

  useEffect(() => {
    if (open) {
      setRecord({
        quantity: null,
        unit: null,
        collectedAt: new Date(),
        sourceOfSample: null
      });
      setSelectedExpiryDate({ dateTime: getOneWeekFromNow() });
    }
  }, [open]);

  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <div dir={dir}>
      <MyModal
        open={open}
        setOpen={setOpen}
        title="Collect Sample"
        size="50vw"
        actionButtonFunction={handleSave}
        steps={[{ title: 'Sample', icon: <FontAwesomeIcon icon={faVialCircleCheck} /> }]}
        content={
          <div dir={dir}>
            <Form fluid layout="inline">
              <MyInput
                fieldLabel="Actual Sample Quantity"
                fieldName="quantity"
                fieldType="number"
                record={record}
                setRecord={setRecord}
                column
                width={'14vw'}
                required
              />
              <MyInput
                fieldLabel="Unit"
                fieldName="unit"
                fieldType="select"
                selectData={valueUnitLov?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={record}
                setRecord={setRecord}
                column
                width={'14vw'}
                required
              />

              <MyInput
                fieldLabel="Sample Collected"
                fieldName="collectedAt"
                fieldType="datetime"
                record={record}
                setRecord={setRecord}
                column
                width={'14vw'}
                required
              />
              <MyInput
                fieldName="dateTime"
                fieldType="datetime"
                fieldLabel="Expiry Date"
                record={selectedExpiryDate}
                setRecord={setSelectedExpiryDate}
                width={'14vw'}
                column
                required
              />
              <MyInput
                fieldLabel="Source of Sample"
                fieldName="sourceOfSample"
                fieldType="select"
                selectData={sampleSourceLov?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={record}
                setRecord={setRecord}
                column
                width={'14vw'}
                required
              />
            </Form>
          </div>
        }
      />
    </div>
  );
};

export default BulkCollectSampleModal;
