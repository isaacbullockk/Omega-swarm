/**
 * Omega Swarm — Marketing Pipeline
 * Nemotron 3 Ultra Orchestrator → Kimi K2.5 Copy Filler → Nemotron Gateway Audit → CRM Webhook
 *
 * Zero-tolerance: als de gateway audit REJECTED geeft, wordt de webhook geblokkeerd.
 */

import { callOpenRouter } from "./openrouter";

const MARKETING_WEBHOOK_URL = process.env.BOOKING_WEBHOOK_URL;

const PIPELINE_MODELS = {
  ORCHESTRATOR: "nvidia/nemotron-3-ultra-550b-a55b",
  COPY_FILLER: "moonshotai/kimi-k2.5",
  GATEWAY: "nvidia/nemotron-3-ultra-550b-a55b",
} as const;

export interface MarketingPayload {
  client_name: string;
  industry: string;
  campaign_goal: string;
  target_audience: string;
  core_offer: string;
}

export interface Blueprint {
  client_name: string;
  core_angle: string;
  required_cta: string;
}

function parseJson<T>(raw: string): T {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  return JSON.parse(cleaned) as T;
}

/**
 * FASE 1: Nemotron 3 Ultra bepaalt strategie + rigide e-mailsjabloon
 */
export async function runNemotronMarketingOrchestrator(
  payload: MarketingPayload
): Promise<{ blueprint: Blueprint; rigid_template: string }> {
  const prompt = `Je bent de Hoofd Marketing Strateeg van Omega Swarm. Analyseer deze lead/campagne data en genereer een onwrikbare strategische blauwdruk.
Schrijf daarnaast een rigide, onveranderlijk e-mailsjabloon waarin een copy-assistent dadelijk ALLEEN de invulvelden tussen [vierkante haakjes] mag invullen.

Campagne Gegevens:
${JSON.stringify(payload, null, 2)}

Output verplicht exact een JSON-object met deze structuur (geen markdown, geen extra tekst):
{
    "blueprint": {
        "client_name": "${payload.client_name}",
        "core_angle": "De psychologische invalshoek op basis van de doelgroep",
        "required_cta": "De exacte Call to Action die in de tekst MOET voorkomen"
    },
    "rigid_template": "Beste [naam], we zien dat veel bedrijven in de [branche] worstelen met [pijnpunt]. Daarom bieden we tijdelijk [core_offer] aan. Klik hier om direct te starten: [required_cta]. Groet, Team [client_name]"
}`;

  const raw = await callOpenRouter([{ role: "user", content: prompt }], {
    model: PIPELINE_MODELS.ORCHESTRATOR,
    temperature: 0.2,
    maxTokens: 4096,
    responseFormat: { type: "json_object" },
  });

  return parseJson(raw);
}

/**
 * FASE 2: Kimi vult alleen de gaten in — geen structuurwijzigingen toegestaan
 */
export async function runKimiCopyFiller(
  blueprint: Blueprint,
  template: string,
  leadName: string,
  painPoint: string,
  payload: MarketingPayload
): Promise<string> {
  const prompt = `Je bent een junior copywriter-assistent bij Omega Swarm. Je mag de zinsstructuur NIET aanpassen en GEEN extra zinnen verzinnen.
Vul de lege velden tussen de haakjes van het sjabloon in met de marketingfeiten uit de blauwdruk.

Sjabloon: ${template}
Blauwdruk: ${JSON.stringify(blueprint)}
Invuldata: { "naam": "${leadName}", "branche": "${payload.industry}", "pijnpunt": "${painPoint}", "core_offer": "${payload.core_offer}" }

Output uitsluitend de ingevulde tekst. Geen inleiding, geen praatjes achteraf.`;

  const raw = await callOpenRouter([{ role: "user", content: prompt }], {
    model: PIPELINE_MODELS.COPY_FILLER,
    temperature: 0.5,
    maxTokens: 2048,
  });

  return raw.trim();
}

/**
 * FASE 3: Nemotron Gateway Audit — zero tolerance, temperature 0.0
 */
export async function runNemotronGatewayAudit(
  blueprint: Blueprint,
  draftEmail: string
): Promise<{ approved: boolean; reason: string }> {
  const prompt = `Je bent de Supreme Quality Auditor van Omega Swarm. Controleer de gegenereerde e-mailtekst streng tegen de strategische blauwdruk.
Als de verplichte CTA is aangepast, de merknaam verkeerd is gespeld, of ongeautoriseerde marketingclaims zijn toegevoegd, moet je de tekst direct AFKEUREN.

Strategische Blauwdruk: ${JSON.stringify(blueprint)}
Gegenereerde E-mail: "${draftEmail}"

Output verplicht exact een JSON-object (geen tekst buiten het object):
{
    "status": "APPROVED" of "REJECTED",
    "reason": "Duidelijke uitleg van de afkeuring, of 'Passed' bij APPROVED"
}`;

  const raw = await callOpenRouter([{ role: "user", content: prompt }], {
    model: PIPELINE_MODELS.GATEWAY,
    temperature: 0.0,
    maxTokens: 2048,
    responseFormat: { type: "json_object" },
  });

  const audit = parseJson<{ status: string; reason: string }>(raw);
  return { approved: audit.status === "APPROVED", reason: audit.reason };
}

/**
 * DE INTEGRATIE LOOP — met webhook blokkade bij REJECTED
 */
export async function runMarketingPipeline(
  payload: MarketingPayload,
  leadName: string,
  painPoint: string
): Promise<{
  success: boolean;
  blocked: boolean;
  blueprint?: Blueprint;
  emailBody?: string;
  auditReason?: string;
  webhookSent: boolean;
  error?: string;
}> {
  try {
    const orchestratorOutput = await runNemotronMarketingOrchestrator(payload);
    const blueprint = orchestratorOutput.blueprint;
    const template = orchestratorOutput.rigid_template;

    // Harde backstop: klantnaam moet intact zijn
    if (blueprint.client_name !== payload.client_name) {
      return { success: false, blocked: true, webhookSent: false, error: "Orchestrator heeft de core client data aangetast." };
    }

    const finalEmail = await runKimiCopyFiller(blueprint, template, leadName, painPoint, payload);
    const audit = await runNemotronGatewayAudit(blueprint, finalEmail);

    if (!audit.approved) {
      // HALT — webhook geblokkeerd om reputatieschade te voorkomen
      return { success: false, blocked: true, webhookSent: false, blueprint, emailBody: finalEmail, auditReason: audit.reason };
    }

    // Stuur goedgekeurde content naar Make.com / HubSpot / ActiveCampaign
    let webhookSent = false;
    if (MARKETING_WEBHOOK_URL) {
      const res = await fetch(MARKETING_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "verified_marketing_content",
          meta: blueprint,
          email_body: finalEmail,
          lead_contact: leadName,
        }),
      });
      webhookSent = res.ok;
    }

    return { success: true, blocked: false, webhookSent, blueprint, emailBody: finalEmail, auditReason: audit.reason };
  } catch (error) {
    return { success: false, blocked: false, webhookSent: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
