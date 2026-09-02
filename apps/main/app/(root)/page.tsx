import { permanentRedirect } from "next/navigation";

import { getPublicLocalePath, defaultPublicLocale } from "../../lib/site";

export default function RootPage() {
  permanentRedirect(getPublicLocalePath(defaultPublicLocale));
}
