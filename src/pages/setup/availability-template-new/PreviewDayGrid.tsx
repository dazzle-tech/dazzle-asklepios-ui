type Props = {
  step: number;
  activeDay: number;
  channels: Channel[];
  availability: AvailabilityByDay;
};

const PreviewDayGrid: React.FC<Props> = ({
  step,
  activeDay,
  channels,
  availability
}) => {
  const dayData = availability[activeDay] ?? [];

  return (
    <div className="calendar-wrapper preview">
      {/* Time column */}
      <TimeColumn step={step} />

      {/* Channels */}
      {channels.map(channel => {
        const channelData =
          dayData.find(c => c.channelId === channel.id);

        return (
          <PreviewChannelColumn
            key={channel.id}
            channel={channel}
            intervals={channelData?.intervals ?? []}
            step={step}
          />
        );
      })}
    </div>
  );
};
