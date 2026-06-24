import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Bell, X } from "lucide-react";

export default function FCMConsentModal({ userId }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const checkConsent = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("fcm_consentimiento")
        .eq("id", userId)
        .single();

      if (!error && !data?.fcm_consentimiento) {
        setVisible(true);
      }
    };

    checkConsent();
  }, [userId]);

  const handleActivar = async () => {
    if (!("Notification" in window)) {
      alert("Tu navegador no soporta notificaciones.");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setVisible(false);
      return;
    }

    // Registrar token FCM
    try {
      const { initializeApp, getApps } = await import("firebase/app");
      const { getMessaging, getToken } = await import("firebase/messaging");

      const firebaseConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
      };

      const app =
        getApps().length === 0
          ? initializeApp(firebaseConfig)
          : getApps()[0];

      const messaging = getMessaging(app);
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      });

      if (token) {
        // Guardar token en fcm_tokens
        await supabase.from("fcm_tokens").upsert(
          { user_id: userId, token },
          { onConflict: "user_id" }
        );
      }
    } catch (err) {
      console.error("Error al obtener token FCM:", err);
    }

    // Guardar consentimiento en profiles
    await supabase
      .from("profiles")
      .update({
        fcm_consentimiento: true,
        fcm_consentimiento_fecha: new Date().toISOString(),
      })
      .eq("id", userId);

    setVisible(false);
  };

  const handleCerrar = () => {
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-xl p-6">
        {/* Botón cerrar */}
        <button
          onClick={handleCerrar}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Cerrar"
        >
          <X size={20} />
        </button>

        {/* Ícono */}
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
          style={{ backgroundColor: "#e6f2ec" }}
        >
          <Bell size={28} style={{ color: "#1e3a2f" }} />
        </div>

        {/* Título */}
        <h2
          className="text-center text-lg font-bold mb-2"
          style={{ color: "#1e3a2f" }}
        >
          ¡No te pierdas ningún beneficio!
        </h2>

        {/* Descripción */}
        <p className="text-center text-sm text-gray-600 mb-6">
          Activa las notificaciones y sé el primero en enterarte de beneficios,
          convenios y novedades del Sindicato — antes de que se agoten los cupos.
        </p>

        {/* Botones */}
        <button
          onClick={handleActivar}
          className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 mb-2"
          style={{ backgroundColor: "#2d7a4f" }}
        >
          Activar notificaciones
        </button>
        <button
          onClick={handleCerrar}
          className="w-full rounded-xl py-3 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
        >
          Ahora no
        </button>
      </div>
    </div>
  );
}
