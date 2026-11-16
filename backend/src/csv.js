// Builds the waitlist CSV. Values are escaped per RFC 4180, and text typed by users is
// protected against CSV/formula injection (Excel or Sheets running "=..." as a formula).
const FORMULA_START = /^[=+\-@\t\r]/;

function cell(value, { userText = false } = {}) {
  let text = value === null || value === undefined ? "" : String(value);
  if (userText && FORMULA_START.test(text)) text = `'${text}`;
  if (/[",\r\n]/.test(text)) text = `"${text.replace(/"/g, '""')}"`;
  return text;
}

const HEADER = [
  "Position",
  "Joined at (UTC)",
  "Full name",
  "Email",
  "Mobile",
  "City",
  "Other city",
  "Interests",
  "WhatsApp updates",
];

export function entriesToCsv(entries) {
  const lines = [HEADER.map((h) => cell(h)).join(",")];
  for (const e of entries) {
    lines.push(
      [
        cell(e.position),
        cell(e.createdAt.toISOString()),
        cell(e.fullName, { userText: true }),
        cell(e.email, { userText: true }),
        cell(e.mobile),
        cell(e.city),
        cell(e.cityOther, { userText: true }),
        cell(e.interests.join("; ")),
        cell(e.whatsappOptIn ? "Yes" : "No"),
      ].join(","),
    );
  }

  return "﻿" + lines.join("\r\n") + "\r\n";
}
