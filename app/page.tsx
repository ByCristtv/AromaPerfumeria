import Hero from "@/components/home/Hero";
import TrustIndicators from "@/components/home/TrustIndicators";
import FeaturedCollection from "@/components/home/FeaturedCollection";

// Revalidate the homepage teaser every 5 minutes (ISR) so new arrivals
// surface without a redeploy, while keeping render cost off the request path.
export const revalidate = 300;

export default function Home() {
  return (
    <>
      <Hero />
      <TrustIndicators />
      <FeaturedCollection />
    </>
  );
}
