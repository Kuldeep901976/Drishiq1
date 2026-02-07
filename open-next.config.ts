import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // Don't specify buildCommand - opennextjs-cloudflare build already runs npm run build:cf
  // which includes the Next.js build step
});

