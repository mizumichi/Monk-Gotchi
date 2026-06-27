'use client';

import { useEffect, useState } from 'react';
import { validateNickname } from '@/lib/nicknameValidation';

const FONT = "'M PLUS Rounded 1c', 'Noto Sans JP', system-ui, sans-serif";
const MAX_LEN = 16;

interface Props {
  initialNickname: string;
  initialIsPublic: boolean;
  onSave: (nickname: string, isPublic: boolean) => Promise<void>;
  onClose: () => void;
}

export default function FriendsSettingsPanel({ initialNickname, initialIsPublic, onSave, onClose }: Props) {
  const [nickname, setNickname] = useState(initialNickname);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNickname(initialNickname);
    setIsPublic(initialIsPublic);
  }, [initialNickname, initialIsPublic]);

  const error = validateNickname(nickname);
  const canSave = !error;

  async function handleSave() {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await onSave(nickname, isPublic);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const inputBorder = error ? '1.5px solid #C75B4A' : '1.5px solid #CFE0AE';

  return (
    <div style={{
      background: '#F7F2E5',
      border: '1px solid #E0D8C4',
      borderRadius: '20px',
      padding: '16px 18px 18px',
      margin: '0 0 10px',
      boxShadow: '0 4px 14px rgba(90,70,35,.08)',
      fontFamily: FONT,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <span style={{ fontWeight: 800, fontSize: '13.5px', color: '#6E4A2A' }}>⚙️ 設定</span>
        <button
          onClick={onClose}
          style={{
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            border: 'none',
            background: '#EAE0CC',
            color: '#7A6A53',
            fontSize: '12px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: FONT,
          }}
        >
          ✕
        </button>
      </div>

      {/* ニックネーム */}
      <p style={{ margin: '0 0 6px', fontSize: '11.5px', fontWeight: 700, color: '#7A6A53' }}>ニックネーム</p>
      <div style={{ position: 'relative', marginBottom: '6px' }}>
        <input
          type="text"
          value={nickname}
          onChange={e => setNickname(e.target.value.slice(0, MAX_LEN))}
          placeholder="ぬる（空欄の場合）"
          maxLength={MAX_LEN}
          style={{
            width: '100%',
            fontFamily: FONT,
            fontSize: '13.5px',
            fontWeight: 700,
            color: '#4A3A2A',
            background: '#FBF6EC',
            border: inputBorder,
            borderRadius: '10px',
            padding: '9px 44px 9px 12px',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <span style={{
          position: 'absolute',
          right: '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: '10px',
          color: nickname.length >= MAX_LEN ? '#C75B4A' : '#B6A485',
          fontWeight: 700,
          pointerEvents: 'none',
        }}>
          {nickname.length}/{MAX_LEN}
        </span>
      </div>
      {error && (
        <p style={{ margin: '0 0 10px', fontSize: '11px', color: '#C75B4A', fontWeight: 700 }}>
          ⚠ {error}
        </p>
      )}

      {/* 公開トグル */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        margin: '12px 0 14px',
      }}>
        <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#5C5040' }}>ステータスを公開する</span>
        <button
          onClick={() => setIsPublic(v => !v)}
          style={{
            width: '44px',
            height: '24px',
            borderRadius: '999px',
            border: 'none',
            background: isPublic ? '#5A9E2E' : '#D0C8B8',
            cursor: 'pointer',
            position: 'relative',
            transition: 'background .2s',
            flexShrink: 0,
          }}
        >
          <span style={{
            position: 'absolute',
            top: '3px',
            left: isPublic ? '22px' : '3px',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 1px 4px rgba(0,0,0,.2)',
            transition: 'left .2s',
          }} />
        </button>
      </div>

      <button
        onClick={handleSave}
        disabled={!canSave || saving}
        style={{
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: '13px',
          color: '#fff',
          background: canSave ? '#5A9E2E' : '#C0B8A8',
          border: 'none',
          borderRadius: '12px',
          padding: '11px 0',
          cursor: canSave ? 'pointer' : 'not-allowed',
          boxShadow: canSave ? '0 4px 12px rgba(90,158,46,.3)' : 'none',
          width: '100%',
          opacity: saving ? 0.7 : 1,
        }}
      >
        {saving ? '保存中...' : '保存する'}
      </button>
    </div>
  );
}
