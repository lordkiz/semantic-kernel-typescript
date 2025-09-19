#!/usr/bin/env bash
set -euo pipefail

for pkg in "core" "agents" "aiservices/gemini" "aiservices/huggingface" "aiservices/openai"; do
  echo "📦 Building $pkg..."

  pushd "$pkg" > /dev/null

  rm -rf "dist"

  npm run build

  if [ "$pkg" == "core" ] || [ "$pkg" == "agents" ]; then
    cp "../README.md" "dist/README.md"
    cp "../LICENSE" "dist/LICENSE"
  else
    cp "../../README.md" "dist/README.md"
    cp "../../LICENSE" "dist/LICENSE"
  fi

  cp package.json dist/package.json

  echo "✅ Finished building $pkg"

  popd > /dev/null
done

echo "🎉 All packages built successfully!"
