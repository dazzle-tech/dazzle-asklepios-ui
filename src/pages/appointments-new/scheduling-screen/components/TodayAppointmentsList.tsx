import React from 'react';
import { Panel, Text } from 'rsuite';
import ArrowRightLineIcon from '@rsuite/icons/ArrowRightLine';

type TodayAppointmentsListProps = {
  todayAppointmentsList: any[];
  isFetchingTodayAppointments: boolean;
  rightPanelAppointmentRows: any[];
  todayTimelineRows: any[];
};

const TodayAppointmentsList = ({
  todayAppointmentsList,
  isFetchingTodayAppointments,
  rightPanelAppointmentRows,
  todayTimelineRows
}: TodayAppointmentsListProps) => {
  return (
    <Panel
      bordered
      style={{
        padding: 8,
        borderRadius: 12,
        flex: 1,
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <strong>{todayAppointmentsList.length} today appointments</strong>
      </div>
      <div style={{ marginBottom: 8 }} />
      <div
        style={{
          border: '1px solid #edf1f7',
          borderRadius: 10,
          overflowY: 'auto',
          overflowX: 'hidden',
          flex: 1,
          minHeight: 0
        }}
      >
        {isFetchingTodayAppointments ? (
          <div style={{ padding: 10 }}>
            <Text muted>Loading...</Text>
          </div>
        ) : rightPanelAppointmentRows.length > 0 ? (
          rightPanelAppointmentRows.map((row: any, idx: number) => (
            <div
              key={row.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '42px 1fr 12px',
                alignItems: 'center',
                gap: 6,
                padding: '8px 6px',
                borderBottom: idx === rightPanelAppointmentRows.length - 1 ? 'none' : '1px solid #f0f3f8'
              }}
            >
              <span style={{ fontSize: 11, color: '#7b8794' }}>{row.hourLabel}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#263238' }}>{row.patientName}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: '#8a94a6' }}>{row.timeLabel}</span>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {row.dots.map((color: string, dotIdx: number) => (
                      <span
                        key={`${row.id}-dot-${dotIdx}`}
                        style={{ width: 6, height: 6, borderRadius: 6, display: 'inline-block', backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <ArrowRightLineIcon style={{ fontSize: 12, opacity: 0.45 }} />
            </div>
          ))
        ) : (
          todayTimelineRows.map((row: any) => (
            <div
              key={row.hour}
              style={{
                display: 'grid',
                gridTemplateColumns: '48px 1fr 12px',
                alignItems: 'center',
                gap: 6,
                padding: '8px 6px',
                borderBottom: '1px solid #f0f3f8'
              }}
            >
              <span style={{ fontSize: 11, color: '#7b8794' }}>{row.hour} AM</span>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                {row.dots.map((color: string, idx: number) => (
                  <span
                    key={`${row.hour}-${idx}`}
                    style={{ width: 8, height: 8, borderRadius: 8, display: 'inline-block', backgroundColor: color }}
                  />
                ))}
              </div>
              <ArrowRightLineIcon style={{ fontSize: 12, opacity: 0.45 }} />
            </div>
          ))
        )}
      </div>
    </Panel>
  );
};

export default TodayAppointmentsList;
