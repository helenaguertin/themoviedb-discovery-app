import { Link } from 'react-router';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__content">
        <Link className="site-footer__brand" to="/movies">
          TMDB Discovery
        </Link>
        <p className="site-footer__copyright">
          © {new Date().getFullYear()} TMDB Discovery
        </p>
        <div className="site-footer__links">
          <a
            href="https://www.themoviedb.org/"
            target="_blank"
            rel="noreferrer"
          >
            The Movie Database
          </a>
          <a
            href="https://github.com/helenaguertin/themoviedb-discovery-app"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </div>
        <span className="site-footer__version">Version {__APP_VERSION__}</span>
      </div>
    </footer>
  );
}
