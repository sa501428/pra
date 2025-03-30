# Platelet Bump Calculator - Technical Documentation

## Introduction

The Platelet Bump Calculator is a specialized tool designed to analyze the effectiveness of platelet transfusions by calculating the Corrected Count Increment (CCI) for multiple transfusions. This documentation provides detailed technical information for implementing the calculator.

## Core Concepts

### Platelet Transfusion Response
A successful platelet transfusion should result in an appropriate increase in the patient's platelet count. The effectiveness is measured using the CCI, which accounts for the patient's body surface area and the number of platelets transfused.

### Key Formulas

#### 1. Body Surface Area (BSA)
The Mosteller formula is used to calculate BSA:
BSA = square root of ((height × weight) / 3600)

Where:
- height is in centimeters
- weight is in kilograms
- BSA result is in square meters (m²)

#### 2. Corrected Count Increment (CCI)

CCI = ((post_count - pre_count) × 1000 × BSA) / platelet_units

Where:
- post_count: platelet count after transfusion (K/µL)
- pre_count: platelet count before transfusion (K/µL)
- BSA: body surface area (m²)
- platelet_units: number of platelets transfused (typically 3-4 x 10e11)
- CCI result is in platelets/µL


A CCI ≥ 7500 indicates an adequate response.




## Matching Algorithm

### Pre-Transfusion Count Criteria
- Must be within 36 hours before transfusion
- Closest count to transfusion time is selected

### Post-Transfusion Count Criteria
- Must be between 1 and 120 minutes after transfusion end time
- Closest count to ideal measurement time is selected

## Implementation Details

### Regular Expressions

## Data Input Format

### Transfusion Data
Expected format:
MM/DD/YY HHMM to HHMM

Example:
02/15/24 0800 to 0900

#### Transfusion Parser
javascript
/(\d{2}\/\d{2}\/\d{2})\s+\d{4}\s+to\s+(\d{4})/g

Capture groups:
1. Date (MM/DD/YY)
2. End time (HHMM)

### Platelet Count Format
The system accepts platelet counts in two formats:

### Platelet Count Data
Expected format:

MM/DD/YY HH:MM
PLT: XXX

or

MM/DD/YY HH:MM
Platelets: XXX

Example:

02/15/24 07:30
PLT: 12
02/15/24 10:15
Platelets: 35

javascript
/(\d{2}\/\d{2}\/\d{2})\s+(\d{2}):(\d{2})\n(?:PLT:|Platelets:)\s+(\d+)/g

Capture groups:
1. Date (MM/DD/YY)
2. Hours (HH)
3. Minutes (MM)
4. Count value

## Matching Algorithm

### Pre-Transfusion Count Selection
- Time window: 0-36 hours before transfusion
- Selection criteria: Closest count to transfusion start time
- Must occur before transfusion start

### Post-Transfusion Count Selection
- Time window: 1-120 minutes after transfusion end
- Selection criteria: Closest count to ideal measurement time
- Must occur after transfusion end

## Implementation Details


### Key Methods

#### calculateBSA(weight, height)
- Input validation: Both parameters must be positive numbers
- Returns: BSA in meters squared

#### calculateCCI(postCount, preCount, bsa, plateletUnit)
- Input validation: All parameters must be positive numbers
- Returns: CCI value

#### findClosestCount(targetDateTime, counts, hoursRange, isPreCount)
- targetDateTime: JavaScript Date object
- counts: Array of parsed count objects
- hoursRange: Number of hours to look for matches
- isPreCount: Boolean to determine pre/post count logic
- Returns: Closest matching count object or null

### Results Processing

#### Success Criteria
- CCI ≥ 7500: Adequate response
- CCI < 7500: Inadequate response

#### Output Format
1. Tabular results:
   - Transfusion date/time
   - Pre-count
   - Post-count
   - CCI
   - Visual indicators (green/red) for adequate/inadequate

2. Summary text:
   - Count of adequate/inadequate responses
   - Detailed list of each transfusion
   - Timing details
   - CCI values

## User Interface Components

### Required Input Fields
1. Patient metrics
   - Weight (kg)
   - Height (cm)

2. Default values
    - Platelet unit content (default: 3 x 10e11)
    - Min lookback time (default: 0 hours)
    - Max lookback time (default: 36 hours)
    - Min time after transfusion (default: 1 minute)
    - Max time after transfusion (default: 120 minutes)
    (all of these time default values can be overridden by the user, but should be in a dropdown menu or a modal overlay or a separate input slider field)

3. Data entry
   - Transfusions textarea
   - Platelet counts textarea

### Results Display
1. Results table
   - Transfusion date/time
   - Pre-transfusion count
   - Post-transfusion count
   - Calculated CCI
   - Color coding: green for adequate, red for inadequate responses

2. Summary text area
   - Count of adequate vs inadequate responses
   - Detailed list of each transfusion with:
     - Date/time
     - Pre-count
     - Post-count
     - Minutes after transfusion
     - CCI value

3. Plot
   - a scatter plot chart with date/time on the y axis 
   - Platelet Count on the x axis
   - point plotted for each platelet count
   - transfusions should have a dashed horizontal line plotted through the date/time of the transfusion
   - transfusions with appropriate bumps should be highlighted with a horizontal green rectangle in the background
   - transfusions with inappropriate bumps should be highlighted with a horizontal red rectangle in the background

## Error Handling

### Input Validation
- Numeric inputs must be positive
- Date/time formats must match expected patterns
- Missing data handled gracefully with '-' display

## Other Notes
- Results update on input change live
- should work with any standard browser
- client side only, no server side components required

The calculator provides two views of the results:

## Usage

1. Enter patient weight (kg) and height (cm)
2. Enter platelet unit content (default 3 × 10¹¹)
3. Paste transfusion data in the format specified above
4. Paste platelet count data in the format specified above
5. Results will update automatically (including if any of the inputs change)

