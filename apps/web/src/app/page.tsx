import Link from "next/link";
import { Atom, FlaskConical, Leaf, Sigma } from "lucide-react";

const subjects = [
  { name: "Mathematik", icon: Sigma,       color: "from-brand-500 to-brand-700" },
  { name: "Physik",     icon: Atom,        color: "from-accent-500 to-accent-700" },
  { name: "Chemie",     icon: FlaskConical,color: "from-brand-600 to-accent-600" },
  { name: "Biologie",   icon: Leaf,        color: "from-accent-400 to-brand-500" },
];

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border/60 backdrop-blur sticky top-0 z-40 bg-background/70">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 grid place-items-center text-white">
              MrK
            </span>
            <span>Lernplattform</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition"
            >
              Anmelden
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-brand-500 to-accent-500 text-white hover:opacity-90 transition"
            >
              Registrieren
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 grid place-items-center px-6 py-20">
        <div className="max-w-3xl text-center space-y-6">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-accent-100 text-accent-800 dark:bg-accent-900/40 dark:text-accent-200">
            Klassen 7 – 10 · Mathematik · Physik · Chemie · Biologie
          </span>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Lernen, das{" "}
            <span className="bg-gradient-to-r from-brand-500 to-accent-500 bg-clip-text text-transparent">
              belohnt
            </span>{" "}
            wird.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Aufgaben digital abgeben, Fortschritt live verfolgen, Sterne und
            Badges sammeln – für Schüler, Lehrkräfte und Administratoren.
          </p>
          <div className="flex flex-wrap gap-3 justify-center pt-4">
            <Link
              href="/login"
              className="px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-brand-500 to-accent-500 text-white hover:opacity-90 transition"
            >
              Jetzt starten
            </Link>
            <Link
              href="/demo"
              className="px-6 py-3 rounded-xl font-medium border border-border hover:bg-muted transition"
            >
              Demo ansehen
            </Link>
          </div>
        </div>
      </section>

      {/* Fächer */}
      <section className="max-w-6xl mx-auto w-full px-6 pb-20 grid grid-cols-2 md:grid-cols-4 gap-4">
        {subjects.map(({ name, icon: Icon, color }) => (
          <div
            key={name}
            className="rounded-2xl border border-border bg-card p-6 hover:shadow-lg hover:-translate-y-0.5 transition"
          >
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} grid place-items-center text-white mb-4`}
            >
              <Icon size={22} />
            </div>
            <h3 className="font-semibold">{name}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Materialien, Aufgaben & Quizze
            </p>
          </div>
        ))}
      </section>

      <footer className="border-t border-border/60 py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} MrK · DSGVO-konform · Made with ❤️ für den Unterricht
      </footer>
    </main>
  );
}
