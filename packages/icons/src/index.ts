import {
  AlertCircleIcon as AlertCircleHugeicon,
  Archive03Icon,
  ArrowDown01Icon,
  ArrowRight01Icon,
  Building03Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Edit02Icon,
  Home04Icon,
  InformationCircleIcon as InformationCircleHugeicon,
  Location01Icon,
  LockPasswordIcon,
  Logout01Icon,
  Mail01Icon,
  Menu02Icon,
  PlusSignIcon,
  Settings02Icon,
  Shield01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { createElement, type ReactElement, type SVGProps } from "react";

export type DarbIconProps = Omit<SVGProps<SVGSVGElement>, "aria-label" | "children" | "role"> & {
  size?: number | string;
};

function createDarbIcon(icon: IconSvgElement, props: DarbIconProps): ReactElement {
  return createElement(HugeiconsIcon, {
    ...props,
    "aria-hidden": true,
    focusable: false,
    icon,
    strokeWidth: 1.7,
  });
}

export function ArrowRightIcon(props: DarbIconProps): ReactElement {
  return createDarbIcon(ArrowRight01Icon, props);
}

export function AlertCircleIcon(props: DarbIconProps): ReactElement {
  return createDarbIcon(AlertCircleHugeicon, props);
}

export function ArchiveIcon(props: DarbIconProps): ReactElement {
  return createDarbIcon(Archive03Icon, props);
}

export function ArrowDownIcon(props: DarbIconProps): ReactElement {
  return createDarbIcon(ArrowDown01Icon, props);
}

export function BuildingIcon(props: DarbIconProps): ReactElement {
  return createDarbIcon(Building03Icon, props);
}

export function CancelIcon(props: DarbIconProps): ReactElement {
  return createDarbIcon(Cancel01Icon, props);
}

export function CheckmarkCircleIcon(props: DarbIconProps): ReactElement {
  return createDarbIcon(CheckmarkCircle02Icon, props);
}

export function EditIcon(props: DarbIconProps): ReactElement {
  return createDarbIcon(Edit02Icon, props);
}

export function HomeIcon(props: DarbIconProps): ReactElement {
  return createDarbIcon(Home04Icon, props);
}

export function InformationCircleIcon(props: DarbIconProps): ReactElement {
  return createDarbIcon(InformationCircleHugeicon, props);
}

export function LocationIcon(props: DarbIconProps): ReactElement {
  return createDarbIcon(Location01Icon, props);
}

export function LockIcon(props: DarbIconProps): ReactElement {
  return createDarbIcon(LockPasswordIcon, props);
}

export function LogoutIcon(props: DarbIconProps): ReactElement {
  return createDarbIcon(Logout01Icon, props);
}

export function MailIcon(props: DarbIconProps): ReactElement {
  return createDarbIcon(Mail01Icon, props);
}

export function MenuIcon(props: DarbIconProps): ReactElement {
  return createDarbIcon(Menu02Icon, props);
}

export function PlusIcon(props: DarbIconProps): ReactElement {
  return createDarbIcon(PlusSignIcon, props);
}

export function SettingsIcon(props: DarbIconProps): ReactElement {
  return createDarbIcon(Settings02Icon, props);
}

export function ShieldIcon(props: DarbIconProps): ReactElement {
  return createDarbIcon(Shield01Icon, props);
}
