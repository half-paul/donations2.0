#!/bin/bash

# Prisma Schema Validation Script
# Validates schema syntax, checks for common issues, and verifies migration readiness

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║          Prisma Schema Validation Script                       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if npx is available
if ! command -v npx &> /dev/null; then
    echo -e "${RED}✗ Error: npx not found. Please install Node.js and npm.${NC}"
    exit 1
fi

# Check if Prisma is installed
if ! npx prisma --version &> /dev/null; then
    echo -e "${RED}✗ Error: Prisma CLI not found. Run: npm install prisma${NC}"
    exit 1
fi

echo -e "${BLUE}1. Checking Prisma CLI version...${NC}"
PRISMA_VERSION=$(npx prisma --version | grep "prisma" | head -1 | awk '{print $3}')
echo -e "${GREEN}✓ Prisma CLI version: ${PRISMA_VERSION}${NC}"
echo ""

echo -e "${BLUE}2. Validating schema.prisma syntax...${NC}"
if npx prisma validate 2>&1 | grep -q "The schema is valid"; then
    echo -e "${GREEN}✓ Schema syntax is valid${NC}"
else
    echo -e "${RED}✗ Schema validation failed${NC}"
    npx prisma validate
    exit 1
fi
echo ""

echo -e "${BLUE}3. Checking schema.prisma file structure...${NC}"

# Check for required sections
if grep -q "generator client" prisma/schema.prisma; then
    echo -e "${GREEN}✓ Generator client block found${NC}"
else
    echo -e "${RED}✗ Generator client block missing${NC}"
    exit 1
fi

if grep -q "datasource db" prisma/schema.prisma; then
    echo -e "${GREEN}✓ Datasource db block found${NC}"
else
    echo -e "${RED}✗ Datasource db block missing${NC}"
    exit 1
fi

# Count models
MODEL_COUNT=$(grep -c "^model " prisma/schema.prisma)
echo -e "${GREEN}✓ Found ${MODEL_COUNT} models${NC}"

# Count enums
ENUM_COUNT=$(grep -c "^enum " prisma/schema.prisma)
echo -e "${GREEN}✓ Found ${ENUM_COUNT} enums${NC}"
echo ""

echo -e "${BLUE}4. Checking for required entities...${NC}"

REQUIRED_ENTITIES=("Donor" "Gift" "RecurringPlan" "Campaign" "Form" "Receipt" "Tribute" "Ecard" "Audit" "WebhookEvent")

for entity in "${REQUIRED_ENTITIES[@]}"; do
    if grep -q "^model ${entity}" prisma/schema.prisma; then
        echo -e "${GREEN}✓ ${entity} model found${NC}"
    else
        echo -e "${RED}✗ ${entity} model missing${NC}"
        exit 1
    fi
done
echo ""

echo -e "${BLUE}5. Checking for required enums...${NC}"

REQUIRED_ENUMS=("Currency" "GiftStatus" "RecurringFrequency" "RecurringPlanStatus" "CampaignStatus" "PaymentProcessor" "TributeType" "AuditAction")

for enum in "${REQUIRED_ENUMS[@]}"; do
    if grep -q "^enum ${enum}" prisma/schema.prisma; then
        echo -e "${GREEN}✓ ${enum} enum found${NC}"
    else
        echo -e "${RED}✗ ${enum} enum missing${NC}"
        exit 1
    fi
done
echo ""

echo -e "${BLUE}6. Checking for indexes...${NC}"

# Count indexes
INDEX_COUNT=$(grep -c "@@index" prisma/schema.prisma)
echo -e "${GREEN}✓ Found ${INDEX_COUNT} indexes${NC}"

# Check for critical indexes
CRITICAL_INDEXES=("idx_donor_emails" "idx_gift_donor" "idx_gift_status" "unique_processor_event")

FOUND_INDEXES=0
for index in "${CRITICAL_INDEXES[@]}"; do
    if grep -q "name: \"${index}\"" prisma/schema.prisma; then
        FOUND_INDEXES=$((FOUND_INDEXES + 1))
    fi
done

echo -e "${GREEN}✓ Found ${FOUND_INDEXES}/${#CRITICAL_INDEXES[@]} critical indexes${NC}"
echo ""

echo -e "${BLUE}7. Checking for foreign key relationships...${NC}"

# Count foreign keys
FK_COUNT=$(grep -c "@relation(fields:" prisma/schema.prisma)
echo -e "${GREEN}✓ Found ${FK_COUNT} foreign key relationships${NC}"
echo ""

echo -e "${BLUE}8. Checking for soft delete support...${NC}"

# Check for deletedAt fields
SOFT_DELETE_MODELS=("Donor" "Campaign" "Gift")

for model in "${SOFT_DELETE_MODELS[@]}"; do
    if awk "/^model ${model}/,/^}/" prisma/schema.prisma | grep -q "deletedAt.*DateTime"; then
        echo -e "${GREEN}✓ ${model} has deletedAt field${NC}"
    else
        echo -e "${YELLOW}⚠ ${model} missing deletedAt field${NC}"
    fi
done
echo ""

echo -e "${BLUE}9. Checking migration files...${NC}"

if [ -d "prisma/migrations" ]; then
    MIGRATION_COUNT=$(find prisma/migrations -name "migration.sql" | wc -l)
    echo -e "${GREEN}✓ Found ${MIGRATION_COUNT} migration(s)${NC}"

    # List migrations
    echo -e "${BLUE}   Migrations:${NC}"
    find prisma/migrations -name "migration.sql" -exec dirname {} \; | xargs -n1 basename
else
    echo -e "${YELLOW}⚠ No migrations directory found${NC}"
fi
echo ""

echo -e "${BLUE}10. Checking seed file...${NC}"

if [ -f "prisma/seed.ts" ]; then
    echo -e "${GREEN}✓ Seed file found (prisma/seed.ts)${NC}"

    # Check if seed script is configured in package.json
    if [ -f "package.json" ] && grep -q "\"prisma\":" package.json && grep -q "\"seed\":" package.json; then
        echo -e "${GREEN}✓ Seed script configured in package.json${NC}"
    else
        echo -e "${YELLOW}⚠ Seed script not configured in package.json${NC}"
        echo -e "${YELLOW}  Add this to package.json:${NC}"
        echo -e "${YELLOW}  {${NC}"
        echo -e "${YELLOW}    \"prisma\": {${NC}"
        echo -e "${YELLOW}      \"seed\": \"tsx prisma/seed.ts\"${NC}"
        echo -e "${YELLOW}    }${NC}"
        echo -e "${YELLOW}  }${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Seed file not found${NC}"
fi
echo ""

echo -e "${BLUE}11. Checking environment configuration...${NC}"

if [ -f "prisma/.env.example" ]; then
    echo -e "${GREEN}✓ .env.example found${NC}"
else
    echo -e "${YELLOW}⚠ .env.example not found${NC}"
fi

if [ -f ".env" ]; then
    echo -e "${GREEN}✓ .env file exists${NC}"

    # Check if DATABASE_URL is set
    if grep -q "^DATABASE_URL=" .env; then
        echo -e "${GREEN}✓ DATABASE_URL is configured${NC}"
    else
        echo -e "${RED}✗ DATABASE_URL not configured in .env${NC}"
    fi
else
    echo -e "${YELLOW}⚠ .env file not found${NC}"
    echo -e "${YELLOW}  Run: cp prisma/.env.example .env${NC}"
fi
echo ""

echo -e "${BLUE}12. Checking documentation...${NC}"

DOCS=("README.md" "SCHEMA-DESIGN.md" "MIGRATION-GUIDE.md" "SCHEMA-DIAGRAM.md" "INDEX.md")
DOC_COUNT=0

for doc in "${DOCS[@]}"; do
    if [ -f "prisma/${doc}" ]; then
        DOC_COUNT=$((DOC_COUNT + 1))
        echo -e "${GREEN}✓ ${doc}${NC}"
    else
        echo -e "${YELLOW}⚠ ${doc} missing${NC}"
    fi
done

echo -e "${GREEN}✓ Found ${DOC_COUNT}/${#DOCS[@]} documentation files${NC}"
echo ""

# Summary
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                      Validation Summary                        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✓ Schema validation: PASSED${NC}"
echo -e "${GREEN}✓ Entities: ${MODEL_COUNT} models found${NC}"
echo -e "${GREEN}✓ Enums: ${ENUM_COUNT} enums found${NC}"
echo -e "${GREEN}✓ Indexes: ${INDEX_COUNT} indexes found${NC}"
echo -e "${GREEN}✓ Foreign Keys: ${FK_COUNT} relationships found${NC}"
echo -e "${GREEN}✓ Documentation: ${DOC_COUNT}/${#DOCS[@]} files found${NC}"
echo ""

# Next steps
echo -e "${BLUE}Next Steps:${NC}"
echo ""
echo -e "  1. Configure environment:"
echo -e "     ${YELLOW}cp prisma/.env.example .env${NC}"
echo -e "     ${YELLOW}# Edit .env and set DATABASE_URL${NC}"
echo ""
echo -e "  2. Apply migrations:"
echo -e "     ${YELLOW}npx prisma migrate dev${NC}"
echo ""
echo -e "  3. Seed test data:"
echo -e "     ${YELLOW}npx prisma db seed${NC}"
echo ""
echo -e "  4. Generate Prisma Client:"
echo -e "     ${YELLOW}npx prisma generate${NC}"
echo ""
echo -e "  5. View database in Prisma Studio:"
echo -e "     ${YELLOW}npx prisma studio${NC}"
echo ""

echo -e "${GREEN}✓ Schema validation complete!${NC}"
