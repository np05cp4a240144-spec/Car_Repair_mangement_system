import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = () => {
    return (
        <nav className="site-header">
            <div className="site-header__container">
                <Link to="/" className="site-header__brand">
                    <span className="site-header__brand-dot"></span>
                    Auto Assist
                </Link>

                <ul className="site-header__nav-links">
                    <li><Link to="/features" className="site-header__nav-link">Features</Link></li>
                    <li><Link to="/roles" className="site-header__nav-link">Who It's For</Link></li>
                </ul>

                <div className="site-header__actions">
                    <Link to="/login" className="site-header__signin-btn">
                        Sign In
                    </Link>
                    <Link to="/register" className="site-header__trial-btn">
                        Start Free Trial
                    </Link>
                </div>
            </div>
        </nav>
    );
};

export default Header;
