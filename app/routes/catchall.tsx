import { redirect } from "react-router";

export function clientLoader() {
  return redirect("/");
}

export default function catchall() {
  return null;
}
