import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import FloatingPiPJitsi from '@/pages/encounter/tele-consultation-screen/start-tele-consultation/JitsiPip';
import { endCall } from '@/store/callSlice';
import React from 'react';

export default function CallOverlay() {
  const dispatch = useDispatch();
  const call = useSelector((s: any) => s?.call ?? {});
  const { inCall, roomName, displayName, email } = call;

  if (!inCall || !roomName) return null;

  return createPortal(
    <FloatingPiPJitsi
      roomName={roomName}
      displayName={displayName}
      email={email ?? ''}
      onClose={() => dispatch(endCall())}
    />,
    document.body
  );
}
