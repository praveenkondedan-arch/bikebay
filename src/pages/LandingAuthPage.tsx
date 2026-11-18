import React, { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Shield, Wrench } from 'lucide-react';
import { apiRequest } from '../lib/api';
import { formatCurrency } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { SERVICE_PIPELINE, type ServiceType } from '../types';

export function LandingAuthPage() {
  const { login, register } = useAuth();
  const [services, setServices] = useState<ServiceType[]>([]);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [imageError, setImageError] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest<{ services: ServiceType[] }>('/api/services')
      .then((res) => setServices(res.services))
      .catch(() => {});
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!loginEmail.trim() || !loginPassword) {
      setError('Please enter both email and password.');
      return;
    }
    setSubmitting(true);
    try {
      await login(loginEmail.trim(), loginPassword);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (regName.trim().length < 2) {
      setError('Full name must be at least 2 characters.');
      return;
    }
    if (!regEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (regPhone.trim().length < 7) {
      setError('Please enter a valid phone number.');
      return;
    }
    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setSubmitting(true);
    try {
      await register({
        name: regName.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim(),
        password: regPassword,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemoCustomer = () => {
    setAuthMode('login');
    setLoginEmail('arjun@example.com');
    setLoginPassword('Customer@123');
    setError('');
  };

  const fillDemoAdmin = () => {
    setAuthMode('login');
    setLoginEmail('admin@motobay.com');
    setLoginPassword('Admin@123');
    setError('');
  };

  const scrollToPortal = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setError('');
    document.getElementById('portal-auth')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white text-zinc-950 flex flex-col">
      {/* Top Bar Contract: 3 zones */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-8">
          <a
            href="#top"
            className="font-display text-lg font-bold tracking-tight text-zinc-950 whitespace-nowrap shrink-0"
          >
            MotoBay
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-600">
            <a
              href="#services"
              className="hover:text-zinc-950 transition-colors whitespace-nowrap shrink-0"
            >
              Services
            </a>
            <a
              href="#workflow"
              className="hover:text-zinc-950 transition-colors whitespace-nowrap shrink-0"
            >
              Workflow
            </a>
            <a
              href="#portal-auth"
              className="hover:text-zinc-950 transition-colors whitespace-nowrap shrink-0"
            >
              Customer Portal
            </a>
            <a
              href="#portal-auth"
              onClick={(e) => {
                e.preventDefault();
                fillDemoAdmin();
                scrollToPortal('login');
              }}
              className="hover:text-zinc-950 transition-colors whitespace-nowrap shrink-0"
            >
              Admin Access
            </a>
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={() => scrollToPortal('register')}
              className="px-4 py-2 text-xs font-medium text-white bg-zinc-950 rounded-lg hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0"
            >
              Book Service
            </button>
          </div>
        </div>
      </header>

      <main id="top" className="flex-1">
        {/* Hero Split Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-8 py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
              <div className="text-xs font-medium text-zinc-500 flex items-center gap-2">
                <span>Precision Motorcycle Workshop</span>
                <span aria-hidden="true">·</span>
                <span>Live Bay Tracking</span>
                <span aria-hidden="true">·</span>
                <span>Digital Invoicing</span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-zinc-950 leading-[1.1] [text-wrap:balance]">
                Bike maintenance managed with workshop precision.
              </h1>

              <p className="text-base text-zinc-600 leading-relaxed max-w-xl">
                Register your motorcycles, book scheduled maintenance in seconds, track every stage from bay check-in to delivery, and access itemized tax invoices in one clean system.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => scrollToPortal('register')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-zinc-950 rounded-lg hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Create Customer Account</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollToPortal('login')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-zinc-900 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors whitespace-nowrap shrink-0"
                >
                  Sign In to Portal
                </button>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="h-full min-h-[280px] sm:min-h-[360px] rounded-xl border border-zinc-200 bg-zinc-100 overflow-hidden">
                {!imageError ? (
                  <img
                    src="/src/assets/images/workshop_hero_1794986961062.jpg"
                    alt="Matte black sport motorcycle inside MotoBay minimalist service workshop"
                    referrerPolicy="no-referrer"
                    onError={() => setImageError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-zinc-100">
                    <Wrench className="w-10 h-10 text-zinc-400 mb-3" />
                    <p className="font-display text-sm font-semibold text-zinc-700">
                      MotoBay Service Studio
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Certified diagnostics and periodic maintenance bays
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 4-Column Operational Summary Strip */}
        <section className="border-y border-zinc-200 bg-zinc-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="font-mono text-2xl font-bold text-zinc-950 tabular-nums">
                06
              </p>
              <p className="text-xs font-medium text-zinc-600 mt-1">
                Tracked Service Stages
              </p>
            </div>
            <div>
              <p className="font-mono text-2xl font-bold text-zinc-950 tabular-nums">
                {services.length || 5}
              </p>
              <p className="text-xs font-medium text-zinc-600 mt-1">
                Standardized Service Packages
              </p>
            </div>
            <div>
              <p className="font-mono text-2xl font-bold text-zinc-950 tabular-nums">
                100%
              </p>
              <p className="text-xs font-medium text-zinc-600 mt-1">
                Upfront Transparent Pricing
              </p>
            </div>
            <div>
              <p className="font-mono text-2xl font-bold text-zinc-950 tabular-nums">
                24/7
              </p>
              <p className="text-xs font-medium text-zinc-600 mt-1">
                Invoice & History Access
              </p>
            </div>
          </div>
        </section>

        {/* Service Packages Catalog */}
        <section id="services" className="max-w-7xl mx-auto px-4 sm:px-8 py-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-zinc-950">
                Service Catalog & Pricing
              </h2>
              <p className="text-sm text-zinc-600 mt-1">
                Select from transparent workshop packages when booking your appointment.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => (
              <div
                key={service.id}
                className="p-6 bg-white border border-zinc-200 rounded-xl flex flex-col justify-between gap-4 hover:border-zinc-400 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-display text-base font-semibold text-zinc-950">
                      {service.name}
                    </h3>
                    <span className="font-mono text-base font-bold text-zinc-950 tabular-nums shrink-0">
                      {formatCurrency(service.price)}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-600 mt-2 leading-relaxed">
                    {service.description}
                  </p>
                </div>
                <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
                  <span className="font-mono tabular-nums">
                    Est. {service.estimatedHours} hrs
                  </span>
                  <button
                    type="button"
                    onClick={() => scrollToPortal('login')}
                    className="font-medium text-zinc-900 hover:underline"
                  >
                    Book Package →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6-Stage Service Workflow */}
        <section id="workflow" className="border-t border-zinc-200 bg-zinc-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <div className="mb-8">
              <h2 className="font-display text-2xl font-bold tracking-tight text-zinc-950">
                Six-Stage Live Service Tracking
              </h2>
              <p className="text-sm text-zinc-600 mt-1">
                Customers follow real-time progress at every step from slot request to final handover.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {SERVICE_PIPELINE.map((stage, idx) => (
                <div
                  key={stage}
                  className="p-4 bg-white border border-zinc-200 rounded-xl flex flex-col justify-between"
                >
                  <span className="font-mono text-xs text-zinc-400 tabular-nums">
                    0{idx + 1}
                  </span>
                  <p className="font-display text-sm font-semibold text-zinc-950 mt-4">
                    {stage}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Unified Auth Portal */}
        <section id="portal-auth" className="max-w-7xl mx-auto px-4 sm:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5 space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold tracking-tight text-zinc-950">
                  Access Your Service Portal
                </h2>
                <p className="text-sm text-zinc-600 mt-2 leading-relaxed">
                  Sign in as a customer to manage your bikes, book appointments, and download invoices—or sign in with workshop administrator credentials to run daily operations.
                </p>
              </div>

              <div className="p-5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-4">
                <p className="text-xs font-semibold text-zinc-700">
                  Quick Evaluation Accounts
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={fillDemoCustomer}
                    className="p-3 text-left bg-white border border-zinc-200 rounded-lg hover:border-zinc-900 transition-colors"
                  >
                    <p className="text-xs font-semibold text-zinc-950">
                      Customer Demo
                    </p>
                    <p className="font-mono text-[11px] text-zinc-500 mt-1 truncate">
                      arjun@example.com
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={fillDemoAdmin}
                    className="p-3 text-left bg-white border border-zinc-200 rounded-lg hover:border-zinc-900 transition-colors"
                  >
                    <p className="text-xs font-semibold text-zinc-950 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" />
                      Admin Demo
                    </p>
                    <p className="font-mono text-[11px] text-zinc-500 mt-1 truncate">
                      admin@motobay.com
                    </p>
                  </button>
                </div>
              </div>

              <ul className="space-y-2.5 text-sm text-zinc-600">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-zinc-900 shrink-0" />
                  <span>JWT session tokens with bcrypt password protection</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-zinc-900 shrink-0" />
                  <span>Dedicated protected views for Customers and Admins</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-zinc-900 shrink-0" />
                  <span>Instant itemized PDF/print invoice generation</span>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-7">
              <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-8 max-w-xl lg:ml-auto">
                {/* Segmented Control */}
                <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-100 rounded-lg mb-6">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setError('');
                    }}
                    className={`py-2 text-xs font-semibold rounded-md transition-colors ${
                      authMode === 'login'
                        ? 'bg-white text-zinc-950 shadow-sm'
                        : 'text-zinc-600 hover:text-zinc-950'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('register');
                      setError('');
                    }}
                    className={`py-2 text-xs font-semibold rounded-md transition-colors ${
                      authMode === 'register'
                        ? 'bg-white text-zinc-950 shadow-sm'
                        : 'text-zinc-600 hover:text-zinc-950'
                    }`}
                  >
                    Customer Registration
                  </button>
                </div>

                {error && (
                  <div className="mb-5 p-3 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg">
                    {error}
                  </div>
                )}

                {authMode === 'login' ? (
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-950"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                        Password
                      </label>
                      <input
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-950"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-2.5 px-4 text-sm font-medium text-white bg-zinc-950 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50"
                    >
                      {submitting ? 'Signing in...' : 'Sign In'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleRegisterSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Arjun Kapoor"
                        className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-950"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-950"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-950"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                        Password (min. 6 characters)
                      </label>
                      <input
                        type="password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Create a secure password"
                        className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-950"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-2.5 px-4 text-sm font-medium text-white bg-zinc-950 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50"
                    >
                      {submitting ? 'Creating Account...' : 'Create Customer Account'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <span>MotoBay Service Center Management System</span>
          <span>Plot 42, Industrial Estate · Support: +91 80 4120 9900</span>
        </div>
      </footer>
    </div>
  );
}
