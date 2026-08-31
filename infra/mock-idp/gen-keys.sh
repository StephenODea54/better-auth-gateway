#!/bin/sh
set -eu

here="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
keys="$here/keys"
key="$keys/idp-key.pem"
cert="$keys/idp-cert.pem"

mkdir -p "$keys"

if [ -f "$key" ] && [ -f "$cert" ]; then
  echo "keypair present, reusing $cert"
else
  echo "minting keypair in $keys"
  openssl req -x509 -newkey rsa:2048 -sha256 -days 3650 -nodes \
    -keyout "$key" -out "$cert" \
    -subj "/CN=auth-gateway-mock-idp" >/dev/null 2>&1
  chmod 644 "$key" "$cert"
fi

app_env="$here/../../app/.env"

if [ -f "$app_env" ]; then
  tmp="$(mktemp)"
  grep -v '^SSO_IDP_CERT=' "$app_env" > "$tmp" || true
  printf 'SSO_IDP_CERT=%s\n' "$(openssl base64 -A -in "$cert")" >> "$tmp"
  cat "$tmp" > "$app_env"
  rm -f "$tmp"
  echo "set SSO_IDP_CERT in app/.env"
fi
