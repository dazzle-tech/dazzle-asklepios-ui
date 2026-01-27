import React, { useEffect, useState } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import MyButton from '@/components/MyButton/MyButton';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { useGetAllLaboratoriesQuery } from '@/services/setup/diagnosticTest/laboratoryService';
import { useCreateExternalTestMutation } from '@/services/diagnosic-order/externalTestService';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { DiagnosticOrderTestStatus } from '@/types/model-types-new';
import './styles.less';

type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;
  orderTest: any;
  onSuccess?: () => void;
};

const ExternalLabModal = ({
  open,
  setOpen,
  orderTest,
  onSuccess
}: Props) => {
  const dispatch = useAppDispatch();

  const emptyRecord = {
    testId: undefined,
    facilityName: '',
    reason: ''
  };

  const [record, setRecord] = useState(emptyRecord);

  const { data: labsResponse } = useGetAllLaboratoriesQuery({
    page: 0,
    size: 10000
  });

  const labs = labsResponse?.data ?? [];

  const [
    createExternalTest,
    { isLoading }
  ] = useCreateExternalTestMutation();

  useEffect(() => {
    if (!open) return;
    if (!orderTest?.id) {
      setRecord(emptyRecord);
      return;
    }

    setRecord({
      testId: orderTest.id,
      facilityName: orderTest.externalLabName ?? '',
      reason: orderTest.externalReason ?? ''
    });
  }, [orderTest?.id, open]);

  const handleSubmit = async () => {
    if (!record.testId) {
      dispatch(notify({ msg: 'Test ID is missing', sev: 'error' }));
      return;
    }

    if (!record.facilityName || !record.reason) {
      dispatch(
        notify({
          msg: 'External laboratory and reason are required',
          sev: 'warning'
        })
      );
      return;
    }

    try {
      await createExternalTest(record).unwrap();

      dispatch(
        notify({
          msg: 'Test sent to external lab successfully',
          sev: 'success'
        })
      );

      setOpen(false);
      onSuccess?.();
    } catch (e: any) {
      dispatch(
        notify({
          msg:
            e?.data?.message ||
            e?.data?.detail ||
            'Send to external lab failed',
          sev: 'error'
        })
      );
    }
  };

  const { data: facilityListResponse, refetch: refetchFacility, isFetching } = useGetAllFacilitiesQuery({ page: 0, size: 100 });

  const facilities = facilityListResponse ?? [];

  const isRejected =
    orderTest?.status === DiagnosticOrderTestStatus.REJECTED ||
    orderTest?.processingStatus === DiagnosticOrderTestStatus.REJECTED;

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Send to External Lab"
      size="40vw"
      bodyheight='40vh'
      actionButtonLabel="Send"
      actionButtonFunction={handleSubmit}
      isDisabledActionBtn={isLoading || isRejected}
      content={
        <Form fluid>
          <div className='external-lab-modal-inputs-handle'>
            <MyInput
              fieldType="select"
              fieldName="facilityName"
              fieldLabel="External Laboratory"
              record={record}
              setRecord={setRecord}
              selectData={facilities}
              selectDataLabel="name"
              selectDataValue="name"
              searchable
              loading={isFetching}
              required
              width={"17vw"}
            />

            <MyInput
              fieldType="textarea"
              fieldName="reason"
              fieldLabel="Reason"
              record={record}
              setRecord={setRecord}
              required
              width={"17vw"}
            />
          </div>
        </Form>
      }
    />
  );
};


export default ExternalLabModal;
