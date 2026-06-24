# Phase E: キャラステージ＆基本アニメーション 仕様書 v2.0

**作成日**: 2026-05-10 (v1.0)
**更新日**: 2026-05-14 (v2.0)
**対象**: Phase E 実装担当(Claude Code)
**前提**: Phase D-1 (キャラマスタ23形態) 完了済み

## 更新履歴

### v2.0 (2026-05-14)
- 待機モーションを「浮遊」から「歩行+反転+まばたき」に変更(卵のみ浮遊継続)
- グリッドサイズをキャラ個別に変更(24×24 / 40×30 / 64×32 など)
- アニメーション周期・移動速度をキャラごとに個別設定
- 「進行方向反転」「Bフレーム時の移動制御」を追加
- 提供されたキャラデザインデータ(`sprite-data.ts`)に準拠

### v1.0 (2026-05-10)
- 初版作成

---

## 0. ゴール

ダッシュボードに**固定表示のキャラステージ**を新規追加する。朝の草原風カラー背景(時刻に応じて昼/夕/夜が切り替わる)の中で、ドット絵キャラが歩行モーションで動き、進行方向に向きを変え、まばたきする。タスク完了で反応し、進化時に演出が流れる。

**既存のキャラアイコン表示は残したまま** Phase E を完了させ、レイアウト統合は次の Phase F に送る。

---

## 1. スコープ

### 1-1. やること

- 新規「キャラステージ」エリア(画面上部1/3、`position: sticky` で固定)
- 朝の草原風カラー背景(昼/夕/夜の3パターン、時刻ベース切替)
- 待機モーション(歩行+進行方向反転+まばたき、キャラごとに個別パラメータ)
- タスク完了リアクション(ピョコッと弾む+星キラキラエフェクト)
- 進化演出(フラッシュ→消滅→新キャラ登場)
- ドット絵キャラ23体(E-1〜E-5で順次追加)

### 1-2. やらないこと(別フェーズへ)

- カテゴリ別の専用アニメ(筋トレ動作・食事動作・睡眠zzz等) → **Phase G**
- キャラ個別の専用モーション(聖僧の座禅・覇王の腕組み等) → **Phase G**
- 感情フキダシ(空腹・眠い等)
- 既存キャラアイコン表示の削除 → **Phase F**
- レイアウト統合・最適化 → **Phase F**

---

## 2. レイアウト仕様

### 2-1. ダッシュボード全体構成(Phase E 完了時)

```
┌─────────────────────────┐
│  ヘッダー                │ ← 既存
├─────────────────────────┤
│   既存キャラアイコン      │ ← 既存(残す)
│   スコアバー             │ ← 既存
├─────────────────────────┤
│ ╔═════════════════════╗ │ ← 新規【sticky 固定】
│ ║                     ║ │   画面の約1/3
│ ║   キャラステージ      ║ │   朝の草原風背景
│ ║   (歩き回るキャラ)    ║ │
│ ╚═════════════════════╝ │
├─────────────────────────┤
│   タスク一覧 ↕          │ ← 既存(スクロール)
└─────────────────────────┘
```

### 2-2. キャラステージの寸法と挙動

- **高さ**: スマホビューポートの約 33%(`height: 33vh` 程度)
- **幅**: 画面幅いっぱい(マージン除く)
- **固定**: `position: sticky; top: 0` でタスクスクロール時も常に表示
- **キャラ表示エリア**: ステージ内部に配置。キャラの canvas サイズは個別だが、ステージのサイズは固定

---

## 3. たまごっち風背景の仕様

### 3-1. 構成

- 空ゾーン(上1/3): グラデーション背景、太陽 or 月、雲1〜2個
- プレイエリア(中1/3): キャラがここで歩行
- 床ゾーン(下1/3): 草の地面 + 草の点描

### 3-2. 時刻による切替

```ts
function getTimeOfDay(): 'day' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 17) return 'day';
  if (hour >= 17 && hour < 19) return 'evening';
  return 'night';
}
```

各時間帯の配色は E-1 で実装済み(本仕様書では省略)。

---

## 4. アニメーション仕様

### 4-1. 待機モーション (キャラ種別による分岐)

#### Monk-Egg (卵のみ): 浮遊モーション
- ふわふわ上下に浮く: `translateY(0 → -4px → 0)` を 2.4秒 ease-in-out infinite
- まばたき: 3〜5秒間隔のランダム発火、150msだけ目を閉じる
- **歩かない**(理由: 卵には足がない)

#### それ以外の全キャラ: 歩行モーション
- **2フレーム交互切替** (walkA ⇔ walkB)
- **左右往復**: ステージ端まで歩いたら方向転換
- **進行方向に反転**: `transform: scaleX(-1)` で水平反転
- **キャラごとの個別パラメータ**:
  - `frameInterval`: フレーム切替周期(ms)
  - `moveSpeed`: 1ステップあたり移動量(px)
  - `moveOnBFrame`: walkB時にも移動するか(false=Aフレーム時のみ移動)
- **まばたき**: キャラごとに個別パラメータ
  - `blinkDuration`: まばたき時間(ms)
  - `blinkIntervalMin/Max`: まばたき間隔(ms)

### 4-2. キャラ個別のアニメパラメータ例

`sprite-data.ts` で定義された各キャラの `animation` オブジェクトに従う:

| キャラ | frameInterval | moveSpeed | moveOnBFrame | blinkDuration |
|---|---|---|---|---|
| Monk-Baby | 350ms | 5px | true (毎フレーム移動) | 150ms |
| Daraku-Monk | 450ms | 4px | false (Aフレームのみ) | 200ms |
| Slothchi-King | 500ms | 4px | false (Aフレームのみ) | 300ms |

**設計意図**: 堕落僧・怠惰王は「Aフレーム時のみ移動」にすることで、**ゆっくり・だるそうな動き**を表現する。元気なキャラほど周期が短く、移動も活発。

### 4-3. タスク完了リアクション (E-2で実装済み)

- キャラがピョコッと弾む(縦に潰れて→ジャンプ→着地、約0.5秒)
- 周囲に5つの星(✦、`#ffe066`)が散布
- 1タスク=1リアクション、連打時は最新優先

### 4-4. 進化演出 (E-4で実装)

- ① 光(フラッシュ): 0.5秒
- ② 消滅(縮小+透明): 0.4秒
- ③ 登場(拡大バウンス): 0.6秒
- ④ 完了: 待機モーション開始 + 既存の進化トースト表示

---

## 5. グリッドサイズと表示方針

### 5-1. キャラ個別グリッド

**当初はステージ別に統一する予定だったが、実際のデザインに合わせて個別に変更**:

| キャラ | グリッドサイズ | pixelSize | 実表示サイズ |
|---|---|---|---|
| Monk-Egg | 24×24 | 4 | 96×96 |
| Monk-Baby | 24×24 | 4 | 96×96 |
| Wakaki-Monk | 未定 | 4 | 未定 |
| Heibon-Monk | 未定 | 4 | 未定 |
| Daraku-Monk | **40×30** | 4 | 160×120 |
| Slothchi-King | **64×32** | 4 | 256×128 |
| その他最終17体 | 未定 | 4 | 未定 |

### 5-2. ステージ内の配置

- キャラの canvas サイズはばらつくが、**ステージのサイズは固定**(33vh)
- キャラはステージ内で**bottom基準で配置**(地面に立っているように)
- 歩行範囲: `left: 10px` 〜 `right: 10px - キャラ幅`(両端10pxの余白)

### 5-3. PixelSprite の任意サイズ対応

E-1 で実装済みの `sprite-utils.tsx` の `PixelSprite` は、**frame配列の行数・列数を動的に判定**するため、グリッドサイズの違いに無修正で対応できる:

```tsx
const rows = frame.length;
const cols = frame[0]?.length ?? 0;
gridTemplateColumns: `repeat(${cols}, ${pixelSize}px)`
```

---

## 6. データ管理

### 6-1. SpriteData 型 (sprite-data.ts で定義)

```ts
type SpriteData = {
  grid: { w: number; h: number };
  pixelSize: number;
  frames: {
    walkA: string[];
    walkB: string[];
    blink: string[];
  };
  colors: Record<string, string>;
  animation: {
    frameInterval: number;
    moveSpeed: number;
    moveOnBFrame: boolean;
    blinkDuration: number;
    blinkIntervalMin: number;
    blinkIntervalMax: number;
  };
};
```

### 6-2. ファイル構成

```
src/components/sprites/
  sprite-utils.tsx        ← PixelSprite (任意サイズ対応・実装済)
  sprite-data.ts          ← 全キャラのSpriteData
  MonkEgg.tsx             ← E-1で実装済(浮遊モーション)
  WalkingCharacter.tsx    ← E-3で新設(歩行モーション共通実装)
```

**設計判断**:
- Monk-Egg は浮遊専用なので独立コンポーネント
- それ以外の22体は `WalkingCharacter` が `SpriteData` を受け取って共通描画する
- 23体ぶんの個別コンポーネントは不要(データ駆動で1つで全部描ける)

---

## 7. 実装フェーズ分割

### E-1: 完了済み
- CharacterStage / StageBackground / CharacterSprite / MonkEgg
- 朝の草原背景(昼/夕/夜)
- 卵の浮遊+まばたきモーション

### E-2: 完了済み
- useCharacterAnimation hook
- StarsEffect コンポーネント
- bounce アニメーション
- TaskList との Context 連携

### E-3: 着手予定
- `sprite-data.ts` を `src/components/sprites/` に配置
- `WalkingCharacter.tsx` 新設(歩行モーション共通実装)
- `CharacterSprite.tsx` 拡張(code に応じて MonkEgg or WalkingCharacter を出し分け)
- Monk-Baby / Daraku-Monk / Slothchi-King の3体を表示できるように
- ステージ進行(Day)に応じた自動切替
- テスト用 +1日ボタンで全ステージ確認

### E-4: 進化演出
- フラッシュ→消滅→登場のシーケンス
- 既存の進化トーストと連動

### E-5: 残り19体追加
- 中期2体(Wakaki-Monk / Heibon-Monk)
- 最終 Legendary 6種、Standard 7種、Humorous 4種(Slothchi-King 除く)
- `sprite-data.ts` に追加するだけで自動的に表示される設計

---

## 8. テストシナリオ (堕落ルート)

E-3 完了時、以下のシナリオで全機能が確認できる:

```
[Day 1] 🥚 Monk-Egg          → 巣の上でふわふわ浮遊
        +1日 (何もしない)
[Day 2-3] 🐣 Monk-Baby       → 元気よく歩き回る (350ms / 5px)
        +1日 ×2
[Day 4] 中期判定              → Daraku-Monk へ進化
[Day 5-7] 😪 Daraku-Monk     → ダラダラ歩く (450ms / 4px・Aフレームのみ移動)
        +1日 ×3
[Day 7] 最終判定              → Slothchi-King へ進化
[Day 8] 😴 Slothchi-King     → さらにのろい (500ms / 4px)
```

**全ステージをタスク0で確認できる**ため、テストが速い。

---

## 9. 技術方針

| 項目 | 方針 |
|---|---|
| 描画方式 | SVG (DIVグリッド・E-1の sprite-utils を継続使用) |
| アニメーション | CSS `@keyframes` + React state |
| ライブラリ追加 | なし |
| キャラデータ | `sprite-data.ts` に集約(データ駆動) |
| キャラ実装 | 浮遊用 (MonkEgg) と歩行用 (WalkingCharacter) の2種類のみ |
| 既存への影響 | ゲームロジック・DB・既存UIは**一切変更しない** |

---

## 10. 追加・変更するファイル(E-3時点で)

```
src/components/sprites/
  sprite-utils.tsx          ← 既存 (E-1, 変更なし)
  sprite-data.ts            ← 新規 (E-3, docsから移植)
  MonkEgg.tsx               ← 既存 (E-1, 変更なし)
  WalkingCharacter.tsx      ← 新規 (E-3, 歩行共通実装)

src/components/
  CharacterSprite.tsx       ← 編集 (E-3, code 分岐拡張)
  CharacterStage.tsx        ← 編集 (E-3, ステージ判定で code を渡す)
```

---

## 11. Phase F (次フェーズ) の予告

Phase E 完了後、以下を Phase F で実施予定:

- 既存キャラアイコン表示の削除
- ヘッダー・スコアバー・キャラステージのレイアウト統合
- スマホ最適化(縦長画面での表示調整)
- スクロール体験の最適化

---

## 12. 設計判断の根拠

| 判断 | 理由 |
|---|---|
| 卵だけ浮遊・他は歩行 | 卵には足がない自然な分岐。実装も2種類で済む |
| キャラ個別グリッド | 実際のデザインで描き込み量が大きく異なるため、統一は無理 |
| アニメ周期を個別化 | 「元気/不調/怠惰」をスピードで表現できる(設計的に強力) |
| Bフレーム移動制御 | 「Aフレーム時のみ移動」で**ヨタヨタ歩き**を表現できる |
| データ駆動 | キャラ23体を個別コンポーネント化せず、SpriteDataで集約 |
| sprite-data.ts を docs/ ではなく src/ に置く | コードから直接import するため。docsは参考資料のみ |
| 既存アイコンを残す | バグ切り分けを容易にする。Phase F で統合 |
| sticky で固定 | スマホでタスクスクロール中もキャラが見える「たまごっち感」を確保 |

---

**以上。Phase E は v2.0 仕様で E-3 から進める。**
