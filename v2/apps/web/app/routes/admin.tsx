import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { AdminLayout } from "~/components/admin/admin-layout";
import { requireAdmin } from "~/lib/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAdmin(request);

  const response = await fetch("http://localhost:3000/api/admin/stats", {
    headers: {
      Authorization: `Bearer ${user.token}`,
    },
  });

  if (!response.ok) {
    throw new Response("Failed to fetch admin stats", { status: 500 });
  }

  const data = await response.json();
  return json({ stats: data.stats });
}

export default function AdminRoute() {
  const { stats } = useLoaderData<typeof loader>();

  return (
    <AdminLayout stats={stats}>
      <Outlet />
    </AdminLayout>
  );
}
