  import React, { useEffect, useState } from 'react';
  import { Form, Tooltip, Whisper } from 'rsuite';
  import ReloadIcon from '@rsuite/icons/Reload';
  import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
  import { faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
  import { skipToken } from '@reduxjs/toolkit/query';

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

  /* =======================
    Component
  ======================= */

  const ExternalLabAction = ({ rowData, onSuccess }: Props) => {
    const dispatch = useAppDispatch();

    /* =======================
      Guards
    ======================= */

    const orderTestId = rowData?.id;

    if (!orderTestId) {

      return null;
    }

    /* =======================
      State
    ======================= */

    const [open, setOpen] = useState(false);

    const [externalTestState, setExternalTestState] =
      useState<ExternalTestState>({
        id: null,
        testId: orderTestId,
        facilityName: '',
        reason: ''
      });

    /* =======================
      Queries
    ======================= */

    const { data: externalTest, isFetching } =
      useGetExternalTestByTestIdQuery(orderTestId ?? skipToken, {
        refetchOnMountOrArgChange: true
      });

    const [
      createExternalTest,
      { isLoading }
    ] = useCreateExternalTestMutation();

    const {
      data: facilityListResponse,
      isFetching: isFacilitiesFetching
    } = useGetAllFacilitiesQuery({
      page: 0,
      size: 100
    });

    const facilities = facilityListResponse ?? [];

    /* =======================
      Sync external test
    ======================= */

    useEffect(() => {
      if (!orderTestId || isFetching) return;

      if (externalTest?.facilityName) {
        setExternalTestState({
          id: externalTest.id ?? null,
          testId: externalTest.testId ?? orderTestId,
          facilityName: externalTest.facilityName ?? '',
          reason: externalTest.reason ?? ''
        });
      } else {
        setExternalTestState({
          id:  null,
          testId: orderTestId,
          facilityName: '',
          reason: ''
        });
      }
    }, [orderTestId, externalTest, isFetching]);

    /* =======================
      Flags
    ======================= */

    const canSendToExternal =
      rowData.processingStatus === DiagnosticOrderTestStatus.ACCEPTED ||
      rowData.processingStatus === DiagnosticOrderTestStatus.SAMPLE_COLLECTED;


    const isAlreadyExternal = !!externalTestState.id;


    const isDisabled =
      !canSendToExternal || isFetching;

    const iconColor = isFetching
      ? '#999'
      : isAlreadyExternal
        ? '#1675e0'
        : 'var(--primary-gray)';

    /* =======================
      Submit
    ======================= */

    const handleSubmit = async () => {
      if (!externalTestState.testId) {
        dispatch(notify({ msg: 'Test ID is missing', sev: 'error' }));
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


    /* =======================
      Render
    ======================= */

    useEffect(() => {
      if (!orderTestId) return;

      setExternalTestState({
        id: null,
        testId: orderTestId,
        facilityName: '',
        reason: ''
      });
    }, [orderTestId]);
    
// Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';

    
    return (
      <div dir={dir}>
        {/* ========= Icon ========= */}
        <Whisper
          placement="top"
          trigger="hover"
          speaker={
            <Tooltip>
              {isFetching
                ? 'Loading external test...'
                : isAlreadyExternal
                  ? 'Already sent to external lab'
                  : 'Send to External Lab'}
            </Tooltip>
          }
        >
          <span>
            {isFetching ? (
              <ReloadIcon
                spin
                style={{
                  fontSize: '1em',
                  marginRight: 10,
                  color: '#999',
                  cursor: 'not-allowed',
                  opacity: 0.6
                }}
              />
            ) : (
              <FontAwesomeIcon
                icon={faRightFromBracket}
                style={{
                  marginRight: 10,
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  color: iconColor,
                  opacity: isDisabled ? 0.4 : 1
                }}
                className='icon-laboratory-size'
                onClick={() => {
                  if (isDisabled) return;
                  setOpen(true);
                }}
              />
            )}
          </span>
        </Whisper>

        {/* ========= Modal ========= */}
        <MyModal
          open={open}
          setOpen={setOpen}
          title="Send to External Lab"
          size="23vw"
          bodyheight="40vh"
          actionButtonLabel="Send"
          actionButtonFunction={handleSubmit}
          isDisabledActionBtn={
            isLoading || isAlreadyExternal
          }
          content={
            <Form fluid>
              <div className="external-lab-modal-inputs-handle">
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
              </div>
            </Form>
          }
        />
      </div>
    );
  };

  export default ExternalLabAction;
