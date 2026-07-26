# Gerar o APK do Solando

O projeto Android já está criado em `android/` (Capacitor). O app é SSR, então o
WebView nativo carrega a versão publicada (`https://melody-muse-15.lovable.app`),
configurada em `capacitor.config.ts` → `server.url`.

> Sempre que publicar uma nova versão no Lovable, o APK já instalado recebe a
> atualização automaticamente — não precisa gerar APK de novo.

## 1) Pré-requisitos (no seu PC)

- Android Studio (inclui SDK + JDK 17)
- Node 20+ / Bun

## 2) Baixar o projeto e preparar

```bash
bun install
npx cap sync android
```

## 3) Gerar o APK

**Pela linha de comando (debug, para instalar no celular):**

```bash
cd android && ./gradlew assembleDebug
```

APK gerado em `android/app/build/outputs/apk/debug/app-debug.apk`.

**Pelo Android Studio (release assinado, para a Play Store):**

```bash
npx cap open android
```

Depois: **Build → Generate Signed Bundle / APK → APK → criar keystore → release**.

## 4) Microfone

Já configurado:
- `RECORD_AUDIO`, `MODIFY_AUDIO_SETTINGS` no `AndroidManifest.xml`
- pedido de permissão em runtime no `MainActivity.java`
- `onPermissionRequest` do WebView concedendo `getUserMedia` automaticamente

Ou seja: o Android pede a permissão uma vez, e o afinador/DAW funcionam sem
popup de navegador.

## 5) Push notifications (Firebase)

1. No [Firebase Console](https://console.firebase.google.com), crie um projeto e
   adicione um app Android com o pacote **`app.solando`**.
2. Baixe o `google-services.json` e coloque em `android/app/google-services.json`.
3. Rode `npx cap sync android` e gere o APK. O plugin
   `@capacitor/push-notifications` já está instalado e o Gradle aplica o plugin
   `google-services` automaticamente quando o arquivo existe.

Sem o `google-services.json` o app compila e funciona normalmente — só o push
fica desativado.

## 6) Mudar o nome / ícone

- Nome: `android/app/src/main/res/values/strings.xml`
- Ícone: substitua os arquivos em `android/app/src/main/res/mipmap-*`
