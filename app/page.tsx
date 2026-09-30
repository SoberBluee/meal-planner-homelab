import { redirect } from "next/navigation";
import { logPageView } from "@/lib/log-page-view";

export default function HomePage() {
  logPageView("/", { action: "page.home.redirect" });
  redirect("/shop/new");
}
