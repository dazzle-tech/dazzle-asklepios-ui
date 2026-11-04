// AddEditPriceList.tsx
import React, { useEffect } from "react";
import MyInput from "@/components/MyInput";
import { Form } from "rsuite";
import Translate from "@/components/Translate";
import clsx from "clsx";
import SectionContainer from "@/components/SectionsoContainer";
import { useAppDispatch } from "@/hooks";
import { notify } from "@/utils/uiReducerActions";
import { useEnumOptions } from "@/services/enumsApi";
import { useGetActiveFacilitiesQuery } from '@/services/security/facilityService';
import { useSavePriceListMutation } from "@/services/billing/PriceListService";
import MyModal from "@/components/MyModal/MyModal";

const AddEditPriceList = ({
  open,
  setOpen,
  priceList,
  setPriceList,
  width,
  onSaved,
}) => {
  const dispatch = useAppDispatch();

  const [savePriceList] = useSavePriceListMutation();
  const priceListTypes = useEnumOptions("PriceListTypes");
  const { data: allFacilities = [] } = useGetActiveFacilitiesQuery(null);
 useEffect(() => {
  if (!open || !priceList) return;

  setPriceList(prev => {
    if (!prev) return prev;

    if (prev.facilityIds?.length) {
      return prev;
    }

    if (prev.facilityId) {
      return {
        ...prev,
        facilityIds: [prev.facilityId],
      };
    }

    return prev;
  });
}, [open, priceList?.id, priceList?.facilityId, setPriceList]);

  const validateRequiredFields = () => {
    const required = ["name", "type", "effectiveFrom"];
    const missing = required.filter((k) => !priceList?.[k]);

    const facilityMissing =
      !priceList?.facilityIds || priceList.facilityIds.length === 0;

    if (facilityMissing) missing.push("facilityIds");

    if (missing.length) {
      dispatch(
        notify({
          msg: "Please fill required fields: " + missing.join(", "),
          sev: "warning",
        })
      );
      return false;
    }
    return true;
  };
console.log("price list ",priceList);

  const handleSave = async () => {
    if (!validateRequiredFields()) return;

    try {
      const payload = {
        id: priceList.id ?? null,
        facilityIds: priceList.facilityIds ?? [],
        name: priceList.name,
        type: priceList.type,
        effectiveFrom: priceList.effectiveFrom,
        effectiveTo: priceList.effectiveTo || null,
        description: priceList.description || null,
        isActive: priceList.isActive ?? true,
      };

      const res = await savePriceList(payload).unwrap();

      dispatch(notify({ msg: "Saved successfully", sev: "success" }));

      if (Array.isArray(res) && res.length === 1) {
        setPriceList(res[0]);
      }

      onSaved?.();
      setOpen(false);
    } catch (err) {
      dispatch(
        notify({
          msg: err?.data?.detail || "Failed to save price list",
          sev: "error",
        })
      );
    }
  };

  const conjureFormContent = () => (
    <Form layout="inline" fluid>
      <SectionContainer
        title="Basic Information"
        content={
          <>
            <div className={clsx({ "container-of-two-fields-practitioner": width > 600 })}>
              <MyInput
                column
                fieldName="name"
                fieldLabel="Name"
                required
                record={priceList}
                setRecord={setPriceList}
                width={250}
              />

              <MyInput
                column
                fieldName="type"
                fieldLabel="Type"
                fieldType="select"
                selectData={priceListTypes ?? []}
                selectDataLabel="label"
                selectDataValue="value"
                record={priceList}
                setRecord={setPriceList}
                required
                width={250}
              />
            </div>
          </>
        }
      />

      <SectionContainer
        title="Facility Scope"
        content={
          <>
            <MyInput
              fieldType="checkPicker"
              fieldLabel={"Facilities(bulk)"}
              fieldName="facilityIds"
              selectData={allFacilities ?? []}
              selectDataLabel="name"
              selectDataValue="id"
              record={priceList}
              setRecord={setPriceList}
              searchable
              width={520}
              placeholder={"Select at least one facility"}
              required
              disabled={priceList?.id}
            />
            <small style={{ opacity: 0.7 }}>
              <Translate>At least one facility is required</Translate>
            </small>
          </>
        }
      />

      <SectionContainer
        title="Effective Dates"
        content={
          <>
            <div className={clsx({ "container-of-two-fields-practitioner": width > 600 })}>
              <MyInput
                column
                fieldType="date"
                fieldLabel="Effective From"
                fieldName="effectiveFrom"
                record={priceList}
                setRecord={setPriceList}
                required
                disablePastDates
                width={250}
              />

              <MyInput
                column
                fieldType="date"
                fieldLabel="Effective To"
                fieldName="effectiveTo"
                record={priceList}
                setRecord={setPriceList}
                disablePastDates
                width={250}
              />
            </div>
          </>
        }
      />

      <SectionContainer
        title="Notes"
        content={
          <MyInput
            fieldType="textarea"
            fieldLabel="Description"
            fieldName="description"
            record={priceList}
            setRecord={setPriceList}
            width={520}
          />
        }
      />
    </Form>
  );


      // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <MyModal
      actionButtonLabel={priceList?.id ? "Save" : "Create"}
      open={open}
      setOpen={setOpen}
      title={priceList?.id ? "Edit Price List" : "New Price List"}
      actionButtonFunction={handleSave}
      content={() => <div dir={dir}>{conjureFormContent()}</div>}
      steps={[
        {
          title: "Price List Details",
          icon: <Translate>PL</Translate>,
        },
      ]}
      size="sm"
    />
  );
};

export default AddEditPriceList;
