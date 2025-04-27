#!/bin/bash
fswatch -o --exclude="index\.html$" . | while read change; do
    eval "npm run cultivate"
done
