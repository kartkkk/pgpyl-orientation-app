"use client";

import Image from "next/image";
import { APP_NAME } from "@/lib/constants";

interface AppLogoProps {
  size?: number;
  priority?: boolean;
  className?: string;
}

export function AppLogo({
  size = 64,
  priority = false,
  className = "",
}: AppLogoProps) {
  return (
    <Image
      src="/icons/icon-512.png"
      alt={`${APP_NAME} logo`}
      width={size}
      height={size}
      priority={priority}
      className={`rounded-2xl shadow-sm ${className}`.trim()}
    />
  );
}
