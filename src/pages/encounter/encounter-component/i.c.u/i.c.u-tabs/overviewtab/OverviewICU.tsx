import React, { useState } from "react";
import MyModal from "@/components/MyModal/MyModal";
import OverviewCardsModals from './OverviewCardsModals';
import './style.less';
import TodayGoalsSection from "./TodayGoalsSection";
import ActiveProblemsSection from "./ActiveProblemsSection";
import ActiveDripsSection from "./ActiveDripsSection";
import FluidBalanceSection from "./FluidBalanceSection";
import SedationAnalgesiaSection from "./SedationAnalgesiaSection";
import VentilatorSection from "./VentilatorSection";


const OverviewICU: React.FC = () => {
    const [activeKey, setActiveKey] = useState<string | number>('1');


    const [openSedationAnalgesia, setOpenSedationAnalgesia] = useState(false);


      const [openOverViewModals, setOpenOverViewModals] = useState<any>({});
  const [edit, setEdit] = useState<boolean>(false);




    return (<>
<div className="dynamic-cards-over-view-grid">
<TodayGoalsSection />
<ActiveProblemsSection/>
<ActiveDripsSection/>
<FluidBalanceSection/>
<SedationAnalgesiaSection/>
<VentilatorSection/>
</div></>);
};

export default OverviewICU;
