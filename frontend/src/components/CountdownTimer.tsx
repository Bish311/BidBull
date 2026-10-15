"use client";

import { useEffect, useState } from "react";

interface CountdownTimerProps {
  expiresAtUtc: string;
  onExpire?: () => void;
  className?: string;
}

export default function CountdownTimer({
  expiresAtUtc,
  onExpire,
  className = "",
}: CountdownTimerProps) {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  useEffect(() => {
    const updateCountdown = () => {
      const expirationMs = new Date(expiresAtUtc).getTime();
      const currentMs = Date.now();
      const diffSeconds = Math.max(0, Math.floor((expirationMs - currentMs) / 1000));
      setSecondsRemaining(diffSeconds);
      if (diffSeconds === 0 && onExpire) {
        onExpire();
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [expiresAtUtc, onExpire]);

  const hours = Math.floor(secondsRemaining / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);
  const seconds = secondsRemaining % 60;

  const paddedHours = hours < 10 ? `0${hours}` : `${hours}`;
  const paddedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
  const paddedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;

  const isUrgent = secondsRemaining > 0 && secondsRemaining <= 120;
  const isClosed = secondsRemaining === 0;

  return (
    <div
      className={`font-mono text-sm tracking-wider ${
        isClosed
          ? "text-gray-500"
          : isUrgent
          ? "text-rose-500 animate-pulse font-bold"
          : "text-gray-200"
      } ${className}`}
    >
      {isClosed
        ? "CLOSED"
        : `${paddedHours}:${paddedMinutes}:${paddedSeconds}`}
    </div>
  );
}
