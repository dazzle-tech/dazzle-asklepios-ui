import React from 'react';
import { Panel } from 'rsuite';
import { ArrowUp, ArrowDown } from '@rsuite/icons';
import './style.less';
import { useSelector } from 'react-redux';
interface TableDataItem {
  [key: string]: string | number | React.ReactNode;
  trend?: 'up' | 'down';
}

interface DynamicTableChartProps {
  data: TableDataItem[];
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  columns?: string[];
  columnWidths?: string[];
  alignments?: ('left' | 'right' | 'center')[];
  showHeader?: boolean;
  style?: React.CSSProperties;
  headerStyle?: React.CSSProperties;
  rowStyle?: React.CSSProperties;
  cellStyle?: React.CSSProperties;
  showPercentage?: boolean;
  showTrend?: boolean;
}

const DynamicMainTableChart: React.FC<DynamicTableChartProps> = ({
  data,
  title,
  subtitle,
  columns,
  columnWidths = ['70%', '30%'],
  alignments = ['left', 'right'],
  showHeader = true,
  style,
  headerStyle,
  rowStyle,
  cellStyle,
  showPercentage = true,
  showTrend = true
}) => {
  const tableColumns = columns || (data.length > 0 ? Object.keys(data[0]) : []);
  const mode = useSelector((state: any) => state.ui.mode);

  return (
    <Panel
      header={title}
      className="main-panel"
      style={{
        ...style
      }}
    >
      <div className="padding-0">
        {subtitle && <div className="sub-title-size">{subtitle}</div>}

        <table className="table-dash">
          {showHeader && (
            <thead>
              <tr>
                {tableColumns.map((column, index) => (
                  <th
                    key={column}
                    className="th-table"
                    style={{
                      textAlign: alignments[index] || 'left',
                      width: columnWidths[index] || 'auto',
                      ...headerStyle,
                      ...(column === ''
                        ? {
                            height: '0',
                            padding: '0',
                            overflow: 'hidden',
                            lineHeight: '0'
                          }
                        : {})
                    }}
                  >
                    {column === '' ? null : column}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {data.map((item, rowIndex) => (
              <React.Fragment key={rowIndex}>
                <tr
                  style={{
                    borderBottom: mode === 'dark' ? '1px solid #343434ff' : '1px solid #f0f0f0',
                    ...rowStyle
                  }}
                >
                  {tableColumns.map((column, colIndex) => (
                    <td
                      className="td-table"
                      key={column}
                      style={{
                        textAlign: alignments[colIndex] || 'left',
                        width: columnWidths[colIndex] || 'auto',
                        ...cellStyle
                      }}
                    >
                      {column === 'name' ? (
                        <div className="flex-center">
                          <span>{item[column]}</span>
                          {showTrend && item.trend && (
                            <span className="margin-left-l">
                              {item.trend === 'up' ? (
                                <ArrowUp className="arrow-up" />
                              ) : (
                                <ArrowDown className="arrow-down" />
                              )}
                            </span>
                          )}
                        </div>
                      ) : column === 'value' && showPercentage ? (
                        <div className="align-right">
                          <div className="bold-14">{item[column]}</div>
                          {item.percentage && <div className="font-12">{item.percentage}</div>}
                        </div>
                      ) : (
                        item[column]
                      )}
                    </td>
                  ))}
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
};

export default DynamicMainTableChart;
