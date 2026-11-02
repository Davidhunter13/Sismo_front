// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
package co.edu.poli.sismo;

import android.app.PendingIntent;
import android.content.Intent;
import android.os.Build;
import android.service.quicksettings.Tile;
import android.service.quicksettings.TileService;

/**
 * Acceso rápido «SOS SISMO» en el panel de ajustes rápidos de Android.
 * Abre SISMO con el diálogo de SOS listo; la alerta se confirma en la app para evitar activaciones accidentales.
 */
public class SosTileService extends TileService {

    @Override
    public void onStartListening() {
        super.onStartListening();
        Tile tile = getQsTile();
        if (tile == null) return;
        tile.setState(Tile.STATE_ACTIVE);
        tile.setLabel("SOS SISMO");
        tile.updateTile();
    }

    @Override
    public void onClick() {
        super.onClick();
        if (isLocked()) unlockAndRun(this::openSos);
        else openSos();
    }

    private void openSos() {
        Intent intent = new Intent(Intent.ACTION_VIEW, SismoNativePlugin.SOS_URI, this, MainActivity.class)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            PendingIntent pi = PendingIntent.getActivity(this, 0, intent, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
            startActivityAndCollapse(pi);
        } else {
            startActivityAndCollapseLegacy(intent);
        }
    }

    @SuppressWarnings("deprecation")
    private void startActivityAndCollapseLegacy(Intent intent) {
        startActivityAndCollapse(intent);
    }
}
