const sleep_path = "resources/data/student_sleep_patterns.csv";
const mental_health_path = "resources/data/mental_health_and_technology_usage_2024.csv";

let processedData;
let currentChart = "bar"; 
let currentDataset = "students"; 
let selectedGender = "All";
let selectedYear = "all";
let currentSort = { sortBy: "x", order: "asc" }; 

const variables = ["Sleep_Duration", "Study_Hours", "Screen_Time", "Caffeine_Intake", "Physical_Activity", "Sleep_Quality"];
const xSelect = document.getElementById("x-axis-select");
const ySelect = document.getElementById("y-axis-select");

// Populate dropdowns for X and Y axis
variables.forEach(variable => {
    let optionX = document.createElement("option");
    optionX.value = variable;
    optionX.textContent = variable.replace("_", " ");
    xSelect.appendChild(optionX);

    let optionY = document.createElement("option");
    optionY.value = variable;
    optionY.textContent = variable.replace("_", " ");
    ySelect.appendChild(optionY);
});

// Event listeners for selecting dataset
document.getElementById("students-dataset").addEventListener("click", () => {
    currentDataset = "students";
    loadData(sleep_path, "Students' Sleep Quality"); 
});

document.getElementById("not-students-dataset").addEventListener("click", () => {
    currentDataset = "not-students";
    loadData(mental_health_path, "Not Students' Data"); 
});

// FURTURA IMPLEMENTAÇÃO
document.getElementById("combined-dataset").addEventListener("click", () => {
    currentDataset = "combined";
    alert("Combined dataset feature coming soon!"); 
});

// Event listeners for selecting chart type
document.getElementById("bar-chart").addEventListener("click", () => {
    currentChart = "bar";
    updateControlsForCurrentChart();
    if (processedData) {
        applyCurrentFilters(); 
    }
});

document.getElementById("scatter-plot").addEventListener("click", () => {
    currentChart = "scatter";
    updateControlsForCurrentChart();
    if (processedData) {
        applyCurrentFilters(); 
    }
});

// Event listeners for axis changes
xSelect.addEventListener("change", () => {
    applyCurrentFilters();
});

ySelect.addEventListener("change", () => {
    applyCurrentFilters();
});

// Event listeners for filter changes
document.getElementById("filter-male").addEventListener("click", () => {
    selectedGender = "Male";
    applyCurrentFilters(); 
});

document.getElementById("filter-female").addEventListener("click", () => {
    selectedGender = "Female";
    applyCurrentFilters(); 
});

document.getElementById("filter-other").addEventListener("click", () => {
    selectedGender = "Other";
    applyCurrentFilters();
});

document.getElementById("filter-all").addEventListener("click", () => {
    selectedGender = "All";
    applyCurrentFilters(); 
});

document.getElementById("filter-year").addEventListener("change", function () {
    selectedYear = this.value;
    applyCurrentFilters(); 
});

// Event listeners for sorting (only for bar chart)
document.getElementById("sort-x-asc").addEventListener("click", () => {
    currentSort = { sortBy: "x", order: "asc" };
    applyCurrentFilters(); 
});

document.getElementById("sort-x-desc").addEventListener("click", () => {
    currentSort = { sortBy: "x", order: "desc" };
    applyCurrentFilters(); 
});

/* document.getElementById("sort-y-asc").addEventListener("click", () => {
    currentSort = { sortBy: "y", order: "asc" };
    applyCurrentFilters(); 
});

document.getElementById("sort-y-desc").addEventListener("click", () => {
    currentSort = { sortBy: "y", order: "desc" };
    applyCurrentFilters(); 
}); */

// Function to apply filters and update the chart
function applyCurrentFilters() {
    if (!processedData) return;

    let filteredData = processedData;

    // Filter by Gender
    if (selectedGender !== "All") {
        filteredData = filteredData.filter(d => d.Gender === selectedGender);
    }

    // Filter by Year
    if (selectedYear !== "all") {
        filteredData = filteredData.filter(d => d.University_Year === selectedYear);
    }

    const xValue = xSelect.value;
    const yValue = ySelect.value;

    // // Prevent selecting the same value for X and Y axes
    // if (xValue === yValue) {
    //     alert("Please select different variables for X and Y axes.");
    //     return;
    // }

    // Apply sorting and update chart for each chart type
    if (currentChart === "bar") {
        const sortedData = sortData(filteredData, currentSort.sortBy, currentSort.order);
        drawBarChart(sortedData); 
    } else if (currentChart === "scatter") {
        drawScatterPlot(processedData, currentXAxis, currentYAxis); 
    }
}

// Function to load and process the data
function loadData(path, title) {
    d3.csv(path)
        .then(data => {
            processedData = processDataset(data);
            console.log("Processed Data:", processedData);
            document.getElementById("page-title").textContent = title;
            applyCurrentFilters();
    }).catch(error => console.error("Error loading the CSV file:", error));
}

// Function to update controls based on current chart type
function updateControlsForCurrentChart() {
    const axisControls = document.getElementById("axis-controls");
    const sortControls = document.getElementById("sort-controls");

    /* const yearFilter = document.getElementById("filter-year");
    const yearFilterLabel = document.getElementById("filter-year-label"); */

    /* if (currentChart === "bar") {
        axisControls.style.display = "none"; // Bar chart does not need axis selectors
        sortControls.style.display = "block";
        yearFilter.style.display = "block";
        yearFilterLabel.style.display = "block";
    } else if (currentChart === "scatter") {
        axisControls.style.display = "block";
        sortControls.style.display = "none"; // Sorting is not applicable to scatter plot
        yearFilter.style.display = "none";
        yearFilterLabel.style.display = "none";
    } */

    if (currentChart === "bar") {
        axisControls.style.display = "block"; // Show axis controls
        sortControls.style.display = "block"; // Show sorting options
    } else if (currentChart === "scatter") {
        axisControls.style.display = "block"; // Show axis controls
        sortControls.style.display = "none"; // Hide sorting options
    }
}

// Function to process the dataset
function processDataset(data) {
    return data.map(d => ({
        Student_ID: +d.Student_ID,
        Age: +d.Age,
        Gender: d.Gender,
        University_Year: d.University_Year,
        Sleep_Duration: +d.Sleep_Duration,
        Study_Hours: +d.Study_Hours,
        Screen_Time: +d.Screen_Time,
        Caffeine_Intake: +d.Caffeine_Intake,
        Physical_Activity: +d.Physical_Activity,
        Sleep_Quality: +d.Sleep_Quality,
        Weekday_Sleep_Start: +d.Weekday_Sleep_Start,
        Weekend_Sleep_Start: +d.Weekend_Sleep_Start,
        Weekday_Sleep_End: +d.Weekday_Sleep_End,
        Weekend_Sleep_End: +d.Weekend_Sleep_End
    }));
}

// Initialize with the default dataset
loadData(sleep_path, "Students' Sleep Quality");
