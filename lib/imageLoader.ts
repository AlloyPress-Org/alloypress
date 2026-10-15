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

  const path = src.replace("https://media.alloypress.com", "");
  return `https://media.alloypress.com/cdn-cgi/image/width=${width},quality=${quality ?? 75},format=auto,fit=cover${path}`;
}