export default function cfLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  if (!src.startsWith("https://media.alloypress.com/")) return src;
  if (src.includes("/cdn-cgi/image/")) return src;

  // vinext sometimes calls the loader with width 0, so never allow that
  const w = width && width > 0 ? Math.min(width, 1200) : 640;

  const path = src.replace("https://media.alloypress.com", "");
  return `https://media.alloypress.com/cdn-cgi/image/width=${w},quality=${quality ?? 70},format=auto${path}`;
}