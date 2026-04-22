import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { ThemeProvider } from "@/i18n/ThemeContext";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index.tsx";

// Lazy-load non-critical routes
const AboutPage = lazy(() => import("./pages/AboutPage.tsx"));
const TechnologyPage = lazy(() => import("./pages/TechnologyPage.tsx"));
const ServicesPage = lazy(() => import("./pages/ServicesPage.tsx"));
const ResearchPage = lazy(() => import("./pages/ResearchPage.tsx"));
const ContactPage = lazy(() => import("./pages/ContactPage.tsx"));
const GalleryPage = lazy(() => import("./pages/GalleryPage.tsx"));
const ProductsPage = lazy(() => import("./pages/ProductsPage.tsx"));
const GardenShopPage = lazy(() => import("./pages/GardenShopPage.tsx"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin.tsx"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard.tsx"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts.tsx"));
const AdminTeam = lazy(() => import("./pages/admin/AdminTeam.tsx"));
const AdminContent = lazy(() => import("./pages/admin/AdminContent.tsx"));
const AdminOffers = lazy(() => import("./pages/admin/AdminOffers.tsx"));
const AdminGallery = lazy(() => import("./pages/admin/AdminGallery.tsx"));
const IgLandingPage = lazy(() => import("./pages/IgLandingPage.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<div className="min-h-screen" />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/technology" element={<TechnologyPage />} />
                  <Route path="/services" element={<ServicesPage />} />
                  <Route path="/research" element={<ResearchPage />} />
                  <Route path="/gallery" element={<GalleryPage />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/garden-shop" element={<GardenShopPage />} />
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/products" element={<AdminProducts />} />
                  <Route path="/admin/team" element={<AdminTeam />} />
                  <Route path="/admin/content" element={<AdminContent />} />
                  <Route path="/admin/offers" element={<AdminOffers />} />
                  <Route path="/admin/gallery" element={<AdminGallery />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
