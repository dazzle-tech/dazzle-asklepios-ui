import InfoCardList from "@/components/InfoCardList";
import React from "react";
import { useGetActiveIngredientsByBrandQuery } from "@/services/setup/brandmedication/BrandMedicationActiveIngredientService";
import { useGetLovValuesByCodeQuery } from "@/services/setupService";
import { conjureValueBasedOnKeyFromList } from "@/utils";

const ActiveIngredient = ({ selectedGeneric, selectedActiveIngredient }) => {
  const direction = localStorage.getItem('direction') || 'LTR';
  const dir = direction === 'RTL' ? 'rtl' : 'ltr';

  const brandId = selectedGeneric?.id;
 const { data: unitLov } = useGetLovValuesByCodeQuery("VALUE_UNIT");
 
  const {
    data: brandActives = [],
    isFetching,
    isError,
  } = useGetActiveIngredientsByBrandQuery(brandId, {
    skip: !brandId,
  });
 
  

  const listForUI = (brandActives ?? []).map((rel) => {
    const ai = rel.activeIngredient ?? {}; // defensive
    return {
      relationId: rel.id,
      activeIngredientName: ai.name ?? "",
      activeIngredientATCCode: ai.atcCode ?? "",
      strengthDisplay:
        (rel.strength ?? "") + (rel.unit ? ` ${conjureValueBasedOnKeyFromList(unitLov?.object,rel?.unit,"lovDisplayVale")}` : ""),
      isControlledDisplay: ai.isControlled ? "Yes" : "No",
      controlledDisplay: ai.controlled ?? "",
    };
  });

  if (!brandId) {
    if (selectedActiveIngredient) {
      const ai = selectedActiveIngredient;
      const listForSelectedAi = [
        {
          activeIngredientName: ai.name ?? '',
          activeIngredientATCCode: ai.atcCode ?? '',
          strengthDisplay: '',
          isControlledDisplay: ai.isControlled ? 'Yes' : 'No',
          controlledDisplay: ai.controlled ?? ''
        }
      ];

      return (
        <div dir={dir}>
          <InfoCardList
            list={listForSelectedAi}
            fields={[
              'activeIngredientName',
              'activeIngredientATCCode',
              'strengthDisplay',
              'isControlledDisplay',
              'controlledDisplay'
            ]}
            titleField="activeIngredientName"
            fieldLabels={{
              activeIngredientName: 'Active Ingredient',
              activeIngredientATCCode: 'ATC Code',
              strengthDisplay: 'Strength',
              isControlledDisplay: 'Is Controlled',
              controlledDisplay: 'Controlled'
            }}
          />
        </div>
      );
    }

    return <div style={{ padding: 12 }}>Select an active ingredient</div>;
  }

  if (isFetching) {
    return <div style={{ padding: 12 }}>Loading active ingredients...</div>;
  }

  if (isError) {
    return <div style={{ padding: 12 }}>Failed to load active ingredients</div>;
  }

  return (
    <div dir={dir}>
    <InfoCardList
      list={listForUI}
      fields={[
        "activeIngredientName",
        "activeIngredientATCCode",
        "strengthDisplay",
        "isControlledDisplay",
        "controlledDisplay",
      ]}
      titleField="activeIngredientName"
      fieldLabels={{
        activeIngredientName: "Active Ingredient",
        activeIngredientATCCode: "ATC Code",
        strengthDisplay: "Strength",
        isControlledDisplay: "Is Controlled",
        controlledDisplay: "Controlled",
      }}
    />
    </div>
  );
};

export default ActiveIngredient;
