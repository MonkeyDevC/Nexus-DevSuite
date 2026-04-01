import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card } from "../../../design-system/components/Card/Card.jsx";
import AlertDialog from "../../../design-system/components/AlertDialog/AlertDialog.jsx";
import wave1 from "../../../pages/wave1Surfaces.module.css";
import {
  DEV_DATA_CONFIG_STORAGE_KEY,
  DEV_DATA_FEEDBACK_STORAGE_KEY,
  loadDevDataConfig,
  loadDevDataFeedback,
  saveDevDataConfig,
} from "./devDataConfig.js";
import { buildPreview } from "./buildPreview.js";
import { applyPreset } from "./presets.js";
import {
  getExecutionBusy,
  runGenerate,
  runReset,
  runResetThenGenerate,
} from "./devDataService.js";
import { requiresConfirmForVolume } from "./devDataLimits.js";
import panelStyles from "./DevDataSettingsPanel.module.css";
import AutoResetSection from "./sections/AutoResetSection.jsx";
import VolumeSection from "./sections/VolumeSection.jsx";
import ComplexitySection from "./sections/ComplexitySection.jsx";
import RelationshipsSection from "./sections/RelationshipsSection.jsx";
import RandomizationSection from "./sections/RandomizationSection.jsx";
import PresetsSection from "./sections/PresetsSection.jsx";
import ExecutionSection from "./sections/ExecutionSection.jsx";
import FeedbackSection from "./sections/FeedbackSection.jsx";

function mergeDevDataPatch(prev, patch) {
  const next = { ...prev };
  for (const key of Object.keys(patch)) {
    const incoming = patch[key];
    const existing = prev[key];
    if (
      incoming != null &&
      typeof incoming === "object" &&
      !Array.isArray(incoming) &&
      existing != null &&
      typeof existing === "object" &&
      !Array.isArray(existing)
    ) {
      next[key] = { ...existing, ...incoming };
    } else {
      next[key] = incoming;
    }
  }
  return next;
}

function needsGenerateConfirmation(config, preview) {
  if (!preview || preview.blocked) return false;
  const ex = config.execution || {};
  const medium =
    requiresConfirmForVolume(config.volume) && ex.requireConfirmOnMedium !== false;
  const high = preview.estimatedLoad === "high" && ex.requireConfirmOnHigh !== false;
  return medium || high;
}

export default function DevDataSettingsPanel() {
  const canUse = import.meta.env.DEV;
  const [config, setConfig] = useState(() => loadDevDataConfig());
  const [feedback, setFeedback] = useState(() => loadDevDataFeedback());
  const [busy, setBusy] = useState(false);

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTone, setAlertTone] = useState("info");
  const [alertTitle, setAlertTitle] = useState("");
  const [alertDescription, setAlertDescription] = useState("");
  const [alertConfirmLabel, setAlertConfirmLabel] = useState("Aceptar");
  const [alertCancelLabel, setAlertCancelLabel] = useState("");
  const [alertOnConfirm, setAlertOnConfirm] = useState(() => () => {});
  const [alertConfirmVariant, setAlertConfirmVariant] = useState("primary");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmDescription, setConfirmDescription] = useState("");
  const pendingConfirmRef = useRef(null);

  const preview = useMemo(() => buildPreview(config), [config]);

  const refreshFeedback = useCallback(() => {
    setFeedback(loadDevDataFeedback());
  }, []);

  const openResultAlert = useCallback((tone, title, description) => {
    setAlertTone(tone);
    setAlertTitle(title);
    setAlertDescription(description);
    setAlertConfirmLabel("Entendido");
    setAlertCancelLabel("");
    setAlertConfirmVariant("primary");
    setAlertOnConfirm(() => () => setAlertOpen(false));
    setAlertOpen(true);
  }, []);

  const commitPatch = useCallback((patch) => {
    setConfig((prev) => saveDevDataConfig(mergeDevDataPatch(prev, patch), { markPreset: "custom" }));
  }, []);

  const applyPresetId = useCallback((presetId) => {
    setConfig(saveDevDataConfig(applyPreset(presetId)));
  }, []);

  useEffect(() => {
    function onStorage(e) {
      if (!e || !e.key) return;
      if (e.key === DEV_DATA_CONFIG_STORAGE_KEY) {
        setConfig(loadDevDataConfig());
      }
      if (e.key === DEV_DATA_FEEDBACK_STORAGE_KEY) {
        refreshFeedback();
      }
    }
    function onConfigChanged() {
      setConfig(loadDevDataConfig());
    }
    window.addEventListener("storage", onStorage);
    window.addEventListener("nexus-dev-data-config-changed", onConfigChanged);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("nexus-dev-data-config-changed", onConfigChanged);
    };
  }, [refreshFeedback]);

  const runWithBusy = useCallback(
    async (fn) => {
      if (getExecutionBusy()) {
        openResultAlert("warning", "Ocupado", "Ya hay una ejecución en curso.");
        return;
      }
      setBusy(true);
      try {
        await fn();
        refreshFeedback();
      } catch (e) {
        refreshFeedback();
        const msg = e && e.message ? String(e.message) : "Error desconocido";
        openResultAlert("error", "Error", msg);
      } finally {
        setBusy(false);
      }
    },
    [openResultAlert, refreshFeedback]
  );

  const snapshotPreview = useCallback(() => preview, [preview]);

  const handleReset = useCallback(() => {
    setConfirmTitle("Confirmar reset");
    setConfirmDescription(
      "Se eliminará la data dummy del entorno DEV. Esta acción no se puede deshacer desde aquí."
    );
    pendingConfirmRef.current = async () => {
      setConfirmOpen(false);
      await runWithBusy(async () => {
        await runReset({ previewSnapshot: snapshotPreview() });
        openResultAlert("success", "Reset", "Reset completado correctamente.");
      });
    };
    setConfirmOpen(true);
  }, [openResultAlert, runWithBusy, snapshotPreview]);

  const execGenerate = useCallback(async () => {
    await runWithBusy(async () => {
      await runGenerate({ config, previewSnapshot: snapshotPreview() });
      openResultAlert("success", "Generate", "Import completado correctamente.");
    });
  }, [config, openResultAlert, runWithBusy, snapshotPreview]);

  const handleGenerate = useCallback(() => {
    if (preview.blocked) return;
    if (needsGenerateConfirmation(config, preview)) {
      setConfirmTitle("Confirmar generación");
      setConfirmDescription(
        `El volumen implica carga ${preview.estimatedLoad}. ¿Continuar con el import de datos sintéticos?`
      );
      pendingConfirmRef.current = async () => {
        setConfirmOpen(false);
        await execGenerate();
      };
      setConfirmOpen(true);
      return;
    }
    void execGenerate();
  }, [config, execGenerate, preview]);

  const execResetThenGenerate = useCallback(async () => {
    await runWithBusy(async () => {
      await runResetThenGenerate({ config, previewSnapshot: snapshotPreview() });
      openResultAlert("success", "Reset + Generate", "Reset e import completados correctamente.");
    });
  }, [config, openResultAlert, runWithBusy, snapshotPreview]);

  const handleResetThenGenerate = useCallback(() => {
    if (preview.blocked) return;
    const needVol = needsGenerateConfirmation(config, preview);
    setConfirmTitle("Confirmar reset y generación");
    setConfirmDescription(
      needVol
        ? "Se ejecutará reset de data dummy y luego import. El volumen configurado tiene carga elevada."
        : "Se ejecutará reset de data dummy y luego import con la configuración actual."
    );
    pendingConfirmRef.current = async () => {
      setConfirmOpen(false);
      await execResetThenGenerate();
    };
    setConfirmOpen(true);
  }, [config, execResetThenGenerate, preview]);

  const onConfirmDialog = useCallback(() => {
    const fn = pendingConfirmRef.current;
    pendingConfirmRef.current = null;
    void fn?.();
  }, []);

  const panelBlocked = !canUse || busy;
  const showBlockedBanner = preview.blocked && canUse;

  return (
    <Card padding="default" data-testid="settings-panel-dev-data">
      <p className={panelStyles.panelTitle}>Panel de control · datos DEV</p>
      <h2 className={wave1.fieldLabel} style={{ marginTop: 0, marginBottom: "var(--ds-space-4)" }}>
        Generación de datos (controlada)
      </h2>

      {!canUse ? (
        <div className={`${wave1.banner} ${wave1.bannerNeutral}`} role="note">
          Esta sección solo está disponible en entorno de desarrollo.
        </div>
      ) : null}

      {canUse && showBlockedBanner ? (
        <div className={panelStyles.blockedBanner} role="alert">
          Generación bloqueada: más de 2000 historias totales. Reduzca volumen para habilitar Generate.
        </div>
      ) : null}

      {canUse ? (
        <div className={panelStyles.root}>
          <div className={panelStyles.layoutGrid}>
            <div className={panelStyles.mainColumn}>
              <AutoResetSection
                config={config}
                disabled={panelBlocked}
                onPatch={commitPatch}
                feedback={feedback}
              />
              <VolumeSection config={config} disabled={panelBlocked} onPatch={commitPatch} />
              <div className={panelStyles.splitPair}>
                <RelationshipsSection config={config} disabled={panelBlocked} onPatch={commitPatch} />
                <RandomizationSection config={config} disabled={panelBlocked} onPatch={commitPatch} />
              </div>
              <ComplexitySection config={config} disabled={panelBlocked} onPatch={commitPatch} />
            </div>
            <aside className={panelStyles.sideColumn}>
              <PresetsSection disabled={panelBlocked} onApplyPreset={applyPresetId} />
              <ExecutionSection
                config={config}
                preview={preview}
                disabled={panelBlocked}
                busy={busy}
                blocked={preview.blocked}
                onPatch={commitPatch}
                onReset={handleReset}
                onGenerate={handleGenerate}
                onResetThenGenerate={handleResetThenGenerate}
              />
              <FeedbackSection feedback={feedback} />
            </aside>
          </div>
        </div>
      ) : null}

      <AlertDialog
        isOpen={confirmOpen}
        tone="question"
        title={confirmTitle}
        description={confirmDescription}
        confirmLabel="Continuar"
        cancelLabel="Cancelar"
        confirmVariant="danger"
        busy={busy}
        onCancel={() => {
          pendingConfirmRef.current = null;
          setConfirmOpen(false);
        }}
        onConfirm={onConfirmDialog}
      />

      <AlertDialog
        isOpen={alertOpen}
        tone={alertTone}
        title={alertTitle}
        description={alertDescription}
        confirmLabel={alertConfirmLabel}
        cancelLabel={alertCancelLabel}
        confirmVariant={alertConfirmVariant}
        onCancel={() => setAlertOpen(false)}
        onConfirm={alertOnConfirm}
      />
    </Card>
  );
}
