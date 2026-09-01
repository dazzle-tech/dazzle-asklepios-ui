import InfoCardList from "@/components/InfoCardList";
import { useGetActiveIngredientsByIdsMutation } from "@/services/setup/activeIngredients/activeIngredientsService";
import { useGetBrandMedicationByIdQuery } from "@/services/setup/brandmedication/BrandMedicationService";
import React, { useEffect, useState } from "react";

const ActiveIngredient = ({
  selectedGeneric,
  activeIngredientId,
}) => {
  const direction = localStorage.getItem("direction") || "LTR";
  const dir = direction === "RTL" ? "rtl" : "ltr";

  const [selectedActiveIngredient, setSelectedActiveIngredient] =
    useState(null);
  console.log("selectedGeneric:", selectedGeneric);
  const [getActiveIngredientsByIds, { data: activeIngredients }] =
    useGetActiveIngredientsByIdsMutation();
  const { data: brandMedication } = useGetBrandMedicationByIdQuery(
    selectedGeneric,
    {
      skip: !selectedGeneric,
    }
  );
  useEffect(() => {
    if (activeIngredientId) {
      getActiveIngredientsByIds([activeIngredientId]);
    }
  }, [activeIngredientId, getActiveIngredientsByIds]);

  useEffect(() => {
    if (activeIngredients?.length > 0) {
      setSelectedActiveIngredient(activeIngredients[0]);
    }
  }, [activeIngredients]);

  const activeIngredientInfo = selectedActiveIngredient
    ? [
      {
        activeIngredientName:
          selectedActiveIngredient.name ?? "",
        activeIngredientATCCode:
          selectedActiveIngredient.atcCode ?? "",
        isControlledDisplay:
          selectedActiveIngredient.isControlled
            ? "Yes"
            : "No",
        controlledDisplay:
          selectedActiveIngredient.controlled ?? "",
      },
    ]
    : [];

  const brandInfo = brandMedication
    ? [
      {
        brandName:
          brandMedication.name ??
          brandMedication.brandName ??
          "",
        brandCode:
          brandMedication.code ??
          brandMedication.brandCode ??
          "",
      },
    ]
    : [];
console.log("brandInfo:", brandInfo);
  return (
    <div dir={dir}>
      {selectedActiveIngredient ? (
        <InfoCardList
          list={activeIngredientInfo}
          fields={[
            "activeIngredientName",
            "activeIngredientATCCode",
            "isControlledDisplay",
            "controlledDisplay",
          ]}
          titleField="activeIngredientName"
          fieldLabels={{
            activeIngredientName: "Active Ingredient",
            activeIngredientATCCode: "ATC Code",
            isControlledDisplay: "Is Controlled",
            controlledDisplay: "Controlled",
          }}
        />
      ) : (
        <div style={{ padding: 12 }}>
          Select an active ingredient
        </div>
      )}

      {selectedGeneric && (
        <div style={{ marginTop: 16 }}>
          <InfoCardList
            list={brandInfo}
            fields={[
              "brandName",
              "brandCode",
            ]}
            titleField="brandName"
            fieldLabels={{
              brandName: "Brand",
              brandCode: "Code",
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ActiveIngredient;