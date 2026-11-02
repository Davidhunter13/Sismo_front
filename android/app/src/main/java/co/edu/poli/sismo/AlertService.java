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
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import androidx.core.app.ServiceCompat;

/**
 * Servicio en primer plano que mantiene las señales de la alerta aunque la pantalla se bloquee
 * o la app pase a segundo plano: sonido (sirena o silbato, AudioTrack sin archivos), linterna en código SOS
 * (CameraManager.setTorchMode, no abre la cámara), vibración SOS y «modo atrapado» (ráfagas periódicas
 * para ahorrar batería). Se detiene solo cuando ninguna señal está activa.
 */
public class AlertService extends Service {

    public static final String ACTION_START_SIREN = "co.edu.poli.sismo.START_SIREN";
    public static final String ACTION_STOP_SIREN = "co.edu.poli.sismo.STOP_SIREN";
    public static final String ACTION_START_TORCH = "co.edu.poli.sismo.START_TORCH";
    public static final String ACTION_STOP_TORCH = "co.edu.poli.sismo.STOP_TORCH";
    public static final String ACTION_START_VIBRATION = "co.edu.poli.sismo.START_VIBRATION";
    public static final String ACTION_STOP_VIBRATION = "co.edu.poli.sismo.STOP_VIBRATION";
    public static final String ACTION_START_TRAPPED = "co.edu.poli.sismo.START_TRAPPED";
    public static final String ACTION_STOP_TRAPPED = "co.edu.poli.sismo.STOP_TRAPPED";
    public static final String ACTION_STOP_ALL = "co.edu.poli.sismo.STOP_ALL";

    public static final String EXTRA_SOUND = "sound";
    public static final String EXTRA_INTERVAL_MS = "intervalMs";
    public static final String SOUND_WHISTLE = "silbato";

    private static final String CHANNEL_ID = "sismo_alerta";
    private static final int NOTIFICATION_ID = 1001;
    private static final int RATE = 44100;

    // Código SOS (··· ––– ···). Unidad de 250 ms: punto = 1, raya = 3, pausa entre señales = 1,
    // entre letras = 3, entre repeticiones = 7. Valores alternan encendido/apagado empezando por encendido.
    private static final long U = 250;
    private static final long[] SOS_ON_OFF = {
        U, U, U, U, U, 3 * U,
        3 * U, U, 3 * U, U, 3 * U, 3 * U,
        U, U, U, U, U, 7 * U,
    };

    // Silbato de rescate: tres pitidos (señal internacional de auxilio) y una pausa.
    private static final long[] WHISTLE_ON_OFF = { 1000, 500, 1000, 500, 1000, 2000 };

    static volatile boolean sirenOn = false;
    static volatile boolean torchOn = false;
    static volatile boolean vibrationOn = false;
    static volatile boolean trappedOn = false;

    private volatile String sound = "sirena";
    private Thread sirenThread;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private int torchStep = 0;
    private boolean torchSingleCycle = false;
    private String torchCameraId;
    private long trappedIntervalMs = 3 * 60_000L;
    private PowerManager.WakeLock wakeLock;

    public static boolean isAnyActive() {
        return sirenOn || torchOn || vibrationOn || trappedOn;
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
                case ACTION_START_SIREN: startSiren(intent.getStringExtra(EXTRA_SOUND)); break;
                case ACTION_STOP_SIREN: stopSiren(); break;
                case ACTION_START_TORCH: startTorch(false); break;
                case ACTION_STOP_TORCH: stopTorch(); break;
                case ACTION_START_VIBRATION: startVibration(); break;
                case ACTION_STOP_VIBRATION: stopVibration(); break;
                case ACTION_START_TRAPPED: startTrapped(intent.getLongExtra(EXTRA_INTERVAL_MS, trappedIntervalMs)); break;
                case ACTION_STOP_TRAPPED: stopTrapped(); break;
                case ACTION_STOP_ALL: stopSiren(); stopTorch(); stopVibration(); stopTrapped(); break;
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
        stopTrapped();
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
        if (trappedOn) text.append("Modo atrapado: señales cada ").append(trappedIntervalMs / 60_000).append(" min");
        if (sirenOn) text.append(text.length() > 0 ? " · " : "").append(SOUND_WHISTLE.equals(sound) ? "Silbato" : "Sirena");
        if (torchOn && !trappedOn) text.append(text.length() > 0 ? " · " : "").append("Linterna SOS");
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
            b.addAction(0, "Silenciar sonido", silencePi);
        }
        return b.build();
    }

    private void stopSelfCompletely() {
        ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE);
        stopSelf();
    }

    // ---------- Sonido: sirena o silbato ----------

    private void startSiren(String requested) {
        if (sirenOn) return;
        sound = SOUND_WHISTLE.equals(requested) ? SOUND_WHISTLE : "sirena";
        sirenOn = true;
        sirenThread = new Thread(() -> playLoop(sound, true), "sismo-siren");
        sirenThread.start();
    }

    private void stopSiren() {
        sirenOn = false;
        if (sirenThread != null) {
            sirenThread.interrupt();
            sirenThread = null;
        }
    }

    private AudioTrack newTrack() {
        int minBuf = AudioTrack.getMinBufferSize(RATE, AudioFormat.CHANNEL_OUT_MONO, AudioFormat.ENCODING_PCM_16BIT);
        return new AudioTrack.Builder()
            .setAudioAttributes(new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build())
            .setAudioFormat(new AudioFormat.Builder()
                .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                .setSampleRate(RATE)
                .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                .build())
            .setBufferSizeInBytes(Math.max(minBuf, RATE / 5 * 2))
            .setTransferMode(AudioTrack.MODE_STREAM)
            .build();
    }

    /**
     * Sirena: diente de sierra con barrido 600–1200 Hz a 1,2 Hz (igual que la versión web).
     * Silbato: tono de ~3,1 kHz (se oye mejor entre escombros) en el patrón de tres pitidos.
     * Con loop = false reproduce un solo ciclo de silbato (ráfaga del modo atrapado).
     */
    private void playLoop(String kind, boolean loop) {
        boolean whistle = SOUND_WHISTLE.equals(kind);
        long cycleMs = 0;
        for (long v : WHISTLE_ON_OFF) cycleMs += v;
        final long cycleSamples = cycleMs * RATE / 1000;

        AudioTrack track = newTrack();
        short[] buf = new short[RATE / 20];
        double phase = 0;
        double lfoPhase = 0;
        long n = 0;
        final double amplitude = 0.5 * Short.MAX_VALUE;
        try {
            track.play();
            while (!Thread.currentThread().isInterrupted() && (loop ? sirenOn : n < cycleSamples)) {
                for (int i = 0; i < buf.length; i++, n++) {
                    if (whistle) {
                        boolean on = whistleGate(n % cycleSamples);
                        double freq = 3150 + 60 * Math.sin(lfoPhase);
                        lfoPhase += 2 * Math.PI * 25 / RATE;
                        phase += freq / RATE;
                        if (phase >= 1) phase -= 1;
                        buf[i] = on ? (short) (amplitude * Math.sin(2 * Math.PI * phase)) : 0;
                    } else {
                        double freq = 900 + 300 * Math.sin(lfoPhase);
                        lfoPhase += 2 * Math.PI * 1.2 / RATE;
                        phase += freq / RATE;
                        if (phase >= 1) phase -= 1;
                        buf[i] = (short) (amplitude * (2 * phase - 1));
                    }
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

    /** true si la muestra cae en un pitido (posiciones pares del patrón). */
    private static boolean whistleGate(long sampleInCycle) {
        long ms = sampleInCycle * 1000 / RATE;
        long acc = 0;
        for (int i = 0; i < WHISTLE_ON_OFF.length; i++) {
            acc += WHISTLE_ON_OFF[i];
            if (ms < acc) return i % 2 == 0;
        }
        return false;
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

    /** @param singleCycle true = un solo ciclo SOS (ráfaga del modo atrapado). */
    private void startTorch(boolean singleCycle) {
        if (torchOn) return;
        torchCameraId = findFlashCamera(this);
        if (torchCameraId == null) return;
        torchOn = true;
        torchSingleCycle = singleCycle;
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
            if (torchSingleCycle && torchStep == 0) {
                handler.postDelayed(() -> {
                    stopTorch();
                    if (!isAnyActive()) stopSelfCompletely(); else updateNotification();
                }, wait);
                return;
            }
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

    // ---------- Modo atrapado ----------

    /**
     * Apaga las señales continuas y emite cada intervalo una ráfaga corta (tres pitidos + un ciclo de linterna SOS).
     * Mantiene la CPU despierta con un WakeLock parcial para que las ráfagas sigan con la pantalla apagada.
     */
    private void startTrapped(long intervalMs) {
        stopSiren();
        stopTorch();
        stopVibration();
        trappedIntervalMs = Math.max(30_000L, intervalMs);
        if (trappedOn) return;
        trappedOn = true;
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (pm != null) {
            wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "sismo:atrapado");
            wakeLock.setReferenceCounted(false);
            wakeLock.acquire();
        }
        handler.post(trappedBurst);
    }

    private void stopTrapped() {
        if (!trappedOn) return;
        trappedOn = false;
        handler.removeCallbacks(trappedBurst);
        stopTorch();
        if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
        wakeLock = null;
    }

    private final Runnable trappedBurst = new Runnable() {
        @Override
        public void run() {
            if (!trappedOn) return;
            new Thread(() -> playLoop(SOUND_WHISTLE, false), "sismo-burst").start();
            startTorch(true);
            handler.postDelayed(this, trappedIntervalMs);
        }
    };
}
