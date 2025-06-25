import React, { useState, useEffect } from 'react';
import { Drawer } from 'rsuite';
import 'react-tabs/style/react-tabs.css';
import { initialListRequest } from '@/types/types';
import MyTable from '@/components/MyTable';
import { Stack, SelectPicker } from 'rsuite';
import { useGetServicesQuery, useLinkCdtServiceMutation, useUnlinkCdtServiceMutation } from '@/services/setupService';
import { Check, Trash } from '@rsuite/icons';
import { newApServiceCdt } from '@/types/model-types-constructor';
import MyButton from '@/components/MyButton/MyButton';
import './styles.less';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';
const LinkedServices = ({ open, setOpen, cdt, setCdt }) => {
    const [selectedServiceKey, setSelectedServiceKey] = useState('');
    const [serviceMap, setServiceMap] = useState({});
    const dispatch = useAppDispatch()
    const [unlinkCdtService, unlinkCdtServiceMutation] = useUnlinkCdtServiceMutation();
    const [linkCdtService, linkCdtServiceMutation] = useLinkCdtServiceMutation();
    // Fetch the Service List data based on current filters
    const { data: serviceListResponse } = useGetServicesQuery({
        ...initialListRequest,
        pageSize: 1000,
        skipDetails: true
    });

    // Table Columns
    const columns = [
        {
            key: 'serviceName',
            title: 'Service Name',
            render: (rowData: any) =>
                serviceMap[rowData.serviceKey] ? serviceMap[rowData.serviceKey] : 'Error fetching name'
        },
        {
            key: 'remove',
            title: 'Remove',
            render: (rowData: any) => (
                <MyButton
                    appearance='subtle'
                    onClick={() => {
                        unlinkCdtService({
                            ...newApServiceCdt,
                            serviceKey: rowData.serviceKey,
                            cdtKey: rowData.cdtKey
                        }).unwrap();
                    }}
                    prefixIcon={() => <Trash />}
                >
                </MyButton>
            )
        }
    ];
    // Effects
    useEffect(() => {
        if (serviceListResponse && serviceListResponse.object) {
            let map = {};
            serviceListResponse.object.forEach(item => {
                map[item.key] = item.name;
            });
            setServiceMap(map);
        }
    }, serviceListResponse);
    useEffect(() => {
        if (linkCdtServiceMutation.data) {
            // add the new linked service to selected cdt service list
            let currentServiceList = [...cdt['linkedServices']];
            currentServiceList.push(linkCdtServiceMutation.data);
            let clone = { ...cdt };
            clone['linkedServices'] = currentServiceList;
            setCdt({ ...clone });
        }
    }, [linkCdtServiceMutation.data]);
    useEffect(() => {
        if (unlinkCdtServiceMutation.data) {
            // remove the unlinked services from selected procedure
            const serviceKeyToRemove = unlinkCdtServiceMutation.data.serviceKey;
            // Filter out the service with the matching serviceKey
            const updatedServiceList = cdt['linkedServices'].filter(
                service => service.serviceKey !== serviceKeyToRemove
            );
            let clone = { ...cdt };
            clone['linkedServices'] = updatedServiceList;
            setCdt({ ...clone });
        }
    }, [unlinkCdtServiceMutation.data]);
    return (
        <div className='drawer-container'>
            <Drawer
                size="sm"
                placement={'right'}
                open={open}
                onClose={() => setOpen(false)}
            >
                <Drawer.Header>
                    <Drawer.Title>{cdt?.cdtCode}{' '}Linked Services</Drawer.Title>
                </Drawer.Header>
                <Drawer.Body>
                    <Stack justifyContent={'space-between'} style={{ marginBottom: '10px' }}>
                        <Stack.Item>
                            <SelectPicker
                                placeholder="Select Service"
                                data={serviceListResponse?.object ?? []}
                                labelKey={'name'}
                                valueKey="key"
                                style={{ width: '300px' }}
                                value={selectedServiceKey}
                                onChange={e => {
                                    if (e) setSelectedServiceKey(e);
                                    else setSelectedServiceKey('');
                                }}
                            />
                        </Stack.Item>
                        <Stack.Item>
                            <MyButton
                                prefixIcon={() => <Check />}
                                onClick={() => {
                                    linkCdtService({
                                        ...newApServiceCdt,
                                        serviceKey: selectedServiceKey,
                                        cdtKey: cdt.key
                                    }).unwrap().then(() => {
                                      dispatch(notify({ msg: 'Linked Successfully', sev: 'success' }));
                                       setCdt(cdt);
                                      });
                                }}
                            >
                                Link Service
                            </MyButton>
                        </Stack.Item>
                    </Stack>
                    <MyTable
                        data={cdt['linkedServices']}
                        columns={columns}
                        height={580}
                    />
                </Drawer.Body>
            </Drawer>
        </div>
    );
};

export default LinkedServices;
