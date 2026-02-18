import * as React from "react";

type ResponsiveImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
  width: number;
  height: number;
  sizes?: string;
  priority?: boolean;
  quality?: number; // only used if you control the URLs
  widths?: number[];
};

const DEFAULT_WIDTHS = [320, 640, 768, 1024, 1280, 1536];

const buildSrcSet = (src: string, widths: number[]) =>
  widths.map((w) => `${src}?w=${w} ${w}w`).join(", ");

const Image: React.FC<ResponsiveImageProps> = ({
  src,
  width,
  height,
  sizes = "100vw",
  priority = false,
  widths = DEFAULT_WIDTHS,
  style,
  ...imgProps
}) => {
  // const aspectRatio = width / height;

  React.useEffect(() => {
    if (!priority) return;

    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = src;
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, [priority, src]);

  return (
    <img
      src={src}
      srcSet={buildSrcSet(src, widths)}
      sizes={sizes}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      style={{
        aspectRatio: `${width} / ${height}`,
        width: "100%",
        height: "auto",
        ...style,
      }}
      {...imgProps}
    />
  );
};

export default Image;
