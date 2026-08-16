import React, { useEffect, useMemo, useState } from 'react';
import { Form, Panel } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVialCircleCheck } from '@fortawesome/free-solid-svg-icons';

import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';

import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { formatDateWithoutSeconds } from '@/utils';
import { DiagnosticOrderTestStatus } from '@/types/model-types-new';
import {
  useCreateCollectedSampleMutation,
  useGetCollectedSamplesByOrderTestIdQuery
} from '@/services/setup/diagnosticTest/diagnosticOrderTestCollectedSampleService';

import { useGetLaboratoryByTestIdQuery } from '@/services/setup/diagnosticTest/laboratoryService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { newApDiagnosticOrderTestsSamples } from '@/types/model-types-constructor';

import './styles.less';
const getApiErrorMessage = (
  e: any,
  fallback = 'Unable to collect sample.'
) => {
  const text =
    e?.data?.detail ||
    e?.data?.message ||
    e?.error ||
    e?.message ||
    String(e ?? '');

  const interpolated = String(text).match(/interpolatedMessage='([^']+)'/)?.[1];
  if (interpolated) return interpolated;

  const template = String(text).match(/messageTemplate='([^']+)'/)?.[1];
  if (template) return template;

  return String(text || fallback);
};
type SampleModalProps = {
  open: boolean;
  setOpen: (v: boolean) => void;
  orderTest?: any;
  onSuccess?: () => Promise<void> | void;
};

const oneWeekFromNow = () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

const SampleModal = ({ open, setOpen, orderTest, onSuccess }: SampleModalProps) => {
  const dispatch = useAppDispatch();

  const testId = orderTest?.testId;

  const { data: lab } = useGetLaboratoryByTestIdQuery(testId, {
    skip: !testId
  });

  const { data: valueUnitLov } = useGetLovValuesByCodeQuery('VALUE_UNIT');
  const { data: sampleContainerLov } = useGetLovValuesByCodeQuery('LAB_SAMPLE_CONTAINER');
  const { data: tubeColorLov } = useGetLovValuesByCodeQuery('LAB_TUBE_COLORS');
  const { data: tubeTypeLov } = useGetLovValuesByCodeQuery('LAB_TUBE_TYPES');
  const { data: systemLov } = useGetLovValuesByCodeQuery('LAB_SYSTEMS');
  const { data: sampleSourceLov } = useGetLovValuesByCodeQuery('SAMPLE_SOURCE');

  const labView = useMemo(() => {
    if (!lab) return {};

    const lov = (list?: any[], v?: any) =>
      list?.find(i => String(i.key) === String(v))?.lovDisplayVale ?? v;

    return {
      system: lov(systemLov?.object, lab.system),
      tubeColor: lov(tubeColorLov?.object, lab.tubeColor),
      tubeType: lov(tubeTypeLov?.object, lab.tubeType),
      sampleContainer: lov(sampleContainerLov?.object, lab.sampleContainer),
      sampleVolume: lab.sampleVolume,
      sampleVolumeUnit: lov(valueUnitLov?.object, lab.sampleVolumeUnit)
    };
  }, [lab, systemLov, tubeColorLov, tubeTypeLov, sampleContainerLov, valueUnitLov]);

  const [sample, setSample] = useState({ ...newApDiagnosticOrderTestsSamples });
  const [selectedSampleDate, setSelectedSampleDate] = useState<{ dateTime: Date | null }>({
    dateTime: new Date()
  });
  const [selectedExpiryDate, setSelectedExpiryDate] = useState<{ dateTime: Date | null }>({
    dateTime: oneWeekFromNow()
  });

  const [createCollectedSample] = useCreateCollectedSampleMutation();

  const { data: samplesPage, refetch: refetchSamples } = useGetCollectedSamplesByOrderTestIdQuery(
    { orderTestId: orderTest?.id, page: 0, size: 20 },
    { skip: !orderTest?.id }
  );

 const handleSaveSample = async () => {
  const status = orderTest?.processingStatus;

  switch (status) {
    case DiagnosticOrderTestStatus.RESULT_READY:
      dispatch(
        notify({
          msg: 'Cannot collect sample. The result is already marked as Ready.',
          sev: 'warning'
        })
      );
      return;

    case DiagnosticOrderTestStatus.RESULT_APPROVED:
      dispatch(
        notify({
          msg: 'Cannot collect sample. The result has already been Approved.',
          sev: 'warning'
        })
      );
      return;

    case DiagnosticOrderTestStatus.ACCEPTED:
      dispatch(
        notify({
          msg: 'Cannot collect sample. This test is already Accepted.',
          sev: 'warning'
        })
      );
      return;

    case DiagnosticOrderTestStatus.REJECTED:
      dispatch(
        notify({
          msg: 'Cannot collect sample. This test has been Rejected.',
          sev: 'warning'
        })
      );
      return;

    default:
      break;
  }

  if (
    selectedExpiryDate?.dateTime &&
    selectedSampleDate?.dateTime &&
    selectedExpiryDate.dateTime < selectedSampleDate.dateTime
  ) {
    dispatch(
      notify({
        msg: 'Expiry Date cannot be before Sample Collected',
        sev: 'warning'
      })
    );
    return;
  }

  if (!selectedSampleDate?.dateTime) {
    dispatch(
      notify({
        msg: 'Sample Collected is required',
        sev: 'warning'
      })
    );
    return;
  }

  if (!selectedExpiryDate?.dateTime) {
    dispatch(
      notify({
        msg: 'Expiry Date is required',
        sev: 'warning'
      })
    );
    return;
  }

  if (!sample.sourceOfSample) {
    dispatch(
      notify({
        msg: 'Source of Sample is required',
        sev: 'warning'
      })
    );
    return;
  }

  try {
    const finalQuantity =
      sample.quantity ?? lab?.sampleVolume ?? null;

    const finalUnit =
      valueUnitLov?.object?.find(
        u => String(u.key) === String(sample.unitLkey)
      )?.lovDisplayVale ??
      valueUnitLov?.object?.find(
        u => String(u.key) === String(lab?.sampleVolumeUnit)
      )?.lovDisplayVale ??
      null;

    await createCollectedSample({
      orderId: orderTest.orderId,
      orderTestId: orderTest.id,
      quantity: finalQuantity,
      unit: finalUnit,
      collectedAt: selectedSampleDate.dateTime.toISOString(),
      expiryDate: selectedExpiryDate.dateTime.toISOString(),
      sourceOfSample: sample.sourceOfSample
    }).unwrap();

    dispatch(
      notify({
        msg: 'Sample collected successfully',
        sev: 'success'
      })
    );

    await refetchSamples();

    onSuccess?.();

    setOpen(false);
  } catch (e: any) {
    dispatch(
      notify({
        msg: getApiErrorMessage(e, 'Unable to collect sample.'),
        sev: 'warning'
      })
    );
  }
};

  const tableColumns = [
    {
      key: 'collectedAt',
      dataKey: 'collectedAt',
      title: <Translate>COLLECTED AT</Translate>,
      flexGrow: 2,
      render: (rowData: any) => formatDateWithoutSeconds(rowData.collectedAt)
    },
    {
      key: 'quantity',
      dataKey: 'quantity',
      title: <Translate>ACTUAL SAMPLE QUANTITY</Translate>,
      flexGrow: 2
    },
    {
      key: 'unit',
      dataKey: 'unit',
      title: <Translate>UNIT</Translate>,
      flexGrow: 1
    },
    {
      key: 'expiryDate',
      dataKey: 'expiryDate',
      title: <Translate>EXPIRY DATE</Translate>,
      flexGrow: 2,
      render: (rowData: any) =>
        rowData.expiryDate ? formatDateWithoutSeconds(rowData.expiryDate) : '—'
    }
  ];


useEffect(() => {
  if (open) {
    setSample({
      ...newApDiagnosticOrderTestsSamples,
      quantity: lab?.sampleVolume ?? null,
      unitLkey: lab?.sampleVolumeUnit ?? null
    });

    setSelectedSampleDate({
      dateTime: new Date()
    });

    setSelectedExpiryDate({
      dateTime: oneWeekFromNow()
    });
  }
}, [open, lab]);
  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';
  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <div dir={dir}>
      <MyModal
        open={open}
        setOpen={setOpen}
        size="50vw"
        position="right"
        title="Collect Sample"
        actionButtonFunction={handleSaveSample}
        steps={[{ title: 'Sample', icon: <FontAwesomeIcon icon={faVialCircleCheck} /> }]}
        content={
          <div dir={dir}>
            <div>
              <Form fluid>
                <div className="collect-sample-modal-inputs-main-container">
                  <MyInput disabled fieldName="system" record={labView} width={'14vw'} />
                  <MyInput disabled fieldName="tubeColor" record={labView} width={'14vw'} />
                  <MyInput disabled fieldName="tubeType" record={labView} width={'14vw'} />

                  <MyInput disabled fieldName="sampleContainer" record={labView} width={'14vw'} />
                  <MyInput
                    disabled
                    fieldName="sampleVolume"
                    fieldType="number"
                    record={labView}
                    width={'14vw'}
                  />
                  <MyInput disabled fieldName="sampleVolumeUnit" record={labView} width={'14vw'} />

                  <MyInput
                    fieldLabel="Actual Sample Quantity"
                    fieldName="quantity"
                    fieldType="number"
                    record={sample}
                    setRecord={setSample}
                    width={'14vw'}
                  
                  />

                   <MyInput
                    column
                    fieldLabel="Source of Sample"
                    fieldType="select"
                    fieldName="sourceOfSample"
                    selectData={sampleSourceLov?.object ?? []}
                     selectDataLabel="lovDisplayVale"
 disableByField='isValid'

                    selectDataValue="key"
                    record={sample}
                    setRecord={setSample}
                    width={'14vw'}
                    required
                  />

                  <MyInput
                    fieldName="dateTime"
                    fieldType="datetime"
                    fieldLabel="Sample Collected"
                    record={selectedSampleDate}
                    setRecord={setSelectedSampleDate}
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
                    required
                  />


                
                </div>
              </Form>

              <Panel>
                <MyTable columns={tableColumns} data={samplesPage?.data ?? []} />
              </Panel>
            </div>
          </div>
        }
      />
    </div>
  );
};

export default SampleModal;
