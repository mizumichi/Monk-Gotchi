'use client';

import { useState } from 'react';
import { validateNickname } from '@/lib/nicknameValidation';

const FONT = "'M PLUS Rounded 1c', 'Noto Sans JP', system-ui, sans-serif";
const MAX_LEN = 16;

interface Props {
  onSave: (nickname: string, isPublic: boolean) => Promise<void>;
}

export default function NicknameModal({ onSave }: Props) {
  const [nickname, setNickname] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);

  const error = validateNickname(nickname);
  const canSave = !error;

  async function handleSave() {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await onSave(nickname, isPublic);
    } finally {
      setSaving(false);
    }
  }

  const inputBorder = error ? '1.5px solid #C75B4A' : '1.5px solid #CFE0AE';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 80,
      background: 'rgba(50,38,18,.55)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: FONT,
    }}>
      <div style={{
        width: '100%',
        maxWidth: '320px',
        background: '#F7F0E1',
        borderRadius: '24px',
        padding: '24px 22px 26px',
        boxShadow: '0 20px 60px rgba(50,35,15,.4)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0',
      }}>
        <div style={{ fontSize: '36px', textAlign: 'center', marginBottom: '10px' }}>👥</div>
        <h2 style={{ margin: '0 0 6px', fontWeight: 800, fontSize: '16px', color: '#6E4A2A', textAlign: 'center' }}>
          ニックネームを設定
        </h2>
        <p style={{ margin: '0 0 18px', fontSize: '11.5px', color: '#A8987F', textAlign: 'center', lineHeight: 1.6 }}>
          フレンド画面に表示される名前です
        </p>

        {/* 入力欄 */}
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
              fontSize: '14px',
              fontWeight: 700,
              color: '#4A3A2A',
              background: '#FBF6EC',
              border: inputBorder,
              borderRadius: '12px',
              padding: '11px 44px 11px 14px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <span style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '10.5px',
            color: nickname.length >= MAX_LEN ? '#C75B4A' : '#B6A485',
            fontWeight: 700,
            pointerEvents: 'none',
          }}>
            {nickname.length}/{MAX_LEN}
          </span>
        </div>

        {/* バリデーションエラー */}
        {error && (
          <p style={{ margin: '0 0 10px', fontSize: '11px', color: '#C75B4A', fontWeight: 700 }}>
            ⚠ {error}
          </p>
        )}

        {/* 注意書き */}
        <div style={{
          background: 'rgba(214,163,62,.1)',
          border: '1px solid rgba(214,163,62,.3)',
          borderRadius: '10px',
          padding: '10px 12px',
          marginBottom: '16px',
          marginTop: error ? '0' : '6px',
        }}>
          <p style={{ margin: 0, fontSize: '11px', color: '#7A6A53', lineHeight: 1.6 }}>
            ニックネームはこのアプリに参加している<strong>全員に公開</strong>されます。本名や個人情報は入れないでください。
          </p>
        </div>

        {/* 公開トグル */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          padding: '0 2px',
        }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#5C5040' }}>ステータスを公開する</span>
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

        {/* 保存ボタン */}
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          style={{
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: '14px',
            color: '#fff',
            background: canSave ? '#5A9E2E' : '#C0B8A8',
            border: 'none',
            borderRadius: '14px',
            padding: '13px 0',
            cursor: canSave ? 'pointer' : 'not-allowed',
            boxShadow: canSave ? '0 4px 12px rgba(90,158,46,.35)' : 'none',
            width: '100%',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {nickname.trim() ? `「${nickname.trim()}」で始める` : '「ぬる」で始める'}
        </button>
      </div>
    </div>
  );
}
