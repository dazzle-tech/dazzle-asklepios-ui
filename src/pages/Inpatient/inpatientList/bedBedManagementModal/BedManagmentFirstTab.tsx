import React from 'react';
import { useAppDispatch } from '@/hooks';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStopCircle } from '@fortawesome/free-solid-svg-icons';
import { notify } from '@/utils/uiReducerActions';
import { Form, Tooltip, Whisper } from 'rsuite';
import { faThumbsUp } from '@fortawesome/free-solid-svg-icons';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import { useSaveBedMutation } from '@/services/setupService';
import { useFetchBedsRelatedToDepartmentQuery } from '@/services/setupService';
import Translate from '@/components/Translate';
const BedManagmentFirstTab = ({ encounter }) => {
    const dispatch = useAppDispatch();
    const [saveBed] = useSaveBedMutation();
    // Fetch beds related to the department using the current encounter's resourceKey.
    // The query is skipped if the resourceKey is not yet available.
    const { data: fetchBedsRelatedToDepartmentResponse, refetch, isFetching, isLoading } = useFetchBedsRelatedToDepartmentQuery(
        {
            resourceKey: encounter?.resourceKey,
        },
        { skip: !encounter?.resourceKey }
    );

    // handle change bed status to out service
    const handleChangeToOutService = (bed) => {
        saveBed({
            ...bed,
            statusLkey: "5258592140444674",
            isValid: true
        })
            .unwrap()
            .then(() => {
                dispatch(notify('Bed Out of Service'));
                refetch();
            }).catch(() => {
                dispatch(notify('Failed to Change Bed Status'));
            });
    };
    // handle change bed status to ready
    const handleChangeToReady = (bed) => {
        saveBed({
            ...bed,
            statusLkey: "5258243122289092",
            isValid: true
        })
            .unwrap()
            .then(() => {
                dispatch(notify('Bed Empty'));
                refetch();
            }).catch(() => {
                dispatch(notify('Failed to Change Bed Status'));
            });
    };

    // table columns 
    const tableColumns = [
        {
            key: 'roomName',
            title: <Translate>roomName</Translate>,
            render: rowData => rowData?.roomName
        },
        {
            key: 'bedName',
            title: <Translate>Bed Name</Translate>,
            fullText: true,
            render: rowData => rowData?.bed?.name
        },
        {
            key: 'bedStatus',
            title: <Translate>Status</Translate>,
            render: rowData => rowData?.bed.statusLvalue
                ? rowData?.bed.statusLvalue.lovDisplayVale
                : rowData?.bed.statusLkey
        },
        {
            key: 'actions',
            title: <Translate> </Translate>,
            render: rowData => {
                const deactivate = <Tooltip>Deactivate</Tooltip>;
                const ready = <Tooltip>Ready</Tooltip>;
                return (
                    <Form layout="inline" fluid className="nurse-doctor-form">
                        {(rowData?.bed?.statusLkey === "5258572711068224" || rowData?.bed?.statusLkey === "5258243122289092") && <Whisper trigger="hover" placement="top" speaker={deactivate}>
                            <div>
                                <MyButton
                                    size="small"
                                    onClick={() => { handleChangeToOutService(rowData?.bed) }}
                                >
                                    <FontAwesomeIcon icon={faStopCircle} />

                                </MyButton>
                            </div>
                        </Whisper>}
                        {(rowData?.bed?.statusLkey === "5258572711068224" || rowData?.bed?.statusLkey === "5258592140444674") && <Whisper trigger="hover" placement="top" speaker={ready}>
                            <div>
                                <MyButton
                                    size="small"
                                    backgroundColor="black"
                                    onClick={() => { handleChangeToReady(rowData?.bed) }}
                                >
                                    <FontAwesomeIcon icon={faThumbsUp} />
                                </MyButton>
                            </div>
                        </Whisper>}
                    </Form>
                );
            },
            expandable: false
        }
    ];
    return (<MyTable
        height={600}
        data={fetchBedsRelatedToDepartmentResponse ?? []}
        columns={tableColumns}
        loading={isFetching || isLoading}
    />);
}
export default BedManagmentFirstTab;