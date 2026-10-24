import { createFileRoute } from "@tanstack/react-router";

import { pwaLocale } from "~/lib/pwa";

import { offlineDocument } from "./offline-document";

/*===== Offline Page =====*/
/**
 * The page the service worker shows in place of one that can't load (`public/sw.js`), in Persian or, with `?lang=en`,
 * English. The worker fetches it once when it installs and keeps it; nobody opens this address themselves.
 */
export const Route = createFileRoute("/pwa/offline")({
  server: {
    handlers: {
      GET: ({ request }) =>
        new Response(offlineDocument(pwaLocale(request)), {
          headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" },
        }),
    },
  },
});
