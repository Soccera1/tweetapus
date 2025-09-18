import { redirect } from "@remix-run/node";

export async function loader() {
  return redirect("/timeline-new");
}

export default function Timeline() {
  return null;
}
