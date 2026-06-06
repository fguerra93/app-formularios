"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/admin/sidebar";
import { NotificationBell } from "@/components/admin/notification-bell";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#F7F8FC" }}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        <div className="flex justify-end px-6 pt-4 lg:px-8">
          <NotificationBell />
        </div>
        <div className="mx-auto max-w-7xl p-6 pt-2 lg:p-8 lg:pt-2">{children}</div>
      </main>
    </div>
  );
}
