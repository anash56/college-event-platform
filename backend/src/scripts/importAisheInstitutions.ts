import XLSX from "xlsx";
import { prisma } from "../lib/prisma";

// -------------------------
// Configuration
// -------------------------

const filePath = "data/aishe-institutions.xlsx";

// -------------------------
// Read Excel file
// -------------------------

console.log("Reading AISHE Excel file...");

const workbook = XLSX.readFile(filePath);

const firstSheetName = workbook.SheetNames[0];

if (!firstSheetName) {
  throw new Error("Excel file contains no sheets");
}

const firstSheet = workbook.Sheets[firstSheetName];

if (!firstSheet) {
  throw new Error("Could not read the first sheet");
}

// Read Excel as raw arrays
const rawData = XLSX.utils.sheet_to_json(firstSheet, {
  header: 1,
  defval: null,
}) as unknown[][];

console.log("Total Excel rows:", rawData.length);

// -------------------------
// Find header row
// -------------------------

// Excel row 3 = index 2
const headerRow = rawData[2];

if (!headerRow) {
  throw new Error("Could not find header row");
}

console.log("Header row:", headerRow);

// -------------------------
// Get institution rows
// -------------------------

// Excel row 4 onward
const institutionRows = rawData.slice(3);

console.log("Institution rows:", institutionRows.length);

// -------------------------
// Helper functions
// -------------------------

function getCell(
  row: unknown[],
  index: number
): string | number | null {
  const value = row[index];

  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === "string" || typeof value === "number") {
    return value;
  }

  return String(value);
}

function cleanValue(
  value: string | number | null
): string | null {
  if (value === null) {
    return null;
  }

  const cleaned = String(value).trim();

  if (
    cleaned === "" ||
    cleaned === "-" ||
    cleaned.toLowerCase() === "nil.com"
  ) {
    return null;
  }

  return cleaned;
}

function cleanRequiredValue(
  value: string | number | null
): string {
  return cleanValue(value) ?? "";
}

function cleanYear(
  value: string | number | null
): number | null {
  if (value === null) {
    return null;
  }

  const year = Number(value);

  return Number.isInteger(year) ? year : null;
}

// -------------------------
// Convert Excel rows
// -------------------------

const institutions = institutionRows.map((row) => {
  return {
    aisheCode: cleanRequiredValue(getCell(row, 0)),
    name: cleanRequiredValue(getCell(row, 1)),
    state: cleanRequiredValue(getCell(row, 2)),
    district: cleanRequiredValue(getCell(row, 3)),

    website: cleanValue(getCell(row, 4)),
    yearOfEstablishment: cleanYear(getCell(row, 5)),
    location: cleanValue(getCell(row, 6)),
    collegeType: cleanValue(getCell(row, 7)),
    management: cleanValue(getCell(row, 8)),

    universityAisheCode: cleanValue(getCell(row, 9)),
    universityName: cleanValue(getCell(row, 10)),
    universityType: cleanValue(getCell(row, 11)),
  };
});

// -------------------------
// Validation
// -------------------------

console.log("\nRunning validation...");

// 1. Check missing AISHE codes

const missingAisheCodes = institutions.filter(
  (institution) => !institution.aisheCode
);

console.log(
  "Missing AISHE codes:",
  missingAisheCodes.length
);

if (missingAisheCodes.length > 0) {
  console.log(
    "Institutions with missing AISHE codes:",
    missingAisheCodes
  );

  throw new Error("Some institutions are missing AISHE codes");
}

// 2. Check duplicate AISHE codes

const aisheCodeCounts = new Map<string, number>();

for (const institution of institutions) {
  const count =
    aisheCodeCounts.get(institution.aisheCode) ?? 0;

  aisheCodeCounts.set(
    institution.aisheCode,
    count + 1
  );
}

const duplicateAisheCodes = [
  ...aisheCodeCounts.entries(),
].filter(([, count]) => count > 1);

console.log(
  "Duplicate AISHE codes:",
  duplicateAisheCodes.length
);

if (duplicateAisheCodes.length > 0) {
  console.log(
    "Duplicates:",
    duplicateAisheCodes
  );

  throw new Error(
    "Duplicate AISHE codes found"
  );
}

// 3. Check missing college names

const missingNames = institutions.filter(
  (institution) => !institution.name
);

console.log(
  "Missing college names:",
  missingNames.length
);

if (missingNames.length > 0) {
  console.log(
    "Institutions with missing names:",
    missingNames
  );

  throw new Error(
    "Some institutions are missing college names"
  );
}

// 4. Check invalid establishment years

const currentYear = new Date().getFullYear();

const invalidYears = institutions.filter(
  (institution) =>
    institution.yearOfEstablishment !== null &&
    (
      institution.yearOfEstablishment < 1800 ||
      institution.yearOfEstablishment > currentYear
    )
);

console.log(
  "Invalid establishment years:",
  invalidYears.length
);

if (invalidYears.length > 0) {
  console.log(
    "Institutions with invalid years:",
    invalidYears
  );

  throw new Error(
    "Invalid establishment years found"
  );
}

// 5. Check expected record count

if (institutions.length !== 442) {
  throw new Error(
    `Expected 442 institutions, but found ${institutions.length}`
  );
}

console.log("\nValidation completed.");

console.log(
  `Validated ${institutions.length} institutions successfully.`
);

// -------------------------
// Display sample records
// -------------------------

console.log("\nFirst cleaned institution:");

console.log(institutions[0]);

console.log("\nLast cleaned institution:");

console.log(
  institutions[institutions.length - 1]
);

// -------------------------
// Import into PostgreSQL
// -------------------------

async function main() {
  console.log(
    "\nImporting institutions into PostgreSQL..."
  );

  let importedCount = 0;

  try {
    for (const institution of institutions) {
      await prisma.governmentInstitution.upsert({
        where: {
          aisheCode: institution.aisheCode,
        },

        update: {
          name: institution.name,
          state: institution.state,
          district: institution.district,
          website: institution.website,
          yearOfEstablishment:
            institution.yearOfEstablishment,
          location: institution.location,
          collegeType: institution.collegeType,
          management: institution.management,
          universityAisheCode:
            institution.universityAisheCode,
          universityName:
            institution.universityName,
          universityType:
            institution.universityType,
        },

        create: {
          aisheCode: institution.aisheCode,
          name: institution.name,
          state: institution.state,
          district: institution.district,
          website: institution.website,
          yearOfEstablishment:
            institution.yearOfEstablishment,
          location: institution.location,
          collegeType: institution.collegeType,
          management: institution.management,
          universityAisheCode:
            institution.universityAisheCode,
          universityName:
            institution.universityName,
          universityType:
            institution.universityType,
        },
      });

      importedCount++;

      if (importedCount % 50 === 0) {
        console.log(
          `Imported ${importedCount}/${institutions.length} institutions...`
        );
      }
    }

    console.log(
      `\nSuccessfully imported ${importedCount} institutions.`
    );
  } catch (error) {
    console.error(
      "\nFailed to import AISHE institutions:"
    );

    console.error(error);

    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();