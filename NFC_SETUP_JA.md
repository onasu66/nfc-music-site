# NTAG215への書き込み手順

このサイトでは、NTAG215カードに音楽ファイルそのものではなく、音楽ページを開くためのURLを書き込みます。

## 1. まず公開URLを用意する

ローカルURLは外では使えません。

使えない例:

```text
http://127.0.0.1:5174/?key=a9F4kLm72QpX8zTnR5sV
```

本番でNFCカードに書く例:

```text
https://your-domain.com/c/a9F4kLm72QpX8zTnR5sV
```

Cloudflare Pagesに公開する前のローカル確認では、次のURLを使います。

```text
http://127.0.0.1:5174/?key=a9F4kLm72QpX8zTnR5sV
```

Cloudflare Pagesなどに公開してから、そのURLを書き込みます。

## 2. 曲を登録する

MP3をサイト内に置く場合:

```text
D:\app\nfc-music-site\audio\song001.mp3
```

カード設定ファイルを編集します。

```text
D:\app\nfc-music-site\cards\a9F4kLm72QpX8zTnR5sV.json
```

例:

```json
{
  "title": "曲名",
  "artist": "アーティスト名",
  "edition": "KEY 001",
  "format": "NTAG215 URL KEY",
  "duration": "03:18",
  "audioUrl": "/audio/song001.mp3",
  "coverUrl": "/covers/cover001.jpg",
  "accent": "#ff5a3d",
  "secondary": "#32d5ff",
  "third": "#d6ff5f",
  "description": "このカードで開ける限定トラックです。"
}
```

Cloudflare R2やCDNに音源を置く場合:

```json
"audioUrl": "https://audio.example.com/song001.mp3"
```

## 3. NFC ToolsでカードにURLを書き込む

スマホに `NFC Tools` を入れます。

Android/iPhone共通の流れ:

```text
NFC Toolsを開く
Writeを選ぶ
Add a recordを押す
URL/URIを選ぶ
公開URLを入力する
Writeを押す
NTAG215カードをスマホにかざす
```

書き込むURL例:

```text
https://your-domain.com/c/a9F4kLm72QpX8zTnR5sV
```

## 4. 動作確認

カードをスマホにかざします。

ブラウザが開いて、曲ページが表示されれば成功です。

## 5. 書き換え防止

販売前にカードを書き換えられないようにするなら、NFC Toolsのロック機能を使えます。

注意:

```text
ロックすると基本的に戻せません。
必ずテストカードで確認してから本番カードをロックしてください。
```

## NTAG215でできること/できないこと

できる:

```text
長いランダムURLをカードに入れて、カードを鍵っぽく使う
カードごとに違う曲を開く
カードを転売したら聴ける権利も自然に移る
```

できない:

```text
URLをコピーされた時に完全に防ぐ
読み取りごとに毎回変わる暗号認証をする
```

後から本当に「カード実物がないと聴けない」にするなら、NTAG424 DNAとサーバー側の動的認証へ移行します。
