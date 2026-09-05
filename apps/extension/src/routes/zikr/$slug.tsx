import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslations } from "use-intl";
import { getZikrData } from "@workspace/azkar/helpers";
import { ArrowRight } from "@workspace/ui/index";
import { Button } from "@workspace/ui/components/button";
import ZikrInfoList from "@workspace/ui/layout/ZikrInfoList";

export const Route = createFileRoute("/zikr/$slug")({
  loader: async ({ params }) => {
    return {
      data: await getZikrData(params.slug),
    };
  },
  component: ZikrPage,
});

function ZikrPage() {
  const { data } = Route.useLoaderData();
  const t = useTranslations("app.zikr");
  console.log(data);
  return (
    <div className="space-y-2">
      <div>
        <Button variant="ghost" render={<Link to="/"></Link>}>
          <ArrowRight className="rtl:scale-x-[-1]" />
          {t("back")}
        </Button>
      </div>
      <ZikrInfoList zikrInfoList={data} />
    </div>
  );
}
