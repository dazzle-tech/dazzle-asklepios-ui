import React, { useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHeart, 
  faTemperatureHalf, 
  faHeartPulse , 
  faGaugeSimpleHigh , 
  faTint, 
  faBolt  
} from '@fortawesome/free-solid-svg-icons';
import DynamicCard from "@/components/DynamicCard";
import './styles.less';

const VitalSignsTeleConsultion: React.FC = () => {
  const [record, setRecord] = useState<any>({});



  const vitals = [
    {
      id: 1,
      label: "Heart Rate",
      value: "92",
      unit: "bpm",
      icon: faHeart,
    },
    {
      id: 2,
      label: "Blood Pressure",
      value: "118/65",
      unit: "MAP: 83",
      icon: faGaugeSimpleHigh ,
    },
    {
      id: 3,
      label: "Resp Rate",
      value: "18",
      unit: "breaths/min",
      icon: faHeartPulse ,
    },
    {
      id: 4,
      label: "Temperature",
      value: "37.2°C",
      unit: null,
      icon: faTemperatureHalf,
    },
    {
      id: 5,
      label: "SpO₂",
      value: "96%",
      unit: null,
      icon: faTint,
    },
    {
      id: 6,
      label: "Pain",
      value: "3/10",
      unit: null,
      icon: faBolt ,
    },
  ];

  return (
    <div className="vital-container">
      {vitals.map((item) => (
        <DynamicCard
          key={item.id}
          width="270px"
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
    </div>
  );
};

export default VitalSignsTeleConsultion;
