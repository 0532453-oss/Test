import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-col justify-center items-center h-svh">
      <Loader2 className="size-12 animate-spin text-primary" />
      <p className="mt-3 text-muted-foreground">Loading...</p>
    </div>
  );
}
