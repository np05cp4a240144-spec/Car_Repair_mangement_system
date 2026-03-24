import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User as UserIcon, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Register.css';

const Register = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);
        setError('');

        const result = await register(formData.fullName, formData.email, formData.password);

        setIsLoading(false);
        if (result.success) {
            navigate('/login');
        } else {
            setError(result.message);
        }
    };



    return (
        <div className="register-page">
            {/* Left Panel: Simple & Clean */}
            <div className="register-page__left">
                <div className="register-page__blob register-page__blob--top"></div>
                <div className="register-page__blob register-page__blob--bottom"></div>

                <div className="register-page__left-inner">
                    <div className="register-page__eyebrow">Join 2,400+ Garages</div>
                    <h1 className="register-page__title">
                        Start running your shop <span className="register-page__title-accent">smarter</span> today.
                    </h1>
                    <p className="register-page__intro">
                        Set up your Auto Assist account in under 3 minutes. No credit card needed for your 14-day free trial.
                    </p>
                </div>
            </div>

            {/* Right Panel: Form */}
            <div className="register-page__right">
                <div className="register-page__form-wrap">
                    <div className="register-page__header">
                        <h2 className="register-page__heading">Create account</h2>
                        <p className="register-page__subtext">
                            Already have one? <Link to="/login" className="register-page__inline-link">Sign in &rarr;</Link>
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="register-page__form">
                        {error && (
                            <div className="register-page__error">
                                {error}
                            </div>
                        )}


                        <div>
                            <label className="register-page__label register-page__label--caps">Full Name</label>
                            <div className="register-page__input-wrap">
                                <span className="register-page__input-icon">
                                    <UserIcon size={18} />
                                </span>
                                <input
                                    type="text"
                                    name="fullName"
                                    required
                                    placeholder="John Doe"
                                    className="register-page__input"
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="register-page__label">Email Address</label>
                            <div className="register-page__input-wrap">
                                <span className="register-page__input-icon">
                                    <Mail size={18} />
                                </span>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    placeholder="you@example.com"
                                    className="register-page__input"
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="register-page__label">Password</label>
                            <div className="register-page__input-wrap">
                                <span className="register-page__input-icon">
                                    <Lock size={18} />
                                </span>
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    placeholder="••••••••"
                                    className="register-page__input"
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="register-page__label">Confirm Password</label>
                            <div className="register-page__input-wrap">
                                <span className="register-page__input-icon">
                                    <Lock size={18} />
                                </span>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    required
                                    placeholder="••••••••"
                                    className="register-page__input"
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="register-page__submit-wrap">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="register-page__submit-btn"
                            >
                                {isLoading ? (
                                    <div className="register-page__spinner"></div>
                                ) : (
                                    'Create Account'
                                )}
                            </button>
                        </div>

                        <p className="register__legal-copy">
                            By creating an account, you agree to our <Link to="/register" className="register-page__legal-link">Terms of Service</Link> and <Link to="/register" className="register-page__legal-link">Privacy Policy</Link>.
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Register;

