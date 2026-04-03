// This file is used to store the exact layout and card structure for the PDF nutrition plan.
// It will be referenced for patching PdfGenerator.jsx to match the layout in the attached screenshot.

// Layout notes:
// - Title: Nutrition Plan (centered, bold, large font)
// - Client name: centered, bold, below title
// - Each card: rounded rectangle, transparent, black border, fits content
// - Card header: day name (bold, left-aligned)
// - Card table: meal name (bold, left), time (small, left), meal description (normal, left)
// - Two cards per page, stacked vertically, with spacing
// - Last page: week meal plan card (same style), notes, mental observations, supplements (each in own card)
// - Font: sans-serif, black color
// - All content fits inside cards, no overflow
// - Background: bb.png, full page

// Example card structure:
// +-------------------------------+
// | Sunday                        |
// |-------------------------------|
// | Breakfast   06:00   ...       |
// | Snack 1     09:00   ...       |
// | Dinner      22:00   ...       |
// | Pre-Workout Snack N/A   ...   |
// | Post-Workout Snack N/A  ...   |
// +-------------------------------+

// Patch will update PdfGenerator.jsx to match this layout.
