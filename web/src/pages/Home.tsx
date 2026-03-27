import { Navbar } from '@/components/Navbar'
import { HeroSection } from '@/components/home/HeroSection'
import { FeaturesSection } from '@/components/home/FeaturesSection'
import { HowItWorksSection } from '@/components/home/HowItWorksSection'
import { ShowcaseSection } from '@/components/home/ShowcaseSection'
import { PricingSection } from '@/components/home/PricingSection'
import { CTASection } from '@/components/home/CTASection'
import { Footer } from '@/components/home/Footer'

export default function Home() {
  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <ShowcaseSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </div>
  )
}
