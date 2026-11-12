import Image from "next/image";

// A mission's picture filling a frame of the given shape, cropped to fit.
// `first` marks a picture at the top of the page, fetched straight away
// rather than when scrolled near.
export default function MissionImage({
  src,
  sizes,
  className = "",
  first = false,
}: {
  src: string;
  sizes: string;
  className?: string;
  first?: boolean;
}) {
  return (
    <div className={`relative overflow-hidden bg-picture ${className}`}>
      <Image
        src={src}
        alt=""
        fill
        sizes={sizes}
        preload={first}
        fetchPriority={first ? "high" : undefined}
        className="object-cover"
      />
    </div>
  );
}

// Who made the picture, under what licence, and where it came from, as
// Creative Commons licences ask.
export function ImageCredit({
  mission,
  className = "",
}: {
  mission: {
    imageCredit: string | null;
    imageLicense: string | null;
    imageLicenseUrl: string | null;
    imageSourceUrl: string | null;
  };
  className?: string;
}) {
  const { imageCredit, imageLicense, imageLicenseUrl, imageSourceUrl } =
    mission;

  if (!imageCredit || !imageLicense || !imageSourceUrl) return null;

  return (
    <p className={`text-xs text-muted ${className}`}>
      Image: {imageCredit} ·{" "}
      {imageLicenseUrl ? (
        <a href={imageLicenseUrl} className="hover:underline">
          {imageLicense}
        </a>
      ) : (
        imageLicense
      )}{" "}
      ·{" "}
      <a href={imageSourceUrl} className="hover:underline">
        Wikimedia Commons
      </a>
    </p>
  );
}
