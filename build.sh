#!/usr/bin/env bash
set -euo pipefail

yarn build
./gradlew shadowJar
docker build --tag vs-gitlab.immovativ.de/freiburg/vermarktungsplattform:latest .
