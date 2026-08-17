import { notify } from '@/utils/uiReducerActions';
import { isUncoveredCashCancelled } from '@/utils/uncoveredInsuranceConfirm';
import { useCheckInsurancePriceListCoverageMutation } from '@/services/billing/billingTransactionService';
import { newPatientPrescriptionMedication } from '@/types/model-types-constructor-new';

type Params = {
    dispatch: any;
    currentPrescription: any;
    patientPrescriptionMedications: any[];
    selectedRows: any[];
    patientPrescriptionMedicationObject: any;
    deleteMedication: any;
    submitPrescription: any;
    createOrGetPrescription: any;
    patientId: any;
    encounterId: any;
    authSlice: any;
    encounter: any;
    setOpenCancellation: any;
    setSelectedRows: any;
    medicRefetch: any;
    preRefetch: any;
    setSummaryModalOpen: any;
    setCurrentPrescription: any;
    setPreKeyRecord: any;
    setSelectedPreviewMedication: any;
    setPatientPrescriptionMedicationObject: any;
    setOpenDetailsModal: any;
    setOpenToAdd: any;
    isCanceledStatus: (status: any) => boolean;
};

export const usePrescriptionActions = ({
    dispatch,
    currentPrescription,
    patientPrescriptionMedications,
    selectedRows,
    patientPrescriptionMedicationObject,
    deleteMedication,
    submitPrescription,
    createOrGetPrescription,
    patientId,
    encounterId,
    authSlice,
    encounter,
    setOpenCancellation,
    setSelectedRows,
    medicRefetch,
    preRefetch,
    setSummaryModalOpen,
    setCurrentPrescription,
    setPreKeyRecord,
    setSelectedPreviewMedication,
    setPatientPrescriptionMedicationObject,
    setOpenDetailsModal,
    setOpenToAdd,
    isCanceledStatus
}: Params) => {
    const [checkInsuranceCoverage] = useCheckInsurancePriceListCoverageMutation();

    const handleCancle = async () => {
        const rowsToCancel = selectedRows.length
            ? selectedRows
            : patientPrescriptionMedicationObject?.id
                ? [patientPrescriptionMedicationObject]
                : [];

        if (!rowsToCancel.length) {
            dispatch(notify({ msg: 'Please select medication(s) to cancel', type: 'warning' } as any));
            return;
        }

        try {
            await Promise.all(
                rowsToCancel
                    .filter((r: any) => r?.id != null)
                    .map((r: any) =>
                        deleteMedication({
                            id: Number(r.id),
                            cancellationReason: patientPrescriptionMedicationObject.cancellationReason,
                        }).unwrap()
                    )
            );

            dispatch(
                notify({
                    msg: 'Selected medications deleted successfully',
                    type: 'success'
                } as any)
            );

            setOpenCancellation(false);
            setSelectedRows([]);
            await medicRefetch();
        } catch {
            dispatch(notify({ msg: 'One or more deletions failed', type: 'error' }) as any);
        }
    };


    const handleConfirmSubmitPres = async () => {
        if (!currentPrescription?.id) return;

        const submittedPrescriptionId = currentPrescription.id;

        const nonCancelledMeds = patientPrescriptionMedications.filter(
            (m: any) => !isCanceledStatus((m as any)?.status)
        );

        if (nonCancelledMeds.length === 0) {
            dispatch(notify({ msg: 'Cannot submit: all medications are cancelled', type: 'warning' } as any));
            return;
        }

        try {
            let acceptUncoveredAsCash = false;
            if (encounterId) {
                const coverageResults = await Promise.all(
                    nonCancelledMeds.map(async (med: any) => {
                        const brandId = med?.medicationsId ?? med?.genericMedicationsId;
                        if (!brandId) {
                            return false;
                        }
                        try {
                            const result = await checkInsuranceCoverage({
                                encounterId,
                                billingItemType: 'MEDICATION',
                                brandMedicationId: Number(brandId)
                            }).unwrap();
                            return Boolean(result.requiresCashConfirmation);
                        } catch {
                            return false;
                        }
                    })
                );
                acceptUncoveredAsCash = coverageResults.some(Boolean);
            }

            await submitPrescription({
                id: submittedPrescriptionId,
                acceptUncoveredAsCash
            }).unwrap();

            await preRefetch();
            await medicRefetch();

            dispatch(notify({ msg: 'Submitted successfully', type: 'success' } as any));

            setSummaryModalOpen(false);
            setOpenCancellation(false);
            setCurrentPrescription(null);
            setPreKeyRecord({ preKey: null });
            setSelectedRows([]);
            setSelectedPreviewMedication(null);

            setPatientPrescriptionMedicationObject({
                ...newPatientPrescriptionMedication,
                prescriptionHeaderId: null
            } as any);
        } catch (error) {
            if (isUncoveredCashCancelled(error)) {
                return;
            }
            dispatch(notify({ msg: 'Submit failed', type: 'error' } as any));
        }
    };

    const handleNewPrescriptionAndAddMedication = async () => {
        let prescription = currentPrescription;

        if (!patientId || !encounterId) {
            dispatch(notify({ msg: 'Patient or encounter is missing', type: 'warning' } as any));
            return;
        }

        if (!prescription?.id) {
            try {
                prescription = await createOrGetPrescription({
                    patientId,
                    encounterId,
                    fromFacilityId: authSlice?.tenant?.selectedFacility?.id ?? (null as any),
                    fromDepartmentId: encounter?.departmentId ?? (null as any),
                    urgencyLevel: 'NORMAL'
                } as any).unwrap();

                setCurrentPrescription(prescription);
                setPreKeyRecord({ preKey: prescription?.id ?? null });

                await preRefetch();
            } catch {
                dispatch(notify({ msg: 'Failed to create prescription', type: 'error' } as any));
                return;
            }
        }

        if (String(prescription?.status ?? '').toUpperCase() === 'SUBMITTED') {
            dispatch(
                notify({
                    msg: 'Cannot add medication to submitted prescription',
                    type: 'warning'
                } as any)
            );
            return;
        }

        setPatientPrescriptionMedicationObject({
            ...newPatientPrescriptionMedication,
            prescriptionHeaderId: prescription.id
        } as any);

        setOpenDetailsModal(true);
        setOpenToAdd(true);
    };

    return {
        handleCancle,
        handleConfirmSubmitPres,
        handleNewPrescriptionAndAddMedication
    };
};