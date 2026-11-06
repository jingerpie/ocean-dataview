"use client";

import {
  type ComponentType,
  createContext,
  type ImgHTMLAttributes,
  type ReactNode,
  useContext,
} from "react";

/** Props passed to the image component. Always includes `src` and `alt`. */
export type DataViewImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  alt: string;
  src: string;
};

export type DataViewImageComponent = ComponentType<DataViewImageProps>;

function DefaultImage(props: DataViewImageProps) {
  // Callers size images with CSS classes; dimensions come through props when known.
  // biome-ignore lint/performance/noImgElement: Framework-neutral default; apps inject their own image component
  // biome-ignore lint/correctness/useImageSize: Sized by the caller's classes
  return <img {...props} alt={props.alt} />;
}

const DataViewImageContext =
  createContext<DataViewImageComponent>(DefaultImage);

/**
 * Supply the image component used by cards and media properties,
 * for example a wrapper around `next/image`. Defaults to `<img>`.
 */
export function DataViewImageProvider({
  children,
  component,
}: {
  children: ReactNode;
  component: DataViewImageComponent;
}) {
  return (
    <DataViewImageContext.Provider value={component}>
      {children}
    </DataViewImageContext.Provider>
  );
}

export function useDataViewImage(): DataViewImageComponent {
  return useContext(DataViewImageContext);
}
