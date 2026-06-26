import type { Config } from "@react-router/dev/config";

export default {
  // This app is 100% client-driven (localStorage identity + direct Firebase REST),
  // so we run as an SPA. Routes use clientLoader/clientAction.
  ssr: false,
} satisfies Config;
