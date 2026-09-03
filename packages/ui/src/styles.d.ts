declare module "*.module.css" {
  const classes: Readonly<Record<string, string>>;

  export default classes;
}

declare module "*.png" {
  const image:
    | string
    | {
        readonly height: number;
        readonly src: string;
        readonly width: number;
      };

  export default image;
}
