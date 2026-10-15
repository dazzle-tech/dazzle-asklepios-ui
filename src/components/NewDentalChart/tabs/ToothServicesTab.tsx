import React, { useEffect, useMemo, useState } from 'react';
import { Button, Panel, SelectPicker } from 'rsuite';
import Trash from '@rsuite/icons/Trash';
import MyTable from '../../MyTable/MyTable';
import Translate from '../../Translate';
import { Box, Typography } from '@mui/material';
import MyButton from '@/components/MyButton/MyButton';
import { useLazyGetServicesBulkByIdsQuery} from '@/services/setup/serviceService';
import { useCancelToothServiceMutation } from '@/services/dental/dentalChartService';
import CancellationModal from '@/components/CancellationModal/CancellationModal';
import { formatEnumString } from '@/utils';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { extractApiErrorMessage } from '@/utils/apiErrorMessage';
interface ToothServicesTabProps {
  selectedTooth: any;
  currentToothService: any;
  setCurrentToothService: (service: any) => void;
  dentalServicesList: any[];
  dentalServicesMap: any;
  addService: () => void;
  servicesLoading: boolean;
}
type Id = number | string;

const ToothServicesTab: React.FC<ToothServicesTabProps> = ({
  selectedTooth,
  currentToothService,
  setCurrentToothService,
  dentalServicesList,
  dentalServicesMap,
  addService,
  servicesLoading
}) => {
const dispatch = useAppDispatch();
const [getServicesBulk, servicesBulkRes] = useLazyGetServicesBulkByIdsQuery();
const [cancelToothService] = useCancelToothServiceMutation();
const [cancelModalOpen, setCancelModalOpen] = useState(false);
const [cancelForm, setCancelForm] = useState<any>({ cancellationReason: '' });
const [rowToCancel, setRowToCancel] = useState<any>(null);

const toothServiceIds = useMemo<Id[]>(() => {
  const list = selectedTooth?.services || [];
  return Array.from(
    new Set(list.map((item: any) => item.serviceId).filter(Boolean))
  ) as Id[];
}, [selectedTooth?.services]);

useEffect(() => {
  if (toothServiceIds.length > 0) {
    getServicesBulk(toothServiceIds);
  }
}, [toothServiceIds, getServicesBulk]);
const fetchedServicesMap = useMemo(() => {
  const services = servicesBulkRes?.data || [];
  return services.reduce((acc: any, item: any) => {
    acc[item.id] = item;
    return acc;
  }, {});
}, [servicesBulkRes.data]);

const openCancelModal = (rowData: any) => {
  setRowToCancel(rowData);
  setCancelForm({ cancellationReason: '' });
  setCancelModalOpen(true);
};

const handleCancelService = async () => {
  if (!rowToCancel) return;
  try {
    await cancelToothService({
      id: rowToCancel.id,
      body: { cancellationReason: cancelForm.cancellationReason || '' }
    }).unwrap();
    setCancelModalOpen(false);
    setRowToCancel(null);
  } catch (error: any) {
    dispatch(notify({
      msg: extractApiErrorMessage(error) || 'Cancel service error',
      sev: 'error'
    }));
    setCancelModalOpen(false);
  }
};

const columns = [
  {
    key: 'service',
    title: 'Service',
    align: 'center' as const,
    render: (rowData: any) => (
     <Translate>{fetchedServicesMap[rowData.serviceId]?.name || rowData.serviceId}</Translate>
    )
  },
  {
    key: 'source',
    title: 'Source',
    align: 'center' as const,
    render: (rowData: any) => <Translate>{formatEnumString(rowData.source)}</Translate>
  },
  {
    key: 'price',
    title: 'Price',
    align: 'center' as const,
    render: (rowData: any) => (
      <Translate>{rowData?.price}</Translate>
    )
  },
  {
    key: 'remove',
    title: 'Remove',
    align: 'center' as const,
    render: (rowData: any, rowIndex: number) => (
      <Button
        appearance="primary"
        color="red"
        size="sm"
        disabled={rowData?.cancelled}
        onClick={() => openCancelModal(rowData)}
      >
        <Trash />
      </Button>
    )
  }
];

  return (
    <div>
      <Panel
        header={
          <Box display="flex" alignItems="center" justifyContent="space-between" className="dental-panel-header">
            <Typography className="tab-header">
              <Translate>Applied Services on Tooth</Translate> <b># {selectedTooth.toothNumber}</b>
            </Typography>
            <Box display="flex" alignItems="center">
              <SelectPicker
                style={{ width: '300px', marginRight: '10px' }}
                placeholder={<Translate>Select Service From List</Translate>}
                value={currentToothService.serviceId}
                loading={servicesLoading}
                onChange={e =>
                  setCurrentToothService({
                    ...currentToothService,
                    serviceId: e
                  })
                }
                data={dentalServicesList}
                labelKey="name"
                valueKey="id"
              />
              <MyButton
                onClick={addService}
              >
                <Translate>Add Service</Translate>
              </MyButton>
            </Box>
          </Box>
        }
      >
        <MyTable data={selectedTooth.services || []} columns={columns} height={400} />
      </Panel>

      <CancellationModal
        title="Cancel Tooth Service"
        fieldLabel="Cancellation Reason"
        open={cancelModalOpen}
        setOpen={setCancelModalOpen}
        object={cancelForm}
        setObject={setCancelForm}
        handleCancle={handleCancelService}
        fieldName="cancellationReason"
        required={true}
      />
    </div>
  );
};

export default ToothServicesTab;
