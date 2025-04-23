import React, { useEffect, useState } from 'react';
import './styles.less';
import Translate from '@/components/Translate';
import MyModal from '@/components/MyModal/MyModal';
import { initialListRequest } from '@/types/types';
import {
    useGetWarningsQuery
} from '@/services/observationService';
import CollaspedOutlineIcon from '@rsuite/icons/CollaspedOutline';
import ExpandOutlineIcon from '@rsuite/icons/ExpandOutline';
import {
    IconButton,
    Table,
    Checkbox,
} from 'rsuite';
import { faWarning } from '@fortawesome/free-solid-svg-icons';
const { Column, HeaderCell, Cell } = Table;

const WarningiesModal = ({ open, setOpen, patient }) => {
    const [showCanceled, setShowCanceled] = useState(true);

    const filters = [
        {
            fieldName: 'patient_key',
            operator: 'match',
            value: patient?.key
        },
        {
            fieldName: "status_lkey",
            operator: showCanceled ? "notMatch" : "match",
            value: "3196709905099521",
        }
    ];
    const { data: warningsListResponse, refetch: fetchwarning } = useGetWarningsQuery({ ...initialListRequest, filters });
    const [expandedRowKeys, setExpandedRowKeys] = React.useState([]);
    const renderRowExpanded = rowData => {


        return (


            <Table
                data={[rowData]} // Pass the data as an array to populate the table

                className='table-style'
                height={100} // Adjust height as needed
            >
                <Column flexGrow={2} fullText>
                    <HeaderCell>Created At</HeaderCell>
                    <Cell dataKey="onsetDate" >
                        {rowData => rowData.createdAt ? new Date(rowData.createdAt).toLocaleString() : ""}
                    </Cell>
                </Column>
                <Column flexGrow={1} fullText>
                    <HeaderCell>Created By</HeaderCell>
                    <Cell dataKey="createdBy" />
                </Column>
                <Column flexGrow={2} fullText>
                    <HeaderCell>Resolved At</HeaderCell>
                    <Cell dataKey="resolvedAt" >
                        {rowData => {
                            if (rowData.statusLkey != '9766169155908512') {

                                return rowData.resolvedAt ? new Date(rowData.resolvedAt).toLocaleString() : "";
                            }
                        }}
                    </Cell>
                </Column>
                <Column flexGrow={1} fullText>
                    <HeaderCell>Resolved By</HeaderCell>
                    <Cell dataKey="resolvedBy" />
                </Column>
                <Column flexGrow={2} fullText>
                    <HeaderCell>Cancelled At</HeaderCell>
                    <Cell dataKey="deletedAt" >
                        {rowData => rowData.deletedAt ? new Date(rowData.deletedAt).toLocaleString() : ""}
                    </Cell>
                </Column>
                <Column flexGrow={1} fullText>
                    <HeaderCell>Cancelled By</HeaderCell>
                    <Cell dataKey="deletedBy" />
                </Column>
                <Column flexGrow={1} fullText>
                    <HeaderCell>Cancelliton Reason</HeaderCell>
                    <Cell dataKey="cancellationReason" />
                </Column>
            </Table>


        );
    };

    const handleExpanded = (rowData) => {
        let open = false;
        const nextExpandedRowKeys = [];

        expandedRowKeys.forEach(key => {
            if (key === rowData.key) {
                open = true;
            } else {
                nextExpandedRowKeys.push(key);
            }
        });

        if (!open) {
            nextExpandedRowKeys.push(rowData.key);
        }



        console.log(nextExpandedRowKeys)
        setExpandedRowKeys(nextExpandedRowKeys);
    };

    const ExpandCell = ({ rowData, dataKey, expandedRowKeys, onChange, ...props }) => (
        <Cell {...props} style={{ padding: 5 }}>
            <IconButton
                appearance="subtle"
                onClick={() => {
                    onChange(rowData);
                }}
                icon={
                    expandedRowKeys.some(key => key === rowData["key"]) ? (
                        <CollaspedOutlineIcon />
                    ) : (
                        <ExpandOutlineIcon />
                    )
                }
            />
        </Cell>
    );
    return (<>
        <MyModal
            position='right'
            bodyheight={450}
            size='900px'
            title="Warning"
            open={open}
            setOpen={setOpen}
            steps={[{ title: "Warning", icon:faWarning}]}
            content={<>
                <div>
                    <Checkbox
                        checked={!showCanceled}
                        onChange={() => {


                            setShowCanceled(!showCanceled);
                        }}
                    >
                        Show Cancelled
                    </Checkbox>


                </div>
                <Table
                     autoHeight
                    data={warningsListResponse?.object || []}
                    rowKey="key"
                    expandedRowKeys={expandedRowKeys} // Ensure expanded row state is correctly handled
                    renderRowExpanded={renderRowExpanded} // This is the function rendering the expanded child table
                    shouldUpdateScroll={false}
                >
                    <Column width={70} >
                        <HeaderCell>#</HeaderCell>
                        <ExpandCell rowData={rowData => rowData} dataKey="key" expandedRowKeys={expandedRowKeys} onChange={handleExpanded} />
                    </Column>

                    <Column flexGrow={2} fullText>
                        <HeaderCell >
                            <Translate>Warning Type</Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData =>
                                rowData.warningTypeLvalue?.lovDisplayVale
                            }
                        </Cell>
                    </Column >

                    <Column flexGrow={2} fullText>
                        <HeaderCell >
                            <Translate>Severity</Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData =>
                                rowData.severityLvalue?.lovDisplayVale
                            }
                        </Cell>
                    </Column>

                    <Column flexGrow={2} fullText>
                        <HeaderCell >
                            <Translate>First Time Recorded</Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData => rowData.firstTimeRecorded ? new Date(rowData.firstTimeRecorded).toLocaleString() : "Undefind"}
                        </Cell>
                    </Column>

                    <Column flexGrow={2} fullText>
                        <HeaderCell >
                            <Translate>Source of information</Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData =>
                                rowData.sourceOfInformationLvalue?.lovDisplayVale || "BY Patient"
                            }
                        </Cell>
                    </Column>

                    <Column flexGrow={2} fullText>
                        <HeaderCell >
                            <Translate>Notes</Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData =>
                                rowData.notes
                            }
                        </Cell>
                    </Column>
                    <Column flexGrow={1} fullText>
                        <HeaderCell >
                            <Translate>Status</Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData =>
                                rowData.statusLvalue?.lovDisplayVale
                            }
                        </Cell>
                    </Column>
                </Table>
            </>}
        ></MyModal>
    </>);
}
export default WarningiesModal