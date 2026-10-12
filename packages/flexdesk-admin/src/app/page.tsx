"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const AdminApp = dynamic(() => import("@/components/admin-app"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col justify-center items-center h-svh">
      <Loader2 className="size-12 animate-spin text-primary" />
      <p className="mt-3 text-muted-foreground">Loading...</p>
    </div>
  ),
});

export default function Page() {
  return <AdminApp />;
}
