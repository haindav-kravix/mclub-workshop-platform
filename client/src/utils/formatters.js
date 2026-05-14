export const formatTime12Hour = (time) => {
  if (!time) return '';

  const [hourPart, minutePart = '00'] = String(time).split(':');
  const hour = Number(hourPart);
  const minute = Number(minutePart);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return time;
  }

  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, '0')} ${period}`;
};

export const formatTimeRange12Hour = (startTime, endTime) => {
  if (!startTime && !endTime) return '';
  if (!endTime) return formatTime12Hour(startTime);
  return `${formatTime12Hour(startTime)} - ${formatTime12Hour(endTime)}`;
};

export const formatWorkshopTime = (workshop) => {
  const firstTiming = workshop?.dailyTimings?.[0];
  if (firstTiming) {
    return formatTimeRange12Hour(firstTiming.startTime, firstTiming.endTime);
  }

  if (workshop?.time?.includes(':')) {
    return formatTime12Hour(workshop.time);
  }

  return workshop?.time || '';
};
