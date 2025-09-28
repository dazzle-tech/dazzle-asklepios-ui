import React from "react";
import SectionContainer from "@/components/SectionsoContainer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTruckMedical, faCheck } from "@fortawesome/free-solid-svg-icons";
import { useSelector } from "react-redux";
import MyButton from "@/components/MyButton/MyButton";
import GlasgowComaScale from "../../../glasgow-coma-scale";

const GlasgowComaScaleICU: React.FC = () => {
  const mode = useSelector((state: any) => state.ui.mode);

  return (
    <SectionContainer
      title={
        <>
          <span className="icu-title-flow-sheet">
            <FontAwesomeIcon
              icon={faTruckMedical}
              className="title-icon-main-title"
              color={mode === "dark" ? "#dfdfdfff" : "#7d7d7dff"}
            />
            Glasgow coma scale
          </span>
          <div className="add-button-for-neurological-view">
            <MyButton prefixIcon={() => <FontAwesomeIcon icon={faCheck} />}>
              Save
            </MyButton>
          </div>
        </>
      }
      content={<GlasgowComaScale />}
    />
  );
};

export default GlasgowComaScaleICU;
