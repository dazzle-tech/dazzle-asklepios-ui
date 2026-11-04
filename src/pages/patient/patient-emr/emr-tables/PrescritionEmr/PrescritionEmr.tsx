import React, { useEffect, useMemo, useState } from 'react';

import MyNestedTableEmr from './MyNestedTableEmr';
import Translate from '@/components/Translate';
import UserDateCell from '@/components/UserDateCell';

import {
    conjureValueBasedOnKeyFromList,
    formatDateWithoutSeconds,
    formatEnumString
} from '@/utils';

import { useGetPatientPrescriptionQuery } from '@/services/patients/Prescription/patientPrescriptionService';

import { useGetPatientPrescriptionMedicationsQuery } from '@/services/patients/Prescription/patientPrescriptionMedicationService';

import { useLazyGetEncountersByIdsQuery } from '@/services/encounters/patientEncounterService';

import { useGetAllBrandMedicationsQuery } from '@/services/setup/brandmedication/BrandMedicationService';

import { useGetAllPrescriptionInstructionsQuery } from '@/services/setup/prescription-instruction/prescriptionInstructionService';

import { useGetActiveIngredientsByIdsMutation } from '@/services/setup/activeIngredients/activeIngredientsService';

import { useGetCustomeInstructionsQuery } from '@/services/encounterService';

import {
    useGetLovValuesByCodeQuery,
    useLazyGetLovValuesBulkByKeysQuery
} from '@/services/setupService';

import { useLazyGetIcdDiagnosesByIdsQuery } from '@/services/setup/icdTreeService';

import type { PatientPrescription } from '@/types/model-types-new';

type PrescriptionEmrRow = PatientPrescription & {
    submitedBy?: string | null;
    submitedDate?: string | Date | null;
};

interface Props {
    patient: any;
}

const PrescritionEmr: React.FC<Props> = ({ patient }) => {
    const patientId = patient?.id;

    const [pageIndex, setPageIndex] = useState(0);

const [rowsPerPage, setRowsPerPage] = useState(15);

    const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<
        number | null
    >(null);

    const [nestedPage, setNestedPage] = useState(0);

    const [nestedRowsPerPage, setNestedRowsPerPage] = useState(15);

    const {
        data: prescriptionsResponse,
        isLoading: isLoadingPrescriptions
    } = useGetPatientPrescriptionQuery(
        {
            patientId,
            status: 'SUBMITTED',
            page: pageIndex,
            size: rowsPerPage,
            sort: 'prescriptionNum,desc'
        },
        {
            skip: !patientId
        }
    );

    const prescriptions = prescriptionsResponse?.data ?? [];

    const totalCount = prescriptionsResponse?.totalCount ?? 0;

    const [getEncountersByIds, { data: encountersData }] =
        useLazyGetEncountersByIdsQuery();

    const encounterIds = useMemo(() => {
        return Array.from(
            new Set(
                (prescriptionsResponse?.data ?? [])
                    .map(item => Number(item.encounterId))
                    .filter(id => Number.isFinite(id) && id > 0)
            )
        );
    }, [prescriptionsResponse?.data]);

    useEffect(() => {
        if (encounterIds.length === 0) return;

        getEncountersByIds({ ids: encounterIds });
    }, [encounterIds, getEncountersByIds]);

    const encounterMap = useMemo(() => {
        const encounters = Array.isArray(encountersData)
            ? encountersData
            : [];

        return new Map(
            encounters.map(encounter => [
                String(encounter.id),
                encounter
            ])
        );
    }, [encountersData]);


    const {
        currentData: currentPrescriptionMedicationsResponse,
        isLoading: isLoadingPrescriptionMedications,
        isFetching: isFetchingPrescriptionMedications
    } = useGetPatientPrescriptionMedicationsQuery(
        selectedPrescriptionId
            ? {
                prescriptionHeaderId: selectedPrescriptionId,
                page: nestedPage,
                size: nestedRowsPerPage,
                sort: 'id,asc'
            }
            : (undefined as any),
        {
            skip: !selectedPrescriptionId
        }
    );

    const medications = currentPrescriptionMedicationsResponse?.data ?? [];

    const medicationsTotalCount =
        currentPrescriptionMedicationsResponse?.totalCount ?? 0;

    const { data: genericMedicationListResponse } =
        useGetAllBrandMedicationsQuery({
            page: 0,
            size: 1000,
            sort: 'id,asc'
        });

    const medicationMap = useMemo(() => {
        return new Map(
            (genericMedicationListResponse?.data ?? []).map(
                (item: any) => [String(item.id), item]
            )
        );
    }, [genericMedicationListResponse]);

    const { data: predefinedInstructionsListResponse } =
        useGetAllPrescriptionInstructionsQuery({
            page: 0,
            size: 1000
        });

    const predefinedInstructionsMap = useMemo(() => {
        return new Map(
            (predefinedInstructionsListResponse?.data ?? []).map(
                (item: any) => [String(item.id), item]
            )
        );
    }, [predefinedInstructionsListResponse]);

    const [
        getActiveIngredientsByIds,
        { data: activeIngredientsByIds }
    ] = useGetActiveIngredientsByIdsMutation();

const activeIngredientIds = useMemo(() => {
    return Array.from(
        new Set(
            medications
                .map(item => Number(item.activeIngredientId))
                .filter(id => Number.isFinite(id) && id > 0)
        )
    );
}, [medications]);

useEffect(() => {
    if (activeIngredientIds.length === 0) return;

    getActiveIngredientsByIds(activeIngredientIds);
}, [activeIngredientIds, getActiveIngredientsByIds]);

    useEffect(() => {
        if (!activeIngredientIds.length) return;

        getActiveIngredientsByIds(activeIngredientIds);
    }, [activeIngredientIds, getActiveIngredientsByIds]);

    const activeIngredientsMap = useMemo(() => {
        return new Map(
            (activeIngredientsByIds ?? []).map(item => [
                String(item.id),
                item
            ])
        );
    }, [activeIngredientsByIds]);

    const [
    getLovValuesBulkByKeys,
    { data: indicationUseLovResponse }
    ] = useLazyGetLovValuesBulkByKeysQuery();

    const indicationUseKeys = useMemo(() => {
    const keys = medications
        .map(item => item.indicationUse)
        .filter(
        (key): key is string =>
            key !== null &&
            key !== undefined &&
            String(key).trim() !== ''
        )
        .map(key => String(key));

    return Array.from(new Set(keys));
    }, [medications]);

    useEffect(() => {
    if (indicationUseKeys.length === 0) return;

    getLovValuesBulkByKeys(indicationUseKeys);
    }, [indicationUseKeys, getLovValuesBulkByKeys]);

    const indicationUseLovMap = useMemo(() => {
    const map = new Map<string, string>();

    const response: any = indicationUseLovResponse;

    const lovValues =
        response?.object ??
        response?.data ??
        response ??
        [];

    if (!Array.isArray(lovValues)) {
        return map;
    }

    lovValues.forEach((item: any) => {
        if (item?.key != null) {
        map.set(
            String(item.key),
            item.lovDisplayVale ?? item.name ?? ''
        );
        }
    });

    return map;
    }, [indicationUseLovResponse]);

    const [
        fetchIcdByIds,
        { data: icdDiagnosesByIds }
    ] = useLazyGetIcdDiagnosesByIdsQuery();

const icdIds = useMemo(() => {
    return Array.from(
        new Set(
            medications
                .map(item => Number(item.indicationIcd))
                .filter(id => Number.isFinite(id) && id > 0)
        )
    );
}, [medications]);

useEffect(() => {
    if (icdIds.length === 0) return;

    fetchIcdByIds({ ids: icdIds });
}, [icdIds, fetchIcdByIds]);
    useEffect(() => {
        if (!icdIds.length) return;

        fetchIcdByIds({
            ids: icdIds
        });
    }, [icdIds, fetchIcdByIds]);

    const icdDiagnosesMap = useMemo(() => {
        return new Map(
            (icdDiagnosesByIds ?? []).map(item => [
                String(item.id),
                item
            ])
        );
    }, [icdDiagnosesByIds]);

    const { data: customeInstructions } =
        useGetCustomeInstructionsQuery({
            ...({} as any)
        });

    const { data: unitLovQueryResponse } =
        useGetLovValuesByCodeQuery('UOM');

    const { data: frequencyLov } =
        useGetLovValuesByCodeQuery('MED_FREQUENCY');

    const getLovDisplay = (
        list: any[] = [],
        key: any,
        labelKey = 'lovDisplayVale'
    ) => {
        if (key === null || key === undefined || key === '') {
            return '';
        }

        const keyStr = String(key);

        const keyNum = Number(key);

        for (const item of list ?? []) {
            if (
                String(item?.key) === keyStr ||
                Number(item?.key) === keyNum
            ) {
                const display =
                    item?.[labelKey] ??
                    item?.lovDisplayVale ??
                    item?.name ??
                    '';

                if (display) {
                    return String(display);
                }
            }

            if (
                String(item?.id) === keyStr ||
                Number(item?.id) === keyNum
            ) {
                const display =
                    item?.[labelKey] ??
                    item?.lovDisplayVale ??
                    item?.name ??
                    '';

                if (display) {
                    return String(display);
                }
            }

            if (
                item?.valueCode &&
                String(item.valueCode) === keyStr
            ) {
                const display =
                    item?.[labelKey] ??
                    item?.lovDisplayVale ??
                    item?.name ??
                    '';

                if (display) {
                    return String(display);
                }
            }
        }

        const fallback = conjureValueBasedOnKeyFromList(
            list,
            key,
            labelKey
        );

        if (fallback && fallback !== key) {
            return String(fallback);
        }

        return '';
    };

    const toStr = (value: any) => {
        if (value === null || value === undefined) {
            return '';
        }

        return String(value);
    };

    const tableColumns = [
        {
        key: 'prescriptionId',
        title: <Translate>Prescription ID</Translate>,
        flexGrow: 1,
        render: (rowData: PrescriptionEmrRow) =>
            rowData?.prescriptionNum ?? rowData?.id ?? ''
        },
        {
            key: 'visitId',
            title: <Translate>Visit Number</Translate>,
            flexGrow: 1,
            render: (rowData: PrescriptionEmrRow) => {
                const encounter = encounterMap.get(
                    String(rowData.encounterId)
                );

                return encounter?.encounterNumber ?? '';
            }
        },
        {
            key: 'visitDate',
            title: <Translate>Visit Date</Translate>,
            flexGrow: 1,
            render: (rowData: PrescriptionEmrRow) => {
                const encounter = encounterMap.get(
                    String(rowData.encounterId)
                );

                return encounter?.createdDate
                    ? formatDateWithoutSeconds(encounter.createdDate)
                    : '';
            }
        },
        {
            key: 'createdDate',
            title: <Translate>Created At</Translate>,
            render: (rowData: PrescriptionEmrRow) =>
                rowData?.createdDate
                    ? formatDateWithoutSeconds(
                        rowData.createdDate
                    )
                    : ''
        },
        {
            key: 'createdBy',
            title: <Translate>Created By</Translate>,
            render: (rowData: PrescriptionEmrRow) => (
                <UserDateCell login={rowData?.createdBy} />
            )
        },
        {
            key: 'submittedBy',
            title: <Translate>Submitted By</Translate>,
            render: (rowData: PrescriptionEmrRow) => (
                <UserDateCell login={rowData?.submitedBy} />
            )
        },
        {
            key: 'submittedAt',
            title: <Translate>Submitted At</Translate>,
            render: (rowData: PrescriptionEmrRow) =>
                rowData?.submitedDate
                    ? formatDateWithoutSeconds(
                        rowData.submitedDate
                    )
                    : ''
        }
    ];

    const medicationColumns = [
        {
            key: 'activeIngredientId',
            title: <Translate>Active Ingredients</Translate>,
            render: (rowData: any) => {
                const ingredient = activeIngredientsMap.get(
                    String(rowData.activeIngredientId)
                );

                return ingredient?.name ?? '-';
            }
        },
        {
            key: 'medicationsId',
            title: <Translate>Medication Name</Translate>,
            render: (rowData: any) => {
                const medId =
                    rowData.medicationsId ??
                    rowData.genericMedicationsId;

                if (medId != null) {
                    return (
                        medicationMap.get(String(medId))?.name ??
                        '-'
                    );
                }

                return rowData.otherMedicationName ?? '-';
            }
        },
        {
            key: 'instructions',
            title: <Translate>Instructions</Translate>,
            render: (rowData: any) => {
                const type = rowData?.instructionsType;
                if (type === 'PRE_DEFINED_INSTRUCTIONS') {
                    const inst = predefinedInstructionsMap.get(
                        String(rowData?.instructions)
                    );

                    if (!inst) {
                        return 'No predefined instructions';
                    }

                    return [
                        inst?.dose,
                        formatEnumString(inst?.unit),
                        formatEnumString(inst?.rout),
                        formatEnumString(inst?.frequency)
                    ]
                        .filter(Boolean)
                        .join(', ');
                }
                if (type === 'MANUAL_INSTRUCTIONS') {
                    return (
                        rowData?.instructions ||
                        'No instructions'
                    );
                }
                if (type === 'CUSTOM_INSTRUCTIONS') {
                    if (
                        rowData?.dose != null ||
                        rowData?.doesUnit ||
                        rowData?.frequency ||
                        rowData?.rout
                    ) {
                        const unitLovArray = Array.isArray(
                            unitLovQueryResponse
                        )
                            ? unitLovQueryResponse
                            : unitLovQueryResponse?.object ?? [];

                        const freqLovArray = Array.isArray(
                            frequencyLov
                        )
                            ? frequencyLov
                            : frequencyLov?.object ?? [];

                        const unitDisplay =
                            getLovDisplay(
                                unitLovArray,
                                rowData?.doesUnit
                            ) ||
                            formatEnumString(
                                rowData?.doesUnit
                            ) ||
                            toStr(rowData?.doesUnit);

                        const freqDisplay =
                            getLovDisplay(
                                freqLovArray,
                                rowData?.frequency
                            ) ||
                            formatEnumString(
                                rowData?.frequency
                            ) ||
                            toStr(rowData?.frequency);

                        return [
                            toStr(rowData?.dose),
                            unitDisplay,
                            formatEnumString(rowData?.rout),
                            freqDisplay
                        ]
                            .map(value => value.trim())
                            .filter(Boolean)
                            .join(', ');
                    }

                    const ci = (
                        (Array.isArray(customeInstructions) ? customeInstructions : [])
                    ).find(
                        (item: any) =>
                            String(
                                item.prescriptionMedicationsKey
                            ) ===
                            String(
                                rowData?.id ?? rowData?.key
                            )
                    );

                    return [
                        toStr(ci?.dose),
                        toStr(
                            ci?.unitLvalue?.lovDisplayVale
                        ),
                        formatEnumString(ci?.roaLkey),
                        toStr(
                            ci?.frequencyLvalue?.lovDisplayVale
                        )
                    ]
                        .map(value => value.trim())
                        .filter(Boolean)
                        .join(', ');
                }

                return '-';
            }
        },
        {
            key: 'instructionsType',
            title: <Translate>Instructions Type</Translate>,
            render: (rowData: any) =>
                formatEnumString(
                    rowData?.instructionsType
                )
        },
        {
            key: 'notes',
            title: <Translate>Note</Translate>,
            render: (rowData: any) =>
                rowData?.notes ?? ''
        },
        {
            key: 'parametersToMonitor',
            title: (
                <Translate>
                    Lab Monitoring Parameters
                </Translate>
            ),
            render: (rowData: any) =>
                rowData?.parametersToMonitor ?? ''
        },
        {
            key: 'indicationUse',
            title: <Translate>Indicated Use</Translate>,
            render: (rowData: any) =>
                indicationUseLovMap.get(
                    String(rowData?.indicationUse)
                ) ?? '-'
        },
        {
            key: 'indication',
            title: <Translate>Indication</Translate>,
            render: (rowData: any) => {
                const diagnosis = icdDiagnosesMap.get(
                    String(rowData?.indicationIcd)
                );

                return diagnosis
                    ? `${diagnosis.icdCode ?? ''} - ${diagnosis.icdShortDescription ?? ''
                    }`
                    : '-';
            }
        },
        {
            key: 'chronicMedication',
            title: <Translate>Is Chronic</Translate>,
            render: (rowData: any) =>
                rowData?.chronicMedication
                    ? 'Yes'
                    : 'No'
        }
    ];

    const getNestedTable = (
        rowData: PrescriptionEmrRow
    ) => {
        const isSelected =
            selectedPrescriptionId === rowData.id;

        return {
            columns: medicationColumns,

            data: isSelected
                ? medications
                : [],

            loading: isSelected && (isLoadingPrescriptionMedications || isFetchingPrescriptionMedications),

            page: isSelected
                ? nestedPage
                : 0,

            rowsPerPage: nestedRowsPerPage,

            totalCount: isSelected
                ? medicationsTotalCount
                : 0,

            onPageChange: (
                _: unknown,
                newPage: number
            ) => {
                setNestedPage(newPage);
            },

            onRowsPerPageChange: (
                event: React.ChangeEvent<HTMLInputElement>
            ) => {
                setNestedRowsPerPage(
                    Number(event.target.value)
                );

                setNestedPage(0);
            }
        };
    };

    const handlePrescriptionClick = (
        rowData: PrescriptionEmrRow
    ) => {
        if (selectedPrescriptionId !== rowData.id) {
            setSelectedPrescriptionId(
                rowData.id ?? null
            );

            setNestedPage(0);
        }
    };

    const handlePageChange = (
        _: unknown,
        newPage: number
    ) => {
        setPageIndex(newPage);

        setSelectedPrescriptionId(null);

        setNestedPage(0);
    };

    const handleRowsPerPageChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        setRowsPerPage(
            Number(event.target.value)
        );

        setPageIndex(0);

        setSelectedPrescriptionId(null);

        setNestedPage(0);
    };

    return (
        <MyNestedTableEmr
            key={`${patientId ?? ""}-${pageIndex}-${rowsPerPage}`}
            columns={tableColumns}
            data={prescriptions}
            loading={isLoadingPrescriptions}
            getNestedTable={getNestedTable}
            onRowClick={handlePrescriptionClick}
            onExpandRow={(rowData: PrescriptionEmrRow, opening: boolean) => {
                if (opening) handlePrescriptionClick(rowData);
                else if (selectedPrescriptionId === rowData.id) setSelectedPrescriptionId(null);
            }}
            height="50vh"
            nestedHeight="25vh"
            page={pageIndex}
            rowsPerPage={rowsPerPage}
            totalCount={totalCount}
            onPageChange={handlePageChange}
            onRowsPerPageChange={
                handleRowsPerPageChange
            }
        />
    );
};

export default PrescritionEmr;