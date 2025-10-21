#!/bin/bash
while true; do
  [ -f Photos.zip ] && mkdir -p Photos && unzip -qo Photos.zip -d Photos &&
  for f in Photos/*.JPG; do
    [ -f "$f" ] || continue
    lowercase_f="${f%.*}.jpg"
    mv "$f" "$lowercase_f" &&
    exiftool "-gps*=" "-FileModifyDate<CreateDate" -overwrite_original "$lowercase_f" &&
    date_prefix=$(exiftool -d "%m-%d" -CreateDate -s3 "$lowercase_f") &&
    mv "$lowercase_f" "$(dirname "$lowercase_f")/${date_prefix}_$(basename "$lowercase_f")";
  done &&
  mv Photos/*.jpg . 2>/dev/null &&
  rm -rf Photos.zip Photos;
  sleep 2;
done
