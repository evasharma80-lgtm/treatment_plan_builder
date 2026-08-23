import './globals.css';

export const metadata = { title: 'AI Treatment Plan Builder' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <a href="/" className="brand">AI Treatment Plan Builder</a>
          <nav>
            <a href="/intake">Intake</a>
            <a href="/plans">Plans</a>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
