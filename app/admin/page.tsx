import { isAdmin } from "@/lib/admin";
import { catalogState } from "@/lib/catalog";
import { cloudinaryConfigured } from "@/lib/cloudinary";
import AdminPanel from "./panel";
export const dynamic = "force-dynamic";
export default async function Admin() {
  const state = await catalogState();
  return (
    <AdminPanel
      authenticated={await isAdmin()}
      items={state.items}
      storageError={
        state.error ||
        (!cloudinaryConfigured()
          ? "Configure Cloudinary credentials in .env.local to upload product photos."
          : "")
      }
      configured={!!process.env.ADMIN_PASSWORD}
    />
  );
}
