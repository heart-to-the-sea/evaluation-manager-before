#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/scripts/common.sh"

MODE="${1:-prod}"
ACTION="${2:-deploy}"

load_env "$MODE"

case "$ACTION" in
  build)
    install_deps
    build_static
    ;;
  package)
    install_deps
    build_static
    ensure_dirs
    package_static
    ;;
  publish)
    publish_static
    ;;
  start)
    if [[ "$MODE" == "dev" ]]; then
      start_dev_server
    else
      publish_static
    fi
    ;;
  stop)
    if [[ "$MODE" == "dev" ]]; then
      stop_dev_server
    else
      remove_nginx_site
    fi
    ;;
  restart)
    "$0" "$MODE" stop
    "$0" "$MODE" start
    ;;
  deploy)
    install_deps
    build_static
    ensure_dirs
    package_static
    if [[ "$MODE" == "dev" ]]; then
      stop_dev_server || true
      start_dev_server
    else
      publish_static
    fi
    ;;
  *)
    fail "unsupported action: $ACTION"
    ;;
esac
