import PageLayout from "@/components/PageLayout";
import HeroSection from "@/components/HeroSection";
import GardenShopBanner from "@/components/GardenShopBanner";
import AboutSection from "@/components/AboutSection";
import ServicesSection from "@/components/ServicesSection";
import ImpactSection from "@/components/ImpactSection";
import WhyChooseUs from "@/components/WhyChooseUs";
import ContactSection from "@/components/ContactSection";

const Index = () => (
  <PageLayout>
    <HeroSection />
    <GardenShopBanner />
    <AboutSection />
    <ServicesSection />
    <ImpactSection />
    <WhyChooseUs />
    <ContactSection />
  </PageLayout>
);

export default Index;
