# Monk-Gotchi 開発進捗まとめ

> たまごっち風のテストステロン向上習慣化アプリ。5カテゴリの健康習慣をチェックすると、キャラが7日サイクルで卵→中期→最終へと進化する。

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
- **AI支援**: Claude Code (Sonnet 4.6) + Claude.ai (Opus 4.7)
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

## 完了した実装 (Phase 0〜B)

### Phase 0: 設計・要件定義
- [x] ゲームサイクルの設計 (7日 = 卵2日 + 中期2日 + 最終3日)
- [x] 5カテゴリ設計 (筋トレ/睡眠/栄養/日光/精神)
- [x] 進化ロジックの方針決定 (中期3種、最終8種)
- [x] アーキテクチャ図の作成
- [x] DB設計 (User / DailyLog / Character / CharacterDex)

### Phase 1: 環境構築
- [x] WSL2 + Ubuntu のインストール
- [x] Node.js / Git / GitHub CLI のセットアップ
- [x] VS Code + WSL拡張接続
- [x] Claude Code のインストール&認証
- [x] AWS CLI / Amplify CLI のセットアップ
- [x] AWS IAMユーザー (monk-gotchi-dev) 作成
- [x] GitHubリポジトリ作成

### Phase 2: フロント基盤
- [x] Next.js プロジェクト初期化 (TypeScript + Tailwind + App Router)
- [x] 「Monk-Gotchi へようこそ」トップページ
- [x] AWS Amplify Hosting 連携 (git push で自動デプロイ)
- [x] 公開URL発行 (`*.amplifyapp.com`)

### Phase 3: バックエンド構築
- [x] Amplify Gen2 のプロジェクト統合
- [x] auth リソース定義 (メール+パスワード認証、8文字以上)
- [x] data リソース定義 (User / DailyLog / Character モデル)
- [x] backend.ts でリソース統合
- [x] Sandbox 起動 → AWS上に実リソース作成
- [x] Cognito 認証画面の日本語化
- [x] サインアップ → メール確認コード → ログインの動作確認

### Phase A: コア機能
- [x] タスクマスタ定義 (5カテゴリ × 各2-3個、計15個程度)
- [x] ダッシュボードUI (キャラ表示、スコアバー、タスク一覧)
- [x] レトロゲーム風ダーク+紫テーマ
- [x] カテゴリタブ切り替え
- [x] タスクチェック機能 (DynamoDBへ保存・取り消し可能)
- [x] スコア集計 (今日の DailyLog からカテゴリ別ポイント計算)
- [x] AmplifyClient のクライアントサイド初期化

### Phase B-1: Day管理
- [x] JST朝4時リセット対応 (`getCurrentDateString()`)
- [x] Day数計算 (cycleStartDate からの経過日数)
- [x] ステージ判定 (egg / early / mid / final)
- [x] Character 初期化 (初回ログイン時に自動作成)
- [x] テスト用ボタン (`+1日`、`リセット`)
- [x] 日付オーバーライド機構 (localStorage活用)
- [x] 「テスト中: YYYY-MM-DD」バナー

### Phase B-2: 進化判定
- [x] `src/lib/evolution.ts` で進化ルール実装
- [x] 中期判定 (累計スコアで excellent / normal / lazy)
- [x] 最終判定 (midType + 累計 + カテゴリ偏りで8種)
- [x] キャラマスタ (`src/data/characters.ts`) 13種定義
- [x] CharacterDisplay の動的キャラ解決
- [x] 進化トースト表示 (「進化した! XX が生まれた!」)
- [x] アクション時の自動進化判定 (タスクチェック / 日付進行)

### Phase B-3: 図鑑機能
- [x] CharacterDex モデル追加
- [x] 「もう一度育てる」ボタン (Day 7後)
- [x] 確認ダイアログで誤クリック防止
- [x] 図鑑への自動登録 (firstObtainedAt / lastObtainedAt / obtainedCount)
- [x] 図鑑ページ (`/dex`) 新規作成
- [x] 8マスグリッド表示 (入手済み/未入手で見た目変化)
- [x] ヘッダーに「📖 図鑑」リンク
- [x] 全種コンプリートバナー
- [x] 卵に戻る処理 (cycleStartDate / stage / midType / finalType リセット)

---

## 実装したファイル構成

```
Monk-Gotchi/
├── amplify/
│   ├── auth/resource.ts          # Cognito 認証定義
│   ├── data/resource.ts          # User/DailyLog/Character/CharacterDex モデル
│   └── backend.ts                # バックエンド統合
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Providers 統合
│   │   ├── page.tsx              # トップページ (ログインボタン)
│   │   ├── providers.tsx         # Amplify Provider
│   │   ├── login/page.tsx        # 認証画面 (日本語化)
│   │   ├── dashboard/page.tsx    # メインダッシュボード
│   │   └── dex/page.tsx          # 図鑑ページ
│   ├── components/
│   │   ├── CharacterDisplay.tsx  # キャラ表示
│   │   ├── ScoreBars.tsx         # 5カテゴリのスコアバー
│   │   └── TaskList.tsx          # タスク一覧 (チェック機能)
│   ├── data/
│   │   ├── tasks.ts              # タスクマスタ
│   │   └── characters.ts         # キャラマスタ (13種)
│   ├── hooks/
│   │   └── useCharacter.ts       # Character管理 + 進化判定
│   └── lib/
│       ├── amplify.ts            # Amplify.configure
│       ├── amplifyClient.ts      # generateClient<Schema>
│       ├── date.ts               # 日付ユーティリティ
│       └── evolution.ts          # 進化判定ロジック
└── (Next.js 設定ファイル群)
```

---

## 動作するゲームループ

現在、以下の1サイクルが完全に動作する:

```
[1日目] 🥚 たまご
    ↓ タスクをチェックしてスコアを積む
    ↓ +1日テストボタン or 翌日 (朝4時)
[2-3日目] 🐣 ヒナちゃん (early)
    ↓ さらにタスクをこなす
    ↓ Day 4 進入で中期判定
[4-6日目] 🐤🐥😪 ヒヨコモンク 優/並/怠 (mid)
    ↓ 累計スコアとカテゴリ偏りで最終判定
[7日目] 最終8種のいずれか (final)
    - 🧘 聖僧 (バランス + 高スコア)
    - 💪 覇王 (筋トレ特化)
    - 🌿 仙人 (栄養特化)
    - 📚 賢者 (精神特化)
    - 🛡️ 守護者 (バランス中スコア)
    - ⚔️ 戦士 (普通だが頑張った)
    - 🧔 普通おじさん (普通)
    - 😴 怠惰王 (サボり気味)
    ↓ 「もう一度育てる」ボタン
[図鑑に登録] → 卵に戻って次サイクル
```

---

## これから実装すること

### Phase C: ユーザビリティ向上 (近期)

- [ ] **お気に入り機能 (星マーク)**
  - タスクに ☆/★ ボタンを追加
  - お気に入りはユーザーごとに保存 (UserTaskSettings モデル新設)
  - DynamoDBに永続化

- [ ] **ルーティンタブ**
  - お気に入りタスクをまとめて表示する6つ目のタブ
  - 並び替え機能 (drag & drop か上下ボタン)
  - 朝/夕分けて表示する案も

- [ ] **ジャーナル機能**
  - 1日2回 (朝・夕) の気分記録
  - 気分は10段階 + 一言コメント
  - 入力するとタスククリア扱い (ポイント獲得)
  - Journal モデル新設

- [ ] **ヘッダー/ナビゲーション改善**
  - モバイルでも使いやすいタブナビゲーション
  - 設定ページへの導線

### Phase D: ソーシャル機能 (中期)

- [ ] **友人機能**
  - 友人検索 (ユーザー名 or メールで)
  - 友人追加リクエスト
  - Friend モデル新設

- [ ] **友人欄**
  - 友人の名前
  - 1週間の平均ポイント表示
  - 現在育成中のキャラ表示

- [ ] **比較・ランキング**
  - 友人内ランキング (オプトイン式)
  - スキルマッチドリーグの簡易版

### Phase E: ビジュアル強化 (中期)

- [ ] **ドット絵キャラ**
  - 全13種のキャラをレトロゲーム風ドット絵に
  - 既存のCharacterDisplayをdiv → SVG/Canvas/imgに変更
  - 進化エフェクトをアニメーション化

- [ ] **進化演出の強化**
  - フラッシュ、シェイク、サウンド (オプション)
  - 「進化中...」のドラマチックな演出

- [ ] **背景・テーマ**
  - キャラの種類によって背景が変わる
  - 時間帯による色味変化

### Phase F: PWA対応 (中期)

- [ ] **Service Worker**
  - オフライン時の最低限の動作
  - キャッシュ戦略

- [ ] **manifest.json**
  - ホーム画面追加対応
  - アイコン (各サイズ)
  - スプラッシュ画面

- [ ] **iOS/Android Safari対応**
  - メタタグ設定
  - インストール促進バナー

### Phase G: 本番運用 (長期)

- [ ] **バランス調整**
  - 実際のプレイデータからスコア閾値を調整
  - 各キャラの出現率を確認・調整

- [ ] **タスクマスタの本番版**
  - 設計仕様レポート (T-QUEST設計書) のタスクを採用
  - エビデンスに基づいたポイント設計

- [ ] **本番環境のバックエンド**
  - Sandbox から本番環境へ昇格
  - amplify.yml 設定でビルド時に pipeline-deploy
  - Amplify Hosting 経由で完全公開

- [ ] **その他**
  - エラー監視 (CloudWatch Logs)
  - 利用統計 (匿名化)
  - 友人への配布開始

### Phase H: 拡張アイデア (将来)

- [ ] **特別タスク (週次/月次)**
  - 設計仕様レポートのSpTask相当
  - デロード週、瞑想チャレンジ等

- [ ] **ゴーストモード**
  - 過去の自分との比較
  - 「先週の自分より頑張った」表示

- [ ] **ストリーク機能**
  - 連続達成日数の表示
  - Rest Day (週2回まで) の救済機構

- [ ] **気分変化グラフ**
  - ジャーナルの気分推移
  - キャラ進化と気分の相関表示

- [ ] **その他タブ (図鑑以外)**
  - グラフ表示
  - 設定画面
  - データエクスポート

---

## 既知の制約・課題

### 技術的な課題
- **DailyLog のページネーション未対応**: list() がデフォルト100件まで。長期使用で対応必要
- **進化トーストのアニメーション**: animate-fade-in が即表示状態。Tailwind config に keyframes追加が必要
- **本番環境未デプロイ**: Sandbox のみで動作。Amplify Hosting への自動デプロイは設定後

### 設計上の課題
- **スコア閾値の調整**: 1日最大610pt の設定で実際の難易度は要調整
- **Day 7 の逃げ場**: 進化キャラが気に入らなくても「もう一度育てる」しか選択肢がない
- **複数デバイス対応**: 同じユーザーが同時に複数デバイスで操作した時の整合性

### 運用上の課題
- **データバックアップ**: 図鑑データの誤削除対策
- **アカウント削除**: ユーザーの退会フロー未実装
- **タイムゾーン**: 海外旅行時の動作未検証 (現状JST固定)

---

## 開発で得られた学び

### 技術
- WSL2 + Linux環境構築の手順
- Amplify Gen2 の Infrastructure as Code (IaC) 体験
- DynamoDB のスキーマレス設計の柔軟性
- Cognito 認証フロー
- React の useState / useEffect / カスタムフック
- TypeScript の型安全な開発体験
- CI/CD (GitHub → Amplify自動デプロイ)

### 開発手法
- AI支援開発 (Claude Code + Webチャット の役割分担)
- 設計判断は人間、実装はAI、というハイブリッド
- 段階的実装 (Phase分割) の重要性
- テスト用機能 (+1日ボタン) の効果

---

## 次回着手するなら

優先度高い順:
1. **Phase C (お気に入り + ルーティン + ジャーナル)** - 日常的な使い勝手が向上
2. **Phase E (ドット絵)** - 世界観が完成、見せたくなる
3. **Phase F (PWA)** - スマホで本格利用可能に
4. **Phase G (本番デプロイ)** - 友人に配布できる状態
5. **Phase D (友人機能)** - リリース後の体験向上
6. **Phase H (拡張)** - 余裕があれば

---

*最終更新: Phase B-3 (図鑑機能) 完了時点*
