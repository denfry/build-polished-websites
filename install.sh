#!/usr/bin/env bash
set -euo pipefail

if [[ -d /usr/bin ]]; then
  PATH="/usr/bin:${PATH:-}"
fi

agent="all"
scope="user"
project_path="."
replace="false"
skill_name="build-polished-websites"

usage() {
  cat <<'EOF'
Usage: ./install.sh [options]

Options:
  --agent all|claude|codex|opencode
  --scope user|project
  --project-path PATH
  --replace
  --help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --agent)
      agent="${2:-}"
      shift 2
      ;;
    --scope)
      scope="${2:-}"
      shift 2
      ;;
    --project-path)
      project_path="${2:-}"
      shift 2
      ;;
    --replace)
      replace="true"
      shift
      ;;
    --help)
      usage
      exit 0
      ;;
    *)
      printf 'Unknown option: %s\n\n' "$1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

case "$agent" in
  all|claude|codex|opencode) ;;
  *)
    printf 'Invalid --agent value: %s\n' "$agent" >&2
    exit 2
    ;;
esac

case "$scope" in
  user|project) ;;
  *)
    printf 'Invalid --scope value: %s\n' "$scope" >&2
    exit 2
    ;;
esac

script_path="${BASH_SOURCE[0]}"
if [[ "$script_path" == */* ]]; then
  script_parent="${script_path%/*}"
else
  script_parent="."
fi
script_dir="$(cd -- "$script_parent" && pwd -P)"
source_path="$script_dir/$skill_name"

if [[ ! -f "$source_path/SKILL.md" ]]; then
  printf 'Invalid package: SKILL.md was not found at %s\n' "$source_path" >&2
  exit 2
fi

if [[ "$scope" == "project" ]]; then
  if [[ ! -d "$project_path" ]]; then
    printf 'Project path does not exist: %s\n' "$project_path" >&2
    exit 2
  fi
  base_path="$(cd -- "$project_path" && pwd -P)"
else
  user_profile_path="${HOME:-}"
  if [[ -z "$user_profile_path" ]]; then
    printf 'Unable to resolve the current user profile directory.\n' >&2
    exit 2
  fi
  base_path="$user_profile_path"
fi

declare -a roots
if [[ "$agent" == "all" ]]; then
  roots=(".claude/skills" ".agents/skills")
elif [[ "$agent" == "claude" ]]; then
  roots=(".claude/skills")
elif [[ "$agent" == "codex" ]]; then
  roots=(".agents/skills")
elif [[ "$scope" == "user" ]]; then
  roots=(".config/opencode/skills")
else
  roots=(".opencode/skills")
fi

declare -a destinations
for root in "${roots[@]}"; do
  destinations+=("$base_path/$root/$skill_name")
done

if [[ "$replace" != "true" ]]; then
  declare -a existing_destinations=()
  for destination in "${destinations[@]}"; do
    if [[ -e "$destination" ]]; then
      existing_destinations+=("$destination")
    fi
  done
  if [[ ${#existing_destinations[@]} -gt 0 ]]; then
    printf 'Destination already exists: %s. Re-run with --replace to back it up and install.\n' \
      "${existing_destinations[*]}" >&2
    exit 1
  fi
fi

install_directory() {
  local destination="$1"
  local parent
  local backup=""
  local temporary
  parent="${destination%/*}"
  mkdir -p -- "$parent"

  temporary="$destination.installing-$$"
  if [[ -e "$temporary" ]]; then
    printf 'Temporary destination already exists: %s\n' "$temporary" >&2
    return 1
  fi

  if [[ -e "$destination" ]]; then
    if [[ "$replace" != "true" ]]; then
      printf 'Destination already exists: %s. Re-run with --replace to back it up and install.\n' "$destination" >&2
      return 1
    fi
    backup="$destination.backup-$(date +%Y%m%d-%H%M%S)"
    if [[ -e "$backup" ]]; then
      printf 'Backup destination already exists: %s\n' "$backup" >&2
      return 1
    fi
    mv -- "$destination" "$backup"
  fi

  if ! cp -R -- "$source_path" "$temporary"; then
    [[ -e "$temporary" ]] && rm -rf -- "$temporary"
    [[ -n "$backup" && ! -e "$destination" && -e "$backup" ]] && mv -- "$backup" "$destination"
    return 1
  fi

  if [[ ! -f "$temporary/SKILL.md" ]]; then
    rm -rf -- "$temporary"
    [[ -n "$backup" && ! -e "$destination" && -e "$backup" ]] && mv -- "$backup" "$destination"
    printf 'Copied package is incomplete: SKILL.md is missing.\n' >&2
    return 1
  fi

  mv -- "$temporary" "$destination"
  printf '  %s\n' "$destination"
  if [[ -n "$backup" ]]; then
    printf '  Backup: %s\n' "$backup"
  fi
}

printf 'Installing %s:\n' "$skill_name"
for destination in "${destinations[@]}"; do
  install_directory "$destination"
done
printf 'Installation complete.\n'
