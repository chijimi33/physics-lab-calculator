# 大学物理学実験 計算補助アプリ

Next.js App Router、TypeScript、Tailwind CSSで作成した、大学物理学実験向けの計算補助Webアプリです。

## 公開URL

https://physics-lab-calculator.vercel.app/

## 実験ページ

- 第1回実験: https://physics-lab-calculator.vercel.app/experiments/density-metal-rod
- 第2回実験: https://physics-lab-calculator.vercel.app/experiments/falling-motion
- 第3回実験: https://physics-lab-calculator.vercel.app/experiments/simple-pendulum

## 利用上の注意

- 計算内部では丸めず、表示時のみ有効数字と誤差桁に合わせて丸めています。
- 表の中間値は、選択した表示有効数字より1桁多く表示します。
- レポートへ転記する前に、実験書で指定された単位、丸め規則、誤差評価方法を確認してください。
- 入力値はブラウザのlocalStorageに保存されます。共有端末では使用後に「入力をリセット」を押してください。

## 機能

- 第1回実験「金属棒の密度の測定」
- 第2回実験「落下の実験」
- 第3回実験「単振り子」
- 測定値の入力、平均値、残差、標準偏差、標準誤差の計算
- 有効数字と誤差桁に合わせた表示
- 表示有効数字をユーザーが選択可能
- LaTeX形式の数式表示
- 実験IDごとのlocalStorage保存
- 入力リセット
- CSV出力
- 実験定義を追加しやすい構成

## 構成

- `src/experiments/index.ts`: 実験レジストリ
- `src/experiments/types.ts`: 実験定義の型
- `src/experiments/metalRodDensity.ts`: 第1回実験の計算ロジック
- `src/experiments/metalRodDensity.definition.ts`: 第1回実験の入力、結果、数式、CSV定義
- `src/experiments/fallingMotion.ts`: 第2回実験の計算ロジック
- `src/experiments/fallingMotion.definition.ts`: 第2回実験の入力、結果、数式、CSV定義
- `src/lib/physics/statistics.ts`: 統計計算
- `src/lib/physics/significantFigures.ts`: 有効数字処理
- `src/lib/physics/errorPropagation.ts`: 誤差伝播
- `src/lib/physics/kinematics.ts`: 落下運動の差分計算、単位変換、重力加速度推定
- `src/lib/physics/leastSquares.ts`: 線形最小二乗法
- `src/lib/physics/units.ts`: 単位表示
- `components/experiment-runner.tsx`: 実験定義から画面を描画する共通コンポーネント
- `components/measurement-table.tsx`: 再利用可能な測定表
- `components/result-card.tsx`: 再利用可能な結果カード
- `src/components/math/MathFormula.tsx`: KaTeXによる数式表示

## 実験の追加

第3回以降の実験は、基本的に次の流れで追加できます。

1. `src/experiments/newExperiment.ts` に計算ロジックを作成
2. `src/experiments/newExperiment.definition.ts` に入力、結果、数式、CSV定義を作成
3. `src/experiments/index.ts` の `experiments` 配列へ追加

ページファイルを増やす必要はありません。`slug` に応じて `/experiments/[slug]` が共通画面を表示します。

## 開発

```bash
npm install
npm run dev
```

PowerShellの実行ポリシーで `npm` が止まる場合は、次のように実行できます。

```powershell
npm.cmd run dev
```

PATHが通っていない環境では、Node.jsの実体パスを直接指定してください。

```powershell
& 'C:\Program Files\nodejs\npm.cmd' run dev
```

## テスト

```bash
npm test
```

## ビルド

```bash
npm run build
```
