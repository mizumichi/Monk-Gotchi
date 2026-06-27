'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useFriends } from '@/hooks/useFriends';
import FriendCard from '@/components/friends/FriendCard';
import NicknameModal from '@/components/friends/NicknameModal';
import FriendsSettingsPanel from '@/components/friends/FriendsSettingsPanel';

const FONT = "'M PLUS Rounded 1c', 'Noto Sans JP', system-ui, sans-serif";

export default function FriendsPage() {
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);
  const router = useRouter();
  const isAuthenticated = authStatus === 'authenticated';

  const { friends, myUser, isLoading, saveSettings } = useFriends(isAuthenticated);

  const [showModal, setShowModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [modalChecked, setModalChecked] = useState(false);

  useEffect(() => {
    if (authStatus === 'unauthenticated') router.replace('/login');
  }, [authStatus, router]);

  // 初回アクセス判定: ロード完了後にhasSeenFriendsIntroを確認
  useEffect(() => {
    if (isLoading || modalChecked) return;
    setModalChecked(true);
    if (myUser === null || myUser.hasSeenFriendsIntro === false || myUser.hasSeenFriendsIntro === null || myUser.hasSeenFriendsIntro === undefined) {
      setShowModal(true);
    }
  }, [isLoading, myUser, modalChecked]);

  async function handleModalSave(nickname: string, isPublic: boolean) {
    await saveSettings(nickname, isPublic, true);
    setShowModal(false);
  }

  async function handleSettingsSave(nickname: string, isPublic: boolean) {
    await saveSettings(nickname, isPublic, false);
    setShowSettings(false);
  }

  const myNickname = myUser?.nickname?.trim() || 'ぬる';
  const myIsPublic = myUser?.isStatusPublic ?? true;

  return (
    <div style={{ minHeight: '100vh', background: '#E7DECB', fontFamily: FONT }}>
      <div style={{
        width: '390px',
        maxWidth: '100%',
        minHeight: '100vh',
        margin: '0 auto',
        background: '#F3ECDD',
        boxShadow: '0 0 60px rgba(80,60,30,.15)',
        display: 'flex',
        flexDirection: 'column',
      }}>

        {/* ヘッダー */}
        <header style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px 12px',
          background: '#F3ECDD',
          borderBottom: '1px solid #E4D9C2',
        }}>
          <span style={{ fontWeight: 800, fontSize: '15px', letterSpacing: '.08em', color: '#6E4A2A' }}>
            👥 フレンド
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setShowSettings(v => !v)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontFamily: FONT,
                fontWeight: 700,
                fontSize: '11.5px',
                color: showSettings ? '#4A6A28' : '#5A7A33',
                background: showSettings ? '#D8EAB8' : '#EBF1DC',
                border: `1.5px solid ${showSettings ? '#B8D898' : '#CFE0AE'}`,
                borderRadius: '999px',
                padding: '6px 12px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              ⚙️ 設定
            </button>
            <Link
              href="/dashboard"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontFamily: FONT,
                fontWeight: 700,
                fontSize: '11.5px',
                color: '#5A7A33',
                background: '#EBF1DC',
                border: '1.5px solid #CFE0AE',
                borderRadius: '999px',
                padding: '6px 12px',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              ← 戻る
            </Link>
          </div>
        </header>

        {/* メインコンテンツ */}
        <main style={{ flex: 1, padding: '14px 16px 40px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {/* 設定パネル（インライン展開） */}
          {showSettings && (
            <FriendsSettingsPanel
              initialNickname={myNickname}
              initialIsPublic={myIsPublic}
              onSave={handleSettingsSave}
              onClose={() => setShowSettings(false)}
            />
          )}

          {/* ローディング */}
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#B6A485' }}>読み込み中...</p>
            </div>
          ) : friends.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 24px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>👥</div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: '14px', color: '#6E4A2A' }}>まだ誰も参加していません</p>
              <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#A8987F' }}>友達が参加すると、ここに表示されます</p>
            </div>
          ) : (
            <>
              <p style={{ margin: '0 2px 4px', fontSize: '11px', fontWeight: 700, color: '#A8987F', letterSpacing: '.04em' }}>
                {friends.filter(f => f.isStatusPublic).length}人が公開中
              </p>
              {friends.map(friend => (
                <FriendCard key={friend.id} friend={friend} />
              ))}
            </>
          )}

        </main>
      </div>

      {/* 初回ニックネームモーダル */}
      {showModal && (
        <NicknameModal onSave={handleModalSave} />
      )}
    </div>
  );
}
