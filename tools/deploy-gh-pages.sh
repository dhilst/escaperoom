#!/bin/sh
# Build the game and publish dist/ as the gh-pages branch (GitHub Pages).
# The branch holds only the build: each deploy replaces it with one commit.
set -eu
cd "$(dirname "$0")/.."

remote=$(git remote get-url --push origin)
rev=$(git rev-parse --short HEAD)

npm run build
touch dist/.nojekyll # serve files as-is, no Jekyll processing

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
cp -R dist/. "$tmp"
cd "$tmp"
git init -q -b gh-pages
git add -A
git -c commit.gpgsign=false commit -q -m "Deploy $rev"
git push -f "$remote" gh-pages
echo "Deployed $rev to gh-pages"
