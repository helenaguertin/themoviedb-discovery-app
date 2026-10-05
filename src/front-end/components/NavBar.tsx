import { NavLink } from 'react-router';
import './NavBar.css';

export default function NavBar() {
  return (
    <header className="site-nav">
      <div className="site-nav__inner">
        <NavLink className="site-nav__brand" to="/movies">
          TMDB Discovery
        </NavLink>
        <nav className="site-nav__links" aria-label="Navigation principale">
          <NavLink
            className={({ isActive }) =>
              `site-nav__link${isActive ? ' site-nav__link--active' : ''}`
            }
            to="/movies"
          >
            Films populaires
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              `site-nav__link${isActive ? ' site-nav__link--active' : ''}`
            }
            to="/about"
          >
            À propos
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
