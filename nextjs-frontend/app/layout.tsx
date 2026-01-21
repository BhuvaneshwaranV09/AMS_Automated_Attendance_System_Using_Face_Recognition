import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Face Recognition Attendance System',
  description: 'Manage attendance using face recognition',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-100 min-h-screen">{children}</body>
    </html>
  );
}