import { catalog } from "@/lib/catalog";
import Storefront from "./components/storefront";
export const dynamic = "force-dynamic";
export default async function Home() {
  return <Storefront items={await catalog()} />;
}
