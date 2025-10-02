import { Rnd } from 'react-rnd';
import { JitsiMeeting } from '@jitsi/react-sdk';
import React, { useRef } from 'react';

export default function FloatingPiPJitsi({
  roomName,
  displayName,
  email,
  onClose
}: {
  roomName: string;
  displayName: string;
  email: string;
  onClose: () => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  return (
    <Rnd
      default={{ x: window.innerWidth - 420, y: 100, width: 600, height: 400 }}
      bounds="window"
      minWidth={320}
      minHeight={200}
      dragHandleClassName="jitsi-float-header"
      style={{
        zIndex: 1000,
        background: '#111',
        borderRadius: 8,
        boxShadow: '0 8px 24px rgba(0,0,0,.25)'
      }}
    >
      <div ref={containerRef} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div
          className="jitsi-float-header"
          style={{ display: 'flex', justifyContent: 'space-between', padding: 6 }}
        >
          <strong>Call</strong>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose}>Close</button>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <JitsiMeeting
            domain="meet.jit.si"
            roomName={roomName}
            userInfo={{ displayName, email }}
            configOverwrite={{ prejoinPageEnabled: false }}
            getIFrameRef={n => {
              if (n) n.style.height = '100%';
            }}
          />
        </div>
      </div>
    </Rnd>
  );
}
