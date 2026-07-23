# Empacotamento nativo do Solando

O código de gravação da DAW usa `navigator.mediaDevices.getUserMedia`, que funciona
**nativamente** dentro do Electron (PC) e do Capacitor (Android/iOS) — não é um
recurso de navegador. A permissão do microfone é concedida pelo sistema operacional
e o popup do Chrome **não aparece** porque configuramos auto-grant.

---

## 1) PC / Mac / Linux — Electron

Instale as dependências uma vez:

```bash
bun add -d electron @electron/packager
```

Ajuste o `vite.config.ts` para gerar caminhos relativos (necessário para `file://`):

```ts
export default defineConfig({
  tanstackStart: { server: { entry: 'server' } },
  vite: { base: './' },
});
```

E adicione no `package.json`:

```json
"main": "electron/main.cjs",
"scripts": {
  "electron:dev": "ELECTRON_DEV_URL=http://localhost:8080 electron .",
  "electron:build": "vite build && electron .",
  "electron:pack": "vite build && electron-packager . Solando --platform=linux --arch=x64 --out=electron-release --overwrite --ignore='^/src' --ignore='^/public' --ignore='^/electron-release'"
}
```

Rodar em dev: `bun run dev` em um terminal + `bun run electron:dev` em outro.
Gerar o executável: `bun run electron:pack` (troque `--platform` para `win32` ou `darwin`).

O microfone do sistema é liberado automaticamente pelo `main.cjs`.

---

## 2) Android — Capacitor (APK nativo)

Instale as dependências uma vez:

```bash
bun add @capacitor/core @capacitor/android
bun add -d @capacitor/cli
npx cap init Solando app.solando --web-dir=dist
npx cap add android
```

No arquivo `android/app/src/main/AndroidManifest.xml`, adicione dentro de `<manifest>`:

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
<uses-permission android:name="android.permission.INTERNET" />
```

Build e abrir no Android Studio:

```bash
bun run build
npx cap sync android
npx cap open android
```

No Android Studio: **Build > Generate Signed Bundle / APK**.

O WebView do Capacitor pede a permissão de microfone **do próprio Android** na
primeira gravação (uma vez só), depois nunca mais — não é o popup do navegador.

---

## 3) iOS — Capacitor (opcional)

```bash
bun add @capacitor/ios
npx cap add ios
```

Em `ios/App/App/Info.plist` adicione:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>Solando precisa do microfone para gravar suas performances.</string>
```

`npx cap open ios` e faça build pelo Xcode.
