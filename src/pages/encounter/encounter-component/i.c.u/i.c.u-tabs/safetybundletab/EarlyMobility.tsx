import React from "react";
import SectionContainer from '@/components/SectionsoContainer';
import MyButton from '@/components/MyButton/MyButton';
import DynamicCard from '@/components/DynamicCard';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import PlusIcon from '@rsuite/icons/Plus';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faCircleCheck, faClock } from '@fortawesome/free-solid-svg-icons';
import { useSelector } from "react-redux";
import "./style.less";

const earlyMobilityData = [
  {
    id: 1,
    title: "Mobilization assessment",
    subText: "14:00 PT/OT",
    status: "Complete",
    color: "#28a745",
  },
  {
    id: 2,
    title: "Activity tolerance",
    subText: "PT/OT",
    status: "Complete",
    color: "#28a745",
  },
  {
    id: 3,
    title: "Range of motion",
    subText: "RN",
    status: "Complete",
    color: "#28a745",
  },
];

const EarlyMobility = () => {
  const mode = useSelector((state: any) => state.ui.mode);

  const totalItems = earlyMobilityData.length;
  const completedItems = earlyMobilityData.filter(item => item.status === "Complete").length;
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
                color="#32c5ffff"
                icon={faUser}
                className="safety-bundle-icu-title-icon"
              />
              Early Mobility
            </span>
            <div className="safety-bundle-icu-add-btn-wrapper">
              <MyButton
                prefixIcon={() => <PlusIcon />}
                onClick={() => console.log("Add Early Mobility clicked")}
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

            {earlyMobilityData.map((item) => (
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

export default EarlyMobility;
