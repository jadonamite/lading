"use client";
import AboutUs from "@/components/shadcn-space/blocks/about-us-01/about-us";
import { Lock, ShieldCheck, Zap } from "lucide-react";

const aboutusData = [
  {
    icon: Lock,
    title: "Unadministered",
    color: "bg-blue-500/10 text-blue-500",
  },
  {
    icon: ShieldCheck,
    title: "On-Chain",
    color: "bg-teal-400/10 text-teal-400",
  },
  {
    icon: Zap,
    title: "Final",
    color: "bg-orange-400/10 text-orange-400",
  },
];

const statisticsCounter = [
  {
    title: "Tests, all passing",
    count: 47,
  },
  {
    title: "Fuzz runs on the escrow invariant",
    count: 1024,
  },
  {
    title: "Administrative functions",
    count: 0,
  },
];

const AboutAndStats01 = () => {
  return <AboutUs aboutusData={aboutusData} statisticsCounter={statisticsCounter} />;
};

export default AboutAndStats01;
