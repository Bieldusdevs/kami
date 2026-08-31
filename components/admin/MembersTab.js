/*
 * ███╗   ██╗ ██████╗ ██╗   ██╗ █████╗ ██╗  ██╗███████╗
 * ████╗  ██║██╔═══██╗██║   ██║██╔══██╗██║ ██╔╝╚══███╔╝
 * ██╔██╗ ██║██║   ██║██║   ██║███████║█████╔╝   ███╔╝
 * ██║╚██╗██║██║   ██║╚██╗ ██╔╝██╔══██║██╔═██╗  ███╔╝
 * ██║ ╚████║╚██████╔╝ ╚████╔╝ ██║  ██║██║  ██╗███████╗
 * ╚═╝  ╚═══╝ ╚═════╝   ╚═══╝  ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
 * Projeto KAMIKAZE 神風 — criado por NOVAK.
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPatch } from "@/lib/clientApi";
import { ROLE_BADGE } from "@/lib/roles";

const ROLE_HELP = {
  Dono: "Manda em tudo, inclusive nos cargos.",
  Subdono: "Igual ao Dono, menos mexer em cargos.",
  Gerente: "Cuida de farm, comandos, arquivos e textos do site.",
  Membro: "Usa o site: pede farm, baixa arquivos e conversa no chat.",
};

function fmtDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function MembersTab({ currentUser }) {
  const [members, setMembers] = useState(null);
  const [roles, setRoles] = useState(["Dono", "Subdono", "Gerente", "Membro"]);
  const [canManage, setCanManage] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    const res = await apiGet("/api/admin/members");
    if (res.ok) {
      setMembers(res.data.members || []);
      setRoles(res.data.roles || roles);
      setCanManage(!!res.data.canManageRoles);
    } else {
      setMembers([]);
      setErr(res.error);
    }
  }, [roles]);

  useEffect(() => {
    load();
  }, [load]);

  async function changeRole(member, role) {
    setErr("");
    setOk("");
    setBusyId(member.id);
    const res = await apiPatch(`/api/admin/members/${member.id}`, { role });
    setBusyId(null);
    if (!res.ok) setErr(res.error);
    else {
      setOk(`${member.username} agora é ${role}.`);
      load();
    }
  }

  return (
    <div>
      <div className="border border-lineStrong bg-panel p-5 mb-6">
        <h3 className="text-[15px] mb-2.5">Cargos da Kamikaze</h3>
        <ul className="text-[12.5px] text-muted leading-relaxed flex flex-col gap-1">
          {Object.entries(ROLE_HELP).map(([role, help]) => (
            <li key={role}>
              <span className={`px-1.5 py-[1px] border mr-2 ${ROLE_BADGE[role]}`}>{role}</span>
              {help}
            </li>
          ))}
        </ul>
        {!canManage && (
          <p className="text-[12.5px] text-[#ffc857] mt-3.5">
            Só o Dono pode alterar cargos — você pode ver a lista, mas os campos ficam
            bloqueados.
          </p>
        )}
      </div>

      {err && (
        <div className="mb-4 text-danger text-[12.5px] border border-danger/40 bg-danger/5 px-4 py-2.5">
          {err}
        </div>
      )}
      {ok && (
        <div className="mb-4 text-ok text-[12.5px] border border-[#4fd6a855] bg-[#4fd6a80d] px-4 py-2.5">
          {ok}
        </div>
      )}

      {members === null ? (
        <div className="text-muted text-[13.5px]">Carregando membros...</div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {members.map((m) => (
            <div
              key={m.id}
              className="bg-bgAlt border border-line p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div>
                <b className="text-[15px]">{m.username}</b>
                {m.id === currentUser?.id && (
                  <span className="text-[11.5px] text-muted ml-2">(você)</span>
                )}
                <div className="text-[11.5px] text-muted mt-1">Desde {fmtDate(m.createdAt)}</div>
              </div>

              <div className="flex gap-2 items-center shrink-0">
                <span className={`text-[11px] px-2.5 py-1 border ${ROLE_BADGE[m.role] || ROLE_BADGE.Membro}`}>
                  {m.role}
                </span>
                <select
                  value={m.role}
                  disabled={!canManage || busyId === m.id}
                  onChange={(e) => changeRole(m, e.target.value)}
                  className="bg-bgAlt border border-lineStrong px-3 py-2 text-[12.5px] outline-none focus:border-blue-bright disabled:opacity-50"
                >
                  {roles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
