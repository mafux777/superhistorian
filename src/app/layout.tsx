import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Super Historian — Explore the Infinite Depth of History",
  description:
    "An AI-driven interactive history explorer. Drill into any era by time or geography, going infinitely deep into the fractal structure of human history.",
};

// Novus by Pendo install snippet (keep verbatim): defines a `pendo` stub that
// queues calls until the agent script has loaded from the Pendo CDN.
const PENDO_INSTALL_SCRIPT = `
(function(apiKey){
    (function(p,e,n,d,o){var v,w,x,y,z;o=p[d]=p[d]||{};o._q=o._q||[];
    v=['initialize','identify','updateOptions','pageLoad','track', 'trackAgent'];for(w=0,x=v.length;w<x;++w)(function(m){
    o[m]=o[m]||function(){o._q[m===v[0]?'unshift':'push']([m].concat([].slice.call(arguments,0)));};})(v[w]);
    y=e.createElement(n);y.async=!0;y.src='https://cdn.pendo.io/agent/static/'+apiKey+'/pendo.js';
    z=e.getElementsByTagName(n)[0];z.parentNode.insertBefore(y,z);})(window,document,'script','pendo');
})('956c1cb8-a215-411b-b9e9-cbb0285ff66d');
`;

// Boots the agent exactly once per page load, before the app renders. The app
// has no sign-in, so visitors are anonymous: an empty id lets Pendo reuse the
// visitor it stored for this browser, or start a new anonymous one.
const PENDO_INITIALIZE_SCRIPT = `pendo.initialize({ visitor: { id: '' } });`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: PENDO_INSTALL_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: PENDO_INITIALIZE_SCRIPT }} />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
