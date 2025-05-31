#!/bin/bash
set -e
for file in Screenshot*.png; do
  [ -e "$file" ] || continue
  output="${file%.png}.jpg"
  magick "$file" -quality 80 "$output"
  echo "new image: $output"
done
