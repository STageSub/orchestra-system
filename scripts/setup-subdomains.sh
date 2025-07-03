#!/bin/bash

# Setup script for subdomain routing configuration

echo "=== Orchestra System Subdomain Setup ==="
echo

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running on macOS or Linux
if [[ "$OSTYPE" == "darwin"* ]]; then
    HOSTS_FILE="/etc/hosts"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    HOSTS_FILE="/etc/hosts"
else
    echo -e "${RED}Unsupported OS. This script works on macOS and Linux only.${NC}"
    exit 1
fi

# Function to check if entry exists in hosts file
check_hosts_entry() {
    grep -q "$1" "$HOSTS_FILE" 2>/dev/null
}

# Function to add hosts entry
add_hosts_entry() {
    echo -e "${YELLOW}Adding $1 to hosts file...${NC}"
    echo "127.0.0.1 $1" | sudo tee -a "$HOSTS_FILE" > /dev/null
    echo -e "${GREEN}✓ Added $1${NC}"
}

# Step 1: Check and update hosts file
echo "Step 1: Checking hosts file configuration..."
echo

SUBDOMAINS=("goteborg.localhost" "malmo.localhost" "stockholm.localhost" "uppsala.localhost")
HOSTS_UPDATED=false

for subdomain in "${SUBDOMAINS[@]}"; do
    if check_hosts_entry "$subdomain"; then
        echo -e "${GREEN}✓ $subdomain already configured${NC}"
    else
        add_hosts_entry "$subdomain"
        HOSTS_UPDATED=true
    fi
done

if [ "$HOSTS_UPDATED" = true ]; then
    echo
    echo -e "${GREEN}Hosts file updated successfully!${NC}"
fi

echo
echo "Step 2: Environment variables configuration..."
echo

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${RED}✗ .env.local not found${NC}"
    echo "Please create .env.local first"
    exit 1
fi

# Check for DATABASE_URL environment variables
echo "Checking for DATABASE_URL configurations..."
echo

MISSING_ENV_VARS=()

for subdomain in GOTEBORG MALMO STOCKHOLM UPPSALA; do
    if grep -q "DATABASE_URL_$subdomain" .env.local; then
        echo -e "${GREEN}✓ DATABASE_URL_$subdomain found${NC}"
    else
        echo -e "${RED}✗ DATABASE_URL_$subdomain missing${NC}"
        MISSING_ENV_VARS+=("DATABASE_URL_$subdomain")
    fi
done

# If there are missing env vars, provide template
if [ ${#MISSING_ENV_VARS[@]} -gt 0 ]; then
    echo
    echo -e "${YELLOW}Add these to your .env.local file:${NC}"
    echo
    
    # Get the main DATABASE_URL as template
    MAIN_DB_URL=$(grep "^DATABASE_URL=" .env.local | cut -d'=' -f2-)
    
    if [ -n "$MAIN_DB_URL" ]; then
        echo "# Subdomain-specific database URLs"
        for var in "${MISSING_ENV_VARS[@]}"; do
            # Extract subdomain name
            SUBDOMAIN=$(echo $var | cut -d'_' -f3 | tr '[:upper:]' '[:lower:]')
            # Suggest a database name
            echo "$var=$MAIN_DB_URL"
        done
        echo
        echo -e "${YELLOW}Note: You'll need to create separate databases or update the URLs above${NC}"
        echo -e "${YELLOW}For testing, you can use the same database URL for all subdomains${NC}"
    else
        echo -e "${RED}Could not find main DATABASE_URL to use as template${NC}"
    fi
fi

echo
echo "Step 3: Testing configuration..."
echo

# Run the simple test
if [ -f "test-subdomain-simple.js" ]; then
    echo "Running subdomain detection test..."
    node test-subdomain-simple.js | tail -20
else
    echo -e "${RED}Test script not found${NC}"
fi

echo
echo "=== Setup Summary ==="
echo

if [ "$HOSTS_UPDATED" = true ]; then
    echo -e "${GREEN}✓ Hosts file updated${NC}"
else
    echo -e "${GREEN}✓ Hosts file already configured${NC}"
fi

if [ ${#MISSING_ENV_VARS[@]} -eq 0 ]; then
    echo -e "${GREEN}✓ All environment variables configured${NC}"
else
    echo -e "${YELLOW}⚠ Some environment variables need configuration${NC}"
fi

echo
echo "Next steps:"
echo "1. Configure any missing DATABASE_URL_* variables in .env.local"
echo "2. Restart the development server: npm run dev"
echo "3. Test subdomain access: http://goteborg.localhost:3000/admin"
echo "4. Run full test: node test-subdomain-routing.js"
echo