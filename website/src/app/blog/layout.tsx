import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Header variant="home" />
      {children}
      <Footer />
    </div>
  );
}
