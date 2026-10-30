const BUCKETS = [320, 480, 640, 828, 1080, 1200];

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

  const target = width && width > 0 ? width : 640;
  const w = BUCKETS.find((b) => b >= target) ?? 1200;

  const path = src.replace("https://media.alloypress.com", "");
  return `https://media.alloypress.com/cdn-cgi/image/width=${w},quality=${quality ?? 90},format=auto${path}`;
}