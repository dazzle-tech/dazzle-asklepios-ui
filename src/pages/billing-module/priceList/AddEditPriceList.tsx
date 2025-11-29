import React, { useEffect, useState } from "react";
import MyInput from "@/components/MyInput";
import { Form } from "rsuite";
import ChildModal from "@/components/ChildModal";
import Translate from "@/components/Translate";
import MyButton from "@/components/MyButton/MyButton";
import clsx from "clsx";
import SectionContainer from "@/components/SectionsoContainer";
import { useAppDispatch } from "@/hooks";
import { notify } from "@/utils/uiReducerActions";
import { useEnumOptions } from "@/services/enumsApi";
import { useGetAllFacilitiesQuery } from "@/services/security/facilityService";
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
  const { data: allFacilities = [] } = useGetAllFacilitiesQuery(null);
useEffect(() => {
  const fid = priceList?.facilityId;
  if (!fid) return;

  setPriceList(prev => {
    const existing = prev.facilityIds ?? [];
   
    if (existing.includes(fid)) return prev;

    return {
      ...prev,
      facilityIds: [...existing, fid],
    };
  });
}, [priceList?.facilityId, setPriceList]);

  const validateRequiredFields = () => {
    const required = ["name", "type", "effectiveFrom"];
    const missing = required.filter((k) => !priceList[k]);
    if (missing.length) {
      dispatch(
        notify({
          msg: "Please fill required fields: " + missing.join(", "),
          sev: "error",
        })
      );
      return false;
    }
    return true;
  };

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
       
      };

      const res = await savePriceList(payload).unwrap();

      dispatch(notify({ msg: "Saved successfully", sev: "success" }));

      // backend returns list
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
              fieldLabel="Facilities (bulk)"
              fieldName="facilityIds"
              selectData={allFacilities ?? []}
              selectDataLabel="name"
              selectDataValue="id"
              record={priceList}
                setRecord={setPriceList}
              searchable
              width={520}
            //   multiple
              placeholder="Leave empty for Global"
            />
            <small style={{ opacity: 0.7 }}>
              <Translate>Empty = Global for all facilities</Translate>
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
                width={250}
              />

              <MyInput
                column
                fieldType="date"
                fieldLabel="Effective To"
                fieldName="effectiveTo"
                record={priceList}
                setRecord={setPriceList}
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

  return (
    <MyModal
      actionButtonLabel={priceList?.id ? "Save" : "Create"}
      open={open}
      setOpen={setOpen}
      title={priceList?.id ? "Edit Price List" : "New Price List"}
      actionButtonFunction={handleSave}
      
      content={() => conjureFormContent()}
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
