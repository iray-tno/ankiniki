# 教材からAnkiへの配布

更新日：2026-10-15。

`content export`は[教材v1](content-package.md)から、モデル・カード・参照音声を含む単独のAnkiデッキpackageを生成する。Ankiやbackendの起動は不要。CLIはmiseで指定されたNode.js 24.19を使う。

## 試す

repoのルートで実行する。

```sh
mise exec -- npm run build:packages
mise exec -- node apps/cli/dist/index.js content export docs/examples/content/basic-practice/content.json practice.apkg --modified-at 2026-10-14T12:00:00Z --public --json
```

サンプルは4ノート・4カード・1音声を生成する。成功時のJSONはstdout、失敗時のJSONはstderrで終了コード1。音声の欠落、サイズ・ハッシュ不一致、未対応形式などは出力前に拒否する。

| オプション            | 意味                                                |
| --------------------- | --------------------------------------------------- |
| `--modified-at <utc>` | 必須。教材を配布する版の変更時刻。UTCの秒単位で指定 |
| `--deck <name>`       | デッキ名。既定は`Ankiniki::<packageId>`             |
| `--public`            | 教材と全assetの公開区分・配布条件の宣言を確認       |
| `--force`             | 既存の出力ファイルを置き換える                      |
| `--json`              | 機械処理用summaryを出力                             |

例の日付はサンプル版の時刻。自分の教材では、その版に固定する実際の変更時刻を使う。1980年以降、未来でない`YYYY-MM-DDTHH:mm:ssZ`のみ受け付ける。再生成で現在時刻を自動採用しない。

既存ファイルは通常上書きしない。`--force`でも入力manifest・音声、リンク、ディレクトリは置き換えない。出力名は`.apkg`で終わる通常のデッキ名にする。`collection.apkg`や`.colpkg`は受け付けない。Ankiでは`collection.apkg`がコレクション復元として特別扱いされるため（[公式のexport説明](https://docs.ankiweb.net/manual/exporting)）。出力先のディレクトリは事前に作成する。

`--public`は宣言の検証で、権利の判定や公開アップロードは行わない。指定しなければprivate教材もローカルで生成できる。個人用教材の入力・生成物は外部のprivate repoやローカルに置く。

## Ankiへの写像

- 一つのactivityから一つのノート・カードを作る。専用モデル`Ankiniki Content v1`は`ContentId`、`Front`、`Back`の3フィールドと`Practice`テンプレートを持つ。
- 問いは表、答え・解説・教材名・packageId・revision・宣言された配布条件・任意の出典URLは裏に置く。入力本文はHTMLとAnkiの音声指示として解釈されないようエスケープする。
- `audio-response`は表に問題音声、裏に任意の模範音声を付ける。応答時間は表に目安として表示する。自動待機や時間制御、録音、採点は実装していない。
- 音声名は内容のSHA-256と形式から決める。同一内容・形式はまとめ、参照される音声だけを同梱する。未参照assetも入力検証の対象。改訂後の古い音声を利用者のAnkiから自動削除しない。

教材identityの`packageId/itemId/activityId`から安定したGUIDを作る。本文・revision・並び順・デッキ名・生成時刻をGUIDに混ぜない。モデル・フィールド・テンプレートにも固定identityを持たせる。同じ教材・変更時刻・実行環境での再生成は同じバイト列になる。

生成物のnote/card IDは配布用であり、利用者のコレクションのIDではない。個人profile、復習履歴、学習予定、デッキ設定presetを入力から取り込まない。生成するカードは未学習状態。

## 教材更新と学習者の編集

同じ教材を改訂する場合は、既存のpackage/item/activity IDを保ち、`revision`と`--modified-at`を進める。同じ版の再生成では同じ時刻を使う。`revision`だけを増やしてもAnkiの更新時刻は進まない。

Ankiの標準importでは、ノート更新に変更時刻・モデル構成・import設定が関係する。新しい学習者の編集は保持されるが、それより新しい配布版は編集を置き換え得る。フィールド単位の衝突解決は行わない。古い版への巻き戻しや、利用者がモデル構成・identityを変更した場合の更新は保証しない。[Ankiのpackage更新仕様](https://docs.ankiweb.net/manual/importing/packaged-decks)を参照。

Anki 26.9.3の標準import処理で、重複のない再import、本文・音声の更新、編集時刻による競合、学習予定と復習履歴の維持を確認した。[検証条件と再確認手順](../developer/content-apkg-verification.md)を参照。AnkiMobile・AnkiDroidやGUIでの実再生は今回の検証範囲に含まない。

## 他の入口との違い

このコマンドは教材を配るためのもの。既存`bundle`のFront/Back作成や、Ankiから取得した任意フィールドの[JSON交換](../design/anki-exchange.md)とは別の入口を使う。任意のAnkiモデル・コレクション全体の復元、AnkiWeb sync、独自SRSは追加していない。
