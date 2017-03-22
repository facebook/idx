#!/usr/bin/env bash

#
# Build script for `idx`. Run using `npm run build`.
#

set -e
set -u

ROOT_DIR=$(dirname "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)")

babel "$ROOT_DIR/src" --out-dir "$ROOT_DIR/lib" --ignore test.js --copy-files

# Strip `@providesModule` from lib/**/*.js.
find "$ROOT_DIR/lib" -type f -name '*.js' -exec \
  sed -i '' '/^ \* @providesModule /d' {} \;
