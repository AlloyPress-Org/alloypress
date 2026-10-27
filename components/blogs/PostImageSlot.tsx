import CfImage from "@/components/CfImage";
import { buildLinkAttrs } from "@/lib/linkRel";
import type { ImageSlot } from "@/lib/api/imageSlots";

/**
 * Own poster. `device` decides where CSS shows it:
 *  - "desktop": >= 1181px  (left rail, below TOC)
 *  - "tablet" : 821-1180px (right sidebar, TOC is hidden there)
 *  - "mobile" : <= 820px   (above the badge)
 * Size is fixed in CSS (.post-image-slot--*), not from the CMS.
 */
export default function PostImageSlot({
  slot,
  device,
}: {
  slot?: ImageSlot | null;
  device: "desktop" | "tablet" | "mobile";
}) {
  if (!slot) return null;

  const img = (
    <CfImage
      src={slot.src}
      alt={slot.alt}
      width={slot.width}
      height={slot.height}
      sizes="(max-width: 820px) 90vw, 280px"
      loading="lazy"
      className="post-image-slot-img"
    />
  );

  const attrs = slot.href
    ? buildLinkAttrs({
        url: slot.href,
        newTab: true,
        followMode: slot.followMode,
        sponsored: slot.sponsored,
      })
    : null;

  return (
    <div className={`post-image-slot post-image-slot--${device}`} data-slot-id={slot.id}>
      {attrs ? (
        <a href={attrs.href} target={attrs.target} rel={attrs.rel} className="post-image-slot-link">
          {img}
        </a>
      ) : (
        img
      )}
    </div>
  );
}