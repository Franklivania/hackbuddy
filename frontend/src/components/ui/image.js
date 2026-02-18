import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
const DEFAULT_WIDTHS = [320, 640, 768, 1024, 1280, 1536];
const buildSrcSet = (src, widths) => widths.map((w) => `${src}?w=${w} ${w}w`).join(", ");
const Image = ({ src, width, height, sizes = "100vw", priority = false, widths = DEFAULT_WIDTHS, style, ...imgProps }) => {
    // const aspectRatio = width / height;
    React.useEffect(() => {
        if (!priority)
            return;
        const link = document.createElement("link");
        link.rel = "preload";
        link.as = "image";
        link.href = src;
        document.head.appendChild(link);
        return () => {
            document.head.removeChild(link);
        };
    }, [priority, src]);
    return (_jsx("img", { src: src, srcSet: buildSrcSet(src, widths), sizes: sizes, loading: priority ? "eager" : "lazy", decoding: "async", style: {
            aspectRatio: `${width} / ${height}`,
            width: "100%",
            height: "auto",
            ...style,
        }, ...imgProps }));
};
export default Image;
