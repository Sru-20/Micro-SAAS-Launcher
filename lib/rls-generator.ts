import { sanitizeIdentifier } from "@/lib/identifiers";
import type { Blueprint } from "@/lib/blueprint-schema";

function policyName(table: string, action: string) {
  // Postgres identifier limit is 63 bytes; keep names short and stable.
  const base = `${table}_${action}_own_project`;
  return base.length > 60 ? base.slice(0, 60) : base;
}

function ownershipCheck(table: string) {
  return `exists (select 1 from public.projects p where p.id = ${table}.project_id and p.user_id = auth.uid())`;
}

function createPolicyIfMissingSql(params: {
  table: string;
  policy: string;
  command: "select" | "insert" | "update" | "delete";
  using?: string;
  withCheck?: string;
}) {
  const { table, policy, command, using, withCheck } = params;

  const usingClause = using ? `using (${using})` : "";
  const withCheckClause = withCheck ? `with check (${withCheck})` : "";

  // DO block is a single statement, so it works with run_sql(query text)
  return `
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = '${table}'
      and policyname = '${policy}'
  ) then
    create policy "${policy}"
    on public.${table}
    for ${command}
    to authenticated
    ${usingClause}
    ${withCheckClause};
  end if;
end
$$;`.trim();
}

export function generateRlsStatementsForTable(rawTableName: string): string[] {
  const table = sanitizeIdentifier(rawTableName);

  const check = ownershipCheck(table);

  return [
    `alter table public.${table} enable row level security;`,
    createPolicyIfMissingSql({
      table,
      policy: policyName(table, "select"),
      command: "select",
      using: check,
    }),
    createPolicyIfMissingSql({
      table,
      policy: policyName(table, "insert"),
      command: "insert",
      withCheck: check,
    }),
    createPolicyIfMissingSql({
      table,
      policy: policyName(table, "update"),
      command: "update",
      using: check,
      withCheck: check,
    }),
    createPolicyIfMissingSql({
      table,
      policy: policyName(table, "delete"),
      command: "delete",
      using: check,
    }),
  ];
}

export function generateRlsStatements(blueprint: Blueprint): string[] {
  const prefix = sanitizeIdentifier(blueprint.project_name);
  const tables = blueprint.tables?.map((t) => `${prefix}_${t.name}`) ?? [];
  if (tables.length === 0) return [];

  return tables.flatMap((t) => generateRlsStatementsForTable(t));
}

