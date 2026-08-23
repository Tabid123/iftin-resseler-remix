import { createFileRoute } from "@tanstack/react-router";
import DeliveryApp from "@/pages/DeliveryApp";

const title = "Delivery App Login | Iftin Internet";
const description =
  "Sign in with your tenant email and password to load your delivery session, SIM PINs and pending orders.";

export const Route = createFileRoute("/delivery")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DeliveryApp,
});
