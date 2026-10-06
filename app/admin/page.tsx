import { isAdmin } from "@/lib/admin";
import { catalog } from "@/lib/catalog";
import AdminPanel from "./panel";
export const dynamic = "force-dynamic";
export default async function Admin() {
  return (
    <AdminPanel
      authenticated={await isAdmin()}
      items={await catalog()}
      configured={!!process.env.ADMIN_PASSWORD}
    />
  );
}
