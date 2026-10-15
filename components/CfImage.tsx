"use client";

import Image, { type ImageProps } from "next/image";
import cfLoader from "@/lib/imageLoader";

export default function CfImage(props: Omit<ImageProps, "loader">) {
  return <Image loader={cfLoader} {...props} />;
}