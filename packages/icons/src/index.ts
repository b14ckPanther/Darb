import {
  ArrowRight01Icon,
  Building03Icon,
  LockPasswordIcon,
  Logout01Icon,
  Mail01Icon,
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

export function BuildingIcon(props: DarbIconProps): ReactElement {
  return createDarbIcon(Building03Icon, props);
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

export function ShieldIcon(props: DarbIconProps): ReactElement {
  return createDarbIcon(Shield01Icon, props);
}
