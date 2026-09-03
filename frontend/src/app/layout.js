import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import SecurityGuard from "../components/SecurityGuard";
import LayoutClient from "./layout-client";

export const metadata = {
  title: "3BCA-B Classroom Activity Log Portal",
  description: "Official portal to log and archive workshops, guest sessions, and hackathon records for class 3BCA-B.",
  keywords: ["3BCA-B", "Christ University", "Classroom Activity", "Computer Applications"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#F0F7FF] text-[#1E293B]">
        <LayoutClient>
          {children}
        </LayoutClient>
      </body>
    </html>
  );
}
