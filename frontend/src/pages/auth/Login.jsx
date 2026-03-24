import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Calendar, BarChart3, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const result = await login(formData.email, formData.password);

        setIsLoading(false);
        if (result.success) {
            const role = result.user?.role;
            if (role === 'ADMIN') {
                navigate('/admin');
            } else if (role === 'MECHANIC') {
                navigate('/mechanic');
            } else if (role === 'USER') {
                navigate('/customer');
            } else {
                navigate('/');
            }
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="login-page">
            {/* Left Panel: Info & Branding */}
            <div className="login-page__left">
                <div className="login-page__left-inner">
                    <div className="login-page__eyebrow">Garage Management Platform</div>
                    <h1 className="login-page__title">
                        Login to your <span className="login__brand-accent"> <br /> Auto Assist account</span>
                    </h1>
                    <p className="login__intro-copy">
                        Sign in to manage appointments, track repairs, handle payments, and more. If you have any issues please contact support.
                    </p>

                    <div className="login-page__feature-list">
                        {[
                            { icon: <Calendar size={18} />, title: 'Calendar', desc: 'See today\'s schedule' },
                            { icon: <BarChart3 size={18} />, title: 'Analytics', desc: 'Revenue & efficiency data' },
                            { icon: <MessageSquare size={18} />, title: 'Chat', desc: 'Message your customers' }
                        ].map((item, idx) => (
                            <div key={idx} className="login-page__feature-item">
                                <div className="login-page__feature-icon">
                                    {item.icon}
                                </div>
                                <div>
                                    <h4 className="login-page__feature-title">{item.title}</h4>
                                    <p className="login-page__feature-desc">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Panel: Login Form */}
            <div className="login-page__right" id="right-section">
                <div className="w-full login__form-wrap">
                    <div className="login-page__header">
                        <h2 className="login-page__heading">Sign in here</h2>
                        <p className="login-page__subtext">
                            New here? <Link to="/register" className="login-page__inline-link">Create a free account!</Link>
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="login-page__form">
                        {error && (
                            <div className="login-page__error">
                                Error: {error}
                            </div>
                        )}
                        <div>
                            <label className="login-page__label">Email Address</label>
                            <div className="login-page__input-wrap">
                                <span className="login-page__input-icon">
                                    <Mail size={16} />
                                </span>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    placeholder="john.doe@example.com"
                                    className="login-page__input"
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="login-page__password-row">
                                <label className="login-page__label">Password</label>
                                <Link to="/register" className="login-page__forgot-link">Forgot password ?</Link>
                            </div>
                            <div className="login-page__input-wrap">
                                <span className="login-page__input-icon">
                                    <Lock size={16} />
                                </span>
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    placeholder="Password"
                                    className="login-page__input"
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="login-page__remember-row">
                            <input
                                type="checkbox"
                                id="rememberMe"
                                name="rememberMe"
                                className="login-page__checkbox"
                                onChange={handleChange}
                            />
                            <label htmlFor="rememberMe" className="login-page__remember-label">
                                Remember me ?
                            </label>
                        </div>

                        <div className="login-page__submit-wrap">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="login-page__submit-btn login__submit-btn-text"
                            >
                                {isLoading ? (
                                    <div className="login-page__spinner"></div>
                                ) : (
                                    <>Sign In <ArrowRight size={16} /></>
                                )}
                            </button>
                        </div>

                        <p className="login-page__copyright">
                            Copyright Auto Assist (Student Project) 2026. All rights reserved.
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;

