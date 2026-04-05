import React, { useEffect, useMemo } from 'react';
import { Button, Panel, SelectPicker } from 'rsuite';
import Trash from '@rsuite/icons/Trash';
import MyTable from '../../MyTable/MyTable';
import Translate from '../../Translate';
import { Box, Typography } from '@mui/material';
import MyButton from '@/components/MyButton/MyButton';
import { useLazyGetServicesBulkByIdsQuery} from '@/services/setup/serviceService';
import { formatEnumString } from '@/utils';
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
const [getServicesBulk, servicesBulkRes] = useLazyGetServicesBulkByIdsQuery();
const toothServiceIds = useMemo<Id[]>(() => {
  const list = selectedTooth?.toothServices || [];
  return Array.from(
    new Set(list.map((item: any) => item.serviceKey).filter(Boolean))
  ) as Id[];
}, [selectedTooth?.toothServices]);

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
console.log("fetchedServicesMap", fetchedServicesMap);
const columns = [
  {
    key: 'service',
    title: 'Service',
    align: 'center' as const,
    render: (rowData: any) => (
     <Translate>{fetchedServicesMap[rowData.serviceKey]?.name || rowData.serviceKey}</Translate>
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
      <Button appearance="primary" color="red" size="sm">
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
                value={currentToothService.serviceKey}
                loading={servicesLoading}
                onChange={e =>
                  setCurrentToothService({
                    ...currentToothService,
                    serviceKey: e
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
        <MyTable data={selectedTooth.toothServices || []} columns={columns} height={400} />
      </Panel>
    </div>
  );
};

export default ToothServicesTab;
