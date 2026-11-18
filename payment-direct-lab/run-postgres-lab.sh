#!/usr/bin/env bash
# Only a disposable local DB container. No production database URL, token, published port, or mounted data.
set -Eeuo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
command -v docker >/dev/null || { echo "Docker is required"; exit 1; }
name="betinsight-pay-lab-$$"
image="postgres:17"
# Pull only when the image is absent; uses the existing server resources.
docker image inspect "$image" >/dev/null 2>&1 || docker pull "$image"
created=0
cleanup(){ if [[ "$created" == 1 ]]; then docker rm -f -v "$name" >/dev/null 2>&1 || true; fi; }
trap cleanup EXIT
docker run -d --name "$name" --network none --memory 512m --cpus 1 --pids-limit 128 -e POSTGRES_HOST_AUTH_METHOD=trust -e POSTGRES_DB=betinsight_pay_lab "$image" >/dev/null
created=1
ready=0
for i in $(seq 1 45); do
 if docker exec "$name" pg_isready -h 127.0.0.1 -U postgres -d betinsight_pay_lab >/dev/null 2>&1; then ready=1; break; fi
 sleep 1
done
[[ "$ready" == 1 ]] || { echo "Database did not start"; exit 1; }
for f in lab-bootstrap.sql database-bridge-review.sql lab-checks.sql lab-posting.sql lab-posting-checks.sql lab-scan-schedule.sql lab-allocation.sql lab-master-stepup.sql lab-passkey-persistence.sql; do
 echo "== $f =="
 docker exec -i "$name" psql -X -h 127.0.0.1 -v ON_ERROR_STOP=1 -U postgres -d betinsight_pay_lab < "$f"
done
echo "Bridge, posting, scan schedule, allocation, master step-up and passkey persistence lab completed. No production records were posted."
