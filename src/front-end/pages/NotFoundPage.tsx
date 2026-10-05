import { Link } from 'react-router';

export default function NotFoundPage() {
  return (
    <main className="page-shell">
      <section className="detail-card empty-state">
        <h1>Page introuvable</h1>
        <p>Cette URL n'existe pas.</p>
        <Link to="/" className="back-link">
          Revenir à l'accueil
        </Link>
      </section>
    </main>
  );
}
