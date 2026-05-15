/**
 * Cuenta del usuario autenticado: nombre y foto de perfil (no confundir con /settings solo MASTER).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Breadcrumb from "../design-system/patterns/Breadcrumb/Breadcrumb.jsx";
import { Button } from "../design-system/components/Button/Button.jsx";
import { Card } from "../design-system/components/Card/Card.jsx";
import { Input } from "../design-system/components/Input/Input.jsx";
import { PageHeader } from "../design-system/patterns/PageHeader/PageHeader.jsx";
import { FormSection } from "../design-system/patterns/FormSection/FormSection.jsx";
import { useAuth } from "../app/context/AuthContext.jsx";
import * as userProfileService from "../modules/users/userProfileService.js";
import wave1 from "../shared/wave1/wave1Surfaces.module.css";

function resolveProfilePhotoUrl(raw) {
  if (raw == null) return "";
  const s = String(raw).trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  const path = s.startsWith("/") ? s : `/${s}`;
  if (typeof window !== "undefined") return `${window.location.origin}${path}`;
  return path;
}

export default function AccountPage() {
  const { user, refreshUser } = useAuth();
  const photoInputRef = useRef(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [photoPreviewFailed, setPhotoPreviewFailed] = useState(false);

  useEffect(() => {
    if (user?.name != null) {
      setName(String(user.name));
    } else {
      setName("");
    }
  }, [user?.id, user?.name]);

  const photoUrl = useMemo(() => resolveProfilePhotoUrl(user?.profile_photo_url), [user?.profile_photo_url]);

  useEffect(() => {
    setPhotoPreviewFailed(false);
  }, [photoUrl]);

  const baseName = user?.name != null ? String(user.name) : "";
  const dirtyName = name.trim() !== baseName.trim();

  const handleSaveName = useCallback(async () => {
    if (!user?.id || saving) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await userProfileService.updateMyProfile(user.id, { name: name.trim() });
      await refreshUser();
      setMessage("Perfil actualizado.");
    } catch (e) {
      setError(e && e.message ? String(e.message) : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }, [user?.id, name, saving, refreshUser]);

  const handlePhotoChange = useCallback(
    async (event) => {
      const file = event.target.files && event.target.files[0];
      event.target.value = "";
      if (!file || !user?.id) return;
      setUploading(true);
      setError("");
      setMessage("");
      try {
        await userProfileService.uploadMyProfilePhoto(user.id, file);
        await refreshUser();
        setMessage("Foto de perfil actualizada.");
      } catch (e) {
        setError(e && e.message ? String(e.message) : "No se pudo subir la imagen.");
      } finally {
        setUploading(false);
      }
    },
    [user?.id, refreshUser]
  );

  const breadcrumbItems = useMemo(
    () => [
      { label: "Panel", path: "/dashboard" },
      { label: "Mi cuenta" },
    ],
    []
  );

  if (!user) {
    return (
      <div className={wave1.stack} data-testid="account-root">
        <p className={wave1.loading}>Cargando sesión…</p>
      </div>
    );
  }

  return (
    <div className={wave1.stack} data-testid="account-root">
      <PageHeader
        title="Mi cuenta"
        description="Nombre visible y foto de perfil. El correo lo gestiona un administrador."
        breadcrumb={<Breadcrumb items={breadcrumbItems} />}
      />

      {message ? (
        <div className={`${wave1.banner} ${wave1.bannerSecondary}`} role="status">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className={`${wave1.banner} ${wave1.bannerDanger}`} role="alert">
          {error}
        </div>
      ) : null}

      <Card padding="default" data-testid="account-profile-card">
        <FormSection title="Foto de perfil" description="JPEG, PNG, GIF o WebP. Máximo 2 MB.">
          <div className={wave1.navRow} style={{ alignItems: "center", flexWrap: "wrap", gap: "var(--ds-space-4)" }}>
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: "var(--ds-radius-full)",
                overflow: "hidden",
                background: "var(--ds-color-surface-raised)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {photoUrl && !photoPreviewFailed ? (
                <img
                  src={photoUrl}
                  alt=""
                  width={96}
                  height={96}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={() => setPhotoPreviewFailed(true)}
                />
              ) : (
                <span style={{ fontSize: "var(--ds-font-size-xl)", color: "var(--ds-color-text-muted)" }}>—</span>
              )}
            </div>
            <div>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                disabled={uploading}
                onChange={handlePhotoChange}
                data-testid="account-photo-input"
                aria-hidden
                tabIndex={-1}
                style={{
                  position: "absolute",
                  width: 1,
                  height: 1,
                  padding: 0,
                  margin: -1,
                  overflow: "hidden",
                  clip: "rect(0,0,0,0)",
                  whiteSpace: "nowrap",
                  border: 0,
                }}
              />
              <Button
                type="button"
                variant="secondary"
                disabled={uploading}
                onClick={() => photoInputRef.current?.click()}
                data-testid="account-photo-trigger"
              >
                {uploading ? "Subiendo…" : "Elegir imagen"}
              </Button>
              <p className={wave1.readOnlyNote} style={{ marginTop: "var(--ds-space-2)", marginBottom: 0 }}>
                La imagen reemplaza la foto anterior en el servidor.
              </p>
            </div>
          </div>
        </FormSection>
      </Card>

      <Card padding="default" data-testid="account-name-card">
        <FormSection title="Nombre" description="Se muestra en el menú superior y en la aplicación.">
          <Input
            label="Nombre para mostrar"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
            maxLength={255}
            autoComplete="name"
            data-testid="account-name-input"
          />
          <div className={wave1.navRow} style={{ marginTop: "var(--ds-space-4)" }}>
            <Button
              type="button"
              variant="primary"
              onClick={handleSaveName}
              disabled={saving || !dirtyName || !name.trim()}
              data-testid="account-save-name"
            >
              {saving ? "Guardando…" : "Guardar nombre"}
            </Button>
          </div>
        </FormSection>
      </Card>

      <Card padding="default">
        <FormSection title="Correo electrónico" description="Solo lectura.">
          <p className={wave1.readOnlyNote}>{user.email || "—"}</p>
        </FormSection>
      </Card>
    </div>
  );
}
