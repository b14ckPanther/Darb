"use client";

import { AlertCircleIcon, CheckmarkCircleIcon, InformationCircleIcon } from "@darb/icons";

import {
  getAdminStatusSemantic,
  type AdminSemanticStatus,
  type AdminStatusTone,
} from "../../lib/status";
import { useAdminI18n } from "../../lib/i18n-client";

interface StatusBadgeProps {
  className?: string;
  label?: string;
  status: AdminSemanticStatus;
}

const toneIcons: Record<AdminStatusTone, typeof CheckmarkCircleIcon> = {
  danger: AlertCircleIcon,
  neutral: InformationCircleIcon,
  positive: CheckmarkCircleIcon,
  warning: AlertCircleIcon,
};

export function StatusBadge({ className, label, status }: StatusBadgeProps) {
  const { t } = useAdminI18n();
  const semantic = getAdminStatusSemantic(status);
  const Icon = toneIcons[semantic.tone];

  return (
    <span
      className={`status-badge status-badge--${semantic.tone}${className ? ` ${className}` : ""}`}
      data-status={status}
    >
      <Icon size={14} />
      {t(label ?? semantic.label)}
    </span>
  );
}
