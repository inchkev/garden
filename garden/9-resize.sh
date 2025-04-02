#!/bin/bash

# Target directory, defaults to current
TARGET_DIR="${1:-.}"

# For each .jpg,
for img in "$TARGET_DIR"/*.jpg; do
    # Skip if there are no matches
    [ -e "$img" ] || continue

    # Get image dimensions
    read width height <<< $(identify -format "%w %h" "$img")

    if (( width > height )); then
        max_dim="$width"
    else
        max_dim="$height"
    fi

    # Resize to no more than 2000x2000
    if (( max_dim > 2000 )); then
        magick mogrify -define preserve-timestamp=true -resize "2000x2000>" "$img"
        echo "Resized: $img"
    fi

    # If color profile is Display P3 (iPhone), convert to sRGB2014
    profile=$(exiftool -T -ProfileDescription "$img")
    if [[ "$profile" == "Display P3" ]]; then
        magick mogrify -define preserve-timestamp=true -profile ~/Downloads/sRGB2014.icc "$img"
        echo "Converted to sRGB: $img"
    fi

done

