
import Translate from '@/components/Translate';

const { Column, HeaderCell, Cell } = Table;

import React, { useEffect, useState } from 'react';
import {
    ButtonToolbar,
    Form,
    IconButton,
    Panel,
    Drawer,
    Stack,
    Table,
    SelectPicker,
    Button,
    Pagination
} from 'rsuite';
import 'react-tabs/style/react-tabs.css';
import { useGetEncountersQuery } from '@/services/encounterService';

import { initialListRequest, ListRequest } from '@/types/types';

import PatientQuickAppointment from './PatientQuickAppointment';
const PatientVisitHistory = ({ visitHistoryModel, localPatient, setVisitHistoryModel, quickAppointmentModel, setQuickAppointmentModel }) => {
    const [selectedVisit, setSelectedVisit] = useState(null);
    const [visitHistoryListRequest, setVisitHistoryListRequest] = useState<ListRequest>({
        ...initialListRequest,
        sortBy: 'plannedStartDate',
        sortType: 'desc',
        filters: [
            {
                fieldName: 'patient_key',
                operator: 'match',
                value: localPatient.key || undefined
            }]
    });
    const { data: visiterHistoryResponse, isLoading } = useGetEncountersQuery(visitHistoryListRequest);

    return (
        <>
            <Panel>
                <Drawer
                    size="lg"
                    placement={'right'}
                    open={visitHistoryModel}
                    onClose={() => setVisitHistoryModel(false)}
                >
                    <Drawer.Header>
                        <Drawer.Title>{localPatient?.firstName}'s{' '}Visits history</Drawer.Title>
                    </Drawer.Header>
                    <Drawer.Body>
                        <Table
                            height={600}
                            headerHeight={80}
                            rowHeight={60}
                            bordered
                            cellBordered
                            data={visiterHistoryResponse?.object ?? []}
                            loading={isLoading}
                        >
                            <Column sortable flexGrow={4}>
                                <HeaderCell>
                                    <Translate>key</Translate>
                                </HeaderCell>
                                <Cell>
                                    {rowData => (
                                        <a
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => {
                                                setSelectedVisit(rowData);
                                                setQuickAppointmentModel(true);
                                            }}
                                        >
                                            {rowData.visitId}
                                        </a>
                                    )}
                                </Cell>
                            </Column>
                            <Column sortable flexGrow={4}>
                                <HeaderCell>
                                    <Translate>Date</Translate>
                                </HeaderCell>
                                <Cell dataKey="plannedStartDate" />
                            </Column>
                            <Column sortable flexGrow={4}>
                                <HeaderCell>
                                    <Translate>Department</Translate>
                                </HeaderCell>
                                <Cell dataKey="departmentName" />
                            </Column>
                            <Column sortable flexGrow={4}>
                                <HeaderCell>
                                    <Translate>Physician</Translate>
                                </HeaderCell>
                                <Cell>
                                    {rowData =>
                                        rowData.practitionerObject?.practitionerFullName
                                    }
                                </Cell>
                            </Column>
                            <Column sortable flexGrow={4}>
                                <HeaderCell>
                                    <Translate>Priority</Translate>
                                </HeaderCell>
                                <Cell>
                                    {rowData =>
                                        rowData.encounterPriorityLvalue
                                            ? rowData.encounterPriorityLvalue.lovDisplayVale
                                            : rowData.encounterPriorityLkey
                                    }
                                </Cell>
                            </Column>
                            <Column sortable flexGrow={4}>
                                <HeaderCell>
                                    <Translate>Status</Translate>
                                </HeaderCell>
                                <Cell>
                                    {rowData =>
                                        rowData.encounterStatusLvalue
                                            ? rowData.encounterStatusLvalue.lovDisplayVale
                                            : rowData.encounterStatusLkey
                                    }
                                </Cell>
                            </Column>
                        </Table>


                    </Drawer.Body>
                </Drawer>
            </Panel>
            {quickAppointmentModel ? <PatientQuickAppointment quickAppointmentModel={quickAppointmentModel} localPatient={localPatient} setQuickAppointmentModel={setQuickAppointmentModel} localVisit={selectedVisit} /> : <></>}
        </>
    );
};

export default PatientVisitHistory;
