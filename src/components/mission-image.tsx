import Image from "next/image";

// A mission's picture, shown whole whatever its shape: the frame sets the
// shape, and a blurred copy of the picture fills the space beside it. Both
// copies ask for the same sizes, so the browser downloads it once.
export default function MissionImage({
  src,
  alt = "",
  sizes,
  preload = false,
  className = "",
}: {
  src: string;
  alt?: string;
  sizes: string;
  preload?: boolean;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden bg-picture ${className}`}>
      <Image
        src={src}
        alt=""
        fill
        sizes={sizes}
        className="scale-125 object-cover opacity-40 blur-2xl"
      />
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        preload={preload}
        className="object-contain"
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
