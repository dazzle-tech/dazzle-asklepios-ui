import React, { useState } from "react";
import SectionContainer from "@/components/SectionsoContainer";
import MyInput from "@/components/MyInput";
import { useGetLovValuesByCodeQuery } from "@/services/setupService";
import { Form } from 'rsuite';
import MyBadgeStatus from "@/components/MyBadgeStatus/MyBadgeStatus";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faCircleInfo, faHeart} from '@fortawesome/free-solid-svg-icons';
import DynamicCard from "@/components/DynamicCard";
import MyButton from "@/components/MyButton/MyButton";
import MyModal from "@/components/MyModal/MyModal";
import PlusIcon from '@rsuite/icons/Plus';
import { Tabs } from 'rsuite';
import OverviewICU from "./i.c.u-tabs/overviewtab/OverviewICU";
import FlowSheetICU from "./i.c.u-tabs/FlowSheetTab/FlowSheetICU";
import Neurological from './i.c.u-tabs/NeurologicalTab/NeurologicalICU'
import InvasiveDeviceICU from "./i.c.u-tabs/invasivedevice/InvasiveDeviceICU";
import SafetyBundleICU from "./i.c.u-tabs/safetybundletab/SafetyBundleICU";
const ICUTabs: React.FC = () => {
  const [activeKey, setActiveKey] = useState<string | number>('1');


  return (<>
 <Tabs activeKey={activeKey} onSelect={setActiveKey} appearance="subtle">

                <Tabs.Tab eventKey="1" title="Overview">
<><OverviewICU></OverviewICU></>
                </Tabs.Tab>

                <Tabs.Tab eventKey="2" title="Flow Sheet">
<><FlowSheetICU></FlowSheetICU></>

                </Tabs.Tab>

                <Tabs.Tab eventKey="3" title="Neurological">
<><Neurological></Neurological></>
</Tabs.Tab>
                <Tabs.Tab eventKey="4" title="Invasive Devices">
<><InvasiveDeviceICU></InvasiveDeviceICU></>
</Tabs.Tab>
                <Tabs.Tab eventKey="5" title="Safety Bundle">
<><SafetyBundleICU></SafetyBundleICU></>
</Tabs.Tab>
              </Tabs>

  </>);
};

export default ICUTabs;
