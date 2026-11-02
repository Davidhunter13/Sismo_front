// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
package co.edu.poli.sismo;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.BatteryManager;
import android.os.Build;
import android.provider.ContactsContract;
import android.speech.tts.TextToSpeech;
import android.view.WindowManager;
import androidx.activity.result.ActivityResult;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Locale;

/**
 * Puente entre la app web y Android: señales de alerta en segundo plano (AlertService),
 * pantalla encendida, accesos de SOS (widget y acceso rápido) y compartir el CSV de métricas.
 */
@CapacitorPlugin(
    name = "SismoNative",
    permissions = { @Permission(alias = "notifications", strings = { Manifest.permission.POST_NOTIFICATIONS }) }
)
public class SismoNativePlugin extends Plugin {

    /** Enlace que abren el widget y el acceso rápido. */
    static final Uri SOS_URI = Uri.parse("sismo://sos");

    // ---------- Señales ----------

    private void sendToService(String action, boolean start) {
        Context ctx = getContext();
        // Una orden de detener no debe arrancar el servicio si no está corriendo.
        if (!start && !AlertService.isAnyActive()) return;
        Intent intent = new Intent(ctx, AlertService.class).setAction(action);
        if (start) ContextCompat.startForegroundService(ctx, intent);
        else ctx.startService(intent);
    }

    @PluginMethod
    public void startSiren(PluginCall call) {
        if (AlertService.sirenOn) {
            call.resolve();
            return;
        }
        Intent intent = new Intent(getContext(), AlertService.class)
            .setAction(AlertService.ACTION_START_SIREN)
            .putExtra(AlertService.EXTRA_SOUND, call.getString("sound", "sirena"));
        ContextCompat.startForegroundService(getContext(), intent);
        call.resolve();
    }

    // ---------- Modo atrapado ----------

    @PluginMethod
    public void startTrapped(PluginCall call) {
        Integer interval = call.getInt("intervalMs", 180_000);
        Intent intent = new Intent(getContext(), AlertService.class)
            .setAction(AlertService.ACTION_START_TRAPPED)
            .putExtra(AlertService.EXTRA_INTERVAL_MS, interval != null ? interval.longValue() : 180_000L);
        ContextCompat.startForegroundService(getContext(), intent);
        call.resolve();
    }

    @PluginMethod
    public void stopTrapped(PluginCall call) {
        sendToService(AlertService.ACTION_STOP_TRAPPED, false);
        call.resolve();
    }

    /** Brillo de la ventana: 0–1, o -1 para volver al del sistema. */
    @PluginMethod
    public void setBrightness(PluginCall call) {
        Double level = call.getDouble("level", -1.0);
        float value = level == null || level < 0 ? WindowManager.LayoutParams.BRIGHTNESS_OVERRIDE_NONE : (float) Math.min(1.0, level);
        getActivity().runOnUiThread(() -> {
            WindowManager.LayoutParams lp = getActivity().getWindow().getAttributes();
            lp.screenBrightness = value;
            getActivity().getWindow().setAttributes(lp);
        });
        call.resolve();
    }

    // ---------- Batería ----------

    @PluginMethod
    public void getBattery(PluginCall call) {
        BatteryManager bm = (BatteryManager) getContext().getSystemService(Context.BATTERY_SERVICE);
        JSObject ret = new JSObject();
        if (bm == null) {
            call.reject("Batería no disponible.");
            return;
        }
        ret.put("level", bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY));
        ret.put("charging", bm.isCharging());
        call.resolve(ret);
    }

    // ---------- Lectura en voz alta ----------

    private TextToSpeech tts;
    private boolean ttsReady = false;

    @PluginMethod
    public void speak(PluginCall call) {
        String text = call.getString("text", "");
        if (text == null || text.isEmpty()) {
            call.reject("Texto vacío.");
            return;
        }
        if (tts == null) {
            tts = new TextToSpeech(getContext(), status -> {
                ttsReady = status == TextToSpeech.SUCCESS;
                if (ttsReady) {
                    int res = tts.setLanguage(new Locale("es", "CO"));
                    if (res == TextToSpeech.LANG_MISSING_DATA || res == TextToSpeech.LANG_NOT_SUPPORTED) tts.setLanguage(new Locale("es"));
                    tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "sismo");
                }
            });
            call.resolve();
            return;
        }
        if (!ttsReady) {
            call.reject("La voz del sistema no está disponible.");
            return;
        }
        tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "sismo");
        call.resolve();
    }

    @PluginMethod
    public void stopSpeaking(PluginCall call) {
        if (tts != null) tts.stop();
        call.resolve();
    }

    @PluginMethod
    public void isSpeaking(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("speaking", tts != null && tts.isSpeaking());
        call.resolve(ret);
    }

    @Override
    protected void handleOnDestroy() {
        if (tts != null) {
            tts.shutdown();
            tts = null;
        }
        super.handleOnDestroy();
    }

    // ---------- Importar contacto de la agenda ----------

    /**
     * Abre el selector de contactos del sistema. No requiere el permiso READ_CONTACTS:
     * el sistema concede acceso temporal solo al contacto elegido.
     */
    @PluginMethod
    public void pickContact(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_PICK, ContactsContract.CommonDataKinds.Phone.CONTENT_URI);
        startActivityForResult(call, intent, "pickContactResult");
    }

    @ActivityCallback
    private void pickContactResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        JSObject ret = new JSObject();
        Intent data = result.getData();
        if (result.getResultCode() != Activity.RESULT_OK || data == null || data.getData() == null) {
            ret.put("cancelled", true);
            call.resolve(ret);
            return;
        }
        String[] projection = {
            ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
            ContactsContract.CommonDataKinds.Phone.NUMBER,
        };
        try (Cursor c = getContext().getContentResolver().query(data.getData(), projection, null, null, null)) {
            if (c != null && c.moveToFirst()) {
                ret.put("cancelled", false);
                ret.put("name", c.getString(0));
                ret.put("phone", c.getString(1));
                call.resolve(ret);
                return;
            }
        } catch (SecurityException e) {
            call.reject("Sin acceso al contacto elegido.");
            return;
        }
        ret.put("cancelled", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void stopSiren(PluginCall call) {
        sendToService(AlertService.ACTION_STOP_SIREN, false);
        call.resolve();
    }

    @PluginMethod
    public void startTorch(PluginCall call) {
        if (AlertService.findFlashCamera(getContext()) == null) {
            call.reject("Este dispositivo no tiene flash.", "NO_FLASH");
            return;
        }
        sendToService(AlertService.ACTION_START_TORCH, true);
        call.resolve();
    }

    @PluginMethod
    public void stopTorch(PluginCall call) {
        sendToService(AlertService.ACTION_STOP_TORCH, false);
        call.resolve();
    }

    @PluginMethod
    public void startVibration(PluginCall call) {
        sendToService(AlertService.ACTION_START_VIBRATION, true);
        call.resolve();
    }

    @PluginMethod
    public void stopVibration(PluginCall call) {
        sendToService(AlertService.ACTION_STOP_VIBRATION, false);
        call.resolve();
    }

    @PluginMethod
    public void stopAll(PluginCall call) {
        sendToService(AlertService.ACTION_STOP_ALL, false);
        call.resolve();
    }

    /** Estado real de las señales (p. ej. si se silenció desde la notificación). */
    @PluginMethod
    public void getStatus(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("siren", AlertService.sirenOn);
        ret.put("torch", AlertService.torchOn);
        ret.put("vibration", AlertService.vibrationOn);
        ret.put("trapped", AlertService.trappedOn);
        ret.put("hasFlash", AlertService.findFlashCamera(getContext()) != null);
        call.resolve(ret);
    }

    // ---------- Pantalla encendida ----------

    @PluginMethod
    public void setKeepScreenOn(PluginCall call) {
        boolean on = Boolean.TRUE.equals(call.getBoolean("on", false));
        getActivity().runOnUiThread(() -> {
            if (on) getActivity().getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            else getActivity().getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        });
        call.resolve();
    }

    // ---------- Permiso de notificaciones (Android 13+) ----------

    @PluginMethod
    public void requestNotifications(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU || getPermissionState("notifications") == PermissionState.GRANTED) {
            resolveNotifications(call);
            return;
        }
        requestPermissionForAlias("notifications", call, "notificationsCallback");
    }

    @PermissionCallback
    private void notificationsCallback(PluginCall call) {
        resolveNotifications(call);
    }

    private void resolveNotifications(PluginCall call) {
        JSObject ret = new JSObject();
        boolean granted = Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU
            || getPermissionState("notifications") == PermissionState.GRANTED;
        ret.put("granted", granted);
        call.resolve(ret);
    }

    // ---------- Accesos de SOS (widget y acceso rápido) ----------

    /** Devuelve y consume la acción con la que se abrió la app ("sos" o null). */
    @PluginMethod
    public void consumeLaunchAction(PluginCall call) {
        JSObject ret = new JSObject();
        Intent intent = getActivity().getIntent();
        if (intent != null && SOS_URI.equals(intent.getData())) {
            ret.put("action", "sos");
            intent.setData(null);
        } else {
            ret.put("action", (String) null);
        }
        call.resolve(ret);
    }

    @Override
    protected void handleOnNewIntent(Intent intent) {
        super.handleOnNewIntent(intent);
        if (intent != null && SOS_URI.equals(intent.getData())) {
            intent.setData(null);
            notifyListeners("sosRequested", new JSObject(), true);
        }
    }

    // ---------- Compartir CSV ----------

    @PluginMethod
    public void shareCsv(PluginCall call) {
        String filename = call.getString("filename", "sismo-metricas.csv");
        String content = call.getString("content", "");
        // Solo un nombre de archivo simple: evita rutas fuera de la caché.
        if (filename == null || !filename.matches("[A-Za-z0-9._-]{1,80}")) {
            call.reject("Nombre de archivo no válido.");
            return;
        }
        try {
            File dir = new File(getContext().getCacheDir(), "export");
            if (!dir.exists() && !dir.mkdirs()) throw new IOException("No se pudo crear la carpeta.");
            File file = new File(dir, filename);
            try (FileOutputStream out = new FileOutputStream(file)) {
                out.write(content.getBytes(StandardCharsets.UTF_8));
            }
            Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", file);
            Intent send = new Intent(Intent.ACTION_SEND)
                .setType("text/csv")
                .putExtra(Intent.EXTRA_STREAM, uri)
                .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            getActivity().startActivity(Intent.createChooser(send, "Exportar métricas"));
            call.resolve();
        } catch (IOException | IllegalArgumentException e) {
            call.reject("No se pudo exportar: " + e.getMessage());
        }
    }
}
