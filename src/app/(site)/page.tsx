import { Contact } from "@/components/home/Contact";
import { Hero } from "@/components/home/Hero";
import { Industries } from "@/components/home/Industries";
import { SelectedWork } from "@/components/home/SelectedWork";
import { Services } from "@/components/home/Services";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Services />
      <Industries />
      <SelectedWork />
      <Contact />
    </>
  );
}
