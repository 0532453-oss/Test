#!/bin/bash
# FlexDesk Package Migration Script
# Run this script after closing all IDEs and dev servers
# Usage: bash scripts/migrate-package-names.sh

set -e

PACKAGES_DIR="packages"

echo "🚀 FlexDesk Package Migration"
echo "============================="
echo ""

# Function to rename directory
rename_package() {
    local old_name=$1
    local new_name=$2

    if [ -d "$PACKAGES_DIR/$old_name" ]; then
        if [ -d "$PACKAGES_DIR/$new_name" ]; then
            echo "⚠️  $new_name already exists, skipping $old_name"
        else
            mv "$PACKAGES_DIR/$old_name" "$PACKAGES_DIR/$new_name"
            echo "✅ Renamed $old_name → $new_name"
        fi
    else
        echo "⏭️  $old_name not found (may already be renamed)"
    fi
}

echo "📦 Renaming packages..."
echo ""

# Rename remaining packages
rename_package "service-flex-admin-kit" "flexdesk-admin"
rename_package "service-flex-website" "flexdesk-website"
rename_package "simple-jobber-preview" "flexdesk-preview"
rename_package "service-flex-types" "flexdesk-shared"
rename_package "service-flex-core" "flexdesk-core"
rename_package "service-flex-analytics" "flexdesk-analytics"
rename_package "service-flex-front" "flexdesk-front"
rename_package "service-flex-web-admin" "flexdesk-web-admin"
rename_package "service-flex-cli" "flexdesk-cli"
rename_package "service-flex-maps" "flexdesk-maps"
rename_package "create-service-flex-app" "create-flexdesk-app"

echo ""
echo "📝 Updating project.json sourceRoot paths..."

# Update project.json files with new paths
for dir in "$PACKAGES_DIR"/flexdesk-*/; do
    if [ -f "$dir/project.json" ]; then
        package_name=$(basename "$dir")
        # Update sourceRoot in project.json
        if command -v sed &> /dev/null; then
            sed -i.bak "s|packages/service-flex-[^/]*/|packages/$package_name/|g" "$dir/project.json"
            sed -i.bak "s|packages/simple-jobber-preview/|packages/$package_name/|g" "$dir/project.json"
            rm -f "$dir/project.json.bak"
            echo "✅ Updated $dir/project.json"
        fi
    fi
done

echo ""
echo "🎉 Migration complete!"
echo ""
echo "Next steps:"
echo "1. Run 'pnpm install' to update workspace links"
echo "2. Run 'nx graph' to verify the dependency graph"
echo "3. Run 'nx run-many --target=build --all' to verify builds"
