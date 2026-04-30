#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_DIR="$(cd "$DEPLOY_DIR/.." && pwd)"

log() {
  printf '[frontend-deploy] %s\n' "$*"
}

fail() {
  printf '[frontend-deploy] ERROR: %s\n' "$*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "missing command: $1"
}

load_env() {
  local mode="${1:-prod}"
  local env_file="$DEPLOY_DIR/env/${mode}.env"
  [[ -f "$env_file" ]] || fail "env file not found: $env_file"
  # shellcheck disable=SC1090
  source "$env_file"

  : "${APP_ENV:=$mode}"
  : "${FRONTEND_DEPLOY_ROOT:=/opt/evaluation-manager/frontend}"
  : "${FRONTEND_STATIC_DIR:=$FRONTEND_DEPLOY_ROOT/current}"
  : "${FRONTEND_PID_DIR:=$FRONTEND_DEPLOY_ROOT/run}"
  : "${FRONTEND_LOG_DIR:=$FRONTEND_DEPLOY_ROOT/logs}"
  : "${FRONTEND_PACKAGE_DIR:=$FRONTEND_DEPLOY_ROOT/packages}"
}

ensure_dirs() {
  mkdir -p "$FRONTEND_STATIC_DIR" "$FRONTEND_PID_DIR" "$FRONTEND_LOG_DIR" "$FRONTEND_PACKAGE_DIR"
}

detect_pkg_manager() {
  if [[ -f "$PROJECT_DIR/pnpm-lock.yaml" ]] && command -v pnpm >/dev/null 2>&1; then
    echo "pnpm"
    return
  fi
  if command -v npm >/dev/null 2>&1; then
    echo "npm"
    return
  fi
  fail "pnpm or npm is required"
}

install_deps() {
  local pm
  pm="$(detect_pkg_manager)"
  log "install dependencies with $pm"
  if [[ "$pm" == "pnpm" ]]; then
    (cd "$PROJECT_DIR" && pnpm install --frozen-lockfile)
  else
    (cd "$PROJECT_DIR" && npm install)
  fi
}

build_static() {
  local pm
  pm="$(detect_pkg_manager)"
  export NUXT_PUBLIC_APP_NAME NUXT_PUBLIC_API_BASE NUXT_DEVTOOLS
  log "build static site for $APP_ENV"
  if [[ "$pm" == "pnpm" ]]; then
    (cd "$PROJECT_DIR" && pnpm exec nuxt generate)
  else
    (cd "$PROJECT_DIR" && npx nuxt generate)
  fi
}

render_nginx_conf() {
  local target="${1:?target required}"
  local template="$DEPLOY_DIR/nginx/evaluation-manager.conf.template"
  [[ -f "$template" ]] || fail "nginx template not found: $template"
  sed \
    -e "s#__NGINX_LISTEN_PORT__#${NGINX_LISTEN_PORT}#g" \
    -e "s#__NGINX_SERVER_NAME__#${NGINX_SERVER_NAME}#g" \
    -e "s#__FRONTEND_STATIC_DIR__#${FRONTEND_STATIC_DIR}#g" \
    -e "s#__BACKEND_PROXY_HOST__#${BACKEND_PROXY_HOST}#g" \
    -e "s#__BACKEND_PROXY_PORT__#${BACKEND_PROXY_PORT}#g" \
    "$template" > "$target"
}

package_static() {
  local ts package_root archive_file
  ts="$(date +%Y%m%d%H%M%S)"
  package_root="$FRONTEND_PACKAGE_DIR/frontend-${APP_ENV}-${ts}"
  archive_file="$FRONTEND_PACKAGE_DIR/frontend-${APP_ENV}-${ts}.tar.gz"

  rm -rf "$package_root"
  mkdir -p "$package_root/public" "$package_root/nginx"
  cp -R "$PROJECT_DIR/.output/public/." "$package_root/public/"
  render_nginx_conf "$package_root/nginx/evaluation-manager.conf"
  tar -czf "$archive_file" -C "$FRONTEND_PACKAGE_DIR" "frontend-${APP_ENV}-${ts}"
  rm -rf "$package_root"
  log "package created: $archive_file"
}

publish_static() {
  require_cmd nginx
  ensure_dirs
  log "publish static files to $FRONTEND_STATIC_DIR"
  rm -rf "$FRONTEND_STATIC_DIR"
  mkdir -p "$FRONTEND_STATIC_DIR"
  cp -R "$PROJECT_DIR/.output/public/." "$FRONTEND_STATIC_DIR/"
  render_nginx_conf "$NGINX_CONF_TARGET"
  nginx -t
  if command -v systemctl >/dev/null 2>&1; then
    systemctl reload nginx
  else
    nginx -s reload
  fi
}

start_dev_server() {
  local pm pid_file log_file
  pm="$(detect_pkg_manager)"
  ensure_dirs
  pid_file="$FRONTEND_PID_DIR/frontend-${APP_ENV}.pid"
  log_file="$FRONTEND_LOG_DIR/frontend-${APP_ENV}.log"

  if [[ -f "$pid_file" ]] && kill -0 "$(cat "$pid_file")" >/dev/null 2>&1; then
    fail "frontend dev server already running, pid=$(cat "$pid_file")"
  fi

  export NUXT_PUBLIC_APP_NAME NUXT_PUBLIC_API_BASE NUXT_DEVTOOLS
  log "start Nuxt dev server on ${FRONTEND_HOST}:${FRONTEND_PORT}"
  if [[ "$pm" == "pnpm" ]]; then
    (cd "$PROJECT_DIR" && nohup pnpm exec nuxt dev --host "$FRONTEND_HOST" --port "$FRONTEND_PORT" >"$log_file" 2>&1 & echo $! > "$pid_file")
  else
    (cd "$PROJECT_DIR" && nohup npx nuxt dev --host "$FRONTEND_HOST" --port "$FRONTEND_PORT" >"$log_file" 2>&1 & echo $! > "$pid_file")
  fi
  log "frontend dev server started, pid=$(cat "$pid_file")"
}

stop_dev_server() {
  local pid_file
  pid_file="$FRONTEND_PID_DIR/frontend-${APP_ENV}.pid"
  [[ -f "$pid_file" ]] || {
    log "frontend pid file not found, nothing to stop"
    return
  }

  local pid
  pid="$(cat "$pid_file")"
  if kill -0 "$pid" >/dev/null 2>&1; then
    kill "$pid"
    sleep 1
    if kill -0 "$pid" >/dev/null 2>&1; then
      kill -9 "$pid"
    fi
  fi
  rm -f "$pid_file"
  log "frontend dev server stopped"
}

remove_nginx_site() {
  require_cmd nginx
  if [[ -f "$NGINX_CONF_TARGET" ]]; then
    rm -f "$NGINX_CONF_TARGET"
    nginx -t
    if command -v systemctl >/dev/null 2>&1; then
      systemctl reload nginx
    else
      nginx -s reload
    fi
    log "nginx site removed: $NGINX_CONF_TARGET"
  else
    log "nginx site not found, nothing to stop"
  fi
}
