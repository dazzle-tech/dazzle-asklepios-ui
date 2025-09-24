import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShield } from "@fortawesome/free-solid-svg-icons";
import './style.less';
import { useSelector } from "react-redux";

type BundleItem = {
  key: string;
  title: string;
  data: { id: number; status: string }[];
  icon?: any;
  color: string;
};

interface SafetyBundleOverviewProps {
  bundles: BundleItem[];
}

const calcCompletion = (data: { status: string }[]) => {
  const total = data.length;
  const completed = data.filter((i) => i.status === "Complete").length;
  return total === 0 ? 0 : Math.round((completed / total) * 100);
};

const SafetyBundleOverview: React.FC<SafetyBundleOverviewProps> = ({ bundles }) => {
  const mode = useSelector((state: any) => state.ui.mode); // light or dark

  return (
    <div className={`safety-overview-wrapper ${mode}`}>
      {bundles.map((item) => {
        const percent = calcCompletion(item.data);
        return (
          <div className="bundle-item" key={item.key}>
            <div className="bundle-title">
              <FontAwesomeIcon icon={item.icon || faShield} className="bundle-icon" />
              {item.title}
            </div>
            <div
              className="bundle-percent"
              style={{ color: item.color }}
            >
              {percent}%
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${percent}%`, backgroundColor: item.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SafetyBundleOverview;
