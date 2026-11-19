import Image from "next/image";

// The "Mission Atlas" wordmark. The kit has one per background; CSS shows the
// one that suits the current theme.
export default function Wordmark({ priority = false }: { priority?: boolean }) {
  return (
    <>
      <Image
        src="/brand/mission-atlas-wordmark-on-dark.svg"
        alt="Mission Atlas"
        width={191}
        height={14}
        unoptimized
        priority={priority}
        className="light:hidden"
      />
      <Image
        src="/brand/mission-atlas-wordmark-on-light.svg"
        alt="Mission Atlas"
        width={191}
        height={14}
        unoptimized
        priority={priority}
        className="hidden light:block"
      />
    </>
  );
}
