# Habilitar microfone no APK (WebView Android)

O app web já pede o microfone no clique certo. Para o Android mostrar o diálogo de permissão, o **wrapper APK** precisa das 3 alterações abaixo. Sem elas, o `getUserMedia` falha silenciosamente dentro do WebView.

> Se você gerou o APK com **PWABuilder / Bubblewrap (TWA)**, pule tudo — o TWA usa o Chrome real e o microfone funciona automaticamente. Basta permitir quando o Chrome pedir.

---

## 1. `AndroidManifest.xml`

Adicione dentro de `<manifest>`, antes de `<application>`:

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
<uses-permission android:name="android.permission.INTERNET" />

<uses-feature android:name="android.hardware.microphone" android:required="false" />
```

---

## 2. Pedir permissão em runtime (Android 6+)

Na sua `MainActivity` (Kotlin):

```kotlin
import android.Manifest
import android.content.pm.PackageManager
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

private val MIC_REQUEST_CODE = 1001

override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    // ... seu setup do WebView ...

    if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
        != PackageManager.PERMISSION_GRANTED) {
        ActivityCompat.requestPermissions(
            this,
            arrayOf(Manifest.permission.RECORD_AUDIO, Manifest.permission.MODIFY_AUDIO_SETTINGS),
            MIC_REQUEST_CODE
        )
    }
}
```

Em Java, equivalente:

```java
if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
        != PackageManager.PERMISSION_GRANTED) {
    ActivityCompat.requestPermissions(this,
        new String[]{Manifest.permission.RECORD_AUDIO, Manifest.permission.MODIFY_AUDIO_SETTINGS},
        1001);
}
```

---

## 3. Liberar o pedido do JS dentro do WebView

O passo mais esquecido. Sem isso, mesmo com permissão do sistema o `navigator.mediaDevices.getUserMedia` **retorna erro**.

```kotlin
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient

webView.settings.javaScriptEnabled = true
webView.settings.mediaPlaybackRequiresUserGesture = false

webView.webChromeClient = object : WebChromeClient() {
    override fun onPermissionRequest(request: PermissionRequest) {
        runOnUiThread {
            val wanted = request.resources.filter {
                it == PermissionRequest.RESOURCE_AUDIO_CAPTURE ||
                it == PermissionRequest.RESOURCE_VIDEO_CAPTURE
            }.toTypedArray()
            if (wanted.isNotEmpty()) request.grant(wanted) else request.deny()
        }
    }
}
```

Em Java:

```java
webView.setWebChromeClient(new WebChromeClient() {
    @Override
    public void onPermissionRequest(final PermissionRequest request) {
        runOnUiThread(() -> {
            request.grant(request.getResources());
        });
    }
});
```

---

## 4. Se o app for **debug build** e você usar `http://`

Adicione no `<application>` do manifest:

```xml
android:usesCleartextTraffic="true"
```

Em produção use HTTPS — o mic não funciona em origem insegura.

---

## Checklist rápido

- [ ] `RECORD_AUDIO` no `AndroidManifest.xml`
- [ ] `ActivityCompat.requestPermissions(...)` no `onCreate`
- [ ] `onPermissionRequest` do `WebChromeClient` chamando `request.grant(...)`
- [ ] App servido via HTTPS
- [ ] Usuário deu permissão em Configurações → Apps → Permissões → Microfone
