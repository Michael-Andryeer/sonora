# Sonora

App desktop que converte o áudio de vídeos do YouTube em **MP3 320 kbps**, com título, artista e capa embutidos.

Cole **um link**, **vários links** (um por linha) ou uma **URL de playlist** — o Sonora baixa e converte tudo, mostrando o progresso de cada música.

## Stack

- **Electron** + **electron-vite**
- **React** + **TypeScript** + **Tailwind**
- **yt-dlp** + **ffmpeg** (empacotados no instalador)
- **Vitest** para testes

## Scripts

```bash
npm run lint         # ESLint
npm run format       # Prettier (escreve)
npm run format:check # Prettier (checa)
npm run typecheck    # tsc --noEmit
npm test             # Vitest (run)
npm run test:watch   # Vitest (watch)
```

## Status

Em desenvolvimento (v1). Plataformas alvo: Windows e Linux.

> Spotify e macOS ficam para versões futuras.
