import {
  AlertCircleIcon as AlertCircleHugeicon,
  Archive03Icon,
  ArrowDown01Icon,
  ArrowRight01Icon,
  Building03Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  ChefHatIcon,
  ColorsIcon,
  Copy01Icon,
  Edit02Icon,
  Globe02Icon,
  Home04Icon,
  Image01Icon,
  ImageUpload01Icon,
  InformationCircleIcon as InformationCircleHugeicon,
  Layers01Icon,
  LanguagesIcon,
  Location01Icon,
  LockPasswordIcon,
  Logout01Icon,
  Mail01Icon,
  Menu02Icon,
  PlusSignIcon,
  RefreshIcon,
  Settings02Icon,
  Shield01Icon,
  TextFontIcon,
  TranslateIcon,
  ViewIcon,
  Video01Icon,
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

export function AppearanceIcon(props: DarbIconProps): ReactElement {
  return createDarbIcon(ColorsIcon, props);
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

export function RestaurantIcon(props: DarbIconProps): ReactElement {
  return createDarbIcon(ChefHatIcon, props);
}

export function CopyIcon(props: DarbIconProps): ReactElement {
  return createDarbIcon(Copy01Icon, props);
}

export function EditIcon(props: DarbIconProps): ReactElement {
  return createDarbIcon(Edit02Icon, props);
}

export function HomeIcon(props: DarbIconProps): ReactElement {
  return createDarbIcon(Home04Icon, props);
}

export function DomainIcon(props: DarbIconProps): ReactElement {
  return createDarbIcon(Globe02Icon, props);
}

export function ImageIcon(props: DarbIconProps): ReactElement {
  return createDarbIcon(Image01Icon, props);
}

export function ImageUploadIcon(props: DarbIconProps): ReactElement {
  return createDarbIcon(ImageUpload01Icon, props);
}

export function InformationCircleIcon(props: DarbIconProps): ReactElement {
  return createDarbIcon(InformationCircleHugeicon, props);
}

export function LocationIcon(props: DarbIconProps): ReactElement {
  return createDarbIcon(Location01Icon, props);
}

export function LanguagesSettingsIcon(props: DarbIconProps): ReactElement {
  return createDarbIcon(LanguagesIcon, props);
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

export function ModulesIcon(props: DarbIconProps): ReactElement {
  return createDarbIcon(Layers01Icon, props);
}

export function PlusIcon(props: DarbIconProps): ReactElement {
  return createDarbIcon(PlusSignIcon, props);
}

export function PreviewIcon(props: DarbIconProps): ReactElement {
  return createDarbIcon(ViewIcon, props);
}

export function ResetIcon(props: DarbIconProps): ReactElement {
  return createDarbIcon(RefreshIcon, props);
}

export function SettingsIcon(props: DarbIconProps): ReactElement {
  return createDarbIcon(Settings02Icon, props);
}

export function ShieldIcon(props: DarbIconProps): ReactElement {
  return createDarbIcon(Shield01Icon, props);
}

export function TypographyIcon(props: DarbIconProps): ReactElement {
  return createDarbIcon(TextFontIcon, props);
}

export function TranslationIcon(props: DarbIconProps): ReactElement {
  return createDarbIcon(TranslateIcon, props);
}

export function VideoIcon(props: DarbIconProps): ReactElement {
  return createDarbIcon(Video01Icon, props);
}
