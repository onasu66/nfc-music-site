# Keytone NFC Music Site

NTAG215 cards can work as physical keys by storing long, unguessable URLs.

## Preview

```bash
python -m http.server 5174
```

Open one of the demo card URLs locally:

```text
http://127.0.0.1:5174/?key=a9F4kLm72QpX8zTnR5sV
http://127.0.0.1:5174/?key=v3MzQ91LpA8tYx6Kf2Nc
http://127.0.0.1:5174/?key=t7XqR2nK8Va5Lp9Dg4Wm
```

After deploying to Cloudflare Pages, `/c/<key>` also works through `_redirects`.

## Card Data

Each NFC card key loads a separate JSON file:

```text
cards/a9F4kLm72QpX8zTnR5sV.json
```

This avoids publishing one central list of every card key.

## Add Music

Put your MP3 here:

```text
audio/song001.mp3
```

Then edit the card file:

```json
"audioUrl": "/audio/song001.mp3"
```

If you use Cloudflare R2 or another CDN, use a full URL:

```json
"audioUrl": "https://audio.example.com/song001.mp3"
```

## NFC URL

Write a URL like this to the NTAG215 card:

```text
https://your-domain.com/c/a9F4kLm72QpX8zTnR5sV
```

## Future Upgrade

Later, NTAG424 DNA can replace the static random key with dynamic cryptographic
authentication. The public URL shape can stay similar:

```text
https://your-domain.com/c/<dynamic-card-token>
```
