// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
package co.edu.poli.sismo;

import android.content.Intent;
import android.os.Bundle;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Plugin propio de la app (señales en segundo plano, accesos SOS, exportar CSV).
        registerPlugin(SismoNativePlugin.class);
        super.onCreate(savedInstanceState);
        // Solo en el primer arranque: al recrear la actividad no se repite la activación.
        if (savedInstanceState == null) startSignalsIfSosNow(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        startSignalsIfSosNow(intent);
        super.onNewIntent(intent);
    }

    /**
     * Segundo toque del widget: las señales arrancan aquí, sin esperar a que cargue la app web (cada segundo
     * cuenta). Luego la app crea la alerta y apaga las señales que el usuario tenga desactivadas en Configuración.
     */
    private void startSignalsIfSosNow(Intent intent) {
        if (intent == null || !SismoNativePlugin.SOS_NOW_URI.equals(intent.getData())) return;
        ContextCompat.startForegroundService(this, new Intent(this, AlertService.class).setAction(AlertService.ACTION_START_SIREN));
        ContextCompat.startForegroundService(this, new Intent(this, AlertService.class).setAction(AlertService.ACTION_START_VIBRATION));
        if (AlertService.findFlashCamera(this) != null) {
            ContextCompat.startForegroundService(this, new Intent(this, AlertService.class).setAction(AlertService.ACTION_START_TORCH));
        }
        SosWidgetProvider.resetAll(this);
    }
}
