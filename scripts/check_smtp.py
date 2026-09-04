#!/usr/bin/env python3
"""
SARIRO — is our email actually going to arrive?
===============================================================================
Checks the SMTP credentials you are about to paste into Supabase, and the DNS
records that decide whether the mail lands in an inbox or a spam folder.

Standard library only. No pip install, no dependencies to keep current.

    python scripts/check_smtp.py
    python scripts/check_smtp.py --send you@example.com

Why this exists
-------------------------------------------------------------------------------
Supabase's built-in email sender is documented as not for production and rate
limits to a handful of messages an hour. It is fine for four signups and will
throttle at two hundred — and when it throttles, confirmation emails simply
stop. Nobody gets an error. It looks like the signup page is broken.

So the credentials get swapped for our own SMTP, and this checks them BEFORE a
cohort of parents is relying on them.

What it checks, in the order things actually go wrong
-------------------------------------------------------------------------------
1. Can we reach the server at all           (firewall, wrong host, wrong port)
2. Does TLS negotiate                       (port 465 vs 587 confusion)
3. Does the password work                   (mailbox password, not hPanel login)
4. SPF, DKIM and DMARC on the sending domain

Four is the one people skip. The first three passing means the mail is SENT.
Only the fourth decides whether it is DELIVERED, and a first-impression email
in a parent's spam folder is expensive in a way an error message is not.

Nothing is sent unless you pass --send with a recipient. Reading the settings
is safe to run whenever.

Configuration — put these in .env, never on the command line
-------------------------------------------------------------------------------
    SMTP_HOST=smtp.hostinger.com
    SMTP_PORT=465
    SMTP_USER=noreply@sariro.com
    SMTP_PASS=<the mailbox password>
    SMTP_FROM=noreply@sariro.com

A password typed as an argument ends up in your shell history and in the
process list. This reads the file instead.
"""

from __future__ import annotations

import argparse
import os
import re
import smtplib
import socket
import ssl
import subprocess
import sys
from email.message import EmailMessage
from email.utils import formataddr, make_msgid
from pathlib import Path

ENV_PATH = Path(__file__).resolve().parent.parent / ".env"

OK = "  ok  "
BAD = " FAIL "
WARN = " WARN "


def say(status: str, label: str, detail: str = "") -> None:
    print(f"[{status}] {label}" + (f"\n         {detail}" if detail else ""))


def load_env(path: Path) -> dict[str, str]:
    """Minimal .env reader. Ignores comments, blanks and surrounding quotes."""
    values: dict[str, str] = {}
    if not path.exists():
        return values
    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, raw = line.partition("=")
        values[key.strip()] = raw.strip().strip('"').strip("'")
    return values


def dns_txt(name: str) -> list[str]:
    """
    TXT records for a name, via nslookup.

    Deliberately shelling out rather than taking a DNS library as a dependency:
    this script's whole appeal is that it runs anywhere Python does, on a laptop
    or a server, without a package install first.
    """
    try:
        proc = subprocess.run(
            ["nslookup", "-type=TXT", name],
            capture_output=True, text=True, timeout=20,
        )
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return []

    out = proc.stdout or ""
    # nslookup wraps long records across lines and quotes each chunk.
    records: list[str] = []
    for match in re.finditer(r'"((?:[^"\\]|\\.)*)"', out):
        records.append(match.group(1))
    # Some resolvers print `text = v=spf1 ...` unquoted.
    for match in re.finditer(r"text\s*=\s*([^\r\n\"]+)", out):
        candidate = match.group(1).strip()
        if candidate and candidate not in records:
            records.append(candidate)
    return records


def dns_mx(name: str) -> list[str]:
    """MX hosts for a domain — who actually runs its mail."""
    try:
        proc = subprocess.run(
            ["nslookup", "-type=MX", name],
            capture_output=True, text=True, timeout=20,
        )
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return []
    hosts = re.findall(r"mail exchanger\s*=\s*([^\s,]+)", proc.stdout or "", re.I)
    return [h.rstrip(".").lower() for h in hosts]


# Which SMTP host goes with which mail provider. Connecting to the wrong one
# still gives a clean TLS handshake and then refuses every credential, which is
# indistinguishable from a bad password unless you look at the MX records.
PROVIDER_SMTP = {
    "hostinger": "smtp.hostinger.com",
    "titan": "smtp.titan.email",
    "google": "smtp.gmail.com",
    "zoho": "smtp.zoho.com",
    "outlook": "smtp.office365.com",
    "protonmail": "smtp.protonmail.ch",
}


def check_mx(domain: str, configured_host: str) -> None:
    hosts = dns_mx(domain)
    if not hosts:
        say(WARN, "No MX records found", f"Nothing accepts mail for {domain}. Check the DNS.")
        return

    say(OK, "Mail is hosted by", ", ".join(hosts))

    joined = " ".join(hosts)
    for key, smtp_host in PROVIDER_SMTP.items():
        if key in joined:
            if key not in configured_host.lower():
                say(BAD, f"SMTP_HOST does not match the mail provider",
                    f"The MX records say {key}, but SMTP_HOST is {configured_host}.\n"
                    f"         A wrong-but-real SMTP server still completes TLS and then rejects\n"
                    f"         every password, which looks exactly like a bad credential.\n"
                    f"         Try SMTP_HOST={smtp_host}")
            else:
                say(OK, "SMTP_HOST matches the mail provider", configured_host)
            return

    say(WARN, "Could not match the MX records to a known provider",
        "Check your provider's documentation for the right SMTP host.")


def check_dns(domain: str, configured_host: str = "") -> None:
    print(f"\nDNS for {domain} — this is what decides inbox vs spam\n" + "-" * 79)

    if configured_host:
        check_mx(domain, configured_host)

    spf = [r for r in dns_txt(domain) if r.lower().startswith("v=spf1")]
    if not spf:
        say(BAD, "SPF missing",
            "Without SPF, receiving servers cannot tell that Hostinger is allowed to\n"
            "         send as this domain. Gmail will treat it as suspicious. Add the SPF\n"
            "         record Hostinger gives you in hPanel.")
    elif len(spf) > 1:
        say(BAD, "More than one SPF record",
            "Two SPF records is treated as none by most receivers. Merge them into one.")
    else:
        say(OK, "SPF present", spf[0][:100])

    dmarc = [r for r in dns_txt(f"_dmarc.{domain}") if r.lower().startswith("v=dmarc1")]
    if not dmarc:
        say(WARN, "DMARC missing",
            "Not fatal, but Gmail and Yahoo now require it for bulk senders, and it is\n"
            "         the record that tells you when something is failing. Start with:\n"
            "         _dmarc  TXT  \"v=DMARC1; p=none; rua=mailto:you@" + domain + "\"")
    elif "rua=" not in dmarc[0].lower():
        # p=none with no reporting address is the default everyone lands on and
        # nobody revisits: it enforces nothing and reports to nowhere, so a
        # domain can be failing authentication for months in silence.
        say(WARN, "DMARC present but reporting nowhere", dmarc[0][:100] +
            "\n         There is no rua= address, so nobody is told when mail fails\n"
            "         authentication. Add rua=mailto:you@" + domain + " and you will find out\n"
            "         from a report rather than from a parent who never got their link.")
    else:
        say(OK, "DMARC present", dmarc[0][:100])

    # DKIM lives at <selector>._domainkey, and the selector is chosen by whoever
    # sends. These are the ones Hostinger and common providers use.
    selectors = ["hostingermail1", "hostingermail2", "hostingermail3", "default", "mail", "dkim", "s1", "s2"]
    found = [s for s in selectors if any("p=" in r or "v=DKIM1" in r for r in dns_txt(f"{s}._domainkey.{domain}"))]
    if found:
        say(OK, "DKIM present", f"selector(s): {', '.join(found)}")
    else:
        say(WARN, "DKIM not found on the usual selectors",
            "It may use a selector not in this list, so check hPanel rather than trusting\n"
            "         this line. Unsigned mail from a new domain to 200 parents is the fastest\n"
            "         route to a spam folder.")


def describe_password(password: str, user: str) -> None:
    """
    Say what SHAPE the password is, never the password.

    A rejected password is usually one of three things, and the shape tells them
    apart without anybody having to read a secret aloud: it was pasted with the
    quotes still attached, it picked up a trailing space, or the .env line ate
    part of it. Each of those looks identical to "wrong password" from the
    server's side, and each has a different fix.
    """
    classes = []
    if any(c.islower() for c in password): classes.append("lower")
    if any(c.isupper() for c in password): classes.append("upper")
    if any(c.isdigit() for c in password): classes.append("digits")
    if any(not c.isalnum() for c in password): classes.append("symbols")

    print(f"\n         Password shape (not the password): {len(password)} chars, "
          f"{', '.join(classes) or 'nothing recognised'}")

    if password != password.strip():
        print("         ^^ It has leading or trailing whitespace. That is almost certainly\n"
              "            the problem — the server is being sent a different string than\n"
              "            the one you set.")
    if len(password) >= 2 and password[0] == password[-1] and password[0] in "\"'":
        print("         ^^ It still has quotes around it. .env values do not need them, and\n"
              "            they are being sent as part of the password.")
    if "#" in password:
        print("         ^^ It contains a '#'. If the .env line was not quoted, some parsers\n"
              "            treat the rest as a comment and truncate it. Wrap the value in\n"
              "            single quotes to be sure.")
    if len(password) < 8:
        print("         ^^ That is short for a mailbox password. Check the whole value made\n"
              "            it into .env.")
    if " " in password.strip():
        print("         ^^ It contains SPACES in the middle. App passwords are often DISPLAYED\n"
              "            in groups for readability but must be entered without them. Try it\n"
              "            with the spaces removed.")
    if "-" in password:
        print("         ^^ It contains dashes. Some panels show app passwords hyphenated for\n"
              "            readability and expect them entered unhyphenated. Worth trying\n"
              "            without them.")

    print(f"\n         Things to check, in the order they are usually wrong:")
    print(f"           1. Is the mailbox {user} actually created in hPanel, and can you log\n"
          f"              into webmail with these exact details? If webmail refuses them too,\n"
          f"              the password is wrong and nothing here can help.")
    print("           2. hPanel login is NOT the mailbox password. They are different\n"
          "              passwords for different things and this is the usual mistake.")
    print("           3. If you just created or reset it, give it a few minutes.")


def check_smtp(host: str, port: int, user: str, password: str, timeout: float) -> smtplib.SMTP | None:
    """Connect, secure, authenticate — reporting which of the three failed."""
    print(f"\nSMTP {host}:{port}\n" + "-" * 79)

    implicit_tls = port == 465
    server: smtplib.SMTP | None = None

    try:
        if implicit_tls:
            server = smtplib.SMTP_SSL(host, port, timeout=timeout, context=ssl.create_default_context())
            say(OK, "Connected over SSL")
        else:
            server = smtplib.SMTP(host, port, timeout=timeout)
            say(OK, "Connected")
            server.ehlo()
            if server.has_extn("starttls"):
                server.starttls(context=ssl.create_default_context())
                server.ehlo()
                say(OK, "STARTTLS negotiated")
            else:
                say(BAD, "Server does not offer STARTTLS",
                    "Do not send credentials over this connection. Try port 465 instead.")
                server.quit()
                return None
    except socket.timeout:
        say(BAD, "Timed out connecting",
            "Usually a firewall, or the wrong port. Hostinger uses 465 (SSL) or 587 (STARTTLS).")
        return None
    except ssl.SSLError as exc:
        say(BAD, "TLS failed", f"{exc}\n         Port 465 expects SSL from the start; 587 expects STARTTLS. They are not interchangeable.")
        return None
    except OSError as exc:
        say(BAD, "Could not connect", str(exc))
        return None

    try:
        server.login(user, password)
        say(OK, f"Authenticated as {user}")
        return server
    except smtplib.SMTPAuthenticationError as exc:
        code = getattr(exc, "smtp_code", "?")
        say(BAD, f"Authentication refused ({code})",
            "The server accepted the connection and rejected the credentials, so the\n"
            "         host and port are right and only the username or password is wrong.")
        describe_password(password, user)

        # One retry, and only when there is an obvious thing to try.
        variant = password.replace(" ", "").replace("-", "")
        if variant != password:
            print("\n         Trying once more with separators removed…")
            try:
                server.login(user, variant)
                say(OK, "That worked — the separators were the problem",
                    "Put the value into .env WITHOUT spaces or dashes and re-run.")
                return server
            except smtplib.SMTPException:
                say(BAD, "Still refused without separators",
                    "So the separators were not the problem.")

        print("\n         Only two attempts were made, deliberately: repeated failures can\n"
              "         get the mailbox temporarily locked, which would look like a different\n"
              "         problem and waste an hour.")
        server.quit()
        return None
    except smtplib.SMTPException as exc:
        say(BAD, "SMTP error during login", str(exc))
        server.quit()
        return None


def send_test(server: smtplib.SMTP, sender: str, recipient: str) -> None:
    message = EmailMessage()
    message["Subject"] = "Sariro SMTP test"
    message["From"] = formataddr(("Sariro", sender))
    message["To"] = recipient
    message["Message-ID"] = make_msgid(domain=sender.split("@")[-1])
    message.set_content(
        "This is a test from scripts/check_smtp.py.\n\n"
        "If you are reading it in your inbox, the credentials work and the domain is\n"
        "trusted enough to deliver. If you found it in spam, SPF/DKIM/DMARC need\n"
        "attention before real signups depend on this.\n"
    )

    try:
        server.send_message(message)
        say(OK, f"Test message accepted for {recipient}")
        print("         Now go and look. Accepted by the server is not the same as delivered —\n"
              "         check whether it landed in the inbox or in spam, because that is the\n"
              "         thing that decides whether a parent ever sees a confirmation link.")
    except smtplib.SMTPException as exc:
        say(BAD, "Server refused the message", str(exc))


def main() -> int:
    parser = argparse.ArgumentParser(description="Check Sariro's outbound email setup.")
    parser.add_argument("--send", metavar="RECIPIENT",
                        help="Actually send one test message to this address.")
    parser.add_argument("--timeout", type=float, default=20.0)
    parser.add_argument("--skip-dns", action="store_true")
    parser.add_argument("--domain", default=None,
                        help="Domain to check SPF/DKIM/DMARC for. Defaults to the one in SMTP_FROM.")
    args = parser.parse_args()

    env = {**load_env(ENV_PATH), **os.environ}

    host = env.get("SMTP_HOST", "smtp.hostinger.com")
    port = int(env.get("SMTP_PORT", "465") or 465)
    user = env.get("SMTP_USER") or env.get("HOSTINGER_MAIL_FROM", "")
    password = env.get("SMTP_PASS", "")
    sender = env.get("SMTP_FROM") or user

    print("=" * 79)
    print("SARIRO — outbound email check")
    print("=" * 79)

    # DNS first, and unconditionally. It needs no credentials, it is the half
    # that decides inbox versus spam, and it is worth knowing before anybody
    # goes looking for a mailbox password.
    domain = args.domain or (sender.split("@")[-1] if "@" in sender else "sariro.com")
    if not args.skip_dns:
        check_dns(domain, host)

    if not user or not password:
        print()
        say(WARN, "SMTP_USER and SMTP_PASS are not set — skipping the connection test",
            f"Add them to {ENV_PATH} to check the credentials too. See the docstring\n"
            "         at the top of this file. Do not pass the password as an argument — it\n"
            "         would be recorded in your shell history and visible in the process list.")
        return 0 if not args.send else 2

    print()
    say(OK, "Settings loaded", f"{user} via {host}:{port} (password not shown)")

    server = check_smtp(host, port, user, password, args.timeout)

    if server is None:
        print("\nFix the SMTP errors above before putting these into Supabase.")
        return 1

    if args.send:
        print("\nSending\n" + "-" * 79)
        send_test(server, sender, args.send)
    else:
        print("\nNo message sent. Add --send you@example.com to actually deliver one.")

    server.quit()

    print("\n" + "=" * 79)
    print("If SMTP passed, put the same values into Supabase:")
    print("  Project Settings -> Authentication -> SMTP Settings")
    print("Then raise Authentication -> Rate Limits -> emails per hour. It stays at the")
    print("low default even after custom SMTP is configured, which is the step that")
    print("gets missed and the reason signups quietly stop confirming at scale.")
    print("=" * 79)
    return 0


if __name__ == "__main__":
    sys.exit(main())
