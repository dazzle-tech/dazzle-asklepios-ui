import React, { useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFlask } from '@fortawesome/free-solid-svg-icons';
import DynamicCard from "@/components/DynamicCard";
import MyModal from "@/components/MyModal/MyModal";
import ABGGraphs from "./ABGGraphs";
import './style.less';

interface AbgICUProps {
}

const sampleData = [
  { date: '2025-09-01', pH: 7.38, PaCO2: 42, PaO2: 88, PFRatio: 196 },
  { date: '2025-09-02', pH: 7.39, PaCO2: 43, PaO2: 90, PFRatio: 198 },
  { date: '2025-09-03', pH: 7.40, PaCO2: 41, PaO2: 87, PFRatio: 195 },
  { date: '2025-09-04', pH: 7.37, PaCO2: 44, PaO2: 89, PFRatio: 197 },
  { date: '2025-09-05', pH: 7.36, PaCO2: 45, PaO2: 86, PFRatio: 192 },
];

const AbgICU: React.FC<AbgICUProps> = () => {
  const [openGraphModal, setOpenGraphModal] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  const abgValues = [
    { label: "pH", key: "pH", unit: null },
    { label: "PaCO₂", key: "PaCO2", unit: "mmHg" },
    { label: "PaO₂", key: "PaO2", unit: "mmHg" },
    { label: "P/F Ratio", key: "PFRatio", unit: null },
  ];

  const handleShowGraph = (metricKey: string) => {
    setSelectedMetric(metricKey);
    setOpenGraphModal(true);
  };

  return (
    <div className="vital-container">
      {abgValues.map((item, index) => (
        <div key={index}>
          <DynamicCard
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
                    <FontAwesomeIcon icon={faFlask} className="vital-icon" />
                    <h5 className="vital-label">{item.label}</h5>
                  </>
                ),
                showLabel: false,
              },
              {
                label: `${item.label} value`,
                type: "text",
                section: "left",
                value: (
                  <span className="vital-value">
                    {sampleData[sampleData.length - 1][item.key as keyof typeof sampleData[0]]}
                  </span>
                ),
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
        </div>
      ))}

      <MyModal
        open={openGraphModal}
        setOpen={setOpenGraphModal}
        title={selectedMetric ? `${selectedMetric} Graph` : "Graph"}
        position="right"
        size="50vw"
        actionButtonLabel="Close"
        actionButtonFunction={() => setOpenGraphModal(false)}
        content={<ABGGraphs selectedMetric={selectedMetric} tableView={false} filterView={true} />}
      />
    </div>
  );
};

export default AbgICU;
