import { Outlet } from "react-router";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

/**
 * Layout wrapper — provides Navbar (top) + Footer (bottom)
 * with the main content area in the middle (flex-1).
 * Max-width container: 1440px centered.
 */
export default function Layout() {
  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: "#0A0A0F" }}
    >
      <Navbar />
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-6 py-6">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
