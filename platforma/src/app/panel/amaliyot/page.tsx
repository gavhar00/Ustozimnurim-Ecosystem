import { redirect } from "next/navigation";

/** Panel ichidagi "Amaliyot" havolasi to‘liq muharrir sahifasiga olib boradi. */
export default function Sahifa() {
  redirect("/amaliyot");
}
