// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
package co.edu.poli.sismo;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;

/** Widget de pantalla de inicio con un botón SOS que abre SISMO con el diálogo de alerta listo. */
public class SosWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] widgetIds) {
        Intent intent = new Intent(Intent.ACTION_VIEW, SismoNativePlugin.SOS_URI, context, MainActivity.class)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pi = PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        for (int id : widgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_sos);
            views.setOnClickPendingIntent(R.id.widget_sos_button, pi);
            manager.updateAppWidget(id, views);
        }
    }
}
