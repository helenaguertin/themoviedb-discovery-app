import { Link } from 'react-router';
import './AboutPage.css';

const foundations = [
  { name: 'TypeScript', description: 'Typage et fiabilité' },
  { name: 'React', description: 'Interface composable' },
  { name: 'Node.js + Express', description: 'API légère' },
  { name: 'Vite', description: 'Développement rapide' },
];

export default function AboutPage() {
  return (
    <main className="page-shell about-page">
      <article className="about-card">
        <header className="about-hero">
          <p className="about-eyebrow">TMDB Discovery</p>
          <h1>À propos de l’application</h1>
          <p className="about-intro">
            Une application de découverte de films, pensée comme une expérience
            web claire, rapide et maintenable.
          </p>
        </header>

        <section className="about-section">
          <div className="about-section__heading">
            <p className="about-eyebrow">Le projet</p>
            <h2>Découvrir, comparer, choisir</h2>
          </div>
          <p className="about-section__copy">
            Cette application utilise l’API de{' '}
            <strong>The Movie Database</strong> pour rendre les films populaires
            faciles à explorer. Elle démontre la construction d’une application
            complète, du front-end à l’API.
          </p>
        </section>

        <section className="about-section">
          <div className="about-section__heading">
            <p className="about-eyebrow">Fondations techniques</p>
            <h2>Une stack volontairement simple</h2>
          </div>
          <ul className="about-foundations">
            {foundations.map((foundation) => (
              <li className="about-foundation" key={foundation.name}>
                <h3>{foundation.name}</h3>
                <p>{foundation.description}</p>
              </li>
            ))}
          </ul>
        </section>

        <footer className="about-source">
          <div>
            <p className="about-eyebrow">Code source</p>
            <h2>Voir la réalisation du projet</h2>
          </div>
          <a
            className="about-source__link"
            href="https://github.com/helenaguertin/themoviedb-discovery-app"
            target="_blank"
            rel="noreferrer"
          >
            Ouvrir le dépôt GitHub
          </a>
        </footer>

        <nav className="about-navigation" aria-label="Navigation">
          <Link to="/movies">Découvrir les films populaires</Link>
        </nav>
      </article>
    </main>
  );
}
