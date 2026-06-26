'use client';

import SmoothScrollProvider from '@/components/sariro-3d/smooth-scroll-provider';
import { CustomCursor } from '@/components/sariro-3d/scroll-effects';
import ChapterNav, { ScrollHueShift } from '@/components/sariro-3d/chapter-nav';
import { CompanionOrb3D, BackgroundParticles3D } from '@/components/sariro-3d/persistent-3d';
import { WaveDivider3D } from '@/components/sariro-3d/kit-3d';
import Navbar3D from '@/components/sariro-3d/navbar-3d';
import Hero3D from '@/components/sariro-3d/hero-3d';
import Tracks3D from '@/components/sariro-3d/tracks-3d';
import Stats3D from '@/components/sariro-3d/stats-3d';
import Courses3D from '@/components/sariro-3d/courses-3d';
import Philosophy3D from '@/components/sariro-3d/philosophy-3d';
import Journey3D from '@/components/sariro-3d/journey-3d';
import Events3D from '@/components/sariro-3d/events-3d';
import Testimonials3D from '@/components/sariro-3d/testimonials-3d';
import Pricing3D from '@/components/sariro-3d/pricing-3d';
import CTA3D from '@/components/sariro-3d/cta-3d';
import Footer3D from '@/components/sariro-3d/footer-3d';

export default function Home() {
  return (
    <SmoothScrollProvider>
      <CustomCursor />
      <BackgroundParticles3D />
      <ScrollHueShift />
      <ChapterNav />
      <CompanionOrb3D />
      <div className="relative min-h-screen flex flex-col bg-white text-slate-900" style={{ zIndex: 1 }}>
        <Navbar3D />
        <main className="flex-1 relative" style={{ zIndex: 2 }}>
          <Hero3D />
          <Tracks3D />
          <WaveDivider3D fromColor="#FFFFFF" toColor="#0B1120" />
          <Journey3D />
          <WaveDivider3D fromColor="#0B1120" toColor="#F8FAFC" />
          <Stats3D />
          <Courses3D />
          <Philosophy3D />
          <WaveDivider3D fromColor="#FFFFFF" toColor="#0B1120" />
          <Events3D />
          <WaveDivider3D fromColor="#0B1120" toColor="#F8FAFC" />
          <Testimonials3D />
          <Pricing3D />
          <CTA3D />
        </main>
        <Footer3D />
      </div>
    </SmoothScrollProvider>
  );
}
