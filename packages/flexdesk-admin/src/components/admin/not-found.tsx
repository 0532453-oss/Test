import { Translate, useRedirect } from "ra-core";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export const NotFound = () => {
  const redirect = useRedirect();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center py-16">
      <h1 className="text-6xl font-bold">404</h1>
      <h2 className="text-2xl font-semibold">
        <Translate i18nKey="ra.page.not_found" />
      </h2>
      <p className="max-w-md text-muted-foreground">
        <Translate i18nKey="ra.message.not_found" />
      </p>
      <Button className="mt-4" onClick={() => redirect("/")}>
        <Home className="mr-2 h-4 w-4" />
        <Translate i18nKey="ra.action.back" />
      </Button>
    </div>
  );
};
