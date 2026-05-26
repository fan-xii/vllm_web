import { useState } from 'react';
import type { ApiConfig, Theme } from '../types';

interface Props {
  config: ApiConfig;
  onSave: (config: ApiConfig) => void;
  onClose: () => void;
}

const THEMES: { id: Theme; label: string; colors: string[] }[] = [
  { id: 'dark', label: 'Dark', colors: ['#212121', '#171717', '#10a37f'] },
  { id: 'light', label: 'Light', colors: ['#ffffff', '#f7f7f8', '#10a37f'] },
  { id: 'midnight', label: 'Midnight', colors: ['#0d1117', '#010409', '#58a6ff'] },
  { id: 'dracula', label: 'Dracula', colors: ['#282a36', '#21222c', '#50fa7b'] },
];

export default function SettingsModal({ config, onSave, onClose }: Props) {
  const [form, setForm] = useState({ ...config });

  const update = (key: keyof ApiConfig, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(form);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Settings</h2>
          <button className="icon-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Theme</label>
            <div className="theme-grid">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  className={`theme-swatch ${form.theme === t.id ? 'active' : ''}`}
                  onClick={() => update('theme', t.id)}
                >
                  <div className="theme-preview">
                    <div style={{ background: t.colors[0] }} />
                    <div style={{ background: t.colors[1] }} />
                    <div style={{ background: t.colors[2] }} />
                  </div>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Base URL</label>
            <input
              type="text"
              value={form.baseUrl}
              onChange={(e) => update('baseUrl', e.target.value)}
              placeholder="http://localhost:8000/v1"
            />
          </div>

          <div className="form-group">
            <label>Model</label>
            <input
              type="text"
              value={form.model}
              onChange={(e) => update('model', e.target.value)}
              placeholder="model name"
            />
          </div>

          <div className="form-group">
            <label>API Key</label>
            <input
              type="text"
              value={form.apiKey}
              onChange={(e) => update('apiKey', e.target.value)}
              placeholder="EMPTY"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Temperature: {form.temperature}</label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={form.temperature}
                onChange={(e) => update('temperature', parseFloat(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label>Max Tokens</label>
              <input
                type="number"
                value={form.maxTokens}
                onChange={(e) => update('maxTokens', parseInt(e.target.value) || 4096)}
                min="1"
                max="32768"
              />
            </div>
          </div>

          <div className="form-group">
            <label>System Prompt</label>
            <textarea
              value={form.systemPrompt}
              onChange={(e) => update('systemPrompt', e.target.value)}
              rows={3}
              placeholder="You are a helpful assistant."
            />
          </div>

        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
