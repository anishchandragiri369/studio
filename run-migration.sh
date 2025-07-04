#!/bin/bash

# Database Migration Script for Customized Subscription Fix
# This script adds the selected_fruit_bowls column to the user_subscriptions table

echo "🔧 Starting database migration for customized subscriptions..."
echo "============================================================"

# Check if SQL file exists
if [ ! -f "sql/add_fruit_bowls_to_subscriptions.sql" ]; then
    echo "❌ Migration file not found: sql/add_fruit_bowls_to_subscriptions.sql"
    echo "Please ensure you're running this from the project root directory."
    exit 1
fi

echo "📄 Migration file found: sql/add_fruit_bowls_to_subscriptions.sql"
echo ""

# Display the SQL that will be executed
echo "📋 SQL to be executed:"
echo "====================="
cat sql/add_fruit_bowls_to_subscriptions.sql
echo ""
echo "====================="
echo ""

# Check if environment variables are set
if [ -z "$DATABASE_URL" ] && [ -z "$SUPABASE_DB_URL" ]; then
    echo "⚠️  Database connection not configured."
    echo ""
    echo "Please set one of the following environment variables:"
    echo "  - DATABASE_URL (for direct PostgreSQL connection)"
    echo "  - SUPABASE_DB_URL (for Supabase database connection)"
    echo ""
    echo "Example:"
    echo "  export DATABASE_URL='postgresql://user:password@host:port/database'"
    echo "  # or"
    echo "  export SUPABASE_DB_URL='postgresql://postgres:[password]@[host]:5432/postgres'"
    echo ""
    echo "🔗 Alternative: Run this SQL manually in your Supabase SQL Editor"
    echo "   1. Go to https://app.supabase.com/project/[your-project]/sql"
    echo "   2. Copy and paste the SQL from sql/add_fruit_bowls_to_subscriptions.sql"
    echo "   3. Click 'Run'"
    exit 1
fi

# Determine which database URL to use
if [ -n "$DATABASE_URL" ]; then
    DB_URL="$DATABASE_URL"
    echo "🔗 Using DATABASE_URL for connection"
elif [ -n "$SUPABASE_DB_URL" ]; then
    DB_URL="$SUPABASE_DB_URL"
    echo "🔗 Using SUPABASE_DB_URL for connection"
fi

echo "🚀 Executing migration..."

# Execute the migration
if command -v psql &> /dev/null; then
    echo "📦 Using psql to execute migration..."
    psql "$DB_URL" -f sql/add_fruit_bowls_to_subscriptions.sql
    RESULT=$?
else
    echo "❌ psql not found. Please install PostgreSQL client tools or run the SQL manually."
    echo ""
    echo "🔗 Manual execution in Supabase SQL Editor:"
    echo "   1. Go to https://app.supabase.com/project/[your-project]/sql"
    echo "   2. Copy and paste the SQL from sql/add_fruit_bowls_to_subscriptions.sql"
    echo "   3. Click 'Run'"
    exit 1
fi

echo ""
if [ $RESULT -eq 0 ]; then
    echo "✅ Migration completed successfully!"
    echo ""
    echo "🧪 Next Steps:"
    echo "1. Run the end-to-end test: node test-final-customized-subscription.js"
    echo "2. Create a test order with both juices and fruit bowls"
    echo "3. Verify subscription is created with both selections"
    echo ""
    echo "🎯 Expected Result:"
    echo "   Customized subscriptions should now be created with both"
    echo "   selected_juices and selected_fruit_bowls populated in the database."
else
    echo "❌ Migration failed with exit code $RESULT"
    echo ""
    echo "💡 Troubleshooting:"
    echo "1. Check database connection"
    echo "2. Verify database permissions"
    echo "3. Run the SQL manually in Supabase SQL Editor"
fi

echo ""
echo "============================================================"
echo "🏁 Migration script completed"
