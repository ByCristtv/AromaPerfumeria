import Hero from "@/components/home/Hero";
import TrustIndicators from "@/components/home/TrustIndicators";
import FeaturedCollection from "@/components/home/FeaturedCollection";
import Identity from "@/components/home/Identity";

// Revalidate the homepage teaser every 5 minutes (ISR) so new arrivals
// surface without a redeploy, while keeping render cost off the request path.
export const revalidate = 300;

/**
 * Order is the argument: claim → reassurance → product → meaning.
 *
 * `Identity` (what KROV actually means) sits AFTER the first look at the
 * catalogue on purpose. A visitor who has just seen something they want is
 * ready to be told why the brand is called what it is; a visitor who is told
 * first is being lectured before they have any reason to care.
 */
export default function Home() {
  return (
    <>
      <Hero />
      <TrustIndicators />
      <FeaturedCollection />
      <Identity />
    </>
  );
}
