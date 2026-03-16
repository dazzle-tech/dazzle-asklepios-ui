import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useGetPatientResultsHistoryQuery } from '@/services/diagnosic-order/patientDiagnosticResultHistoryService';
import {
    useGetDiagnosticTestProfilesByIdsMutation
} from '@/services/setup/diagnosticTest/diagnosticTestProfileService';
import {
    useGetLovAllValuesQuery,
    useGetLovsQuery,
    useGetLovValuesByCodeQuery
} from '@/services/setupService';
import {
    initialListRequest,
    initialListRequestAllValues
} from '@/types/types';
import { formatDateWithoutSeconds } from '@/utils';
import React, { useEffect, useMemo, useState } from 'react';
import { Col, Form, Row } from 'rsuite';
import './styles.less';

type Props = {
    patient: any;
    profileTestId?: number | null;
    hideTestNameFilter?: boolean;
};

const LaboratoryResultComparison: React.FC<Props> = ({
    patient,
    profileTestId = null,
    hideTestNameFilter = false
}) => {

    const [record, setRecord] = useState<any>({});

    const today = new Date();

    const firstDayOfMonth = new Date(
        today.getFullYear(),
        today.getMonth(),
        1, 0, 0, 0, 0
    );

    const lastDayOfMonth = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0, 23, 59, 59, 999
    );

    const [dateFilter, setDateFilter] = useState({
        fromDate: firstDayOfMonth,
        toDate: lastDayOfMonth
    });

    const fromInstant = dateFilter.fromDate
        ? new Date(dateFilter.fromDate).toISOString()
        : firstDayOfMonth.toISOString();

    const toInstant = dateFilter.toDate
        ? new Date(dateFilter.toDate).toISOString()
        : lastDayOfMonth.toISOString();
    //add new patient edits
    const { data, isLoading } = useGetPatientResultsHistoryQuery({
        patientId: patient?.id,
        from: fromInstant,
        to: toInstant,
        profileTestId: profileTestId ?? undefined
    });

    /* ================= GET PROFILES BY IDS ================= */

    const profileIds = useMemo(() => {
        if (!data) return [];

        const ids = new Set<number>();
        data.forEach(group => {
            if (group.profileTestId) {
                ids.add(group.profileTestId);
            }
        });

        return Array.from(ids);
    }, [data]);

    const [fetchProfilesByIds, { data: profilesByIds }] =
        useGetDiagnosticTestProfilesByIdsMutation();

    useEffect(() => {
        if (profileIds.length > 0) {
            fetchProfilesByIds(profileIds);
        }
    }, [profileIds]);

    /* ================= PROFILE MAPS ================= */

    const profileNameMap = useMemo(() => {
        if (!profilesByIds) return {};
        const map: Record<number, string> = {};
        profilesByIds.forEach((profile: any) => {
            map[profile.id] = profile.name;
        });
        return map;
    }, [profilesByIds]);

    const profileMap = useMemo(() => {
        if (!profilesByIds) return new Map();
        return new Map(profilesByIds.map((p: any) => [p.id, p]));
    }, [profilesByIds]);

    /* ================= LOV ================= */
    // list of value new function
    const { data: allLovValues } =
        useGetLovAllValuesQuery({ ...initialListRequestAllValues });

    const { data: lovDefinitions } =
        useGetLovsQuery({ ...initialListRequest, pageSize: 1000 });

    const { data: valueUnitLov } =
        useGetLovValuesByCodeQuery('VALUE_UNIT');

    const resolveLovDisplayValue = (lovId: any, key: any) => {
        if (!lovId || key == null || !lovDefinitions?.object || !allLovValues?.object)
            return key;

        const lovDef = lovDefinitions.object.find(
            (d: any) => String(d.key) === String(lovId)
        );

        if (!lovDef?.lovCode) return key;

        return (
            allLovValues.object.find(
                (v: any) =>
                    String(v.lovCode) === String(lovDef.lovCode) &&
                    String(v.key) === String(key)
            )?.lovDisplayVale ?? key
        );
    };



    const resolveUnitDisplay = (profile: any) => {
        if (!profile) return null;

        if (profile?.resultType?.toUpperCase() === 'LOV') return null;

        if (!profile?.resultUnit || !valueUnitLov?.object) return null;

        const unit = valueUnitLov.object.find(
            (u: any) => String(u.key) === String(profile.resultUnit)
        )?.lovDisplayVale;

        return unit ?? null;
    };


    const pivotData = useMemo(() => {
        if (!data) return [];

        return data.map(group => {
            const dateMap: Record<string, any> = {};
            group.results?.forEach(result => {
                const date = formatDateWithoutSeconds(result?.resultDate);
                dateMap[date] = result;
            });

            return {
                testName:
                    profileNameMap[group.profileTestId] ??
                    `Profile Test #${group.profileTestId}`,
                results: dateMap
            };
        });
    }, [data, profileNameMap]);

    /* ================= FILTER BY NAME ================= */

    const filteredPivot = useMemo(() => {
        if (!record?.testName) return pivotData;

        return pivotData.filter(test =>
            test.testName
                ?.toLowerCase()
                .includes(record.testName.toLowerCase())
        );
    }, [pivotData, record]);

    const renderResultValue = (result: any) => {
        if (!result) return '-';

        const profile = profileMap.get(result.profileTestId);

        const isLovTest =
            profile?.resultType?.toUpperCase() === 'LOV';

        let displayValue: any = '-';

        if (isLovTest) {
            displayValue = resolveLovDisplayValue(
                profile?.listOfValueId,
                result.resultValueText
            );
        }
        else if (profile?.listOfValueId && result.resultValueText) {
            displayValue = resolveLovDisplayValue(
                profile?.listOfValueId,
                result.resultValueText
            );
        }
        else if (
            result.resultValueNumber !== null &&
            result.resultValueNumber !== undefined
        ) {
            displayValue = result.resultValueNumber;
        }
        else if (result.resultValueText) {
            displayValue = result.resultValueText;
        }

        const unit = resolveUnitDisplay(profile);

        return (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div>
                    <span>{displayValue}</span>
                    {unit && (
                        <span style={{ marginLeft: 6, fontSize: '0.7rem', color: '#666' }}>
                            {unit}
                        </span>
                    )}
                </div>


                {result.normalRangeValue?.trim() && (
                    <span
                        style={{
                            fontSize: '0.75rem',
                            color: '#6b7280',
                            marginTop: 2
                        }}
                    >
                        {result.normalRangeValue}
                    </span>
                )}
            </div>
        );
    };

    const filters = () => (
        <Form layout="inline" fluid className="date-filter-form">
            <MyInput
                column
                width={150}
                fieldType="date"
                fieldLabel="From Date"
                fieldName="fromDate"
                record={dateFilter}
                setRecord={setDateFilter}
            />
            <MyInput
                column
                width={150}
                fieldType="date"
                fieldLabel="To Date"
                fieldName="toDate"
                record={dateFilter}
                setRecord={setDateFilter}
            />
            {!hideTestNameFilter && (
                <MyInput
                    width={'100%'}
                    column
                    fieldLabel="Test Name"
                    fieldType="text"
                    fieldName="testName"
                    record={record}
                    setRecord={setRecord}
                />
            )}
        </Form>
    );

    return (
        <div style={{ overflowX: 'hidden' }}>
            <Row>
                <Col md={24}>

                    <div className="my-table-filters-laboratory-result-comparsion">
                        {filters()}
                    </div>

                    {isLoading && <div style={{ padding: 20 }}>Loading...</div>}

                    {filteredPivot.map((group, index) => {
                        const dates = Object.keys(group.results).sort();

                        const columns = [
                            {
                                key: 'testName',
                                title: <Translate>Test Name</Translate>,
                                width: 220,
                                render: () => group.testName
                            },
                            ...dates.map(date => ({
                                key: date,
                                title: date,
                                render: () => renderResultValue(group.results[date])
                            }))
                        ];

                        return (
                            <div key={index} className="comparison-table-wrapper">
                                <MyTable
                                    columns={columns}
                                    data={[{ testName: group.testName }]}
                                />
                            </div>
                        );
                    })}

                </Col>
            </Row>
        </div>
    );
};

export default LaboratoryResultComparison;
