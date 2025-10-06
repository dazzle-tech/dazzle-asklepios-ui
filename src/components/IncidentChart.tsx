import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import React from "react";
const monthlyData = [
  { month: "Jan", incidents: 12, resolved: 10 },
  { month: "Feb", incidents: 19, resolved: 16 },
  { month: "Mar", incidents: 15, resolved: 14 },
  { month: "Apr", incidents: 22, resolved: 18 },
  { month: "May", incidents: 18, resolved: 17 },
  { month: "Jun", incidents: 25, resolved: 20 },
];

const severityData = [
  { name: "Low", value: 45, color: "hsl(151, 61%, 23%)" },
  { name: "Medium", value: 35, color: "hsl(38, 92%, 50%)" },
  { name: "High", value: 15, color: "hsl(0, 72%, 51%)" },
  { name: "Critical", value: 5, color: "hsl(0, 62%, 30%)" },
];

const IncidentChart = () => {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="!text-lg font-medium text-foreground">
            Monthly Incident Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12, fill: "hsl(213, 16%, 55%)" }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: "hsl(213, 16%, 55%)" }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(213, 27%, 89%)",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="incidents" fill="hsl(211, 100%, 40%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="resolved" fill="hsl(151, 61%, 23%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="!text-lg font-medium text-foreground">
            Incidents by Severity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={severityData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {severityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(213, 27%, 89%)",
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {severityData.map((item) => (
              <div key={item.name} className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-muted-foreground">
                  {item.name}: {item.value}%
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IncidentChart;