
import React from "react";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-xl shadow-sm">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            <p className="mt-2 text-gray-600">{subtitle}</p>
          </div>
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AuthLayout;
