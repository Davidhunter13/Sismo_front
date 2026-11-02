package co.edu.poli.sismo;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Plugin propio de la app (señales en segundo plano, accesos SOS, exportar CSV).
        registerPlugin(SismoNativePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
