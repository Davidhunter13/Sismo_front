// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
package co.edu.poli.sismo;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.view.View;
import android.widget.RemoteViews;

/**
 * Widget SOS 1×1 que activa la alerta con doble toque, sin abrir diálogos:
 * - Primer toque: el widget se «arma» y muestra «Toque otra vez» durante ARM_WINDOW_MS.
 * - Segundo toque (dentro de ese tiempo): abre SISMO con SismoNativePlugin.SOS_NOW_URI; MainActivity enciende
 *   de inmediato sirena, linterna y vibración, y la app crea la alerta (tipo «Sismo») y muestra su pantalla.
 * - Si no hay segundo toque, vuelve solo al estado normal.
 * El segundo toque abre la actividad directamente (PendingIntent de actividad), porque Android no deja
 * abrir pantallas desde un receptor en segundo plano.
 */
public class SosWidgetProvider extends AppWidgetProvider {

    static final String ACTION_ARM = "co.edu.poli.sismo.WIDGET_ARM";
    static final long ARM_WINDOW_MS = 4000;

    /** Hasta cuándo está armado cada widget (reloj de arranque). Se pierde si el proceso muere: queda desarmado. */
    private static final java.util.Map<Integer, Long> armedUntil = new java.util.HashMap<>();

    /** true en el widget grande (2×2). */
    protected boolean isLarge() {
        return false;
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] widgetIds) {
        for (int id : widgetIds) manager.updateAppWidget(id, buildViews(context, id, isArmed(id)));
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (!ACTION_ARM.equals(intent.getAction())) return;
        int id = intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID);
        if (id == AppWidgetManager.INVALID_APPWIDGET_ID) return;

        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        long until = SystemClock.elapsedRealtime() + ARM_WINDOW_MS;
        synchronized (armedUntil) {
            armedUntil.put(id, until);
        }
        manager.updateAppWidget(id, buildViews(context, id, true));

        // Pasado el tiempo sin segundo toque, vuelve al estado normal.
        final PendingResult pending = goAsync();
        final Context app = context.getApplicationContext();
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            try {
                if (!isArmed(id)) manager.updateAppWidget(id, buildViews(app, id, false));
            } finally {
                pending.finish();
            }
        }, ARM_WINDOW_MS + 100);
    }

    private static boolean isArmed(int id) {
        synchronized (armedUntil) {
            Long until = armedUntil.get(id);
            return until != null && SystemClock.elapsedRealtime() < until;
        }
    }

    private RemoteViews buildViews(Context context, int id, boolean armed) {
        RemoteViews views;
        if (isLarge()) {
            views = new RemoteViews(context.getPackageName(), R.layout.widget_sos_large);
            views.setTextViewText(R.id.widget_sos_circle, context.getString(armed ? R.string.widget_sos_confirm_big : R.string.widget_sos_big));
            views.setInt(R.id.widget_sos_circle, "setBackgroundResource", armed ? R.drawable.widget_sos_circle_armed : R.drawable.widget_sos_circle);
            views.setFloat(R.id.widget_sos_circle, "setTextSize", armed ? 17f : 28f);
            views.setTextViewText(R.id.widget_sos_status, context.getString(armed ? R.string.widget_sos_status_armed : R.string.widget_sos_status_idle));
        } else {
            views = new RemoteViews(context.getPackageName(), R.layout.widget_sos);
            views.setTextViewText(R.id.widget_sos_label, context.getString(armed ? R.string.widget_sos_label_armed : R.string.widget_sos_label));
            views.setViewVisibility(R.id.widget_sos_logo, armed ? View.GONE : View.VISIBLE);
            views.setViewVisibility(R.id.widget_sos_confirm, armed ? View.VISIBLE : View.GONE);
        }
        views.setContentDescription(R.id.widget_sos_button,
            context.getString(armed ? R.string.widget_sos_armed_description : R.string.widget_sos_description));
        views.setOnClickPendingIntent(R.id.widget_sos_button, armed ? activatePendingIntent(context, id) : armPendingIntent(context, id));
        return views;
    }

    private PendingIntent armPendingIntent(Context context, int id) {
        Intent intent = new Intent(context, getClass())
            .setAction(ACTION_ARM)
            .putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, id);
        return PendingIntent.getBroadcast(context, id, intent, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    private static PendingIntent activatePendingIntent(Context context, int id) {
        Intent intent = new Intent(Intent.ACTION_VIEW, SismoNativePlugin.SOS_NOW_URI, context, MainActivity.class)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        return PendingIntent.getActivity(context, id, intent, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    /** Tras activar la alerta, todos los widgets (chicos y grandes) vuelven al estado normal. */
    static void resetAll(Context context) {
        synchronized (armedUntil) {
            armedUntil.clear();
        }
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        for (Class<?> cls : new Class<?>[] { SosWidgetProvider.class, SosWidgetLargeProvider.class }) {
            int[] ids = manager.getAppWidgetIds(new ComponentName(context, cls));
            if (ids.length == 0) continue;
            Intent update = new Intent(context, cls)
                .setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE)
                .putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids);
            context.sendBroadcast(update);
        }
    }
}
