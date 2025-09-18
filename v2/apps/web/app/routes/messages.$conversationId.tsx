import { redirect } from "@remix-run/node";

export async function loader() {
  return redirect("/messages");
}

export { default } from "./messages";
