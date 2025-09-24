import React from "react";
import SectionContainer from '@/components/SectionsoContainer';
import MyButton from '@/components/MyButton/MyButton';
import DynamicCard from '@/components/DynamicCard';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import PlusIcon from '@rsuite/icons/Plus';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShield, faCircleCheck, faClock } from '@fortawesome/free-solid-svg-icons';
import { useSelector } from "react-redux";
import "./style.less";

const dvtPreventionData = [
  {
    id: 1,
    title: "Sequential compression devices",
    subText: "RN",
    status: "Complete",
    color: "#28a745",
  },
  {
    id: 2,
    title: "Enoxaparin 40mg SQ",
    subText: "RN",
    status: "Complete",
    color: "#28a745",
  },
  {
    id: 3,
    title: "Risk assessment",
    subText: "MD",
    status: "Complete",
    color: "#28a745",
  },
];

const DVT = () => {
  const mode = useSelector((state: any) => state.ui.mode);

  const totalItems = dvtPreventionData.length;
  const completedItems = dvtPreventionData.filter(item => item.status === "Complete").length;
  const completionPercentage = Math.round((completedItems / totalItems) * 100);


  const getStatusIcon = (status: string) => {
    if (status === "Complete") {
      return <FontAwesomeIcon icon={faCircleCheck} color="#28a745" className="safety-bundle-icu-status-icon" />;
    }
    if (status === "Due") {
      return <FontAwesomeIcon icon={faClock} color="#e67e22" className="safety-bundle-icu-status-icon" />;
    }
    return null;
  };

  return (
    <div className={`safety-bundle-icu-section ${mode}`}>
      <SectionContainer
        title={
          <>
            <span className="safety-bundle-icu-title">
              <FontAwesomeIcon
                color="#159a00ff"
                icon={faShield}
                className="safety-bundle-icu-title-icon"
              />
              DVT Prophylaxis
            </span>
            <div className="safety-bundle-icu-add-btn-wrapper">
              <MyButton
                prefixIcon={() => <PlusIcon />}
                onClick={() => console.log("Add DVT clicked")}
              >
                Add
              </MyButton>
            </div>
          </>
        }
        content={
          <div className="safety-bundle-icu-card-list">

                          <span style={{ marginLeft: 10, fontWeight: 500, color: "#fde90f",display:'flex',flexDirection:'row',justifyContent:'center' }}>
  <MyBadgeStatus
    contant={`${completionPercentage}% Complete`}
    color="#d4b800ff"
  />
                </span>

            {dvtPreventionData.map((item) => (
              <DynamicCard
                key={item.id}
                width="100%"
                margin="0 0 15px 0"
                data={[
                  {
                    value: (
                      <div className="safety-bundle-icu-card-info">
                        <div className="safety-bundle-icu-card-title">
                          {getStatusIcon(item.status)} {item.title}
                        </div>
                        {item.subText && (
                          <div className="safety-bundle-icu-card-subtext">{item.subText}</div>
                        )}
                      </div>
                    ),
                    section: "left",
                    showLabel: false,
                    type: "text",
                  },
                  item.status && {
                    value: (
                      <MyBadgeStatus
                        contant={item.status}
                        color={item.color || "#555"}
                      />
                    ),
                    section: "right",
                    showLabel: false,
                    vertical: "bottom",
                  },
                ].filter(Boolean)}
              />
            ))}
          </div>
        }
      />
    </div>
  );
};

export default DVT;
