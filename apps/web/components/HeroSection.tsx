import { cn } from "@workspace/lib/utils";
import { buttonVariants } from "@workspace/ui/components/button";
import { Chrome } from "@workspace/ui/index";
import Image from "next/image";
import Link from "next/link";
import HeroSectionCTA from "./HeroSectionCTA";

export default function HeroSection() {
  return (
    <section className="space-y-6 pt-20">
      <div className="flex items-center justify-center gap-2">
        <Image src="/logo.png" alt="Logo" width={25} height={25} />
        <p className="text-lg font-bold md:text-xl lg:text-2xl">Katheera</p>
      </div>
      <h1 className="text-center text-3xl font-bold sm:text-4xl md:text-5xl lg:text-7xl">
        Turn your silence <br /> into rewards
      </h1>
      <p className="mx-auto max-w-xs text-center text-neutral-400">
        <q className="">
          <i>O you who have believed, remember Allah with much remembrance</i>
        </q>
        <br />— Quran 33:41
      </p>
      <div className="flex flex-col items-center justify-center gap-2">
        <div className="flex gap-2">
          <HeroSectionCTA />
          {/* <Button
            size="lg"
            className="bg-primary rounded-full px-6"
            render={
              <Link href="#">
                <Chrome /> Get the extension
              </Link>
            }
          />
          <Button
            size="lg"
            variant="secondary"
            className="rounded-full px-6"
            render={<Link href="/app">Try it now</Link>}
          /> */}
        </div>
        <small className="text-neutral-400">
          Free • Privacy-first • Open source
        </small>
      </div>
    </section>
  );
}
