import { useState } from 'react';
import { createStore } from '../utils/auth';
import PinInput from './PinInput';

function AddStorePage({ onBack }) {
  const [formData, setFormData] = useState({
    storeName: '',
    storeCode: '',
    pin: '',
    fullName: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const result = await createStore(
        formData.storeCode,
        formData.storeName,
        formData.pin,
        formData.fullName
      );

      setMessage(`Warung "${result.store.name}" berhasil dibuat! Kode: ${result.store.code}`);
      setFormData({
        storeName: '',
        storeCode: '',
        pin: '',
        fullName: ''
      });
    } catch (err) {
      setError(err.message || 'Gagal membuat warung');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="login-shell">
      <div className="login-card">
        <p className="eyebrow">Buat Warung Baru</p>
        <h1>Tambah Warung</h1>
        <p className="login-card__subtitle">Isi detail warung untuk membuat akun baru secara otomatis.</p>

        <form className="expense-form" onSubmit={handleSubmit}>
          <label className="field-block">
            <span>Nama Warung</span>
            <input
              id="storeName"
              name="storeName"
              type="text"
              required
              value={formData.storeName}
              onChange={handleChange}
              placeholder="Masukkan nama warung"
            />
          </label>

          <label className="field-block">
            <span>Kode Warung</span>
            <input
              id="storeCode"
              name="storeCode"
              type="text"
              required
              value={formData.storeCode}
              onChange={handleChange}
              placeholder="Contoh: WARUNG-IYOY"
            />
          </label>

          <label className="field-block">
            <span>Nama Pemilik</span>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Masukkan nama lengkap"
            />
          </label>

          <label className="field-block">
            <span>PIN (4 digit)</span>
            <PinInput
              value={formData.pin}
              onChange={(pin) => setFormData((prev) => ({ ...prev, pin }))}
            />
          </label>

          {error && <p className="form-error">{error}</p>}
          {message && <p className="login-card__subtitle">{message}</p>}

          <button type="submit" className="save-button" disabled={isLoading}>
            {isLoading ? 'Membuat...' : 'Buat Warung'}
          </button>

          <button type="button" className="back-button" onClick={onBack}>
            Kembali ke Login
          </button>
        </form>
      </div>
    </section>
  );
}

export default AddStorePage;