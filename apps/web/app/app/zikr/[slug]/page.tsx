import { JSX } from "react";
import { getZikrData } from "@workspace/azkar/helpers";
import { ZikrInfo } from "@workspace/azkar/types";
import { ArrowRight, Copy } from "@workspace/ui/index";
import { Button } from "@workspace/ui/components/button";
import ZikrInfoCard from "@workspace/ui/layout/ZikrInfoCard";
import CopyButton from "@workspace/ui/layout/CopyButton";
import Link from "next/link";
export default async function HadithPage({
  params,
}: {
  params: { slug: Promise<string> };
}): Promise<JSX.Element> {
  const slug = await (await params).slug;
  const data: ZikrInfo[] = await getZikrData(slug);
  return (
    <div className="space-y-2">
      <Button
        variant="ghost"
        className="my-4"
        render={<Link href="/app"></Link>}
      >
        <ArrowRight />
        عودة
      </Button>
      {data.map((item, index: number) => (
        <ZikrInfoCard
          key={item.id}
          className="animate-fade-down opacity-0"
          style={{
            animationDelay: `${(index + 1) * 50}ms`,
          }}
        >
          <ZikrInfoCard.Text>{item.text}</ZikrInfoCard.Text>
          <ZikrInfoCard.Footer>
            {item.source}
            <CopyButton
              variant="ghost"
              toBeCopied={`${item.text} \n- ${item.source}`}
            >
              <Copy />
            </CopyButton>
          </ZikrInfoCard.Footer>
        </ZikrInfoCard>
      ))}
    </div>
  );
}
