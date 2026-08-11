#!/usr/bin/env bash
# Low-spec cloud run helper for selfhost profile.
# Usage:
#   export SPRING_PROFILES_ACTIVE=selfhost
#   export DB_URL=... DB_USERNAME=... DB_PASSWORD=... JWT_SECRET=... APP_SERVER_DOMAIN=...
#   ./scripts/run-selfhost.sh /path/to/nfc-tag-service-0.0.1-SNAPSHOT.jar

set -euo pipefail

JAR_PATH="${1:-}"
if [[ -z "${JAR_PATH}" || ! -f "${JAR_PATH}" ]]; then
  echo "Usage: $0 /path/to/app.jar"
  exit 1
fi

JAVA_OPTS="${JAVA_OPTS:--Xms128m -Xmx256m -XX:+UseG1GC -XX:MaxGCPauseMillis=50 -XX:+ExitOnOutOfMemoryError}"

exec java ${JAVA_OPTS} \
  -Dspring.profiles.active="${SPRING_PROFILES_ACTIVE:-selfhost}" \
  -jar "${JAR_PATH}"
