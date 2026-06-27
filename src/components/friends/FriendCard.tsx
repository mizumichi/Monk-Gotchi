'use client';

import TreeDisplay from '@/components/TreeDisplay';
import type { FriendEntry } from '@/hooks/useFriends';

const FONT = "'M PLUS Rounded 1c', 'Noto Sans JP', system-ui, sans-serif";

const STAGE_LABELS: Record<string, string> = {
  egg:   '🥚 芽吹き前',
  early: '🌱 発芽中',
  mid:   '🌿 成長中',
  final: '🌳 実り期',
};

const STAGE_BASE_SCORE: Record<string, number> = {
  egg: 0, early: 150, mid: 420, final: 750,
};

function xpBarPct(xp: number): number {
  if (!xp || xp <= 0) return 0;
  return Math.min(100 * (1 - Math.exp(-xp / 180)), 98);
}

interface Props {
  friend: FriendEntry;
}

export default function FriendCard({ friend }: Props) {
  const FONT_STYLE = { fontFamily: FONT };

  // 非公開カード
  if (!friend.isStatusPublic) {
    return (
      <div style={{
        background: '#F5F0E8',
        border: '1px solid #E0D8C8',
        borderRadius: '20px',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 2px 8px rgba(90,70,35,.06)',
        opacity: 0.7,
        ...FONT_STYLE,
      }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: '#E8E0D0',
          border: '1.5px solid #D5CCB8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          flexShrink: 0,
        }}>
          🔒
        </div>
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '13px', color: '#9A8B76' }}>非公開ユーザー</p>
          <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#B0A090' }}>ステータス非公開</p>
        </div>
      </div>
    );
  }

  const stage = friend.stage ?? 'egg';
  const todayXp = friend.todayXp ?? 0;
  const cycleDay = Math.min(friend.cycleDay ?? 1, 7);
  const totalFruits = friend.totalFruits ?? 0;
  const stageLabel = STAGE_LABELS[stage] ?? '🌱 成長中';
  const visualScore = (STAGE_BASE_SCORE[stage] ?? 0) + todayXp;
  const barPct = xpBarPct(todayXp);

  return (
    <div style={{
      background: '#FBF6EC',
      border: '1px solid #E6DBC4',
      borderRadius: '20px',
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      boxShadow: '0 2px 8px rgba(90,70,35,.06)',
      ...FONT_STYLE,
    }}>
      {/* ミニ木 */}
      <div style={{ width: 60, height: 68, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: 0, left: 0, transformOrigin: 'top left', transform: 'scale(0.3)' }}>
          <TreeDisplay score={visualScore} />
        </div>
      </div>

      {/* 情報エリア */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* ニックネーム行 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <span style={{ fontWeight: 800, fontSize: '14px', color: '#4A3A2A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {friend.nickname || 'ぬる'}
          </span>
          {friend.isSelf && (
            <span style={{
              fontSize: '10px',
              fontWeight: 800,
              color: '#5A7A33',
              background: '#EBF1DC',
              border: '1px solid #CFE0AE',
              borderRadius: '999px',
              padding: '1px 7px',
              flexShrink: 0,
            }}>
              あなた
            </span>
          )}
        </div>

        {/* ステージ + 日数 */}
        <p style={{ margin: '0 0 6px', fontSize: '11px', color: '#7A6A53', fontWeight: 600 }}>
          {stageLabel}&nbsp;&nbsp;Day {cycleDay}/7
        </p>

        {/* XPバー */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ flex: 1, height: '7px', borderRadius: '999px', background: '#EDE4D1', overflow: 'hidden' }}>
            <div style={{
              width: `${barPct}%`,
              height: '100%',
              background: '#5A9E2E',
              borderRadius: '999px',
              transition: 'width .35s ease',
            }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '12px', color: '#5A7A33', flexShrink: 0 }}>
            {todayXp}pt
          </span>
        </div>

        {/* 累計果実 */}
        <p style={{ margin: '5px 0 0', fontSize: '11px', color: '#A8987F', fontWeight: 600 }}>
          🍎 {totalFruits}個
        </p>
      </div>
    </div>
  );
}
