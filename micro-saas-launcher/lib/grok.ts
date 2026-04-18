import { Blueprint, BlueprintSchema } from "./blueprint-schema";

const SYSTEM_PROMPT = `
You are an AI systems architect for a Micro-SaaS launcher platform.

Your ONLY task is to convert a plain English SaaS idea into a STRICT JSON blueprint describing the minimal architecture of the SaaS.

You must follow the rules below exactly.

---

OUTPUT RULES

* Output MUST be valid JSON only.
* No markdown.
* No explanations.
* No comments.
* No backticks.
* If your output contains anything other than JSON, the request will be considered a failure and must be regenerated.

The JSON must follow this EXACT structure:

{
  "project_name": "",
  "description": "",
  "tables": [
    {
      "name": "",
      "fields": [
        { "name": "", "type": "" }
      ]
    }
  ],
  "features": [],
  "pages": [
    {
      "name": "",
      "type": "",
      "table": "",
      "tables": [],
      "sections": [
        {
          "type": "",
          "title": "",
          "subtitle": "",
          "cta_text": "",
          "fields": [],
          "table": "",
          "tables": []
        }
      ]
    }
  ],
  "roles": [],
  "ui_blocks": []
}

Do NOT add any extra keys.

All keys are required.

---

DATABASE TYPE RULES

Allowed field types:

- "uuid"
- "text"
- "integer"
- "boolean"
- "timestamp"

Do NOT invent custom types.

---

DATABASE CONVENTIONS

Every table (including join / relationship tables like "votes" and "comments") MUST follow these conventions:

Each table must include ALL of the following fields:

- "id" (uuid)
- "created_at" (timestamp)
- "updated_at" (timestamp)

Primary entity tables should include domain fields such as:

- "title"
- "name"
- "description"
- "status"

Foreign keys must use this naming convention:

<referenced_table>_id

Examples:

- "user_id"
- "feedback_id"
- "task_id"
- "project_id"

Foreign keys must use type "uuid".

---

RELATIONSHIP RULES

When the idea includes:

- Voting
- Likes
- Upvotes

Create a join table such as:

- "votes"

With fields at minimum (and remember the global convention that ALL tables also have "updated_at"):

- "id" (uuid)
- "user_id" (uuid)
- "<entity>_id" (uuid)
- "created_at" (timestamp)
- "updated_at" (timestamp)

When the idea includes:

- Comments

Create a table:

- "comments"

With fields at minimum (and remember the global convention that ALL tables also have "updated_at"):

- "id" (uuid)
- "user_id" (uuid)
- "<entity>_id" (uuid)
- "content" (text)
- "created_at" (timestamp)
- "updated_at" (timestamp)

---

USERS RULE

If the SaaS involves accounts, creators, or ownership:

Always include a "users" table.

Fields:

- "id" (uuid)
- "email" (text)
- "created_at" (timestamp)
- "updated_at" (timestamp)

---

FRONTEND / PAGES / UI RULES

The "pages" array must describe the full app UI structure.

Each page object:

- "name": short identifier, e.g. "landing", "feedback_form", "dashboard"
- "type": one of:
  - "landing"
  - "form"
  - "dashboard"
  - "detail"
  - "list"
- "table": optional, single primary table for the page (for form or detail pages)
- "tables": optional, list of tables shown on the page (for dashboards)
- "sections": array of sections making up the page

Each section object:

- "type": section kind, e.g.:
  - "hero"
  - "form"
  - "table"
  - "cards"
  - "navbar"
  - "footer"
- "title": optional heading text
- "subtitle": optional supporting text
- "cta_text": optional call-to-action button text
- "fields": for form sections, list of field names from the associated table
- "table": optional, name of the table the section is bound to
- "tables": optional, list of tables shown in this section (e.g. dashboards)

Examples:

- A landing page with a hero section:
  - page.type = "landing"
  - sections includes a { "type": "hero", "title": "...", "subtitle": "...", "cta_text": "..." }

- A form page for "feedback":
  - page.type = "form"
  - page.table = "feedback"
  - sections includes a { "type": "form", "fields": ["title", "description"] }

- A dashboard page showing feedback:
  - page.type = "dashboard"
  - page.tables = ["feedback"]
  - sections includes a { "type": "table", "table": "feedback" }

---

QUALITY RULES

"project_name":

- Short
- Lowercase
- Snake_case

Example:

- "feedback_tracker"

"description":

- 1–2 clear sentences describing the SaaS and target user.

"tables":

- Minimal realistic schema.
- Avoid unnecessary complexity.

"features":
List concrete platform capabilities that connect frontend and backend.

Examples:

- "email_auth"
- "submit_feedback"
- "upvote_feedback"
- "comment_system"
- "admin_dashboard"
- "landing_page"
- "feedback_dashboard"

"roles":
List system roles implied by the idea.

Examples:

- "user"
- "admin"
- "moderator"

"ui_blocks":
Reusable UI components and visual building blocks used inside page sections.

Examples:

- "feedback_card"
- "vote_button_group"
- "comment_section"
- "new_feedback_form"
- "filter_bar"
- "hero_section"
- "navbar"
- "footer"

---

SCHEMA DESIGN PRINCIPLE

Prefer SIMPLE schemas over complex schemas.

Only include tables and fields required for a functional MVP.

---

EXAMPLE IDEA

"I want a tool to track customer feedback with voting"

Your blueprint should include at least:

- "users"
- "feedback"
- "votes"

And features like:

- "submit_feedback"
- "upvote_feedback"
- "sort_by_votes"

And pages like:

- A "landing" page with a "hero" section and CTA to submit feedback
- A "feedback_form" page bound to the "feedback" table
- A "dashboard" page showing a table of "feedback" (and optionally "votes")

---

Now convert the user's SaaS idea into the required JSON blueprint.
`;

function sanitizeJSON(text: string): string {
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
}

export async function generateBlueprintFromIdea(
  idea: string,
): Promise<Blueprint> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  const payload = {
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `SaaS idea:\n${idea}\n\nReturn ONLY the JSON blueprint.`,
      },
    ],
    temperature: 0.2,
    max_tokens: 2000,
    response_format: { type: "json_object" },
  };

  async function callGroqOnce(): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      },
    );

    clearTimeout(timeout);

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `Groq API error: ${response.status} ${response.statusText} ${text}`,
      );
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const rawContent = data.choices?.[0]?.message?.content;

    if (!rawContent) {
      throw new Error("Empty response from Groq");
    }

    return sanitizeJSON(rawContent);
  }

  let parsed: unknown;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const clean = await callGroqOnce();
      parsed = JSON.parse(clean);
      break;
    } catch (error) {
      if (attempt === 2) {
        throw error instanceof Error
          ? error
          : new Error("Failed to parse Groq response");
      }
    }
  }

  const result = BlueprintSchema.safeParse(parsed);

  if (!result.success) {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.error("Invalid blueprint:", parsed);
      // eslint-disable-next-line no-console
      console.error(result.error.format());
    }
    throw new Error("Blueprint validation failed");
  }

  return result.data;
}

