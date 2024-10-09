import React, { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import { Button } from 'rsuite';

const DynamicLineChart = props => {
  const initialzed = useRef(false);
  const chartRef = useRef(null);
  const [data, setData] = useState({
    labels: [],
    datasets: []
  });

  const [verticalLineX, setVerticalLineX] = useState(null);
  const [verticalLineY, setVerticalLineY] = useState(null);
  const [chartHeight, setChartHeight] = useState(0);

  const [selectedPoint, setSelectedPoint] = useState(null);
  const [labelItemsX, setLabelItemsX] = useState([]);

  const updateData = () => {
    if (props.chartData) {
      const labels = props.chartData.map(dataPoint => dataPoint.x);
      const values = props.chartData.map(dataPoint => dataPoint.y);

      const datasets = [
        {
          data: values,
          label: props.title ? props.title : 'Untitled',
          borderColor: 'rgba(75,192,192,1)',
          backgroundColor: 'rgba(75,192,192,0.2)',
          fill: true,
          pointStyle: 'circle',
          pointRadius: 4,
          pointBorderWidth: 2,
          pointBorderColor: 'rgba(75,192,192,1)'
        }
      ];

      setData({
        labels,
        datasets
      });

      chartRef.current.render();
    }
  };

  useEffect(() => {
    if (!initialzed.current) {
      updateData();
      initialzed.current = true;
    }
  }, []);

  const startMoving = () => {
    try {
      const xScale = chartRef.current.scales.x;
      const yScale = chartRef.current.scales.y;

      setVerticalLineY(yScale._startPixel);
      setChartHeight(chartRef.current.chartArea.height);

      const animationDuration = props.indicatorLifetime ? props.indicatorLifetime : 2000;
      const startTime = performance.now();
      let currentIndex = 0;

      const labelItems = xScale._labelItems;

      const animate = timestamp => {
        const currentTime = timestamp - startTime;
        let progress = currentTime / animationDuration;

        if (!labelItems[currentIndex]) {
          return;
        }

        if (progress >= 1) {
          progress = 1; // Ensure animation completes smoothly
        }

        const frameIndex = Math.floor(progress * labelItems.length);

        if (frameIndex >= currentIndex) {
          const selectedLabel = data.labels[currentIndex];
          const selectedValue = data.datasets[0].data[currentIndex];

          setSelectedPoint({
            index: currentIndex,
            label: selectedLabel,
            value: selectedValue
          });

          const xPosition = labelItems[currentIndex].options.translation[0];
          setVerticalLineX(xPosition);

          currentIndex++;
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      // Start the animation
      requestAnimationFrame(animate);
    } catch (e) {
      alert('Error starting motion');
      console.log(e);
    }
  };

  const chartOptions: any = {
    plugins: {
      title: {
        display: true,
        text: props.title ? props.title : 'Untitled'
      },
      legend: {
        display: true,
        position: 'top'
      }
    },
    scales: {
      y: {
        suggestedMin: props.minValue ? props.minValue : 0, //
        suggestedMax: props.maxValue ? props.maxValue : undefined
      }
    },
    animation: {
      duration: props.animationDuration ? props.animationDuration : 1000 // Set the animation duration (in milliseconds)
    },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        // Get the selected value from the chart data
        try {
          const selectedIndex = elements[0].index;
          const selectedLabel = data.labels[selectedIndex];
          const selectedValue = data.datasets[0].data[selectedIndex];

          setSelectedPoint({
            index: selectedIndex,
            label: selectedLabel,
            value: selectedValue
          });

          const labelItems = chartRef.current.scales.x._labelItems;

          labelItems.map(item => {
            if (item.label === selectedLabel) {
              const xPosition = item.options.translation[0];
              const yPosition = item.options.translation[1];
              setVerticalLineX(xPosition);
            }
          });
        } catch (e) {
          alert('error selecting point');
          console.log(e);
        }
      }
    }
  };

  return (
    <div>
      <div style={{ margin: '10px' }}>
        {props.indicator && (
          <Button
            style={{ visibility: 'hidden', position: 'fixed', zIndex: '-1000' }}
            appearance="primary"
            id={props.code + '_start'}
            onClick={startMoving}
          />
        )}

        {props.selectable && (
          <span style={{ fontSize: 'large' }}>
            {selectedPoint && (
              <span>
                {props.title + ' @ ' + selectedPoint.label + ' = '}
                <b style={{ fontSize: 'large', color: 'rebeccapurple' }}>{selectedPoint.value}</b>
              </span>
            )}
            {!selectedPoint && <span>No Selected Value</span>}
          </span>
        )}
      </div>

      <hr />

      <div style={{ position: 'relative' }}>
        <Line data={data} options={chartOptions} ref={chartRef} />
        {props.indicator && verticalLineX !== null && (
          <div
            style={{
              transition: 'left 0.25s ease-in-out',
              position: 'absolute',
              height: `${chartHeight}px`, // Set the position based on X-axis value
              borderRadius: '50px',
              border: '2.5px solid rgb(214, 0, 47,0.75)',
              left: `${verticalLineX}px`, // Set the position based on X-axis value
              top: `${verticalLineY}px` // Set the position based on X-axis value
            }}
          />
        )}
      </div>
    </div>
  );
};

export default DynamicLineChart;
