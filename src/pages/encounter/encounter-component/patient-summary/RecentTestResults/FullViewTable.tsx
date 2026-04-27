import MyModal from "@/components/MyModal/MyModal";
import MyTable from "@/components/MyTable";
import Translate from "@/components/Translate";
import { useGetLovValuesByCodeQuery } from "@/services/setupService";
import { formatDateWithoutSeconds, formatEnumString } from "@/utils";
import React from "react";
import {
    faArrowDown,
    faArrowUp,
    faCircleExclamation,
    faComment,
    faPrint,
    faTriangleExclamation
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { HStack } from "rsuite";
import ChatModal from "@/components/ChatModal";
import { ColumnConfig } from "@/components/MyTable/MyTable";
const FullViewTable = ({ open, setOpen, results, notesResponse, openNotesModal, setOpenNotesModal }) => {
    const renderMarker = (marker?: string) => {
        switch (marker) {
            case 'ABNORMAL_MARKER':
                return <FontAwesomeIcon icon={faCircleExclamation} />;
            case 'UPPER_LIMIT':
                return <FontAwesomeIcon icon={faArrowUp} />;
            case 'LOWER_LIMIT':
                return <FontAwesomeIcon icon={faArrowDown} />;
            case 'CRITICAL_UPPER':
                return (
                    <HStack spacing={6}>
                        <FontAwesomeIcon icon={faTriangleExclamation} />
                        <FontAwesomeIcon icon={faArrowUp} />
                    </HStack>
                );
            case 'CRITICAL_LOWER':
                return (
                    <HStack spacing={6}>
                        <FontAwesomeIcon icon={faTriangleExclamation} />
                        <FontAwesomeIcon icon={faArrowDown} />
                    </HStack>
                );
            default:
                return formatEnumString(marker);
        }
    };

    const columns: ColumnConfig[] = [{
        key: 'orderId',
        title: <Translate>ORDER ID</Translate>,
        render: (row: any) => row.orderId
    },
    {
        key: 'resultDate',
        title: <Translate>RESULT DATE</Translate>,
        render: (row: any) =>
            row.reviewDate
                ? formatDateWithoutSeconds(row.reviewDate)
                : ' '
    },
    {
        key: 'testName',
        title: <Translate>TEST NAME</Translate>,
        render: (row: any) => row.testName
    },
    {
        key: 'result',
        title: <Translate>TEST RESULT, UNIT</Translate>,
        render: (row: any) => {
            const hasValue =
                row.resultValue !== null &&
                row.resultValue !== undefined &&
                row.resultValue !== '';

            return (
                <>
                    <span>{row.resultValue}</span>
                    {hasValue && row.unit && (
                        <span style={{ marginLeft: 6, color: '#666' }}>
                            {row.unit}
                        </span>
                    )}
                </>
            );
        }
    },
    {
        key: 'normalRange',
        title: <Translate>NORMAL RANGE</Translate>,
        render: (row: any) => row.normalRange ?? ' '
    },
    {
        key: 'marker',
        title: <Translate>MARKER</Translate>,
        align: 'center',
        render: (row: any) =>
            renderMarker(row.marker ?? row.marker)
    },
    {
        key: 'comments',
        title: <Translate>COMMENTS</Translate>,
        align: 'center',
        render: (row: any) => (
            <FontAwesomeIcon
                icon={faComment}
                className='icon-radiologist-worklist-size'
                style={{
                    cursor: 'pointer',
                    color: row.hasNote ? '#1675e0' : 'gray'
                }}
                onClick={() => {
                    setOpenNotesModal(true);
                }}
            />
        )
    }
    ];

    return (
        <MyModal
            open={open}
            setOpen={setOpen}
            title={<Translate>Recent Test Results</Translate>}
            content={
                <>
                    <MyTable
                        data={results || []}
                        columns={columns}
                    />
                    <ChatModal
                        open={openNotesModal}
                        setOpen={setOpenNotesModal}
                        title="Comments"
                        list={openNotesModal ? notesResponse ?? [] : []}
                        fieldShowName="note"
                        handleSendMessage={{}}
                        disabled
                    />
                </>
            }
            size="md"
        />

    );
}
export default FullViewTable;