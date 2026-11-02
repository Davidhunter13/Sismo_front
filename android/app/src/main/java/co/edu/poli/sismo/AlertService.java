// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
package co.edu.poli.sismo;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.hardware.camera2.CameraAccessException;
import android.hardware.camera2.CameraCharacteristics;
import android.hardware.camera2.CameraManager;
import android.media.AudioAttributes;
import android.media.AudioFormat;
import android.media.AudioTrack;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import androidx.core.app.ServiceCompat;

/**
 * Servicio en primer plano que mantiene las señales de la alerta aunque la pantalla se bloquee
 * o la app pase a segundo plano: sirena (AudioTrack, sin archivos), linterna en código SOS
 * (CameraManager.setTorchMode, no abre la cámara) y vibración en patrón SOS.
 * Se detiene solo cuando ninguna señal está activa.
 */
public class AlertService extends Service {

    public static final String ACTION_START_SIREN = "co.edu.poli.sismo.START_SIREN";
    public static final String ACTION_STOP_SIREN = "co.edu.poli.sismo.STOP_SIREN";
    public static final String ACTION_START_TORCH = "co.edu.poli.sismo.START_TORCH";
    public static final String ACTION_STOP_TORCH = "co.edu.poli.sismo.STOP_TORCH";
    public static final String ACTION_START_VIBRATION = "co.edu.poli.sismo.START_VIBRATION";
    public static final String ACTION_STOP_VIBRATION = "co.edu.poli.sismo.STOP_VIBRATION";
    public static final String ACTION_STOP_ALL = "co.edu.poli.sismo.STOP_ALL";

    private static final String CHANNEL_ID = "sismo_alerta";
    private static final int NOTIFICATION_ID = 1001;

    // Código SOS (··· ––– ···). Unidad de 250 ms: punto = 1, raya = 3, pausa entre señales = 1,
    // entre letras = 3, entre repeticiones = 7. Valores alternan encendido/apagado empezando por encendido.
    private static final long U = 250;
    private static final long[] SOS_ON_OFF = {
        U, U, U, U, U, 3 * U,
        3 * U, U, 3 * U, U, 3 * U, 3 * U,
        U, U, U, U, U, 7 * U,
    };

    static volatile boolean sirenOn = false;
    static volatile boolean torchOn = false;
    static volatile boolean vibrationOn = false;

    private Thread sirenThread;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private int torchStep = 0;
    private String torchCameraId;

    public static boolean isAnyActive() {
        return sirenOn || torchOn || vibrationOn;
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        startInForeground();
        String action = intent != null ? intent.getAction() : null;
        if (action != null) {
            switch (action) {
                case ACTION_START_SIREN: startSiren(); break;
                case ACTION_STOP_SIREN: stopSiren(); break;
                case ACTION_START_TORCH: startTorch(); break;
                case ACTION_STOP_TORCH: stopTorch(); break;
                case ACTION_START_VIBRATION: startVibration(); break;
                case ACTION_STOP_VIBRATION: stopVibration(); break;
                case ACTION_STOP_ALL: stopSiren(); stopTorch(); stopVibration(); break;
                default: break;
            }
        }
        if (!isAnyActive()) {
            stopSelfCompletely();
        } else {
            updateNotification();
        }
        return START_NOT_STICKY;
    }

    @Override
    public void onDestroy() {
        stopSiren();
        stopTorch();
        stopVibration();
        super.onDestroy();
    }

    // ---------- Notificación en primer plano ----------

    private void startInForeground() {
        createChannel();
        int type = Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q ? ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK : 0;
        ServiceCompat.startForeground(this, NOTIFICATION_ID, buildNotification(), type);
    }

    private void updateNotification() {
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) nm.notify(NOTIFICATION_ID, buildNotification());
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null || nm.getNotificationChannel(CHANNEL_ID) != null) return;
        NotificationChannel channel = new NotificationChannel(CHANNEL_ID, "Alerta activa", NotificationManager.IMPORTANCE_HIGH);
        channel.setDescription("Se muestra mientras la sirena, la linterna o la vibración de una alerta están activas.");
        channel.setSound(null, null);
        channel.enableVibration(false);
        nm.createNotificationChannel(channel);
    }

    private Notification buildNotification() {
        int immutable = Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0;
        Intent open = new Intent(this, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent openPi = PendingIntent.getActivity(this, 0, open, PendingIntent.FLAG_UPDATE_CURRENT | immutable);

        StringBuilder text = new StringBuilder();
        if (sirenOn) text.append("Sirena");
        if (torchOn) text.append(text.length() > 0 ? " · " : "").append("Linterna SOS");
        if (vibrationOn) text.append(text.length() > 0 ? " · " : "").append("Vibración");

        NotificationCompat.Builder b = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_tile_sos)
            .setContentTitle("Alerta SISMO activa")
            .setContentText(text.length() > 0 ? text.toString() : "Señales de alerta")
            .setContentIntent(openPi)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_ALARM);

        if (sirenOn) {
            Intent silence = new Intent(this, AlertService.class).setAction(ACTION_STOP_SIREN);
            PendingIntent silencePi = PendingIntent.getService(this, 1, silence, PendingIntent.FLAG_UPDATE_CURRENT | immutable);
            b.addAction(0, "Silenciar sirena", silencePi);
        }
        return b.build();
    }

    private void stopSelfCompletely() {
        ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE);
        stopSelf();
    }

    // ---------- Sirena ----------

    private void startSiren() {
        if (sirenOn) return;
        sirenOn = true;
        sirenThread = new Thread(this::sirenLoop, "sismo-siren");
        sirenThread.start();
    }

    private void stopSiren() {
        sirenOn = false;
        if (sirenThread != null) {
            sirenThread.interrupt();
            sirenThread = null;
        }
    }

    /** Onda diente de sierra con barrido 600–1200 Hz a 1,2 Hz (mismo sonido que la versión web). */
    private void sirenLoop() {
        final int rate = 44100;
        int minBuf = AudioTrack.getMinBufferSize(rate, AudioFormat.CHANNEL_OUT_MONO, AudioFormat.ENCODING_PCM_16BIT);
        AudioTrack track = new AudioTrack.Builder()
            .setAudioAttributes(new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build())
            .setAudioFormat(new AudioFormat.Builder()
                .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                .setSampleRate(rate)
                .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                .build())
            .setBufferSizeInBytes(Math.max(minBuf, rate / 5 * 2))
            .setTransferMode(AudioTrack.MODE_STREAM)
            .build();
        short[] buf = new short[rate / 20];
        double phase = 0;
        double lfoPhase = 0;
        final double amplitude = 0.5 * Short.MAX_VALUE;
        try {
            track.play();
            while (sirenOn && !Thread.currentThread().isInterrupted()) {
                for (int i = 0; i < buf.length; i++) {
                    double freq = 900 + 300 * Math.sin(lfoPhase);
                    lfoPhase += 2 * Math.PI * 1.2 / rate;
                    phase += freq / rate;
                    if (phase >= 1) phase -= 1;
                    buf[i] = (short) (amplitude * (2 * phase - 1));
                }
                track.write(buf, 0, buf.length);
            }
        } finally {
            try {
                track.stop();
            } catch (IllegalStateException ignored) {
                // Ya detenido.
            }
            track.release();
        }
    }

    // ---------- Linterna SOS ----------

    static String findFlashCamera(Context ctx) {
        CameraManager cm = (CameraManager) ctx.getSystemService(Context.CAMERA_SERVICE);
        if (cm == null) return null;
        try {
            for (String id : cm.getCameraIdList()) {
                Boolean flash = cm.getCameraCharacteristics(id).get(CameraCharacteristics.FLASH_INFO_AVAILABLE);
                if (Boolean.TRUE.equals(flash)) return id;
            }
        } catch (CameraAccessException ignored) {
            // Sin acceso a la cámara: no hay linterna.
        }
        return null;
    }

    private void startTorch() {
        if (torchOn) return;
        torchCameraId = findFlashCamera(this);
        if (torchCameraId == null) return;
        torchOn = true;
        torchStep = 0;
        handler.post(torchTick);
    }

    private void stopTorch() {
        torchOn = false;
        handler.removeCallbacks(torchTick);
        setTorch(false);
    }

    private final Runnable torchTick = new Runnable() {
        @Override
        public void run() {
            if (!torchOn) return;
            boolean on = torchStep % 2 == 0;
            setTorch(on);
            long wait = SOS_ON_OFF[torchStep];
            torchStep = (torchStep + 1) % SOS_ON_OFF.length;
            handler.postDelayed(this, wait);
        }
    };

    private void setTorch(boolean on) {
        if (torchCameraId == null) return;
        CameraManager cm = (CameraManager) getSystemService(Context.CAMERA_SERVICE);
        if (cm == null) return;
        try {
            cm.setTorchMode(torchCameraId, on);
        } catch (CameraAccessException | IllegalArgumentException e) {
            // Otra app usa la cámara: se detiene la linterna para no reintentar en bucle.
            torchOn = false;
            handler.removeCallbacks(torchTick);
        }
    }

    // ---------- Vibración SOS ----------

    private Vibrator vibrator() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            VibratorManager vm = (VibratorManager) getSystemService(Context.VIBRATOR_MANAGER_SERVICE);
            return vm != null ? vm.getDefaultVibrator() : null;
        }
        return (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
    }

    private void startVibration() {
        Vibrator v = vibrator();
        if (vibrationOn || v == null || !v.hasVibrator()) return;
        vibrationOn = true;
        // createWaveform espera [espera, vibra, espera, vibra...]: se antepone una espera de 0.
        long[] pattern = new long[SOS_ON_OFF.length + 1];
        pattern[0] = 0;
        System.arraycopy(SOS_ON_OFF, 0, pattern, 1, SOS_ON_OFF.length);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            v.vibrate(VibrationEffect.createWaveform(pattern, 0));
        } else {
            v.vibrate(pattern, 0);
        }
    }

    private void stopVibration() {
        if (!vibrationOn) return;
        vibrationOn = false;
        Vibrator v = vibrator();
        if (v != null) v.cancel();
    }
}
