#!/bin/bash
set -e -u -o pipefail

HOST=${1:-localhost}
PORT=${2:-5432}

CONNECTION_STRING="postgresql://vermarktungsplattform:vermarktungsplattform@$HOST:$PORT/vermarktungsplattform"

# Cleanup
echo 'delete from texts; delete from password_reset; delete from user_data; delete from users; delete from concept_assignment_attachments; delete from concept_assignments; delete from candidature_attachments; delete from candidatures;' | psql -q $CONNECTION_STRING

# Reseed with defaults
psql -q $CONNECTION_STRING < ./src/main/resources/db/migration/V006__add_default_texts.sql
psql -q $CONNECTION_STRING < ./src/main/resources/db/migration/V012__add_preseeded_accounts.sql
