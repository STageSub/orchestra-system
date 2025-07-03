#!/bin/bash

echo "🔧 Konfigurera lokala subdomäner för Orchestra System"
echo ""
echo "Detta script lägger till lokala subdomäner i /etc/hosts"
echo "så att du kan testa med http://scoso.localhost:3000"
echo ""
echo "Du kommer behöva ange ditt lösenord för sudo."
echo ""

# Subdomains to add
SUBDOMAINS=("scoso" "sco" "goteborg" "malmo" "stockholm" "uppsala")

# Check if already exists
for subdomain in "${SUBDOMAINS[@]}"; do
    if grep -q "$subdomain.localhost" /etc/hosts; then
        echo "✓ $subdomain.localhost finns redan"
    else
        echo "➕ Lägger till $subdomain.localhost..."
        echo "127.0.0.1   $subdomain.localhost" | sudo tee -a /etc/hosts > /dev/null
    fi
done

echo ""
echo "✅ Klart! Du kan nu använda:"
echo ""
for subdomain in "${SUBDOMAINS[@]}"; do
    echo "   http://$subdomain.localhost:3000"
done
echo ""
echo "📝 OBS: I produktion fungerar subdomäner automatiskt:"
echo "   https://scoso.stagesub.com"
echo "   https://sco.stagesub.com"
echo "   etc."