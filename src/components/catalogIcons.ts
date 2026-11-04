// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import {
  Activity, AlertOctagon, AlertTriangle, Backpack, Building2, Car, CircleHelp, ClipboardList, DoorOpen, Droplets, Flame,
  FlaskConical, Flashlight, HeartHandshake, HeartPulse, Home, LifeBuoy, MapPin, MessageSquareText, Package, Phone, Radio,
  ShieldAlert, Siren, Trees, Users, Waves, Wind, Wrench, Zap, type LucideIcon,
} from 'lucide-react';

/**
 * Íconos que el panel administrativo puede asignar a los catálogos (tipos de evento, tarjetas de la guía).
 * La lista de nombres debe coincidir con la del panel (ICONOS en la vista del panel).
 */
export const CATALOG_ICONS: Record<string, LucideIcon> = {
  activity: Activity,
  'alert-octagon': AlertOctagon,
  'alert-triangle': AlertTriangle,
  backpack: Backpack,
  building: Building2,
  car: Car,
  'clipboard-list': ClipboardList,
  'door-open': DoorOpen,
  droplets: Droplets,
  flame: Flame,
  flask: FlaskConical,
  flashlight: Flashlight,
  'heart-handshake': HeartHandshake,
  'heart-pulse': HeartPulse,
  home: Home,
  'life-buoy': LifeBuoy,
  'map-pin': MapPin,
  message: MessageSquareText,
  package: Package,
  phone: Phone,
  radio: Radio,
  'shield-alert': ShieldAlert,
  siren: Siren,
  trees: Trees,
  users: Users,
  waves: Waves,
  wind: Wind,
  wrench: Wrench,
  zap: Zap,
};

/** Ícono por nombre; si no existe, un signo de interrogación. */
export function catalogIcon(name: string | undefined): LucideIcon {
  return (name && CATALOG_ICONS[name]) || CircleHelp;
}
