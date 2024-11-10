"use client";

import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const diceFaces = [
  // 1면
  <svg
    key="1"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full h-full"
  >
    <rect
      x="2"
      y="2"
      width="20"
      height="20"
      rx="3"
      className="stroke-foreground"
      strokeWidth="1.5"
      fill="none"
    />
    <circle cx="12" cy="12" r="2.5" className="fill-foreground" />
  </svg>,

  // 2면
  <svg
    key="2"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full h-full"
  >
    <rect
      x="2"
      y="2"
      width="20"
      height="20"
      rx="3"
      className="stroke-foreground"
      strokeWidth="1.5"
      fill="none"
    />
    <circle cx="7" cy="7" r="2.5" className="fill-foreground" />
    <circle cx="17" cy="17" r="2.5" className="fill-foreground" />
  </svg>,

  // 3면
  <svg
    key="3"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full h-full"
  >
    <rect
      x="2"
      y="2"
      width="20"
      height="20"
      rx="3"
      className="stroke-foreground"
      strokeWidth="1.5"
      fill="none"
    />
    <circle cx="7" cy="7" r="2.5" className="fill-foreground" />
    <circle cx="12" cy="12" r="2.5" className="fill-foreground" />
    <circle cx="17" cy="17" r="2.5" className="fill-foreground" />
  </svg>,

  // 4면
  <svg
    key="4"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full h-full"
  >
    <rect
      x="2"
      y="2"
      width="20"
      height="20"
      rx="3"
      className="stroke-foreground"
      strokeWidth="1.5"
      fill="none"
    />
    <circle cx="7" cy="7" r="2.5" className="fill-foreground" />
    <circle cx="17" cy="7" r="2.5" className="fill-foreground" />
    <circle cx="7" cy="17" r="2.5" className="fill-foreground" />
    <circle cx="17" cy="17" r="2.5" className="fill-foreground" />
  </svg>,

  // 5면
  <svg
    key="5"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full h-full"
  >
    <rect
      x="2"
      y="2"
      width="20"
      height="20"
      rx="3"
      className="stroke-foreground"
      strokeWidth="1.5"
      fill="none"
    />
    <circle cx="7" cy="7" r="2.5" className="fill-foreground" />
    <circle cx="17" cy="7" r="2.5" className="fill-foreground" />
    <circle cx="12" cy="12" r="2.5" className="fill-foreground" />
    <circle cx="7" cy="17" r="2.5" className="fill-foreground" />
    <circle cx="17" cy="17" r="2.5" className="fill-foreground" />
  </svg>,

  // 6면
  <svg
    key="6"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full h-full"
  >
    <rect
      x="2"
      y="2"
      width="20"
      height="20"
      rx="3"
      className="stroke-foreground"
      strokeWidth="1.5"
      fill="none"
    />
    <circle cx="7" cy="6" r="2.5" className="fill-foreground" />
    <circle cx="17" cy="6" r="2.5" className="fill-foreground" />
    <circle cx="7" cy="12" r="2.5" className="fill-foreground" />
    <circle cx="17" cy="12" r="2.5" className="fill-foreground" />
    <circle cx="7" cy="18" r="2.5" className="fill-foreground" />
    <circle cx="17" cy="18" r="2.5" className="fill-foreground" />
  </svg>,
];

const DiceIcon = ({ rolling }: { rolling: boolean }) => {
  const [currentFace, setCurrentFace] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (rolling) {
      console.log("Rolling started, currentFace:", currentFace);
      interval = setInterval(() => {
        setCurrentFace((prev) => {
          const next = (prev + 1) % 6; // diceFaces.length 대신 6 사용
          return next;
        });
      }, 150);
    } else {
      setCurrentFace(0);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [rolling]);

  return (
    <div className="inline-flex items-center justify-center">
      <div
        className={cn(
          "w-4 h-4 inline-flex items-center justify-center",
          rolling && "animate-spin"
        )}
      >
        {diceFaces[currentFace]}
      </div>
    </div>
  );
};

export default DiceIcon;
