import React, { useEffect, useMemo } from 'react';
import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';
import { useGetActiveIngredientsByIdsMutation } from '@/services/setup/activeIngredients/activeIngredientsService';
import { useGetBrandMedicationsByIdsQuery } from '@/services/setup/brandmedication/BrandMedicationService';

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  prescription: any;
  medications: any[];
  loading?: boolean;
  onSubmit: () => void | Promise<void>;
  onCancel: () => void | Promise<void>;
  onClose?: () => void;
};

const IncompletePrescriptionModal: React.FC<Props> = ({
  open,
  setOpen,
  prescription,
  medications = [],
  loading = false,
  onSubmit,
  onCancel,
  onClose
}) => {
      const [getActiveIngredientsByIds, { data: activeIngredientsByIds }] =
        useGetActiveIngredientsByIdsMutation();
    
      const activeIngredientIds = useMemo(() => {
        const ids = medications.map((item: any) => item.activeIngredientId);
        return ids.filter((id: any): id is number => id != null);
      }, [medications]);

      useEffect(() => {
        if (!activeIngredientIds.length) return;
        getActiveIngredientsByIds(activeIngredientIds);
      }, [activeIngredientIds, getActiveIngredientsByIds]);

      const activeIngredientsMap = useMemo(() => {
        return new Map((activeIngredientsByIds ?? []).map((item: any) => [item.id, item]));
      }, [activeIngredientsByIds]);

      const brandMedicationIds = useMemo(() => {
        const ids = medications
          .map((item: any) => item.medicationsId ?? item.genericMedicationsId)
          .filter((id: any): id is number => id != null);
        return Array.from(new Set(ids));
      }, [medications]);

      const { data: brandMedicationsByIdsResponse } = useGetBrandMedicationsByIdsQuery(
        { ids: brandMedicationIds },
        { skip: !brandMedicationIds.length }
      );

      const brandMedicationsMap = useMemo(() => {
        return new Map((brandMedicationsByIdsResponse ?? []).map((item: any) => [item.id, item]));
      }, [brandMedicationsByIdsResponse]);

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Incomplete Prescription"
      size="md"
      hideCancel
      hideActionBtn
      footerButtons={
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', width: '100%' }}>
          <MyButton
            appearance="subtle"
            onClick={() => {
              setOpen(false);
              onClose?.();
            }}
            disabled={loading}
          >
            Close
          </MyButton>
          <MyButton appearance="ghost" onClick={onCancel} loading={loading}>
            Cancel Prescription
          </MyButton>
          <MyButton appearance="primary" onClick={onSubmit} loading={loading}>
            Submit Prescription
          </MyButton>
        </div>
      }
      content={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div
            style={{
              padding: 12,
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              background: '#fafafa'
            }}
          >
            <p style={{ margin: 0, fontWeight: 600, marginBottom: 6 }}>
              There is a prescription still in draft status for this encounter.
            </p>
            <p style={{ margin: 0, color: '#4b5563' }}>
              Please choose to submit it or cancel it before completing the visit.
            </p>
            {prescription?.prescriptionNum ? (
              <p style={{ margin: '8px 0 0', color: '#111827' }}>
                Prescription No: {prescription.prescriptionNum}
              </p>
            ) : null}
          </div>

          <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: '10px 12px', background: '#f3f4f6', fontWeight: 600 }}>
              Prescription Medications
            </div>
            {medications.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12 }}>
                {medications.map((item: any, index: number) => {
                  const medId = item?.medicationsId ?? item?.genericMedicationsId;
                  const brandMedicationName = brandMedicationsMap.get(medId)?.name;
                  const medicationName =
                    brandMedicationName ||
                    item?.brandName ||
                    item?.medicationName ||
                    item?.name ||
                    item?.genericName ||
                    `Medication ${index + 1}`;
                  const activeIngredient =
                    activeIngredientsMap.get(item?.activeIngredientId)?.name ||
                    'Not available';

                  return (
                    <div
                      key={item?.id ?? index}
                      style={{
                        padding: '10px 12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: 6,
                        background: '#fff'
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>{medicationName}</div>
                      <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                        Active Ingredient: {activeIngredient}
                      </div>
                   
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: 12, color: '#6b7280' }}>
                No medications found for this draft prescription.
              </div>
            )}
          </div>
        </div>
      }
    />
  );
};

export default IncompletePrescriptionModal;
