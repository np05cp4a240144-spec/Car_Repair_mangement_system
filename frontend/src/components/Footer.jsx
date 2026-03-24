import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = ({ className = '' }) => {
    const footerClass = `site-footer ${className}`.trim();

    return (
        <footer className={footerClass}>
            <div className="site-footer__container">
                <div className="site-footer__grid">
                    <div className="site-footer__brand-col">
                        <Link to="/" className="site-footer__brand">
                            <span className="site-footer__brand-dot"></span>
                            Auto Assist
                        </Link>
                        <p className="site-footer__about">
                            The complete garage management platform for modern auto service businesses. Built by people who understand the shop floor.
                        </p>
                        <div className="site-footer__pill-row">
                            <span className="site-footer__pill">Appointments</span>
                            <span className="site-footer__pill">Inventory</span>
                            <span className="site-footer__pill">Payments</span>
                            <span className="site-footer__pill">Support Chat</span>
                        </div>
                    </div>

                    <div>
                        <h4 className="site-footer__section-title">Product</h4>
                        <div className="site-footer__list">
                            <Link to="/features" className="site-footer__link">Features</Link>
                            <Link to="/roles" className="site-footer__link">Who It Is For</Link>
                            <Link to="/register" className="site-footer__link">Get Started</Link>
                            <Link to="/login" className="site-footer__link">Dashboard Login</Link>
                        </div>
                    </div>

                    <div>
                        <h4 className="site-footer__section-title">Company</h4>
                        <div className="site-footer__list">
                            <Link to="/about" className="site-footer__link">About Auto Assist</Link>
                            <Link to="/stories" className="site-footer__link">Customer Stories</Link>
                            <Link to="/release-notes" className="site-footer__link">Release Notes</Link>
                            <Link to="/help-center" className="site-footer__link">Help Center</Link>
                        </div>
                    </div>

                    <div>
                        <h4 className="site-footer__section-title">Contact</h4>
                        <div className="site-footer__list">
                            <a href="mailto:support@autoassist.com" className="site-footer__link">support@autoassist.com</a>
                            <a href="tel:+9779800000000" className="site-footer__link">+977 9800000000</a>
                            <span className="site-footer__link site-footer__link--muted">Mon - Sat, 8:00 AM to 7:00 PM</span>
                        </div>
                    </div>
                </div>

                <div className="site-footer__bottom">
                    <p>© 2026 Auto Assist. All rights reserved.</p>
                    <p>Made with care for garages everywhere.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
