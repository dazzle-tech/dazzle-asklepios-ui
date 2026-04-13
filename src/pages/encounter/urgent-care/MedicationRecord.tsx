import React, { useEffect, useMemo, useRef, useState } from 'react';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import { formatDate } from '@/utils';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';
import { Tooltip, Whisper } from 'rsuite';
import CheckRoundIcon from '@rsuite/icons/CheckRound';
import WarningRoundIcon from '@rsuite/icons/WarningRound';
import Section from '@/components/Section';
import SectionContainer from '@/components/SectionsoContainer';
import './styles.less';
import Translate from '@/components/Translate';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckDouble, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';

const STATUS = {
    NEW: 'NEW',
    ADMINISTERED: 'ADMINISTERED',
    WAITING_DOUBLE_CHECK: 'WAITING_DOUBLE_CHECK',
    CANCELLED: 'CANCELLED'
};

const MedicationRecord = () => {
    const dispatch = useAppDispatch();

    const [data, setData] = useState<any[]>([
        {
            id: 1,
            patientName: 'John Doe',
            prescribedBy: 'Dr. Smith',
            prescribedAt: new Date(),
            medicationName: 'Paracetamol',
            class: 'Analgesic',
            isHighAlert: true,
            instructions: 'Line1 Line2 Line3 Line4 Line5 Line1 Line2 Line3 Line4 Line5 Line1 Line2 Line3 Line4 Line5 Line1 Line2 Line3 Line4 Line5 Line1 Line2 Line3 Line4 Line5',
            status: STATUS.NEW
        }
    ]);

    const updateRow = (id: number, updates: any) => {
        setData(prev =>
            prev.map(row => (row.id === id ? { ...row, ...updates } : row))
        );
    };

    const baseColumns = useMemo(
        () => [
            {
                key: 'patientName',
                title: 'PATIENT NAME',
                render: (row: any) => row.patientName
            },
            {
                key: 'prescribedByAt',
                title: 'PRESCRIBED BY / AT',
                render: (row: any) =>
                    `${row.prescribedBy} - ${formatDate(row.prescribedAt)}`
            },
            {
                key: 'medicationName',
                title: 'MEDICATION NAME',
                render: (row: any) => row.medicationName
            },
            {
                key: 'class',
                title: 'Medication Class',
                render: (row: any) => row.class
            },
            {
                key: 'isHighAlert',
                title: <Translate>High Risk Med</Translate>,
                render: row => (row.isHighAlert ? <FontAwesomeIcon icon={faTriangleExclamation} className="high-risk-icon-style" /> : '')
            },
            {
                key: 'instructions',
                title: 'INSTRUCTIONS',
                render: (row: any) => {
                    const text = row.instructions;

                    const TextWithTooltip = () => {
                        const ref = useRef<HTMLDivElement>(null);
                        const [isTruncated, setIsTruncated] = useState(false);

                        useEffect(() => {
                            const el = ref.current;
                            if (el) {
                                setIsTruncated(el.scrollHeight > el.clientHeight);
                            }
                        }, [text]);

                        const content = (
                            <div
                                ref={ref}
                                style={{
                                    display: '-webkit-box',
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    cursor: isTruncated ? 'pointer' : 'default',
                                    maxWidth: 250,
                                    overflowWrap: 'anywhere',
                                    wordBreak: 'break-word'
                                }}
                            >
                                {text}
                            </div>
                        );

                        if (!isTruncated) return content;

                        return (
                            <Whisper
                                placement="top"
                                trigger="hover"
                                speaker={<Tooltip>{text}</Tooltip>}
                            >
                                {content}
                            </Whisper>
                        );
                    };

                    return <TextWithTooltip />;
                }
            },
            {
                key: 'status',
                title: 'STATUS',
                render: (row: any) => {
                    const colorMap: any = {
                        NEW: '#0d6efd',
                        ADMINISTERED: '#198754',
                        WAITING_DOUBLE_CHECK: '#ffc107',
                        CANCELLED: '#dc3545'
                    };

                    return (
                        <MyBadgeStatus contant={row.status} color={colorMap[row.status]} />
                    );
                }
            },
            {
                key: 'actions',
                title: 'ACTIONS',
                align: 'center',
                render: (row: any) => {
                    const canAdminister = row.status === 'NEW';
                    const canCancel = row.status === 'NEW';

                    return (
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>

                            <Whisper
                                placement="top"
                                trigger="hover"
                                speaker={<Tooltip>Administer</Tooltip>}
                            >
                                <span>
                                    <CheckRoundIcon
                                        className="icon-laboratory-size"
                                        style={{
                                            cursor: canAdminister ? 'pointer' : 'not-allowed',
                                            opacity: canAdminister ? 1 : 0.4,
                                            color: 'var(--primary-gray)'
                                        }}
                                        onClick={() => {
                                            if (!canAdminister) return;

                                            if (row.isHighAlert) {
                                                updateRow(row.id, {
                                                    status: STATUS.WAITING_DOUBLE_CHECK
                                                });
                                            } else {
                                                updateRow(row.id, {
                                                    status: STATUS.ADMINISTERED
                                                });
                                            }
                                        }}
                                    />
                                </span>
                            </Whisper>

                            <Whisper
                                placement="top"
                                trigger="hover"
                                speaker={<Tooltip>Cancel</Tooltip>}
                            >
                                <span>
                                    <WarningRoundIcon
                                        className="icon-laboratory-size"
                                        style={{
                                            cursor: canCancel ? 'pointer' : 'not-allowed',
                                            opacity: canCancel ? 1 : 0.4,
                                            color: 'var(--primary-gray)'
                                        }}
                                        onClick={() => {
                                            if (!canCancel) return;

                                            updateRow(row.id, {
                                                status: STATUS.CANCELLED
                                            });
                                        }}
                                    />
                                </span>
                            </Whisper>

                            {row.status === STATUS.WAITING_DOUBLE_CHECK && (
                                <Whisper
                                    placement="top"
                                    trigger="hover"
                                    speaker={<Tooltip>Double Check</Tooltip>}
                                >
                                    <span>
                                        <FontAwesomeIcon
                                            icon={faCheckDouble}
                                            className="icon-laboratory-size"
                                            style={{
                                                color: 'var(--primary-gray)',
                                                cursor: 'pointer'
                                            }}
                                        />
                                    </span>
                                </Whisper>
                            )}
                        </div>
                    );
                }
            }
        ],
        []
    );

    const expandableColumns = [
        {
        key: 'administeredByAt',
        title: 'Administered by/at',
        expandable: true,
        render: (row: any) =>
            row?.administeredAt ? (
            <>
                {row?.administeredBy}
                <br />
                <span className="date-table-style">
                {formatDateWithoutSeconds(row.administeredAt)}
                </span>
            </>
            ) : (
            '-'
            )
        },
        {
        key: 'witnessByAt',
        title: 'Witness by/at',
        expandable: true,
        render: (row: any) =>
            row?.witnessAt ? (
            <>
                {row?.witnessBy}
                <br />
                <span className="date-table-style">
                {formatDateWithoutSeconds(row.witnessAt)}
                </span>
            </>
            ) : (
            '-'
            )
        },   
        {
        key: 'cancelledByAt',
        title: 'Cancelled by/at',
        expandable: true,
        render: (row: any) =>
            row?.cancelledAt ? (
            <>
                {row?.cancelledBy}
                <br />
                <span className="date-table-style">
                {formatDateWithoutSeconds(row.cancelledAt)}
                </span>
            </>
            ) : (
            '-'
            )
        },
        {
            key: 'cancelReason',
            title: 'CANCELLATION REASON',
            expandable: true,
            render: (row: any) => row.cancelReason || '-'
        }
    ];

    const orderedData = data.filter(row => row.status === STATUS.NEW);
    const administeredData = data.filter(row => row.status !== STATUS.NEW);

    return (
        <div className="medication-record-container-main">

            <SectionContainer
                title="Ordered Medications"
                content={
                    <MyTable
                        data={orderedData}
                        columns={baseColumns}
                    />
                }
            />

            <SectionContainer
                title="Administered Medications"
                content={
                    <MyTable
                        data={administeredData}
                        columns={[...baseColumns, ...expandableColumns]}
                    />
                }
            />

        </div>
    );
};

export default MedicationRecord;