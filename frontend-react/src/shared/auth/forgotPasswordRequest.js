/**

 * Solicitud de recuperacion de contrasena.

 * Fase actual: simulacion local (sin revelar si el correo existe).

 * Integracion futura: sustituir cuerpo por api.post("/auth/forgot-password", { email }, { __skipAuthRefresh: true }).

 */



const SIMULATED_NETWORK_MS = 900;



/**

 * @param {string} email

 * @returns {Promise<{ success: true } | { success: false, code: string, message: string }>}

 */

export async function requestPasswordReset(email) {

  const trimmed = String(email || "").trim();

  if (!trimmed) {

    return { success: false, code: "FORGOT_EMAIL_REQUIRED", message: "Indica un correo electronico." };

  }



  await new Promise((resolve) => setTimeout(resolve, SIMULATED_NETWORK_MS));



  // Futuro (ejemplo, no activar fetch hasta contrato backend):

  // const res = await api.post("/auth/forgot-password", { email: trimmed }, { __skipAuthRefresh: true });

  // return res.data;



  return { success: true };

}

