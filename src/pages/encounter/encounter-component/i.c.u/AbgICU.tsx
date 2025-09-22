import React, { useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFlask } from '@fortawesome/free-solid-svg-icons';
import DynamicCard from "@/components/DynamicCard";
import './style.less';

const AbgICU: React.FC = () => {
  const [record, setRecord] = useState<any>({});

  const abgValues = [
    { label: "pH", value: "7.38", unit: null },
    { label: "PaCO₂", value: "42", unit: "mmHg" },
    { label: "PaO₂", value: "88", unit: "mmHg" },
    { label: "P/F Ratio", value: "196", unit: null },
  ];

  return (
    <div className="vital-container">
      {abgValues.map((item, index) => (
        <DynamicCard
          key={index}
          width="400px"
          height="120px"
          avatar={null}
          backgroundColor="#3bb13f15"
          showMore
          moreClick={() => alert(`Details for ${item.label}`)}
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
    </div>
  );
};

export default AbgICU;
