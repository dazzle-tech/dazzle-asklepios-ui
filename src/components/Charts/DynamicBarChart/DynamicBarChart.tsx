import React, { useState, useRef, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import type { ChartOptions, ChartData } from "chart.js";
import "chart.js/auto";
import { Button } from "rsuite";

type BarChartDataPoint = {
  label: string;
  value: number;
};

interface DynamicBarChartProps {
  title?: string;
  chartData: BarChartDataPoint[];
  color?: string;
  selectable?: boolean;
  refreshButton?: boolean;
  horizontal?: boolean;
}

const DynamicBarChart: React.FC<DynamicBarChartProps> = ({
  title,
  chartData,
  color = "#3498db",
  selectable,
  refreshButton,
  horizontal = false,
}) => {
  const chartRef = useRef<any>(null);
  const [selectedBar, setSelectedBar] = useState<{
    label: string;
    value: number;
  } | null>(null);

  const [data, setData] = useState<ChartData<"bar">>({
    labels: [],
    datasets: [],
  });

  const updateData = () => {
    const labels = chartData.map((d) => d.label);
    const values = chartData.map((d) => d.value);

    setData({
      labels,
      datasets: [
        {
          label: title || "Values",
          data: values,
          backgroundColor: color,
          borderColor: "#fff",
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
        },
      ],
    });
  };

  useEffect(() => {
    updateData();
  }, [chartData, color]);

  const chartOptions: ChartOptions<"bar"> = {
    indexAxis: horizontal ? 'y' : 'x',
    responsive: true,
    plugins: {
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
        },
      },
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return `${context.dataset.label}: ${context.raw}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#666",
        },
      },
      y: {
        grid: {
          color: "#eee",
        },
        ticks: {
          color: "#666",
        },
        beginAtZero: true,
      },
    },
    onClick: (_event, elements) => {
      if (elements.length > 0 && selectable) {
        const index = elements[0].index;
        const label = data.labels?.[index] as string;
        const value = data.datasets[0].data[index] as number;
        setSelectedBar({ label, value });
      }
    },
  };

  return (
    <div style={{ position: 'relative' }}>
      {selectable && (
        <div style={{ marginBottom: 10 }}>
          {selectedBar ? (
            <span style={{ fontSize: "large" }}>
              {selectedBar.label}:{" "}
              <b style={{ color: "rebeccapurple" }}>{selectedBar.value}</b>
            </span>
          ) : (
            <span>Click on a bar to select</span>
          )}
        </div>
      )}

      <Bar 
        data={data} 
        options={chartOptions} 
        ref={chartRef} 
        style={{ maxHeight: '400px' }}
      />

      {refreshButton && (
        <Button 
          appearance="primary" 
          style={{ marginTop: 10 }} 
          onClick={updateData}
        >
          Refresh Data
        </Button>
      )}
    </div>
  );
};

export default DynamicBarChart;