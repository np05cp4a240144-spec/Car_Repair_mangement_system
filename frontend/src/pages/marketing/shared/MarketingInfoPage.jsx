import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import './MarketingInfoPage.css';

const MarketingInfoPage = ({ eyebrow, title, intro, sections = [] }) => {
  const highlights = sections.slice(0, 4).map((section) => section.title);

  return (
    <div className="marketing-info-page">
      <Header />

      <main className="marketing-info-page__main">
        <section className="marketing-info-page__hero">
          <div className="marketing-info-page__container">
            <div className="marketing-info-page__hero-panel">
              <p className="marketing-info-page__eyebrow">{eyebrow}</p>
              <h1 className="marketing-info-page__title">{title}</h1>
              <p className="marketing-info-page__intro">{intro}</p>

              <div className="marketing-info-page__chips">
                {highlights.map((item) => (
                  <span key={item} className="marketing-info-page__chip">{item}</span>
                ))}
              </div>

              <div className="marketing-info-page__actions">
                <Link to="/register" className="marketing-info-page__btn marketing-info-page__btn--primary">Start Free Trial</Link>
                <Link to="/login" className="marketing-info-page__btn marketing-info-page__btn--ghost">Dashboard Login</Link>
              </div>
            </div>
          </div>
        </section>

        <section className="marketing-info-page__content">
          <div className="marketing-info-page__container marketing-info-page__grid">
            {sections.map((section, index) => (
              <article key={section.title} className="marketing-info-page__card">
                <span className="marketing-info-page__card-index">{String(index + 1).padStart(2, '0')}</span>
                <h2 className="marketing-info-page__card-title">{section.title}</h2>
                <p className="marketing-info-page__card-text">{section.text}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default MarketingInfoPage;
