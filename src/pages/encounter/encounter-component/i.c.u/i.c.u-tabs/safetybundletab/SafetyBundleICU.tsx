// SafetyBundleICU.tsx
import React, { useState } from "react";
import './style.less';
import { faShield, faUser } from '@fortawesome/free-solid-svg-icons';

import VAP from "./VAP";
import DVT from "./DVT";
import CAUTI from "./CAUTI";
import CLABSI from "./Clabsi";
import EarlyMobility from "./EarlyMobility";
import DeliriumPrevention from "./DeliriumPrevention";
import StressUlcerProphylaxis from "./StressUlcerProphylaxis";
import SectionContainer from "@/components/SectionsoContainer";
import SafetyBundleOverview from "./SafetyBundleOverview";

const SafetyBundleICU: React.FC = () => {
  const [activeKey, setActiveKey] = useState<string | number>('1');

  // ----- بيانات كل قسم -----
  const vapPreventionData = [
    { id: 2, status: "Complete" },
    { id: 3, status: "Complete" },
    { id: 4, status: "Due" },
    { id: 5, status: "Due" },
    { id: 6, status: "Complete" },
  ];

  const dvtData = [
    { id: 1, status: "Complete" },
    { id: 2, status: "Complete" },
    { id: 3, status: "Complete" },
  ];

  const cautiData = [
    { id: 1, status: "Complete" },
    { id: 2, status: "Due" },
    { id: 3, status: "Complete" },
  ];

  const clabsiData = [
    { id: 1, status: "Complete" },
    { id: 2, status: "Complete" },
    { id: 3, status: "Due" },
    { id: 4, status: "Due" },
  ];

  const earlyMobilityData = [
    { id: 1, status: "Complete" },
    { id: 2, status: "Complete" },
    { id: 3, status: "Complete" },
  ];

  const deliriumData = [
    { id: 1, status: "Complete" },
    { id: 2, status: "Complete" },
    { id: 3, status: "Complete" },
  ];

  const stressUlcerData = [
    { id: 1, status: "Complete" },
    { id: 2, status: "Complete" },
  ];

  const bundles = [
    {
      key: "vap",
      title: "VAP Prevention",
      data: vapPreventionData,
      icon: faShield,
      color: "#F6C200",
    },
    {
      key: "clabsi",
      title: "CLABSI Prevention",
      data: clabsiData,
      icon: faShield,
      color: "#E22D2D",
    },
    {
      key: "cauti",
      title: "CAUTI Prevention",
      data: cautiData,
      icon: faShield,
      color: "#F6C200",
    },
    {
      key: "dvt",
      title: "DVT Prophylaxis",
      data: dvtData,
      icon: faShield,
      color: "#00AA5B",
    },
    {
      key: "mobility",
      title: "Early Mobility",
      data: earlyMobilityData,
      icon: faUser,
      color: "#009CFF",
    },
    {
      key: "delirium",
      title: "Delirium Prevention",
      data: deliriumData,
      icon: faShield,
      color: "#F6C200",
    },
    {
      key: "stress",
      title: "Stress Ulcer Prophylaxis",
      data: stressUlcerData,
      icon: faShield,
      color: "#00AA5B",
    },
  ];

  return (
    <>
      <SectionContainer
        title={"Safety Bundle Overview"}
        content={<SafetyBundleOverview bundles={bundles} />}
      />

      <div className="dynamic-cards-over-view-grid">
        <VAP />
        <CLABSI />
        <CAUTI />
        <DVT />
        <EarlyMobility />
        <DeliriumPrevention />
        <StressUlcerProphylaxis />
      </div>
    </>
  );
};

export default SafetyBundleICU;
