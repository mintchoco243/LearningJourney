"use client";

import React from "react";
import Script from "next/script";
import { setDynamicGaId } from "@/lib/analytics";

export function GoogleAnalyticsLoader({ initialGaId }) {
  const [gaId, setGaId] = React.useState(initialGaId || "");

  React.useEffect(() => {
    if (initialGaId) {
      setDynamicGaId(initialGaId);
    } else {
      fetch("/api/config/public")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data && data.ga_measurement_id) {
            setGaId(data.ga_measurement_id);
            setDynamicGaId(data.ga_measurement_id);
          }
        })
        .catch(() => {});
    }
  }, [initialGaId]);

  if (!gaId) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${gaId}', { send_page_view: false });
        `}
      </Script>
    </>
  );
}
