#!/usr/bin/env bash
# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

#
# Build script for `idx`. Run using `npm run build`.
#

set -e
set -u

ROOT_DIR=$(dirname "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)")

rm -rf "${ROOT_DIR:?}/lib"
babel "$ROOT_DIR/src" --out-dir "$ROOT_DIR/lib" --copy-files
rm "$ROOT_DIR"/lib/idx.test.{js,ts}

# Strip `@providesModule` from lib/**/*.js.
find "$ROOT_DIR/lib" -type f -name '*.js' -exec \
  sed -i '' '/^ \* @providesModule /d' {} \;
