import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Calendar, Shield, MessageSquare, Sparkles } from 'lucide-react';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import './LandingPage.css';

const LandingPage = () => {
    const chartRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const chartEl = chartRef.current;
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('landing-chart--visible');
                    }
                });
            },
            { threshold: 0.3 }
        );

        if (chartEl) observer.observe(chartEl);
        return () => {
            if (chartEl) observer.unobserve(chartEl);
        };
    }, []);

    const primaryPages = [
        { icon: <Calendar size={24} />, title: 'Features', desc: 'Modules, workflows, and capabilities.', path: '/features' },
        { icon: <Shield size={24} />, title: 'Who It Is For', desc: 'Admin, mechanic, and customer roles.', path: '/roles' },
        { icon: <Sparkles size={24} />, title: 'About Auto Assist', desc: 'Mission and product direction.', path: '/about' },
        { icon: <MessageSquare size={24} />, title: 'Help Center', desc: 'Support process and assistance.', path: '/help-center' }
    ];

    const secondaryPages = [
        { title: 'Customer Stories', desc: 'Read real usage examples from service shops.', path: '/stories' },
        { title: 'Release Notes', desc: 'See recent improvements and changes.', path: '/release-notes' }
    ];

    return (
        <div className="landing-page">
            <Header />

            <main className="landing-page__main">
                <section className="landing-hero" id="top">
                    <div className="landing-hero__radial"></div>
                    <div className="landing-hero__grid"></div>

                    <div className="landing-hero__content">
                        <div className="landing-hero__badge">
                            <span className="landing-hero__badge-dot"></span>
                            Auto Assist Platform
                        </div>

                        <h1 className="landing-hero__title">
                            Garage Operations,<br />
                            <em>Made Clear and Fast.</em>
                        </h1>

                        <p className="landing-hero__desc">
                            The landing page is now concise. Use dedicated pages for features, roles, company details, updates, and support.
                        </p>

                        <div className="landing-hero__cta-row">
                            <button onClick={() => navigate('/register')} className="landing-btn landing-btn--primary">
                                Get Started Free
                            </button>
                            <button onClick={() => navigate('/features')} className="landing-btn landing-btn--outline">
                                Explore Features <ArrowRight size={20} />
                            </button>
                        </div>

                        <div className="landing-hero__stats">
                            {[
                                { num: '6', label: 'Dedicated Info Pages' },
                                { num: '3', label: 'Role Dashboards' },
                                { num: '1', label: 'Connected Platform' },
                                { num: '24/7', label: 'Always Accessible' }
                            ].map((stat) => (
                                <div key={stat.label} className="landing-stat">
                                    <div className="landing-stat__num">{stat.num}</div>
                                    <div className="landing-stat__label">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="landing-section landing-section--muted landing-section--wide">
                    <div className="landing-container">
                        <div className="landing-section__head">
                            <div className="landing-section__eyebrow">Quick Navigation</div>
                            <h2 className="landing-section__title">Choose what you want to read.</h2>
                            <p className="landing-section__subtitle">Instead of one long page, each topic now has its own dedicated page.</p>
                            <p className="landing-section__mini">Clean structure, clear pages, faster navigation.</p>
                        </div>

                        <div className="landing-page-link-grid">
                            {primaryPages.map((item) => (
                                <button
                                    key={item.title}
                                    type="button"
                                    className="landing-page-link-card"
                                    onClick={() => navigate(item.path)}
                                >
                                    <div className="landing-page-link-card__icon">{item.icon}</div>
                                    <h3 className="landing-page-link-card__title">{item.title}</h3>
                                    <p className="landing-page-link-card__desc">{item.desc}</p>
                                    <span className="landing-page-link-card__cta">Open page <ArrowRight size={16} /></span>
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="landing-section landing-section--muted">
                    <div className="landing-container landing-container--preview">
                        <div className="landing-section__head">
                            <div className="landing-section__eyebrow">Platform Preview</div>
                            <h2 className="landing-section__title">A dashboard that makes sense.</h2>
                        </div>

                        <div className="landing-preview" ref={chartRef}>
                            <div className="landing-preview__topbar">
                                <div className="landing-preview__dots">
                                    <div className="landing-preview__dot landing-preview__dot--red"></div>
                                    <div className="landing-preview__dot landing-preview__dot--yellow"></div>
                                    <div className="landing-preview__dot landing-preview__dot--green"></div>
                                </div>
                                <span className="landing-preview__title">Auto Assist Admin - Dashboard</span>
                            </div>

                            <div className="landing-preview__body">
                                <div className="landing-preview__sidebar">
                                    {['Overview', 'Appointments', 'Repairs', 'Inventory', 'Customers', 'Payments', 'Messages'].map((item, i) => (
                                        <div key={item} className={`landing-preview__nav-item ${i === 0 ? 'landing-preview__nav-item--active' : ''}`}>
                                            {item}
                                        </div>
                                    ))}
                                </div>

                                <div className="landing-preview__content">
                                    <div className="landing-preview__meta-row">
                                        <span>Monday, March 02</span>
                                        <span className="landing-preview__meta-status">
                                            <span className="landing-preview__meta-dot"></span>
                                            All systems operational
                                        </span>
                                    </div>

                                    <div className="landing-preview__kpi-grid">
                                        {[
                                            { label: "Today's Jobs", val: '14', change: 'up 3 from yesterday', warning: false },
                                            { label: 'Revenue', val: '$3,840', change: 'up 12% this week', warning: false },
                                            { label: 'Pending', val: '5', change: '2 awaiting parts', warning: true },
                                            { label: 'Completed', val: '9', change: 'up 64% rate today', warning: false }
                                        ].map((stat) => (
                                            <div key={stat.label} className="landing-preview__kpi-card">
                                                <div className="landing-preview__kpi-label">{stat.label}</div>
                                                <div className="landing-preview__kpi-value">{stat.val}</div>
                                                <div className={`landing-preview__kpi-change ${stat.warning ? 'landing-preview__kpi-change--warn' : 'landing-preview__kpi-change--ok'}`}>
                                                    {stat.change}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="landing-preview__chart-card">
                                        <div className="landing-preview__chart-title">Weekly Revenue - Last 8 Weeks</div>
                                        <div className="landing-preview__chart-bars">
                                            {[45, 60, 40, 75, 55, 85, 65, 95].map((h, i) => (
                                                <div
                                                    key={h + i}
                                                    className={`landing-chart__bar landing-chart__bar--${h} ${i === 7 ? 'landing-chart__bar--highlight' : 'landing-chart__bar--normal'}`}
                                                ></div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="landing-section landing-section--wide">
                    <div className="landing-container">
                        <div className="landing-section__head">
                            <div className="landing-section__eyebrow">More Information</div>
                            <h2 className="landing-section__title">Company and update pages</h2>
                        </div>

                        <div className="landing-page-link-grid landing-page-link-grid--two">
                            {secondaryPages.map((item) => (
                                <button
                                    key={item.title}
                                    type="button"
                                    className="landing-page-link-card"
                                    onClick={() => navigate(item.path)}
                                >
                                    <h3 className="landing-page-link-card__title">{item.title}</h3>
                                    <p className="landing-page-link-card__desc">{item.desc}</p>
                                    <span className="landing-page-link-card__cta">Open page <ArrowRight size={16} /></span>
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="landing-cta">
                    <div className="landing-cta__radial"></div>
                    <div className="landing-cta__content">
                        <h2 className="landing-cta__title">Ready to modernize<br />your garage?</h2>
                        <p className="landing-cta__text">Start with a focused system and navigate details page by page.</p>
                        <div className="landing-cta__actions">
                            <button onClick={() => navigate('/register')} className="landing-btn landing-btn--primary landing-btn--cta">
                                Start Your Free Trial
                            </button>
                            <button onClick={() => navigate('/login')} className="landing-btn landing-btn--dark">
                                Dashboard Login
                            </button>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default LandingPage;