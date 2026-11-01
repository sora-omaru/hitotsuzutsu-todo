# ひとつずつ

日本語のTODOアプリ。外部ライブラリやビルド処理なしで動作します。

```sh
cd todo-app
python3 -m http.server 3000 --directory dist
```

http://localhost:3000 を開いてください。

タスクの追加・編集・完了・削除、メモ、カテゴリー、期限、優先度、検索、並び替え、完了状態での絞り込みに対応します。データはブラウザのlocalStorageに保存します。同じブラウザ・同じURLで再度開くと復元されます。別の端末への同期には対応していません。

日本語フォントはGoogle Fontsから取得し、取得できない環境では端末のフォントを使います。

## GitHub Pages

GitHub Pagesの公開元を「GitHub Actions」に設定すると、`main`へのpushで`.github/workflows/pages.yml`が実行され、`dist/`をデプロイします。Actions画面から手動実行もできます。公開先のURLはワークフローのデプロイ結果で確認できます。

タスクデータはアクセスした人のブラウザに保存され、GitHubには送信されません。SitesとGitHub PagesではURLが異なるため、保存データはそれぞれ独立します。
