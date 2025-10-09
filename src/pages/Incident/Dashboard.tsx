import React from "react";
import StatCard from "@/components/StatCard";
import IncidentChart from "@/components/IncidentChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  AlertCircle,
} from "lucide-react";
import "./style.css";
import MyBadgeStatus from "@/components/MyBadgeStatus/MyBadgeStatus";

const recentIncidents = [
  {
    id: "INC-2024-001",
    title: "Medication Administration Error",
    department: "ICU",
    severity: "High",
    status: "Under Review",
    date: "2024-01-15",
  },
  {
    id: "INC-2024-002",
    title: "Patient Fall",
    department: "Emergency",
    severity: "Medium",
    status: "Resolved",
    date: "2024-01-14",
  },
  {
    id: "INC-2024-003",
    title: "Equipment Malfunction",
    department: "Surgery",
    severity: "Critical",
    status: "Investigation",
    date: "2024-01-14",
  },
];

// function SeverityBadge({ value }: { value: string }) {
//   const base =
//     "inline-flex items-center rounded-full px-2.5 py-1 !text-[12px] font-semibold";
//   if (value === "Critical" || value === "High") {
//     return <span className={`${base} bg-[#E11D48] text-white`}>{value}</span>;
//   }
//   if (value === "Medium") {
//     return <span className={`${base} bg-[#1E60D6] text-white`}>{value}</span>;
//   }
//   return <span className={`${base} bg-[#CBD5E1] text-[#111827]`}>{value}</span>;
// }

// function StatusBadge({ value }: { value: string }) {
//   const base =
//     "inline-flex items-center rounded-full px-2.5 py-1 !text-[12px] font-semibold";
//   if (value === "Resolved") {
//     return <span className={`${base} bg-[#1E60D6] text-white`}>{value}</span>;
//   }
//   return <span className={`${base} bg-[#EEF2F7] text-[#111827]`}>{value}</span>;
// }


function SeverityBadge({ value }: { value: string }) {
  let color = "";

  if (value === "Critical") {
    color = "#e42a52ff";
  }
   else if (value === "High") {
    color = "#f5c21aff";
  }
   else if (value === "Medium") {
    color = "#2e6edeff";
  } 
   else if (value === "Low") {
    color = "#25f325ff";
  } 
   else {
    color = "#b3b3b3ff";
  }

  return (
    <MyBadgeStatus
      contant={value}
      color={color}
    />
  );
}

function StatusBadge({ value }: { value: string }) {
  let color = "";

  if (value === "Resolved") {
    color = "#4fdc37ff";
  }
  else if (value === "Action Required") {
    color = "#e42a52ff";
  }
  else if (value === "Investigation") {
    color = "#2e6edeff";
  }
  else if (value === "Under Review") {
    color = "#b3b3b3ff";
  }
  else {
    color = "#217cecff";
  }

  return (
    <MyBadgeStatus
      contant={value}
      color={color}
    />
  );
}





const Dashboard = () => {
  const lastUpdated = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date()); // 10/05/2025

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <div className="max-w-[1200px] mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="!text-[24px] leading-8 font-semibold text-[hsl(var(--foreground))]">
              Dashboard
            </h1>
            <p className="!text-[13px] mt-1 text-[hsl(var(--muted-foreground))]">
              Hospital incident reporting overview
            </p>
          </div>
          <div className="text-right">
            <p className="!text-[12px] text-[hsl(var(--muted-foreground))]">
              Last updated
            </p>
            <p className="!text-[13px] font-medium">{lastUpdated}</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-6">
          <StatCard
            title="Total Incidents"
            value="147"
            description="+12% from last month"
            icon={FileText}
            rightBubble="bg-[#e8f1ff] text-[#1E60D6] border-[#d6e5ff]"
          />
          <StatCard
            title="Open Cases"
            value="23"
            description="Require attention"
            icon={AlertCircle}
            rightBubble="bg-[#FFF4DC] text-[#FFB100] border-[#FFE7B0]"
          />
          <StatCard
            title="Resolved"
            value="124"
            description="84% resolution rate"
            icon={CheckCircle}
            rightBubble="bg-[#EAF8F1] text-[#2DBB84] border-[#C9EFD8]"
          />
          <StatCard
            title="Critical"
            value="3"
            description="High priority cases"
            icon={AlertTriangle}
            rightBubble="bg-[#FFECEF] text-[#F05B6A] border-[#FFD1D8]"
          />
        </div>

        {/* Charts */}
        <IncidentChart />

        {/* Recent Incidents */}
      <Card className="bg-[var(--card-bg)] rounded-[12px] shadow-sm">
        <CardHeader className="px-5 py-3">
          <CardTitle className="!text-[17px] font-semibold text-[var(--text-primary)] flex items-center">
            <Clock className="!h-[18px] !w-[18px] mr-2 text-[var(--text-muted)]" />
            Recent Incidents
          </CardTitle>
        </CardHeader>

        <CardContent className="px-5 pb-5">
          <div className="space-y-4">
            {recentIncidents.map((incident) => (
              <div
                key={incident.id}
                className="flex items-center justify-between p-4 bg-[var(--item-bg)] rounded-[12px] border "
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="!text-[16px] font-semibold text-[var(--text-primary)]">
                      {incident.id}
                    </span>
                    <SeverityBadge value={incident.severity} />
                  </div>

                  <h3 className="!text-[16px] font-semibold text-[var(--text-primary)] mt-1">
                    {incident.title}
                  </h3>

                  <p className="!text-[12px] text-[var(--text-muted)]">
                    {incident.department} • {incident.date}
                  </p>
                </div>

                <div className="text-right">
                  <StatusBadge value={incident.status} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default Dashboard;
