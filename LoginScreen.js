'use client';

import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function LoginScreen({ onLoginSuccess }) {
  const [email, setEmail] = useState('sezer.secginli@gmail.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      // Supabase Authentication servisine giriş isteği gönder
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        // Supabase tarafında kullanıcı yoksa, e-posta doğrulanmadıysa veya şifre yanlışsa hata döner
        setErrorMessage(
          'E-posta veya şifre hatalı. Supabase Authentication panelinde kullanıcının tanımlı olduğundan emin olun.'
        );
        console.error('Supabase Auth hatası:', error.message);
        return;
      }

      if (data?.session) {
        // Giriş başarılı, ana bileşene veya state'e bildir
        if (onLoginSuccess) {
          onLoginSuccess(data.user, data.session);
        } else {
          window.location.reload();
        }
      }
    } catch (err) {
      console.error('Giriş yapılırken beklenmeyen bir hata oluştu:', err);
      setErrorMessage('Bağlantı hatası oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col justify-center items-center p-4">
      {/* Üst Logo ve Başlık */}
      <div className="flex items-center space-x-3 mb-8">
        <div className="bg-orange-600 p-2.5 rounded-lg text-white">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 0h4"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-wide">
          Şantiye Yönetim Sistemi
        </h1>
      </div>

      {/* Kart Kutusu */}
      <div className="bg-[#131b2e] border border-gray-800 rounded-xl p-8 w-full max-w-md shadow-2xl">
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            60 Dairelik Konut Projesi
          </p>
          <h2 className="text-2xl font-bold text-white">Hesabınızla giriş yapın</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* E-posta Alanı */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              E-posta
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@sirket.com"
              className="w-full px-4 py-2.5 bg-slate-100 text-gray-900 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none font-medium"
            />
          </div>

          {/* Şifre Alanı */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Şifre
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-[#0b0f19] border border-orange-500/80 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          {/* Hata Mesajı */}
          {errorMessage && (
            <div className="text-xs text-red-400 bg-red-950/40 border border-red-900/50 p-3 rounded-lg leading-relaxed">
              {errorMessage}
            </div>
          )}

          {/* Giriş Butonu */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-semibold rounded-lg transition duration-200 shadow-lg shadow-orange-600/20"
          >
            {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
      </div>

      {/* Alt Bilgilendirme */}
      <p className="mt-8 text-xs text-center text-gray-500 max-w-sm leading-relaxed">
        Hesabınız yok mu? Yöneticinizden Supabase Authentication panelinden sizin için bir kullanıcı oluşturmasını isteyin.
      </p>
    </div>
  );
}