import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "Café — Premium Coffee Experience",
  description: "Order fresh, artisan coffee served fast. Premium café experience at your fingertips.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#292524',
              color: '#fafaf9',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
              padding: '12px 16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: '#0c0a09' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#0c0a09' },
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
