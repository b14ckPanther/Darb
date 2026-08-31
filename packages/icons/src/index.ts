import type { SVGProps } from "react";

export type DarbIconProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  size?: number | string;
};
