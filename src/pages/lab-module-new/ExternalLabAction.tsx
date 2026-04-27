import React, { useEffect, useState } from 'react';
import { Form, Tooltip, Whisper } from 'rsuite';
import ReloadIcon from '@rsuite/icons/Reload';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRightFromBracket } from '@fortawesome/free-solid-svg-icons';

import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';

import {
  useGetExternalTestByTestIdQuery,
  useCreateExternalTestMutation
} from '@/services/diagnosic-order/externalTestService';

import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { DiagnosticOrderTestStatus } from '@/types/model-types-new';

type ExternalTestState = {
  id: number | null;
  testId: number | null;
  facilityName: string;
  reason: string;
};

type Props = {
  rowData?: any;
  onSuccess?: () => void;
};

const ExternalLabAction = ({ rowData, onSuccess }: Props) => {
  const dispatch = useAppDispatch();


  const orderTestId = rowData?.id;

  if (!orderTestId) return null;


  const [open, setOpen] = useState(false);

  const [externalTestState, setExternalTestState] =
    useState<ExternalTestState>({
      id: null,
      testId: orderTestId,
      facilityName: '',
      reason: ''
    });


  const {
    data: externalTest,
    isFetching,
    isError,
    error
  } = useGetExternalTestByTestIdQuery(orderTestId, {
    refetchOnMountOrArgChange: true
  });

  const [createExternalTest, { isLoading }] =
    useCreateExternalTestMutation();

  const {
    data: facilityListResponse,
    isFetching: isFacilitiesFetching
  } = useGetAllFacilitiesQuery({
    page: 0,
    size: 100
  });

  const facilities = facilityListResponse ?? [];


  useEffect(() => {
    if (!orderTestId) return;
    if (isError) {
      const msg =
        (error as any)?.data?.message ||
        (error as any)?.error ||
        '';

      if (msg.includes('not found')) {
        setExternalTestState({
          id: null,
          testId: orderTestId,
          facilityName: '',
          reason: ''
        });
        return;
      }
    }

    if (externalTest?.id) {
      setExternalTestState({
        id: externalTest.id,
        testId: externalTest.testId ?? orderTestId,
        facilityName: externalTest.facilityName ?? '',
        reason: externalTest.reason ?? ''
      });
    } else {
      setExternalTestState({
        id: null,
        testId: orderTestId,
        facilityName: '',
        reason: ''
      });
    }
  }, [externalTest, isError, error, orderTestId]);


  const canSendToExternal =
    rowData.processingStatus === DiagnosticOrderTestStatus.ACCEPTED ||
    rowData.processingStatus === DiagnosticOrderTestStatus.SAMPLE_COLLECTED;

  const isAlreadyExternal = !!externalTest?.id;

  const isDisabled = !canSendToExternal || isFetching;

  const iconColor = isFetching
    ? '#999'
    : isAlreadyExternal
    ? '#1675e0'
    : 'var(--primary-gray)';


  const handleSubmit = async () => {
    if (!externalTestState.testId) {
      dispatch(notify({ msg: 'Test ID missing', sev: 'error' }));
      return;
    }

    if (!externalTestState.facilityName || !externalTestState.reason) {
      dispatch(
        notify({
          msg: 'External laboratory and reason are required',
          sev: 'warning'
        })
      );
      return;
    }

    try {
      await createExternalTest({
        testId: externalTestState.testId,
        facilityName: externalTestState.facilityName,
        reason: externalTestState.reason
      }).unwrap();

      dispatch(
        notify({
          msg: 'Sent to external lab successfully',
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
            'Send failed',
          sev: 'error'
        })
      );
    }
  };

  /* ======================= */
  /* Direction */
  /* ======================= */

  const direction = localStorage.getItem('direction') || 'LTR';
  const dir = direction === 'RTL' ? 'rtl' : 'ltr';

  /* ======================= */
  /* Render */
  /* ======================= */

  return (
    <div dir={dir}>
      <Whisper
        placement="top"
        trigger="hover"
        speaker={
          <Tooltip>
            {isFetching
              ? 'Loading...'
              : isAlreadyExternal
              ? 'Already sent to external lab'
              : 'Send to External Lab'}
          </Tooltip>
        }
      >
        <span>
          {isFetching ? (
            <ReloadIcon spin />
          ) : (
            <FontAwesomeIcon
              icon={faRightFromBracket}
              style={{
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                color: iconColor,
                opacity: isDisabled ? 0.4 : 1
              }}
              onClick={() => {
                if (isDisabled) return;
                setOpen(true);
              }}
            />
          )}
        </span>
      </Whisper>

      <MyModal
        open={open}
        setOpen={setOpen}
        title="Send to External Lab"
        size="23vw"
        bodyheight="40vh"
        actionButtonLabel="Send"
        actionButtonFunction={handleSubmit}
        isDisabledActionBtn={isLoading || isAlreadyExternal}
        content={
          <div dir={dir}>
            <Form fluid>
              <MyInput
                fieldType="select"
                fieldName="facilityName"
                fieldLabel="External Laboratory"
                record={externalTestState}
                setRecord={setExternalTestState}
                selectData={facilities}
                selectDataLabel="name"
                selectDataValue="name"
                searchable
                loading={isFacilitiesFetching}
                required
                width="100%"
                disabled={isAlreadyExternal}
              />

              <MyInput
                fieldType="textarea"
                fieldName="reason"
                fieldLabel="Reason"
                record={externalTestState}
                setRecord={setExternalTestState}
                required
                width="100%"
                disabled={isAlreadyExternal}
              />
            </Form>
          </div>
        }
      />
    </div>
  );
};

export default ExternalLabAction;