import React, { useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHeart,
  faTemperatureHalf,
  faHeartPulse,
  faGaugeSimpleHigh,
  faTint,
  faBolt
} from '@fortawesome/free-solid-svg-icons';
import DynamicCard from "@/components/DynamicCard";
import MyModal from "@/components/MyModal/MyModal";
import VitalsignGraphs from "./VitalsignGraphs";
import './style.less';

const VitalSignICU: React.FC = () => {
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [openGraphModal, setOpenGraphModal] = useState(false);

  const vitals = [
    {
      id: 1,
      label: "Heart Rate",
      key: "heartRate",
      value: "92",
      unit: "bpm",
      icon: faHeart,
    },
    {
      id: 2,
      label: "Blood Pressure",
      key: "bloodPressure",
      value: "118/65",
      unit: "MAP: 83",
      icon: faGaugeSimpleHigh,
    },
    {
      id: 3,
      label: "Resp Rate",
      key: "respRate",
      value: "18",
      unit: "breaths/min",
      icon: faHeartPulse,
    },
    {
      id: 4,
      label: "Temperature",
      key: "temperature",
      value: "37.2°C",
      unit: null,
      icon: faTemperatureHalf,
    },
    {
      id: 5,
      label: "SpO₂",
      key: "spO2",
      value: "96%",
      unit: null,
      icon: faTint,
    },
    {
      id: 6,
      label: "Pain",
      key: "pain",
      value: "3/10",
      unit: null,
      icon: faBolt,
    },
  ];

  const handleShowGraph = (metricKey: string) => {
    setSelectedMetric(metricKey);
    setOpenGraphModal(true);
  };

  return (
    <div className="vital-container">
      {vitals.map((item) => (
        <DynamicCard
          key={item.id}
          width="300px"
          height="100px"
          avatar={null}
          backgroundColor="#3bb13f15"
          showMore
          moreClick={() => handleShowGraph(item.key)}
          data={[
            {
              label: item.label,
              type: "text",
              section: "left",
              value: (
                <>
                  <FontAwesomeIcon icon={item.icon} className="vital-icon" />
                  <h5 className="vital-label">{item.label}</h5>
                </>
              ),
              showLabel: false,
            },
            {
              label: `${item.label} value`,
              type: "text",
              section: "left",
              value: <span className="vital-value">{item.value}</span>,
              showLabel: false,
            },
            item.unit
              ? {
                label: `${item.label} unit`,
                type: "strong",
                section: "left",
                value: <span className="vital-unit">{item.unit}</span>,
                showLabel: false,
              }
              : null,
          ].filter(Boolean)}
        />
      ))}

      <MyModal
        open={openGraphModal}
        setOpen={setOpenGraphModal}
        title={selectedMetric ? `Graph for ${selectedMetric}` : "Graph"}
        position="right"
        size="50vw"
        actionButtonLabel="Close"
        actionButtonFunction={() => setOpenGraphModal(false)}
        content={<VitalsignGraphs selectedMetric={selectedMetric} tableView={false} filterView={true} />}
      />
    </div>
  );
};

export default VitalSignICU;
