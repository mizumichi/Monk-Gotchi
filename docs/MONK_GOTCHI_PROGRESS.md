# Monk-Gotchi 開発進捗まとめ

> テストステロン向上習慣化アプリ。タスクをこなすと累計XPが貯まり、7日サイクルで木が育つ。収穫するとランクに応じた実が果樹園に積み上がっていく。

---

## プロジェクト概要

| 項目 | 内容 |
|---|---|
| プロジェクト名 | Monk-Gotchi |
| GitHub | `Monk-Gotchi` (mainブランチで開発) |
| デプロイ先 | AWS Amplify Hosting |
| 想定ユーザー | 友人数人 (個人開発) |
| 利用想定 | スマホからWebサイトとして利用 (将来PWA化) |

---

## 技術スタック

### 開発環境
- **OS**: Windows 11 + WSL2 (Ubuntu 24.04 LTS)
- **エディタ**: VS Code + WSL拡張
- **Node.js**: v20 (nvm管理)
- **AI支援**: Claude Code (Sonnet 4.6) + Claude.ai
- **CLI**: AWS CLI v2、Amplify CLI、GitHub CLI

### フロントエンド
- **フレームワーク**: Next.js (App Router)
- **言語**: TypeScript
- **スタイル**: Tailwind CSS
- **認証UI**: @aws-amplify/ui-react

### バックエンド (AWS Amplify Gen2)
- **認証**: Amazon Cognito
- **API**: AWS AppSync (GraphQL)
- **DB**: Amazon DynamoDB
- **ホスティング**: AWS Amplify Hosting (CI/CD自動)

---

## 完了した実装

### Phase 0〜B: 基盤（旧キャラ進化システム）
- [x] 環境構築（WSL2 / Amplify Gen2 / 認証）
- [x] タスクマスタ（6カテゴリ、49タスク）
- [x] DailyLog / Character / Harvest モデル
- [x] JST朝4時リセット・日付オーバーライド機構
- [x] ジャーナル機能（朝・夕の気分記録）
- [x] お気に入り＋ルーティンタブ
- [x] スコア集計（`buildAggregatesForDays`）

### フェーズ T: 木の育成システムへ方針転換

旧来の「23種キャラ進化」を廃止し、単一指標（累計スコア）で育つ**木モデル**に移行。

| フェーズ | 内容 |
|---|---|
| **T-1** | `TreeDisplay`（SVGプロシージャル生成）実装、`CharacterDisplay` を置換 |
| **T-2** | `evolution.ts` を `getTreeRank` に一本化、中期/最終判定を撤去 |
| **T-3** | `Harvest` モデル + 収穫フロー + `/orchard` 画面新設 |
| **T-4** | 収穫演出（樹冠グロー → 実が根元まで落下） |
| **T-5** | 旧キャラ資産（`characters.ts` / `CharacterDisplay` / 進化演出）を撤去 |

---

## 現行のゲームループ

```
[1日目〜7日目]
  タスクをこなす → 累計XP が貯まる → 木がなめらかに成長
  実はスコアに応じてリアルタイムプレビュー表示

[Day 7 到達]
  「収穫する」ボタン → 確認ダイアログ
    → 収穫演出（光り→実が1つずつ根元まで落下、約2秒）
    → Harvest レコード作成（ランク・実数・サイクル開始日・合計スコア）
    → 木リセット（新サイクル開始）

[果樹園 /orchard]
  過去の収穫一覧（日付・ランク・実数）
  合計実数の累計表示
```

### ランク判定（`getTreeRank`）
| スコア | ランク | 実数 |
|---|---|---|
| ～349 | low（いまいち） | 1個 |
| 350～699 | mid（普通） | 3個 |
| 700～1050+ | high（だいぶ良い） | 6〜12個（連続増） |

---

## ファイル構成（主要部分）

```
Monk-Gotchi/
├── amplify/
│   ├── auth/resource.ts          # Cognito 認証定義
│   ├── data/resource.ts          # DailyLog / Character / Harvest モデル
│   └── backend.ts
├── src/
│   ├── app/
│   │   ├── dashboard/page.tsx    # メインダッシュボード（木 + タスク）
│   │   ├── orchard/page.tsx      # 果樹園（収穫履歴）
│   │   └── login/page.tsx
│   ├── components/
│   │   ├── TreeDisplay.tsx       # 木のSVG描画（収穫演出も内包）
│   │   ├── TaskList.tsx
│   │   ├── JournalModal.tsx
│   │   └── SleepHoursInput.tsx
│   ├── data/
│   │   ├── tasks.ts              # タスクマスタ（49タスク）
│   │   └── taskDetails.ts        # タスク詳細説明
│   ├── hooks/
│   │   ├── useCharacter.ts       # Character管理 + 収穫ロジック
│   │   ├── useJournal.ts
│   │   ├── useRecentLogs.ts
│   │   └── useUserSettings.ts
│   └── lib/
│       ├── evolution.ts          # getTreeRank + buildAggregatesForDays
│       ├── cycle.ts              # getCycleInfo（dayN / phase / isOverflow）
│       ├── date.ts               # 日付ユーティリティ（JST・オーバーライド）
│       └── sleepXp.ts
└── docs/
    ├── PHASE_TREE_SPEC.md        # 木システムの正式仕様
    └── MONK_GOTCHI_PROGRESS.md   # 本ファイル
```

---

## 既知の制約・課題

| 課題 | 内容 |
|---|---|
| DailyLog ページネーション未対応 | list() がデフォルト100件まで。長期使用で対応必要 |
| animate-fade-in が即表示 | Tailwind config に keyframes追加が必要 |
| 本番環境未デプロイ | Sandbox のみ動作。Amplify Hosting への本番デプロイは未設定 |
| 複数デバイス対応 | 同時操作時の整合性未検証 |
| Harvest 件数増時のページネーション | 既知課題として据え置き |

---

## 開発で得られた学び

- **単一指標＋木モデルへの簡素化**: 23種キャラ進化は管理・調整コストが高すぎた。累計スコア1本で木が育つモデルに変えることで、調整箇所が `getTreeRank` の数値だけに集約された。
- **SVGプロシージャル生成**: パラメータ（t = score/1050）で木の形状・実数をなめらかに変化させることで、1コンポーネントで全状態を表現できた。
- **CSS animation on SVG elements**: `transform-box: fill-box` 指定時は `translateY` の `px` が SVGユーザー単位として解釈される（CSSピクセルへの変換不要）。
- **Amplify Gen2 IaC**: DynamoDB はスキーマレスなので既存データを温存しつつスキーマ定義のみ更新できた。

---

*最終更新: T-5（旧キャラ資産撤去）完了時点*
