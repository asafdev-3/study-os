const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const systemPrompt = `Você é Kira, assistente de estudos do StudyOS especializada no ENEM.
Responda em português brasileiro em até três parágrafos curtos. Seja objetiva e ajude o estudante a entender o raciocínio.
Não invente dados sobre o estudante, o histórico dele ou notas de corte.`

type Message = { role: "user" | "assistant"; content: string }

function json(body: object, status = 200) {
  return Response.json(body, { status, headers: { ...cors, "Cache-Control": "no-store" } })
}

function parseMessages(value: unknown): Message[] | null {
  if (!Array.isArray(value) || value.length < 1 || value.length > 10) return null
  if (value.at(-1)?.role !== "user") return null
  const messages: Message[] = []
  for (const item of value) {
    if (item?.role !== "user" && item?.role !== "assistant") return null
    if (typeof item.content !== "string") return null
    const content = item.content.trim()
    if (!content || content.length > 2000) return null
    messages.push({ role: item.role, content })
  }
  return messages
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors })
  if (request.method !== "POST") return json({ code: "METHOD_NOT_ALLOWED" }, 405)

  const authorization = request.headers.get("Authorization")
  if (!authorization?.startsWith("Bearer ")) return json({ code: "UNAUTHENTICATED" }, 401)

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!supabaseUrl || !anonKey || !serviceKey) return json({ code: "UNAVAILABLE" }, 503)

  let userId: string
  try {
    const auth = await fetch(supabaseUrl + "/auth/v1/user", {
      headers: { apikey: anonKey, Authorization: authorization },
      signal: AbortSignal.timeout(5000),
    })
    if (auth.status === 401 || auth.status === 403) return json({ code: "UNAUTHENTICATED" }, 401)
    if (!auth.ok) return json({ code: "UNAVAILABLE" }, 503)
    const user = await auth.json()
    if (!user.id || user.is_anonymous) return json({ code: "UNAUTHENTICATED" }, 401)
    userId = user.id
  } catch {
    return json({ code: "UNAVAILABLE" }, 503)
  }

  let body
  try {
    const raw = await request.text()
    if (raw.length > 32000) return json({ code: "INVALID_MESSAGES" }, 413)
    body = JSON.parse(raw)
  } catch {
    return json({ code: "INVALID_MESSAGES" }, 400)
  }

  const quotaOnly = body?.action === "quota"
  const messages = quotaOnly ? null : parseMessages(body?.messages)
  if (!quotaOnly && !messages) return json({ code: "INVALID_MESSAGES" }, 400)
  const groqKey = Deno.env.get("GROQ_API_KEY")
  if (!quotaOnly && !groqKey) return json({ code: "UNAVAILABLE" }, 503)

  let quota: { allowed: boolean; remaining: number }
  try {
    const result = await fetch(supabaseUrl + "/rest/v1/rpc/kira_daily_quota", {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: "Bearer " + serviceKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_user_id: userId, p_consume: !quotaOnly }),
      signal: AbortSignal.timeout(5000),
    })
    if (!result.ok) return json({ code: "UNAVAILABLE" }, 503)
    const rows = await result.json()
    quota = rows[0]
    if (typeof quota?.allowed !== "boolean" || !Number.isInteger(quota.remaining)) {
      return json({ code: "UNAVAILABLE" }, 503)
    }
  } catch {
    return json({ code: "UNAVAILABLE" }, 503)
  }

  const { remaining } = quota
  if (quotaOnly) return json({ remaining })
  if (!quota.allowed) return json({ code: "DAILY_LIMIT", remaining }, 429)

  try {
    const completion = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: "Bearer " + groqKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: [{ role: "system", content: systemPrompt }, ...messages!],
        temperature: 0.7,
        reasoning_effort: "low",
        max_completion_tokens: 1024,
      }),
      signal: AbortSignal.timeout(25000),
    })
    if (!completion.ok) return json({ code: "UNAVAILABLE", remaining }, 502)
    const data = await completion.json()
    const answer = data.choices?.[0]?.message?.content
    if (typeof answer !== "string" || !answer.trim()) {
      return json({ code: "UNAVAILABLE", remaining }, 502)
    }
    return json({ answer: answer.trim(), remaining })
  } catch {
    return json({ code: "UNAVAILABLE", remaining }, 502)
  }
})
