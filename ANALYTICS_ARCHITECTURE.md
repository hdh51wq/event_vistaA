# Analytics Architecture & Data Flow

This document describes how the EventVista Analytics system works, the data it uses for calculations, and how project deletions affect the insights.

## 1. Technical Flow

The analytics system follows a **Dynamic Calculation** model rather than a pre-aggregated one. This ensures real-time accuracy.

1.  **Request**: When a user visits `/analytics`, the `AnalyticsPage` (`src/app/analytics/page.tsx`) sends a request to the `/api/analytics` endpoint.
2.  **Authentication**: The API verifies the user's session token to ensure they only see their own agency's data.
3.  **Filtering**: The API receives parameters like `dateRange` (e.g., "this_year", "last_90"), `eventType`, and `client`.
4.  **Database Query**: The backend (`src/app/api/analytics/route.ts`) performs three parallel queries to MongoDB:
    *   **Current Period**: Projects within the selected date range.
    *   **Previous Period**: Projects from the equivalent prior time frame (for performance comparison).
    *   **All-Time**: All projects for the user (to calculate multi-year seasonal trends).
5.  **Processing**: The raw database results are processed in-memory using JavaScript logic to calculate totals, percentages, and growth rates.
6.  **Visualization**: The structured JSON is sent back to the frontend, where it is rendered using specialized components (Revenue charts, Client lists, etc.).

## 2. Core Data Points

The system extracts insights from the following fields in the `Project` model:

| Field | Usage in Analytics |
| :--- | :--- |
| `budget` | Primary source for **Total Revenue**, **Average Project Value**, and **Budget Analysis**. |
| `createdAt` | Determines the **Timeline** for revenue charts, seasonal peaks, and period comparisons. |
| `eventType` | Used to categorize projects into sectors (Weddings, Conferences, Gala, etc.). |
| `client` | Identifies **Top Clients**, **Returning Clients**, and agency market share. |
| `status` | Calculates the **Conversion Rate** (ratio of "Final" projects vs. Total). |

## 3. Calculation Logic

*   **Revenue Growth**: Calculated by comparing the total budget of the "Current Period" vs the "Previous Period".
*   **Seasonal Trends**: Groups all-time projects by their `createdAt` month to find peak business periods.
*   **Budget Categories**: Since project budgets are often high-level, the system applies a **Professional Estimation Model** (e.g., 35% Venue, 15% Furniture) to visualize a simulated budget breakdown.
*   **Conversion Rate**: specifically counts projects marked as **"Final"** as successful conversions.

## 4. Impact of Deleting Projects

Because the system calculates data **on-the-fly** from the database:

*   **Direct Impact**: Removing a project **immediately** removes its data from all analytics.
*   **Revenue Drop**: Total revenue and revenue charts will decrease by the amount of the deleted project's budget.
*   **Historical Change**: If you delete a project from last year, your "Previous Year" comparisons and growth rates will change instantly.
*   **Client Loss**: If you delete the only project for a specific client, that client will disappear from your "Client Insights" and "Top Clients" list.

**Note**: To keep analytics accurate, it is recommended to mark projects as "Archive" (if implemented) or keep them as "Draft" rather than deleting them, unless the project was created by mistake.
